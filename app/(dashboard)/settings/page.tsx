'use client'

import { useState, useEffect } from 'react'
import { Save, Wifi, WifiOff, RefreshCw } from 'lucide-react'
import { SPECIALTY_OPTIONS } from '@/types'

const TABS = [
  { id: 'clinic', label: 'Clínica' },
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'hours', label: 'Horários' },
  { id: 'plan', label: 'Plano' },
]

interface ClinicSettings {
  name: string
  specialty: string
  phone: string
  ticketMedio: number
  whatsappNumber: string
}

export default function SettingsPage() {
  const [tab, setTab] = useState('clinic')
  const [settings, setSettings] = useState<ClinicSettings>({
    name: '',
    specialty: '',
    phone: '',
    ticketMedio: 200,
    whatsappNumber: '',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [waStatus, setWaStatus] = useState<'connected' | 'disconnected' | 'unknown'>('unknown')
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [loadingQR, setLoadingQR] = useState(false)

  useEffect(() => {
    fetch('/api/settings').then((r) => r.json()).then((d) => {
      if (d.clinic) setSettings(d.clinic)
    })
    fetch('/api/whatsapp/status').then((r) => r.json()).then((d) => {
      setWaStatus(d.status || 'unknown')
    })
  }, [])

  async function saveSettings() {
    setSaving(true)
    await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function loadQRCode() {
    setLoadingQR(true)
    const res = await fetch('/api/whatsapp/qrcode')
    const data = await res.json()
    setQrCode(data.qrCode)
    setLoadingQR(false)
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Configurações</h1>
      </div>

      <div className="flex gap-1 mb-6 bg-white border border-slate-200 rounded-xl p-1 w-fit">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.id
                ? 'bg-sky-500 text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'clinic' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 max-w-lg space-y-5">
          <h2 className="font-semibold text-slate-900">Dados da Clínica</h2>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Nome da Clínica</label>
            <input
              value={settings.name}
              onChange={(e) => setSettings({ ...settings, name: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Especialidade</label>
            <select
              value={settings.specialty}
              onChange={(e) => setSettings({ ...settings, specialty: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm bg-white"
            >
              {SPECIALTY_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Telefone</label>
            <input
              value={settings.phone}
              onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
              placeholder="(41) 3333-4444"
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Ticket médio (R$)
              <span className="text-slate-400 font-normal ml-1 text-xs">— usado no cálculo de ROI</span>
            </label>
            <input
              type="number"
              value={settings.ticketMedio}
              onChange={(e) => setSettings({ ...settings, ticketMedio: Number(e.target.value) })}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
            />
          </div>
          <button
            onClick={saveSettings}
            disabled={saving}
            className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 disabled:bg-sky-300 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors"
          >
            <Save className="w-4 h-4" />
            {saved ? 'Salvo!' : saving ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </div>
      )}

      {tab === 'whatsapp' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 max-w-lg space-y-5">
          <h2 className="font-semibold text-slate-900">Integração WhatsApp</h2>
          <div className="flex items-center gap-3 p-4 rounded-lg border border-slate-200 bg-slate-50">
            {waStatus === 'connected' ? (
              <Wifi className="w-5 h-5 text-green-500" />
            ) : (
              <WifiOff className="w-5 h-5 text-red-400" />
            )}
            <div>
              <p className="text-sm font-medium text-slate-900">
                Status:{' '}
                <span className={waStatus === 'connected' ? 'text-green-600' : 'text-red-500'}>
                  {waStatus === 'connected'
                    ? 'Conectado'
                    : waStatus === 'disconnected'
                    ? 'Desconectado'
                    : 'Desconhecido'}
                </span>
              </p>
              <p className="text-xs text-slate-400">Evolution API — {process.env.NEXT_PUBLIC_WA_INSTANCE || 'clinicflow'}</p>
            </div>
          </div>
          {waStatus !== 'connected' && (
            <div className="space-y-3">
              <p className="text-sm text-slate-600">
                Escaneie o QR Code abaixo com o WhatsApp do número que deseja conectar:
              </p>
              {qrCode ? (
                <div className="flex justify-center p-4 bg-white border-2 border-dashed border-slate-300 rounded-xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrCode} alt="QR Code WhatsApp" className="w-48 h-48" />
                </div>
              ) : (
                <button
                  onClick={loadQRCode}
                  disabled={loadingQR}
                  className="flex items-center gap-2 px-4 py-2.5 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingQR ? 'animate-spin' : ''}`} />
                  {loadingQR ? 'Gerando QR Code...' : 'Gerar QR Code'}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {tab === 'hours' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 max-w-lg">
          <h2 className="font-semibold text-slate-900 mb-5">Horário de Funcionamento</h2>
          <div className="space-y-3">
            {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'].map((day) => (
              <div key={day} className="flex items-center gap-4">
                <span className="w-20 text-sm text-slate-600">{day}</span>
                <input
                  type="time"
                  defaultValue="08:00"
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <span className="text-slate-400 text-sm">até</span>
                <input
                  type="time"
                  defaultValue="18:00"
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            ))}
          </div>
          <button
            onClick={saveSettings}
            className="mt-5 flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors"
          >
            <Save className="w-4 h-4" />
            Salvar horários
          </button>
        </div>
      )}

      {tab === 'plan' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 max-w-lg space-y-5">
          <h2 className="font-semibold text-slate-900">Plano e Assinatura</h2>
          <div className="p-4 bg-sky-50 border border-sky-200 rounded-xl">
            <p className="text-sm font-medium text-sky-900">Plano atual: <strong>Solo</strong></p>
            <p className="text-xs text-sky-600 mt-1">R$ 197/mês · Próxima renovação: 15/07/2026</p>
          </div>
          <button className="w-full bg-sky-500 hover:bg-sky-600 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors">
            Fazer upgrade de plano
          </button>
          <button className="w-full border border-slate-300 text-slate-600 text-sm font-medium py-2.5 rounded-lg hover:bg-slate-50 transition-colors">
            Ver histórico de faturas
          </button>
        </div>
      )}
    </div>
  )
}
