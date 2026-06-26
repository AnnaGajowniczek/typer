-- Migracja: poprawka dat meczów pucharowych wg oficjalnego harmonogramu FIFA MŚ 2026
-- Uruchom: mysql -h HOST -u USER -pPASS typer < fix-playoff-dates.sql

-- 1/16 finału: przypisz dokładne godziny UTC wg rankingu (starts_at ASC)
UPDATE matches m
JOIN (
  SELECT id, ROW_NUMBER() OVER (ORDER BY starts_at, id) AS rn
  FROM matches
  WHERE round_id = (SELECT id FROM rounds WHERE order_nr = 4)
) ranked ON m.id = ranked.id
SET m.starts_at = CASE ranked.rn
  WHEN 1  THEN '2026-06-28 19:00:00'
  WHEN 2  THEN '2026-06-29 17:00:00'
  WHEN 3  THEN '2026-06-29 20:30:00'
  WHEN 4  THEN '2026-06-30 01:00:00'
  WHEN 5  THEN '2026-06-30 17:00:00'
  WHEN 6  THEN '2026-06-30 21:00:00'
  WHEN 7  THEN '2026-07-01 01:00:00'
  WHEN 8  THEN '2026-07-01 16:00:00'
  WHEN 9  THEN '2026-07-01 20:00:00'
  WHEN 10 THEN '2026-07-02 00:00:00'
  WHEN 11 THEN '2026-07-02 19:00:00'
  WHEN 12 THEN '2026-07-02 23:00:00'
  WHEN 13 THEN '2026-07-03 03:00:00'
  WHEN 14 THEN '2026-07-03 18:00:00'
  WHEN 15 THEN '2026-07-03 22:00:00'
  WHEN 16 THEN '2026-07-04 01:30:00'
END
WHERE m.round_id = (SELECT id FROM rounds WHERE order_nr = 4);

-- 1/8 finału: 4–7 lip
UPDATE matches m
JOIN (
  SELECT id, ROW_NUMBER() OVER (ORDER BY starts_at, id) AS rn
  FROM matches
  WHERE round_id = (SELECT id FROM rounds WHERE order_nr = 5)
) ranked ON m.id = ranked.id
SET m.starts_at = CASE ranked.rn
  WHEN 1 THEN '2026-07-04 17:00:00'
  WHEN 2 THEN '2026-07-04 21:00:00'
  WHEN 3 THEN '2026-07-05 20:00:00'
  WHEN 4 THEN '2026-07-06 00:00:00'
  WHEN 5 THEN '2026-07-06 19:00:00'
  WHEN 6 THEN '2026-07-07 00:00:00'
  WHEN 7 THEN '2026-07-07 16:00:00'
  WHEN 8 THEN '2026-07-07 20:00:00'
END
WHERE m.round_id = (SELECT id FROM rounds WHERE order_nr = 5);

-- Ćwierćfinały: 9–12 lip
UPDATE matches m
JOIN (
  SELECT id, ROW_NUMBER() OVER (ORDER BY starts_at, id) AS rn
  FROM matches
  WHERE round_id = (SELECT id FROM rounds WHERE order_nr = 6)
) ranked ON m.id = ranked.id
SET m.starts_at = CASE ranked.rn
  WHEN 1 THEN '2026-07-09 20:00:00'
  WHEN 2 THEN '2026-07-10 19:00:00'
  WHEN 3 THEN '2026-07-11 21:00:00'
  WHEN 4 THEN '2026-07-12 01:00:00'
END
WHERE m.round_id = (SELECT id FROM rounds WHERE order_nr = 6);

-- Półfinały: 14–15 lip
UPDATE matches m
JOIN (
  SELECT id, ROW_NUMBER() OVER (ORDER BY starts_at, id) AS rn
  FROM matches
  WHERE round_id = (SELECT id FROM rounds WHERE order_nr = 7)
) ranked ON m.id = ranked.id
SET m.starts_at = CASE ranked.rn
  WHEN 1 THEN '2026-07-14 19:00:00'
  WHEN 2 THEN '2026-07-15 19:00:00'
END
WHERE m.round_id = (SELECT id FROM rounds WHERE order_nr = 7);

-- Finał: 19 lip
UPDATE matches
SET starts_at = '2026-07-19 19:00:00'
WHERE round_id = (SELECT id FROM rounds WHERE order_nr = 8);
