import type { NextAuthConfig } from 'next-auth'

// Config compatível com o Edge Runtime — sem PrismaAdapter, bcrypt ou
// qualquer dependência Node.js. Usada pelo middleware (Edge) e estendida
// pela config completa em auth.ts (Node.js, usada nas rotas/server actions).
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as { role?: string }).role
        token.clinicId = (user as { clinicId?: string }).clinicId
        token.clinicName = (user as { clinicName?: string }).clinicName
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.clinicId = token.clinicId as string
        session.user.clinicName = token.clinicName as string
      }
      return session
    },
  },
}
