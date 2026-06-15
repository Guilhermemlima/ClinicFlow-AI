import cron from 'node-cron'
import { sendPendingReminders } from './sendReminders'
import { reactivateInactivePatients } from './reactivatePatients'

console.log('[Scheduler] Starting ClinicFlow AI job scheduler...')

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
