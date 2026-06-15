'use client'

import { useState, useEffect } from 'react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { TrendingUp, Users, DollarSign, MessageSquare, Download } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

const PERIOD_OPTIONS = [
  { value: '7', label: 'Últimos 7 dias' },
  { value: '30', label: 'Últimos 30 dias' },
  { value: '90', label: 'Últimos 90 dias' },
]

const PIE_COLORS = ['#0EA5E9', '#22C55E', '#EF4444', '#F59E0B', '#94A3B8']

interface ReportData {
  confirmationRate: number
  noShowsAvoided: number
  revenueRecovered: number
  reactivations: number
  responseRate: number
  weeklyRate: { week: string; rate: number }[]
  statusDist: { name: string; value: number }[]
  timeDist: { period: string; count: number }[]
  topProcedures: { procedure: string; count: number }[]
}

export default function ReportsPage() {
  const [period, setPeriod] = useState('30')
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/reports?period=${period}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d)
        setLoading(false)
      })
  }, [period])

  if (loading || !data) {
    return <div className="p-8 text-center text-slate-400">Carregando relatório...</div>
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Relatórios</h1>
          <p className="text-slate-500 text-sm mt-1">Análise de desempenho da clínica</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            {PERIOD_OPTIONS.map((o) => (
              <button
                key={o.value}
                onClick={() => setPeriod(o.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  period === o.value
                    ? 'bg-sky-500 text-white'
                    : 'bg-white border border-slate-300 text-slate-600 hover:border-sky-300'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-600 hover:bg-slate-50">
            <Download className="w-3.5 h-3.5" />
            Exportar CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-sky-50 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-sky-500" />
            </div>
            <span className="text-sm text-slate-500">Taxa de confirmação</span>
          </div>
          <p className="text-3xl font-bold text-slate-900">{data.confirmationRate}%</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-green-50 rounded-lg flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-green-500" />
            </div>
            <span className="text-sm text-slate-500">Receita recuperada</span>
          </div>
          <p className="text-3xl font-bold text-slate-900">{formatCurrency(data.revenueRecovered)}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-purple-50 rounded-lg flex items-center justify-center">
              <Users className="w-4 h-4 text-purple-500" />
            </div>
            <span className="text-sm text-slate-500">Reativações</span>
          </div>
          <p className="text-3xl font-bold text-slate-900">{data.reactivations}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-amber-50 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-amber-500" />
            </div>
            <span className="text-sm text-slate-500">Taxa de resposta WhatsApp</span>
          </div>
          <p className="text-3xl font-bold text-slate-900">{data.responseRate}%</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">
            Taxa de confirmação por semana
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data.weeklyRate}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} unit="%" />
              <Tooltip formatter={(v) => [`${v}%`, 'Taxa']} />
              <Line
                type="monotone"
                dataKey="rate"
                stroke="#0EA5E9"
                strokeWidth={2}
                dot={{ fill: '#0EA5E9', r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">
            Distribuição por status
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={data.statusDist}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
              >
                {data.statusDist.map((_, index) => (
                  <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">
            Consultas por período do dia
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.timeDist}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
              <Tooltip />
              <Bar dataKey="count" name="Consultas" fill="#0EA5E9" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">
            Top 10 procedimentos
          </h3>
          <div className="space-y-2">
            {data.topProcedures.slice(0, 8).map((p, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-sm text-slate-600 truncate">{p.procedure || 'Consulta'}</span>
                <span className="text-sm font-medium text-slate-900 ml-2">{p.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
