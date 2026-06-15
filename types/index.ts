export type Plan = 'SOLO' | 'CLINIC' | 'PREMIUM'
export type Role = 'OWNER' | 'ADMIN' | 'STAFF'
export type AppointmentStatus = 'SCHEDULED' | 'CONFIRMED' | 'CANCELLED' | 'NO_SHOW' | 'COMPLETED'
export type ReminderType = 'HOURS_48' | 'HOURS_2' | 'REACTIVATION' | 'POST_VISIT'
export type ReminderStatus = 'PENDING' | 'SENT' | 'FAILED' | 'RESPONDED'
export type TemplateType = 'CONFIRMATION' | 'REMINDER' | 'REACTIVATION' | 'CANCELLATION' | 'POST_VISIT'
export type Direction = 'OUTBOUND' | 'INBOUND'
export type IntentType = 'confirm' | 'cancel' | 'reschedule' | 'question'

export interface Clinic {
  id: string
  name: string
  email: string
  phone?: string | null
  whatsappNumber?: string | null
  specialty?: string | null
  plan: Plan
  stripeCustomerId?: string | null
  stripeSubId?: string | null
  isActive: boolean
  ticketMedio?: number | null
  createdAt: Date
  updatedAt: Date
}

export interface Patient {
  id: string
  name: string
  phone: string
  email?: string | null
  birthDate?: Date | null
  clinicId: string
  lastVisit?: Date | null
  totalVisits: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Appointment {
  id: string
  patientId: string
  clinicId: string
  scheduledAt: Date
  duration: number
  status: AppointmentStatus
  procedure?: string | null
  value?: number | null
  notes?: string | null
  createdAt: Date
  updatedAt: Date
  patient?: Patient
}

export interface Reminder {
  id: string
  appointmentId: string
  type: ReminderType
  scheduledFor: Date
  sentAt?: Date | null
  status: ReminderStatus
  messageId?: string | null
  createdAt: Date
}

export interface MessageTemplate {
  id: string
  clinicId: string
  name: string
  body: string
  type: TemplateType
  createdAt: Date
}

export interface Automation {
  id: string
  clinicId: string
  name: string
  trigger: string
  isActive: boolean
  templateId: string
  template?: MessageTemplate
  createdAt: Date
}

export interface Message {
  id: string
  patientId: string
  direction: Direction
  content: string
  whatsappId?: string | null
  intent?: string | null
  sentAt: Date
  readAt?: Date | null
}

export interface DashboardMetrics {
  todayScheduled: number
  todayConfirmed: number
  todayNoShows: number
  weekScheduled: number
  weekConfirmed: number
  weekCancelled: number
  weekNoShows: number
  monthConfirmationRate: number
  monthNoShowsAvoided: number
  monthReactivations: number
  monthROI: number
  ticketMedio: number
}

export interface ClassifyIntentResult {
  intent: IntentType
  confidence: number
}

export const PLAN_LABELS: Record<Plan, string> = {
  SOLO: 'Solo — R$ 197/mês',
  CLINIC: 'Clínica — R$ 597/mês',
  PREMIUM: 'Premium — R$ 1.197/mês',
}

export const SPECIALTY_OPTIONS = [
  'Odontologia',
  'Dermatologia',
  'Ortopedia',
  'Cardiologia',
  'Ginecologia',
  'Pediatria',
  'Neurologia',
  'Oftalmologia',
  'Psiquiatria',
  'Estética',
  'Fisioterapia',
  'Nutrição',
  'Outra',
]
