-- seed.sql dla MySQL 8+ — MŚ 2026

-- Admin
INSERT INTO users (email, display_name, password_hash, is_admin) VALUES
  ('anna@itss.pl', 'Anna', '$2b$10$EYyalpAsElArJdT8KYBo4.K7Qt4BppIsMH3bp7L8k3sr0EMbK9xd6', TRUE);

-- Rundy
INSERT INTO rounds (name, stage, order_nr) VALUES
  ('Faza grupowa - kolejka 1', 'group',    1),
  ('Faza grupowa - kolejka 2', 'group',    2),
  ('Faza grupowa - kolejka 3', 'group',    3),
  ('1/32 finalu',              'knockout', 4),
  ('1/16 finalu',              'knockout', 5),
  ('Cwiercfinaly',             'knockout', 6),
  ('Polfinaly',                'knockout', 7),
  ('Final',                    'knockout', 8);

-- Grupy
INSERT INTO `groups` (name) VALUES
  ('A'), ('B'), ('C'), ('D'), ('E'), ('F'),
  ('G'), ('H'), ('I'), ('J'), ('K'), ('L');

-- Drużyny (polskie nazwy)
INSERT INTO teams (name, group_id) SELECT 'Meksyk',                   id FROM `groups` WHERE name = 'A';
INSERT INTO teams (name, group_id) SELECT 'Korea Południowa',          id FROM `groups` WHERE name = 'A';
INSERT INTO teams (name, group_id) SELECT 'Czechy',                    id FROM `groups` WHERE name = 'A';
INSERT INTO teams (name, group_id) SELECT 'RPA', id FROM `groups` WHERE name = 'A';
INSERT INTO teams (name, group_id) SELECT 'Kanada',                    id FROM `groups` WHERE name = 'B';
INSERT INTO teams (name, group_id) SELECT 'Bośnia i Hercegowina',      id FROM `groups` WHERE name = 'B';
INSERT INTO teams (name, group_id) SELECT 'Katar',                     id FROM `groups` WHERE name = 'B';
INSERT INTO teams (name, group_id) SELECT 'Szwajcaria',                id FROM `groups` WHERE name = 'B';
INSERT INTO teams (name, group_id) SELECT 'Brazylia',                  id FROM `groups` WHERE name = 'C';
INSERT INTO teams (name, group_id) SELECT 'Maroko',                    id FROM `groups` WHERE name = 'C';
INSERT INTO teams (name, group_id) SELECT 'Haiti',                     id FROM `groups` WHERE name = 'C';
INSERT INTO teams (name, group_id) SELECT 'Szkocja',                   id FROM `groups` WHERE name = 'C';
INSERT INTO teams (name, group_id) SELECT 'Stany Zjednoczone',         id FROM `groups` WHERE name = 'D';
INSERT INTO teams (name, group_id) SELECT 'Australia',                 id FROM `groups` WHERE name = 'D';
INSERT INTO teams (name, group_id) SELECT 'Turcja',                    id FROM `groups` WHERE name = 'D';
INSERT INTO teams (name, group_id) SELECT 'Paragwaj',                  id FROM `groups` WHERE name = 'D';
INSERT INTO teams (name, group_id) SELECT 'Niemcy',                    id FROM `groups` WHERE name = 'E';
INSERT INTO teams (name, group_id) SELECT 'Ekwador',                   id FROM `groups` WHERE name = 'E';
INSERT INTO teams (name, group_id) SELECT 'Wybrzeże Kości Słoniowej',  id FROM `groups` WHERE name = 'E';
INSERT INTO teams (name, group_id) SELECT 'Curaçao',                   id FROM `groups` WHERE name = 'E';
INSERT INTO teams (name, group_id) SELECT 'Holandia',                  id FROM `groups` WHERE name = 'F';
INSERT INTO teams (name, group_id) SELECT 'Japonia',                   id FROM `groups` WHERE name = 'F';
INSERT INTO teams (name, group_id) SELECT 'Szwecja',                   id FROM `groups` WHERE name = 'F';
INSERT INTO teams (name, group_id) SELECT 'Tunezja',                   id FROM `groups` WHERE name = 'F';
INSERT INTO teams (name, group_id) SELECT 'Belgia',                    id FROM `groups` WHERE name = 'G';
INSERT INTO teams (name, group_id) SELECT 'Egipt',                     id FROM `groups` WHERE name = 'G';
INSERT INTO teams (name, group_id) SELECT 'Iran',                      id FROM `groups` WHERE name = 'G';
INSERT INTO teams (name, group_id) SELECT 'Nowa Zelandia',             id FROM `groups` WHERE name = 'G';
INSERT INTO teams (name, group_id) SELECT 'Hiszpania',                 id FROM `groups` WHERE name = 'H';
INSERT INTO teams (name, group_id) SELECT 'Wyspy Zielonego Przylądka', id FROM `groups` WHERE name = 'H';
INSERT INTO teams (name, group_id) SELECT 'Arabia Saudyjska',          id FROM `groups` WHERE name = 'H';
INSERT INTO teams (name, group_id) SELECT 'Urugwaj',                   id FROM `groups` WHERE name = 'H';
INSERT INTO teams (name, group_id) SELECT 'Francja',                   id FROM `groups` WHERE name = 'I';
INSERT INTO teams (name, group_id) SELECT 'Senegal',                   id FROM `groups` WHERE name = 'I';
INSERT INTO teams (name, group_id) SELECT 'Irak',                      id FROM `groups` WHERE name = 'I';
INSERT INTO teams (name, group_id) SELECT 'Norwegia',                  id FROM `groups` WHERE name = 'I';
INSERT INTO teams (name, group_id) SELECT 'Argentyna',                 id FROM `groups` WHERE name = 'J';
INSERT INTO teams (name, group_id) SELECT 'Algieria',                  id FROM `groups` WHERE name = 'J';
INSERT INTO teams (name, group_id) SELECT 'Austria',                   id FROM `groups` WHERE name = 'J';
INSERT INTO teams (name, group_id) SELECT 'Jordania',                  id FROM `groups` WHERE name = 'J';
INSERT INTO teams (name, group_id) SELECT 'Portugalia',                id FROM `groups` WHERE name = 'K';
INSERT INTO teams (name, group_id) SELECT 'DR Kongo',                  id FROM `groups` WHERE name = 'K';
INSERT INTO teams (name, group_id) SELECT 'Uzbekistan',                id FROM `groups` WHERE name = 'K';
INSERT INTO teams (name, group_id) SELECT 'Kolumbia',                  id FROM `groups` WHERE name = 'K';
INSERT INTO teams (name, group_id) SELECT 'Anglia',                    id FROM `groups` WHERE name = 'L';
INSERT INTO teams (name, group_id) SELECT 'Chorwacja',                 id FROM `groups` WHERE name = 'L';
INSERT INTO teams (name, group_id) SELECT 'Ghana',                     id FROM `groups` WHERE name = 'L';
INSERT INTO teams (name, group_id) SELECT 'Panama',                    id FROM `groups` WHERE name = 'L';

