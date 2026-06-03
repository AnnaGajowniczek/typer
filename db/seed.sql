-- seed.sql: MŚ 2026 – drużyny i mecze fazy grupowej (czasy UTC)

-- Drużyny
INSERT INTO teams (name, group_id) VALUES
  -- Grupa A
  ('Mexico',                   (SELECT id FROM groups WHERE name = 'A')),
  ('South Korea',               (SELECT id FROM groups WHERE name = 'A')),
  ('Czechia',                   (SELECT id FROM groups WHERE name = 'A')),
  ('South Africa',              (SELECT id FROM groups WHERE name = 'A')),
  -- Grupa B
  ('Canada',                    (SELECT id FROM groups WHERE name = 'B')),
  ('Bosnia and Herzegovina',    (SELECT id FROM groups WHERE name = 'B')),
  ('Qatar',                     (SELECT id FROM groups WHERE name = 'B')),
  ('Switzerland',               (SELECT id FROM groups WHERE name = 'B')),
  -- Grupa C
  ('Brazil',                    (SELECT id FROM groups WHERE name = 'C')),
  ('Morocco',                   (SELECT id FROM groups WHERE name = 'C')),
  ('Haiti',                     (SELECT id FROM groups WHERE name = 'C')),
  ('Scotland',                  (SELECT id FROM groups WHERE name = 'C')),
  -- Grupa D
  ('United States',             (SELECT id FROM groups WHERE name = 'D')),
  ('Australia',                 (SELECT id FROM groups WHERE name = 'D')),
  ('Turkey',                    (SELECT id FROM groups WHERE name = 'D')),
  ('Paraguay',                  (SELECT id FROM groups WHERE name = 'D')),
  -- Grupa E
  ('Germany',                   (SELECT id FROM groups WHERE name = 'E')),
  ('Ecuador',                   (SELECT id FROM groups WHERE name = 'E')),
  ('Ivory Coast',               (SELECT id FROM groups WHERE name = 'E')),
  ('Curacao',                   (SELECT id FROM groups WHERE name = 'E')),
  -- Grupa F
  ('Netherlands',               (SELECT id FROM groups WHERE name = 'F')),
  ('Japan',                     (SELECT id FROM groups WHERE name = 'F')),
  ('Sweden',                    (SELECT id FROM groups WHERE name = 'F')),
  ('Tunisia',                   (SELECT id FROM groups WHERE name = 'F')),
  -- Grupa G
  ('Belgium',                   (SELECT id FROM groups WHERE name = 'G')),
  ('Egypt',                     (SELECT id FROM groups WHERE name = 'G')),
  ('Iran',                      (SELECT id FROM groups WHERE name = 'G')),
  ('New Zealand',               (SELECT id FROM groups WHERE name = 'G')),
  -- Grupa H
  ('Spain',                     (SELECT id FROM groups WHERE name = 'H')),
  ('Cape Verde',                (SELECT id FROM groups WHERE name = 'H')),
  ('Saudi Arabia',              (SELECT id FROM groups WHERE name = 'H')),
  ('Uruguay',                   (SELECT id FROM groups WHERE name = 'H')),
  -- Grupa I
  ('France',                    (SELECT id FROM groups WHERE name = 'I')),
  ('Senegal',                   (SELECT id FROM groups WHERE name = 'I')),
  ('Iraq',                      (SELECT id FROM groups WHERE name = 'I')),
  ('Norway',                    (SELECT id FROM groups WHERE name = 'I')),
  -- Grupa J
  ('Argentina',                 (SELECT id FROM groups WHERE name = 'J')),
  ('Algeria',                   (SELECT id FROM groups WHERE name = 'J')),
  ('Austria',                   (SELECT id FROM groups WHERE name = 'J')),
  ('Jordan',                    (SELECT id FROM groups WHERE name = 'J')),
  -- Grupa K
  ('Portugal',                  (SELECT id FROM groups WHERE name = 'K')),
  ('DR Congo',                  (SELECT id FROM groups WHERE name = 'K')),
  ('Uzbekistan',                (SELECT id FROM groups WHERE name = 'K')),
  ('Colombia',                  (SELECT id FROM groups WHERE name = 'K')),
  -- Grupa L
  ('England',                   (SELECT id FROM groups WHERE name = 'L')),
  ('Croatia',                   (SELECT id FROM groups WHERE name = 'L')),
  ('Ghana',                     (SELECT id FROM groups WHERE name = 'L')),
  ('Panama',                    (SELECT id FROM groups WHERE name = 'L'));

