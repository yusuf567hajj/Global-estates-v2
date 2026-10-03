import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { query } from '@/lib/db'

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null

export async function POST(request: NextRequest) {
  try {
    if (!stripe) return NextResponse.json({ error: 'Payments are not configured.' }, { status: 503 })
    const body = await request.json()
    const planId = typeof body.planId === 'string' ? body.planId : ''
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    if (!planId || !/^\S+@\S+\.\S+$/.test(email)) return NextResponse.json({ error: 'Choose a plan and provide a valid email.' }, { status: 400 })
    const plan = await query<{ id: string; name: string; price: string }>('SELECT id, name, price FROM subscription_plans WHERE id = $1 AND active = true LIMIT 1', [planId])
    const selected = plan.rows[0]
    if (!selected) return NextResponse.json({ error: 'Subscription plan not found.' }, { status: 404 })
    const user = await query<{ id: string }>('SELECT id FROM "user" WHERE lower(email) = $1 LIMIT 1', [email])
    if (!user.rows[0]) return NextResponse.json({ error: 'Create an account before subscribing.' }, { status: 401 })
    const amount = Number(selected.price)
    const receiptReference = `GE-${Date.now().toString(36).toUpperCase()}`
    const transaction = await query<{ id: string }>('INSERT INTO transactions (user_id, kind, amount, platform_revenue, currency, status, receipt_reference, metadata) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id', [user.rows[0].id, 'subscription', amount, amount, 'KES', 'pending', receiptReference, JSON.stringify({ planId })])
    const origin = request.headers.get('origin') || process.env.V0_RUNTIME_URL || 'http://localhost:3000'
    const session = await stripe.checkout.sessions.create({ mode: 'subscription', customer_email: email, line_items: [{ price_data: { currency: 'kes', product_data: { name: `${selected.name} agent subscription` }, unit_amount: Math.max(0, Math.round(amount * 100)), recurring: { interval: 'month' } }, quantity: 1 }], success_url: `${origin}/dashboard?subscription=success`, cancel_url: `${origin}/dashboard?subscription=cancelled`, metadata: { kind: 'subscription', transactionId: transaction.rows[0].id, planId, userId: user.rows[0].id } })
    await query('UPDATE transactions SET stripe_session_id = $1 WHERE id = $2', [session.id, transaction.rows[0].id])
    return NextResponse.json({ checkoutUrl: session.url, receiptReference })
  } catch (error) {
    console.error('[v0] Subscription checkout failed', error)
    return NextResponse.json({ error: 'Subscription payment could not be started.' }, { status: 500 })
  }
}
