import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { getConnectionStatus } from '@/lib/whatsapp'
import { ROIBanner } from '@/components/dashboard/ROIBanner'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { AppointmentTable } from '@/components/dashboard/AppointmentTable'
import { OccupancyChart } from '@/components/dashboard/OccupancyChart'
import { OnboardingChecklist, type OnboardingStep } from '@/components/dashboard/OnboardingChecklist'
import { Calendar, CheckCircle, XCircle, TrendingUp } from 'lucide-react'
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, format } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'
import { BRL_TIMEZONE } from '@/lib/utils'

async function getDashboardData(clinicId: string) {
  const now = toZonedTime(new Date(), BRL_TIMEZONE)
  const todayStart = startOfDay(now)
  const todayEnd = endOfDay(now)
  const weekStart = startOfWeek(now, { weekStartsOn: 0 })
  const weekEnd = endOfWeek(now, { weekStartsOn: 0 })
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)

  const [
    todayAppts,
    weekAppts,
    monthAppts,
    upcomingToday,
    clinic,
    confirmingMessages,
    patientsCount,
    activeAutomationsCount,
    waStatus,
  ] = await Promise.all([
    prisma.appointment.findMany({
      where: { clinicId, scheduledAt: { gte: todayStart, lte: todayEnd } },
      include: { patient: true },
      orderBy: { scheduledAt: 'asc' },
    }),
    prisma.appointment.findMany({
      where: { clinicId, scheduledAt: { gte: weekStart, lte: weekEnd } },
    }),
    prisma.appointment.findMany({
      where: { clinicId, scheduledAt: { gte: monthStart, lte: monthEnd } },
    }),
    prisma.appointment.findMany({
      where: {
        clinicId,
        scheduledAt: { gte: now },
        status: { in: ['SCHEDULED', 'CONFIRMED'] },
      },
      include: { patient: true },
      orderBy: { scheduledAt: 'asc' },
      take: 8,
    }),
    prisma.clinic.findUnique({ where: { id: clinicId } }),
    prisma.message.findMany({
      where: {
        patient: { clinicId },
        direction: 'INBOUND',
        intent: 'confirm',
        sentAt: { gte: monthStart, lte: monthEnd },
      },
      select: { patientId: true },
    }),
    prisma.patient.count({ where: { clinicId } }),
    prisma.automation.count({ where: { clinicId, isActive: true } }),
    getConnectionStatus(),
  ])

  const ticketMedio = Number(clinic?.ticketMedio || 200)

  const todayScheduled = todayAppts.length
  const todayConfirmed = todayAppts.filter((a) => a.status === 'CONFIRMED').length
  const todayNoShows = todayAppts.filter((a) => a.status === 'NO_SHOW').length

  const weekConfirmed = weekAppts.filter((a) => a.status === 'CONFIRMED').length
  const weekCancelled = weekAppts.filter((a) => a.status === 'CANCELLED').length
  const weekNoShows = weekAppts.filter((a) => a.status === 'NO_SHOW').length

  const monthTotal = monthAppts.length
  const monthConfirmed = monthAppts.filter((a) =>
    ['CONFIRMED', 'COMPLETED'].includes(a.status)
  ).length
  const monthNoShows = monthAppts.filter((a) => a.status === 'NO_SHOW').length

  // Só conta como "evitado pela automação" quando o paciente confirmou via
  // WhatsApp — não basta o agendamento estar com status CONFIRMED, pois isso
  // também inclui confirmações manuais da recepção (não creditáveis ao ROI da IA).
  const confirmingPatientIds = new Set(confirmingMessages.map((m) => m.patientId))
  const noShowsAvoided = monthAppts.filter(
    (a) =>
      ['CONFIRMED', 'COMPLETED'].includes(a.status) &&
      confirmingPatientIds.has(a.patientId)
  ).length
  const confirmationRate = monthTotal > 0 ? Math.round((monthConfirmed / monthTotal) * 100) : 0

  const occupancyData = Array.from({ length: 7 }, (_, i) => {
    const day = subDays(now, 6 - i)
    const dayStart = startOfDay(day)
    const dayEnd = endOfDay(day)
    const dayAppts = monthAppts.filter((a) => {
      const d = new Date(a.scheduledAt)
      return d >= dayStart && d <= dayEnd
    })
    return {
      day: format(day, 'EEE', { locale: undefined }),
      ocupadas: dayAppts.filter((a) => a.status !== 'CANCELLED').length,
      vagas: Math.max(0, 8 - dayAppts.length),
    }
  })

  const onboardingSteps: OnboardingStep[] = [
    {
      id: 'whatsapp',
      label: 'Conectar o WhatsApp da clínica',
      done: waStatus === 'connected',
      href: '/settings',
      cta: 'Conectar',
    },
    {
      id: 'patient',
      label: 'Cadastrar seu primeiro paciente',
      done: patientsCount > 0,
      href: '/patients',
      cta: 'Cadastrar',
    },
    {
      id: 'automation',
      label: 'Ativar uma automação de lembrete',
      done: activeAutomationsCount > 0,
      href: '/automations',
      cta: 'Ativar',
    },
  ]

  return {
    todayScheduled,
    todayConfirmed,
    todayNoShows,
    weekConfirmed,
    weekCancelled,
    weekNoShows,
    monthConfirmed,
    monthNoShows,
    noShowsAvoided,
    confirmationRate,
    ticketMedio,
    occupancyData,
    upcomingToday,
    onboardingSteps,
  }
}

export default async function DashboardPage() {
  const session = await auth()
  const clinicId = session!.user.clinicId

  const data = await getDashboardData(clinicId)

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Visão geral da sua clínica</p>
      </div>

      <OnboardingChecklist clinicId={clinicId} steps={data.onboardingSteps} />

      <ROIBanner noShowsAvoided={data.noShowsAvoided} ticketMedio={data.ticketMedio} />

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Hoje</p>
          <MetricCard title="Agendadas" value={data.todayScheduled} icon={Calendar} />
          <MetricCard title="Confirmadas" value={data.todayConfirmed} icon={CheckCircle} />
          <MetricCard title="Não vieram" value={data.todayNoShows} icon={XCircle} />
        </div>
        <div className="space-y-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Esta semana</p>
          <MetricCard title="Confirmadas" value={data.weekConfirmed} icon={CheckCircle} />
          <MetricCard title="Canceladas" value={data.weekCancelled} icon={XCircle} />
          <MetricCard title="No-shows" value={data.weekNoShows} icon={XCircle} />
        </div>
        <div className="space-y-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Este mês</p>
          <MetricCard
            title="Taxa de confirmação"
            value={`${data.confirmationRate}%`}
            icon={TrendingUp}
          />
          <MetricCard title="No-shows evitados" value={data.noShowsAvoided} icon={CheckCircle} />
          <MetricCard title="No-shows ocorridos" value={data.monthNoShows} icon={XCircle} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <OccupancyChart data={data.occupancyData} />
        <AppointmentTable
          appointments={data.upcomingToday as Parameters<typeof AppointmentTable>[0]['appointments']}
          title="Próximas consultas"
          limit={6}
        />
      </div>
    </div>
  )
}
