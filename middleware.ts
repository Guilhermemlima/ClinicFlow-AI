import NextAuth from 'next-auth'
import { NextResponse } from 'next/server'
import { authConfig } from '@/auth.config'

const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const isAuthPage = req.nextUrl.pathname.startsWith('/login') ||
    req.nextUrl.pathname.startsWith('/register') ||
    req.nextUrl.pathname.startsWith('/forgot-password') ||
    req.nextUrl.pathname.startsWith('/reset-password')
  // "/" agora é a landing page pública — não faz parte da área logada.
  const isDashboard = req.nextUrl.pathname.startsWith('/dashboard') ||
    req.nextUrl.pathname.startsWith('/appointments') ||
    req.nextUrl.pathname.startsWith('/patients') ||
    req.nextUrl.pathname.startsWith('/automations') ||
    req.nextUrl.pathname.startsWith('/reports') ||
    req.nextUrl.pathname.startsWith('/settings')

  if (!isLoggedIn && isDashboard) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  if (isLoggedIn && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
