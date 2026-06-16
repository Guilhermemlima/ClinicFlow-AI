'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email('Email inválido'),
})
type FormData = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    setLoading(true)
    await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    setLoading(false)
    setSent(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-sky-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">ZC</span>
            </div>
            <span className="text-2xl font-bold text-slate-900">ZenCli</span>
          </div>
          <p className="text-slate-500">Recuperar senha</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          {sent ? (
            <div className="text-center space-y-4">
              <p className="text-slate-700 text-sm">
                Se esse email estiver cadastrado, você vai receber um link para redefinir sua senha em poucos minutos.
              </p>
              <Link href="/login" className="text-sky-500 hover:text-sky-600 font-medium text-sm">
                Voltar ao login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <p className="text-slate-600 text-sm">
                Digite o email da sua conta e enviaremos um link para redefinir sua senha.
              </p>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
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
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-sky-500 hover:bg-sky-600 disabled:bg-sky-300 text-white font-semibold py-2.5 rounded-lg transition-colors text-sm"
              >
                {loading ? 'Enviando...' : 'Enviar link de recuperação'}
              </button>
              <div className="text-center text-sm text-slate-500">
                <Link href="/login" className="text-sky-500 hover:text-sky-600 font-medium">
                  Voltar ao login
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
