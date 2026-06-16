import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createTrialSubscription } from '@/lib/stripe'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { checkRateLimit, getClientIp } from '@/lib/rateLimit'

const schema = z.object({
  clinicName: z.string().min(2),
  ownerName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  specialty: z.string().min(1),
  plan: z.enum(['SOLO', 'CLINIC', 'PREMIUM']),
})

export async function POST(req: NextRequest) {
  // No máximo 5 registros por IP a cada 10 minutos — evita um atacante
  // criar milhares de clínicas falsas em massa.
  const ip = getClientIp(req)
  const { allowed } = checkRateLimit(`register:${ip}`, 5, 10 * 60 * 1000)
  if (!allowed) {
    return NextResponse.json(
      { error: 'Muitas tentativas. Tente novamente em alguns minutos.' },
      { status: 429 }
    )
  }

  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 })
    }

    const { clinicName, ownerName, email, password, specialty, plan } = parsed.data

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'Email já cadastrado.' }, { status: 409 })
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const clinic = await prisma.clinic.create({
      data: {
        name: clinicName,
        email,
        specialty,
        plan,
        ticketMedio: 200,
        users: {
          create: {
            name: ownerName,
            email,
            password: hashedPassword,
            role: 'OWNER',
          },
        },
        messageTemplates: {
          create: [
            {
              name: 'Lembrete 48h',
              type: 'REMINDER',
              body: 'Olá {{nome_paciente}}! 😊 Sua consulta de {{procedimento}} está marcada para {{data_consulta}} na {{nome_clinica}}. Confirme respondendo SIM ou cancele respondendo NÃO. Qualquer dúvida, estamos aqui!',
            },
            {
              name: 'Lembrete 2h',
              type: 'CONFIRMATION',
              body: '{{nome_paciente}}, lembrando que sua consulta começa em 2 horas! Às {{data_consulta}} na {{nome_clinica}}. Te esperamos! 😊',
            },
            {
              name: 'Reativação',
              type: 'REACTIVATION',
              body: 'Olá {{nome_paciente}}! Sentimos sua falta na {{nome_clinica}} 💙 Faz um tempo que não nos vemos. Que tal agendar uma consulta? Responda AGENDAR e te ajudamos a encontrar o melhor horário!',
            },
            {
              name: 'Pós-consulta',
              type: 'POST_VISIT',
              body: 'Olá {{nome_paciente}}! 😊 Obrigado pela sua visita à {{nome_clinica}}. Como foi sua experiência? Responda com uma nota de 1 a 5 para nos ajudar a melhorar!',
            },
          ],
        },
      },
      include: { messageTemplates: true },
    })

    const templates = clinic.messageTemplates

    await prisma.automation.createMany({
      data: [
        {
          clinicId: clinic.id,
          name: 'Lembrete 48h antes',
          trigger: '48h_before',
          isActive: true,
          templateId: templates.find((t) => t.type === 'REMINDER')!.id,
        },
        {
          clinicId: clinic.id,
          name: 'Lembrete 2h antes',
          trigger: '2h_before',
          isActive: true,
          templateId: templates.find((t) => t.type === 'CONFIRMATION')!.id,
        },
        {
          clinicId: clinic.id,
          name: 'Reativação de inativos',
          trigger: 'inactive_90_days',
          isActive: false,
          templateId: templates.find((t) => t.type === 'REACTIVATION')!.id,
        },
        {
          clinicId: clinic.id,
          name: 'Pesquisa pós-consulta',
          trigger: 'post_visit_4h',
          isActive: true,
          templateId: templates.find((t) => t.type === 'POST_VISIT')!.id,
        },
      ],
    })

    // Cria o cliente + assinatura em trial no Stripe. Sem isso, a clínica
    // nunca tem stripeCustomerId/stripeSubId e fica em trial eterno, já
    // que não há nada para cobrar quando o período de teste acabar.
    const stripeResult = await createTrialSubscription(email, ownerName, plan)
    if (stripeResult) {
      await prisma.clinic.update({
        where: { id: clinic.id },
        data: {
          stripeCustomerId: stripeResult.customerId,
          stripeSubId: stripeResult.subscriptionId,
        },
      })
    }

    return NextResponse.json({ success: true, clinicId: clinic.id }, { status: 201 })
  } catch (err) {
    console.error('Register error:', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
