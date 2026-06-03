'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

type Player = {
  id: string
  display_name: string
  points: number
  typed: number
  typed_finished: number
  exact: number
  correct_outcome: number
}

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

const MEDALS = ['🥇', '🥈', '🥉']

const STATUS_DOT: Record<string, string> = {
  upcoming: 'bg-[#2e3192]/20',
  live:     'bg-red-500 animate-pulse',
  finished: 'bg-[#2e3192]',
  cancelled:'bg-[#2e3192]/[0.06]',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('pl-PL', {
    day: '2-digit', month: '2-digit',
    hour: '2-digit', minute: '2-digit',
    timeZone: 'Europe/Warsaw',
  })
}

function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="w-full bg-[#2e3192]/[0.06] rounded-full h-1.5">
      <div className="bg-[#2e3192] h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
    </div>
  )
}

export default function RankingPage() {
  const { data: session } = useSession()
  const [tab, setTab] = useState<'ranking' | 'mecze'>('ranking')
  const [players, setPlayers] = useState<Player[]>([])
  const [rounds, setRounds] = useState<Round[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/ranking').then(r => r.json()),
      fetch('/api/matches').then(r => r.json()),
    ]).then(([p, m]) => {
      setPlayers(p)
      setRounds(m)
      setLoading(false)
    })
  }, [])

  const maxTyped = Math.max(...players.map(p => Number(p.typed)), 1)
  const finishedCount = rounds.flatMap(r => r.matches).filter(m => m.status === 'finished').length

  return (
    <main className="min-h-screen bg-[#eff1f9] text-[#434351] pb-12">
      {/* Nagłówek */}
      <div className="bg-white/90 sticky top-0 z-10 border-b border-[#2e3192]/10 backdrop-blur">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <img src="/logo-itss.png" alt="ITSS" className="h-8" />
          <div className="ml-auto flex items-center gap-4">
            <a href="/typowanie" className="text-sm text-[#434351]/50 hover:text-[#434351] transition">
              Typowanie
            </a>
            {session?.user?.isAdmin && (
              <a href="/admin" className="text-sm text-[#434351]/50 hover:text-[#434351] transition">
                Admin
              </a>
            )}
          </div>
        </div>

        {/* Zakładki */}
        <div className="max-w-2xl mx-auto px-4 flex gap-1 pb-0">
          {(['ranking', 'mecze'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition capitalize ${
                tab === t
                  ? 'border-[#2e3192] text-[#2e3192]'
                  : 'border-transparent text-[#434351]/50 hover:text-[#434351]'
              }`}
            >
              {t === 'ranking' ? 'Ranking' : 'Mecze'}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-6">

        {/* ── RANKING ─────────────────────────────────────── */}
        {tab === 'ranking' && (
          <>
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold">Ranking graczy</h1>
              <p className="text-[#434351]/50 text-sm mt-1">
                {finishedCount > 0
                  ? `Po ${finishedCount} rozegranych meczach`
                  : 'Turniej jeszcze się nie rozpoczął'}
              </p>
            </div>

            <div className="flex gap-4 justify-center mb-5 text-xs text-[#434351]/50">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#2e3192] inline-block" />
                Dokładny wynik — 3 pkt
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" />
                Trafiony wynik — 1 pkt
              </span>
            </div>

            {loading ? (
              <div className="text-center text-[#434351]/40 py-16">Ładowanie…</div>
            ) : (
              <div className="space-y-3">
                {players.map((player, i) => {
                  const isMe = session?.user?.id === player.id
                  const pos = i + 1
                  const points = Number(player.points)
                  const typed = Number(player.typed)
                  const exact = Number(player.exact)
                  const outcome = Number(player.correct_outcome)

                  return (
                    <div
                      key={player.id}
                      className={`rounded-xl px-4 py-4 border transition ${
                        isMe
                          ? 'bg-[#2e3192]/8 border-[#2e3192]/50'
                          : pos <= 3
                          ? 'bg-[#2e3192]/[0.04] border-[#2e3192]/15'
                          : 'bg-[#2e3192]/[0.03] border-[#2e3192]/10'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-8 text-center shrink-0">
                          {pos <= 3
                            ? <span className="text-xl">{MEDALS[pos - 1]}</span>
                            : <span className="text-[#434351]/40 font-bold text-sm">{pos}</span>}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`font-semibold truncate ${isMe ? 'text-[#2e3192]' : ''}`}>
                              {player.display_name}
                            </span>
                            {isMe && (
                              <span className="text-xs bg-[#2e3192]/15 text-[#2e3192] px-1.5 py-0.5 rounded">
                                Ty
                              </span>
                            )}
                          </div>
                          <div className="mt-1.5">
                            <ProgressBar value={typed} max={maxTyped} />
                          </div>
                          <div className="flex gap-3 mt-1.5 text-xs text-[#434351]/50">
                            <span>{typed} typów</span>
                            {exact > 0 && <span className="text-[#2e3192]">✓ {exact} dokładnych</span>}
                            {outcome > 0 && <span className="text-yellow-400">~ {outcome} wynik</span>}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className={`text-2xl font-bold ${
                            pos === 1 ? 'text-yellow-400' :
                            pos === 2 ? 'text-gray-300'   :
                            pos === 3 ? 'text-[#2e3192]'  : 'text-[#434351]'
                          }`}>
                            {points}
                          </div>
                          <div className="text-xs text-[#434351]/40">pkt</div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}

        {/* ── MECZE ───────────────────────────────────────── */}
        {tab === 'mecze' && (
          <>
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold">Mecze</h1>
              <p className="text-[#434351]/50 text-sm mt-1">Kliknij mecz żeby zobaczyć typy graczy</p>
            </div>

            {loading ? (
              <div className="text-center text-[#434351]/40 py-16">Ładowanie…</div>
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
                          {/* Kropka statusu */}
                          <span className={`w-2 h-2 rounded-full shrink-0 ${STATUS_DOT[match.status] ?? STATUS_DOT.upcoming}`} />

                          {/* Data */}
                          <span className="text-xs text-[#434351]/40 w-20 shrink-0 hidden sm:block">
                            {formatDate(match.starts_at)}
                          </span>

                          {/* Grupa */}
                          {round.stage === 'group' && (
                            <span className="text-xs bg-[#2e3192]/[0.06] rounded px-1.5 py-0.5 text-[#434351]/50 shrink-0">
                              Gr.&nbsp;{match.group_name}
                            </span>
                          )}

                          {/* Drużyny i wynik */}
                          <div className="flex-1 flex items-center gap-2 min-w-0">
                            <span className="text-sm font-medium text-right flex-1 truncate">
                              {match.home_team}
                            </span>
                            <span className="text-sm font-bold shrink-0 tabular-nums text-[#434351]/60">
                              {match.status === 'finished' || match.status === 'live'
                                ? `${match.home_score} : ${match.away_score}`
                                : '–:–'}
                            </span>
                            <span className="text-sm font-medium text-left flex-1 truncate">
                              {match.away_team}
                            </span>
                          </div>

                          <span className="text-[#434351]/25 group-hover:text-[#434351]/60 transition text-xs shrink-0">
                            Typy →
                          </span>
                        </a>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}
