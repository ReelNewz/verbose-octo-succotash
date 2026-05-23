import { kv } from '@vercel/kv'
import sgMail from '@sendgrid/mail'

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000
const MAX_FOLLOW_UPS = 3

function buildFollowUpHtml(audit) {
  const r = audit.report
  const siteUrl = process.env.SITE_URL || '#'
  const score = r?.aiReadinessScore ?? 'N/A'
  const topOpportunity = r?.opportunities?.[0]
  const nextStep = r?.recommendedNextStep || ''

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:'Segoe UI',Arial,sans-serif;background:#f3f4f6;margin:0;padding:0;">
  <div style="max-width:600px;margin:32px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.07);">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px 40px;color:#fff;">
      <h1 style="margin:0 0 8px;font-size:22px;">Following Up on Your AI Audit</h1>
      <p style="margin:0;opacity:0.9;font-size:15px;">Hi ${audit.ownerName}, we wanted to check in.</p>
    </div>

    <div style="padding:32px 40px;">

      <p style="color:#4b5563;line-height:1.7;font-size:15px;">
        A little while ago, we generated your AI Readiness Audit for <strong>${audit.businessName}</strong>.
        Your score was <strong style="color:#6366f1;">${score}/100</strong>.
      </p>

      <p style="color:#4b5563;line-height:1.7;font-size:15px;">
        We've helped businesses in the ${audit.industry} sector unlock significant efficiency gains
        and revenue growth through targeted AI implementation — and we'd love to do the same for you.
      </p>

      ${
        topOpportunity
          ? `<div style="background:#f9fafb;border-left:4px solid #6366f1;padding:16px 20px;border-radius:0 8px 8px 0;margin:24px 0;">
               <strong style="color:#111827;">Your top opportunity: ${topOpportunity.title}</strong>
               <p style="color:#4b5563;font-size:14px;margin:8px 0 0;">${topOpportunity.description}</p>
               <span style="font-size:13px;color:#6b7280;">Estimated ROI: ${topOpportunity.estimatedROI}</span>
             </div>`
          : ''
      }

      ${
        nextStep
          ? `<p style="color:#4b5563;line-height:1.7;font-size:15px;">
               <strong>Recommended next step:</strong> ${nextStep}
             </p>`
          : ''
      }

      <p style="color:#4b5563;line-height:1.7;font-size:15px;">
        We're offering a <strong>free 30-minute strategy call</strong> to walk you through your audit
        results and map out exactly how AI can make an impact for your business.
      </p>

      <!-- CTA -->
      <div style="text-align:center;margin:32px 0;">
        <a href="${siteUrl}"
           style="background:#6366f1;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px;display:inline-block;">
          Book Your Free Strategy Call
        </a>
      </div>

      <p style="color:#9ca3af;font-size:13px;line-height:1.6;">
        If now isn't the right time, no problem at all — we'll follow up once more.
        If you'd prefer not to hear from us, simply reply with "unsubscribe" and we'll remove you immediately.
      </p>
    </div>

    <!-- Footer -->
    <div style="padding:20px 40px;background:#f9fafb;border-top:1px solid #e5e7eb;text-align:center;color:#9ca3af;font-size:13px;">
      <p style="margin:0;">${process.env.FROM_NAME || 'AI Business Audits'}</p>
      <p style="margin:4px 0 0;">Reply to this email with any questions.</p>
    </div>
  </div>
</body>
</html>`
}

export default async function handler(req, res) {
  // Vercel crons send GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!process.env.SENDGRID_API_KEY) {
    console.warn('[cron-follow-up] SendGrid not configured — skipping')
    return res.status(200).json({ processed: 0, skipped: 'SendGrid not configured' })
  }

  sgMail.setApiKey(process.env.SENDGRID_API_KEY)

  let processed = 0
  let errors = 0

  try {
    const ids = await kv.zrevrange('audits:by-date', 0, -1)

    if (!ids || ids.length === 0) {
      return res.status(200).json({ processed: 0 })
    }

    // Fetch all audits
    let audits = []
    try {
      const pipeline = kv.pipeline()
      for (const id of ids) {
        pipeline.get(`audit:${id}`)
      }
      const results = await pipeline.exec()
      audits = results
        .map((raw) => (raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : null))
        .filter(Boolean)
    } catch {
      audits = (
        await Promise.all(
          ids.map(async (id) => {
            try {
              const raw = await kv.get(`audit:${id}`)
              return raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : null
            } catch {
              return null
            }
          })
        )
      ).filter(Boolean)
    }

    const now = Date.now()

    // Find eligible audits for follow-up
    const eligible = audits.filter((audit) => {
      if (audit.status !== 'complete') return false
      if ((audit.followUpCount || 0) >= MAX_FOLLOW_UPS) return false

      if (!audit.lastFollowUp) return true

      const lastFollowUpMs = new Date(audit.lastFollowUp).getTime()
      return now - lastFollowUpMs >= THREE_DAYS_MS
    })

    console.log(`[cron-follow-up] Found ${eligible.length} eligible audits out of ${audits.length}`)

    for (const audit of eligible) {
      try {
        const html = buildFollowUpHtml(audit)

        const followUpNum = (audit.followUpCount || 0) + 1
        const subjects = [
          `Quick follow-up on your AI Readiness Audit — ${audit.businessName}`,
          `Have you had a chance to review your AI audit results?`,
          `Last thoughts on your AI opportunities at ${audit.businessName}`,
        ]
        const subject = subjects[Math.min(followUpNum - 1, subjects.length - 1)]

        await sgMail.send({
          to: audit.email,
          from: {
            email: process.env.FROM_EMAIL,
            name: process.env.FROM_NAME || 'AI Business Audits',
          },
          subject,
          html,
        })

        // Update follow-up tracking
        audit.followUpCount = followUpNum
        audit.lastFollowUp = new Date().toISOString()
        await kv.set(`audit:${audit.id}`, JSON.stringify(audit))

        processed++
        console.log(`[cron-follow-up] Sent follow-up #${followUpNum} to ${audit.email} (${audit.businessName})`)
      } catch (err) {
        errors++
        console.error(`[cron-follow-up] Failed for audit ${audit.id}:`, err.message)
      }
    }

    return res.status(200).json({
      processed,
      errors,
      eligible: eligible.length,
      total: audits.length,
    })
  } catch (err) {
    console.error('[cron-follow-up] Fatal error:', err.message)
    return res.status(500).json({ error: 'Cron job failed', details: err.message })
  }
}
