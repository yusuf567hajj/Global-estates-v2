import { NextResponse } from 'next/server'
import { getDatabase } from '@/lib/db'

export async function GET() {
  try {
    const db = await getDatabase()
    await db.command({ ping: 1 })
    return NextResponse.json({ mongodb: 'configured', database: 'available', stripe: Boolean(process.env.STRIPE_SECRET_KEY), platformFee: '10% for vacation and outings' })
  } catch {
    return NextResponse.json({ mongodb: process.env.MONGODB_URI ? 'unavailable' : 'not configured', database: 'unavailable', stripe: Boolean(process.env.STRIPE_SECRET_KEY), platformFee: '10% for vacation and outings' }, { status: 503 })
  }
}
