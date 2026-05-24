import { kv } from '@vercel/kv'

/**
 * Twilio inbound SMS webhook.
 * Twilio sends form-encoded POST bodies, so we need to parse them.
 * Vercel serverless functions do NOT auto-parse form bodies — we handle it manually.
 */

function parseFormBody(rawBody) {
  const params = {}
  if (!rawBody) return params
  const pairs = rawBody.split('&')
  for (const pair of pairs) {
    const idx = pair.indexOf('=')
    if (idx === -1) continue
    const key = decodeURIComponent(pair.slice(0, idx).replace(/\+/g, ' '))
    const val = decodeURIComponent(pair.slice(idx + 1).replace(/\+/g, ' '))
    params[key] = val
  }
  return params
}

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', (chunk) => {
      data += chunk
    })
    req.on('end', () => resolve(data))
    req.on('error', reject)
  })
}

export default async function handler(req, res) {
  // Twilio webhooks are always POST
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed')
  }

  let body = {}

  // Vercel may or may not have parsed the body already
  if (req.body && typeof req.body === 'object' && Object.keys(req.body).length > 0) {
    body = req.body
  } else {
    try {
      const rawBody = await getRawBody(req)
      const contentType = req.headers['content-type'] || ''
      if (contentType.includes('application/json')) {
        body = JSON.parse(rawBody)
      } else {
        body = parseFormBody(rawBody)
      }
    } catch (err) {
      console.error('[twilio-webhook] Failed to parse body:', err.message)
    }
  }

  const fromNumber = body.From || ''
  const messageBody = body.Body || ''
  const messageSid = body.MessageSid || ''

  console.log(`[twilio-webhook] Inbound SMS from ${fromNumber}: ${messageBody}`)

  if (!fromNumber) {
    // Return valid TwiML even on error
    res.setHeader('Content-Type', 'text/xml')
    return res.status(200).send(
      `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`
    )
  }

  try {
    // Look up audit by phone number using the phone→id index
    let auditId = await kv.get(`phone:${fromNumber}`)

    // Fallback: normalize number formats (e.g. +1 prefix)
    if (!auditId && fromNumber.startsWith('+1') && fromNumber.length === 12) {
      auditId = await kv.get(`phone:${fromNumber.slice(2)}`) // try without country code
    }
    if (!auditId && !fromNumber.startsWith('+')) {
      auditId = await kv.get(`phone:+1${fromNumber}`) // try with country code
    }

    if (auditId) {
      const raw = await kv.get(`audit:${auditId}`)
      if (raw) {
        const audit = typeof raw === 'string' ? JSON.parse(raw) : raw

        if (!Array.isArray(audit.inboundMessages)) {
          audit.inboundMessages = []
        }

        audit.inboundMessages.push({
          sid: messageSid,
          from: fromNumber,
          body: messageBody,
          receivedAt: new Date().toISOString(),
        })

        await kv.set(`audit:${auditId}`, JSON.stringify(audit))
        console.log(`[twilio-webhook] Appended message to audit ${auditId}`)
      }
    } else {
      // No matching audit — store as orphaned message for admin review
      const orphanKey = `orphan-sms:${fromNumber}:${Date.now()}`
      await kv.set(
        orphanKey,
        JSON.stringify({
          from: fromNumber,
          body: messageBody,
          sid: messageSid,
          receivedAt: new Date().toISOString(),
        }),
        { ex: 30 * 24 * 60 * 60 } // expire after 30 days
      )
      console.log(`[twilio-webhook] No matching audit for ${fromNumber}, stored as orphan`)
    }
  } catch (err) {
    console.error('[twilio-webhook] KV error:', err.message)
    // Don't return an error to Twilio — still respond with valid TwiML
  }

  // Always respond with TwiML
  res.setHeader('Content-Type', 'text/xml')
  return res.status(200).send(
    `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>Thanks! Our team will follow up shortly.</Message>
</Response>`
  )
}
