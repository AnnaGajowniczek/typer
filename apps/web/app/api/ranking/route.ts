import { NextResponse } from 'next/server'
import pool from '@/lib/db'
import type { RowDataPacket } from 'mysql2'

export async function GET() {
  const [rows] = await pool.execute(`
    SELECT
      u.id,
      u.display_name,
      COUNT(p.id) AS typed,
      SUM(CASE WHEN m.status = 'finished' THEN 1 ELSE 0 END) AS typed_finished,
      COALESCE(SUM(
        CASE
          WHEN m.status != 'finished' THEN 0
          WHEN p.home_score = m.home_score AND p.away_score = m.away_score THEN 3
          WHEN (p.home_score > p.away_score AND m.home_score > m.away_score)
            OR (p.home_score < p.away_score AND m.home_score < m.away_score)
            OR (p.home_score = p.away_score AND m.home_score = m.away_score) THEN 1
          ELSE 0
        END
      ), 0) AS points,
      SUM(CASE
        WHEN m.status = 'finished'
          AND p.home_score = m.home_score
          AND p.away_score = m.away_score
        THEN 1 ELSE 0 END) AS exact,
      SUM(CASE
        WHEN m.status = 'finished'
          AND NOT (p.home_score = m.home_score AND p.away_score = m.away_score)
          AND (
            (p.home_score > p.away_score AND m.home_score > m.away_score)
            OR (p.home_score < p.away_score AND m.home_score < m.away_score)
            OR (p.home_score = p.away_score AND m.home_score = m.away_score)
          )
        THEN 1 ELSE 0 END) AS correct_outcome
    FROM users u
    LEFT JOIN predictions p ON p.user_id = u.id
    LEFT JOIN matches m ON m.id = p.match_id
    GROUP BY u.id, u.display_name
    ORDER BY points DESC, exact DESC, u.display_name
  `)

  return NextResponse.json(rows)
}
