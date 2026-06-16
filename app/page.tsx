import Link from 'next/link'
import { auth } from '@/auth'
import {
  Calendar,
  MessageCircle,
  TrendingUp,
  Users,
  Check,
  ArrowRight,
  Sparkles,
} from 'lucide-react'

const FEATURES = [
  {
    icon: MessageCircle,
    title: 'Lembretes automáticos via WhatsApp',
    desc: 'Sua clínica envia confirmações 48h e 2h antes de cada consulta, sem precisar de ninguém na recepção lembrando manualmente.',
  },
  {
    icon: Sparkles,
    title: 'IA que entende as respostas',
    desc: 'O paciente responde "sim", "não posso" ou "quero remarcar" em linguagem natural — a IA classifica a intenção e atualiza o agendamento automaticamente.',
  },
  {
    icon: TrendingUp,
    title: 'ROI em tempo real',
    desc: 'Veja exatamente quantas faltas foram evitadas pela automação e quanto isso representa em receita recuperada, todo mês.',
  },
  {
    icon: Users,
    title: 'Reativação de pacientes inativos',
    desc: 'Pacientes que não voltam há 90 dias recebem uma mensagem de reativação automática, sem esforço da sua equipe.',
  },
]

const STEPS = [
  { step: '1', title: 'Conecte seu WhatsApp', desc: 'Escaneie um QR code e pronto — sua clínica já está integrada.' },
  { step: '2', title: 'Cadastre suas consultas', desc: 'Importe ou cadastre pacientes e agendamentos em poucos minutos.' },
  { step: '3', title: 'Deixe a automação trabalhar', desc: 'Lembretes, confirmações e reativações acontecem sozinhos, 24/7.' },
]

const PLANS = [
  { name: 'Solo', price: 'R$ 197', desc: '1 profissional', highlight: false },
  { name: 'Clínica', price: 'R$ 597', desc: 'Até 5 profissionais', highlight: true },
  { name: 'Premium', price: 'R$ 1.197', desc: 'Até 15 profissionais', highlight: false },
]

export default async function LandingPage() {
  const session = await auth()

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-sky-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">ZC</span>
            </div>
            <span className="text-lg font-bold text-slate-900">ZenCli</span>
          </div>
          {session ? (
            <Link
              href="/dashboard"
              className="bg-sky-500 hover:bg-sky-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              Ir para o Dashboard
            </Link>
          ) : (
            <div className="flex items-center gap-4">
              <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900">
                Entrar
              </Link>
              <Link
                href="/register"
                className="bg-sky-500 hover:bg-sky-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
              >
                Criar conta grátis
              </Link>
            </div>
          )}
        </div>
      </header>

      <section className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-sky-50 text-sky-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          Automação com IA para clínicas e consultórios
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 leading-tight mb-6">
          Pare de perder pacientes<br />por falta de lembrete
        </h1>
        <p className="text-sky-600 font-medium mb-4">Sua clínica fluindo sem esforço.</p>
        <p className="text-lg text-slate-500 max-w-2xl mx-auto mb-8">
          O ZenCli confirma consultas, reativa pacientes inativos e responde
          dúvidas pelo WhatsApp — automaticamente, com inteligência artificial,
          enquanto sua equipe foca no atendimento.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            Começar grátis por 14 dias
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="#como-funciona"
            className="text-slate-600 hover:text-slate-900 font-medium px-6 py-3"
          >
            Ver como funciona
          </Link>
        </div>
        <p className="text-xs text-slate-400 mt-4">Sem cartão de crédito · Cancele quando quiser</p>
      </section>

      <section className="bg-slate-50 border-y border-slate-100 py-10">
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-3 gap-6 text-center">
          <div>
            <p className="text-3xl font-bold text-slate-900">-32%</p>
            <p className="text-sm text-slate-500 mt-1">no-shows em média</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-slate-900">+100%</p>
            <p className="text-sm text-slate-500 mt-1">lembretes enviados sem esforço manual</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-slate-900">14 dias</p>
            <p className="text-sm text-slate-500 mt-1">grátis para testar, sem cartão</p>
          </div>
        </div>
      </section>

      <section id="como-funciona" className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-2xl font-bold text-slate-900 text-center mb-2">Tudo que sua clínica precisa</h2>
        <p className="text-slate-500 text-center mb-12">Automação completa do agendamento ao acompanhamento pós-consulta</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {FEATURES.map((f) => (
            <div key={f.title} className="p-6 rounded-xl border border-slate-200">
              <div className="w-10 h-10 bg-sky-50 rounded-lg flex items-center justify-center mb-4">
                <f.icon className="w-5 h-5 text-sky-500" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">{f.title}</h3>
              <p className="text-sm text-slate-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-slate-50 border-y border-slate-100 py-20">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-12">Como funciona</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {STEPS.map((s) => (
              <div key={s.step} className="text-center">
                <div className="w-10 h-10 bg-sky-500 text-white rounded-full flex items-center justify-center font-bold mx-auto mb-4">
                  {s.step}
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">{s.title}</h3>
                <p className="text-sm text-slate-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-2xl font-bold text-slate-900 text-center mb-2">Planos para todo tamanho de clínica</h2>
        <p className="text-slate-500 text-center mb-12">14 dias grátis em qualquer plano, sem compromisso</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`p-6 rounded-xl border-2 text-center ${
                plan.highlight ? 'border-sky-500 relative' : 'border-slate-200'
              }`}
            >
              {plan.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-sky-500 text-white text-[10px] font-bold px-3 py-1 rounded-full">
                  MAIS POPULAR
                </span>
              )}
              <p className="font-semibold text-slate-900 mb-1">{plan.name}</p>
              <p className="text-3xl font-bold text-slate-900 mb-1">
                {plan.price}<span className="text-sm font-normal text-slate-400">/mês</span>
              </p>
              <p className="text-sm text-slate-500 mb-4">{plan.desc}</p>
              <Link
                href="/register"
                className={`flex items-center justify-center gap-1 w-full py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                  plan.highlight
                    ? 'bg-sky-500 hover:bg-sky-600 text-white'
                    : 'border border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Check className="w-4 h-4" />
                Começar grátis
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-sky-500 py-16">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            Pronto para reduzir as faltas da sua clínica?
          </h2>
          <p className="text-sky-100 mb-8">
            Crie sua conta agora e comece a automatizar os lembretes em poucos minutos.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-white text-sky-600 font-semibold px-6 py-3 rounded-lg hover:bg-sky-50 transition-colors"
          >
            <Calendar className="w-4 h-4" />
            Começar período grátis de 14 dias
          </Link>
        </div>
      </section>

      <footer className="border-t border-slate-100 py-8">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between text-sm text-slate-400">
          <span>© {new Date().getFullYear()} ZenCli</span>
          <div className="flex items-center gap-6">
            <Link href="/login" className="hover:text-slate-600">Entrar</Link>
            <Link href="/register" className="hover:text-slate-600">Criar conta</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
