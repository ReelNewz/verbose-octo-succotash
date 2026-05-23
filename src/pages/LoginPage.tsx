import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle, Brain } from 'lucide-react'

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      navigate(from, { replace: true })
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 mb-4">
            <Brain className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Admin Sign In</h1>
          <p className="text-slate-400 text-sm mt-1">Sign in to your admin account</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Email</label>
            <input
              type="email" required autoComplete="email"
              value={email} onChange={e => setEmail(e.target.value)}
              className="w-full rounded-lg bg-slate-700/60 border border-slate-600 px-3 py-2 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="admin@example.com"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Password</label>
            <input
              type="password" required autoComplete="current-password"
              value={password} onChange={e => setPassword(e.target.value)}
              className="w-full rounded-lg bg-slate-700/60 border border-slate-600 px-3 py-2 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="••••••••"
            />
          </div>

          <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </Button>
        </form>

        <p className="text-center text-slate-500 text-xs mt-6">
          Not an admin?{' '}
          <Link to="/admin-access" className="text-indigo-400 hover:underline">Request access</Link>
        </p>
        <p className="text-center mt-4">
          <Link to="/" className="text-slate-500 hover:text-slate-400 text-xs">← Back to public site</Link>
        </p>
      </div>
    </div>
  )
}
