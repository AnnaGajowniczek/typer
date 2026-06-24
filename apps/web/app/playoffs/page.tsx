'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import Flag from '@/components/Flag'

type Match = {
  id: number
  starts_at: string
  status: string
  home_team: string | null
  away_team: string | null
  home_score: number | null
  away_score: number | null
}

type Round = {
  id: number
  name: string
  stage: string
  order_nr: number
  matches: Match[]
}

const CARD_H = 64
const SLOT_H_BASE = 88
const COL_W = 216
const COL_GAP = 36

function MatchCard({ match }: { match: Match }) {
  const hasScore = match.home_score != null && match.away_score != null
  const homeWins = hasScore && match.home_score! > match.away_score!
  const awayWins = hasScore && match.away_score! > match.home_score!

  return (
    <div className="rounded-lg border border-[#2e3192]/15 bg-white overflow-hidden text-xs h-full">
      <div className={`flex items-center gap-1 px-2 py-1.5 ${homeWins ? 'font-bold text-[#2e3192]' : ''}`}>
        <span className="truncate flex-1 min-w-0">
          {match.home_team
            ? <><Flag team={match.home_team} /> {match.home_team}</>
            : <span className="text-[#434351]/30 italic">TBD</span>}
        </span>
        {hasScore && <span className="shrink-0 tabular-nums font-bold">{match.home_score}</span>}
      </div>
      <div className="h-px bg-[#2e3192]/10" />
      <div className={`flex items-center gap-1 px-2 py-1.5 ${awayWins ? 'font-bold text-[#2e3192]' : ''}`}>
        <span className="truncate flex-1 min-w-0">
          {match.away_team
            ? <><Flag team={match.away_team} /> {match.away_team}</>
            : <span className="text-[#434351]/30 italic">TBD</span>}
        </span>
        {hasScore && <span className="shrink-0 tabular-nums font-bold">{match.away_score}</span>}
      </div>
    </div>
  )
}

function BracketConnectors({ rounds, totalH, totalW }: { rounds: Round[]; totalH: number; totalW: number }) {
  type Line = { x1: number; y1: number; x2: number; y2: number }
  const lines: Line[] = []

  for (let n = 0; n < rounds.length - 1; n++) {
    const matchCount = rounds[n].matches.length
    const slotH = totalH / matchCount

    const xRight = n * (COL_W + COL_GAP) + COL_W
    const xMid   = xRight + COL_GAP / 2
    const xLeft  = (n + 1) * (COL_W + COL_GAP)

    for (let j = 0; j < matchCount / 2; j++) {
      const yTop = (2 * j) * slotH + slotH / 2
      const yBot = (2 * j + 1) * slotH + slotH / 2
      const yMid = (yTop + yBot) / 2

      // prawy kraniec karty → środek przerwy (górny mecz)
      lines.push({ x1: xRight, y1: yTop, x2: xMid, y2: yTop })
      // prawy kraniec karty → środek przerwy (dolny mecz)
      lines.push({ x1: xRight, y1: yBot, x2: xMid, y2: yBot })
      // pionowa linia łącząca parę
      lines.push({ x1: xMid, y1: yTop, x2: xMid, y2: yBot })
      // pozioma linia → lewy kraniec karty następnej rundy
      lines.push({ x1: xMid, y1: yMid, x2: xLeft, y2: yMid })
    }
  }

  return (
    <svg
      style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', zIndex: 0 }}
      width={totalW}
      height={totalH}
    >
      {lines.map((l, i) => (
        <line
          key={i}
          x1={l.x1} y1={l.y1}
          x2={l.x2} y2={l.y2}
          stroke="rgb(46 49 146 / 0.2)"
          strokeWidth={1.5}
          strokeLinecap="round"
        />
      ))}
    </svg>
  )
}

export default function PlayoffsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [rounds, setRounds] = useState<Round[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/logowanie')
  }, [status, router])

  useEffect(() => {
    fetch('/api/matches')
      .then(r => r.json())
      .then((data: Round[]) => {
        setRounds(data.filter(r => r.stage === 'knockout').sort((a, b) => a.order_nr - b.order_nr))
        setLoading(false)
      })
  }, [])

  if (status === 'loading' || loading) return (
    <main className="min-h-screen bg-[#eff1f9]"><Header /></main>
  )

  const baseCount = rounds[0]?.matches.length ?? 16
  const totalH = baseCount * SLOT_H_BASE
  const totalW = rounds.length * COL_W + (rounds.length - 1) * COL_GAP

  return (
    <main className="min-h-screen bg-[#eff1f9] text-[#434351] pb-12">
      <Header />
      <div className="px-4 pt-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">Drabinka playoff</h1>
        </div>

        <div className="overflow-x-auto pb-4">
          {/* Nagłówki rund */}
          <div className="flex mb-3" style={{ gap: COL_GAP, width: totalW }}>
            {rounds.map(round => (
              <div
                key={round.id}
                className="shrink-0 text-center text-xs font-bold uppercase tracking-widest text-[#2e3192]"
                style={{ width: COL_W }}
              >
                {round.name}
              </div>
            ))}
          </div>

          {/* Drabinka */}
          <div className="relative flex" style={{ gap: COL_GAP, height: totalH, width: totalW }}>
            <BracketConnectors rounds={rounds} totalH={totalH} totalW={totalW} />
            {rounds.map(round => {
              const matchCount = round.matches.length
              const slotH = totalH / matchCount

              return (
                <div
                  key={round.id}
                  className="relative shrink-0"
                  style={{ width: COL_W, height: totalH, zIndex: 1 }}
                >
                  {round.matches.map((match, i) => (
                    <div
                      key={match.id}
                      style={{
                        position: 'absolute',
                        top: i * slotH + (slotH - CARD_H) / 2,
                        left: 0,
                        right: 0,
                        height: CARD_H,
                      }}
                    >
                      <MatchCard match={match} />
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </main>
  )
}
