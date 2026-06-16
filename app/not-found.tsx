import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-slate-100 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center gap-2 mb-6">
          <div className="w-10 h-10 bg-sky-500 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-lg">CF</span>
          </div>
          <span className="text-2xl font-bold text-slate-900">ClinicFlow AI</span>
        </div>
        <h1 className="text-5xl font-bold text-slate-900 mb-2">404</h1>
        <p className="text-slate-600 mb-8">
          Essa página não existe ou foi movida. Verifique o endereço ou volte para o início.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center bg-sky-500 hover:bg-sky-600 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors text-sm"
        >
          Voltar ao início
        </Link>
      </div>
    </div>
  )
}
