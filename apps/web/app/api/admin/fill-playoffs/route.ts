import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import pool from '@/lib/db'
import type { RowDataPacket } from 'mysql2'

async function requireAdmin() {
  const session = await auth()
  if (!session?.user || !(session.user as { isAdmin?: boolean }).isAdmin) return null
  return session
}

// Bracket template for 1/32 finału (matches ordered by starts_at, index 0-15)
// null = slot for best 3rd-place team
const BRACKET: Array<[string | null, number | null, string | null, number | null]> = [
  ['A', 1, 'B', 2],
  ['C', 1, 'D', 2],
  ['E', 1, 'F', 2],
  ['G', 1, 'H', 2],
  ['I', 1, 'J', 2],
  ['K', 1, 'L', 2],
  ['B', 1, 'A', 2],
  ['D', 1, 'C', 2],
  ['F', 1, 'E', 2],
  ['H', 1, 'G', 2],
  ['J', 1, 'I', 2],
  ['L', 1, 'K', 2],
  [null, 3, null, 3],
  [null, 3, null, 3],
  [null, 3, null, 3],
  [null, 3, null, 3],
]

export async function POST() {
  if (!await requireAdmin()) {
    return NextResponse.json({ error: 'Brak dostępu.' }, { status: 403 })
  }

  // Pobierz tabele grupowe ze skończonych meczów
  const [rows] = await pool.execute(`
    SELECT
      t.id   AS team_id,
      t.name AS team_name,
      g.name AS group_name,
      COUNT(CASE WHEN m.status = 'finished' THEN 1 END) AS played,
      SUM(CASE WHEN m.status != 'finished' THEN 0
               WHEN m.home_team_id = t.id THEN
                 CASE WHEN m.home_score > m.away_score THEN 3
                      WHEN m.home_score = m.away_score THEN 1 ELSE 0 END
               WHEN m.away_team_id = t.id THEN
                 CASE WHEN m.away_score > m.home_score THEN 3
                      WHEN m.away_score = m.home_score THEN 1 ELSE 0 END
               ELSE 0 END) AS points,
      SUM(CASE WHEN m.status != 'finished' THEN 0
               WHEN m.home_team_id = t.id THEN m.home_score - m.away_score
               WHEN m.away_team_id = t.id THEN m.away_score - m.home_score
               ELSE 0 END) AS goal_diff,
      SUM(CASE WHEN m.status != 'finished' THEN 0
               WHEN m.home_team_id = t.id THEN m.home_score
               WHEN m.away_team_id = t.id THEN m.away_score
               ELSE 0 END) AS goals_for
    FROM teams t
    JOIN \`groups\` g ON g.id = t.group_id
    LEFT JOIN matches m ON (m.home_team_id = t.id OR m.away_team_id = t.id)
      AND m.round_id IN (SELECT id FROM rounds WHERE stage = 'group')
    GROUP BY t.id, t.name, g.name
    ORDER BY g.name, points DESC, goal_diff DESC, goals_for DESC
  `) as [RowDataPacket[], unknown]

  // Zbuduj tabele per-grupa i ustal rankingi
  const groups: Record<string, RowDataPacket[]> = {}
  for (const row of rows as RowDataPacket[]) {
    if (!groups[row.group_name]) groups[row.group_name] = []
    groups[row.group_name].push(row)
  }

  // team_id per (group, rank) dla grup, w których wszystkie mecze skończone (played=3)
  const resolved: Record<string, number> = {}   // 'A1', 'A2', 'A3' → team_id
  const thirds: RowDataPacket[] = []

  for (const [grp, teams] of Object.entries(groups)) {
    if (teams.every(t => Number(t.played) === 3)) {
      teams.forEach((t, i) => {
        resolved[`${grp}${i + 1}`] = t.team_id
        if (i === 2) thirds.push({ ...t, group_name: grp })
      })
    }
  }

  // Posortuj 3. miejsca (do slotów 3rd w bracketcie)
  thirds.sort((a, b) =>
    Number(b.points) - Number(a.points) ||
    Number(b.goal_diff) - Number(a.goal_diff) ||
    Number(b.goals_for) - Number(a.goals_for)
  )

  // Pobierz mecze 1/32 w kolejności starts_at
  const [matchRows] = await pool.execute(`
    SELECT m.id
    FROM matches m
    JOIN rounds r ON r.id = m.round_id
    WHERE r.order_nr = 4
    ORDER BY m.starts_at
  `) as [RowDataPacket[], unknown]

  const playoffMatches = matchRows as RowDataPacket[]
  let thirdIdx = 0
  let updated = 0

  for (let i = 0; i < Math.min(BRACKET.length, playoffMatches.length); i++) {
    const [hGroup, hRank, aGroup, aRank] = BRACKET[i]
    const matchId = playoffMatches[i].id

    let homeTeamId: number | null = null
    let awayTeamId: number | null = null

    if (hRank === 3) {
      // slot 3. miejsca
      homeTeamId = thirds[thirdIdx]?.team_id ?? null
      awayTeamId = thirds[thirdIdx + 1]?.team_id ?? null
      if (homeTeamId || awayTeamId) thirdIdx += 2
    } else {
      homeTeamId = hGroup ? (resolved[`${hGroup}${hRank}`] ?? null) : null
      awayTeamId = aGroup ? (resolved[`${aGroup}${aRank}`] ?? null) : null
    }

    if (homeTeamId == null && awayTeamId == null) continue

    await pool.execute(
      `UPDATE matches SET
        home_team_id = COALESCE(?, home_team_id),
        away_team_id = COALESCE(?, away_team_id)
       WHERE id = ?`,
      [homeTeamId, awayTeamId, matchId]
    )
    updated++
  }

  return NextResponse.json({ message: `Uzupełniono ${updated} meczy playoff.`, updated })
}
