import { NextResponse } from 'next/server'
import { getConnectionStatus } from '@/lib/whatsapp'

export async function GET() {
  const status = await getConnectionStatus()
  return NextResponse.json({ status })
}
