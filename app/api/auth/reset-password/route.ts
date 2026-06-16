import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkRateLimit, getClientIp } from '@/lib/rateLimit'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(6),
})

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  const { allowed } = checkRateLimit(`reset-password:${ip}`, 10, 15 * 60 * 1000)
  if (!allowed) {
    return NextResponse.json(
      { error: 'Muitas tentativas. Tente novamente em alguns minutos.' },
      { status: 429 }
    )
  }

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 })
  }

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token: parsed.data.token },
  })

  if (
    !resetToken ||
    resetToken.usedAt ||
    resetToken.expiresAt < new Date()
  ) {
    return NextResponse.json(
      { error: 'Link inválido ou expirado. Solicite um novo.' },
      { status: 400 }
    )
  }

  const hashedPassword = await bcrypt.hash(parsed.data.password, 12)

  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetToken.userId },
      data: { password: hashedPassword },
    }),
    prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    }),
  ])

  return NextResponse.json({ success: true })
}
