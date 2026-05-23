import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/integrations/supabase/client'
import { listAudits, getAdminStats, updateStatus, deleteAudit, resendEmail, type Audit, type AdminStats } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Brain, LogOut, TrendingUp, Users, CheckCircle, Mail, Trash2, RefreshCw, Download, AlertTriangle } from 'lucide-react'

const STATUS_OPTIONS = ['pending', 'generating', 'complete', 'error', 'contacted', 'converted'] as const
const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-slate-500/20 text-slate-300',
  generating: 'bg-blue-500/20 text-blue-300',
  complete: 'bg-green-500/20 text-green-300',
  error: 'bg-red-500/20 text-red-300',
  contacted: 'bg-yellow-500/20 text-yellow-300',
  converted: 'bg-indigo-500/20 text-indigo-300',
}

async function getToken(): Promise<string | undefined> {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token
}

export function DashboardPage() {
  const { user, signOut } = useAuth()
  const [audits, setAudits] = useState<Audit[]>([])
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  async function loadData() {
    setLoading(true)
    setError(null)
    try {
      const token = await getToken()
      if (!token) throw new Error('Not authenticated')
      const [auditData, statsData] = await Promise.all([
        listAudits(token, statusFilter || undefined),
        getAdminStats(token),
      ])
      setAudits(auditData)
      setStats(statsData)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [statusFilter])

  async function handleStatusChange(id: string, status: string) {
    setActionLoading(id)
    try {
      const token = await getToken()
      if (!token) throw new Error('Not authenticated')
      await updateStatus(token, id, status)
      setAudits(prev => prev.map(a => a.id === id ? { ...a, status: status as Audit['status'] } : a))
      showToast('Status updated')
    } catch {
      showToast('Failed to update status')
    } finally {
      setActionLoading(null)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this audit? This cannot be undone.')) return
    setActionLoading(id)
    try {
      const token = await getToken()
      if (!token) throw new Error('Not authenticated')
      await deleteAudit(token, id)
      setAudits(prev => prev.filter(a => a.id !== id))
      showToast('Audit deleted')
    } catch {
      showToast('Failed to delete audit')
    } finally {
      setActionLoading(null)
    }
  }

  async function handleResendEmail(id: string) {
    setActionLoading(id + '-email')
    try {
      const token = await getToken()
      if (!token) throw new Error('Not authenticated')
      await resendEmail(token, id)
      showToast('Email sent')
    } catch {
      showToast('Failed to send email')
    } finally {
      setActionLoading(null)
    }
  }

  async function handleExport() {
    const token = await getToken()
    if (!token) return
    window.open(`/api/export-leads?token=${encodeURIComponent(token)}`, '_blank')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 rounded-lg bg-slate-700 border border-slate-600 px-4 py-2 text-white text-sm shadow-lg">
          {toast}
        </div>
      )}

      {/* Nav */}
      <nav className="border-b border-slate-700/50 bg-slate-900/50 backdrop-blur">
        <div className="mx-auto max-w-7xl px-6 flex h-14 items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-white font-semibold">
            <Brain className="h-5 w-5 text-indigo-400" />
            AI Audit System
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-slate-400 text-sm hidden sm:block">{user?.email}</span>
            <Button variant="ghost" size="sm" onClick={signOut} className="text-slate-400 hover:text-white">
              <LogOut className="h-4 w-4 mr-1" /> Sign out
            </Button>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <StatCard label="Total Audits" value={stats.total} icon={<Users className="h-5 w-5 text-indigo-400" />} />
            <StatCard label="Avg. Score" value={stats.avgScore} icon={<TrendingUp className="h-5 w-5 text-green-400" />} />
            <StatCard label="Converted" value={stats.byStatus?.converted || 0} icon={<CheckCircle className="h-5 w-5 text-yellow-400" />} sub={stats.conversionRate} />
            <StatCard label="Last 7 Days" value={stats.last7Days} icon={<RefreshCw className="h-5 w-5 text-blue-400" />} />
          </div>
        )}

        {/* Header row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <h1 className="text-xl font-bold text-white">Audit Leads</h1>
          <div className="flex items-center gap-2">
            <select
              className="rounded-lg bg-slate-700/60 border border-slate-600 px-3 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="">All statuses</option>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-1" /> Export CSV
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Table */}
        <div className="rounded-xl bg-slate-800/60 border border-slate-700/50 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-slate-400">Loading…</div>
          ) : audits.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Users className="h-10 w-10 text-slate-600 mb-3" />
              <p className="text-slate-400">No audits yet</p>
              <p className="text-slate-500 text-sm mt-1">Audits will appear here once businesses submit the form</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700 text-left">
                    {['Business', 'Contact', 'Industry', 'Score', 'Status', 'Date', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {audits.map(audit => (
                    <tr key={audit.id} className="hover:bg-slate-700/20 transition-colors">
                      <td className="px-4 py-3">
                        <Link to={`/audit/${audit.id}`} className="font-medium text-white hover:text-indigo-300 transition-colors">
                          {audit.businessName}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-white">{audit.ownerName}</p>
                        <p className="text-slate-400 text-xs">{audit.email}</p>
                        {audit.phone && <p className="text-slate-500 text-xs">{audit.phone}</p>}
                      </td>
                      <td className="px-4 py-3 text-slate-300">{audit.industry}</td>
                      <td className="px-4 py-3">
                        {audit.report?.aiReadinessScore != null ? (
                          <span className="font-semibold text-white">{audit.report.aiReadinessScore}<span className="text-slate-500">/100</span></span>
                        ) : <span className="text-slate-500">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <select
                          className={`rounded-full px-2 py-0.5 text-xs border-0 font-medium cursor-pointer ${STATUS_COLORS[audit.status] || STATUS_COLORS.pending}`}
                          value={audit.status}
                          onChange={e => handleStatusChange(audit.id, e.target.value)}
                          disabled={actionLoading === audit.id}
                          style={{ background: 'transparent' }}
                        >
                          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs">
                        {new Date(audit.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            title="Resend email"
                            onClick={() => handleResendEmail(audit.id)}
                            disabled={actionLoading === audit.id + '-email'}
                            className="p-1.5 rounded text-slate-400 hover:text-indigo-300 hover:bg-slate-700 transition-colors disabled:opacity-50"
                          >
                            <Mail className="h-3.5 w-3.5" />
                          </button>
                          <button
                            title="Delete audit"
                            onClick={() => handleDelete(audit.id)}
                            disabled={actionLoading === audit.id}
                            className="p-1.5 rounded text-slate-400 hover:text-red-400 hover:bg-slate-700 transition-colors disabled:opacity-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, icon, sub }: { label: string; value: number | string; icon: React.ReactNode; sub?: string }) {
  return (
    <div className="rounded-xl bg-slate-800/60 border border-slate-700/50 p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-slate-400">{label}</span>
        {icon}
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
    </div>
  )
}
