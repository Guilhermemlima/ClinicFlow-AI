'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Unhandled error in app:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-slate-100 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-7 h-7 text-red-500" />
        </div>
        <h1 className="text-xl font-bold text-slate-900 mb-2">Algo deu errado</h1>
        <p className="text-slate-600 mb-8 text-sm">
          Ocorreu um erro inesperado. Você pode tentar novamente ou voltar para o início.
          {error.digest && (
            <span className="block mt-2 text-xs text-slate-400">Código: {error.digest}</span>
          )}
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="bg-sky-500 hover:bg-sky-600 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors text-sm"
          >
            Tentar novamente
          </button>
          <Link
            href="/"
            className="border border-slate-300 text-slate-600 hover:bg-slate-50 font-medium px-5 py-2.5 rounded-lg transition-colors text-sm"
          >
            Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  )
}
