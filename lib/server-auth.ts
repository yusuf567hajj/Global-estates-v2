import { getAuth } from '@/lib/auth'

export async function requireSession() {
  const result = await getAuth().getSession()
  if (!result?.data?.user) throw new Error('UNAUTHORIZED')
  return result.data
}

export async function requireAdmin() {
  const session = await requireSession()
  const email = session.user.email?.toLowerCase()
  const configuredAdmin = process.env.ADMIN_EMAIL?.toLowerCase()
  if (session.user.role !== 'admin' && (!configuredAdmin || email !== configuredAdmin)) throw new Error('FORBIDDEN')
  return session
}
