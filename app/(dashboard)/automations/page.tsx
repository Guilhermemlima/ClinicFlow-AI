'use client'

import { useState, useEffect } from 'react'
import { Bell, Clock, UserX, Star, Save } from 'lucide-react'

interface Template {
  id: string
  name: string
  body: string
  type: string
}

interface AutomationCard {
  id: string
  name: string
  trigger: string
  isActive: boolean
  templateId: string
  template: Template
}

const TRIGGER_ICONS: Record<string, React.ReactNode> = {
  '48h_before': <Bell className="w-5 h-5 text-sky-500" />,
  '2h_before': <Clock className="w-5 h-5 text-amber-500" />,
  'inactive_90_days': <UserX className="w-5 h-5 text-slate-500" />,
  'post_visit_4h': <Star className="w-5 h-5 text-yellow-500" />,
}

const TRIGGER_LABELS: Record<string, { title: string; desc: string }> = {
  '48h_before': {
    title: 'Lembrete 48h antes',
    desc: 'Enviado 2 dias antes da consulta para confirmação',
  },
  '2h_before': {
    title: 'Lembrete 2h antes',
    desc: 'Lembrete final enviado 2 horas antes da consulta',
  },
  'inactive_90_days': {
    title: 'Reativação de inativos',
    desc: 'Enviado para pacientes sem visita há 90+ dias',
  },
  'post_visit_4h': {
    title: 'Pesquisa pós-consulta',
    desc: 'Enviado 4 horas após a realização da consulta',
  },
}

const AVAILABLE_VARS = [
  { key: '{{nome_paciente}}', desc: 'Nome do paciente' },
  { key: '{{data_consulta}}', desc: 'Data e hora da consulta' },
  { key: '{{procedimento}}', desc: 'Procedimento agendado' },
  { key: '{{nome_clinica}}', desc: 'Nome da clínica' },
]

export default function AutomationsPage() {
  const [automations, setAutomations] = useState<AutomationCard[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<string | null>(null)
  const [editBody, setEditBody] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/automations')
      .then((r) => r.json())
      .then((autoData) => {
        setAutomations(autoData.automations || [])
        setLoading(false)
      })
  }, [])

  async function toggleAutomation(id: string, isActive: boolean) {
    setAutomations((prev) =>
      prev.map((a) => (a.id === id ? { ...a, isActive: !isActive } : a))
    )
    await fetch(`/api/automations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !isActive }),
    })
  }

  function startEdit(automation: AutomationCard) {
    setEditing(automation.id)
    setEditBody(automation.template.body)
  }

  async function saveTemplate(templateId: string) {
    setSaving(true)
    await fetch(`/api/templates/${templateId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: editBody }),
    })
    setAutomations((prev) =>
      prev.map((a) =>
        a.templateId === templateId
          ? { ...a, template: { ...a.template, body: editBody } }
          : a
      )
    )
    setSaving(false)
    setEditing(null)
  }

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400">Carregando automações...</div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Automações</h1>
        <p className="text-slate-500 text-sm mt-1">
          Configure os fluxos de mensagens automáticas via WhatsApp
        </p>
      </div>

      <div className="grid gap-4">
        {automations.map((auto) => {
          const meta = TRIGGER_LABELS[auto.trigger] || {
            title: auto.name,
            desc: '',
          }
          const isEditing = editing === auto.id

          return (
            <div
              key={auto.id}
              className="bg-white rounded-xl border border-slate-200 overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center">
                    {TRIGGER_ICONS[auto.trigger] || <Bell className="w-5 h-5 text-slate-400" />}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">{meta.title}</p>
                    <p className="text-slate-400 text-xs">{meta.desc}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => (isEditing ? setEditing(null) : startEdit(auto))}
                    className="text-sm text-sky-600 hover:text-sky-700 font-medium"
                  >
                    {isEditing ? 'Fechar' : 'Editar template'}
                  </button>
                  <button
                    onClick={() => toggleAutomation(auto.id, auto.isActive)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      auto.isActive ? 'bg-sky-500' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        auto.isActive ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {isEditing && (
                <div className="px-6 pb-6 border-t border-slate-100 pt-4 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                      Variáveis disponíveis
                    </label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {AVAILABLE_VARS.map((v) => (
                        <button
                          key={v.key}
                          type="button"
                          onClick={() => setEditBody((b) => b + v.key)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-sky-50 text-sky-700 rounded-md text-xs font-mono border border-sky-200 hover:bg-sky-100 transition-colors"
                          title={v.desc}
                        >
                          {v.key}
                        </button>
                      ))}
                    </div>
                    <textarea
                      value={editBody}
                      onChange={(e) => setEditBody(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm resize-none"
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={() => saveTemplate(auto.templateId)}
                      disabled={saving}
                      className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 disabled:bg-sky-300 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
                    >
                      <Save className="w-4 h-4" />
                      {saving ? 'Salvando...' : 'Salvar template'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
