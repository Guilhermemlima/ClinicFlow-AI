import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const statusSchema = z.object({
  status: z.enum(['SCHEDULED', 'CONFIRMED', 'CANCELLED', 'NO_SHOW', 'COMPLETED']),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = statusSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Status inválido.' }, { status: 400 })
  }

  const appointment = await prisma.appointment.findFirst({
    where: { id: params.id, clinicId: session.user.clinicId },
  })
  if (!appointment) {
    return NextResponse.json({ error: 'Consulta não encontrada.' }, { status: 404 })
  }

  const updated = await prisma.appointment.update({
    where: { id: appointment.id },
    data: { status: parsed.data.status },
  })

  // Quando a consulta é marcada como realizada, o histórico do paciente
  // precisa refletir isso — sem isto, lastVisit/totalVisits nunca mudam e
  // tanto a reativação de inativos quanto as métricas de engajamento ficam
  // sempre baseadas em dados desatualizados.
  if (parsed.data.status === 'COMPLETED' && appointment.status !== 'COMPLETED') {
    await prisma.patient.update({
      where: { id: appointment.patientId },
      data: {
        lastVisit: appointment.scheduledAt,
        totalVisits: { increment: 1 },
      },
    })
  }

  return NextResponse.json({ appointment: updated })
}
