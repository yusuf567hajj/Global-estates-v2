import { NextResponse } from 'next/server'
import { pool } from '@/lib/db'

export async function GET() {
  try {
    await pool.query('SELECT 1')
    return NextResponse.json({ postgres: 'configured', stripe: Boolean(process.env.STRIPE_SECRET_KEY), platformFee: '10% for vacation and outings' })
  } catch { return NextResponse.json({ postgres: 'unavailable', stripe: Boolean(process.env.STRIPE_SECRET_KEY), platformFee: '10% for vacation and outings' }, { status: 503 }) }
}
