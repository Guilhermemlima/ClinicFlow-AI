import NextAuth from 'next-auth'
import { NextResponse } from 'next/server'
import { authConfig } from '@/auth.config'

const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const isAuthPage = req.nextUrl.pathname.startsWith('/login') ||
    req.nextUrl.pathname.startsWith('/register')
  const isDashboard = req.nextUrl.pathname === '/' ||
    req.nextUrl.pathname.startsWith('/appointments') ||
    req.nextUrl.pathname.startsWith('/patients') ||
    req.nextUrl.pathname.startsWith('/automations') ||
    req.nextUrl.pathname.startsWith('/reports') ||
    req.nextUrl.pathname.startsWith('/settings')

  if (!isLoggedIn && isDashboard) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  if (isLoggedIn && isAuthPage) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
