'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Send, Filter } from 'lucide-react'
import { AppointmentForm } from '@/components/appointments/AppointmentForm'
import { StatusBadge } from '@/components/appointments/StatusBadge'
import { formatDateTimeFull, formatCurrency } from '@/lib/utils'
import type { AppointmentStatus } from '@/types'

interface AppointmentRow {
  id: string
  patient: { name: string; phone: string }
  scheduledAt: string
  procedure: string | null
  value: string | null
  status: AppointmentStatus
  duration: number
  reminders: { status: string }[]
}

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: '', label: 'Todos' },
  { value: 'SCHEDULED', label: 'Agendadas' },
  { value: 'CONFIRMED', label: 'Confirmadas' },
  { value: 'CANCELLED', label: 'Canceladas' },
  { value: 'NO_SHOW', label: 'Não vieram' },
  { value: 'COMPLETED', label: 'Realizadas' },
]

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<AppointmentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [sending, setSending] = useState<string | null>(null)

  const fetchAppointments = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (statusFilter) params.set('status', statusFilter)
    if (dateFilter) params.set('date', dateFilter)
    const res = await fetch(`/api/appointments?${params}`)
    const data = await res.json()
    setAppointments(data.appointments || [])
    setLoading(false)
  }, [statusFilter, dateFilter])

  useEffect(() => { fetchAppointments() }, [fetchAppointments])

  async function sendReminderNow(appointmentId: string) {
    setSending(appointmentId)
    await fetch('/api/whatsapp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appointmentId }),
    })
    setSending(null)
    fetchAppointments()
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Consultas</h1>
          <p className="text-slate-500 text-sm mt-1">Gerencie todos os agendamentos</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nova Consulta
        </button>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm text-slate-600">Filtros:</span>
        </div>
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
        <div className="flex gap-1">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === f.value
                  ? 'bg-sky-500 text-white'
                  : 'bg-white text-slate-600 border border-slate-300 hover:border-sky-300'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Paciente
              </th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Data/Hora
              </th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Procedimento
              </th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Valor
              </th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Status
              </th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Lembretes
              </th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center text-slate-400 py-12 text-sm">
                  Carregando...
                </td>
              </tr>
            ) : appointments.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center text-slate-400 py-12 text-sm">
                  Nenhuma consulta encontrada.
                </td>
              </tr>
            ) : (
              appointments.map((appt) => (
                <tr key={appt.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-4">
                    <p className="text-sm font-medium text-slate-900">{appt.patient.name}</p>
                    <p className="text-xs text-slate-400">{appt.patient.phone}</p>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-600">
                    {formatDateTimeFull(appt.scheduledAt)}
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-600">
                    {appt.procedure || '—'}
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-600">
                    {appt.value ? formatCurrency(Number(appt.value)) : '—'}
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={appt.status} />
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-xs text-slate-500">
                      {appt.reminders.filter((r) => r.status === 'SENT').length} enviados
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    {['SCHEDULED', 'CONFIRMED'].includes(appt.status) && (
                      <button
                        onClick={() => sendReminderNow(appt.id)}
                        disabled={sending === appt.id}
                        className="flex items-center gap-1 text-xs text-sky-600 hover:text-sky-700 font-medium disabled:opacity-50"
                      >
                        <Send className="w-3 h-3" />
                        {sending === appt.id ? 'Enviando...' : 'Lembrete'}
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <AppointmentForm
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false)
            fetchAppointments()
          }}
        />
      )}
    </div>
  )
}
