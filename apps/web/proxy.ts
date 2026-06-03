import NextAuth from 'next-auth'
import { authConfig } from '@/auth.config'
import type { NextRequest } from 'next/server'

const { auth } = NextAuth(authConfig)

export async function proxy(req: NextRequest) {
  return (auth as (req: NextRequest) => Promise<Response | undefined>)(req)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
