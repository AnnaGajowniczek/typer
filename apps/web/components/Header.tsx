'use client'

import { useSession, signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import RulesModal from '@/components/RulesModal'
import { LOGO_SRC } from '@/lib/logo'

export default function Header() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

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
        <a href="/">
          <img src={LOGO_SRC} alt="ITSS" className="h-8" />
        </a>

        <div className="flex items-center gap-4 ml-6">
          {navLink('/typowanie', 'Typowanie')}
          {navLink('/ranking', 'Ranking')}
          {navLink('/mecze-lista', 'Mecze')}
          {session?.user?.isAdmin && navLink('/playoffs', 'Playoffy')}
          {session?.user?.isAdmin && navLink('/admin', 'Panel administracyjny')}
        </div>

        {session?.user && (
          <div className="ml-auto relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(prev => !prev)}
              className="text-sm text-[#2e3192] font-medium bg-[#2e3192]/8 px-3 py-1 rounded-full hover:bg-[#2e3192]/15 transition"
            >
              {session.user.name}
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-36 bg-white border border-[#2e3192]/10 rounded-xl shadow-lg py-1 z-20">
                <button
                  onClick={() => signOut({ callbackUrl: '/logowanie' })}
                  className="w-full text-left text-sm px-4 py-2 text-[#434351]/70 hover:text-[#434351] hover:bg-[#2e3192]/5 transition"
                >
                  Wyloguj
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
