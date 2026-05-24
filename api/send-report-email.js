import { kv } from '@vercel/kv'
import sgMail from '@sendgrid/mail'
import { verifyAdmin } from './_auth.js'

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-secret')
}

function buildReportHtml(audit) {
  const r = audit.report
  const scoreColor =
    r.aiReadinessScore >= 70
      ? '#22c55e'
      : r.aiReadinessScore >= 50
      ? '#f59e0b'
      : '#ef4444'

  const opportunitiesHtml = r.opportunities
    .map(
      (o) => `
      <tr>
        <td style="padding:10px;border-bottom:1px solid #e5e7eb;">
          <strong>${o.title}</strong><br>
          <span style="color:#6b7280;font-size:14px;">${o.description}</span>
        </td>
        <td style="padding:10px;border-bottom:1px solid #e5e7eb;text-align:center;">
          <span style="background:${o.impact === 'High' ? '#dcfce7' : o.impact === 'Medium' ? '#fef9c3' : '#fee2e2'};
                       color:${o.impact === 'High' ? '#166534' : o.impact === 'Medium' ? '#854d0e' : '#991b1b'};
                       padding:2px 8px;border-radius:12px;font-size:13px;">${o.impact}</span>
        </td>
        <td style="padding:10px;border-bottom:1px solid #e5e7eb;text-align:center;font-size:14px;">${o.estimatedROI}</td>
      </tr>`
    )
    .join('')

  const quickWinsHtml = r.quickWins
    .map(
      (q) => `
      <div style="background:#f9fafb;border-left:4px solid #6366f1;padding:14px 16px;margin-bottom:12px;border-radius:0 8px 8px 0;">
        <strong style="color:#111827;">${q.title}</strong>
        <p style="color:#4b5563;font-size:14px;margin:6px 0 4px;">${q.description}</p>
        <span style="font-size:13px;color:#6b7280;">⏱ ${q.timeToImplement} &nbsp;|&nbsp; 💰 ${q.estimatedSavings}</span>
      </div>`
    )
    .join('')

  const roadmapHtml = r.roadmap
    .map(
      (p, i) => `
      <div style="display:flex;gap:16px;margin-bottom:20px;">
        <div style="flex-shrink:0;width:40px;height:40px;background:#6366f1;color:#fff;border-radius:50%;
                    display:flex;align-items:center;justify-content:center;font-weight:700;font-size:18px;
                    line-height:40px;text-align:center;">${i + 1}</div>
        <div>
          <strong style="color:#111827;">${p.phase}: ${p.title}</strong>
          <span style="color:#6b7280;font-size:13px;margin-left:8px;">(${p.duration})</span>
          <p style="color:#4b5563;font-size:14px;margin:6px 0 4px;">${p.description}</p>
          <ul style="margin:0;padding-left:18px;color:#6b7280;font-size:13px;">
            ${(p.keyMilestones || []).map((m) => `<li>${m}</li>`).join('')}
          </ul>
        </div>
      </div>`
    )
    .join('')

  const riskHtml =
    r.riskFactors && r.riskFactors.length
      ? `<h2 style="color:#111827;border-bottom:2px solid #e5e7eb;padding-bottom:8px;margin-top:32px;">Risk Factors to Monitor</h2>
         <ul style="color:#4b5563;line-height:1.8;">${r.riskFactors.map((rf) => `<li>${rf}</li>`).join('')}</ul>`
      : ''

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:'Segoe UI',Arial,sans-serif;background:#f3f4f6;margin:0;padding:0;">
  <div style="max-width:680px;margin:32px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.07);">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:40px 40px 32px;color:#fff;">
      <h1 style="margin:0 0 8px;font-size:26px;">Your AI Readiness Audit</h1>
      <p style="margin:0;opacity:0.9;font-size:16px;">${audit.businessName} &mdash; Prepared for ${audit.ownerName}</p>
    </div>

    <!-- Score -->
    <div style="padding:32px 40px;background:#fafaff;border-bottom:1px solid #e5e7eb;text-align:center;">
      <div style="display:inline-block;background:${scoreColor};color:#fff;width:80px;height:80px;border-radius:50%;
                  line-height:80px;font-size:32px;font-weight:700;margin-bottom:12px;">${r.aiReadinessScore}</div>
      <h2 style="margin:0 0 8px;color:#111827;">AI Readiness Score</h2>
      <div style="display:flex;justify-content:center;gap:24px;flex-wrap:wrap;margin-top:16px;">
        ${Object.entries(r.scoreBreakdown)
          .map(
            ([k, v]) =>
              `<div style="text-align:center;">
                 <div style="font-size:22px;font-weight:700;color:#6366f1;">${v}</div>
                 <div style="font-size:12px;color:#6b7280;text-transform:capitalize;">${k.replace(/([A-Z])/g, ' $1').trim()}</div>
               </div>`
          )
          .join('')}
      </div>
    </div>

    <!-- Body -->
    <div style="padding:32px 40px;">
      <h2 style="color:#111827;border-bottom:2px solid #e5e7eb;padding-bottom:8px;">Executive Summary</h2>
      <p style="color:#4b5563;line-height:1.7;">${r.executiveSummary.replace(/\n/g, '<br>')}</p>

      <h2 style="color:#111827;border-bottom:2px solid #e5e7eb;padding-bottom:8px;margin-top:32px;">Top AI Opportunities</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <thead>
          <tr style="background:#f9fafb;">
            <th style="padding:10px;text-align:left;border-bottom:2px solid #e5e7eb;">Opportunity</th>
            <th style="padding:10px;text-align:center;border-bottom:2px solid #e5e7eb;">Impact</th>
            <th style="padding:10px;text-align:center;border-bottom:2px solid #e5e7eb;">Estimated ROI</th>
          </tr>
        </thead>
        <tbody>${opportunitiesHtml}</tbody>
      </table>

      <h2 style="color:#111827;border-bottom:2px solid #e5e7eb;padding-bottom:8px;margin-top:32px;">Quick Wins (Start Here)</h2>
      ${quickWinsHtml}

      <h2 style="color:#111827;border-bottom:2px solid #e5e7eb;padding-bottom:8px;margin-top:32px;">Implementation Roadmap</h2>
      ${roadmapHtml}

      ${riskHtml}

      <!-- CTA -->
      <div style="background:linear-gradient(135deg,#ede9fe,#ddd6fe);border-radius:12px;padding:28px;margin-top:32px;text-align:center;">
        <h3 style="margin:0 0 8px;color:#5b21b6;">Recommended Next Step</h3>
        <p style="color:#4c1d95;margin:0 0 20px;font-size:15px;">${r.recommendedNextStep}</p>
        <a href="${process.env.SITE_URL || '#'}"
           style="background:#6366f1;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">
          Schedule a Free Consultation
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="padding:24px 40px;background:#f9fafb;border-top:1px solid #e5e7eb;text-align:center;color:#9ca3af;font-size:13px;">
      <p style="margin:0;">This audit was generated by ${process.env.FROM_NAME || 'AI Business Audits'}.</p>
      <p style="margin:6px 0 0;">Reply to this email or visit our site to discuss your results.</p>
    </div>
  </div>
</body>
</html>`
}

export default async function handler(req, res) {
  setCorsHeaders(res)
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const admin = await verifyAdmin(req)
  if (!admin) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { id } = req.body || {}
  if (!id) {
    return res.status(400).json({ error: 'Missing required field: id' })
  }

  if (!process.env.SENDGRID_API_KEY) {
    return res.status(500).json({ error: 'SendGrid not configured' })
  }

  try {
    const raw = await kv.get(`audit:${id}`)
    if (!raw) {
      return res.status(404).json({ error: 'Audit not found' })
    }

    const audit = typeof raw === 'string' ? JSON.parse(raw) : raw

    if (!audit.report) {
      return res.status(400).json({ error: 'Audit report not yet generated' })
    }

    sgMail.setApiKey(process.env.SENDGRID_API_KEY)

    const html = buildReportHtml(audit)

    await sgMail.send({
      to: audit.email,
      from: {
        email: process.env.FROM_EMAIL,
        name: process.env.FROM_NAME || 'AI Business Audits',
      },
      subject: `Your AI Readiness Audit for ${audit.businessName} — Score: ${audit.report.aiReadinessScore}/100`,
      html,
    })

    audit.emailSent = true
    await kv.set(`audit:${id}`, JSON.stringify(audit))

    return res.status(200).json({ success: true, emailSent: true })
  } catch (err) {
    console.error('[send-report-email] Error:', err.message)
    return res.status(500).json({ error: 'Failed to send email', details: err.message })
  }
}
