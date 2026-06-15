import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { sendMessage, substituteTemplateVariables } from '@/lib/whatsapp'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { patientId } = await req.json()

  const patient = await prisma.patient.findFirst({
    where: { id: patientId, clinicId: session.user.clinicId },
  })

  if (!patient) return NextResponse.json({ error: 'Paciente não encontrado.' }, { status: 404 })

  const clinic = await prisma.clinic.findUnique({ where: { id: session.user.clinicId } })

  const template = await prisma.messageTemplate.findFirst({
    where: { clinicId: session.user.clinicId, type: 'REACTIVATION' },
  })

  if (template && clinic) {
    const message = substituteTemplateVariables(template.body, {
      nome_paciente: patient.name.split(' ')[0],
      nome_clinica: clinic.name,
    })

    await sendMessage(patient.phone, message)

    await prisma.message.create({
      data: {
        patientId: patient.id,
        direction: 'OUTBOUND',
        content: message,
      },
    })
  }

  return NextResponse.json({ success: true })
}
