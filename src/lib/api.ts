const BASE = '/api'

function authHeaders(token?: string): HeadersInit {
  const h: HeadersInit = { 'Content-Type': 'application/json' }
  if (token) h['Authorization'] = `Bearer ${token}`
  return h
}

export interface AuditFormData {
  businessName: string
  ownerName: string
  email: string
  phone: string
  industry: string
  employeeCount: string
  annualRevenue: string
  currentChallenges: string
  currentTools: string
  goals: string
}

export interface AuditReport {
  executiveSummary: string
  aiReadinessScore: number
  scoreBreakdown: {
    dataMaturity: number
    processMaturity: number
    teamReadiness: number
    technicalInfrastructure: number
  }
  opportunities: Array<{
    title: string
    description: string
    impact: 'High' | 'Medium' | 'Low'
    effort: 'High' | 'Medium' | 'Low'
    estimatedROI: string
  }>
  quickWins: Array<{
    title: string
    description: string
    timeToImplement: string
    estimatedSavings: string
  }>
  roadmap: Array<{
    phase: string
    title: string
    duration: string
    description: string
    keyMilestones: string[]
  }>
  riskFactors: string[]
  recommendedNextStep: string
}

export interface Audit {
  id: string
  createdAt: string
  status: 'pending' | 'generating' | 'complete' | 'error' | 'contacted' | 'converted'
  businessName: string
  ownerName: string
  email: string
  phone: string
  industry: string
  employeeCount: string
  annualRevenue: string
  currentChallenges: string
  currentTools: string
  goals: string
  report: AuditReport | null
  emailSent: boolean
  smsSent: boolean
  followUpCount: number
  lastFollowUp: string | null
  notes: string
}

export interface AdminStats {
  total: number
  byStatus: Record<string, number>
  avgScore: number
  emailsSent: number
  smsSent: number
  conversionRate: string
  last7Days: number
}

export async function submitAudit(data: AuditFormData): Promise<Audit> {
  const res = await fetch(`${BASE}/submit-audit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(err.error || 'Failed to submit audit')
  }
  return res.json()
}

export async function getAudit(id: string): Promise<Audit> {
  const res = await fetch(`${BASE}/get-audit?id=${encodeURIComponent(id)}`)
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Not found' }))
    throw new Error(err.error || 'Audit not found')
  }
  return res.json()
}

export async function listAudits(token: string, status?: string, limit = 100): Promise<Audit[]> {
  const params = new URLSearchParams({ limit: String(limit) })
  if (status) params.set('status', status)
  const res = await fetch(`${BASE}/list-audits?${params}`, { headers: authHeaders(token) })
  if (!res.ok) throw new Error('Failed to fetch audits')
  return res.json()
}

export async function updateStatus(token: string, id: string, status: string, notes?: string): Promise<Audit> {
  const res = await fetch(`${BASE}/update-status`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify({ id, status, notes }),
  })
  if (!res.ok) throw new Error('Failed to update status')
  return res.json()
}

export async function getAdminStats(token: string): Promise<AdminStats> {
  const res = await fetch(`${BASE}/admin-stats`, { headers: authHeaders(token) })
  if (!res.ok) throw new Error('Failed to fetch stats')
  return res.json()
}

export async function deleteAudit(token: string, id: string): Promise<void> {
  const res = await fetch(`${BASE}/delete-audit?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  })
  if (!res.ok) throw new Error('Failed to delete audit')
}

export async function resendEmail(token: string, id: string): Promise<void> {
  const res = await fetch(`${BASE}/send-report-email`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ id }),
  })
  if (!res.ok) throw new Error('Failed to resend email')
}
