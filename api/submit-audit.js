import { kv } from '@vercel/kv'
import Anthropic from '@anthropic-ai/sdk'
import sgMail from '@sendgrid/mail'
import twilio from 'twilio'
import { randomUUID } from 'crypto'

const REQUIRED_FIELDS = [
  'businessName',
  'ownerName',
  'email',
  'industry',
  'employeeCount',
  'currentChallenges',
  'goals',
]

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, x-admin-secret'
  )
}

function buildClaudePrompt(data) {
  return `You are generating an AI readiness audit for a business. Based on the information below, produce a thorough, actionable audit report.

Business Information:
- Business Name: ${data.businessName}
- Owner Name: ${data.ownerName}
- Industry: ${data.industry}
- Employee Count: ${data.employeeCount}
- Annual Revenue: ${data.annualRevenue || 'Not specified'}
- Current Challenges: ${data.currentChallenges}
- Current Tools/Software: ${data.currentTools || 'Not specified'}
- Goals: ${data.goals}

Return ONLY a valid JSON object matching EXACTLY this schema (no markdown, no extra text, no code fences):

{
  "executiveSummary": "2-3 paragraph executive summary of the business's AI readiness and top opportunities",
  "aiReadinessScore": <integer 0-100>,
  "scoreBreakdown": {
    "dataMaturity": <integer 0-100>,
    "processMaturity": <integer 0-100>,
    "teamReadiness": <integer 0-100>,
    "technicalInfrastructure": <integer 0-100>
  },
  "opportunities": [
    {
      "title": "opportunity title",
      "description": "detailed description of the opportunity",
      "impact": "High|Medium|Low",
      "effort": "High|Medium|Low",
      "estimatedROI": "e.g. 20-30% cost reduction over 12 months"
    }
  ],
  "quickWins": [
    {
      "title": "quick win title",
      "description": "what to do and why",
      "timeToImplement": "e.g. 2-4 weeks",
      "estimatedSavings": "e.g. 5 hours/week saved"
    }
  ],
  "roadmap": [
    {
      "phase": "Phase 1",
      "title": "phase title",
      "duration": "e.g. 1-3 months",
      "description": "what happens in this phase",
      "keyMilestones": ["milestone 1", "milestone 2"]
    }
  ],
  "riskFactors": [
    "risk factor description 1",
    "risk factor description 2"
  ],
  "recommendedNextStep": "A single, specific recommended action the business should take within the next 30 days"
}

Requirements:
- aiReadinessScore must be the weighted average of the four scoreBreakdown values
- Include at least 3 opportunities, 3 quick wins, and 3 roadmap phases
- Be specific to the industry and challenges described
- Keep descriptions actionable and jargon-free`
}

async function generateAuditReport(data) {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const msg = await anthropic.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 4096,
    system:
      'You are an expert AI business consultant generating comprehensive AI readiness audits for businesses. Return ONLY valid JSON matching the exact schema provided — no markdown, no extra text.',
    messages: [{ role: 'user', content: buildClaudePrompt(data) }],
  })

  const content = msg.content[0].text.trim()

  // Strip any accidental markdown fences
  const jsonStr = content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
  return JSON.parse(jsonStr)
}

