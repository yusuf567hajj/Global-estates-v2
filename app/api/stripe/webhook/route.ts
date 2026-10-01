import { headers } from 'next/headers'
import Stripe from 'stripe'
import { getPropertiesTable, query } from '@/lib/db'

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null

export async function POST(request: Request) {
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) return new Response('Webhook not configured', { status: 503 })
  const signature = (await headers()).get('stripe-signature')
  if (!signature) return new Response('Missing signature', { status: 400 })
  const payload = await request.text()
  let event: Stripe.Event
  try { event = stripe.webhooks.constructEvent(payload, signature, process.env.STRIPE_WEBHOOK_SECRET) } catch { return new Response('Invalid signature', { status: 400 }) }
  await getPropertiesTable()
  if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
    const session = event.data.object as Stripe.Checkout.Session
    if (session.payment_status === 'paid' || event.type === 'checkout.session.async_payment_succeeded') {
      if (session.metadata?.kind === 'subscription' && session.metadata.transactionId) {
        await query('UPDATE transactions SET status = $1, stripe_session_id = $2, updated_at = now() WHERE id = $3', ['paid', session.id, session.metadata.transactionId])
        await query('UPDATE subscriptions SET status = $1, stripe_subscription_id = $2, current_period_end = now() + interval \'1 month\', transaction_id = $3, updated_at = now() WHERE user_id = $4 AND status = $5', ['active', typeof session.subscription === 'string' ? session.subscription : null, session.metadata.transactionId, session.metadata.userId, 'active'])
        await query('INSERT INTO subscriptions (user_id, plan_id, status, current_period_end, stripe_subscription_id, transaction_id) VALUES ($1,$2,$3,now() + interval \'1 month\',$4,$5) ON CONFLICT (stripe_subscription_id) DO NOTHING', [session.metadata.userId, session.metadata.planId, 'active', typeof session.subscription === 'string' ? session.subscription : null, session.metadata.transactionId])
      } else if (session.metadata?.kind === 'listing' && session.metadata.transactionId) {
        const promotion = await query<{ duration_days: number }>('SELECT duration_days FROM listing_plans WHERE id = $1 LIMIT 1', [session.metadata.planId])
        const durationDays = Number(promotion.rows[0]?.duration_days || 14)
        await query('UPDATE transactions SET status = $1, stripe_session_id = $2, updated_at = now() WHERE id = $3', ['paid', session.id, session.metadata.transactionId])
        await query('INSERT INTO property_promotions (property_id, plan_id, ends_at, active, transaction_id) VALUES ($1,$2,now() + ($3 || \' days\')::interval,true,$4)', [session.metadata.propertyId, session.metadata.planId, durationDays, session.metadata.transactionId])
        await query('UPDATE properties SET listing_plan = $1 WHERE id = $2', [session.metadata.planId, session.metadata.propertyId])
      } else {
        const bookingId = session.metadata?.bookingId ?? ''
        await query('UPDATE bookings SET payment_status = $1, payment_intent_id = $2 WHERE id = $3', ['paid', typeof session.payment_intent === 'string' ? session.payment_intent : null, bookingId])
        await query('UPDATE transactions SET status = $1, stripe_session_id = $2, updated_at = now() WHERE booking_id = $3 AND status = $4', ['paid', session.id, bookingId, 'pending'])
      }
    }
  }
  if (event.type === 'checkout.session.expired') {
    const session = event.data.object as Stripe.Checkout.Session
    await query('UPDATE bookings SET payment_status = $1 WHERE id = $2 AND payment_status = $3', ['expired', session.metadata?.bookingId ?? '', 'pending'])
  }
  return Response.json({ received: true })
}
