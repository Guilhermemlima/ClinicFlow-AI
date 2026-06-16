import { NextRequest, NextResponse } from 'next/server'
import { reactivateInactivePatients } from '@/jobs/reactivatePatients'

// Disparado pelo Vercel Cron (ver vercel.json) diariamente às 09:00 BRT.
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await reactivateInactivePatients()
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[cron/reactivate-patients] error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
