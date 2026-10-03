import { NextResponse } from 'next/server'
import { getPropertiesTable, query, serializeProperty } from '@/lib/db'
import { requireSession } from '@/lib/server-auth'

export async function GET() {
  try {
    const session = await requireSession()
    await getPropertiesTable()
    const userId = session.user.id
    const [properties, bookings, leads, transactions, subscriptions] = await Promise.all([
      query('SELECT * FROM properties WHERE host_id = $1 AND deleted_at IS NULL ORDER BY created_at DESC', [userId]),
      query('SELECT b.* FROM bookings b JOIN properties p ON p.id = b.property_id WHERE p.host_id = $1 ORDER BY b.created_at DESC', [userId]),
      query('SELECT l.id, l.property_id, l.buyer_name, l.buyer_email, l.message, l.status, l.referral_fee, l.created_at FROM leads l JOIN properties p ON p.id = l.property_id WHERE p.host_id = $1 ORDER BY l.created_at DESC LIMIT 100', [userId]),
      query('SELECT t.id, t.kind, t.amount, t.platform_revenue, t.currency, t.status, t.receipt_reference, t.created_at FROM transactions t JOIN bookings b ON b.id = t.booking_id JOIN properties p ON p.id = b.property_id WHERE p.host_id = $1 ORDER BY t.created_at DESC LIMIT 100', [userId]),
      query('SELECT id, plan_id, status, current_period_start, current_period_end FROM subscriptions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20', [userId]),
    ])
    const paid = bookings.rows.filter((row) => row.payment_status === 'paid')
    const revenue = paid.reduce((sum, row) => sum + Number(row.amount || 0), 0)
    return NextResponse.json({
      properties: properties.rows.map(serializeProperty),
      bookings: bookings.rows,
      leads: leads.rows,
      transactions: transactions.rows,
      subscriptions: subscriptions.rows,
      stats: { properties: properties.rowCount ?? 0, revenue, earnings: revenue, pendingPayouts: paid.reduce((sum, row) => sum + Number(row.host_payout || 0), 0), enquiries: leads.rowCount ?? 0, transactions: transactions.rowCount ?? 0 },
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') return NextResponse.json({ error: 'Login required.' }, { status: 401 })
    console.error('[v0] dashboard data failed', error)
    return NextResponse.json({ error: 'Unable to load dashboard data.' }, { status: 500 })
  }
}
