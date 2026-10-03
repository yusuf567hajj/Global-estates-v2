'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowLeft, BedDouble, MapPin, Search, Users } from 'lucide-react'

type Property = { id: string; title: string; category: string; location: string; country: string; description: string; price: number; bedrooms: number; guests: number; images: string[]; listing_plan: string }

export default function SearchPage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const [sort, setSort] = useState('newest')
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    const params = new URLSearchParams()
    if (query) params.set('location', query)
    if (category !== 'All') params.set('category', category)
    if (sort !== 'newest') params.set('sort', sort)
    const response = await fetch(`/api/properties?${params}`)
    const data = await response.json()
    setProperties(data.properties || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  return <main className="min-h-screen bg-[#0a0f0d] text-[#f9fafb]"><header className="border-b border-white/10"><div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4"><Link href="/" className="flex items-center gap-2 text-sm text-emerald-300"><ArrowLeft size={16}/> Global Estates</Link><Link href="/list-property" className="rounded-full bg-emerald-300 px-4 py-2 text-sm font-semibold text-[#08110f]">List your property</Link></div></header><section className="mx-auto max-w-7xl px-5 pb-16 pt-12"><div className="max-w-2xl"><p className="text-sm uppercase tracking-[.2em] text-[#d4af37]">Global search</p><h1 className="mt-3 font-serif text-5xl">Find your place in the world.</h1><p className="mt-4 text-white/60">Search verified homes, stays, experiences and land opportunities.</p></div><form onSubmit={e => { e.preventDefault(); load() }} className="mt-8 grid gap-3 rounded-2xl border border-white/10 bg-[#141b18] p-3 md:grid-cols-[1fr_180px_180px_auto]"><label className="flex items-center gap-3 rounded-xl bg-black/20 px-4 py-3"><Search size={17} className="text-emerald-300"/><span className="sr-only">Location</span><input value={query} onChange={e => setQuery(e.target.value)} placeholder="City, country, or location" className="w-full bg-transparent outline-none placeholder:text-white/40"/></label><select value={category} onChange={e => setCategory(e.target.value)} className="rounded-xl bg-black/20 px-4 py-3 text-sm outline-none"><option>All</option><option>Rent</option><option>Vacation</option><option>Outings</option><option>Land</option><option>Buy Property</option></select><select value={sort} onChange={e => setSort(e.target.value)} className="rounded-xl bg-black/20 px-4 py-3 text-sm outline-none"><option value="newest">Newest</option><option value="price-asc">Price low to high</option><option value="price-desc">Price high to low</option><option value="most-viewed">Most viewed</option></select><button className="rounded-xl bg-emerald-300 px-5 py-3 font-semibold text-[#08110f]">Search</button></form><div className="mt-12 flex items-end justify-between"><div><p className="text-sm text-white/45">{loading ? 'Loading listings…' : `${properties.length} properties found`}</p><h2 className="mt-1 text-2xl font-semibold">Explore properties</h2></div></div>{loading ? <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{[1,2,3].map(item => <div key={item} className="h-80 animate-pulse rounded-2xl bg-white/5"/>)}</div> : <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{properties.map(property => <Link href={`/?property=${property.id}`} key={property.id} className="overflow-hidden rounded-2xl border border-white/10 bg-[#141b18] transition hover:-translate-y-1 hover:border-emerald-300/50"><img src={property.images?.[0]} alt={property.title} className="h-52 w-full object-cover"/><div className="p-5"><div className="flex items-center justify-between gap-3"><span className="text-xs uppercase tracking-wider text-emerald-300">{property.category}</span>{property.listing_plan !== 'Free' && <span className="text-xs text-[#d4af37]">{property.listing_plan}</span>}</div><h3 className="mt-2 text-lg font-semibold">{property.title}</h3><p className="mt-2 flex items-center gap-1 text-sm text-white/50"><MapPin size={14}/> {property.location}, {property.country}</p><div className="mt-4 flex items-center gap-4 text-xs text-white/50"><span className="flex items-center gap-1"><BedDouble size={14}/> {property.bedrooms} beds</span><span className="flex items-center gap-1"><Users size={14}/> {property.guests} guests</span></div><p className="mt-5 text-lg font-semibold text-emerald-300">KSh {Number(property.price).toLocaleString()}</p></div></Link>)}</div>}</section></main>
}
