'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X } from 'lucide-react'

const schema = z.object({
  patientId: z.string().min(1, 'Selecione ou crie um paciente'),
  newPatientName: z.string().optional(),
  newPatientPhone: z.string().optional(),
  scheduledAt: z.string().min(1, 'Data obrigatória'),
  scheduledTime: z.string().min(1, 'Horário obrigatório'),
  duration: z.string(),
  procedure: z.string().min(1, 'Procedimento obrigatório'),
  value: z.string(),
  notes: z.string().optional(),
})
type FormData = z.infer<typeof schema>

interface Patient {
  id: string
  name: string
  phone: string
}

interface AppointmentFormProps {
  onClose: () => void
  onSuccess: () => void
}

export function AppointmentForm({ onClose, onSuccess }: AppointmentFormProps) {
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [createNew, setCreateNew] = useState(false)

  const { register, handleSubmit, formState: { errors }, setValue } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { duration: '30', value: '0' },
  })

  useEffect(() => {
    fetch('/api/patients?limit=100')
      .then((r) => r.json())
      .then((d) => setPatients(d.patients || []))
  }, [])

  async function onSubmit(data: FormData) {
    setError('')
    setLoading(true)
    const scheduledAt = new Date(`${data.scheduledAt}T${data.scheduledTime}:00`)

    const res = await fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patientId: data.patientId !== 'new' ? data.patientId : undefined,
        newPatient: data.patientId === 'new'
          ? { name: data.newPatientName, phone: data.newPatientPhone }
          : undefined,
        scheduledAt: scheduledAt.toISOString(),
        duration: parseInt(data.duration) || 30,
        procedure: data.procedure,
        value: parseFloat(data.value) || 0,
        notes: data.notes,
      }),
    })

    setLoading(false)
    if (!res.ok) {
      const json = await res.json()
      setError(json.error || 'Erro ao salvar consulta.')
      return
    }
    onSuccess()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Nova Consulta</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm rounded-lg px-4 py-3 border border-red-200">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Paciente</label>
            <select
              {...register('patientId')}
              onChange={(e) => {
                setValue('patientId', e.target.value)
                setCreateNew(e.target.value === 'new')
              }}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm bg-white"
            >
              <option value="">Selecione um paciente...</option>
              <option value="new">+ Novo paciente</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {p.phone}
                </option>
              ))}
            </select>
            {errors.patientId && (
              <p className="text-red-500 text-xs mt-1">{errors.patientId.message}</p>
            )}
          </div>

          {createNew && (
            <div className="grid grid-cols-2 gap-3 p-3 bg-sky-50 rounded-lg">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Nome</label>
                <input
                  {...register('newPatientName')}
                  placeholder="Nome completo"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Telefone</label>
                <input
                  {...register('newPatientPhone')}
                  placeholder="5541999999999"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Data</label>
              <input
                {...register('scheduledAt')}
                type="date"
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
              />
              {errors.scheduledAt && (
                <p className="text-red-500 text-xs mt-1">{errors.scheduledAt.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Horário</label>
              <input
                {...register('scheduledTime')}
                type="time"
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
              />
              {errors.scheduledTime && (
                <p className="text-red-500 text-xs mt-1">{errors.scheduledTime.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Duração</label>
              <select
                {...register('duration')}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm bg-white"
              >
                {[15, 30, 45, 60, 90].map((d) => (
                  <option key={d} value={d}>{d} minutos</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Valor (R$)</label>
              <input
                {...register('value', { valueAsNumber: true })}
                type="number"
                step="0.01"
                min="0"
                placeholder="200.00"
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Procedimento</label>
            <input
              {...register('procedure')}
              placeholder="Ex: Limpeza dental, Consulta, Extração..."
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
            />
            {errors.procedure && (
              <p className="text-red-500 text-xs mt-1">{errors.procedure.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Observações <span className="text-slate-400">(opcional)</span>
            </label>
            <textarea
              {...register('notes')}
              rows={2}
              placeholder="Anotações internas sobre a consulta..."
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-sky-500 hover:bg-sky-600 disabled:bg-sky-300 text-white font-semibold py-2.5 rounded-lg transition-colors text-sm"
            >
              {loading ? 'Salvando...' : 'Agendar consulta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
