'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'

export default function SignInPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError('')
    const form = new FormData(event.currentTarget)
    const result = await authClient.signIn.email({ email: String(form.get('email')), password: String(form.get('password')) })
    if (result.error) setError('Unable to sign in. Check your details and try again.')
    else { router.push('/dashboard'); router.refresh() }
    setLoading(false)
  }
  return <main className="min-h-screen bg-[#0a0a0a] px-5 py-16 text-white"><div className="mx-auto max-w-md"><a href="/" className="text-sm text-emerald-300">Global Estates.</a><div className="mt-12 rounded-2xl border border-white/10 bg-white/[.03] p-6"><p className="text-xs uppercase tracking-[.2em] text-emerald-300">Owner space</p><h1 className="mt-3 font-serif text-4xl">Welcome back.</h1><p className="mt-2 text-sm text-white/55">Sign in to manage your listings and bookings.</p><form onSubmit={submit} className="mt-8 space-y-4"><input name="email" type="email" required placeholder="Email address" className="h-12 w-full rounded-xl border border-white/10 bg-black/20 px-4 text-white" /><input name="password" type="password" required placeholder="Password" className="h-12 w-full rounded-xl border border-white/10 bg-black/20 px-4 text-white" />{error && <p role="alert" className="text-sm text-red-300">{error}</p>}<button disabled={loading} className="w-full rounded-full bg-emerald-300 py-3 font-semibold text-[#07100d] disabled:opacity-50">{loading ? 'Signing in...' : 'Sign in'}</button></form><p className="mt-6 text-center text-sm text-white/55">New owner? <a href="/auth/sign-up" className="text-emerald-300">Create an account</a></p></div></div></main>
}
