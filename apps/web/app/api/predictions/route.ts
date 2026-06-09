import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import type { RowDataPacket } from 'mysql2'

export async function GET(req: NextRequest) {
  const user_id = req.nextUrl.searchParams.get('user_id')
  if (!user_id) return NextResponse.json([])

  const [rows] = await pool.execute(
    'SELECT match_id, home_score, away_score FROM predictions WHERE user_id = ?',
    [user_id]
  ) as [RowDataPacket[], unknown]
  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const { user_id, predictions } = await req.json()

  if (!user_id || !Array.isArray(predictions)) {
    return NextResponse.json({ error: 'Nieprawidłowe dane.' }, { status: 400 })
  }

  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    for (const p of predictions) {
      const { match_id, home_score, away_score } = p
      if (home_score === '' || away_score === '' || home_score == null || away_score == null) continue

      const [rows] = await connection.execute(
        'SELECT starts_at, status FROM matches WHERE id = ?',
        [match_id]
      ) as [RowDataPacket[], unknown]
      if (!rows[0]) continue
      if (new Date(rows[0].starts_at) <= new Date()) continue
      if (rows[0].status === 'finished') continue

      await connection.execute(
        `INSERT INTO predictions (user_id, match_id, home_score, away_score)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE home_score = VALUES(home_score), away_score = VALUES(away_score)`,
        [user_id, match_id, home_score, away_score]
      )
    }
    await connection.commit()
  } catch (e) {
    await connection.rollback()
    throw e
  } finally {
    connection.release()
  }

  return NextResponse.json({ message: 'Zapisano.' })
}

export async function DELETE(req: NextRequest) {
  const { user_id, match_id } = await req.json()
  if (!user_id || !match_id) {
    return NextResponse.json({ error: 'Nieprawidłowe dane.' }, { status: 400 })
  }

  const [rows] = await pool.execute(
    'SELECT starts_at, status FROM matches WHERE id = ?',
    [match_id]
  ) as [RowDataPacket[], unknown]
  if (!rows[0] || new Date(rows[0].starts_at) <= new Date() || rows[0].status === 'finished') {
    return NextResponse.json({ error: 'Nie można usunąć typu dla tego meczu.' }, { status: 403 })
  }

  await pool.execute(
    'DELETE FROM predictions WHERE user_id = ? AND match_id = ?',
    [user_id, match_id]
  )
  return NextResponse.json({ message: 'Usunięto.' })
}
