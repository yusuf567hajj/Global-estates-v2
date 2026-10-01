import { Pool } from 'pg'

const globalForDb = globalThis as unknown as { pool?: Pool }

export const pool = globalForDb.pool ?? new Pool({ connectionString: process.env.DATABASE_URL, max: 5, ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined })
if (process.env.NODE_ENV !== 'production') globalForDb.pool = pool

export async function query<T extends Record<string, unknown> = Record<string, unknown>>(text: string, values: unknown[] = []) {
  return pool.query<T>(text, values)
}

export function serializeProperty(row: Record<string, unknown>) {
  return {
    ...row,
    id: String(row.id),
    amenities: Array.isArray(row.amenities) ? row.amenities : [],
    images: Array.isArray(row.images) ? row.images : [],
    price: Number(row.price || 0),
    bedrooms: Number(row.bedrooms || 0),
    guests: Number(row.guests || 0),
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
  }
}

export async function propertiesTableReady() {
  await query(`CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), property_id UUID NOT NULL, customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL, check_in DATE NOT NULL, check_out DATE NOT NULL, guests INTEGER NOT NULL,
    amount NUMERIC NOT NULL, platform_fee NUMERIC NOT NULL DEFAULT 0, host_payout NUMERIC NOT NULL DEFAULT 0,
    payment_status TEXT NOT NULL DEFAULT 'pending', stripe_session_id TEXT, payment_intent_id TEXT,
    transfer_id TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`)
  await query('CREATE INDEX IF NOT EXISTS bookings_property_dates_idx ON bookings (property_id, check_in, check_out)')
  await query('CREATE INDEX IF NOT EXISTS bookings_payment_status_idx ON bookings (payment_status)')

  await query(`CREATE TABLE IF NOT EXISTS properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), host_id TEXT, title TEXT NOT NULL, category TEXT NOT NULL,
    location TEXT NOT NULL, country TEXT NOT NULL, description TEXT NOT NULL, price NUMERIC NOT NULL DEFAULT 0,
    bedrooms INTEGER NOT NULL DEFAULT 0, guests INTEGER NOT NULL DEFAULT 1, amenities JSONB NOT NULL DEFAULT '[]',
    images JSONB NOT NULL DEFAULT '[]', listing_plan TEXT NOT NULL DEFAULT 'Free', status TEXT NOT NULL DEFAULT 'published',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`)
  await query('CREATE INDEX IF NOT EXISTS properties_discovery_idx ON properties (status, category, country, created_at DESC)')
  await query('CREATE INDEX IF NOT EXISTS properties_price_idx ON properties (price)')
}

export async function getPropertiesTable() { await propertiesTableReady() }
