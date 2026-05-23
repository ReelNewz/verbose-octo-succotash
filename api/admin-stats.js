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
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const admin = await verifyAdmin(req)
  if (!admin) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    // Get all IDs sorted newest-first
    const ids = await kv.zrevrange('audits:by-date', 0, -1)

    if (!ids || ids.length === 0) {
      return res.status(200).json({
        total: 0,
        byStatus: {
          pending: 0,
          generating: 0,
          complete: 0,
          error: 0,
          contacted: 0,
          converted: 0,
        },
        avgScore: 0,
        emailsSent: 0,
        smsSent: 0,
        conversionRate: '0.0%',
        last7Days: 0,
      })
    }

    // Batch fetch all audits
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

    const total = audits.length
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000

    const byStatus = {
      pending: 0,
      generating: 0,
      complete: 0,
      error: 0,
      contacted: 0,
      converted: 0,
    }

    let emailsSent = 0
    let smsSent = 0
    let scoreSum = 0
    let scoreCount = 0
    let last7Days = 0

    for (const audit of audits) {
      // Count by status
      if (audit.status && byStatus.hasOwnProperty(audit.status)) {
        byStatus[audit.status]++
      }

      // Email / SMS counts
      if (audit.emailSent) emailsSent++
      if (audit.smsSent) smsSent++

      // Average score
      const score = audit.report?.aiReadinessScore
      if (typeof score === 'number' && !isNaN(score)) {
        scoreSum += score
        scoreCount++
      }

      // Last 7 days
      if (audit.createdAt && new Date(audit.createdAt).getTime() >= sevenDaysAgo) {
        last7Days++
      }
    }

    const avgScore = scoreCount > 0 ? Math.round(scoreSum / scoreCount) : 0
    const convertedCount = byStatus.converted || 0
    const conversionRate =
      total > 0 ? `${((convertedCount / total) * 100).toFixed(1)}%` : '0.0%'

    return res.status(200).json({
      total,
      byStatus,
      avgScore,
      emailsSent,
      smsSent,
      conversionRate,
      last7Days,
    })
  } catch (err) {
    console.error('[admin-stats] Error:', err.message)
    return res.status(500).json({ error: 'Failed to compute stats' })
  }
}
