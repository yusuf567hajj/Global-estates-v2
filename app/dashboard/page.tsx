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
  const { data: session } = authClient.useSession()
  const ownerName = session?.user?.name || 'Masoud'
  const stats = data?.stats ?? { properties: 0, revenue: 0, earnings: 0, pendingPayouts: 0 }
  const properties = data?.properties ?? []
  const bookings = data?.bookings ?? []
  const action = (message: string) => { setNotice(message); window.setTimeout(() => setNotice(''), 2600) }
  return <main className="ge-dashboard min-h-screen bg-[#0a0a0a] text-white">
    <nav className="border-b border-white/10"><div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5"><Link href="/" className="ge-dashboard-brand">Global Estates.</Link><div className="hidden items-center gap-7 text-xs text-neutral-400 md:flex"><Link href="/">Home</Link><Link href="/?category=Rent">Rent</Link><Link href="/?category=Vacation">Vacation</Link><Link href="/?category=Outings">Outings</Link><Link href="/?category=Land">Lend</Link></div><div className="flex items-center gap-2"><Link href="/list-property" className="ge-dashboard-outline"><Plus size={14}/> List your property</Link><span className="ge-dashboard-avatar">M</span></div></div></nav>
    <section className="mx-auto max-w-7xl px-6 pb-12 pt-14"><div className="flex flex-col justify-between gap-8 border-b border-white/10 pb-10 md:flex-row md:items-end"><div><p className="ge-dashboard-eyebrow">YOUR OWNER SPACE</p><h1 className="ge-dashboard-title">Hello, {ownerName}.</h1><p className="mt-4 text-sm text-neutral-400">Great hosting starts with a little perspective.</p></div><div className="flex items-center gap-4"><Link href="/" className="text-sm text-neutral-400 hover:text-white">My trips <ChevronRight className="inline" size={14}/></Link><Link href="/list-property" className="ge-dashboard-primary"><Plus size={16}/> Add property</Link></div></div>
      <div className="grid gap-4 py-10 sm:grid-cols-2 xl:grid-cols-4"><Stat icon={<FileText size={18}/>} label="Total properties" value={String(stats.properties)}/><Stat icon={<TrendingUp size={18}/>} label="Booking revenue" value={`KSh ${Number(stats.revenue).toLocaleString()}`}/><Stat icon={<Wallet size={18}/>} label="Total earnings" value={`KSh ${Number(stats.earnings).toLocaleString()}`}/><Stat icon={<CalendarDays size={18}/>} label="Pending payouts" value={`KSh ${Number(stats.pendingPayouts).toLocaleString()}`}/></div>
      <div className="flex gap-7 overflow-x-auto border-b border-white/10" role="tablist">{tabs.map(tab => <button key={tab} type="button" role="tab" aria-selected={activeTab === tab} onClick={() => setActiveTab(tab)} className={`ge-dashboard-tab ${activeTab === tab ? 'active' : ''}`}>{tab === 'My properties' && <Home size={15}/>} {tab}</button>)}</div>
      <section className="pt-8" aria-live="polite">{activeTab === 'My properties' ? <div className="ge-property-row"><img src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=640&q=85" alt="Modern three bedroom house with a green lawn"/><div className="min-w-0 flex-1"><div className="mb-3 flex flex-wrap gap-2"><span className="ge-status-active">Active</span><span className="ge-status-free">Free</span></div><h2 className="text-xl">3 bedroom house</h2><p className="mt-2 text-sm text-neutral-400">Ruaka, Kenya · Rent</p><p className="mt-4 text-lg font-semibold">KSh 50,000</p></div><div className="ge-property-actions"><div className="flex gap-3"><button type="button" onClick={() => action('Opening property preview')} aria-label="View property"><Eye size={16}/></button><button type="button" onClick={() => action('Opening property editor')} aria-label="Edit property"><Pencil size={16}/></button><button type="button" onClick={() => action('Delete requires confirmation')} aria-label="Delete property"><Trash2 size={16}/></button></div><div className="mt-5 flex gap-4 text-xs"><button type="button" onClick={() => setActiveTab('Bookings')}>Bookings</button><button type="button" onClick={() => action('Promotion options opened')}>Promote</button></div></div></div> : <div className="ge-dashboard-empty"><p className="text-sm text-neutral-400">{activeTab === 'Bookings' ? (bookings.length ? `${bookings.length} booking${bookings.length === 1 ? '' : 's'} in your workspace.` : 'No bookings yet.') : activeTab === 'Earnings & payouts' ? 'Your earnings and payout history will appear here.' : 'Your guest messages will appear here.'}</p><button type="button" onClick={() => setActiveTab('My properties')} className="mt-4 text-sm text-emerald-400">Back to properties</button></div>}</section></section>
    <footer className="border-t border-white/10 px-6 py-12"><div className="mx-auto flex max-w-7xl flex-col justify-between gap-8 md:flex-row"><div><p className="ge-dashboard-brand">Global Estates.</p><p className="mt-3 text-sm text-neutral-400">Extraordinary places. Endless possibilities.</p></div><div className="flex flex-wrap gap-6 text-sm text-neutral-400"><Link href="/">Explore properties ↗</Link><Link href="/list-property">Become a host ↗</Link><span>Owner dashboard</span></div></div><div className="mx-auto mt-10 flex max-w-7xl justify-between border-t border-white/10 pt-5 text-xs text-neutral-500"><span>© 2026 Global Estates. All rights reserved.</span><span>Global marketplace · Prices in KSh</span></div></footer>{notice && <div className="ge-dashboard-toast" role="status">{notice}</div>}
  </main>
}
function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) { return <article className="ge-stat-card"><span className="text-emerald-400">{icon}</span><p className="mt-6 text-xs text-neutral-400">{label}</p><p className="mt-2 text-2xl font-semibold">{value}</p></article> }
