const ISO: Record<string, string> = {
  'Meksyk':                        'mx',
  'Korea Południowa':               'kr',
  'Czechy':                         'cz',
  'RPA':                            'za',
  'Republika Południowej Afryki':   'za',
  'Kanada':                         'ca',
  'Bośnia i Hercegowina':           'ba',
  'Katar':                          'qa',
  'Szwajcaria':                     'ch',
  'Brazylia':                       'br',
  'Maroko':                         'ma',
  'Haiti':                          'ht',
  'Szkocja':                        'gb-sct',
  'Stany Zjednoczone':              'us',
  'Australia':                      'au',
  'Turcja':                         'tr',
  'Paragwaj':                       'py',
  'Niemcy':                         'de',
  'Ekwador':                        'ec',
  'Wybrzeże Kości Słoniowej':       'ci',
  'Curaçao':                        'cw',
  'Holandia':                       'nl',
  'Japonia':                        'jp',
  'Szwecja':                        'se',
  'Tunezja':                        'tn',
  'Belgia':                         'be',
  'Egipt':                          'eg',
  'Iran':                           'ir',
  'Nowa Zelandia':                  'nz',
  'Hiszpania':                      'es',
  'Wyspy Zielonego Przylądka':      'cv',
  'Arabia Saudyjska':               'sa',
  'Urugwaj':                        'uy',
  'Francja':                        'fr',
  'Senegal':                        'sn',
  'Irak':                           'iq',
  'Norwegia':                       'no',
  'Argentyna':                      'ar',
  'Algieria':                       'dz',
  'Austria':                        'at',
  'Jordania':                       'jo',
  'Portugalia':                     'pt',
  'DR Kongo':                       'cd',
  'Uzbekistan':                     'uz',
  'Kolumbia':                       'co',
  'Anglia':                         'gb-eng',
  'Chorwacja':                      'hr',
  'Ghana':                          'gh',
  'Panama':                         'pa',
}

export default function Flag({ team }: { team: string }) {
  const code = ISO[team?.trim() ?? '']
  if (!code) return null
  return (
    <img
      src={`https://flagcdn.com/20x15/${code}.png`}
      alt={team}
      width={20}
      height={15}
      className="inline-block align-middle"
    />
  )
}
