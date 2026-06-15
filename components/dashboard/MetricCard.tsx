import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: LucideIcon
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
  className?: string
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  className,
}: MetricCardProps) {
  return (
    <div className={cn('bg-white rounded-xl border border-slate-200 p-5', className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-500 text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
          {subtitle && <p className="text-slate-400 text-xs mt-1">{subtitle}</p>}
        </div>
        {Icon && (
          <div className="w-10 h-10 bg-sky-50 rounded-lg flex items-center justify-center">
            <Icon className="w-5 h-5 text-sky-500" />
          </div>
        )}
      </div>
      {trend && trendValue && (
        <div className="mt-3 flex items-center gap-1">
          <span
            className={cn('text-xs font-medium', {
              'text-green-500': trend === 'up',
              'text-red-500': trend === 'down',
              'text-slate-400': trend === 'neutral',
            })}
          >
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {trendValue}
          </span>
          <span className="text-slate-400 text-xs">vs. mês anterior</span>
        </div>
      )}
    </div>
  )
}
