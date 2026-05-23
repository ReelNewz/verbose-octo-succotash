import { kv } from '@vercel/kv'
import { verifyAdmin } from './_auth.js'

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

  const admin = await verifyAdmin(req)
  if (!admin) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { status, limit } = req.query
  const maxResults = limit ? Math.min(parseInt(limit, 10) || 100, 500) : 100

  try {
    // Get all IDs sorted newest-first
    const ids = await kv.zrevrange('audits:by-date', 0, -1)
    if (!ids || ids.length === 0) {
      return res.status(200).json([])
    }

    // Batch fetch all audits
    const pipeline = kv.pipeline ? kv.pipeline() : null
    let audits

    if (pipeline) {
      for (const id of ids) {
        pipeline.get(`audit:${id}`)
      }
      const results = await pipeline.exec()
      audits = results
        .map((raw) => (raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : null))
        .filter(Boolean)
    } else {
      // Fallback: sequential fetch
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

    // Filter by status if provided
    let filtered = status
      ? audits.filter((a) => a.status === status)
      : audits

    // Trim to limit
    filtered = filtered.slice(0, maxResults)

    return res.status(200).json(filtered)
  } catch (err) {
    console.error('[list-audits] Error:', err.message)
    return res.status(500).json({ error: 'Failed to list audits' })
  }
}
