import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import pool from '@/lib/db'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  const currentUserId = session?.user?.id
  const { id } = await params

  // Pobierz dane meczu
  const { rows: matchRows } = await pool.query(`
    SELECT
      m.id, m.starts_at, m.status, m.home_score, m.away_score,
      ht.name AS home_team, at_.name AS away_team,
      r.name AS round_name, g.name AS group_name
    FROM matches m
    JOIN teams ht  ON ht.id  = m.home_team_id
    JOIN teams at_ ON at_.id = m.away_team_id
    JOIN rounds r  ON r.id   = m.round_id
    LEFT JOIN groups g ON g.id = ht.group_id
    WHERE m.id = $1
  `, [id])

  if (!matchRows[0]) {
    return NextResponse.json({ error: 'Mecz nie istnieje.' }, { status: 404 })
  }

  const match = matchRows[0]
  const revealed = match.status !== 'upcoming'

  // Pobierz prognozy – ukryj cudze jeśli mecz nie rozpoczęty
  const { rows: predictions } = await pool.query(`
    SELECT
      u.id AS user_id,
      u.display_name,
      p.home_score,
      p.away_score,
      p.points_earned
    FROM users u
    LEFT JOIN predictions p ON p.user_id = u.id AND p.match_id = $1
    ORDER BY
      p.points_earned DESC NULLS LAST,
      (p.id IS NOT NULL) DESC,
      u.display_name
  `, [id])

  const result = predictions.map(p => ({
    user_id:       p.user_id,
    display_name:  p.display_name,
    home_score:    (revealed || String(p.user_id) === String(currentUserId)) ? p.home_score : null,
    away_score:    (revealed || String(p.user_id) === String(currentUserId)) ? p.away_score : null,
    points_earned: match.status === 'finished' ? p.points_earned : null,
    is_hidden:     !revealed && String(p.user_id) !== String(currentUserId),
    is_me:         String(p.user_id) === String(currentUserId),
  }))

  return NextResponse.json({ match, predictions: result, revealed })
}
