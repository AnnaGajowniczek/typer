import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import type { RowDataPacket } from 'mysql2'

// Mapowanie nazw angielskich (api-football) → polskich (nasza baza)
const TEAM_MAP: Record<string, string> = {
  'Mexico': 'Meksyk',
  'South Korea': 'Korea Południowa',
  'Korea Republic': 'Korea Południowa',
  'Czech Republic': 'Czechy',
  'South Africa': 'RPA',
  'Canada': 'Kanada',
  'Bosnia and Herzegovina': 'Bośnia i Hercegowina',
  'Bosnia': 'Bośnia i Hercegowina',
  'Qatar': 'Katar',
  'Switzerland': 'Szwajcaria',
  'Brazil': 'Brazylia',
  'Morocco': 'Maroko',
  'Haiti': 'Haiti',
  'Scotland': 'Szkocja',
  'United States': 'Stany Zjednoczone',
  'USA': 'Stany Zjednoczone',
  'Australia': 'Australia',
  'Turkey': 'Turcja',
  'Turkiye': 'Turcja',
  'Paraguay': 'Paragwaj',
  'Germany': 'Niemcy',
  'Ecuador': 'Ekwador',
  "Cote d'Ivoire": 'Wybrzeże Kości Słoniowej',
  'Ivory Coast': 'Wybrzeże Kości Słoniowej',
  'Curaçao': 'Curaçao',
  'Curacao': 'Curaçao',
  'Netherlands': 'Holandia',
  'Japan': 'Japonia',
  'Sweden': 'Szwecja',
  'Tunisia': 'Tunezja',
  'Belgium': 'Belgia',
  'Egypt': 'Egipt',
  'Iran': 'Iran',
  'New Zealand': 'Nowa Zelandia',
  'Spain': 'Hiszpania',
  'Cape Verde': 'Wyspy Zielonego Przylądka',
  'Saudi Arabia': 'Arabia Saudyjska',
  'Uruguay': 'Urugwaj',
  'France': 'Francja',
  'Senegal': 'Senegal',
  'Iraq': 'Irak',
  'Norway': 'Norwegia',
  'Argentina': 'Argentyna',
  'Algeria': 'Algieria',
  'Austria': 'Austria',
  'Jordan': 'Jordania',
  'Portugal': 'Portugalia',
  'DR Congo': 'DR Kongo',
  'Congo DR': 'DR Kongo',
  'Uzbekistan': 'Uzbekistan',
  'Colombia': 'Kolumbia',
  'England': 'Anglia',
  'Croatia': 'Chorwacja',
  'Ghana': 'Ghana',
  'Panama': 'Panama',
}

function toPolish(name: string): string {
  return TEAM_MAP[name] ?? name
}

function calcPoints(predHome: number, predAway: number, realHome: number, realAway: number): number {
  if (predHome === realHome && predAway === realAway) return 3
  if (Math.sign(predHome - predAway) === Math.sign(realHome - realAway)) return 1
  return 0
}

const FINISHED_STATUSES = new Set(['FT', 'AET', 'PEN'])

export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-sync-secret')
  if (!secret || secret !== process.env.SYNC_SECRET) {
    return NextResponse.json({ error: 'Brak dostępu.' }, { status: 403 })
  }

  // Wszystkie niezakończone mecze starsze niż 150 minut
  const [pending] = await pool.execute(`
    SELECT m.id, m.starts_at, m.home_score, m.away_score,
           t1.name AS home_team, t2.name AS away_team
    FROM matches m
    JOIN teams t1 ON m.home_team_id = t1.id
    JOIN teams t2 ON m.away_team_id = t2.id
    WHERE m.status NOT IN ('finished', 'cancelled')
      AND m.starts_at <= DATE_SUB(NOW(), INTERVAL 150 MINUTE)
  `) as [RowDataPacket[], unknown]

  if ((pending as RowDataPacket[]).length === 0) {
    return NextResponse.json({ message: 'Brak meczów do zaktualizowania.', updated: 0 })
  }

  // Pobierz unikalne daty meczów i zapytaj API dla każdej z nich
  const dates = [...new Set((pending as RowDataPacket[]).map(m =>
    new Date(m.starts_at).toISOString().slice(0, 10)
  ))]

  const allFixtures: {
    fixture: { status: { short: string } }
    teams: { home: { name: string }; away: { name: string } }
    goals: { home: number | null; away: number | null }
  }[] = []

  for (const date of dates) {
    const apiRes = await fetch(
      `https://v3.football.api-sports.io/fixtures?league=1&season=2026&date=${date}`,
      {
        headers: {
          'x-rapidapi-host': 'v3.football.api-sports.io',
          'x-rapidapi-key': process.env.RAPID_API_KEY ?? '',
        },
      }
    )
    if (apiRes.ok) {
      const apiData = await apiRes.json()
      allFixtures.push(...(apiData.response ?? []))
    }
  }

  let updated = 0

  for (const match of pending as RowDataPacket[]) {
    const fixture = allFixtures.find(f => {
      const apiHome = toPolish(f.teams.home.name)
      const apiAway = toPolish(f.teams.away.name)
      return apiHome === match.home_team && apiAway === match.away_team
    })

    if (!fixture) continue
    if (!FINISHED_STATUSES.has(fixture.fixture.status.short)) continue
    if (fixture.goals.home == null || fixture.goals.away == null) continue

    const homeScore = fixture.goals.home
    const awayScore = fixture.goals.away

    const connection = await pool.getConnection()
    try {
      await connection.beginTransaction()

      await connection.execute(
        'UPDATE matches SET home_score = ?, away_score = ?, status = ? WHERE id = ?',
        [homeScore, awayScore, 'finished', match.id]
      )

      const [predictions] = await connection.execute(
        'SELECT id, user_id, home_score, away_score FROM predictions WHERE match_id = ?',
        [match.id]
      ) as [RowDataPacket[], unknown]

      for (const p of predictions as RowDataPacket[]) {
        const pts = calcPoints(Number(p.home_score), Number(p.away_score), homeScore, awayScore)
        await connection.execute(
          'UPDATE predictions SET points_earned = ? WHERE id = ?',
          [pts, p.id]
        )
      }

      const affectedUsers = [...new Set((predictions as RowDataPacket[]).map(p => p.user_id))]
      for (const userId of affectedUsers) {
        await connection.execute(
          `UPDATE users SET points_total = (
             SELECT COALESCE(SUM(points_earned), 0)
             FROM predictions
             WHERE user_id = ? AND points_earned IS NOT NULL
           ) WHERE id = ?`,
          [userId, userId]
        )
      }

      await connection.commit()
      updated++
      console.log(`[sync] Zaktualizowano: ${match.home_team} ${homeScore}:${awayScore} ${match.away_team}`)
    } catch (e) {
      await connection.rollback()
      throw e
    } finally {
      connection.release()
    }
  }

  return NextResponse.json({ message: `Zaktualizowano ${updated} mecz(y).`, updated })
}
