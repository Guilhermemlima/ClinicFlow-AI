import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const search = searchParams.get('search') || ''
  const limit = parseInt(searchParams.get('limit') || '50')

  const patients = await prisma.patient.findMany({
    where: {
      clinicId: session.user.clinicId,
      OR: search
        ? [
            { name: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search } },
          ]
        : undefined,
    },
    orderBy: { name: 'asc' },
    take: limit,
  })

  return NextResponse.json({ patients })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { name, phone, email, birthDate } = body

  if (!name || !phone) {
    return NextResponse.json({ error: 'Nome e telefone obrigatórios.' }, { status: 400 })
  }

  const patient = await prisma.patient.create({
    data: {
      name,
      phone,
      email,
      birthDate: birthDate ? new Date(birthDate) : undefined,
      clinicId: session.user.clinicId,
    },
  })

  return NextResponse.json({ patient }, { status: 201 })
}
