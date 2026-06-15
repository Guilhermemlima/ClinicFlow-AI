import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { body } = await req.json()

  await prisma.messageTemplate.updateMany({
    where: { id: params.id, clinicId: session.user.clinicId },
    data: { body },
  })

  return NextResponse.json({ success: true })
}
