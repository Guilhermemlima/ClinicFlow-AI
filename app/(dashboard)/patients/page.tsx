'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Search, UserX, RefreshCw } from 'lucide-react'
import { formatDate, isInactive, debounce } from '@/lib/utils'

interface PatientRow {
  id: string
  name: string
  phone: string
  email: string | null
  lastVisit: string | null
  totalVisits: number
  isActive: boolean
}

export default function PatientsPage() {
  const [patients, setPatients] = useState<PatientRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [reactivating, setReactivating] = useState<string | null>(null)

  const fetchPatients = useCallback(async (q: string) => {
    setLoading(true)
    const params = new URLSearchParams()
    if (q) params.set('search', q)
    const res = await fetch(`/api/patients?${params}`)
    const data = await res.json()
    setPatients(data.patients || [])
    setLoading(false)
  }, [])

  const debouncedFetch = useRef(debounce((q: string) => fetchPatients(q), 300))

  useEffect(() => { fetchPatients('') }, [fetchPatients])

  function handleSearch(value: string) {
    setSearch(value)
    debouncedFetch.current(value)
  }

  async function reactivatePatient(patientId: string) {
    setReactivating(patientId)
    await fetch('/api/patients/reactivate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patientId }),
    })
    setReactivating(null)
  }

  const inactive = patients.filter((p) => isInactive(p.lastVisit ? new Date(p.lastVisit) : null))

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pacientes</h1>
          <p className="text-slate-500 text-sm mt-1">
            {patients.length} pacientes cadastrados · {inactive.length} inativos
          </p>
        </div>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Buscar por nome ou telefone..."
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm bg-white"
        />
      </div>

      {inactive.length > 0 && !search && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <UserX className="w-4 h-4 text-amber-600" />
            <p className="text-sm font-semibold text-amber-700">
              {inactive.length} paciente(s) inativo(s) há mais de 90 dias
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {inactive.slice(0, 5).map((p) => (
              <div key={p.id} className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-amber-200">
                <span className="text-sm text-slate-700">{p.name}</span>
                <button
                  onClick={() => reactivatePatient(p.id)}
                  disabled={reactivating === p.id}
                  className="flex items-center gap-1 text-xs text-sky-600 hover:text-sky-700 font-medium disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${reactivating === p.id ? 'animate-spin' : ''}`} />
                  Reativar
                </button>
              </div>
            ))}
            {inactive.length > 5 && (
              <span className="text-sm text-amber-600 self-center">+{inactive.length - 5} mais</span>
            )}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Paciente
              </th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Telefone
              </th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Última visita
              </th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Total consultas
              </th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Status
              </th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center text-slate-400 py-12 text-sm">
                  Carregando...
                </td>
              </tr>
            ) : patients.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center text-slate-400 py-12 text-sm">
                  Nenhum paciente encontrado.
                </td>
              </tr>
            ) : (
              patients.map((patient) => {
                const inactive = isInactive(
                  patient.lastVisit ? new Date(patient.lastVisit) : null
                )
                return (
                  <tr key={patient.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4">
                      <p className="text-sm font-medium text-slate-900">{patient.name}</p>
                      {patient.email && (
                        <p className="text-xs text-slate-400">{patient.email}</p>
                      )}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">{patient.phone}</td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      {patient.lastVisit
                        ? formatDate(patient.lastVisit)
                        : <span className="text-slate-400">Nunca</span>}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600 text-center">
                      {patient.totalVisits}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                          inactive
                            ? 'bg-orange-50 text-orange-700 border-orange-200'
                            : 'bg-green-50 text-green-700 border-green-200'
                        }`}
                      >
                        {inactive ? 'Inativo' : 'Ativo'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {inactive && (
                        <button
                          onClick={() => reactivatePatient(patient.id)}
                          disabled={reactivating === patient.id}
                          className="flex items-center gap-1 text-xs text-sky-600 hover:text-sky-700 font-medium disabled:opacity-50"
                        >
                          <RefreshCw className={`w-3 h-3 ${reactivating === patient.id ? 'animate-spin' : ''}`} />
                          Reativar
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