-- Mecze fazy grupowej (czasy UTC)
INSERT INTO matches (round_id, home_team_id, away_team_id, starts_at)
SELECT r.id, ht.id, at_.id, m.starts_at
FROM (
  SELECT 1 AS rnd, 'Meksyk' AS home, 'RPA' AS away, '2026-06-11 19:00:00' AS starts_at UNION ALL
  SELECT 1, 'Korea Południowa', 'Czechy', '2026-06-12 02:00:00' UNION ALL
  SELECT 1, 'Kanada', 'Bośnia i Hercegowina', '2026-06-12 19:00:00' UNION ALL
  SELECT 1, 'Stany Zjednoczone', 'Paragwaj', '2026-06-13 01:00:00' UNION ALL
  SELECT 1, 'Katar', 'Szwajcaria', '2026-06-13 19:00:00' UNION ALL
  SELECT 1, 'Brazylia', 'Maroko', '2026-06-13 22:00:00' UNION ALL
  SELECT 1, 'Haiti', 'Szkocja', '2026-06-14 01:00:00' UNION ALL
  SELECT 1, 'Australia', 'Turcja', '2026-06-14 04:00:00' UNION ALL
  SELECT 1, 'Niemcy', 'Curaçao', '2026-06-14 17:00:00' UNION ALL
  SELECT 1, 'Holandia', 'Japonia', '2026-06-14 20:00:00' UNION ALL
  SELECT 1, 'Wybrzeże Kości Słoniowej', 'Ekwador', '2026-06-14 23:00:00' UNION ALL
  SELECT 1, 'Szwecja', 'Tunezja', '2026-06-15 02:00:00' UNION ALL
  SELECT 1, 'Hiszpania', 'Wyspy Zielonego Przylądka', '2026-06-15 17:00:00' UNION ALL
  SELECT 1, 'Belgia', 'Egipt', '2026-06-15 22:00:00' UNION ALL
  SELECT 1, 'Arabia Saudyjska', 'Urugwaj', '2026-06-15 22:00:00' UNION ALL
  SELECT 1, 'Iran', 'Nowa Zelandia', '2026-06-16 04:00:00' UNION ALL
  SELECT 1, 'Francja', 'Senegal', '2026-06-16 19:00:00' UNION ALL
  SELECT 1, 'Irak', 'Norwegia', '2026-06-16 22:00:00' UNION ALL
  SELECT 1, 'Argentyna', 'Algieria', '2026-06-17 01:00:00' UNION ALL
  SELECT 1, 'Austria', 'Jordania', '2026-06-17 04:00:00' UNION ALL
  SELECT 1, 'Portugalia', 'DR Kongo', '2026-06-17 17:00:00' UNION ALL
  SELECT 1, 'Anglia', 'Chorwacja', '2026-06-17 20:00:00' UNION ALL
  SELECT 1, 'Ghana', 'Panama', '2026-06-17 23:00:00' UNION ALL
  SELECT 1, 'Uzbekistan', 'Kolumbia', '2026-06-18 02:00:00' UNION ALL
  SELECT 2, 'Czechy', 'RPA', '2026-06-18 16:00:00' UNION ALL
  SELECT 2, 'Szwajcaria', 'Bośnia i Hercegowina', '2026-06-18 19:00:00' UNION ALL
  SELECT 2, 'Kanada', 'Katar', '2026-06-18 22:00:00' UNION ALL
  SELECT 2, 'Meksyk', 'Korea Południowa', '2026-06-19 03:00:00' UNION ALL
  SELECT 2, 'Stany Zjednoczone', 'Australia', '2026-06-19 19:00:00' UNION ALL
  SELECT 2, 'Szkocja', 'Maroko', '2026-06-19 22:00:00' UNION ALL
  SELECT 2, 'Brazylia', 'Haiti', '2026-06-20 01:00:00' UNION ALL
  SELECT 2, 'Turcja', 'Paragwaj', '2026-06-20 04:00:00' UNION ALL
  SELECT 2, 'Holandia', 'Szwecja', '2026-06-20 17:00:00' UNION ALL
  SELECT 2, 'Niemcy', 'Wybrzeże Kości Słoniowej', '2026-06-20 20:00:00' UNION ALL
  SELECT 2, 'Ekwador', 'Curaçao', '2026-06-21 00:00:00' UNION ALL
  SELECT 2, 'Tunezja', 'Japonia', '2026-06-21 04:00:00' UNION ALL
  SELECT 2, 'Hiszpania', 'Arabia Saudyjska', '2026-06-21 16:00:00' UNION ALL
  SELECT 2, 'Belgia', 'Iran', '2026-06-21 19:00:00' UNION ALL
  SELECT 2, 'Urugwaj', 'Wyspy Zielonego Przylądka', '2026-06-21 22:00:00' UNION ALL
  SELECT 2, 'Nowa Zelandia', 'Egipt', '2026-06-22 01:00:00' UNION ALL
  SELECT 2, 'Argentyna', 'Austria', '2026-06-22 17:00:00' UNION ALL
  SELECT 2, 'Francja', 'Irak', '2026-06-22 21:00:00' UNION ALL
  SELECT 2, 'Norwegia', 'Senegal', '2026-06-23 00:00:00' UNION ALL
  SELECT 2, 'Jordania', 'Algieria', '2026-06-23 03:00:00' UNION ALL
  SELECT 2, 'Portugalia', 'Uzbekistan', '2026-06-23 17:00:00' UNION ALL
  SELECT 2, 'Anglia', 'Ghana', '2026-06-23 20:00:00' UNION ALL
  SELECT 2, 'Panama', 'Chorwacja', '2026-06-23 23:00:00' UNION ALL
  SELECT 2, 'Kolumbia', 'DR Kongo', '2026-06-24 02:00:00' UNION ALL
  SELECT 3, 'Szwajcaria', 'Kanada', '2026-06-24 19:00:00' UNION ALL
  SELECT 3, 'Bośnia i Hercegowina', 'Katar', '2026-06-24 19:00:00' UNION ALL
  SELECT 3, 'Szkocja', 'Brazylia', '2026-06-24 22:00:00' UNION ALL
  SELECT 3, 'Maroko', 'Haiti', '2026-06-24 22:00:00' UNION ALL
  SELECT 3, 'Czechy', 'Meksyk', '2026-06-25 01:00:00' UNION ALL
  SELECT 3, 'RPA', 'Korea Południowa', '2026-06-25 01:00:00' UNION ALL
  SELECT 3, 'Ekwador', 'Niemcy', '2026-06-25 20:00:00' UNION ALL
  SELECT 3, 'Curaçao', 'Wybrzeże Kości Słoniowej', '2026-06-25 20:00:00' UNION ALL
  SELECT 3, 'Japonia', 'Szwecja', '2026-06-25 23:00:00' UNION ALL
  SELECT 3, 'Tunezja', 'Holandia', '2026-06-25 23:00:00' UNION ALL
  SELECT 3, 'Turcja', 'Stany Zjednoczone', '2026-06-26 02:00:00' UNION ALL
  SELECT 3, 'Paragwaj', 'Australia', '2026-06-26 02:00:00' UNION ALL
  SELECT 3, 'Norwegia', 'Francja', '2026-06-26 19:00:00' UNION ALL
  SELECT 3, 'Senegal', 'Irak', '2026-06-26 19:00:00' UNION ALL
  SELECT 3, 'Wyspy Zielonego Przylądka', 'Arabia Saudyjska', '2026-06-27 00:00:00' UNION ALL
  SELECT 3, 'Urugwaj', 'Hiszpania', '2026-06-27 00:00:00' UNION ALL
  SELECT 3, 'Egipt', 'Iran', '2026-06-27 03:00:00' UNION ALL
  SELECT 3, 'Nowa Zelandia', 'Belgia', '2026-06-27 03:00:00' UNION ALL
  SELECT 3, 'Panama', 'Anglia', '2026-06-27 21:00:00' UNION ALL
  SELECT 3, 'Chorwacja', 'Ghana', '2026-06-27 21:00:00' UNION ALL
  SELECT 3, 'Kolumbia', 'Portugalia', '2026-06-27 23:30:00' UNION ALL
  SELECT 3, 'DR Kongo', 'Uzbekistan', '2026-06-27 23:30:00' UNION ALL
  SELECT 3, 'Algieria', 'Austria', '2026-06-28 02:00:00' UNION ALL
  SELECT 3, 'Jordania', 'Argentyna', '2026-06-28 02:00:00'
) m
JOIN teams ht  ON ht.name  = m.home
JOIN teams at_ ON at_.name = m.away
JOIN rounds r  ON r.order_nr = m.rnd;

