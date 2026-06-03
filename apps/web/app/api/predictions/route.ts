import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET(req: NextRequest) {
  const user_id = req.nextUrl.searchParams.get('user_id')
  if (!user_id) return NextResponse.json([])

  const { rows } = await pool.query(
    'SELECT match_id, home_score, away_score FROM predictions WHERE user_id = $1',
    [user_id]
  )
  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const { user_id, predictions } = await req.json()

  if (!user_id || !Array.isArray(predictions)) {
    return NextResponse.json({ error: 'Nieprawidłowe dane.' }, { status: 400 })
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    for (const p of predictions) {
      const { match_id, home_score, away_score } = p
      if (home_score === '' || away_score === '' || home_score == null || away_score == null) continue

      const { rows } = await client.query(
        'SELECT starts_at FROM matches WHERE id = $1',
        [match_id]
      )
      if (!rows[0] || new Date(rows[0].starts_at) <= new Date()) continue

      await client.query(
        `INSERT INTO predictions (user_id, match_id, home_score, away_score)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (user_id, match_id) DO UPDATE
         SET home_score = $3, away_score = $4`,
        [user_id, match_id, home_score, away_score]
      )
    }
    await client.query('COMMIT')
  } catch (e) {
    await client.query('ROLLBACK')
    throw e
  } finally {
    client.release()
  }

  return NextResponse.json({ message: 'Zapisano.' })
}
