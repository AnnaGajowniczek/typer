'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Header from '@/components/Header'

type Player = {
  id: string
  display_name: string
  points: number
  typed: number
  typed_finished: number
  exact: number
  correct_outcome: number
}

const MEDALS = ['🥇', '🥈', '🥉']

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
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [finishedCount, setFinishedCount] = useState(0)

  useEffect(() => {
    Promise.all([
      fetch('/api/ranking').then(r => r.json()),
      fetch('/api/matches').then(r => r.json()),
    ]).then(([p, m]) => {
      setPlayers(p)
      setFinishedCount(m.flatMap((r: { matches: { status: string }[] }) => r.matches).filter((match: { status: string }) => match.status === 'finished').length)
      setLoading(false)
    })
  }, [])

  const maxTyped = Math.max(...players.map(p => Number(p.typed)), 1)
  return (
    <main className="min-h-screen bg-[#eff1f9] text-[#434351] pb-12">
      <Header />

      <div className="max-w-2xl mx-auto px-4 pt-8">
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
          <div className="text-center text-[#434351]/30 py-16">Ładowanie…</div>
        ) : (
          <div className="space-y-3">
            {players.map((player, i) => {
              const isMe = String(session?.user?.id) === String(player.id)
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
                        {outcome > 0 && <span className="text-yellow-600">~ {outcome} wynik</span>}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className={`text-2xl font-bold ${
                        pos === 1 ? 'text-yellow-500' :
                        pos === 2 ? 'text-slate-500'  :
                        pos === 3 ? 'text-[#2e3192]'  : 'text-[#434351]'
                      }`}>
                        {points}
                      </div>
                      <div className="text-xs text-[#434351]/30">pkt</div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
