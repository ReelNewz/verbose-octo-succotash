import { kv } from '@vercel/kv'
import twilio from 'twilio'
import { verifyAdmin } from './_auth.js'

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-secret')
}

export default async function handler(req, res) {
  setCorsHeaders(res)
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // This endpoint is intended for internal/admin use
  const admin = await verifyAdmin(req)
  if (!admin) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { id } = req.body || {}
  if (!id) {
    return res.status(400).json({ error: 'Missing required field: id' })
  }

  if (
    !process.env.TWILIO_ACCOUNT_SID ||
    !process.env.TWILIO_AUTH_TOKEN ||
    !process.env.TWILIO_FROM_NUMBER ||
    !process.env.ADMIN_PHONE_NUMBER
  ) {
    return res.status(500).json({ error: 'Twilio not configured' })
  }

  try {
    const raw = await kv.get(`audit:${id}`)
    if (!raw) {
      return res.status(404).json({ error: 'Audit not found' })
    }

    const audit = typeof raw === 'string' ? JSON.parse(raw) : raw

    const score = audit.report?.aiReadinessScore ?? 'N/A'
    const siteUrl = process.env.SITE_URL || ''

    const body =
      `New AI Audit Lead!\n` +
      `Business: ${audit.businessName}\n` +
      `Owner: ${audit.ownerName}\n` +
      `Email: ${audit.email}\n` +
      `Industry: ${audit.industry}\n` +
      `AI Score: ${score}/100\n` +
      (siteUrl ? `View: ${siteUrl}/admin` : '')

    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)

    await client.messages.create({
      body: body.trim(),
      from: process.env.TWILIO_FROM_NUMBER,
      to: process.env.ADMIN_PHONE_NUMBER,
    })

    audit.smsSent = true
    await kv.set(`audit:${id}`, JSON.stringify(audit))

    return res.status(200).json({ success: true, smsSent: true })
  } catch (err) {
    console.error('[send-admin-sms] Error:', err.message)
    return res.status(500).json({ error: 'Failed to send SMS', details: err.message })
  }
}
