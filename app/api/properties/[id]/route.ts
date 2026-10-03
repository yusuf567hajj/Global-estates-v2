import { NextRequest, NextResponse } from 'next/server'
import { getPropertiesTable, query, serializeProperty } from '@/lib/db'
import { requireSession } from '@/lib/server-auth'

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession()
    const { id } = await params
    const result = await query('UPDATE properties SET deleted_at = now(), status = \'archived\' WHERE id = $1 AND host_id = $2 AND deleted_at IS NULL RETURNING id', [id, session.user.id])
    if (!result.rows[0]) return NextResponse.json({ error: 'Property not found.' }, { status: 404 })
    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') return NextResponse.json({ error: 'Login required.' }, { status: 401 })
    console.error('[v0] property delete failed', error)
    return NextResponse.json({ error: 'Unable to delete property.' }, { status: 500 })
  }
}

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
