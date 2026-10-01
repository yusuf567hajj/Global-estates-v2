import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams
    const values: (string | number)[] = []
    const where: string[] = ["status = 'published'"]
    const add = (value: string | number) => { values.push(value); return `$${values.length}` }
    const location = params.get('location')?.trim()
    const country = params.get('country')?.trim()
    const category = params.get('category')?.trim()
    const minPrice = params.get('minPrice')
    const maxPrice = params.get('maxPrice')
    const bedrooms = params.get('bedrooms')
    const guests = params.get('guests')
    if (location) { const locationValue = `%${location}%`; const locationPlaceholder = add(locationValue); const titlePlaceholder = add(locationValue); where.push(`(location ILIKE ${locationPlaceholder} OR title ILIKE ${titlePlaceholder})`) }
    if (country && country !== 'All countries') where.push(`country = ${add(country)}`)
    if (category && category !== 'All') where.push(`category = ${add(category)}`)
    if (minPrice) where.push(`price >= ${add(Number(minPrice))}`)
    if (maxPrice) where.push(`price <= ${add(Number(maxPrice))}`)
    if (bedrooms) where.push(`bedrooms >= ${add(Number(bedrooms))}`)
    if (guests) where.push(`guests >= ${add(Number(guests))}`)
    const sort = params.get('sort') === 'price-asc' ? 'price ASC' : params.get('sort') === 'price-desc' ? 'price DESC' : 'created_at DESC'
    const result = await pool.query(`SELECT id, title, category, location, country, description, price::float, bedrooms, guests, amenities, images, listing_plan, created_at FROM properties WHERE ${where.join(' AND ')} ORDER BY ${sort} LIMIT 100`, values)
    return NextResponse.json({ properties: result.rows })
  } catch (error) {
    console.error('[v0] properties GET failed', error)
    return NextResponse.json({ error: 'Unable to load properties. Please try again.' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const required = ['title', 'category', 'location', 'country', 'description', 'price']
    if (required.some((key) => !body[key] && body[key] !== 0)) return NextResponse.json({ error: 'Please complete all required fields.' }, { status: 400 })
    if (!['Rent', 'Vacation', 'Outings', 'Land'].includes(body.category)) return NextResponse.json({ error: 'Invalid category.' }, { status: 400 })
    const result = await pool.query(`INSERT INTO properties (title, category, location, country, description, price, bedrooms, guests, amenities, images, listing_plan) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id, title, category, location, country, description, price::float, bedrooms, guests, amenities, images, listing_plan, created_at`, [body.title.trim(), body.category, body.location.trim(), body.country, body.description.trim(), Number(body.price), Number(body.bedrooms || 0), Number(body.guests || 1), JSON.stringify(body.amenities || []), JSON.stringify(body.images || []), body.listingPlan || 'Free'])
    return NextResponse.json({ property: result.rows[0] }, { status: 201 })
  } catch (error) {
    console.error('[v0] properties POST failed', error)
    return NextResponse.json({ error: 'Property could not be saved. Please try again.' }, { status: 500 })
  }
}
