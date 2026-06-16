import { prisma } from '../lib/prisma'
import { sendMessage, substituteTemplateVariables } from '../lib/whatsapp'
import { formatDateTime } from '../lib/utils'
import { mapWithConcurrency } from '../lib/concurrency'
import { addMinutes } from 'date-fns'

// Lembretes processados em paralelo por vez. Alto suficiente para não
// demorar minutos com centenas de lembretes pendentes, baixo suficiente
// para não estourar limites de taxa da Evolution API/WhatsApp.
const REMINDER_CONCURRENCY = 10

export async function sendPendingReminders() {
  const now = new Date()
  const cutoff = addMinutes(now, 5)

  const pendingReminders = await prisma.reminder.findMany({
    where: {
      status: 'PENDING',
      scheduledFor: { lte: cutoff },
    },
    include: {
      appointment: {
        include: {
          patient: true,
          clinic: {
            include: {
              messageTemplates: true,
              automations: { include: { template: true } },
            },
          },
        },
      },
    },
  })

  console.log(`[sendReminders] Found ${pendingReminders.length} pending reminders`)

  await mapWithConcurrency(pendingReminders, REMINDER_CONCURRENCY, async (reminder) => {
    const { appointment } = reminder
    const { patient, clinic } = appointment

    const triggerKey = reminder.type === 'HOURS_48' ? '48h_before' : '2h_before'
    const automation = clinic.automations.find(
      (a) => a.trigger === triggerKey && a.isActive
    )

    if (!automation) {
      await prisma.reminder.update({
        where: { id: reminder.id },
        data: { status: 'FAILED' },
      })
      return
    }

    const templateBody = automation.template.body

    const message = substituteTemplateVariables(templateBody, {
      nome_paciente: patient.name.split(' ')[0],
      data_consulta: formatDateTime(appointment.scheduledAt),
      procedimento: appointment.procedure || 'Consulta',
      nome_clinica: clinic.name,
    })

    try {
      const result = await sendMessage(patient.phone, message)

      await prisma.reminder.update({
        where: { id: reminder.id },
        data: {
          status: 'SENT',
          sentAt: now,
          messageId: result.messageId,
        },
      })

      await prisma.message.create({
        data: {
          patientId: patient.id,
          direction: 'OUTBOUND',
          content: message,
          whatsappId: result.messageId,
        },
      })

      console.log(`[sendReminders] ✓ Sent ${reminder.type} to ${patient.name} (${patient.phone})`)
    } catch (err) {
      console.error(`[sendReminders] ✗ Failed for ${patient.name}:`, err)
      await prisma.reminder.update({
        where: { id: reminder.id },
        data: { status: 'FAILED' },
      })
    }
  })
}
