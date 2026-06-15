import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const clinic = await prisma.clinic.findUnique({
    where: { id: session.user.clinicId },
    select: {
      name: true,
      specialty: true,
      phone: true,
      ticketMedio: true,
      whatsappNumber: true,
      plan: true,
    },
  })

  return NextResponse.json({ clinic })
}

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, specialty, phone, ticketMedio, whatsappNumber } = await req.json()

  const clinic = await prisma.clinic.update({
    where: { id: session.user.clinicId },
    data: {
      name: name || undefined,
      specialty: specialty || undefined,
      phone: phone || undefined,
      ticketMedio: ticketMedio ? ticketMedio : undefined,
      whatsappNumber: whatsappNumber || undefined,
    },
  })

  return NextResponse.json({ clinic })
}
