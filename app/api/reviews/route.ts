import { NextRequest, NextResponse } from 'next/server'
import { getPropertiesTable, query } from '@/lib/db'
import { requireSession } from '@/lib/server-auth'

export async function GET(request: NextRequest) {
  const propertyId = new URL(request.url).searchParams.get('propertyId')
  if (!propertyId) return NextResponse.json({ error: 'Property is required.' }, { status: 400 })
  try {
    await getPropertiesTable()
    const result = await query('SELECT r.id, r.rating, r.review_text, r.created_at, r.reviewer_id AS reviewer_name FROM reviews r WHERE r.property_id = $1 AND r.status = \'published\' ORDER BY r.created_at DESC', [propertyId])
    return NextResponse.json({ reviews: result.rows })
  } catch (error) {
    console.error('[v0] reviews GET failed', error)
    return NextResponse.json({ error: 'Unable to load reviews.' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession()
    const body = await request.json()
    const bookingId = String(body.bookingId || '')
    const rating = Number(body.rating)
    const reviewText = String(body.reviewText || '').trim()
    if (!bookingId || !Number.isInteger(rating) || rating < 1 || rating > 5 || reviewText.length < 10 || reviewText.length > 2000) {
      return NextResponse.json({ error: 'Provide a rating from 1 to 5 and a review between 10 and 2,000 characters.' }, { status: 400 })
    }
    const eligible = await query<{ property_id: string }>(`SELECT property_id FROM bookings WHERE id = $1 AND customer_email = $2 AND status = 'completed' AND payment_status = 'paid' AND check_out < CURRENT_DATE LIMIT 1`, [bookingId, session.user.email])
    if (!eligible.rows[0]) return NextResponse.json({ error: 'Reviews are available after a completed paid stay.' }, { status: 403 })
    const result = await query('INSERT INTO reviews (booking_id, property_id, reviewer_id, rating, review_text) VALUES ($1,$2,$3,$4,$5) RETURNING id, rating, review_text, created_at', [bookingId, eligible.rows[0].property_id, session.user.id, rating, reviewText])
    return NextResponse.json({ review: result.rows[0] }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') return NextResponse.json({ error: 'Login required.' }, { status: 401 })
    if (error instanceof Error && /duplicate key/i.test(error.message)) return NextResponse.json({ error: 'You have already reviewed this stay.' }, { status: 409 })
    console.error('[v0] reviews POST failed', error)
    return NextResponse.json({ error: 'Unable to submit review.' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireSession()
    const body = await request.json()
    const id = String(body.id || '')
    const status = ['published', 'hidden'].includes(body.status) ? body.status : null
    if (!id || !status) return NextResponse.json({ error: 'Invalid moderation request.' }, { status: 400 })
    const result = await query('UPDATE reviews SET status = $1 WHERE id = $2 AND EXISTS (SELECT 1 FROM properties p JOIN bookings b ON b.property_id = p.id WHERE b.id = reviews.booking_id AND p.host_id = $3) RETURNING id', [status, id, session.user.id])
    if (!result.rows[0]) return NextResponse.json({ error: 'Review not found.' }, { status: 404 })
    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') return NextResponse.json({ error: 'Login required.' }, { status: 401 })
    console.error('[v0] reviews PATCH failed', error)
    return NextResponse.json({ error: 'Unable to update review.' }, { status: 500 })
  }
}
