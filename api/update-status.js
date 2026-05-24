import { kv } from '@vercel/kv'
import { verifyAdmin } from './_auth.js'

const VALID_STATUSES = [
  'pending',
  'generating',
  'complete',
  'error',
  'contacted',
  'converted',
]

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
  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const admin = await verifyAdmin(req)
  if (!admin) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { id, status, notes } = req.body || {}

  if (!id) {
    return res.status(400).json({ error: 'Missing required field: id' })
  }

  if (status && !VALID_STATUSES.includes(status)) {
    return res
      .status(400)
      .json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` })
  }

  try {
    const raw = await kv.get(`audit:${id}`)
    if (!raw) {
      return res.status(404).json({ error: 'Audit not found' })
    }

    const audit = typeof raw === 'string' ? JSON.parse(raw) : raw

    if (status) audit.status = status
    if (typeof notes === 'string') audit.notes = notes

    await kv.set(`audit:${id}`, JSON.stringify(audit))

    return res.status(200).json(audit)
  } catch (err) {
    console.error('[update-status] Error:', err.message)
    return res.status(500).json({ error: 'Failed to update audit' })
  }
}
