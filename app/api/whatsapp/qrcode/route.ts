import { NextResponse } from 'next/server'
import { getQRCode } from '@/lib/whatsapp'

export async function GET() {
  const qrCode = await getQRCode()
  return NextResponse.json({ qrCode })
}
