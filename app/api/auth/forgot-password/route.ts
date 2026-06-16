import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendPasswordResetEmail } from '@/lib/email'
import { checkRateLimit, getClientIp } from '@/lib/rateLimit'
import { randomBytes } from 'crypto'
import { z } from 'zod'

const schema = z.object({ email: z.string().email() })

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  const { allowed } = checkRateLimit(`forgot-password:${ip}`, 5, 15 * 60 * 1000)
  if (!allowed) {
    return NextResponse.json(
      { error: 'Muitas tentativas. Tente novamente em alguns minutos.' },
      { status: 429 }
    )
  }

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Email inválido.' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } })

  // Sempre responde com sucesso, exista ou não o email — evita que alguém
  // descubra quais emails estão cadastrados (enumeration attack).
  if (user) {
    const token = randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hora

    await prisma.passwordResetToken.create({
      data: { token, userId: user.id, expiresAt },
    })

    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`
    await sendPasswordResetEmail(user.email, resetUrl)
  }

  return NextResponse.json({ success: true })
}
