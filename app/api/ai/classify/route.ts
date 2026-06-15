import { NextRequest, NextResponse } from 'next/server'
import { classifyIntent } from '@/lib/openai'

export async function POST(req: NextRequest) {
  const { message } = await req.json()
  if (!message) return NextResponse.json({ error: 'Message required' }, { status: 400 })

  const result = await classifyIntent(message)
  return NextResponse.json(result)
}
