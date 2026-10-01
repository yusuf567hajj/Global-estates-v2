import { NextResponse } from 'next/server'
import { getPropertiesTable, query, serializeProperty } from '@/lib/db'

export async function GET() {
  try {
    await getPropertiesTable()
    const [properties, bookings] = await Promise.all([
      query('SELECT * FROM properties ORDER BY created_at DESC'),
      query('SELECT * FROM bookings ORDER BY created_at DESC'),
    ])
    const paid = bookings.rows.filter((row) => row.payment_status === 'paid')
    const revenue = paid.reduce((sum, row) => sum + Number(row.amount || 0), 0)
    return NextResponse.json({
      properties: properties.rows.map(serializeProperty),
      bookings: bookings.rows,
      stats: { properties: properties.rowCount ?? 0, revenue, earnings: revenue, pendingPayouts: paid.reduce((sum, row) => sum + Number(row.host_payout || 0), 0) },
    })
  } catch (error) {
    console.error('[v0] dashboard data failed', error)
    return NextResponse.json({ error: 'Unable to load dashboard data.' }, { status: 500 })
  }
}
