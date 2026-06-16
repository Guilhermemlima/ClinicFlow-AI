'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Check, Circle, X, Sparkles } from 'lucide-react'

export interface OnboardingStep {
  id: string
  label: string
  done: boolean
  href: string
  cta: string
}

interface OnboardingChecklistProps {
  clinicId: string
  steps: OnboardingStep[]
}

export function OnboardingChecklist({ clinicId, steps }: OnboardingChecklistProps) {
  const storageKey = `clinicflow:onboarding-dismissed:${clinicId}`
  const [dismissed, setDismissed] = useState(true) // evita flash antes de checar localStorage

  useEffect(() => {
    setDismissed(localStorage.getItem(storageKey) === '1')
  }, [storageKey])

  const allDone = steps.every((s) => s.done)
  if (allDone || dismissed) return null

  const doneCount = steps.filter((s) => s.done).length

  function dismiss() {
    localStorage.setItem(storageKey, '1')
    setDismissed(true)
  }

  return (
    <div className="bg-white rounded-xl border border-sky-200 p-6 relative">
      <button
        onClick={dismiss}
        className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
        aria-label="Fechar"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-center gap-2 mb-1">
        <Sparkles className="w-4 h-4 text-sky-500" />
        <h2 className="font-semibold text-slate-900">Primeiros passos</h2>
      </div>
      <p className="text-sm text-slate-500 mb-4">
        Complete {steps.length - doneCount} etapa{steps.length - doneCount !== 1 ? 's' : ''} para aproveitar o ClinicFlow AI ao máximo ({doneCount}/{steps.length})
      </p>

      <div className="space-y-2">
        {steps.map((step) => (
          <Link
            key={step.id}
            href={step.href}
            className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
              step.done
                ? 'border-slate-100 bg-slate-50'
                : 'border-slate-200 hover:border-sky-300 hover:bg-sky-50'
            }`}
          >
            <div className="flex items-center gap-3">
              {step.done ? (
                <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-white" />
                </div>
              ) : (
                <Circle className="w-5 h-5 text-slate-300 flex-shrink-0" />
              )}
              <span className={`text-sm ${step.done ? 'text-slate-400 line-through' : 'text-slate-700 font-medium'}`}>
                {step.label}
              </span>
            </div>
            {!step.done && (
              <span className="text-xs text-sky-600 font-medium whitespace-nowrap">{step.cta} →</span>
            )}
          </Link>
        ))}
      </div>
    </div>
  )
}
