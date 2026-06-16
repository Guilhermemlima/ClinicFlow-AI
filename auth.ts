import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { authConfig } from '@/auth.config'
import { checkRateLimit, getClientIp } from '@/lib/rateLimit'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials, request) {
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) return null

        // Limite por email+IP — impede brute force de senha sem bloquear
        // um usuário legítimo que erra a senha algumas vezes.
        const ip = getClientIp(request)
        const { allowed } = checkRateLimit(
          `login:${parsed.data.email}:${ip}`,
          10,
          15 * 60 * 1000
        )
        if (!allowed) return null

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
          include: { clinic: true },
        })

        if (!user) return null

        const passwordMatch = await bcrypt.compare(parsed.data.password, user.password)
        if (!passwordMatch) return null

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          clinicId: user.clinicId,
          clinicName: user.clinic.name,
        }
      },
    }),
  ],
})
