import { kv } from '@vercel/kv'
import { verifyAdmin } from './_auth.js'

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-secret')
}

/**
 * Escape a value for CSV: wrap in quotes, escape internal quotes by doubling them.
 */
function csvEscape(value) {
  if (value === null || value === undefined) return ''
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function auditToCsvRow(audit) {
  const score = audit.report?.aiReadinessScore ?? ''
  const fields = [
    audit.id,
    audit.businessName,
    audit.ownerName,
    audit.email,
    audit.phone,
    audit.industry,
    audit.employeeCount,
    audit.annualRevenue,
    score,
    audit.status,
    audit.createdAt,
    audit.emailSent ? 'true' : 'false',
    audit.smsSent ? 'true' : 'false',
    audit.notes,
  ]
  return fields.map(csvEscape).join(',')
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

    let audits = []

    if (ids && ids.length > 0) {
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
    }

    const csvHeader =
      'ID,Business Name,Owner,Email,Phone,Industry,Employees,Revenue,Score,Status,Created,Email Sent,SMS Sent,Notes'

    const csvRows = audits.map(auditToCsvRow)
    const csvContent = [csvHeader, ...csvRows].join('\r\n')

    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `ai-audit-leads-${timestamp}.csv`

    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.setHeader('Cache-Control', 'no-store')

    return res.status(200).send(csvContent)
  } catch (err) {
    console.error('[export-leads] Error:', err.message)
    return res.status(500).json({ error: 'Failed to export leads' })
  }
}
