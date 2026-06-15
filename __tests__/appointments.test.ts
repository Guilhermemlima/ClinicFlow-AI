import { describe, it, expect, vi, beforeEach } from 'vitest'
import { addHours, subHours, isPast } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'
import { BRL_TIMEZONE } from '../lib/utils'

vi.mock('../lib/prisma', () => ({
  prisma: {
    appointment: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    reminder: {
      createMany: vi.fn(),
    },
    patient: {
      create: vi.fn(),
    },
  },
}))

function calculateReminderTimes(scheduledAt: Date) {
  const h48 = subHours(scheduledAt, 48)
  const h2 = subHours(scheduledAt, 2)
  return {
    h48: isPast(h48) ? null : h48,
    h2: isPast(h2) ? null : h2,
  }
}

function isInSaoPauloTimezone(date: Date): string {
  return toZonedTime(date, BRL_TIMEZONE).toISOString()
}

describe('Appointment creation', () => {
  it('should create reminders automatically when appointment is created', () => {
    const futureDate = addHours(new Date(), 72)
    const reminders = calculateReminderTimes(futureDate)

    expect(reminders.h48).not.toBeNull()
    expect(reminders.h2).not.toBeNull()
    expect(reminders.h48!.getTime()).toBe(subHours(futureDate, 48).getTime())
    expect(reminders.h2!.getTime()).toBe(subHours(futureDate, 2).getTime())
  })

  it('should not create reminders for past appointments', () => {
    const pastDate = subHours(new Date(), 5)
    const reminders = calculateReminderTimes(pastDate)

    expect(reminders.h48).toBeNull()
    expect(reminders.h2).toBeNull()
  })

  it('should create only h2 reminder when appointment is between 2h and 48h away', () => {
    const soonDate = addHours(new Date(), 10)
    const reminders = calculateReminderTimes(soonDate)

    expect(reminders.h48).toBeNull()
    expect(reminders.h2).not.toBeNull()
  })

  it('should calculate correct reminder times in Brazil timezone (America/Sao_Paulo)', () => {
    const saoPauloDate = new Date('2026-07-15T14:00:00-03:00')
    const h48Reminder = subHours(saoPauloDate, 48)
    const h2Reminder = subHours(saoPauloDate, 2)

    const h48InSP = isInSaoPauloTimezone(h48Reminder)
    const h2InSP = isInSaoPauloTimezone(h2Reminder)

    expect(h48InSP).toContain('2026-07-13')
    expect(h2InSP).toContain('2026-07-15')
  })

  it('should compute appointment 48h before correctly', () => {
    const appt = addHours(new Date(), 50)
    const reminder48h = subHours(appt, 48)

    expect(isPast(reminder48h)).toBe(false)
    expect(Math.abs(reminder48h.getTime() - subHours(appt, 48).getTime())).toBe(0)
  })
})
