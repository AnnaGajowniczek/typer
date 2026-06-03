'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Header from '@/components/Header'

type Match = {
  id: number
  starts_at: string
  status: string
  home_score: number | null
  away_score: number | null
  home_team: string
  away_team: string
  round_name: string
  group_name: string | null
}

type Prediction = {
  user_id: string
  display_name: string
  home_score: number | null
  away_score: number | null
  points_earned: number | null
  is_hidden: boolean
  is_me: boolean
}

type Data = { match: Match; predictions: Prediction[]; revealed: boolean }

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  upcoming: { label: 'Nierozegrany', color: 'text-[#434351]/50'         },
  live:     { label: 'Na żywo 🔴',   color: 'text-red-400'          },
  finished: { label: 'Zakończony',   color: 'text-[#2e3192]'        },
  cancelled:{ label: 'Odwołany',     color: 'text-[#434351]/40'         },
}

const PTS_STYLE: Record<number, string> = {
  3: 'bg-[#2e3192]/20 text-[#2e3192] border-[#2e3192]/30',
  1: 'bg-yellow-500/20 text-yellow-300 border-yellow-600/40',
  0: 'bg-red-500/10 text-red-400/70 border-red-600/20',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('pl-PL', {
    weekday: 'long', day: '2-digit', month: 'long',
    hour: '2-digit', minute: '2-digit',
    timeZone: 'Europe/Warsaw',
  })
}

export default function MatchPage() {
  const { id } = useParams<{ id: string }>()
  const { data: session } = useSession()
  const [data, setData] = useState<Data | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/mecze/${id}/prognozy`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
  }, [id])

  if (loading) {
    return (
      <main className="min-h-screen bg-[#eff1f9] text-[#434351] flex items-center justify-center">
        <p className="text-[#434351]/40">Ładowanie…</p>
      </main>
    )
  }

  if (!data?.match) {
    return (
      <main className="min-h-screen bg-[#eff1f9] text-[#434351] flex items-center justify-center">
        <p className="text-[#434351]/40">Mecz nie istnieje.</p>
      </main>
    )
  }

  const { match, predictions, revealed } = data
  const statusInfo = STATUS_LABEL[match.status] ?? STATUS_LABEL.upcoming
  const typed = predictions.filter(p => p.home_score != null || !p.is_hidden).length
  const withPrediction = predictions.filter(p => p.home_score !== null && !p.is_hidden)
  const noPrediction = predictions.filter(p => p.home_score === null && !p.is_hidden)
  const hidden = predictions.filter(p => p.is_hidden)

  return (
    <main className="min-h-screen bg-[#eff1f9] text-[#434351] pb-12">
      <Header />

      {/* Breadcrumb */}
      <div className="max-w-2xl mx-auto px-4 pt-4 pb-0 flex items-center gap-2 text-sm text-[#434351]/50">
        <a href="/typowanie" className="hover:text-[#434351] transition">← Typowanie</a>
        <span>/</span>
        <span className="text-[#434351]/60">{match.round_name}</span>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-8 space-y-6">

        {/* Karta meczu */}
        <div className="bg-[#2e3192]/[0.04] border border-[#2e3192]/15 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs text-[#434351]/50">{formatDate(match.starts_at)}</span>
            <span className={`text-xs font-semibold ${statusInfo.color}`}>
              {statusInfo.label}
            </span>
          </div>

          {/* Wynik */}
          <div className="flex items-center justify-center gap-6">
            <span className="text-lg font-bold text-right flex-1">{match.home_team}</span>

            <div className="flex items-center gap-3 shrink-0">
              {match.status === 'finished' || match.status === 'live' ? (
                <div className="flex items-center gap-2">
                  <span className="text-4xl font-black text-[#434351]">{match.home_score}</span>
                  <span className="text-2xl text-[#434351]/40">:</span>
                  <span className="text-4xl font-black text-[#434351]">{match.away_score}</span>
                </div>
              ) : (
                <span className="text-2xl text-[#434351]/25 font-bold tracking-widest">vs</span>
              )}
            </div>

            <span className="text-lg font-bold text-left flex-1">{match.away_team}</span>
          </div>

          {match.group_name && (
            <div className="text-center mt-3">
              <span className="text-xs bg-[#2e3192]/[0.06] px-2 py-0.5 rounded text-[#434351]/50">
                Grupa {match.group_name}
              </span>
            </div>
          )}
        </div>

        {/* Info o widoczności */}
        {!revealed && (
          <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-xl px-4 py-3 text-sm text-yellow-300/80 text-center">
            Typy innych graczy zostaną ujawnione po rozpoczęciu meczu.
          </div>
        )}

        {/* Prognozy */}
        <div>
          <div className="flex items-center gap-3 mb-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#2e3192]">
              Prognozy graczy
            </h2>
            <div className="flex-1 h-px bg-[#2e3192]/[0.06]" />
            <span className="text-xs text-[#434351]/40">
              {withPrediction.length}/{predictions.length} wytypowało
            </span>
          </div>

          <div className="space-y-2">
            {/* Gracze z prognozą */}
            {withPrediction.map(p => (
              <div
                key={p.user_id}
                className={`rounded-xl px-4 py-3 flex items-center gap-3 border ${
                  p.is_me
                    ? 'bg-[#2e3192]/8 border-[#2e3192]/30'
                    : 'bg-[#2e3192]/[0.03] border-[#2e3192]/10'
                }`}
              >
                <span className={`flex-1 text-sm font-medium truncate ${p.is_me ? 'text-[#2e3192]' : ''}`}>
                  {p.display_name}
                  {p.is_me && <span className="ml-2 text-xs text-[#2e3192]/70">(Ty)</span>}
                </span>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-lg font-bold tabular-nums">{p.home_score}</span>
                  <span className="text-[#434351]/40">:</span>
                  <span className="text-lg font-bold tabular-nums">{p.away_score}</span>
                </div>

                {match.status === 'finished' && p.points_earned !== null && (
                  <span className={`text-xs font-bold px-2 py-1 rounded-lg border w-12 text-center shrink-0 ${
                    PTS_STYLE[p.points_earned] ?? PTS_STYLE[0]
                  }`}>
                    {p.points_earned} pkt
                  </span>
                )}
              </div>
            ))}

            {/* Ukryte typy (mecz nie zaczęty) */}
            {hidden.length > 0 && (
              <div className="rounded-xl px-4 py-3 bg-[#2e3192]/[0.02] border border-[#2e3192]/8 text-sm text-[#434351]/30 text-center">
                + {hidden.length} ukrytych typów
              </div>
            )}

            {/* Gracze bez prognozy */}
            {noPrediction.map(p => (
              <div
                key={p.user_id}
                className={`rounded-xl px-4 py-3 flex items-center gap-3 border opacity-40 ${
                  p.is_me ? 'bg-[#2e3192]/5 border-[#2e3192]/20' : 'bg-[#2e3192]/[0.02] border-[#2e3192]/8'
                }`}
              >
                <span className="flex-1 text-sm text-[#434351]/50 truncate">
                  {p.display_name}
                  {p.is_me && <span className="ml-2 text-xs">(Ty — brak typu)</span>}
                </span>
                <span className="text-xs text-[#434351]/30">— brak typu —</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
