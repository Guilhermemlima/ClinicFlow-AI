import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { classifyIntent } from '@/lib/openai'
import { sendMessage, substituteTemplateVariables } from '@/lib/whatsapp'
import { formatDateTime } from '@/lib/utils'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const phone = body.data?.key?.remoteJid?.replace('@s.whatsapp.net', '') ||
      body.sender?.replace('@s.whatsapp.net', '')
    const content = body.data?.message?.conversation ||
      body.data?.message?.extendedTextMessage?.text ||
      body.message

    if (!phone || !content) {
      return NextResponse.json({ ok: true })
    }

    const patient = await prisma.patient.findFirst({
      where: { phone: { contains: phone } },
      include: { clinic: true },
    })

    if (!patient) {
      return NextResponse.json({ ok: true })
    }

    const { intent, confidence } = await classifyIntent(content)

    await prisma.message.create({
      data: {
        patientId: patient.id,
        direction: 'INBOUND',
        content,
        whatsappId: body.data?.key?.id,
        intent,
      },
    })

    const lastAppointment = await prisma.appointment.findFirst({
      where: {
        patientId: patient.id,
        status: { in: ['SCHEDULED', 'CONFIRMED'] },
        scheduledAt: { gte: new Date() },
      },
      orderBy: { scheduledAt: 'asc' },
    })

    if (lastAppointment && confidence > 0.7) {
      if (intent === 'confirm') {
        await prisma.appointment.update({
          where: { id: lastAppointment.id },
          data: { status: 'CONFIRMED' },
        })

        const replyTemplate = await prisma.messageTemplate.findFirst({
          where: { clinicId: patient.clinicId, type: 'CONFIRMATION' },
        })

        const reply = replyTemplate
          ? substituteTemplateVariables(replyTemplate.body, {
              nome_paciente: patient.name.split(' ')[0],
              data_consulta: formatDateTime(lastAppointment.scheduledAt),
              procedimento: lastAppointment.procedure || 'Consulta',
              nome_clinica: patient.clinic.name,
            })
          : `Confirmação recebida! Até ${formatDateTime(lastAppointment.scheduledAt)} 😊`

        await sendMessage(patient.phone, reply)
      } else if (intent === 'cancel') {
        await prisma.appointment.update({
          where: { id: lastAppointment.id },
          data: { status: 'CANCELLED' },
        })

        await sendMessage(
          patient.phone,
          `Entendido, ${patient.name.split(' ')[0]}. Sua consulta foi cancelada. Se quiser reagendar, é só nos avisar! 😊`
        )
      } else if (intent === 'reschedule') {
        await sendMessage(
          patient.phone,
          `Olá ${patient.name.split(' ')[0]}! Claro, podemos remarcar. Entre em contato com nossa recepção para escolher um novo horário.`
        )
      }
    }

    return NextResponse.json({ ok: true, intent, confidence })
  } catch (err) {
    console.error('WhatsApp webhook error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
