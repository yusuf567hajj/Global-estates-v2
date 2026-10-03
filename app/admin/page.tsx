'use client'

import { useState } from 'react'
import useSWR from 'swr'
import Link from 'next/link'

const fetcher = (url: string) => fetch(url).then((response) => response.json())

export default function AdminPage() {
  const { data, mutate } = useSWR('/api/admin/revenue', fetcher)
  const [notice, setNotice] = useState('')
  const stats = data?.stats ?? {}
  const accessError = data?.error
  const save = async (payload: Record<string, unknown>) => {
    const response = await fetch('/api/admin/revenue', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    setNotice(response.ok ? 'Settings saved.' : 'Could not save settings.')
    if (response.ok) mutate()
  }
  if (accessError) return <main className="grid min-h-screen place-items-center bg-[#0a0a0a] px-6 text-center text-white"><section><p className="ge-dashboard-eyebrow">GLOBAL ESTATES ADMIN</p><h1 className="mt-3 font-serif text-4xl">{accessError}</h1><Link href="/auth/sign-in" className="ge-dashboard-button mt-6 inline-flex">Sign in</Link></section></main>
  return <main className="min-h-screen bg-[#0a0a0a] px-5 py-8 text-white md:px-10">
    <header className="mx-auto flex max-w-7xl items-center justify-between border-b border-white/10 pb-7"><div><p className="ge-dashboard-eyebrow">GLOBAL ESTATES ADMIN</p><h1 className="mt-2 font-serif text-4xl">Revenue control room</h1></div><Link href="/dashboard" className="ge-dashboard-outline">Owner dashboard</Link></header>
    <section className="mx-auto grid max-w-7xl gap-4 py-8 sm:grid-cols-2 lg:grid-cols-4">{[['Total revenue', stats.totalRevenue], ['Revenue today', stats.revenueToday], ['Transactions', stats.transactions], ['Successful payments', stats.successful], ['Failed payments', stats.failed], ['Pending payments', stats.pending], ['Featured properties', stats.featuredProperties], ['Bookings', stats.bookings], ['Listing revenue', stats.listingRevenue], ['Subscription revenue', stats.subscriptionRevenue], ['Booking commissions', stats.bookingCommissions], ['Referral revenue', stats.referralRevenue]].map(([label, value]) => <article className="ge-stat-card" key={String(label)}><p className="text-xs text-neutral-400">{label}</p><p className="mt-3 text-2xl font-semibold">{label === 'Transactions' || String(label).includes('payments') || label === 'Featured properties' || label === 'Bookings' ? Number(value || 0).toLocaleString() : `KSh ${Number(value || 0).toLocaleString()}`}</p></article>)}</section>
    <section className="mx-auto mb-8 flex max-w-7xl flex-col gap-4 rounded-2xl border border-[#d5ad58]/25 bg-[#d5ad58]/[.06] p-6 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs uppercase tracking-[.2em] text-[#d5ad58]">Vacation booking commission</p><p className="mt-2 text-sm text-neutral-300">Global Estates keeps this percentage from each paid vacation booking.</p></div><label className="flex items-center gap-3 text-sm">Rate <input aria-label="Booking commission percentage" className="w-24 rounded border border-white/15 bg-black px-3 py-2" type="number" min="0" max="100" step="0.1" defaultValue={stats.commission ?? 10} onBlur={(event) => save({ type: 'commission', value: event.currentTarget.value })}/> <span>%</span></label></section>
    <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-2"><section className="rounded-2xl border border-white/10 bg-white/[.03] p-6"><h2 className="text-xl">Listing promotion plans</h2><div className="mt-5 flex flex-col gap-3">{(data?.listingPlans ?? []).map((plan: { id: string; name: string; price: number; active: boolean }) => <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3" key={plan.id}><span>{plan.name}</span><div className="flex items-center gap-2"><input aria-label={`${plan.name} price`} className="w-28 rounded border border-white/15 bg-black px-3 py-2" type="number" defaultValue={plan.price} onBlur={(event) => save({ type: 'listing-plan', id: plan.id, price: event.currentTarget.value, active: plan.active })}/><span className="text-xs text-neutral-400">KSh</span></div></div>)}</div></section><section className="rounded-2xl border border-white/10 bg-white/[.03] p-6"><h2 className="text-xl">Subscription plans</h2><div className="mt-5 flex flex-col gap-3">{(data?.subscriptionPlans ?? []).map((plan: { id: string; name: string; price: number; listing_limit: number }) => <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3" key={plan.id}><span>{plan.name}<small className="ml-2 text-neutral-500">{plan.listing_limit} listings</small></span><div className="flex items-center gap-2"><input aria-label={`${plan.name} subscription price`} className="w-28 rounded border border-white/15 bg-black px-3 py-2" type="number" defaultValue={plan.price} onBlur={(event) => save({ type: 'subscription-plan', id: plan.id, price: event.currentTarget.value, listingLimit: plan.listing_limit, featuredLimit: plan.featured_limit, analytics: plan.analytics, active: plan.active })}/><span className="text-xs text-neutral-400">KSh/mo</span></div></div>)}</div></section></div>
    {notice && <p className="mx-auto mt-5 max-w-7xl text-sm text-emerald-400" role="status">{notice}</p>}
  </main>
}
