import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import pool from '@/lib/db'
import type { RowDataPacket } from 'mysql2'

async function requireAdmin() {
  const session = await auth()
  if (!session?.user || !(session.user as { isAdmin?: boolean }).isAdmin) return null
  return session
}

function calcPoints(predHome: number, predAway: number, realHome: number, realAway: number): number {
  if (predHome === realHome && predAway === realAway) return 3
  if (Math.sign(predHome - predAway) === Math.sign(realHome - realAway)) return 1
  return 0
}

export async function PATCH(req: NextRequest) {
  if (!await requireAdmin()) {
    return NextResponse.json({ error: 'Brak dostępu.' }, { status: 403 })
  }

  const { match_id, home_score, away_score, status } = await req.json()
  if (match_id == null) {
    return NextResponse.json({ error: 'Nieprawidłowe dane.' }, { status: 400 })
  }

  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()

    await connection.execute(
      'UPDATE matches SET home_score = ?, away_score = ?, status = ? WHERE id = ?',
      [home_score, away_score, status ?? 'finished', match_id]
    )

    if (status === 'finished') {
      const [predictions] = await connection.execute(
        'SELECT id, user_id, home_score, away_score FROM predictions WHERE match_id = ?',
        [match_id]
      ) as [RowDataPacket[], unknown]

      for (const p of predictions) {
        const pts = calcPoints(
          Number(p.home_score), Number(p.away_score),
          Number(home_score), Number(away_score)
        )
        await connection.execute(
          'UPDATE predictions SET points_earned = ? WHERE id = ?',
          [pts, p.id]
        )
      }

      const affectedUsers = [...new Set(predictions.map((p: RowDataPacket) => p.user_id))]
      for (const userId of affectedUsers) {
        await connection.execute(
          `UPDATE users
           SET points_total = (
             SELECT COALESCE(SUM(points_earned), 0)
             FROM predictions
             WHERE user_id = ? AND points_earned IS NOT NULL
           )
           WHERE id = ?`,
          [userId, userId]
        )
      }
    }

    await connection.commit()
  } catch (e) {
    await connection.rollback()
    throw e
  } finally {
    connection.release()
  }

  return NextResponse.json({ message: 'Zaktualizowano.' })
}
