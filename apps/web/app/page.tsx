'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Header from '@/components/Header'
import Flag from '@/components/Flag'

type Match = {
  id: number
  starts_at: string
  status: string
  home_team: string
  away_team: string
  group_name: string | null
  round_name: string
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('pl-PL', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Warsaw',
  })
}

function timeUntil(iso: string) {
  const diff = new Date(iso).getTime() - Date.now()
  if (diff <= 0) return null
  const days = Math.floor(diff / 86400000)
  const hours = Math.floor((diff % 86400000) / 3600000)
  const minutes = Math.floor((diff % 3600000) / 60000)
  if (days > 0 && hours > 0) return `za ${days} ${days === 1 ? 'dzień' : 'dni'} ${hours} ${hours === 1 ? 'godzinę' : 'godziny'}`
  if (days > 0) return `za ${days} ${days === 1 ? 'dzień' : 'dni'}`
  if (hours > 0 && minutes > 0) return `za ${hours} ${hours === 1 ? 'godzinę' : 'godziny'} ${minutes} min`
  if (hours > 0) return `za ${hours} ${hours === 1 ? 'godzinę' : 'godziny'}`
  return `za ${minutes} min`
}

export default function HomePage() {
  const { data: session, status } = useSession()
  const [upcoming, setUpcoming] = useState<Match[]>([])

  useEffect(() => {
    if (status === 'unauthenticated') window.location.href = '/logowanie'
  }, [status])

  useEffect(() => {
    if (status !== 'authenticated') return
    fetch('/api/matches')
      .then(r => r.json())
      .then((rounds: { matches: Match[]; name: string }[]) => {
        const now = new Date()
        const in48h = new Date(now.getTime() + 48 * 3600000)
        const matches: Match[] = rounds
          .flatMap(r => r.matches.map(m => ({ ...m, round_name: r.name })))
          .filter(m => new Date(m.starts_at) > now && new Date(m.starts_at) <= in48h && m.status !== 'finished')
          .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())
        setUpcoming(matches)
      })
  }, [status])

  if (status === 'loading' || status === 'unauthenticated') return null

  const firstName = session?.user?.name?.split(' ')[0]

  return (
    <main className="min-h-screen bg-[#eff1f9] text-[#434351]">
      <Header />

      <div className="max-w-2xl mx-auto px-4 pt-8 pb-12 space-y-8">

        {/* Powitanie */}
        <div className="text-center py-6">
          {session?.user ? (
            <>
              <p className="text-3xl font-bold text-[#2e3192]">Cześć, {firstName}! 👋</p>
              <p className="text-[#434351]/60 mt-2">Gotowy na typowanie MŚ 2026?</p>
            </>
          ) : (
            <>
              <p className="text-3xl font-bold text-[#2e3192]">Typer MŚ 2026</p>
              <p className="text-[#434351]/60 mt-2">Zaloguj się i typuj wyniki meczów</p>
            </>
          )}
        </div>

        {/* Nadchodzące mecze */}
        {upcoming.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="text-xs font-bold uppercase tracking-widest text-[#2e3192]">Najbliższe mecze</div>
              <div className="flex-1 h-px bg-[#2e3192]/[0.06]" />
            </div>

            <div className="space-y-2">
              {upcoming.map(match => (
                <div
                  key={match.id}
                  className="rounded-xl px-4 py-3 bg-white/60 border border-[#2e3192]/10 flex items-center gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-center gap-3">
                      <span className="text-sm font-medium text-right flex-1 truncate">
                        <Flag team={match.home_team} />{' '}{match.home_team}
                      </span>
                      <span className="text-[#434351]/30 font-bold text-xs shrink-0">vs</span>
                      <span className="text-sm font-medium text-left flex-1 truncate">
                        <Flag team={match.away_team} />{' '}{match.away_team}
                      </span>
                    </div>
                    <div className="text-xs text-[#434351]/40 text-center mt-1 capitalize">
                      {formatDate(match.starts_at)}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    {timeUntil(match.starts_at) && (
                      <span className="text-xs bg-[#2e3192]/10 text-[#2e3192] px-2 py-0.5 rounded-full font-medium">
                        {timeUntil(match.starts_at)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        <div className="flex justify-center pt-2">
          <a
            href="/typowanie"
            className="bg-[#2e3192] hover:bg-blue-900 text-white font-semibold px-6 py-3 rounded-xl transition"
          >
            Typuj teraz
          </a>
        </div>

      </div>
    </main>
  )
}
