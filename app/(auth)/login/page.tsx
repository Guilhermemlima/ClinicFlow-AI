'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
})
type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    setError('')
    setLoading(true)
    const result = await signIn('credentials', {
      email: data.email,
      password: data.password,
      redirect: false,
    })
    setLoading(false)
    if (result?.error) {
      setError('Email ou senha incorretos.')
    } else {
      router.push('/')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-sky-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">CF</span>
            </div>
            <span className="text-2xl font-bold text-slate-900">ClinicFlow AI</span>
          </div>
          <p className="text-slate-500">Entre na sua conta</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {error && (
              <div className="bg-red-50 text-red-600 text-sm rounded-lg px-4 py-3 border border-red-200">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Email
              </label>
              <input
                {...register('email')}
                type="email"
                placeholder="clinica@email.com"
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm"
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-slate-700">
                  Senha
                </label>
                <Link href="/forgot-password" className="text-xs text-sky-500 hover:text-sky-600 font-medium">
                  Esqueci minha senha
                </Link>
              </div>
              <input
                {...register('password')}
                type="password"
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm"
              />
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-sky-500 hover:bg-sky-600 disabled:bg-sky-300 text-white font-semibold py-2.5 rounded-lg transition-colors text-sm"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-500">
            Não tem conta?{' '}
            <Link href="/register" className="text-sky-500 hover:text-sky-600 font-medium">
              Criar conta grátis
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
