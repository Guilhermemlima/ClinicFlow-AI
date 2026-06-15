import { cn } from '@/lib/utils'
import type { AppointmentStatus } from '@/types'

const STATUS_CONFIG: Record<AppointmentStatus, { label: string; className: string }> = {
  SCHEDULED: {
    label: 'Agendada',
    className: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  CONFIRMED: {
    label: 'Confirmada',
    className: 'bg-green-50 text-green-700 border-green-200',
  },
  CANCELLED: {
    label: 'Cancelada',
    className: 'bg-red-50 text-red-700 border-red-200',
  },
  NO_SHOW: {
    label: 'Não veio',
    className: 'bg-orange-50 text-orange-700 border-orange-200',
  },
  COMPLETED: {
    label: 'Realizada',
    className: 'bg-slate-50 text-slate-600 border-slate-200',
  },
}

interface StatusBadgeProps {
  status: AppointmentStatus
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status]
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        config.className
      )}
    >
      {config.label}
    </span>
  )
}
