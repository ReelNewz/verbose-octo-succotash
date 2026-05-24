import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Brain, ShieldCheck, Mail } from 'lucide-react'

export function AdminAccessPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      <div className="w-full max-w-sm text-center">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600/20 border border-indigo-500/30 mb-4">
          <ShieldCheck className="h-6 w-6 text-indigo-400" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Admin Access</h1>
        <p className="text-slate-400 text-sm mb-6">
          Admin accounts are managed by the system administrator. To request access, contact your admin directly.
        </p>
        <div className="rounded-xl bg-slate-800/60 border border-slate-700 p-4 mb-6 text-left space-y-3">
          <div className="flex items-start gap-3">
            <Brain className="h-5 w-5 text-indigo-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-white text-sm font-medium">How admin access works</p>
              <p className="text-slate-400 text-xs mt-0.5">Admin roles are granted via the Supabase dashboard by setting <code className="text-indigo-300">app_metadata.role = "admin"</code> on your user account.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Mail className="h-5 w-5 text-indigo-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-white text-sm font-medium">Contact your administrator</p>
              <p className="text-slate-400 text-xs mt-0.5">Ask your system admin to grant you the admin role in Supabase, then sign in with your account.</p>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Button asChild className="bg-indigo-600 hover:bg-indigo-500 text-white">
            <Link to="/login">Sign In</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/">← Public Site</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
