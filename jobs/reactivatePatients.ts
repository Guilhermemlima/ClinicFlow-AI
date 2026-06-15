import { prisma } from '../lib/prisma'
import { sendMessage, substituteTemplateVariables } from '../lib/whatsapp'
import { subDays } from 'date-fns'

export async function reactivateInactivePatients() {
  const ninetyDaysAgo = subDays(new Date(), 90)
  const thirtyDaysAgo = subDays(new Date(), 30)

  const inactivePatients = await prisma.patient.findMany({
    where: {
      isActive: true,
      OR: [
        { lastVisit: { lt: ninetyDaysAgo } },
        { lastVisit: null },
      ],
      messages: {
        none: {
          direction: 'OUTBOUND',
          sentAt: { gte: thirtyDaysAgo },
          intent: null,
        },
      },
    },
    include: {
      clinic: {
        include: {
          messageTemplates: true,
          automations: {
            where: { trigger: 'inactive_90_days', isActive: true },
            include: { template: true },
          },
        },
      },
    },
    take: 50,
  })

  console.log(`[reactivatePatients] Found ${inactivePatients.length} inactive patients`)

  for (const patient of inactivePatients) {
    const automation = patient.clinic.automations[0]
    if (!automation) continue

    const message = substituteTemplateVariables(automation.template.body, {
      nome_paciente: patient.name.split(' ')[0],
      nome_clinica: patient.clinic.name,
    })

    try {
      const result = await sendMessage(patient.phone, message)

      await prisma.message.create({
        data: {
          patientId: patient.id,
          direction: 'OUTBOUND',
          content: message,
          whatsappId: result.messageId,
        },
      })

      console.log(`[reactivatePatients] ✓ Reactivation sent to ${patient.name}`)
    } catch (err) {
      console.error(`[reactivatePatients] ✗ Failed for ${patient.name}:`, err)
    }
  }
}
