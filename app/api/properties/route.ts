import { NextRequest, NextResponse } from 'next/server'
import { getPropertiesTable, query, serializeProperty } from '@/lib/db'

const categories = ['Rent', 'Vacation', 'Outings', 'Land']
const num = (value: string | null) => value && Number.isFinite(Number(value)) ? Number(value) : undefined

export async function GET(request: NextRequest) {
  try {
    await getPropertiesTable()
    const p = request.nextUrl.searchParams
    const where: string[] = ["status = 'published'"]
    const values: unknown[] = []
    const add = (sql: string, value: unknown) => { values.push(value); where.push(sql.replace('?', `$${values.length}`)) }
    const location = p.get('location')?.trim()
    const country = p.get('country')?.trim()
    const category = p.get('category')?.trim()
    if (location) { values.push(`%${location}%`); where.push(`(location ILIKE $${values.length} OR title ILIKE $${values.length})`) }
    if (country && country !== 'All countries') add('country = ?', country)
    if (category && category !== 'All') add('category = ?', category)
    const minPrice = num(p.get('minPrice')); const maxPrice = num(p.get('maxPrice')); const bedrooms = num(p.get('bedrooms')); const guests = num(p.get('guests'))
    if (minPrice !== undefined) add('price >= ?', minPrice)
    if (maxPrice !== undefined) add('price <= ?', maxPrice)
    if (bedrooms !== undefined) add('bedrooms >= ?', bedrooms)
    if (guests !== undefined) add('guests >= ?', guests)
    const sort = p.get('sort') === 'price-asc' ? 'price ASC' : p.get('sort') === 'price-desc' ? 'price DESC' : 'created_at DESC'
    const result = await query(`SELECT id, title, category, location, country, description, price, bedrooms, guests, amenities, images, listing_plan, created_at FROM properties WHERE ${where.join(' AND ')} ORDER BY ${sort} LIMIT 100`, values)
    return NextResponse.json({ properties: result.rows.map(serializeProperty) })
  } catch (error) {
    console.error('[v0] PostgreSQL properties GET failed', error)
    return NextResponse.json({ error: 'Unable to load properties. Please try again.' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await getPropertiesTable()
    const body = await request.json()
    const title = typeof body.title === 'string' ? body.title.trim() : ''
    const location = typeof body.location === 'string' ? body.location.trim() : ''
    const country = typeof body.country === 'string' ? body.country.trim() : ''
    const description = typeof body.description === 'string' ? body.description.trim() : ''
    const price = Number(body.price)
    if (!title || !location || !country || !description || !Number.isFinite(price) || price < 0) return NextResponse.json({ error: 'Please complete all required fields.' }, { status: 400 })
    if (!categories.includes(body.category)) return NextResponse.json({ error: 'Invalid category.' }, { status: 400 })
    const result = await query(`INSERT INTO properties (title, category, location, country, description, price, bedrooms, guests, amenities, images, listing_plan, status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'published') RETURNING id, title, category, location, country, description, price, bedrooms, guests, amenities, images, listing_plan, created_at`, [title, body.category, location, country, description, price, Math.max(0, Number(body.bedrooms) || 0), Math.max(1, Number(body.guests) || 1), JSON.stringify(body.amenities || []), JSON.stringify(body.images || []), body.listingPlan || 'Free'])
    return NextResponse.json({ property: serializeProperty(result.rows[0]) }, { status: 201 })
  } catch (error) {
    console.error('[v0] PostgreSQL properties POST failed', error)
    return NextResponse.json({ error: 'Property could not be saved. Please try again.' }, { status: 500 })
  }
}