-- Mecze fazy grupowej (72 mecze, czasy UTC = ET + 4h)
WITH t AS (SELECT id, name FROM teams),
     r AS (SELECT id, order_nr FROM rounds)
INSERT INTO matches (round_id, home_team_id, away_team_id, starts_at)
SELECT r.id, ht.id, at_.id, m.starts_at
FROM (VALUES
  -- ── KOLEJKA 1 ────────────────────────────────────────────────────────
  (1, 'Mexico',                 'South Africa',           '2026-06-11 19:00:00+00'::timestamptz),
  (1, 'South Korea',            'Czechia',                '2026-06-12 02:00:00+00'),
  (1, 'Canada',                 'Bosnia and Herzegovina', '2026-06-12 19:00:00+00'),
  (1, 'United States',          'Paraguay',               '2026-06-13 01:00:00+00'),
  (1, 'Qatar',                  'Switzerland',            '2026-06-13 19:00:00+00'),
  (1, 'Brazil',                 'Morocco',                '2026-06-13 22:00:00+00'),
  (1, 'Haiti',                  'Scotland',               '2026-06-14 01:00:00+00'),
  (1, 'Australia',              'Turkey',                 '2026-06-14 04:00:00+00'),
  (1, 'Germany',                'Curacao',                '2026-06-14 17:00:00+00'),
  (1, 'Netherlands',            'Japan',                  '2026-06-14 20:00:00+00'),
  (1, 'Ivory Coast',            'Ecuador',                '2026-06-14 23:00:00+00'),
  (1, 'Sweden',                 'Tunisia',                '2026-06-15 02:00:00+00'),
  (1, 'Spain',                  'Cape Verde',             '2026-06-15 17:00:00+00'),
  (1, 'Belgium',                'Egypt',                  '2026-06-15 22:00:00+00'),
  (1, 'Saudi Arabia',           'Uruguay',                '2026-06-15 22:00:00+00'),
  (1, 'Iran',                   'New Zealand',            '2026-06-16 04:00:00+00'),
  (1, 'France',                 'Senegal',                '2026-06-16 19:00:00+00'),
  (1, 'Iraq',                   'Norway',                 '2026-06-16 22:00:00+00'),
  (1, 'Argentina',              'Algeria',                '2026-06-17 01:00:00+00'),
  (1, 'Austria',                'Jordan',                 '2026-06-17 04:00:00+00'),
  (1, 'Portugal',               'DR Congo',               '2026-06-17 17:00:00+00'),
  (1, 'England',                'Croatia',                '2026-06-17 20:00:00+00'),
  (1, 'Ghana',                  'Panama',                 '2026-06-17 23:00:00+00'),
  (1, 'Uzbekistan',             'Colombia',               '2026-06-18 02:00:00+00'),
  -- ── KOLEJKA 2 ────────────────────────────────────────────────────────
  (2, 'Czechia',                'South Africa',           '2026-06-18 16:00:00+00'),
  (2, 'Switzerland',            'Bosnia and Herzegovina', '2026-06-18 19:00:00+00'),
  (2, 'Canada',                 'Qatar',                  '2026-06-18 22:00:00+00'),
  (2, 'Mexico',                 'South Korea',            '2026-06-19 03:00:00+00'),
  (2, 'United States',          'Australia',              '2026-06-19 19:00:00+00'),
  (2, 'Scotland',               'Morocco',                '2026-06-19 22:00:00+00'),
  (2, 'Brazil',                 'Haiti',                  '2026-06-20 01:00:00+00'),
  (2, 'Turkey',                 'Paraguay',               '2026-06-20 04:00:00+00'),
  (2, 'Netherlands',            'Sweden',                 '2026-06-20 17:00:00+00'),
  (2, 'Germany',                'Ivory Coast',            '2026-06-20 20:00:00+00'),
  (2, 'Ecuador',                'Curacao',                '2026-06-21 00:00:00+00'),
  (2, 'Tunisia',                'Japan',                  '2026-06-21 04:00:00+00'),
  (2, 'Spain',                  'Saudi Arabia',           '2026-06-21 16:00:00+00'),
  (2, 'Belgium',                'Iran',                   '2026-06-21 19:00:00+00'),
  (2, 'Uruguay',                'Cape Verde',             '2026-06-21 22:00:00+00'),
  (2, 'New Zealand',            'Egypt',                  '2026-06-22 01:00:00+00'),
  (2, 'Argentina',              'Austria',                '2026-06-22 17:00:00+00'),
  (2, 'France',                 'Iraq',                   '2026-06-22 21:00:00+00'),
  (2, 'Norway',                 'Senegal',                '2026-06-23 00:00:00+00'),
  (2, 'Jordan',                 'Algeria',                '2026-06-23 03:00:00+00'),
  (2, 'Portugal',               'Uzbekistan',             '2026-06-23 17:00:00+00'),
  (2, 'England',                'Ghana',                  '2026-06-23 20:00:00+00'),
  (2, 'Panama',                 'Croatia',                '2026-06-23 23:00:00+00'),
  (2, 'Colombia',               'DR Congo',               '2026-06-24 02:00:00+00'),
  -- ── KOLEJKA 3 ────────────────────────────────────────────────────────
  (3, 'Switzerland',            'Canada',                 '2026-06-24 19:00:00+00'),
  (3, 'Bosnia and Herzegovina', 'Qatar',                  '2026-06-24 19:00:00+00'),
  (3, 'Scotland',               'Brazil',                 '2026-06-24 22:00:00+00'),
  (3, 'Morocco',                'Haiti',                  '2026-06-24 22:00:00+00'),
  (3, 'Czechia',                'Mexico',                 '2026-06-25 01:00:00+00'),
  (3, 'South Africa',           'South Korea',            '2026-06-25 01:00:00+00'),
  (3, 'Ecuador',                'Germany',                '2026-06-25 20:00:00+00'),
  (3, 'Curacao',                'Ivory Coast',            '2026-06-25 20:00:00+00'),
  (3, 'Japan',                  'Sweden',                 '2026-06-25 23:00:00+00'),
  (3, 'Tunisia',                'Netherlands',            '2026-06-25 23:00:00+00'),
  (3, 'Turkey',                 'United States',          '2026-06-26 02:00:00+00'),
  (3, 'Paraguay',               'Australia',              '2026-06-26 02:00:00+00'),
  (3, 'Norway',                 'France',                 '2026-06-26 19:00:00+00'),
  (3, 'Senegal',                'Iraq',                   '2026-06-26 19:00:00+00'),
  (3, 'Cape Verde',             'Saudi Arabia',           '2026-06-27 00:00:00+00'),
  (3, 'Uruguay',                'Spain',                  '2026-06-27 00:00:00+00'),
  (3, 'Egypt',                  'Iran',                   '2026-06-27 03:00:00+00'),
  (3, 'New Zealand',            'Belgium',                '2026-06-27 03:00:00+00'),
  (3, 'Panama',                 'England',                '2026-06-27 21:00:00+00'),
  (3, 'Croatia',                'Ghana',                  '2026-06-27 21:00:00+00'),
  (3, 'Colombia',               'Portugal',               '2026-06-27 23:30:00+00'),
  (3, 'DR Congo',               'Uzbekistan',             '2026-06-27 23:30:00+00'),
  (3, 'Algeria',                'Austria',                '2026-06-28 02:00:00+00'),
  (3, 'Jordan',                 'Argentina',              '2026-06-28 02:00:00+00')
) AS m(rnd, home, away, starts_at)
JOIN t  ht  ON ht.name  = m.home
JOIN t  at_ ON at_.name = m.away
JOIN r       ON r.order_nr = m.rnd;
