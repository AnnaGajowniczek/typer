import { NextResponse } from 'next/server'
import pool from '@/lib/db'
import type { RowDataPacket } from 'mysql2'

const ROUND_NAMES: Record<string, string> = {
  '1/32 finalu':  '1/16 finału',  // stara nazwa w DB → poprawna
  '1/16 finalu':  '1/8 finału',   // stara nazwa w DB → poprawna
  'Cwiercfinaly': 'Ćwierćfinały',
  'Polfinaly':    'Półfinały',
  'Final':        'Finał',
}

export async function GET() {
  await pool.execute(
    `UPDATE matches SET status = 'live'
     WHERE status = 'upcoming' AND starts_at <= NOW()`
  )

  const [rows] = await pool.execute(`
    SELECT
      m.id,
      m.starts_at,
      m.status,
      m.home_score,
      m.away_score,
      m.home_team_id,
      m.away_team_id,
      ht.name AS home_team,
      at_.name AS away_team,
      r.id AS round_id,
      r.name AS round_name,
      r.stage,
      r.order_nr,
      g.name AS group_name
    FROM matches m
    LEFT JOIN teams ht  ON ht.id  = m.home_team_id
    LEFT JOIN teams at_ ON at_.id = m.away_team_id
    JOIN rounds r  ON r.id   = m.round_id
    LEFT JOIN \`groups\` g ON g.id = ht.group_id
    ORDER BY r.order_nr,
             CASE WHEN r.stage = 'knockout' AND m.bracket_pos IS NOT NULL
                  THEN m.bracket_pos ELSE 99999 END,
             m.starts_at
  `) as [import("mysql2").RowDataPacket[], unknown]

  const roundMap: Record<number, { id: number; name: string; stage: string; order_nr: number; matches: unknown[] }> = {}
  for (const row of rows) {
    if (!roundMap[row.round_id]) {
      roundMap[row.round_id] = {
        id: row.round_id,
        name: ROUND_NAMES[row.round_name] ?? row.round_name,
        stage: row.stage,
        order_nr: row.order_nr,
        matches: [],
      }
    }
    roundMap[row.round_id].matches.push({
      id: row.id,
      starts_at: row.starts_at,
      status: row.status,
      home_team: row.home_team,
      away_team: row.away_team,
      home_team_id: row.home_team_id,
      away_team_id: row.away_team_id,
      home_score: row.home_score,
      away_score: row.away_score,
      group_name: row.group_name,
    })
  }

  return NextResponse.json(Object.values(roundMap))
}
