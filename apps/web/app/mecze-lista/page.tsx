'use client'

import { useEffect, useState } from 'react'
import Header from '@/components/Header'
import Flag from '@/components/Flag'

type Match = {
  id: number
  starts_at: string
  status: string
  home_team: string
  away_team: string
  home_score: number | null
  away_score: number | null
  group_name: string | null
}

type Round = {
  id: number
  name: string
  stage: string
  matches: Match[]
}

const STATUS_DOT: Record<string, string> = {
  upcoming:  'bg-[#2e3192]/20',
  live:      'bg-red-500 animate-pulse',
  finished:  'bg-[#2e3192]',
  cancelled: 'bg-[#2e3192]/[0.06]',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('pl-PL', {
    day: '2-digit', month: '2-digit',
    hour: '2-digit', minute: '2-digit',
    timeZone: 'Europe/Warsaw',
  })
}

export default function MeczePage() {
  const [rounds, setRounds] = useState<Round[]>([])
  const [loading, setLoading] = useState(true)
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set())
  const [hideFinished, setHideFinished] = useState(false)

  useEffect(() => {
    setHideFinished(localStorage.getItem('mecze_hide_finished') === 'true')
    fetch('/api/matches')
      .then(r => r.json())
      .then((d: Round[]) => {
        setRounds(d)
        setLoading(false)
        const allFinished = d
          .filter(r => r.matches.length > 0 && r.matches.every(m => m.status === 'finished'))
          .map(r => r.id)
        setCollapsed(new Set(allFinished))
      })
  }, [])

  function toggleHideFinished() {
    setHideFinished(prev => {
      const next = !prev
      localStorage.setItem('mecze_hide_finished', String(next))
      return next
    })
  }

  function toggleRound(id: number) {
    setCollapsed(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <main className="min-h-screen bg-[#eff1f9] text-[#434351] pb-12">
      <Header />

      <div className="max-w-2xl mx-auto px-4 pt-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">Mecze</h1>
          <p className="text-[#434351]/50 text-sm mt-1">Kliknij mecz żeby zobaczyć typy graczy</p>
        </div>

        <div className="flex justify-end mb-4">
          <button
            onClick={toggleHideFinished}
            className="flex items-center gap-2 text-xs text-[#434351]/60 hover:text-[#434351] transition"
          >
            <div className={`w-8 h-5 rounded-full transition-colors relative ${hideFinished ? 'bg-[#2e3192]' : 'bg-[#2e3192]/20'}`}>
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${hideFinished ? 'left-3.5' : 'left-0.5'}`} />
            </div>
            Ukryj zakończone
          </button>
        </div>

        {loading ? (
          <div className="text-center text-[#434351]/30 py-16">Ładowanie…</div>
        ) : (
          <div className="space-y-8">
            {rounds.map(round => {
              const visibleMatches = hideFinished
                ? round.matches.filter(m => m.status !== 'finished')
                : round.matches
              if (visibleMatches.length === 0) return null
              return (
              <section key={round.id}>
                <button
                  onClick={() => toggleRound(round.id)}
                  className="flex items-center gap-3 mb-3 w-full text-left group"
                >
                  <div className="text-xs font-bold uppercase tracking-widest text-[#2e3192]">
                    {round.name}
                  </div>
                  <div className="flex-1 h-px bg-[#2e3192]/[0.06]" />
                  <span className={`text-[#2e3192]/50 text-xs transition-transform duration-200 ${collapsed.has(round.id) ? '' : 'rotate-180'}`}>
                    ▲
                  </span>
                </button>

                {!collapsed.has(round.id) && (
                <div className="space-y-2">
                  {visibleMatches.map(match => (
                    <a
                      key={match.id}
                      href={`/mecze/${match.id}`}
                      className="flex items-center gap-3 rounded-xl px-4 py-3 border border-[#2e3192]/10 bg-[#2e3192]/[0.03] hover:bg-[#2e3192]/[0.06] hover:border-[#2e3192]/20 transition group"
                    >
                      <span className={`w-2 h-2 rounded-full shrink-0 ${STATUS_DOT[match.status] ?? STATUS_DOT.upcoming}`} />

                      <span className="text-xs text-[#434351]/40 w-20 shrink-0 hidden sm:block">
                        {formatDate(match.starts_at)}
                      </span>

                      {round.stage === 'group' && (
                        <span className="text-xs bg-[#2e3192]/[0.06] rounded px-1.5 py-0.5 text-[#434351]/50 shrink-0">
                          Gr.&nbsp;{match.group_name}
                        </span>
                      )}

                      <div className="flex-1 flex items-center gap-2 min-w-0">
                        <span className="text-sm font-medium text-right flex-1 truncate">
                          <Flag team={match.home_team} />{' '}{match.home_team}
                        </span>
                        <span className="text-sm font-bold shrink-0 tabular-nums text-[#434351]/60">
                          {match.status === 'finished' || match.status === 'live'
                            ? `${match.home_score} : ${match.away_score}`
                            : '–:–'}
                        </span>
                        <span className="text-sm font-medium text-left flex-1 truncate">
                          <Flag team={match.away_team} />{' '}{match.away_team}
                        </span>
                      </div>

                      <span className="text-[#2e3192]/30 group-hover:text-[#2e3192]/60 transition text-xs shrink-0">
                        Typy →
                      </span>
                    </a>
                  ))}
                </div>
                )}
              </section>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
