'use client'

import { useEffect, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'

type Match = {
  id: number
  starts_at: string
  status: string
  home_team: string
  away_team: string
  group_name: string | null
}

type Round = {
  id: number
  name: string
  stage: string
  order_nr: number
  matches: Match[]
}

type ScoreMap = Record<number, { home: string; away: string }>

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('pl-PL', {
    day: '2-digit', month: '2-digit',
    hour: '2-digit', minute: '2-digit',
    timeZone: 'Europe/Warsaw',
  })
}

function isLocked(starts_at: string) {
  return new Date(starts_at) <= new Date()
}

export default function TypowaniePage() {
  const { data: session } = useSession()
  const userId = session?.user?.id

  const [rounds, setRounds] = useState<Round[]>([])
  const [scores, setScores] = useState<ScoreMap>({})
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => {
    fetch('/api/matches').then(r => r.json()).then(setRounds)
  }, [])

  useEffect(() => {
    if (!userId) return
    fetch(`/api/predictions?user_id=${userId}`)
      .then(r => r.json())
      .then((preds: { match_id: number; home_score: number; away_score: number }[]) => {
        const map: ScoreMap = {}
        for (const p of preds) {
          map[p.match_id] = { home: String(p.home_score), away: String(p.away_score) }
        }
        setScores(map)
      })
  }, [userId])

  function setScore(matchId: number, side: 'home' | 'away', value: string) {
    const val = value.replace(/\D/g, '').slice(0, 2)
    setScores(prev => ({
      ...prev,
      [matchId]: {
        home: prev[matchId]?.home ?? '',
        away: prev[matchId]?.away ?? '',
        [side]: val,
      },
    }))
  }

  async function handleSave() {
    if (!userId) return
    setSaving(true)
    const predictions = Object.entries(scores).map(([match_id, s]) => ({
      match_id: Number(match_id),
      home_score: s.home,
      away_score: s.away,
    }))
    await fetch('/api/predictions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, predictions }),
    })
    setSaving(false)
    setToast('Typy zapisane!')
    setTimeout(() => setToast(''), 3000)
  }

  const filledCount = Object.values(scores).filter(s => s.home !== '' && s.away !== '').length
  const totalMatches = rounds.reduce((n, r) => n + r.matches.length, 0)

  return (
    <main className="min-h-screen bg-[#eff1f9] text-[#434351] pb-28">
      {/* Nagłówek */}
      <div className="bg-white/90 sticky top-0 z-10 border-b border-[#2e3192]/10 backdrop-blur">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <img src="/logo-itss.png" alt="ITSS" className="h-8" />
          <div className="ml-auto flex items-center gap-4">
            <a href="/ranking" className="text-sm text-[#434351]/50 hover:text-[#434351] transition">
              Ranking
            </a>
            {session?.user?.isAdmin && (
              <a href="/admin" className="text-sm text-[#434351]/50 hover:text-[#434351] transition">
                Admin
              </a>
            )}
            <span className="text-[#2e3192] text-sm">
              {session?.user?.name}
            </span>
            <span className="text-[#434351]/50 text-sm">
              {filledCount}/{totalMatches} typów
            </span>
            <button
              onClick={() => signOut({ callbackUrl: '/logowanie' })}
              className="text-xs text-[#434351]/50 hover:text-[#434351] transition"
            >
              Wyloguj
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-6 space-y-8">
        {rounds.map(round => (
          <section key={round.id}>
            <div className="flex items-center gap-3 mb-3">
              <div className="text-xs font-bold uppercase tracking-widest text-[#2e3192]">
                {round.name}
              </div>
              <div className="flex-1 h-px bg-[#2e3192]/[0.06]" />
            </div>

            <div className="space-y-2">
              {round.matches.map(match => {
                const locked = isLocked(match.starts_at)
                const score = scores[match.id] ?? { home: '', away: '' }
                const filled = score.home !== '' && score.away !== ''

                return (
                  <div
                    key={match.id}
                    className={`rounded-xl px-4 py-3 flex items-center gap-3 transition ${
                      locked
                        ? 'bg-[#2e3192]/[0.03] opacity-60'
                        : filled
                        ? 'bg-[#2e3192]/8 border border-[#2e3192]/30'
                        : 'bg-[#2e3192]/[0.04] border border-[#2e3192]/10'
                    }`}
                  >
                    <div className="text-xs text-[#434351]/50 w-20 shrink-0 hidden sm:block">
                      {formatDate(match.starts_at)}
                    </div>

                    {round.stage === 'group' && (
                      <div className="text-xs bg-[#2e3192]/[0.06] rounded px-1.5 py-0.5 text-[#434351]/50 shrink-0">
                        Gr.&nbsp;{match.group_name}
                      </div>
                    )}

                    <div className="flex-1 flex items-center gap-2 min-w-0">
                      <span className="text-sm font-medium text-right flex-1 truncate">
                        {match.home_team}
                      </span>

                      <div className="flex items-center gap-1 shrink-0">
                        <input
                          type="text"
                          inputMode="numeric"
                          disabled={locked}
                          value={score.home}
                          onChange={e => setScore(match.id, 'home', e.target.value)}
                          placeholder="–"
                          className="w-9 h-9 text-center text-lg font-bold bg-[#2e3192]/[0.06] border border-[#2e3192]/20 rounded-lg focus:outline-none focus:border-[#2e3192] disabled:cursor-not-allowed placeholder-[#434351]/30 transition"
                        />
                        <span className="text-[#434351]/50 font-bold">:</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          disabled={locked}
                          value={score.away}
                          onChange={e => setScore(match.id, 'away', e.target.value)}
                          placeholder="–"
                          className="w-9 h-9 text-center text-lg font-bold bg-[#2e3192]/[0.06] border border-[#2e3192]/20 rounded-lg focus:outline-none focus:border-[#2e3192] disabled:cursor-not-allowed placeholder-[#434351]/30 transition"
                        />
                      </div>

                      <span className="text-sm font-medium text-left flex-1 truncate">
                        {match.away_team}
                      </span>
                    </div>

                    {locked && <span className="text-[#434351]/40 text-xs shrink-0">🔒</span>}
                    <a
                      href={`/mecze/${match.id}`}
                      className="text-[#434351]/25 hover:text-[#434351]/60 transition shrink-0"
                      title="Podgląd typów"
                    >
                      👁
                    </a>
                  </div>
                )
              })}
            </div>
          </section>
        ))}
      </div>

      {/* Przycisk zapisu */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#eff1f9]/90 backdrop-blur border-t border-[#2e3192]/10 p-4">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          {toast && <span className="text-[#2e3192] text-sm font-medium">{toast}</span>}
          <button
            onClick={handleSave}
            disabled={saving || filledCount === 0}
            className="ml-auto bg-[#2e3192] hover:bg-blue-900 disabled:opacity-40 text-white font-semibold px-8 py-2.5 rounded-xl transition"
          >
            {saving ? 'Zapisywanie…' : `Zapisz typy (${filledCount})`}
          </button>
        </div>
      </div>
    </main>
  )
}
