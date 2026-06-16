import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { classifyIntent } from '@/lib/openai'
import { checkRateLimit } from '@/lib/rateLimit'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Protege diretamente o custo com a OpenAI: sem isso, qualquer usuário
  // autenticado (ou um script automatizado) podia chamar isso em loop e
  // gerar uma fatura enorme na API da OpenAI.
  const { allowed } = checkRateLimit(`ai-classify:${session.user.clinicId}`, 30, 60 * 1000)
  if (!allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const { message } = await req.json()
  if (!message) return NextResponse.json({ error: 'Message required' }, { status: 400 })

  const result = await classifyIntent(message)
  return NextResponse.json(result)
}
