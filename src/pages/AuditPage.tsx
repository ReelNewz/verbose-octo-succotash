import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getAudit, type Audit, type AuditReport } from '@/lib/api'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertTriangle, CheckCircle, Clock, Zap, TrendingUp, AlertCircle, ChevronRight } from 'lucide-react'

export function AuditPage() {
  const { id } = useParams<{ id: string }>()
  const [audit, setAudit] = useState<Audit | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    let active = true

    async function poll() {
      try {
        const data = await getAudit(id!)
        if (!active) return
        setAudit(data)
        if (data.status === 'pending' || data.status === 'generating') {
          setTimeout(poll, 3000)
        }
      } catch (e) {
        if (!active) return
        setError(e instanceof Error ? e.message : 'Failed to load audit.')
      }
    }

    poll()
    return () => { active = false }
  }, [id])

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 p-6">
        <Alert variant="destructive" className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error loading audit</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>{error}</p>
            <Button asChild size="sm" variant="outline"><Link to="/">Start new audit</Link></Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!audit || audit.status === 'pending' || audit.status === 'generating') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-center space-y-4 max-w-sm px-6">
          <div className="mx-auto h-16 w-16 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
          <p className="text-white text-xl font-semibold">Analysing your business…</p>
          <div className="space-y-1 text-sm text-slate-400">
            <p>Claude is reviewing your responses</p>
            <p>Building your personalised audit report</p>
            <p>Calculating AI readiness scores</p>
            <p className="text-slate-500 text-xs pt-2">This usually takes 30–60 seconds</p>
          </div>
        </div>
      </div>
    )
  }

  if (audit.status === 'error') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 p-6">
        <Alert variant="destructive" className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Generation failed</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>We encountered an error generating your audit. Please try again.</p>
            <Button asChild size="sm" variant="outline"><Link to="/">Start new audit</Link></Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const report = audit.report!
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950">
      <div className="mx-auto max-w-4xl px-6 py-12">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-green-500/10 border border-green-500/30 px-4 py-1.5 text-sm text-green-300 mb-4">
            <CheckCircle className="h-4 w-4" /> Report Ready
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            AI Readiness Audit: {audit.businessName}
          </h1>
          <p className="text-slate-400">
            Prepared for {audit.ownerName} · {new Date(audit.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          {audit.emailSent && (
            <p className="text-slate-500 text-sm mt-1">A copy has been sent to {audit.email}</p>
          )}
        </div>

        {/* Score */}
        <ScoreCard report={report} />

        {/* Executive Summary */}
        <Section title="Executive Summary" icon={<TrendingUp className="h-5 w-5 text-indigo-400" />}>
          <p className="text-slate-300 leading-relaxed">{report.executiveSummary}</p>
        </Section>

        {/* Opportunities */}
        {report.opportunities?.length > 0 && (
          <Section title="Top AI Opportunities" icon={<Zap className="h-5 w-5 text-yellow-400" />}>
            <div className="space-y-4">
              {report.opportunities.map((op, i) => (
                <div key={i} className="rounded-xl bg-slate-700/40 border border-slate-700 p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="font-semibold text-white">{op.title}</h3>
                    <div className="flex gap-2 shrink-0">
                      <Badge label={`Impact: ${op.impact}`} color={op.impact === 'High' ? 'green' : op.impact === 'Medium' ? 'yellow' : 'slate'} />
                      <Badge label={`Effort: ${op.effort}`} color={op.effort === 'Low' ? 'green' : op.effort === 'Medium' ? 'yellow' : 'red'} />
                    </div>
                  </div>
                  <p className="text-slate-400 text-sm mb-2">{op.description}</p>
                  {op.estimatedROI && (
                    <p className="text-green-400 text-sm font-medium">Estimated ROI: {op.estimatedROI}</p>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Quick Wins */}
        {report.quickWins?.length > 0 && (
          <Section title="Quick Wins" icon={<Clock className="h-5 w-5 text-green-400" />}>
            <div className="grid sm:grid-cols-2 gap-4">
              {report.quickWins.map((win, i) => (
                <div key={i} className="rounded-xl bg-slate-700/40 border border-slate-700 p-4">
                  <h3 className="font-semibold text-white mb-1">{win.title}</h3>
                  <p className="text-slate-400 text-sm mb-3">{win.description}</p>
                  <div className="space-y-1">
                    {win.timeToImplement && <p className="text-xs text-slate-500">⏱ {win.timeToImplement}</p>}
                    {win.estimatedSavings && <p className="text-xs text-green-400">💰 {win.estimatedSavings}</p>}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Roadmap */}
        {report.roadmap?.length > 0 && (
          <Section title="Implementation Roadmap" icon={<ChevronRight className="h-5 w-5 text-indigo-400" />}>
            <div className="space-y-4">
              {report.roadmap.map((phase, i) => (
                <div key={i} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white text-xs font-bold">
                      {i + 1}
                    </div>
                    {i < report.roadmap.length - 1 && <div className="flex-1 w-px bg-slate-700 my-1" />}
                  </div>
                  <div className="pb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-white">{phase.title}</h3>
                      {phase.duration && <span className="text-xs text-slate-500 bg-slate-700 px-2 py-0.5 rounded-full">{phase.duration}</span>}
                    </div>
                    <p className="text-slate-400 text-sm mb-2">{phase.description}</p>
                    {phase.keyMilestones?.length > 0 && (
                      <ul className="space-y-1">
                        {phase.keyMilestones.map((m, j) => (
                          <li key={j} className="text-xs text-slate-500 flex items-start gap-1.5">
                            <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 shrink-0" /> {m}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Risk Factors */}
        {report.riskFactors?.length > 0 && (
          <Section title="Risk Factors to Consider" icon={<AlertCircle className="h-5 w-5 text-orange-400" />}>
            <ul className="space-y-2">
              {report.riskFactors.map((risk, i) => (
                <li key={i} className="flex items-start gap-2 text-slate-300 text-sm">
                  <AlertCircle className="h-4 w-4 text-orange-400 mt-0.5 shrink-0" /> {risk}
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* CTA */}
        <div className="mt-8 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Ready to Get Started?</h2>
          <p className="text-slate-300 mb-1">{report.recommendedNextStep}</p>
          <p className="text-slate-400 text-sm mb-6">Our team will help you implement these recommendations and maximise your ROI.</p>
          <Button asChild className="bg-indigo-600 hover:bg-indigo-500 text-white">
            <a href={`mailto:${import.meta.env.VITE_CONTACT_EMAIL || 'hello@youragency.com'}?subject=AI Audit Follow-up: ${encodeURIComponent(audit.businessName)}&body=Hi, I just received my AI readiness audit and I'd like to discuss next steps.`}>
              Book a Free Consultation →
            </a>
          </Button>
        </div>
      </div>
    </div>
  )
}

function ScoreCard({ report }: { report: AuditReport }) {
  const score = report.aiReadinessScore
  const color = score >= 70 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444'
  const label = score >= 70 ? 'High Readiness' : score >= 50 ? 'Moderate Readiness' : 'Early Stage'
  const breakdown = report.scoreBreakdown

  return (
    <div className="mb-8 rounded-2xl bg-slate-800/60 border border-slate-700/50 p-6">
      <div className="flex flex-col sm:flex-row items-center gap-6">
        <div className="text-center">
          <div className="relative h-32 w-32">
            <svg viewBox="0 0 100 100" className="h-32 w-32 -rotate-90">
              <circle cx="50" cy="50" r="40" fill="none" stroke="#1e293b" strokeWidth="10" />
              <circle cx="50" cy="50" r="40" fill="none" stroke={color} strokeWidth="10"
                strokeDasharray={`${(score / 100) * 251.2} 251.2`} strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-white">{score}</span>
              <span className="text-xs text-slate-400">/ 100</span>
            </div>
          </div>
          <p className="mt-1 text-sm font-semibold" style={{ color }}>{label}</p>
        </div>
        <div className="flex-1 w-full space-y-3">
          <h2 className="text-lg font-semibold text-white">AI Readiness Score</h2>
          {breakdown && Object.entries(breakdown).map(([key, val]) => (
            <div key={key}>
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>{key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}</span>
                <span>{val}/100</span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-700">
                <div className="h-1.5 rounded-full bg-indigo-500 transition-all" style={{ width: `${val}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="mb-6 rounded-2xl bg-slate-800/60 border border-slate-700/50 p-6">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-white mb-4">
        {icon} {title}
      </h2>
      {children}
    </div>
  )
}

function Badge({ label, color }: { label: string; color: 'green' | 'yellow' | 'red' | 'slate' }) {
  const colors = {
    green: 'bg-green-500/20 text-green-300 border-green-500/30',
    yellow: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    red: 'bg-red-500/20 text-red-300 border-red-500/30',
    slate: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  }
  return <span className={`text-xs px-2 py-0.5 rounded-full border ${colors[color]}`}>{label}</span>
}