-- Mecze pucharowe (bez drużyn — admin przypisze po fazie grupowej)
INSERT INTO matches (round_id, starts_at) VALUES
((SELECT id FROM rounds WHERE order_nr=4), '2026-07-01 18:00:00'),
((SELECT id FROM rounds WHERE order_nr=4), '2026-07-01 21:00:00'),
((SELECT id FROM rounds WHERE order_nr=4), '2026-07-02 18:00:00'),
((SELECT id FROM rounds WHERE order_nr=4), '2026-07-02 21:00:00'),
((SELECT id FROM rounds WHERE order_nr=4), '2026-07-03 18:00:00'),
((SELECT id FROM rounds WHERE order_nr=4), '2026-07-03 21:00:00'),
((SELECT id FROM rounds WHERE order_nr=4), '2026-07-04 18:00:00'),
((SELECT id FROM rounds WHERE order_nr=4), '2026-07-04 21:00:00'),
((SELECT id FROM rounds WHERE order_nr=4), '2026-07-05 18:00:00'),
((SELECT id FROM rounds WHERE order_nr=4), '2026-07-05 21:00:00'),
((SELECT id FROM rounds WHERE order_nr=4), '2026-07-06 18:00:00'),
((SELECT id FROM rounds WHERE order_nr=4), '2026-07-06 21:00:00'),
((SELECT id FROM rounds WHERE order_nr=4), '2026-07-07 18:00:00'),
((SELECT id FROM rounds WHERE order_nr=4), '2026-07-07 21:00:00'),
((SELECT id FROM rounds WHERE order_nr=4), '2026-07-08 18:00:00'),
((SELECT id FROM rounds WHERE order_nr=4), '2026-07-08 21:00:00'),
((SELECT id FROM rounds WHERE order_nr=5), '2026-07-09 18:00:00'),
((SELECT id FROM rounds WHERE order_nr=5), '2026-07-09 21:00:00'),
((SELECT id FROM rounds WHERE order_nr=5), '2026-07-10 18:00:00'),
((SELECT id FROM rounds WHERE order_nr=5), '2026-07-10 21:00:00'),
((SELECT id FROM rounds WHERE order_nr=5), '2026-07-11 18:00:00'),
((SELECT id FROM rounds WHERE order_nr=5), '2026-07-11 21:00:00'),
((SELECT id FROM rounds WHERE order_nr=5), '2026-07-12 18:00:00'),
((SELECT id FROM rounds WHERE order_nr=5), '2026-07-12 21:00:00'),
((SELECT id FROM rounds WHERE order_nr=6), '2026-07-14 18:00:00'),
((SELECT id FROM rounds WHERE order_nr=6), '2026-07-14 21:00:00'),
((SELECT id FROM rounds WHERE order_nr=6), '2026-07-15 18:00:00'),
((SELECT id FROM rounds WHERE order_nr=6), '2026-07-15 21:00:00'),
((SELECT id FROM rounds WHERE order_nr=7), '2026-07-18 21:00:00'),
((SELECT id FROM rounds WHERE order_nr=7), '2026-07-19 21:00:00'),
((SELECT id FROM rounds WHERE order_nr=8), '2026-07-23 21:00:00');
