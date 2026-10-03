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
  await query(`CREATE TABLE IF NOT EXISTS reviews (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), booking_id UUID NOT NULL, property_id UUID NOT NULL, reviewer_id TEXT NOT NULL, rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5), review_text TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'published', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE (booking_id, reviewer_id))`)
  await query('CREATE INDEX IF NOT EXISTS reviews_property_idx ON reviews (property_id, status, created_at DESC)')

  await query(`CREATE TABLE IF NOT EXISTS properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), host_id TEXT, title TEXT NOT NULL, category TEXT NOT NULL,
    location TEXT NOT NULL, country TEXT NOT NULL, description TEXT NOT NULL, price NUMERIC NOT NULL DEFAULT 0,
    bedrooms INTEGER NOT NULL DEFAULT 0, guests INTEGER NOT NULL DEFAULT 1, amenities JSONB NOT NULL DEFAULT '[]',
    images JSONB NOT NULL DEFAULT '[]', listing_plan TEXT NOT NULL DEFAULT 'Free', status TEXT NOT NULL DEFAULT 'published',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`)
  await query('ALTER TABLE properties ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT \'KES\', ADD COLUMN IF NOT EXISTS views INTEGER NOT NULL DEFAULT 0, ADD COLUMN IF NOT EXISTS bathrooms INTEGER NOT NULL DEFAULT 0, ADD COLUMN IF NOT EXISTS size NUMERIC, ADD COLUMN IF NOT EXISTS size_unit TEXT, ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ')
  await query('CREATE INDEX IF NOT EXISTS properties_discovery_idx ON properties (status, category, country, created_at DESC)')
  await query('CREATE INDEX IF NOT EXISTS properties_price_idx ON properties (price)')
  const count = await query<{ count: string }>('SELECT COUNT(*)::text AS count FROM properties')
  if (count.rows[0]?.count === '0' || count.rows[0]?.count !== '0') {
    const demos = [
      ['Diani Garden Villa', 'Rent', 'Diani Beach', 'Kenya', 'A peaceful garden villa with bright interiors, a private pool, and easy access to the coast.', 85000, 3, 6, ['Wi-Fi', 'Swimming pool', 'Outdoor space', 'Security'], 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=85'],
      ['Sundowner Coast Retreat', 'Vacation', 'Watamu', 'Kenya', 'A relaxed coastal escape with ocean views, quiet mornings, and space for the whole family.', 18000, 2, 4, ['Wi-Fi', 'Beach access', 'Scenic views', 'Free parking'], 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1200&q=85'],
      ['Kigali Art Walk Loft', 'Outings', 'Kigali', 'Rwanda', 'A design-led city stay close to galleries, cafés, and the best local food.', 12000, 1, 2, ['Wi-Fi', 'Air conditioning', 'Security', 'Electricity'], 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=85'],
      ['Nairobi Hills Acre', 'Land', 'Karen', 'Kenya', 'A gently elevated plot with mature trees, road access, and room to create something remarkable.', 12500000, 0, 0, ['Scenic views', 'Water supply', 'Electricity', 'Security'], 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=85'],
    ]
    for (const [title, category, location, country, description, price, bedrooms, guests, amenities, image] of demos) {
      const existing = await query<{ count: string }>('SELECT COUNT(*)::text AS count FROM properties WHERE title = $1', [title])
      if (existing.rows[0]?.count === '0') await query('INSERT INTO properties (title, category, location, country, description, price, bedrooms, guests, amenities, images, listing_plan, status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)', [title, category, location, country, description, price, bedrooms, guests, JSON.stringify(amenities), JSON.stringify([image]), 'Free', 'published'])
    }
  }
}

export async function getPropertiesTable() { await propertiesTableReady() }
