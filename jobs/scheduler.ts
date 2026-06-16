import cron from 'node-cron'
import { sendPendingReminders } from './sendReminders'
import { reactivateInactivePatients } from './reactivatePatients'

// NOTA: na Vercel, processos de longa duração (este scheduler) NÃO rodam —
// funções serverless são encerradas após a resposta, então node-cron nunca
// dispara em produção lá. Em produção na Vercel, use os crons declarados em
// vercel.json (app/api/cron/send-reminders e app/api/cron/reactivate-patients).
// Este arquivo continua útil para rodar localmente (`npm run jobs`) ou em
// uma plataforma com processo persistente (Railway, Render, um VPS etc).
console.log('[Scheduler] Starting ZenCli job scheduler...')

// Run every 15 minutes — send pending reminders
cron.schedule('*/15 * * * *', async () => {
  console.log('[Scheduler] Running sendPendingReminders...')
  try {
    await sendPendingReminders()
  } catch (err) {
    console.error('[Scheduler] sendPendingReminders error:', err)
  }
}, {
  timezone: 'America/Sao_Paulo',
})

// Run daily at 09:00 BRT — reactivate inactive patients
cron.schedule('0 9 * * *', async () => {
  console.log('[Scheduler] Running reactivateInactivePatients...')
  try {
    await reactivateInactivePatients()
  } catch (err) {
    console.error('[Scheduler] reactivateInactivePatients error:', err)
  }
}, {
  timezone: 'America/Sao_Paulo',
})

console.log('[Scheduler] Jobs scheduled:')
console.log('  • sendPendingReminders: every 15 minutes')
console.log('  • reactivateInactivePatients: daily at 09:00 BRT')
