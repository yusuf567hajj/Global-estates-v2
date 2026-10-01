'use client'

import { useState } from 'react'
import Link from 'next/link'

const amenities = ['Wi-Fi', 'Kitchen', 'Free parking', 'Swimming pool', 'Air conditioning', 'Outdoor space', 'Beach access', 'Scenic views', 'Pet friendly', 'Security', 'Water supply', 'Electricity']
const countries = ['Kenya', 'Uganda', 'Tanzania', 'Rwanda', 'Nigeria', 'Ghana', 'South Africa', 'United States', 'United Kingdom', 'Canada', 'Australia', 'United Arab Emirates', 'Germany', 'France', 'Italy', 'Spain', 'India']

export default function ListPropertyPage() {
  const [amenityState, setAmenityState] = useState<string[]>(['Wi-Fi'])
  const [imageUrl, setImageUrl] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  function addImage() {
    if (imageUrl.startsWith('https://')) { setImages((current) => [...current, imageUrl]); setImageUrl('') }
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []).slice(0, 12)
    if (!files.length) return
    setUploading(true)
    setUploadError('')
    try {
      const uploaded = await Promise.all(files.map(async (file) => {
        const formData = new FormData()
        formData.append('file', file)
        const response = await fetch('/api/upload', { method: 'POST', body: formData })
        const result = await response.json()
        if (!response.ok) throw new Error(result.error ?? 'Upload failed')
        return result.url as string
      }))
      setUploadedImages((current) => [...current, ...uploaded].slice(0, 12))
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Upload failed')
    } finally {
      setUploading(false)
      event.target.value = ''
    }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const response = await fetch('/api/properties/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: form.get('title'), category: form.get('category'), country: form.get('country'), location: form.get('location'), price: form.get('price'), bedrooms: form.get('bedrooms'), guests: form.get('guests'), description: form.get('description'), contactEmail: form.get('contactEmail'), amenities: amenityState, images: [...images, ...uploadedImages] }) })
    if (response.ok) setSubmitted(true)
  }

  return <main className="ge-list-page min-h-screen bg-[#0a0a0a] text-[#f2f0e8]">
    <nav className="border-b border-white/[.08] bg-[#0a0a0a]">
      <div className="mx-auto max-w-6xl px-5 py-4"><div className="flex items-center justify-between"><Link href="/" className="ge-brand">Global Estates.</Link><div className="hidden items-center gap-6 text-xs text-white/50 md:flex"><Link href="/">Home</Link><Link href="/?category=Rent">Rent</Link><Link href="/?category=Vacation">Vacation</Link><Link href="/?category=Outings">Outings</Link><Link href="/?category=Land">Land</Link></div><div className="flex items-center gap-2"><a href="#listing-form" className="ge-outline-button">+ List your property</a><Link href="/" className="ge-solid-button">My dashboard</Link><button type="button" aria-label="Toggle navigation menu" aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)} className="ge-menu-button">{menuOpen ? '×' : '☰'}</button></div></div>{menuOpen && <div className="ge-mobile-menu md:hidden"><Link href="/" onClick={() => setMenuOpen(false)}>Home</Link><Link href="/?category=Rent" onClick={() => setMenuOpen(false)}>Rent</Link><Link href="/?category=Vacation" onClick={() => setMenuOpen(false)}>Vacation</Link><Link href="/?category=Outings" onClick={() => setMenuOpen(false)}>Outings</Link><Link href="/?category=Land" onClick={() => setMenuOpen(false)}>Land</Link><a href="#listing-form" onClick={() => setMenuOpen(false)}>+ List your property</a></div>}</div>
    </nav>
    <div className="mx-auto max-w-6xl px-5 pb-20 pt-8"><a href="/" className="ge-back-link">&lt; Back to dashboard</a><header className="ge-list-hero"><div><p className="ge-eyebrow">OPEN YOUR DOORS TO THE WORLD</p><h1>Every place has a story.</h1><p>Tell yours. Create your free property listing.</p></div><span className="ge-plan-badge">Free listing - KSh 0</span></header>
      <form id="listing-form" onSubmit={submit} className="ge-list-form">
        <section><div className="ge-form-heading"><span>01</span><div><h2>The essentials</h2><p>A great first impression starts here.</p></div></div><label>Property title<input name="title" required placeholder="e.g. A peaceful garden villa in Diani" /></label><div className="ge-form-grid"><label>Category<select name="category" defaultValue="Rent"><option>Rent</option><option>Vacation</option><option>Outings</option><option>Land</option></select></label><label>Country<select name="country" defaultValue="Kenya">{countries.map((country) => <option key={country}>{country}</option>)}</select></label><label>City / location<input required name="location" placeholder="e.g. Diani Beach" /></label><label>Price in KSh per month<input required type="number" min="0" name="price" placeholder="0.00" /></label><label>Bedrooms<input name="bedrooms" type="number" min="0" defaultValue="1" /></label><label>Maximum guests<input name="guests" type="number" min="1" defaultValue="2" /></label></div><label>Description<textarea name="description" required placeholder="What makes your place special? Share the space, surroundings, and little details guests will love." /></label></section>
        <section><div className="ge-form-heading"><span>02</span><div><h2>The little extras</h2><p>What can guests look forward to?</p></div></div><div className="ge-amenity-grid">{amenities.map((amenity) => <label key={amenity} className="ge-amenity"><input type="checkbox" checked={amenityState.includes(amenity)} onChange={() => setAmenityState((current) => current.includes(amenity) ? current.filter((item) => item !== amenity) : [...current, amenity])} /><span>{amenity}</span></label>)}</div></section>
        <section><div className="ge-form-heading"><span>03</span><div><h2>Let your place shine</h2><p>JPEG, PNG, or WebP - Up to 12 photos · 10 MB each</p></div></div><label className="ge-upload-method">Upload method<select defaultValue="device"><option value="device">Upload from device</option><option value="url">Paste an HTTPS image URL</option></select></label><label className="ge-upload-box"><span className="ge-upload-icon">+</span><strong>Choose property photos</strong><small>{uploading ? 'Uploading your photos...' : 'Your first photo will be the cover image.'}</small><input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={handleFileChange} disabled={uploading} /></label>{uploadError && <p className="mt-2 text-xs text-red-300" role="alert">{uploadError}</p>}{uploadedImages.length > 0 && <div className="ge-image-previews" aria-label="Selected property photos">{uploadedImages.map((src, index) => <img key={`${src}-${index}`} src={src} alt={`Selected property photo ${index + 1}`} />)}</div>}<div className="ge-image-add"><input value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} placeholder="Or paste an HTTPS image URL" /><button type="button" onClick={addImage}>+ Add</button></div>{images.length > 0 && <p className="text-xs text-emerald-300">{images.length} image URL{images.length === 1 ? '' : 's'} added</p>}</section>
        <section><div className="ge-form-heading"><span>04</span><div><h2>Make the connection</h2><p>Your contact email is private. Inquiries arrive in your dashboard.</p></div></div><label>Contact email<input name="contactEmail" required type="email" defaultValue="masoudhussein2002@gmail.com" /></label></section>
        <button className="ge-submit-button" type="submit">{submitted ? 'Property saved' : 'Save and list property'}</button>
      </form>
    </div><div className="ge-progress-line" />
  </main>
}
