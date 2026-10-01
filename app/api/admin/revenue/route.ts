import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET() {
  try {
    const [transactions, plans, subscriptions, properties, bookings, settings, featured] = await Promise.all([
      query('SELECT * FROM transactions ORDER BY created_at DESC LIMIT 100'),
      query('SELECT * FROM listing_plans ORDER BY price'),
      query('SELECT * FROM subscription_plans ORDER BY price'),
      query("SELECT COUNT(*)::int AS count FROM properties WHERE status = 'published'"),
      query('SELECT COUNT(*)::int AS count FROM bookings'),
      query('SELECT booking_commission FROM monetization_settings WHERE id = 1'),
      query("SELECT COUNT(*)::int AS count FROM property_promotions WHERE active = true AND ends_at > now()"),
    ])
    const paidByKind = transactions.rows.filter((row) => row.status === 'paid').reduce((groups, row) => { const kind = String(row.kind || 'other'); groups[kind] = (groups[kind] || 0) + Number(row.platform_revenue || row.amount || 0); return groups }, {} as Record<string, number>)
    const successful = transactions.rows.filter((row) => row.status === 'paid')
    const total = successful.reduce((sum, row) => sum + Number(row.amount || 0), 0)
    const today = new Date().toISOString().slice(0, 10)
    const revenueToday = successful.filter((row) => String(row.created_at).startsWith(today)).reduce((sum, row) => sum + Number(row.amount || 0), 0)
    return NextResponse.json({
      transactions: transactions.rows,
      listingPlans: plans.rows,
      subscriptionPlans: subscriptions.rows,
      stats: { totalRevenue: total, revenueToday, revenueThisMonth: total, transactions: transactions.rowCount ?? 0, successful: successful.length, failed: transactions.rows.filter((row) => row.status === 'failed').length, pending: transactions.rows.filter((row) => row.status === 'pending').length, featuredProperties: featured.rows[0]?.count ?? 0, properties: properties.rows[0]?.count ?? 0, bookings: bookings.rows[0]?.count ?? 0, bookingCommissions: paidByKind.booking || 0, listingRevenue: paidByKind.listing || 0, subscriptionRevenue: paidByKind.subscription || 0, referralRevenue: paidByKind.referral || 0, commission: Number(settings.rows[0]?.booking_commission ?? 10) },
    })
  } catch (error) {
    console.error('[v0] admin revenue failed', error)
    return NextResponse.json({ error: 'Unable to load admin revenue.' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    if (body.type === 'commission') {
      const commission = Number(body.value)
      if (!Number.isFinite(commission) || commission < 0 || commission > 100) return NextResponse.json({ error: 'Commission must be between 0 and 100.' }, { status: 400 })
      await query('UPDATE monetization_settings SET booking_commission = $1, updated_at = now() WHERE id = 1', [commission])
      return NextResponse.json({ ok: true })
    }
    if (body.type === 'listing-plan') {
      await query('UPDATE listing_plans SET price = $1, active = $2, updated_at = now() WHERE id = $3', [Number(body.price), Boolean(body.active), String(body.id)])
      return NextResponse.json({ ok: true })
    }
    if (body.type === 'subscription-plan') {
      await query('UPDATE subscription_plans SET price = $1, listing_limit = $2, featured_limit = $3, analytics = $4, active = $5, updated_at = now() WHERE id = $6', [Number(body.price), Number(body.listingLimit), Number(body.featuredLimit), Boolean(body.analytics), Boolean(body.active), String(body.id)])
      return NextResponse.json({ ok: true })
    }
    return NextResponse.json({ error: 'Unsupported admin update.' }, { status: 400 })
  } catch (error) {
    console.error('[v0] admin update failed', error)
    return NextResponse.json({ error: 'Unable to save admin settings.' }, { status: 500 })
  }
}
