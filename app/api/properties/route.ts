import { NextRequest, NextResponse } from 'next/server'
import { propertiesCollection } from '@/lib/db'

const categories = ['Rent', 'Vacation', 'Outings', 'Land'] as const

function numberParam(value: string | null) {
  if (!value) return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

function serialize(property: Record<string, unknown>) {
  return { ...property, id: String(property._id), _id: undefined, createdAt: property.createdAt instanceof Date ? property.createdAt.toISOString() : property.createdAt }
}

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams
    const location = params.get('location')?.trim()
    const country = params.get('country')?.trim()
    const category = params.get('category')?.trim()
    const minPrice = numberParam(params.get('minPrice'))
    const maxPrice = numberParam(params.get('maxPrice'))
    const bedrooms = numberParam(params.get('bedrooms'))
    const guests = numberParam(params.get('guests'))
    const query: Record<string, unknown> = { status: 'published' }
    if (location) query.$or = [{ location: { $regex: location, $options: 'i' } }, { title: { $regex: location, $options: 'i' } }]
    if (country && country !== 'All countries') query.country = country
    if (category && category !== 'All') query.category = category
    if (minPrice !== undefined || maxPrice !== undefined) query.price = { ...(minPrice !== undefined ? { $gte: minPrice } : {}), ...(maxPrice !== undefined ? { $lte: maxPrice } : {}) }
    if (bedrooms !== undefined) query.bedrooms = { $gte: bedrooms }
    if (guests !== undefined) query.guests = { $gte: guests }
    const sort = params.get('sort') === 'price-asc' ? { price: 1 as const } : params.get('sort') === 'price-desc' ? { price: -1 as const } : { createdAt: -1 as const }
    const collection = await propertiesCollection()
    const properties = await collection.find(query).sort(sort).limit(100).toArray()
    return NextResponse.json({ properties: properties.map((property) => serialize(property as Record<string, unknown>)) })
  } catch (error) {
    console.error('[v0] properties GET failed', error)
    return NextResponse.json({ error: 'Unable to load properties. Please try again.' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const title = typeof body.title === 'string' ? body.title.trim() : ''
    const location = typeof body.location === 'string' ? body.location.trim() : ''
    const country = typeof body.country === 'string' ? body.country.trim() : ''
    const description = typeof body.description === 'string' ? body.description.trim() : ''
    const price = Number(body.price)
    if (!title || !location || !country || !description || !Number.isFinite(price) || price < 0) return NextResponse.json({ error: 'Please complete all required fields.' }, { status: 400 })
    if (!categories.includes(body.category)) return NextResponse.json({ error: 'Invalid category.' }, { status: 400 })
    const property = { title, category: body.category, location, country, description, price, bedrooms: Math.max(0, Number(body.bedrooms) || 0), guests: Math.max(1, Number(body.guests) || 1), amenities: Array.isArray(body.amenities) ? body.amenities.filter((item: unknown) => typeof item === 'string').slice(0, 30) : [], images: Array.isArray(body.images) ? body.images.filter((item: unknown) => typeof item === 'string').slice(0, 12) : [], listingPlan: body.listingPlan || 'Free', status: 'published', createdAt: new Date() }
    const collection = await propertiesCollection()
    const result = await collection.insertOne(property)
    return NextResponse.json({ property: serialize({ ...property, _id: result.insertedId }) }, { status: 201 })
  } catch (error) {
    console.error('[v0] properties POST failed', error)
    return NextResponse.json({ error: 'Property could not be saved. Please try again.' }, { status: 500 })
  }
}
