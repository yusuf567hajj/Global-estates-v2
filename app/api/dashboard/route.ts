import { NextResponse } from 'next/server'
import { getPropertiesTable, query, serializeProperty } from '@/lib/db'

export async function GET() {
  try {
    await getPropertiesTable()
    const [properties, bookings, leads, transactions, subscriptions] = await Promise.all([
      query('SELECT * FROM properties ORDER BY created_at DESC'),
      query('SELECT * FROM bookings ORDER BY created_at DESC'),
      query('SELECT id, property_id, buyer_name, buyer_email, message, status, referral_fee, created_at FROM leads ORDER BY created_at DESC LIMIT 100'),
      query('SELECT id, kind, amount, platform_revenue, currency, status, receipt_reference, created_at FROM transactions ORDER BY created_at DESC LIMIT 100'),
      query('SELECT id, plan_id, status, current_period_start, current_period_end FROM subscriptions ORDER BY created_at DESC LIMIT 20'),
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
    console.error('[v0] dashboard data failed', error)
    return NextResponse.json({ error: 'Unable to load dashboard data.' }, { status: 500 })
  }
}
