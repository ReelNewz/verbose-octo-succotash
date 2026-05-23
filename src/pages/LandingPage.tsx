import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { submitAudit, type AuditFormData } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle, Brain, Zap, TrendingUp, CheckCircle } from 'lucide-react'

const INDUSTRIES = [
  'Technology / SaaS',
  'E-commerce / Retail',
  'Healthcare / Medical',
  'Financial Services',
  'Legal / Professional Services',
  'Manufacturing',
  'Real Estate',
  'Marketing / Advertising',
  'Logistics / Supply Chain',
  'Education / Training',
  'Hospitality / Travel',
  'Construction',
  'Other',
]

const EMPLOYEE_RANGES = ['1–10', '11–50', '51–200', '201–500', '500+']
const REVENUE_RANGES = ['Under $500K', '$500K–$2M', '$2M–$10M', '$10M–$50M', '$50M+']

type Step = 'business' | 'operations' | 'goals' | 'submitting'

const EMPTY: AuditFormData = {
  businessName: '', ownerName: '', email: '', phone: '',
  industry: '', employeeCount: '', annualRevenue: '',
  currentChallenges: '', currentTools: '', goals: '',
}

export function LandingPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('business')
  const [form, setForm] = useState<AuditFormData>(EMPTY)
  const [error, setError] = useState<string | null>(null)

  const set = (k: keyof AuditFormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSubmit() {
    setStep('submitting')
    setError(null)
    try {
      const audit = await submitAudit(form)
      navigate(`/audit/${audit.id}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.')
      setStep('goals')
    }
  }

  if (step === 'submitting') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-center space-y-4">
          <div className="mx-auto h-16 w-16 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
          <p className="text-white text-xl font-semibold">Generating your AI audit…</p>
          <p className="text-slate-400 text-sm max-w-xs">Claude is analysing your business and building a personalised report. This takes about 30–60 seconds.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950">
      {/* Hero */}
      <header className="mx-auto max-w-4xl px-6 pt-16 pb-12 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/10 border border-indigo-500/30 px-4 py-1.5 text-sm text-indigo-300 mb-6">
          <Brain className="h-4 w-4" /> Free AI Readiness Audit
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight mb-4">
          Discover How AI Can<br className="hidden sm:block" /> Transform Your Business
        </h1>
        <p className="text-slate-400 text-lg max-w-xl mx-auto">
          Get a personalised AI readiness report in under 60 seconds — completely free. We'll identify your biggest opportunities, quick wins, and a step-by-step roadmap.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-slate-400">
          {[
            [Zap, 'Instant AI-generated report'],
            [CheckCircle, 'No sign-up required'],
            [TrendingUp, 'Actionable ROI estimates'],
          ].map(([Icon, label]) => (
            <span key={label as string} className="flex items-center gap-1.5">
              {/* @ts-ignore */}
              <Icon className="h-4 w-4 text-indigo-400" />
              {label as string}
            </span>
          ))}
        </div>
      </header>

      {/* Form card */}
      <main className="mx-auto max-w-2xl px-6 pb-20">
        <div className="rounded-2xl bg-slate-800/60 backdrop-blur border border-slate-700/50 p-8 shadow-2xl">
          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-8">
            {(['business', 'operations', 'goals'] as const).map((s, i) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors
                  ${step === s ? 'bg-indigo-500 text-white' : (
                    (['business', 'operations', 'goals'] as string[]).indexOf(step) > i
                      ? 'bg-indigo-500/40 text-indigo-300' : 'bg-slate-700 text-slate-400'
                  )}`}>
                  {i + 1}
                </div>
                <span className={`text-xs font-medium hidden sm:block ${step === s ? 'text-white' : 'text-slate-500'}`}>
                  {['Your Business', 'Operations', 'Goals'][i]}
                </span>
                {i < 2 && <div className="flex-1 h-px bg-slate-700" />}
              </div>
            ))}
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Step 1 */}
          {step === 'business' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-white mb-2">Tell us about your business</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Business Name *">
                  <input className={input} value={form.businessName} onChange={set('businessName')} placeholder="Acme Corp" />
                </Field>
                <Field label="Your Name *">
                  <input className={input} value={form.ownerName} onChange={set('ownerName')} placeholder="Jane Smith" />
                </Field>
                <Field label="Email Address *">
                  <input className={input} type="email" value={form.email} onChange={set('email')} placeholder="jane@acme.com" />
                </Field>
                <Field label="Phone Number">
                  <input className={input} type="tel" value={form.phone} onChange={set('phone')} placeholder="+1 555 000 0000" />
                </Field>
                <Field label="Industry *">
                  <select className={input} value={form.industry} onChange={set('industry')}>
                    <option value="">Select industry…</option>
                    {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
                  </select>
                </Field>
                <Field label="Number of Employees *">
                  <select className={input} value={form.employeeCount} onChange={set('employeeCount')}>
                    <option value="">Select range…</option>
                    {EMPLOYEE_RANGES.map(r => <option key={r}>{r}</option>)}
                  </select>
                </Field>
                <Field label="Annual Revenue" className="sm:col-span-2">
                  <select className={input} value={form.annualRevenue} onChange={set('annualRevenue')}>
                    <option value="">Select range…</option>
                    {REVENUE_RANGES.map(r => <option key={r}>{r}</option>)}
                  </select>
                </Field>
              </div>
              <div className="flex justify-end pt-2">
                <Button onClick={() => {
                  if (!form.businessName || !form.ownerName || !form.email || !form.industry || !form.employeeCount) {
                    setError('Please fill in all required fields.')
                    return
                  }
                  setError(null)
                  setStep('operations')
                }}>
                  Continue →
                </Button>
              </div>
            </div>
          )}

          {/* Step 2 */}
          {step === 'operations' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-white mb-2">Current operations & challenges</h2>
              <Field label="What are your biggest operational challenges? *">
                <textarea className={`${input} min-h-[100px] resize-y`} value={form.currentChallenges} onChange={set('currentChallenges')}
                  placeholder="e.g. Manual data entry takes too long, customer support is overwhelmed, inventory forecasting is inaccurate…" />
              </Field>
              <Field label="What tools & software does your team currently use?">
                <textarea className={`${input} min-h-[80px] resize-y`} value={form.currentTools} onChange={set('currentTools')}
                  placeholder="e.g. Salesforce, QuickBooks, Slack, Excel, HubSpot…" />
              </Field>
              <div className="flex justify-between pt-2">
                <Button variant="outline" onClick={() => setStep('business')}>← Back</Button>
                <Button onClick={() => {
                  if (!form.currentChallenges) {
                    setError('Please describe your current challenges.')
                    return
                  }
                  setError(null)
                  setStep('goals')
                }}>Continue →</Button>
              </div>
            </div>
          )}

          {/* Step 3 */}
          {step === 'goals' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-white mb-2">Your goals & vision</h2>
              <Field label="What are your primary business goals for the next 12 months? *">
                <textarea className={`${input} min-h-[120px] resize-y`} value={form.goals} onChange={set('goals')}
                  placeholder="e.g. Reduce operational costs by 20%, scale customer base, launch in new markets, improve response times…" />
              </Field>
              <p className="text-xs text-slate-500">Your report will be emailed to {form.email || 'your address'} and displayed immediately.</p>
              <div className="flex justify-between pt-2">
                <Button variant="outline" onClick={() => setStep('operations')}>← Back</Button>
                <Button onClick={() => {
                  if (!form.goals) {
                    setError('Please describe your goals.')
                    return
                  }
                  setError(null)
                  handleSubmit()
                }} className="bg-indigo-600 hover:bg-indigo-500 text-white">
                  Get My Free Audit →
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

const input = 'w-full rounded-lg bg-slate-700/60 border border-slate-600 px-3 py-2 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition'

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="block text-xs font-medium text-slate-400 mb-1.5">{label}</label>
      {children}
    </div>
  )
}
