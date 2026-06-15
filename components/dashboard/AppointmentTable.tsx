import { formatTime } from '@/lib/utils'
import type { Appointment } from '@/types'
import { StatusBadge } from '@/components/appointments/StatusBadge'

interface AppointmentTableProps {
  appointments: (Appointment & { patient: { name: string } })[]
  title?: string
  limit?: number
}

export function AppointmentTable({
  appointments,
  title = 'Próximas consultas',
  limit,
}: AppointmentTableProps) {
  const rows = limit ? appointments.slice(0, limit) : appointments

  return (
    <div className="bg-white rounded-xl border border-slate-200">
      <div className="px-5 py-4 border-b border-slate-100">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      </div>
      <div className="divide-y divide-slate-50">
        {rows.length === 0 ? (
          <p className="text-center text-slate-400 text-sm py-8">
            Nenhuma consulta encontrada.
          </p>
        ) : (
          rows.map((appt) => (
            <div
              key={appt.id}
              className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-sky-100 rounded-lg flex items-center justify-center text-sky-700 text-xs font-bold">
                  {formatTime(appt.scheduledAt)}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">{appt.patient.name}</p>
                  <p className="text-xs text-slate-400">{appt.procedure || 'Consulta'}</p>
                </div>
              </div>
              <StatusBadge status={appt.status} />
            </div>
          ))
        )}
      </div>
    </div>
  )
}
