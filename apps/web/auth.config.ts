import type { NextAuthConfig } from 'next-auth'

export const authConfig: NextAuthConfig = {
  pages: { signIn: '/logowanie' },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.isAdmin = (user as { isAdmin?: boolean }).isAdmin ?? false
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.isAdmin = token.isAdmin as boolean
      }
      return session
    },
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user
      const isAdmin = !!(auth?.user as { isAdmin?: boolean })?.isAdmin
      const { pathname } = request.nextUrl

      const isPublic =
        pathname.startsWith('/logowanie') ||
        pathname.startsWith('/rejestracja') ||
        pathname.startsWith('/api/auth') ||
        pathname.startsWith('/api/admin/sync-results')

      if (pathname.startsWith('/admin')) {
        return isLoggedIn && isAdmin
      }

      if (!isLoggedIn && !isPublic) return false
      return true
    },
  },
}
