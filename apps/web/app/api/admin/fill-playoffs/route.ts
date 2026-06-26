import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import pool from '@/lib/db'
import type { RowDataPacket } from 'mysql2'

async function requireAdmin() {
  const session = await auth()
  if (!session?.user || !(session.user as { isAdmin?: boolean }).isAdmin) return null
  return session
}

// Mapowanie angielskich nazw (api-sports) → polskich (nasza baza)
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

export async function POST() {
  if (!await requireAdmin()) {
    return NextResponse.json({ error: 'Brak dostępu.' }, { status: 403 })
  }

  const apiKey = process.env.RAPID_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'Brak klucza RAPID_API_KEY w środowisku serwera.' }, { status: 500 })
  }

  try {
  // Pobierz mecze pucharowe bez przypisanych drużyn
  const [dbMatches] = await pool.execute(`
    SELECT m.id, m.starts_at, r.order_nr
    FROM matches m
    JOIN rounds r ON m.round_id = r.id
    WHERE r.stage = 'knockout'
      AND (m.home_team_id IS NULL OR m.away_team_id IS NULL)
    ORDER BY m.starts_at
  `) as [RowDataPacket[], unknown]

  if ((dbMatches as RowDataPacket[]).length === 0) {
    return NextResponse.json({ message: 'Wszystkie mecze pucharowe mają już przypisane drużyny.', updated: 0 })
  }

  // Unikalne daty do zapytania do API
  const dates = [...new Set((dbMatches as RowDataPacket[]).map(m =>
    new Date(m.starts_at).toISOString().slice(0, 10)
  ))]

  // Pobierz fixtures z API równolegle dla wszystkich dat
  type ApiFixture = {
    fixture: { id: number; date: string }
    league: { id: number; name: string } | null
    teams: { home: { name: string }; away: { name: string } }
  }
  const allFixtures: ApiFixture[] = []

  const apiResponses = await Promise.all(dates.map(async date => {
    try {
      const res = await fetch(`https://v3.football.api-sports.io/fixtures?date=${date}`, {
        headers: {
          'x-rapidapi-host': 'v3.football.api-sports.io',
          'x-rapidapi-key': apiKey,
        },
      })
      const body = await res.json().catch(() => null)
      return { date, status: res.status, count: Array.isArray(body?.response) ? body.response.length : 0, body }
    } catch (e) {
      return { date, status: 0, count: 0, error: String(e), body: null }
    }
  }))

  for (const r of apiResponses) {
    if (r.body?.response) allFixtures.push(...(r.body.response as ApiFixture[]))
  }

  const apiDebug = apiResponses.map(r => `${r.date}: HTTP ${r.status}, fixtures: ${r.count}`)

  // Pobierz wszystkie drużyny z DB (nazwa → id)
  const [teamRows] = await pool.execute('SELECT id, name FROM teams') as [RowDataPacket[], unknown]
  const teamByName: Record<string, number> = {}
  for (const t of teamRows as RowDataPacket[]) {
    teamByName[t.name] = t.id
  }

  if (allFixtures.length === 0) {
    const planError = apiResponses.find(r => r.body?.errors?.plan)?.body?.errors?.plan as string | undefined
    const message = planError
      ? `Darmowy plan API nie obsługuje tych dat. ${planError} Przypisz drużyny ręcznie lub uruchom ponownie w dniu meczu.`
      : `API zwróciło 0 meczów dla dat: ${dates.slice(0, 3).join(', ')}…`
    return NextResponse.json({ message, updated: 0, dates, apiDebug })
  }

  let updated = 0
  const notFound: string[] = []

  for (const fixture of allFixtures) {
    const homeNamePl = toPolish(fixture.teams.home.name)
    const awayNamePl = toPolish(fixture.teams.away.name)

    const homeTeamId = teamByName[homeNamePl] ?? null
    const awayTeamId = teamByName[awayNamePl] ?? null

    // Pomijaj mecze gdzie żadna lub tylko jedna drużyna to drużyna MŚ
    if (!homeTeamId || !awayTeamId) {
      if (homeTeamId || awayTeamId) notFound.push(`${fixture.teams.home.name} vs ${fixture.teams.away.name}`)
      continue
    }

    // Znajdź mecz w DB po dacie (tolerancja ±2h)
    const fixtureDate = new Date(fixture.fixture.date)
    const [matchRows] = await pool.execute(`
      SELECT m.id FROM matches m
      JOIN rounds r ON m.round_id = r.id
      WHERE r.stage = 'knockout'
        AND ABS(TIMESTAMPDIFF(MINUTE, m.starts_at, ?)) < 120
    `, [fixtureDate.toISOString().slice(0, 19).replace('T', ' ')]) as [RowDataPacket[], unknown]

    const match = (matchRows as RowDataPacket[])[0]
    if (!match) continue

    await pool.execute(
      `UPDATE matches SET
        home_team_id = COALESCE(?, home_team_id),
        away_team_id = COALESCE(?, away_team_id)
       WHERE id = ?`,
      [homeTeamId, awayTeamId, match.id]
    )
    updated++
  }

  return NextResponse.json({
    message: `Uzupełniono ${updated} meczy na podstawie danych z API.`,
    updated,
    fixturesFromApi: allFixtures.length,
    notFound: [...new Set(notFound)],
  })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[fill-playoffs]', msg)
    return NextResponse.json({ error: `Błąd serwera: ${msg}` }, { status: 500 })
  }
}
