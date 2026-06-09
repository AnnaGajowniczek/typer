'use client'

import { useEffect, useState } from 'react'
import Header from '@/components/Header'
import { flag } from '@/lib/flags'

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

  useEffect(() => {
    fetch('/api/matches')
      .then(r => r.json())
      .then(d => { setRounds(d); setLoading(false) })
  }, [])

  return (
    <main className="min-h-screen bg-[#eff1f9] text-[#434351] pb-12">
      <Header />

      <div className="max-w-2xl mx-auto px-4 pt-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">Mecze</h1>
          <p className="text-[#434351]/50 text-sm mt-1">Kliknij mecz żeby zobaczyć typy graczy</p>
        </div>

        {loading ? (
          <div className="text-center text-[#434351]/30 py-16">Ładowanie…</div>
        ) : (
          <div className="space-y-8">
            {rounds.map(round => (
              <section key={round.id}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-xs font-bold uppercase tracking-widest text-[#2e3192]">
                    {round.name}
                  </div>
                  <div className="flex-1 h-px bg-[#2e3192]/[0.06]" />
                </div>

                <div className="space-y-2">
                  {round.matches.map(match => (
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
                          <span className="mr-1">{flag(match.home_team)}</span>{match.home_team}
                        </span>
                        <span className="text-sm font-bold shrink-0 tabular-nums text-[#434351]/60">
                          {match.status === 'finished' || match.status === 'live'
                            ? `${match.home_score} : ${match.away_score}`
                            : '–:–'}
                        </span>
                        <span className="text-sm font-medium text-left flex-1 truncate">
                          <span className="mr-1">{flag(match.away_team)}</span>{match.away_team}
                        </span>
                      </div>

                      <span className="text-[#2e3192]/30 group-hover:text-[#2e3192]/60 transition text-xs shrink-0">
                        Typy →
                      </span>
                    </a>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
