'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import { flag } from '@/lib/flags'

type Match = {
  id: number
  starts_at: string
  status: string
  home_team: string | null
  away_team: string | null
  home_team_id: number | null
  away_team_id: number | null
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

type Team = { id: number; name: string; group_name: string | null }
type MatchEdit = { home: string; away: string; status: string; home_team_id: number | null; away_team_id: number | null }
type EditMap = Record<number, MatchEdit>

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('pl-PL', {
    day: '2-digit', month: '2-digit',
    hour: '2-digit', minute: '2-digit',
    timeZone: 'Europe/Warsaw',
  })
}


export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [rounds, setRounds] = useState<Round[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [edits, setEdits] = useState<EditMap>({})
  const [original, setOriginal] = useState<EditMap>({})
  const [saving, setSaving] = useState<number | null>(null)
  const [saved, setSaved] = useState<number | null>(null)
  const [collapsed, setCollapsed] = useState<Record<number, boolean>>({})

  function toggleRound(roundId: number) {
    setCollapsed(prev => ({ ...prev, [roundId]: !prev[roundId] }))
  }

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/logowanie')
  }, [status, router])

  useEffect(() => {
    fetch('/api/teams').then(r => r.json()).then(setTeams)
    fetch('/api/matches').then(r => r.json()).then((rounds: Round[]) => {
      setRounds(rounds)
      const initial: EditMap = {}
      for (const round of rounds) {
        for (const m of round.matches) {
          initial[m.id] = {
            home:         m.home_score != null ? String(m.home_score) : '',
            away:         m.away_score != null ? String(m.away_score) : '',
            status:       m.status,
            home_team_id: m.home_team_id,
            away_team_id: m.away_team_id,
          }
        }
      }
      setEdits(initial)
      setOriginal(initial)
    })
  }, [])

  function hasChanged(matchId: number): boolean {
    const e = edits[matchId]
    const o = original[matchId]
    if (!e || !o) return false
    return e.home !== o.home || e.away !== o.away
      || e.home_team_id !== o.home_team_id || e.away_team_id !== o.away_team_id
  }

  function update(matchId: number, field: keyof MatchEdit, value: string | number | null) {
    setEdits(prev => ({
      ...prev,
      [matchId]: { ...prev[matchId], [field]: value },
    }))
  }

  async function toggleStatus(matchId: number) {
    const e = edits[matchId]
    if (!e) return
    const newStatus = e.status === 'finished' ? 'upcoming' : 'finished'
    update(matchId, 'status', newStatus)
    setOriginal(prev => ({ ...prev, [matchId]: { ...prev[matchId], status: newStatus } }))
    await fetch('/api/admin/matches', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        match_id:   matchId,
        home_score: e.home !== '' ? Number(e.home) : null,
        away_score: e.away !== '' ? Number(e.away) : null,
        status:     newStatus,
      }),
    })
  }

  async function saveMatch(matchId: number) {
    const e = edits[matchId]
    if (!e) return
    setSaving(matchId)
    await fetch('/api/admin/matches', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        match_id:     matchId,
        home_score:   e.home !== '' ? Number(e.home) : undefined,
        away_score:   e.away !== '' ? Number(e.away) : undefined,
        status:       e.home !== '' && e.away !== '' ? e.status : undefined,
        home_team_id: e.home_team_id,
        away_team_id: e.away_team_id,
      }),
    })
    setSaving(null)
    setSaved(matchId)
    setOriginal(prev => ({ ...prev, [matchId]: edits[matchId] }))
    setTimeout(() => setSaved(null), 2000)
  }

  if (status === 'loading' || rounds.length === 0) {
    return (
      <main className="min-h-screen bg-[#eff1f9] text-[#434351] flex items-center justify-center">
        <p className="text-[#434351]/50">Ładowanie…</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#eff1f9] text-[#434351] pb-12">
      <Header />

      <div className="max-w-4xl mx-auto px-4 pt-6 space-y-8">
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
                const e = edits[match.id] ?? { home: '', away: '', status: 'upcoming' }
                const isSaving = saving === match.id
                const isSaved  = saved  === match.id
                const hasResult = e.home !== '' && e.away !== ''
                const changed = hasChanged(match.id)

                return (
                  <div
                    key={match.id}
                    className={`rounded-xl px-4 py-3 flex items-center gap-3 border transition ${
                      e.status === 'finished'
                        ? 'bg-[#2e3192]/[0.06] border-[#2e3192]/20'
                        : 'bg-[#2e3192]/[0.03] border-[#2e3192]/10'
                    }`}
                  >
                    {/* Data */}
                    <div className="text-xs text-[#434351]/50 w-24 shrink-0 hidden md:block">
                      {formatDate(match.starts_at)}
                    </div>

                    {/* Grupa */}
                    {round.stage === 'group' && (
                      <div className="text-xs bg-[#2e3192]/[0.06] rounded px-1.5 py-0.5 text-[#434351]/50 shrink-0">
                        Gr.&nbsp;{match.group_name}
                      </div>
                    )}

                    {/* Mecz */}
                    <div className="flex-1 flex flex-col gap-2 min-w-0">
                      {round.stage === 'knockout' && (
                        <div className="flex items-center gap-2">
                          <select
                            value={e.home_team_id ?? ''}
                            onChange={ev => update(match.id, 'home_team_id', ev.target.value ? Number(ev.target.value) : null)}
                            className="flex-1 text-xs bg-[#2e3192]/[0.06] border border-[#2e3192]/20 rounded-lg px-2 py-1.5 text-[#434351] focus:outline-none focus:border-[#2e3192]"
                          >
                            <option value="">— gospodarz —</option>
                            {teams.map(t => (
                              <option key={t.id} value={t.id}>{t.group_name ? `Gr.${t.group_name} ` : ''}{t.name}</option>
                            ))}
                          </select>
                          <span className="text-[#434351]/30 text-xs shrink-0">vs</span>
                          <select
                            value={e.away_team_id ?? ''}
                            onChange={ev => update(match.id, 'away_team_id', ev.target.value ? Number(ev.target.value) : null)}
                            className="flex-1 text-xs bg-[#2e3192]/[0.06] border border-[#2e3192]/20 rounded-lg px-2 py-1.5 text-[#434351] focus:outline-none focus:border-[#2e3192]"
                          >
                            <option value="">— gość —</option>
                            {teams.map(t => (
                              <option key={t.id} value={t.id}>{t.group_name ? `Gr.${t.group_name} ` : ''}{t.name}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm font-medium text-right flex-1 truncate">
                        <span className="mr-1">{flag(match.home_team ?? '')}</span>{match.home_team ?? '?'}
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        <input
                          type="text"
                          inputMode="numeric"
                          value={e.home}
                          onChange={ev => update(match.id, 'home', ev.target.value.replace(/\D/g, '').slice(0, 2))}
                          placeholder="–"
                          className="w-10 h-9 text-center text-lg font-bold bg-[#2e3192]/[0.06] border border-[#2e3192]/20 rounded-lg focus:outline-none focus:border-[#2e3192] placeholder-[#434351]/30 transition"
                        />
                        <span className="text-[#434351]/50 font-bold">:</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={e.away}
                          onChange={ev => update(match.id, 'away', ev.target.value.replace(/\D/g, '').slice(0, 2))}
                          placeholder="–"
                          className="w-10 h-9 text-center text-lg font-bold bg-[#2e3192]/[0.06] border border-[#2e3192]/20 rounded-lg focus:outline-none focus:border-[#2e3192] placeholder-[#434351]/30 transition"
                        />
                      </div>
                      <span className="text-sm font-medium text-left flex-1 truncate">
                        <span className="mr-1">{flag(match.away_team ?? '')}</span>{match.away_team ?? '?'}
                      </span>
                    </div>
                    </div>

                    {/* Zakończony */}
                    <label className="flex items-center gap-1.5 shrink-0 cursor-pointer select-none">
                      <div
                        onClick={() => toggleStatus(match.id)}
                        className={`w-10 h-6 rounded-full transition-colors relative ${
                          e.status === 'finished' ? 'bg-[#2e3192]' : 'bg-[#2e3192]/20'
                        }`}
                      >
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${
                          e.status === 'finished' ? 'left-5' : 'left-1'
                        }`} />
                      </div>
                      <span className="text-xs text-[#434351]/60 hidden sm:block">
                        {e.status === 'finished' ? 'Zakończony' : 'Nierozegrany'}
                      </span>
                    </label>

                    {/* Przycisk */}
                    <button
                      onClick={() => saveMatch(match.id)}
                      disabled={isSaving || !hasResult || !changed}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition shrink-0 ${
                        isSaved
                          ? 'bg-[#2e3192] text-white'
                          : 'bg-[#2e3192] hover:bg-blue-900 disabled:opacity-30 text-white'
                      }`}
                    >
                      {isSaving ? '…' : isSaved ? '✓' : 'Zapisz'}
                    </button>
                  </div>
                )
              })}
            </div>}
          </section>
          )
        })}
      </div>
    </main>
  )
}
