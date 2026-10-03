import { NextRequest, NextResponse } from 'next/server'
import { getPropertiesTable, query } from '@/lib/db'
import { requireSession } from '@/lib/server-auth'

export async function GET() {
  try {
    const session = await requireSession()
    await getPropertiesTable()
    const result = await query('SELECT f.property_id, f.created_at FROM favorites f JOIN properties p ON p.id = f.property_id WHERE f.user_id = $1 AND p.deleted_at IS NULL ORDER BY f.created_at DESC', [session.user.id])
    return NextResponse.json({ favorites: result.rows })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') return NextResponse.json({ error: 'Login required.' }, { status: 401 })
    console.error('[v0] favorites read failed', error)
    return NextResponse.json({ error: 'Unable to load saved properties.' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession()
    await getPropertiesTable()
    const body = await request.json()
    const propertyId = String(body.propertyId || '')
    if (!/^[0-9a-f-]{36}$/i.test(propertyId)) return NextResponse.json({ error: 'Invalid property.' }, { status: 400 })
    const property = await query('SELECT id FROM properties WHERE id = $1 AND status = \'published\' AND deleted_at IS NULL LIMIT 1', [propertyId])
    if (!property.rows[0]) return NextResponse.json({ error: 'Property not found.' }, { status: 404 })
    const result = await query('INSERT INTO favorites (user_id, property_id) VALUES ($1, $2) ON CONFLICT (user_id, property_id) DO NOTHING RETURNING property_id', [session.user.id, propertyId])
    return NextResponse.json({ saved: Boolean(result.rows[0]) || true })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') return NextResponse.json({ error: 'Login required.' }, { status: 401 })
    console.error('[v0] favorite save failed', error)
    return NextResponse.json({ error: 'Unable to save property.' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireSession()
    const propertyId = new URL(request.url).searchParams.get('propertyId')
    if (!propertyId || !/^[0-9a-f-]{36}$/i.test(propertyId)) return NextResponse.json({ error: 'Invalid property.' }, { status: 400 })
    await query('DELETE FROM favorites WHERE user_id = $1 AND property_id = $2', [session.user.id, propertyId])
    return NextResponse.json({ saved: false })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') return NextResponse.json({ error: 'Login required.' }, { status: 401 })
    console.error('[v0] favorite removal failed', error)
    return NextResponse.json({ error: 'Unable to remove saved property.' }, { status: 500 })
  }
}
