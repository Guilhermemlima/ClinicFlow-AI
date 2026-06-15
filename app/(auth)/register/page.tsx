'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { SPECIALTY_OPTIONS } from '@/types'

const schema = z.object({
  clinicName: z.string().min(2, 'Nome da clínica obrigatório'),
  ownerName: z.string().min(2, 'Seu nome é obrigatório'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  specialty: z.string().min(1, 'Selecione uma especialidade'),
  plan: z.enum(['SOLO', 'CLINIC', 'PREMIUM']),
})
type FormData = z.infer<typeof schema>

const PLANS = [
  {
    id: 'SOLO',
    name: 'Solo',
    price: 'R$ 197/mês',
    desc: '1 profissional',
    highlight: false,
  },
  {
    id: 'CLINIC',
    name: 'Clínica',
    price: 'R$ 597/mês',
    desc: 'Até 5 profissionais',
    highlight: true,
  },
  {
    id: 'PREMIUM',
    name: 'Premium',
    price: 'R$ 1.197/mês',
    desc: 'Até 15 profissionais',
    highlight: false,
  },
]

export default function RegisterPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { plan: 'SOLO' },
  })

  const selectedPlan = watch('plan')

  async function onSubmit(data: FormData) {
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error || 'Erro ao criar conta.')
        setLoading(false)
        return
      }
      router.push('/login?registered=1')
    } catch {
      setError('Erro ao criar conta. Tente novamente.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-sky-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">CF</span>
            </div>
            <span className="text-2xl font-bold text-slate-900">ClinicFlow AI</span>
          </div>
          <p className="text-slate-500">14 dias grátis, sem cartão de crédito</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-6">Criar conta</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {error && (
              <div className="bg-red-50 text-red-600 text-sm rounded-lg px-4 py-3 border border-red-200">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Nome da Clínica
                </label>
                <input
                  {...register('clinicName')}
                  placeholder="Odontoclínica Silva"
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
                />
                {errors.clinicName && (
                  <p className="text-red-500 text-xs mt-1">{errors.clinicName.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Seu Nome
                </label>
                <input
                  {...register('ownerName')}
                  placeholder="Dr. João Silva"
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
                />
                {errors.ownerName && (
                  <p className="text-red-500 text-xs mt-1">{errors.ownerName.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <input
                {...register('email')}
                type="email"
                placeholder="clinica@email.com"
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Senha</label>
              <input
                {...register('password')}
                type="password"
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
              />
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Especialidade
              </label>
              <select
                {...register('specialty')}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm bg-white"
              >
                <option value="">Selecione...</option>
                {SPECIALTY_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              {errors.specialty && (
                <p className="text-red-500 text-xs mt-1">{errors.specialty.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Plano</label>
              <div className="grid grid-cols-3 gap-3">
                {PLANS.map((plan) => (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => setValue('plan', plan.id as 'SOLO' | 'CLINIC' | 'PREMIUM')}
                    className={`relative p-3 rounded-xl border-2 text-left transition-all ${
                      selectedPlan === plan.id
                        ? 'border-sky-500 bg-sky-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {plan.highlight && (
                      <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-sky-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        POPULAR
                      </span>
                    )}
                    <p className="font-semibold text-sm text-slate-900">{plan.name}</p>
                    <p className="text-sky-600 font-bold text-sm">{plan.price}</p>
                    <p className="text-slate-400 text-xs">{plan.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-sky-500 hover:bg-sky-600 disabled:bg-sky-300 text-white font-semibold py-3 rounded-lg transition-colors text-sm mt-2"
            >
              {loading ? 'Criando conta...' : 'Começar período grátis de 14 dias →'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-500">
            Já tem conta?{' '}
            <Link href="/login" className="text-sky-500 hover:text-sky-600 font-medium">
              Entrar
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
