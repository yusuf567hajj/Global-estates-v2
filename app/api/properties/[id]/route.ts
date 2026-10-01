import { NextRequest, NextResponse } from 'next/server'
import { getPropertiesTable, query, serializeProperty } from '@/lib/db'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await getPropertiesTable()
    const { id } = await params
    const result = await query(
      `SELECT id, title, category, location, country, description, price, bedrooms, guests, amenities, images, listing_plan, status, created_at
       FROM properties WHERE id = $1 AND status = 'published' LIMIT 1`,
      [id],
    )
    if (!result.rows[0]) return NextResponse.json({ error: 'Property not found.' }, { status: 404 })
    return NextResponse.json({ property: serializeProperty(result.rows[0]) })
  } catch (error) {
    console.error('[v0] PostgreSQL property detail GET failed', error)
    return NextResponse.json({ error: 'Unable to load property details.' }, { status: 500 })
  }
}
