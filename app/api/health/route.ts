import { NextResponse } from 'next/server'
import { getPropertiesTable, query } from '@/lib/db'

export async function GET() {
  try {
    await getPropertiesTable()
    await query('SELECT 1')
    return NextResponse.json({ postgresql: 'configured', database: 'available', stripe: Boolean(process.env.STRIPE_SECRET_KEY), platformFee: '10% for vacation and outings' })
  } catch {
    return NextResponse.json({ postgresql: process.env.DATABASE_URL ? 'unavailable' : 'not configured', database: 'unavailable', stripe: Boolean(process.env.STRIPE_SECRET_KEY), platformFee: '10% for vacation and outings' }, { status: 503 })
  }
}
