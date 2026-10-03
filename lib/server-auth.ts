import { headers } from 'next/headers'
import { getAuth } from '@/lib/auth'
import { query } from '@/lib/db'

export async function requireSession() {
  const auth = getAuth() as unknown as { getSession?: (options?: { headers?: Headers }) => Promise<{ user?: { id: string; name?: string; email?: string; role?: string } } | null> }
  const session = await auth.getSession?.({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session as { user: { id: string; name?: string; email?: string; role?: string } }
}

export async function requireAdmin() {
  const session = await requireSession()
  const result = await query<{ role: string }>('SELECT role FROM users WHERE id = $1 LIMIT 1', [session.user.id])
  const role = session.user.role ?? result.rows[0]?.role
  if (role !== 'admin') throw new Error('Forbidden')
  return session
}
