'use client'

import Link from 'next/link'
import { useState } from 'react'
import useSWR from 'swr'
import { authClient } from '@/lib/auth-client'

const fetcher = (url: string) => fetch(url).then((response) => response.json())
import { CalendarDays, ChevronRight, Eye, FileText, Home, Pencil, Plus, TrendingUp, Trash2, Wallet } from 'lucide-react'

const tabs = ['My properties', 'Bookings', 'Earnings & payouts', 'Inbox']

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('My properties')
  const [notice, setNotice] = useState('')
  const { data } = useSWR('/api/dashboard', fetcher)
  const { data: session, isPending: sessionPending } = authClient.useSession()
  const [promoting, setPromoting] = useState<string | null>(null)
  const startSubscription = async () => {
    const planId = window.prompt('Choose subscription: basic, pro, or agency', 'basic')
    if (!planId || !session?.user?.email) return
    const response = await fetch('/api/checkout/subscription', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ planId, email: session.user.email }) })
    const result = await response.json()
    if (response.ok && result.checkoutUrl) window.location.assign(result.checkoutUrl)
    else action(result.error || 'Unable to start subscription payment')
  }
  const startPromotion = async (propertyId: string) => {
    const planId = window.prompt('Choose plan: featured, premium, or top-placement', 'featured')
    if (!planId) return
    const email = session?.user?.email || window.prompt('Email for receipt') || ''
    setPromoting(propertyId)
    const response = await fetch('/api/checkout/listing', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ propertyId, planId, email }) })
    const result = await response.json()
    setPromoting(null)
    if (response.ok && result.checkoutUrl) window.location.assign(result.checkoutUrl)
    else action(result.error || 'Unable to start promotion payment')
  }
  const ownerName = session?.user?.name || 'Masoud'
  const stats = data?.stats ?? { properties: 0, revenue: 0, earnings: 0, pendingPayouts: 0 }
  const properties = data?.properties ?? []
  const bookings = data?.bookings ?? []
  const leads = data?.leads ?? []
  const transactions = data?.transactions ?? []
  const subscriptions = data?.subscriptions ?? []
  const action = (message: string) => { setNotice(message); window.setTimeout(() => setNotice(''), 2600) }
  if (sessionPending) return <main className="grid min-h-screen place-items-center bg-[#0a0a0a] px-6 text-white"><div className="text-center"><p className="ge-dashboard-eyebrow">OWNER SPACE</p><p className="mt-3 text-sm text-neutral-400">Loading your dashboard…</p></div></main>
  if (!session) return <main className="grid min-h-screen place-items-center bg-[#0a0a0a] px-6 text-white"><div className="max-w-md text-center"><p className="ge-dashboard-eyebrow">YOUR OWNER SPACE</p><h1 className="mt-3 font-serif text-4xl">Sign in to manage your listings.</h1><p className="mt-4 text-sm text-neutral-400">Create an owner account to save properties, view bookings, and manage payouts.</p><div className="mt-8 flex justify-center gap-3"><Link href="/auth/sign-in" className="ge-dashboard-primary">Sign in</Link><Link href="/auth/sign-up" className="ge-dashboard-outline">Sign up</Link></div></div></main>
  return <main className="ge-dashboard min-h-screen bg-[#0a0a0a] text-white">
    <nav className="border-b border-white/10 bg-[#0d1210]"><div className="mx-auto flex max-w-[1100px] items-center justify-between px-5 py-3 md:px-6"><Link href="/" className="ge-dashboard-brand">Global Estates.</Link><div className="hidden items-center gap-7 text-xs text-neutral-400 md:flex"><Link href="/">Home</Link><Link href="/?category=Rent">Rent</Link><Link href="/?category=Vacation">Vacation</Link><Link href="/?category=Outings">Outings</Link><Link href="/?category=Land">Lend</Link></div><div className="flex items-center gap-2"><Link href="/list-property" className="ge-dashboard-outline"><Plus size={14}/> List your property</Link><span className="ge-dashboard-avatar">M</span></div></div></nav>
    <section className="mx-auto max-w-[1100px] px-5 pb-12 pt-8 md:px-6 md:pt-10"><div className="flex flex-col justify-between gap-8 border-b border-white/10 pb-10 md:flex-row md:items-end"><div><p className="ge-dashboard-eyebrow">YOUR OWNER SPACE</p><h1 className="ge-dashboard-title">Hello, {ownerName}.</h1><p className="mt-4 text-sm text-neutral-400">Great hosting starts with a little perspective.</p></div><div className="flex items-center gap-4"><Link href="/" className="text-sm text-neutral-400 hover:text-white">My trips <ChevronRight className="inline" size={14}/></Link><div className="flex flex-wrap gap-3"><button type="button" onClick={startSubscription} className="ge-dashboard-outline">Upgrade plan</button><Link href="/list-property" className="ge-dashboard-primary"><Plus size={16}/> Add property</Link></div></div></div>
      <div className="grid gap-4 py-10 sm:grid-cols-2 xl:grid-cols-4"><Stat icon={<FileText size={18}/>} label="Total properties" value={String(stats.properties)}/><Stat icon={<TrendingUp size={18}/>} label="Booking revenue" value={`KSh ${Number(stats.revenue).toLocaleString()}`}/><Stat icon={<Wallet size={18}/>} label="Total earnings" value={`KSh ${Number(stats.earnings).toLocaleString()}`}/><Stat icon={<CalendarDays size={18}/>} label="Pending payouts" value={`KSh ${Number(stats.pendingPayouts).toLocaleString()}`}/></div>
      <div className="flex gap-7 overflow-x-auto border-b border-white/10" role="tablist">{tabs.map(tab => <button key={tab} type="button" role="tab" aria-selected={activeTab === tab} onClick={() => setActiveTab(tab)} className={`ge-dashboard-tab ${activeTab === tab ? 'active' : ''}`}>{tab === 'My properties' && <Home size={15}/>} {tab}</button>)}</div>
      {activeTab !== 'My properties' && <section className="grid gap-4 pt-8 md:grid-cols-3" aria-label="Owner activity summary"><article className="ge-stat-card"><p className="text-xs text-neutral-400">Enquiries received</p><p className="mt-2 text-2xl font-semibold">{leads.length}</p><p className="mt-2 text-xs text-neutral-500">Buyer and renter leads</p></article><article className="ge-stat-card"><p className="text-xs text-neutral-400">Payment history</p><p className="mt-2 text-2xl font-semibold">{transactions.length}</p><p className="mt-2 text-xs text-neutral-500">Recorded transactions</p></article><article className="ge-stat-card"><p className="text-xs text-neutral-400">Subscription</p><p className="mt-2 text-2xl font-semibold">{subscriptions[0]?.plan_id || 'Free'}</p><p className="mt-2 text-xs text-neutral-500">{subscriptions[0]?.status || 'No active plan'}</p></article></section>}
      {leads.length > 0 && <section className="pt-8" aria-label="Recent enquiries"><div className="mb-4 flex items-center justify-between"><h2 className="text-xl">Recent enquiries</h2><span className="text-xs text-neutral-500">Lead & referral tracking</span></div><div className="grid gap-3">{leads.slice(0, 5).map((lead: { id: string; buyer_name: string; buyer_email: string; message: string; status: string }) => <article className="rounded-xl border border-white/10 bg-white/[.03] p-4" key={lead.id}><div className="flex items-start justify-between gap-4"><div><p className="font-medium">{lead.buyer_name}</p><p className="text-xs text-neutral-500">{lead.buyer_email}</p></div><span className="ge-status-free">{lead.status}</span></div><p className="mt-3 text-sm text-neutral-300">{lead.message}</p></article>)}</div></section>}
      <section className="pt-8" aria-live="polite">{activeTab === 'My properties' ? (properties.length ? <div className="space-y-4">{properties.map((property: { id: string; title: string; location: string; country: string; category: string; price: number; images?: string[]; status?: string; listing_plan?: string }) => <div className="ge-property-row" key={property.id}><img src={property.images?.[0] || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=640&q=85'} alt={`${property.title} listing`} /><div className="min-w-0 flex-1"><div className="mb-3 flex flex-wrap gap-2"><span className="ge-status-active">{property.status || 'Active'}</span><span className="ge-status-free">{property.listing_plan || 'Free'}</span></div><h2 className="text-xl">{property.title}</h2><p className="mt-2 text-sm text-neutral-400">{property.location}, {property.country} · {property.category}</p><p className="mt-4 text-lg font-semibold">KSh {Number(property.price).toLocaleString()}</p></div><div className="ge-property-actions"><div className="flex gap-3"><button type="button" onClick={() => action('Opening property preview')} aria-label={`View ${property.title}`}><Eye size={16}/></button><button type="button" onClick={() => action('Opening property editor')} aria-label={`Edit ${property.title}`}><Pencil size={16}/></button><button type="button" onClick={() => action('Delete requires confirmation')} aria-label={`Delete ${property.title}`}><Trash2 size={16}/></button></div><div className="mt-5 flex gap-4 text-xs"><button type="button" onClick={() => setActiveTab('Bookings')}>Bookings</button><button type="button" disabled={promoting === property.id} onClick={() => startPromotion(property.id)}>{promoting === property.id ? 'Opening…' : 'Promote'}</button></div></div></div>)}</div> : <div className="ge-dashboard-empty"><p className="text-lg text-white">No properties saved yet.</p><p className="mt-2 text-sm text-neutral-400">Create your first listing and it will appear here after you publish it.</p><Link href="/list-property" className="ge-dashboard-primary mt-5 inline-flex"><Plus size={16}/> Add your first property</Link></div>) : <div className="ge-dashboard-empty"><p className="text-sm text-neutral-400">{activeTab === 'Bookings' ? (bookings.length ? `${bookings.length} booking${bookings.length === 1 ? '' : 's'} in your workspace.` : 'No bookings yet.') : activeTab === 'Earnings & payouts' ? 'Your earnings and payout history will appear here.' : 'Your guest messages will appear here.'}</p><button type="button" onClick={() => setActiveTab('My properties')} className="mt-4 text-sm text-emerald-400">Back to properties</button></div>}</section></section>
    <footer className="border-t border-white/10 px-6 py-12"><div className="mx-auto flex max-w-7xl flex-col justify-between gap-8 md:flex-row"><div><p className="ge-dashboard-brand">Global Estates.</p><p className="mt-3 text-sm text-neutral-400">Extraordinary places. Endless possibilities.</p></div><div className="flex flex-wrap gap-6 text-sm text-neutral-400"><Link href="/">Explore properties ↗</Link><Link href="/list-property">Become a host ↗</Link><span>Owner dashboard</span></div></div><div className="mx-auto mt-10 flex max-w-7xl justify-between border-t border-white/10 pt-5 text-xs text-neutral-500"><span>© 2026 Global Estates. All rights reserved.</span><span>Global marketplace · Prices in KSh</span></div></footer>{notice && <div className="ge-dashboard-toast" role="status">{notice}</div>}
  </main>
}
function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) { return <article className="ge-stat-card"><span className="text-emerald-400">{icon}</span><p className="mt-6 text-xs text-neutral-400">{label}</p><p className="mt-2 text-2xl font-semibold">{value}</p></article> }
