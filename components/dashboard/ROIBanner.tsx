import Link from 'next/link'
import { TrendingUp } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface ROIBannerProps {
  noShowsAvoided: number
  ticketMedio: number
}

export function ROIBanner({ noShowsAvoided, ticketMedio }: ROIBannerProps) {
  const roi = noShowsAvoided * ticketMedio

  return (
    <div className="bg-gradient-to-r from-slate-900 to-sky-900 rounded-2xl p-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-sky-500/20 rounded-xl flex items-center justify-center">
          <TrendingUp className="w-6 h-6 text-sky-400" />
        </div>
        <div>
          <p className="text-sky-300 text-sm font-medium">ROI do mês</p>
          <p className="text-white text-2xl font-bold">
            {formatCurrency(roi)} recuperados
          </p>
          <p className="text-slate-400 text-sm">
            {noShowsAvoided} no-shows evitados × {formatCurrency(ticketMedio)} ticket médio
          </p>
        </div>
      </div>
      <Link
        href="/reports"
        className="bg-sky-500 hover:bg-sky-400 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
      >
        Ver relatório
      </Link>
    </div>
  )
}
