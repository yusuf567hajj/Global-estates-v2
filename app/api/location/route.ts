import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const code = request.headers.get('x-vercel-ip-country') || request.headers.get('cf-ipcountry') || request.headers.get('x-country-code') || 'KE'
  return NextResponse.json({ countryCode: code.toUpperCase() })
}
