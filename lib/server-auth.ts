import { headers } from 'next/headers'
import { getAuth } from '@/lib/auth'

export async function requireSession() {
  const auth = getAuth() as unknown as { getSession?: (options?: { headers?: Headers }) => Promise<{ user?: { id: string; name?: string; email?: string } } | null> }
  const session = await auth.getSession?.({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session as { user: { id: string; name?: string; email?: string } }
}
