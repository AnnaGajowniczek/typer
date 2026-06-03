import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import pool from '@/lib/db'

async function requireAdmin() {
  const session = await auth()
  if (!session?.user || !(session.user as { isAdmin?: boolean }).isAdmin) {
    return null
  }
  return session
}

function calcPoints(
  predHome: number, predAway: number,
  realHome: number, realAway: number
): number {
  if (predHome === realHome && predAway === realAway) return 3
  const predOutcome = Math.sign(predHome - predAway)
  const realOutcome = Math.sign(realHome - realAway)
  if (predOutcome === realOutcome) return 1
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

  // Sprawdź czy mecz już się rozpoczął — wyniki można wpisywać tylko po rozpoczęciu
  const { rows: matchRows } = await pool.query(
    'SELECT starts_at FROM matches WHERE id = $1',
    [match_id]
  )
  if (!matchRows[0]) {
    return NextResponse.json({ error: 'Mecz nie istnieje.' }, { status: 404 })
  }
  const matchStarted = new Date(matchRows[0].starts_at) <= new Date()

  // Jeśli przesyłane są wyniki (nie tylko zmiana statusu) — zablokuj dla przyszłych meczów
  if ((home_score != null || away_score != null) && !matchStarted) {
    return NextResponse.json({ error: 'Mecz jeszcze się nie rozpoczął.' }, { status: 403 })
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // 1. Zapisz wynik meczu
    await client.query(
      `UPDATE matches SET home_score = $1, away_score = $2, status = $3 WHERE id = $4`,
      [home_score, away_score, status ?? 'finished', match_id]
    )

    // 2. Przelicz punkty tylko gdy mecz zakończony
    if (status === 'finished') {
      const { rows: predictions } = await client.query(
        `SELECT id, user_id, home_score, away_score FROM predictions WHERE match_id = $1`,
        [match_id]
      )

      for (const p of predictions) {
        const pts = calcPoints(
          Number(p.home_score), Number(p.away_score),
          Number(home_score),   Number(away_score)
        )
        await client.query(
          `UPDATE predictions SET points_earned = $1 WHERE id = $2`,
          [pts, p.id]
        )
      }

      // 3. Zaktualizuj sumę punktów każdego gracza który miał typ w tym meczu
      const affectedUsers = [...new Set(predictions.map((p: { user_id: number }) => p.user_id))]
      for (const userId of affectedUsers) {
        await client.query(
          `UPDATE users
           SET points_total = (
             SELECT COALESCE(SUM(points_earned), 0)
             FROM predictions
             WHERE user_id = $1 AND points_earned IS NOT NULL
           )
           WHERE id = $1`,
          [userId]
        )
      }
    }

    await client.query('COMMIT')
  } catch (e) {
    await client.query('ROLLBACK')
    throw e
  } finally {
    client.release()
  }

  return NextResponse.json({ message: 'Zaktualizowano.' })
}
