import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { subHours, isPast } from 'date-fns'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const status = searchParams.get('status')
  const date = searchParams.get('date')

  const where: Record<string, unknown> = { clinicId: session.user.clinicId }
  if (status) where.status = status
  if (date) {
    const d = new Date(date)
    const start = new Date(d.setHours(0, 0, 0, 0))
    const end = new Date(d.setHours(23, 59, 59, 999))
    where.scheduledAt = { gte: start, lte: end }
  }

  const appointments = await prisma.appointment.findMany({
    where,
    include: {
      patient: { select: { name: true, phone: true } },
      reminders: { select: { status: true } },
    },
    orderBy: { scheduledAt: 'desc' },
    take: 100,
  })

  return NextResponse.json({ appointments })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { patientId, newPatient, scheduledAt, duration, procedure, value, notes } = body

  let resolvedPatientId = patientId

  if (!patientId && newPatient) {
    const patient = await prisma.patient.create({
      data: {
        name: newPatient.name,
        phone: newPatient.phone,
        clinicId: session.user.clinicId,
      },
    })
    resolvedPatientId = patient.id
  }

  if (!resolvedPatientId) {
    return NextResponse.json({ error: 'Paciente obrigatório.' }, { status: 400 })
  }

  const scheduledDate = new Date(scheduledAt)
  if (isPast(scheduledDate)) {
    return NextResponse.json({ error: 'Data no passado não permitida.' }, { status: 400 })
  }

  const appointment = await prisma.appointment.create({
    data: {
      patientId: resolvedPatientId,
      clinicId: session.user.clinicId,
      scheduledAt: scheduledDate,
      duration: duration || 30,
      procedure,
      value: value ? value : null,
      notes,
    },
  })

  const reminders = []
  const h48 = subHours(scheduledDate, 48)
  const h2 = subHours(scheduledDate, 2)

  if (!isPast(h48)) {
    reminders.push({
      appointmentId: appointment.id,
      type: 'HOURS_48' as const,
      scheduledFor: h48,
    })
  }
  if (!isPast(h2)) {
    reminders.push({
      appointmentId: appointment.id,
      type: 'HOURS_2' as const,
      scheduledFor: h2,
    })
  }

  if (reminders.length > 0) {
    await prisma.reminder.createMany({ data: reminders })
  }

  return NextResponse.json({ appointment }, { status: 201 })
}
