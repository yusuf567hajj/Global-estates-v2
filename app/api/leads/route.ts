import { NextRequest, NextResponse } from 'next/server'
import { getPropertiesTable, query } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    await getPropertiesTable()
    const body = await request.json()
    const propertyId = String(body.propertyId || '').trim()
    const buyerName = String(body.buyerName || '').trim()
    const buyerEmail = String(body.buyerEmail || '').trim().toLowerCase()
    const message = String(body.message || '').trim()
    if (!propertyId || !buyerName || !/^\S+@\S+\.\S+$/.test(buyerEmail) || message.length < 10) {
      return NextResponse.json({ error: 'Property, name, valid email, and a message of at least 10 characters are required.' }, { status: 400 })
    }
    const property = await query<{ host_id: string | null }>('SELECT host_id FROM properties WHERE id = $1 AND status = $2 LIMIT 1', [propertyId, 'published'])
    if (!property.rows[0]) return NextResponse.json({ error: 'Property not found.' }, { status: 404 })
    const lead = await query<{ id: string; created_at: string }>('INSERT INTO leads (property_id, owner_id, buyer_name, buyer_email, message) VALUES ($1,$2,$3,$4,$5) RETURNING id, created_at', [propertyId, property.rows[0].host_id, buyerName, buyerEmail, message])
    return NextResponse.json({ lead: lead.rows[0] }, { status: 201 })
  } catch (error) {
    console.error('[v0] lead capture failed', error)
    return NextResponse.json({ error: 'Unable to send enquiry.' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Authentication is required to view leads.' }, { status: 401 })
}