async function sendReportEmail(audit) {
  if (!process.env.SENDGRID_API_KEY) return

  sgMail.setApiKey(process.env.SENDGRID_API_KEY)

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
        <td style="padding:10px;border-bottom:1px solid #e5e7eb;"><strong>${o.title}</strong><br><span style="color:#6b7280;font-size:14px;">${o.description}</span></td>
        <td style="padding:10px;border-bottom:1px solid #e5e7eb;text-align:center;"><span style="background:${o.impact === 'High' ? '#dcfce7' : o.impact === 'Medium' ? '#fef9c3' : '#fee2e2'};color:${o.impact === 'High' ? '#166534' : o.impact === 'Medium' ? '#854d0e' : '#991b1b'};padding:2px 8px;border-radius:12px;font-size:13px;">${o.impact}</span></td>
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
        <div style="flex-shrink:0;width:40px;height:40px;background:#6366f1;color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;">${i + 1}</div>
        <div>
          <strong style="color:#111827;">${p.phase}: ${p.title}</strong>
          <span style="color:#6b7280;font-size:13px;margin-left:8px;">(${p.duration})</span>
          <p style="color:#4b5563;font-size:14px;margin:6px 0 4px;">${p.description}</p>
          <ul style="margin:0;padding-left:18px;color:#6b7280;font-size:13px;">${p.keyMilestones.map((m) => `<li>${m}</li>`).join('')}</ul>
        </div>
      </div>`
    )
    .join('')

  const html = `
<!DOCTYPE html>
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
      <div style="display:inline-block;background:${scoreColor};color:#fff;width:80px;height:80px;border-radius:50%;line-height:80px;font-size:32px;font-weight:700;margin-bottom:12px;">${r.aiReadinessScore}</div>
      <h2 style="margin:0 0 8px;color:#111827;">AI Readiness Score</h2>
      <div style="display:flex;justify-content:center;gap:24px;flex-wrap:wrap;margin-top:16px;">
        ${Object.entries(r.scoreBreakdown)
          .map(
            ([k, v]) =>
              `<div style="text-align:center;"><div style="font-size:22px;font-weight:700;color:#6366f1;">${v}</div><div style="font-size:12px;color:#6b7280;text-transform:capitalize;">${k.replace(/([A-Z])/g, ' $1').trim()}</div></div>`
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

      ${
        r.riskFactors && r.riskFactors.length
          ? `<h2 style="color:#111827;border-bottom:2px solid #e5e7eb;padding-bottom:8px;margin-top:32px;">Risk Factors to Monitor</h2>
             <ul style="color:#4b5563;line-height:1.8;">${r.riskFactors.map((rf) => `<li>${rf}</li>`).join('')}</ul>`
          : ''
      }

      <!-- CTA -->
      <div style="background:linear-gradient(135deg,#ede9fe,#ddd6fe);border-radius:12px;padding:28px;margin-top:32px;text-align:center;">
        <h3 style="margin:0 0 8px;color:#5b21b6;">Recommended Next Step</h3>
        <p style="color:#4c1d95;margin:0 0 20px;font-size:15px;">${r.recommendedNextStep}</p>
        <a href="${process.env.SITE_URL || '#'}" style="background:#6366f1;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">Schedule a Free Consultation</a>
      </div>
    </div>

    <!-- Footer -->
    <div style="padding:24px 40px;background:#f9fafb;border-top:1px solid #e5e7eb;text-align:center;color:#9ca3af;font-size:13px;">
      <p style="margin:0;">This audit was generated by ${process.env.FROM_NAME || 'AI Business Audits'}.</p>
      <p style="margin:6px 0 0;">Reply to this email or call us to discuss your results.</p>
    </div>
  </div>
</body>
</html>`

  await sgMail.send({
    to: audit.email,
    from: {
      email: process.env.FROM_EMAIL,
      name: process.env.FROM_NAME || 'AI Business Audits',
    },
    subject: `Your AI Readiness Audit for ${audit.businessName} — Score: ${r.aiReadinessScore}/100`,
    html,
  })
}

async function sendAdminSms(audit) {
  if (
    !process.env.TWILIO_ACCOUNT_SID ||
    !process.env.TWILIO_AUTH_TOKEN ||
    !process.env.ADMIN_PHONE_NUMBER
  )
    return

  const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  )

  const score = audit.report?.aiReadinessScore ?? 'N/A'
  const body =
    `New AI Audit Lead!\n` +
    `Business: ${audit.businessName}\n` +
    `Owner: ${audit.ownerName}\n` +
    `Email: ${audit.email}\n` +
    `Industry: ${audit.industry}\n` +
    `AI Score: ${score}/100\n` +
    `View: ${process.env.SITE_URL || ''}/admin`

  await client.messages.create({
    body,
    from: process.env.TWILIO_FROM_NUMBER,
    to: process.env.ADMIN_PHONE_NUMBER,
  })
}

export default async function handler(req, res) {
  setCorsHeaders(res)
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Validate required fields
  const body = req.body || {}
  const missing = REQUIRED_FIELDS.filter((f) => !body[f]?.toString().trim())
  if (missing.length) {
    return res
      .status(400)
      .json({ error: `Missing required fields: ${missing.join(', ')}` })
  }

  // Basic email validation
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
    return res.status(400).json({ error: 'Invalid email address' })
  }

  const id = randomUUID()
  const now = new Date().toISOString()

  const audit = {
    id,
    createdAt: now,
    status: 'generating',
    businessName: body.businessName.trim(),
    ownerName: body.ownerName.trim(),
    email: body.email.trim().toLowerCase(),
    phone: (body.phone || '').trim(),
    industry: body.industry.trim(),
    employeeCount: body.employeeCount.trim(),
    annualRevenue: (body.annualRevenue || '').trim(),
    currentChallenges: body.currentChallenges.trim(),
    currentTools: (body.currentTools || '').trim(),
    goals: body.goals.trim(),
    report: null,
    emailSent: false,
    smsSent: false,
    followUpCount: 0,
    lastFollowUp: null,
    notes: '',
    inboundMessages: [],
  }

  // Store initial record
  await kv.set(`audit:${id}`, JSON.stringify(audit))
  await kv.zadd('audits:by-date', { score: Date.now(), member: id })

  // Maintain phone→id index for Twilio webhook lookups
  if (audit.phone) {
    await kv.set(`phone:${audit.phone}`, id)
  }

  // Generate report inline
  try {
    const report = await generateAuditReport(audit)
    audit.report = report
    audit.status = 'complete'
  } catch (err) {
    console.error('[submit-audit] Claude error:', err.message)
    audit.status = 'error'
    await kv.set(`audit:${id}`, JSON.stringify(audit))
    return res.status(500).json({ error: 'Failed to generate audit report', audit })
  }

  await kv.set(`audit:${id}`, JSON.stringify(audit))

  // Send email (non-fatal)
  try {
    await sendReportEmail(audit)
    audit.emailSent = true
  } catch (err) {
    console.error('[submit-audit] SendGrid error:', err.message)
  }

  // Send admin SMS (non-fatal)
  try {
    await sendAdminSms(audit)
    audit.smsSent = true
  } catch (err) {
    console.error('[submit-audit] Twilio error:', err.message)
  }

  // Persist final state
  await kv.set(`audit:${id}`, JSON.stringify(audit))

  return res.status(200).json(audit)
}
