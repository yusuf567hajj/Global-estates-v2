import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { query } from '@/lib/db'

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null

export async function POST(request: NextRequest) {
  try {
    if (!stripe) return NextResponse.json({ error: 'Payments are not configured.' }, { status: 503 })
    const body = await request.json()
    const propertyId = typeof body.propertyId === 'string' ? body.propertyId : ''
    const planId = typeof body.planId === 'string' ? body.planId : ''
    const email = typeof body.email === 'string' ? body.email.trim() : ''
    if (!propertyId || !planId || !/^\S+@\S+\.\S+$/.test(email)) return NextResponse.json({ error: 'Choose a plan and provide a valid email.' }, { status: 400 })
    const plan = await query<{ id: string; name: string; price: string; duration_days: number }>('SELECT id, name, price, duration_days FROM listing_plans WHERE id = $1 AND active = true LIMIT 1', [planId])
    const property = await query<{ id: string; title: string }>('SELECT id, title FROM properties WHERE id = $1 AND status = \'published\' LIMIT 1', [propertyId])
    const selected = plan.rows[0]
    const listing = property.rows[0]
    if (!selected || !listing) return NextResponse.json({ error: 'Listing or plan not found.' }, { status: 404 })
    const amount = Number(selected.price)
    const receiptReference = `GE-${Date.now().toString(36).toUpperCase()}`
    const transaction = await query<{ id: string }>('INSERT INTO transactions (property_id, kind, amount, platform_revenue, currency, status, receipt_reference, metadata) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id', [propertyId, 'listing', amount, amount, 'KES', 'pending', receiptReference, JSON.stringify({ planId, durationDays: selected.duration_days })])
    const origin = request.headers.get('origin') || process.env.V0_RUNTIME_URL || 'http://localhost:3000'
    const session = await stripe.checkout.sessions.create({ mode: 'payment', customer_email: email, line_items: [{ price_data: { currency: 'kes', product_data: { name: `${selected.name} promotion — ${listing.title}` }, unit_amount: Math.max(100, Math.round(amount * 100)) }, quantity: 1 }], success_url: `${origin}/dashboard?payment=success&session_id={CHECKOUT_SESSION_ID}`, cancel_url: `${origin}/dashboard?payment=cancelled`, metadata: { transactionId: transaction.rows[0].id, propertyId, planId, kind: 'listing' } })
    await query('UPDATE transactions SET stripe_session_id = $1 WHERE id = $2', [session.id, transaction.rows[0].id])
    return NextResponse.json({ checkoutUrl: session.url, receiptReference })
  } catch (error) {
    console.error('[v0] Listing checkout failed', error)
    return NextResponse.json({ error: 'Promotion payment could not be started.' }, { status: 500 })
  }
}
