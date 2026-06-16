import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { subDays, startOfWeek, format, getHours } from 'date-fns'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const period = parseInt(searchParams.get('period') || '30')
  const clinicId = session.user.clinicId

  const since = subDays(new Date(), period)
  const appointmentsWhere = { clinicId, scheduledAt: { gte: since } }

  // Limite de segurança: 90 dias × 10 clínicas grandes rodando o mesmo
  // período pode facilmente passar de milhares de linhas por request. Os
  // totais usam count() (sempre exatos); só os gráficos detalhados abaixo
  // (semana/horário/procedimento) usam a amostra limitada por `take`.
  const REPORT_ROW_CAP = 5000

  const [total, confirmed, appointments] = await Promise.all([
    prisma.appointment.count({ where: appointmentsWhere }),
    prisma.appointment.count({
      where: { ...appointmentsWhere, status: { in: ['CONFIRMED', 'COMPLETED'] } },
    }),
    prisma.appointment.findMany({
      where: appointmentsWhere,
      select: { id: true, patientId: true, status: true, scheduledAt: true, procedure: true },
      take: REPORT_ROW_CAP,
    }),
  ])

  // "No-shows evitados" deve medir o impacto real da automação: só conta
  // consultas confirmadas cujo paciente de fato respondeu via WhatsApp com
  // intenção de confirmação. Contar todas as consultas com status CONFIRMED
  // infla o número, pois inclui confirmações manuais feitas pela recepção
  // que ocorreriam de qualquer forma, sem o WhatsApp.
  const confirmedAppointments = appointments.filter((a) =>
    ['CONFIRMED', 'COMPLETED'].includes(a.status)
  )
  const confirmingPatientIds = new Set(
    (
      await prisma.message.findMany({
        where: {
          patient: { clinicId },
          direction: 'INBOUND',
          intent: 'confirm',
          sentAt: { gte: since },
        },
        select: { patientId: true },
      })
    ).map((m) => m.patientId)
  )
  const noShowsAvoided = confirmedAppointments.filter((a) =>
    confirmingPatientIds.has(a.patientId)
  ).length

  const clinic = await prisma.clinic.findUnique({ where: { id: clinicId } })
  const ticketMedio = Number(clinic?.ticketMedio || 200)

  const confirmationRate = total > 0 ? Math.round((confirmed / total) * 100) : 0
  const revenueRecovered = noShowsAvoided * ticketMedio

  const reactivations = await prisma.message.count({
    where: {
      patient: {
        clinicId,
        lastVisit: { lt: subDays(new Date(), 90) },
      },
      direction: 'OUTBOUND',
      sentAt: { gte: since },
    },
  })

  const messagesWhere = { patient: { clinicId }, sentAt: { gte: since } }
  const [inboundCount, outboundCount] = await Promise.all([
    prisma.message.count({ where: { ...messagesWhere, direction: 'INBOUND' } }),
    prisma.message.count({ where: { ...messagesWhere, direction: 'OUTBOUND' } }),
  ])
  const responseRate =
    outboundCount > 0 ? Math.round((inboundCount / outboundCount) * 100) : 0

  const weeklyGroups: Record<string, { total: number; confirmed: number }> = {}
  appointments.forEach((a) => {
    const week = format(startOfWeek(new Date(a.scheduledAt)), 'dd/MM')
    if (!weeklyGroups[week]) weeklyGroups[week] = { total: 0, confirmed: 0 }
    weeklyGroups[week].total++
    if (['CONFIRMED', 'COMPLETED'].includes(a.status)) weeklyGroups[week].confirmed++
  })

  const weeklyRate = Object.entries(weeklyGroups)
    .slice(-6)
    .map(([week, g]) => ({
      week,
      rate: g.total > 0 ? Math.round((g.confirmed / g.total) * 100) : 0,
    }))

  const statusDist = [
    { name: 'Confirmada', value: appointments.filter((a) => a.status === 'CONFIRMED').length },
    { name: 'Agendada', value: appointments.filter((a) => a.status === 'SCHEDULED').length },
    { name: 'Cancelada', value: appointments.filter((a) => a.status === 'CANCELLED').length },
    { name: 'Não veio', value: appointments.filter((a) => a.status === 'NO_SHOW').length },
    { name: 'Realizada', value: appointments.filter((a) => a.status === 'COMPLETED').length },
  ].filter((s) => s.value > 0)

  const timeDist = [
    {
      period: 'Manhã (6-12h)',
      count: appointments.filter((a) => {
        const h = getHours(new Date(a.scheduledAt))
        return h >= 6 && h < 12
      }).length,
    },
    {
      period: 'Tarde (12-18h)',
      count: appointments.filter((a) => {
        const h = getHours(new Date(a.scheduledAt))
        return h >= 12 && h < 18
      }).length,
    },
    {
      period: 'Noite (18-22h)',
      count: appointments.filter((a) => {
        const h = getHours(new Date(a.scheduledAt))
        return h >= 18 && h < 22
      }).length,
    },
  ]

  const procedureCounts: Record<string, number> = {}
  appointments.forEach((a) => {
    const p = a.procedure || 'Consulta'
    procedureCounts[p] = (procedureCounts[p] || 0) + 1
  })
  const topProcedures = Object.entries(procedureCounts)
    .map(([procedure, count]) => ({ procedure, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  return NextResponse.json({
    confirmationRate,
    noShowsAvoided,
    revenueRecovered,
    reactivations,
    responseRate,
    weeklyRate,
    statusDist,
    timeDist,
    topProcedures,
  })
}
