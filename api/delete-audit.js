import { kv } from '@vercel/kv'
import { verifyAdmin } from './_auth.js'

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-secret')
}

export default async function handler(req, res) {
  setCorsHeaders(res)
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const admin = await verifyAdmin(req)
  if (!admin) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { id } = req.query
  if (!id) {
    return res.status(400).json({ error: 'Missing required query param: id' })
  }

  try {
    // Verify the audit exists before deleting
    const raw = await kv.get(`audit:${id}`)
    if (!raw) {
      return res.status(404).json({ error: 'Audit not found' })
    }

    const audit = typeof raw === 'string' ? JSON.parse(raw) : raw

    // Remove from KV
    await kv.del(`audit:${id}`)

    // Remove from sorted set index
    await kv.zrem('audits:by-date', id)

    // Clean up phone→id index if phone was stored
    if (audit.phone) {
      const storedId = await kv.get(`phone:${audit.phone}`)
      if (storedId === id) {
        await kv.del(`phone:${audit.phone}`)
      }
    }

    console.log(`[delete-audit] Deleted audit ${id} (${audit.businessName})`)

    return res.status(200).json({ deleted: true, id })
  } catch (err) {
    console.error('[delete-audit] Error:', err.message)
    return res.status(500).json({ error: 'Failed to delete audit' })
  }
}
