import { kv } from '@vercel/kv'

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, x-admin-secret'
  )
}

export default async function handler(req, res) {
  setCorsHeaders(res)
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { id } = req.query
  if (!id) {
    return res.status(400).json({ error: 'Missing required query param: id' })
  }

  try {
    const raw = await kv.get(`audit:${id}`)
    if (!raw) {
      return res.status(404).json({ error: 'Audit not found' })
    }

    const audit = typeof raw === 'string' ? JSON.parse(raw) : raw

    // Strip inboundMessages for public access
    const { inboundMessages, ...publicAudit } = audit

    return res.status(200).json(publicAudit)
  } catch (err) {
    console.error('[get-audit] Error:', err.message)
    return res.status(500).json({ error: 'Failed to fetch audit' })
  }
}
