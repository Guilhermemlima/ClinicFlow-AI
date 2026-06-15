import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { sendMessage, substituteTemplateVariables } from '@/lib/whatsapp'
import { formatDateTime } from '@/lib/utils'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { appointmentId } = await req.json()

  const appointment = await prisma.appointment.findFirst({
    where: { id: appointmentId, clinicId: session.user.clinicId },
    include: { patient: true, clinic: true },
  })

  if (!appointment) {
    return NextResponse.json({ error: 'Consulta não encontrada.' }, { status: 404 })
  }

  const template = await prisma.messageTemplate.findFirst({
    where: { clinicId: session.user.clinicId, type: 'REMINDER' },
  })

  const messageBody = template?.body ||
    'Olá {{nome_paciente}}! Lembrete da sua consulta de {{procedimento}} em {{data_consulta}} na {{nome_clinica}}.'

  const message = substituteTemplateVariables(messageBody, {
    nome_paciente: appointment.patient.name.split(' ')[0],
    data_consulta: formatDateTime(appointment.scheduledAt),
    procedimento: appointment.procedure || 'Consulta',
    nome_clinica: appointment.clinic.name,
  })

  const result = await sendMessage(appointment.patient.phone, message)

  await prisma.message.create({
    data: {
      patientId: appointment.patientId,
      direction: 'OUTBOUND',
      content: message,
      whatsappId: result.messageId,
    },
  })

  return NextResponse.json({ success: true, status: result.status })
}
