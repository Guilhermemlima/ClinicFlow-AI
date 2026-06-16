import { NextRequest, NextResponse } from 'next/server'
import { sendPendingReminders } from '@/jobs/sendReminders'

// Disparado pelo Vercel Cron (ver vercel.json) a cada 15 minutos.
// O Vercel não roda processos de longa duração (node-cron não funciona em
// Serverless/Edge Functions), então o scheduler precisa ser substituído por
// rotas de API acionadas externamente.
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await sendPendingReminders()
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[cron/send-reminders] error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
