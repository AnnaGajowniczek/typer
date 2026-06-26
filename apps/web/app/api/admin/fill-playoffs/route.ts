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

  const results = await Promise.all(dates.map(date =>
    fetch(`https://v3.football.api-sports.io/fixtures?date=${date}`, {
      headers: {
        'x-rapidapi-host': 'v3.football.api-sports.io',
        'x-rapidapi-key': apiKey,
      },
    }).then(res => res.ok ? res.json() : null).catch(() => null)
  ))

  for (const data of results) {
    if (!data?.response) continue
    // Filtruj World Cup (league ID=1) lub po nazwie jako fallback
    const wcFixtures = (data.response as ApiFixture[]).filter(f =>
      f.league?.id === 1 || f.league?.name?.toLowerCase().includes('world cup')
    )
    allFixtures.push(...wcFixtures)
  }

  if (allFixtures.length === 0) {
    return NextResponse.json({
      message: 'API nie zwróciło żadnych meczów World Cup dla podanych dat.',
      updated: 0,
      dates,
    })
  }

  // Pobierz wszystkie drużyny z DB (nazwa → id)
  const [teamRows] = await pool.execute('SELECT id, name FROM teams') as [RowDataPacket[], unknown]
  const teamByName: Record<string, number> = {}
  for (const t of teamRows as RowDataPacket[]) {
    teamByName[t.name] = t.id
  }

  let updated = 0
  const notFound: string[] = []

  for (const fixture of allFixtures) {
    const homeNamePl = toPolish(fixture.teams.home.name)
    const awayNamePl = toPolish(fixture.teams.away.name)

    const homeTeamId = teamByName[homeNamePl] ?? null
    const awayTeamId = teamByName[awayNamePl] ?? null

    if (!homeTeamId) notFound.push(fixture.teams.home.name)
    if (!awayTeamId) notFound.push(fixture.teams.away.name)

    if (!homeTeamId && !awayTeamId) continue

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
