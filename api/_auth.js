import { createClient } from '@supabase/supabase-js'

/**
 * Verify the request is from an admin user.
 * Accepts either:
 *   1. x-admin-secret header matching ADMIN_SECRET env var
 *   2. Authorization: Bearer <supabase-jwt> where the user has admin role in app_metadata or user_metadata
 *
 * Returns the user object on success, null on failure.
 */
export async function verifyAdmin(req) {
  // Fallback: x-admin-secret header
  if (
    req.headers['x-admin-secret'] &&
    process.env.ADMIN_SECRET &&
    req.headers['x-admin-secret'] === process.env.ADMIN_SECRET
  ) {
    return { id: 'admin', email: 'admin' }
  }

  const token = req.headers.authorization?.replace('Bearer ', '').trim()
  if (!token) return null

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('[_auth] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set')
    return null
  }

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token)

    if (error || !user) return null

    const isAdmin =
      user.app_metadata?.role === 'admin' ||
      user.user_metadata?.role === 'admin'

    return isAdmin ? user : null
  } catch (err) {
    console.error('[_auth] Error verifying token:', err.message)
    return null
  }
}
