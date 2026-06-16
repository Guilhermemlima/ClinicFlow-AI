import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { classifyIntent } from '@/lib/openai'
import { sendMessage, substituteTemplateVariables } from '@/lib/whatsapp'
import { formatDateTime } from '@/lib/utils'

export async function POST(req: NextRequest) {
  // Autenticação do webhook — Evolution API envia o segredo configurado em
  // WEBHOOK_GLOBAL_API_KEY no header abaixo. Sem isso, qualquer pessoa pode
  // forjar mensagens e confirmar/cancelar consultas de qualquer paciente.
  const providedSecret = req.headers.get('x-evolution-hmac-sha256') || req.headers.get('apikey')
  const expectedSecret = process.env.EVOLUTION_WEBHOOK_SECRET
  if (!expectedSecret || providedSecret !== expectedSecret) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

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

    // Isolamento multi-tenant: cada clínica tem sua própria instância da
    // Evolution API. O nome da instância vem no payload do webhook e é
    // usado para resolver a clínica antes de qualquer busca de paciente —
    // assim uma mensagem nunca pode "vazar" para o paciente de outra clínica.
    const instanceName = body.instance
    if (!instanceName) {
      return NextResponse.json({ ok: true })
    }

    const clinic = await prisma.clinic.findUnique({
      where: { evolutionInstance: instanceName },
    })

    if (!clinic || !clinic.isActive) {
      return NextResponse.json({ ok: true })
    }

    const patient = await prisma.patient.findFirst({
      where: { clinicId: clinic.id, phone: { contains: phone } },
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
        clinicId: clinic.id,
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
              nome_clinica: clinic.name,
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
