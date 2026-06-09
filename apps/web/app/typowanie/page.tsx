'use client'

import { useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import Header from '@/components/Header'
import { flag } from '@/lib/flags'

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

function isLocked(starts_at: string, status: string) {
  return new Date(starts_at) <= new Date() || status === 'finished'
}

const STORAGE_KEY = 'typowanie_collapsed_rounds'

function loadCollapsed(): Record<number, boolean> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
  } catch {
    return {}
  }
}

export default function TypowaniePage() {
  const { data: session } = useSession()
  const userId = session?.user?.id

  const [rounds, setRounds] = useState<Round[]>([])
  const [scores, setScores] = useState<ScoreMap>({})
  const [savingId, setSavingId] = useState<number | null>(null)
  const [savedId, setSavedId] = useState<number | null>(null)
  const [collapsed, setCollapsed] = useState<Record<number, boolean>>({})
  const debounceRef = useRef<Record<number, ReturnType<typeof setTimeout>>>({})

  useEffect(() => {
    setCollapsed(loadCollapsed())
  }, [])

  function toggleRound(roundId: number) {
    setCollapsed(prev => {
      const next = { ...prev, [roundId]: !prev[roundId] }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }

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

  async function saveOne(matchId: number, home: string, away: string) {
    if (!userId || home === '' || away === '') return
    setSavingId(matchId)
    await fetch('/api/predictions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        predictions: [{ match_id: matchId, home_score: home, away_score: away }],
      }),
    })
    setSavingId(null)
    setSavedId(matchId)
    setTimeout(() => setSavedId(id => id === matchId ? null : id), 2000)
  }

  function setScore(matchId: number, side: 'home' | 'away', value: string) {
    const val = value.replace(/\D/g, '').slice(0, 2)
    setScores(prev => {
      const updated = {
        ...prev,
        [matchId]: {
          home: prev[matchId]?.home ?? '',
          away: prev[matchId]?.away ?? '',
          [side]: val,
        },
      }
      const { home, away } = updated[matchId]

      clearTimeout(debounceRef.current[matchId])
      debounceRef.current[matchId] = setTimeout(() => saveOne(matchId, home, away), 800)

      return updated
    })
  }

  const filledCount = Object.values(scores).filter(s => s.home !== '' && s.away !== '').length
  const totalMatches = rounds.reduce((n, r) => n + r.matches.length, 0)

  return (
    <main className="min-h-screen bg-[#eff1f9] text-[#434351] pb-16">
      <Header />

      <div className="max-w-2xl mx-auto px-4 pt-6 space-y-8">
        {rounds.map(round => {
          const isCollapsed = !!collapsed[round.id]
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
              <span className={`text-[#2e3192]/50 text-xs transition-transform duration-200 ${isCollapsed ? '' : 'rotate-180'}`}>
                ▲
              </span>
            </button>

            {!isCollapsed && <div className="space-y-2">
              {round.matches.map(match => {
                const locked = isLocked(match.starts_at, match.status)
                const score = scores[match.id] ?? { home: '', away: '' }
                const filled = score.home !== '' && score.away !== ''
                const isSaving = savingId === match.id
                const isSaved = savedId === match.id

                return (
                  <div
                    key={match.id}
                    className={`rounded-xl px-4 py-3 flex items-center gap-3 transition ${
                      locked
                        ? 'bg-[#2e3192]/[0.03] opacity-60'
                        : filled
                        ? 'bg-[#2e3192]/[0.06] border border-[#2e3192]/20'
                        : 'bg-[#2e3192]/[0.03] border border-[#2e3192]/10'
                    }`}
                  >
                    <div className="text-xs text-[#434351]/40 w-20 shrink-0 hidden sm:block">
                      {formatDate(match.starts_at)}
                    </div>

                    {round.stage === 'group' && (
                      <div className="text-xs bg-[#2e3192]/[0.06] rounded px-1.5 py-0.5 text-[#434351]/50 shrink-0">
                        Gr.&nbsp;{match.group_name}
                      </div>
                    )}

                    <div className="flex-1 flex items-center gap-2 min-w-0">
                      <span className="text-sm font-medium text-right flex-1 truncate">
                        <span className="mr-1">{flag(match.home_team)}</span>{match.home_team}
                      </span>

                      <div className="flex items-center gap-1 shrink-0">
                        <input
                          type="text"
                          inputMode="numeric"
                          disabled={locked}
                          value={score.home}
                          onChange={e => setScore(match.id, 'home', e.target.value)}
                          placeholder="–"
                          className="w-9 h-9 text-center text-lg font-bold bg-white border border-[#2e3192]/20 rounded-lg focus:outline-none focus:border-[#2e3192] disabled:cursor-not-allowed disabled:bg-[#2e3192]/[0.03] placeholder-[#434351]/20 transition"
                        />
                        <span className="text-[#434351]/40 font-bold">:</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          disabled={locked}
                          value={score.away}
                          onChange={e => setScore(match.id, 'away', e.target.value)}
                          placeholder="–"
                          className="w-9 h-9 text-center text-lg font-bold bg-white border border-[#2e3192]/20 rounded-lg focus:outline-none focus:border-[#2e3192] disabled:cursor-not-allowed disabled:bg-[#2e3192]/[0.03] placeholder-[#434351]/20 transition"
                        />
                      </div>

                      <span className="text-sm font-medium text-left flex-1 truncate">
                        <span className="mr-1">{flag(match.away_team)}</span>{match.away_team}
                      </span>
                    </div>

                    <div className="w-5 shrink-0 text-center">
                      {locked
                        ? <span className="text-[#434351]/30 text-xs">🔒</span>
                        : isSaving
                        ? <span className="text-[#434351]/30 text-xs animate-pulse">…</span>
                        : isSaved
                        ? <span className="text-[#2e3192] text-xs">✓</span>
                        : null}
                    </div>
                  </div>
                )
              })}
            </div>}
          </section>
          )
        })}
      </div>

      {/* Pasek statusu */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur border-t border-[#2e3192]/10 px-4 py-2">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <span className="text-xs text-[#434351]/50">Typy zapisują się automatycznie</span>
          <span className="text-sm text-[#434351]/50">{filledCount}/{totalMatches} typów</span>
        </div>
      </div>
    </main>
  )
}
