import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { formatInTimeZone } from 'date-fns-tz'
import { ptBR } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const BRL_TIMEZONE = 'America/Sao_Paulo'

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatDate(date: Date | string, pattern = 'dd/MM/yyyy'): string {
  return formatInTimeZone(new Date(date), BRL_TIMEZONE, pattern, { locale: ptBR })
}

export function formatDateTime(date: Date | string): string {
  return formatInTimeZone(new Date(date), BRL_TIMEZONE, "EEEE, d 'de' MMMM 'às' HH'h'mm", {
    locale: ptBR,
  })
}

export function formatDateTimeFull(date: Date | string): string {
  return formatInTimeZone(new Date(date), BRL_TIMEZONE, "dd/MM/yyyy 'às' HH:mm", {
    locale: ptBR,
  })
}

export function formatTime(date: Date | string): string {
  return formatInTimeZone(new Date(date), BRL_TIMEZONE, 'HH:mm', { locale: ptBR })
}

export function toSaoPauloDate(date: Date | string): Date {
  return new Date(formatInTimeZone(new Date(date), BRL_TIMEZONE, "yyyy-MM-dd'T'HH:mm:ss"))
}

export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '')
}

export function formatPhone(phone: string): string {
  const digits = normalizePhone(phone)
  if (digits.length === 13) {
    return `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4, 9)}-${digits.slice(9)}`
  }
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
  }
  return phone
}

export function isInactive(lastVisit: Date | null | undefined): boolean {
  if (!lastVisit) return true
  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
  return new Date(lastVisit) < ninetyDaysAgo
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function debounce<T extends (...args: any[]) => any>(fn: T, delay: number) {
  let timer: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}
