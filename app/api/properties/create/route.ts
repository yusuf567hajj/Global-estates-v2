import { NextResponse } from 'next/server'
import { getPropertiesTable, query } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const title = typeof body.title === 'string' ? body.title.trim() : ''
    const location = typeof body.location === 'string' ? body.location.trim() : ''
    const country = typeof body.country === 'string' ? body.country.trim() : ''
    const category = typeof body.category === 'string' ? body.category.trim() : 'Rent'
    const description = typeof body.description === 'string' ? body.description.trim() : ''
    const price = Number(body.price)
    const bedrooms = Number(body.bedrooms)
    const guests = Number(body.guests)
    const amenities = Array.isArray(body.amenities) ? body.amenities.filter((item: unknown): item is string => typeof item === 'string').slice(0, 24) : []
    const images = Array.isArray(body.images) ? body.images.filter((item: unknown): item is string => typeof item === 'string' && item.startsWith('https://')).slice(0, 12) : []

    if (!title || !location || !country || !description || !Number.isFinite(price) || price < 0 || !Number.isInteger(bedrooms) || bedrooms < 0 || !Number.isInteger(guests) || guests < 1) {
      return NextResponse.json({ error: 'Please complete all required property details.' }, { status: 400 })
    }

    await getPropertiesTable()
    const result = await query<{ id: string }>(
      `INSERT INTO properties (title, category, location, country, description, price, bedrooms, guests, amenities, images, listing_plan, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10::jsonb, 'Free', 'published') RETURNING id`,
      [title, category, location, country, description, price, bedrooms, guests, JSON.stringify(amenities), JSON.stringify(images)],
    )
    return NextResponse.json({ id: result.rows[0]?.id }, { status: 201 })
  } catch (error) {
    console.error('[v0] property create failed', error)
    return NextResponse.json({ error: 'Unable to save your property right now.' }, { status: 500 })
  }
}
