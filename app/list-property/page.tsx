'use client'

import { useState } from 'react'

const amenities = ['Wi-Fi', 'Kitchen', 'Free parking', 'Swimming pool', 'Air conditioning', 'Outdoor space', 'Beach access', 'Scenic views', 'Pet friendly', 'Security', 'Water supply', 'Electricity']
const countries = ['Kenya', 'Uganda', 'Tanzania', 'Rwanda', 'Nigeria', 'Ghana', 'South Africa', 'United States', 'United Kingdom', 'Canada', 'Australia', 'United Arab Emirates', 'Germany', 'France', 'Italy', 'Spain', 'India']

export default function ListPropertyPage() {
  const [amenityState, setAmenityState] = useState<string[]>(['Wi-Fi'])
  const [imageUrl, setImageUrl] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [submitted, setSubmitted] = useState(false)

  function addImage() {
    if (imageUrl.startsWith('https://')) { setImages((current) => [...current, imageUrl]); setImageUrl('') }
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitted(true)
  }

  return <main className="ge-list-page min-h-screen bg-[#0a0a0a] text-[#f2f0e8]">
    <nav className="border-b border-white/[.08] bg-[#0a0a0a]">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4"><a href="/" className="ge-brand">Global Estates.</a><div className="hidden items-center gap-6 text-xs text-white/50 md:flex"><a href="/">Home</a><a href="/?category=Rent">Rent</a><a href="/?category=Vacation">Vacation</a><a href="/?category=Outings">Outings</a><a href="/?category=Land">Lend</a></div><div className="flex items-center gap-2"><a href="#listing-form" className="ge-outline-button">+ List your property</a><a href="/" className="ge-solid-button">My dashboard</a></div></div>
    </nav>
    <div className="mx-auto max-w-6xl px-5 pb-20 pt-8"><a href="/" className="ge-back-link">&lt; Back to dashboard</a><header className="ge-list-hero"><div><p className="ge-eyebrow">OPEN YOUR DOORS TO THE WORLD</p><h1>Every place has a story.</h1><p>Tell yours. Create your free property listing.</p></div><span className="ge-plan-badge">Free listing - KSh 0</span></header>
      <form id="listing-form" onSubmit={submit} className="ge-list-form">
        <section><div className="ge-form-heading"><span>01</span><div><h2>The essentials</h2><p>A great first impression starts here.</p></div></div><label>Property title<input required placeholder="e.g. A peaceful garden villa in Diani" /></label><div className="ge-form-grid"><label>Category<select defaultValue="Rent"><option>Rent</option><option>Vacation</option><option>Outings</option><option>Land</option></select></label><label>Country<select defaultValue="Kenya">{countries.map((country) => <option key={country}>{country}</option>)}</select></label><label>City / location<input required placeholder="e.g. Diani Beach" /></label><label>Price in KSh per month<input required type="number" min="0" placeholder="0.00" /></label><label>Bedrooms<input type="number" min="0" defaultValue="1" /></label><label>Maximum guests<input type="number" min="1" defaultValue="2" /></label></div><label>Description<textarea required placeholder="What makes your place special? Share the space, surroundings, and little details guests will love." /></label></section>
        <section><div className="ge-form-heading"><span>02</span><div><h2>The little extras</h2><p>What can guests look forward to?</p></div></div><div className="ge-amenity-grid">{amenities.map((amenity) => <label key={amenity} className="ge-amenity"><input type="checkbox" checked={amenityState.includes(amenity)} onChange={() => setAmenityState((current) => current.includes(amenity) ? current.filter((item) => item !== amenity) : [...current, amenity])} /><span>{amenity}</span></label>)}</div></section>
        <section><div className="ge-form-heading"><span>03</span><div><h2>Let your place shine</h2><p>JPEG, PNG, or WebP - Up to 12 photos · 10 MB each</p></div></div><label className="ge-upload-box"><span className="ge-upload-icon">+</span><strong>Choose property photos</strong><small>Your first photo will be the cover image.</small><input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" multiple /></label><div className="ge-image-add"><input value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} placeholder="Or paste an HTTPS image URL" /><button type="button" onClick={addImage}>+ Add</button></div>{images.length > 0 && <p className="text-xs text-emerald-300">{images.length} image URL{images.length === 1 ? '' : 's'} added</p>}</section>
        <section><div className="ge-form-heading"><span>04</span><div><h2>Make the connection</h2><p>Your contact email is private. Inquiries arrive in your dashboard.</p></div></div><label>Contact email<input required type="email" defaultValue="masoudhussein2002@gmail.com" /></label></section>
        <button className="ge-submit-button" type="submit">{submitted ? 'Property saved' : 'Save and list property'}</button>
      </form>
    </div><div className="ge-progress-line" />
  </main>
}
