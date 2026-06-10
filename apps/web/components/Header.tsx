'use client'

import { useSession, signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import RulesModal from '@/components/RulesModal'
import { LOGO_SRC } from '@/lib/logo'

export default function Header() {
  const { data: session } = useSession()
  const pathname = usePathname()

  const navLink = (href: string, label: string) => (
    <a
      key={href}
      href={href}
      className={`text-sm transition ${
        pathname === href
          ? 'text-[#2e3192] font-semibold'
          : 'text-[#434351]/50 hover:text-[#434351]'
      }`}
    >
      {label}
    </a>
  )

  return (
    <div className="bg-white/90 sticky top-0 z-10 border-b border-[#2e3192]/10 backdrop-blur">
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
        <a href="/typowanie">
          <img src={LOGO_SRC} alt="ITSS" className="h-8" />
        </a>

        <div className="flex items-center gap-4 ml-6">
          {navLink('/typowanie', 'Typowanie')}
          {navLink('/ranking', 'Ranking')}
          {navLink('/mecze-lista', 'Mecze')}
          {session?.user?.isAdmin && navLink('/admin', 'Panel administracyjny')}
        </div>

        {session?.user && (
          <div className="ml-auto flex items-center gap-3">
            <span className="text-sm text-[#2e3192] font-medium bg-[#2e3192]/8 px-3 py-1 rounded-full">
              {session.user.name}
            </span>
            <button
              onClick={() => signOut({ callbackUrl: '/logowanie' })}
              className="text-xs text-[#434351]/50 hover:text-[#434351] transition"
            >
              Wyloguj
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
