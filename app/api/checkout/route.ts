import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getPropertiesTable, pool, query } from '@/lib/db'

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null

export async function POST(request: NextRequest) {
  try {
    if (!stripe) return NextResponse.json({ error: 'Payments are not configured.' }, { status: 503 })
    await getPropertiesTable()
    const body = await request.json()
    const propertyId = typeof body.propertyId === 'string' ? body.propertyId : ''
    const customerName = typeof body.customerName === 'string' ? body.customerName.trim() : ''
    const customerEmail = typeof body.customerEmail === 'string' ? body.customerEmail.trim() : ''
    const checkIn = typeof body.checkIn === 'string' ? body.checkIn : ''
    const checkOut = typeof body.checkOut === 'string' ? body.checkOut : ''
    const guests = Number(body.guests)
    const start = new Date(`${checkIn}T00:00:00Z`)
    const end = new Date(`${checkOut}T00:00:00Z`)
    if (!propertyId || !customerName || !/^\S+@\S+\.\S+$/.test(customerEmail) || !checkIn || !checkOut || !Number.isInteger(guests) || guests < 1 || end <= start) {
      return NextResponse.json({ error: 'Please provide valid guest and booking details.' }, { status: 400 })
    }
    const property = await query<{ id: string; title: string; category: string; price: string; guests: number }>(
      'SELECT id, title, category, price, guests FROM properties WHERE id = $1 AND status = \'published\' LIMIT 1', [propertyId],
    )
    const listing = property.rows[0]
    if (!listing) return NextResponse.json({ error: 'Property not found.' }, { status: 404 })
    if (guests > Number(listing.guests)) return NextResponse.json({ error: 'This property cannot accommodate that many guests.' }, { status: 400 })
    const nights = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000))
    const amount = Math.round(Number(listing.price) * nights)
    const settings = await query<{ value: Record<string, unknown> }>('SELECT value FROM platform_settings WHERE key = $1', ['booking_rules'])
    const commissionRate = Number(settings.rows[0]?.value?.commissionRate ?? 10)
    const cleaningFee = 0
    const guestServiceFee = 0
    const taxes = 0
    const grossAmount = amount + cleaningFee + guestServiceFee + taxes
    const platformFee = Math.round(grossAmount * commissionRate / 100)
    const hostPayout = grossAmount - platformFee
    const client = await pool.connect()
    let bookingId = ''
    const receiptReference = `GE-${Date.now().toString(36).toUpperCase()}`
    try {
      await client.query('BEGIN')
      const conflicts = await client.query('SELECT id FROM bookings WHERE property_id = $1 AND status IN (\'pending_payment\', \'confirmed\', \'checked_in\', \'completed\', \'disputed\') AND check_in < $3 AND check_out > $2 FOR UPDATE', [propertyId, checkIn, checkOut])
      if (conflicts.rows.length) { await client.query('ROLLBACK'); return NextResponse.json({ error: 'Those dates are no longer available.' }, { status: 409 }) }
      const booking = await client.query<{ id: string }>('INSERT INTO bookings (property_id, customer_name, customer_email, check_in, check_out, guests, amount, platform_fee, host_payout, booking_reference, status, accommodation_subtotal, cleaning_fee, guest_service_fee, taxes, commission_rate, payout_eligible_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,\'pending_payment\',$7,$11,$12,$13,$14,$5::date + interval \'1 day\') RETURNING id', [propertyId, customerName, customerEmail, checkIn, checkOut, guests, grossAmount, platformFee, hostPayout, receiptReference, cleaningFee, guestServiceFee, taxes, commissionRate])
      bookingId = booking.rows[0].id
      await client.query('INSERT INTO booking_financial_events (booking_id, event_type, amount, metadata) VALUES ($1,$2,$3,$4)', [bookingId, 'booking_created', grossAmount, JSON.stringify({ commissionRate, platformFee, hostPayout })])
      await client.query('INSERT INTO transactions (booking_id, kind, amount, platform_revenue, currency, status, receipt_reference, metadata) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)', [bookingId, 'booking', grossAmount, platformFee, 'KES', 'pending', receiptReference, JSON.stringify({ commissionRate, grossAmount, hostPayout })])
      await client.query('COMMIT')
    } catch (error) { await client.query('ROLLBACK'); throw error } finally { client.release() }
    const origin = request.headers.get('origin') || process.env.V0_RUNTIME_URL || 'http://localhost:3000'
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: customerEmail,
      line_items: [{ price_data: { currency: 'kes', product_data: { name: listing.title }, unit_amount: Math.max(100, amount * 100) }, quantity: 1 }],
      success_url: `${origin}/?booking=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/?booking=cancelled`,
      metadata: { bookingId },
    })
    await query('UPDATE bookings SET stripe_session_id = $1 WHERE id = $2', [session.id, bookingId])
    return NextResponse.json({ checkoutUrl: session.url, bookingId })
  } catch (error) {
    console.error('[v0] Checkout creation failed', error)
    return NextResponse.json({ error: 'Payment could not be started.' }, { status: 500 })
  }
}
