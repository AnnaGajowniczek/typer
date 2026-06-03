-- Użytkownicy
CREATE TABLE users (
    id            SERIAL PRIMARY KEY,
    email         VARCHAR(255) UNIQUE NOT NULL,
    display_name  VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255),
    points_total  INTEGER NOT NULL DEFAULT 0,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Grupy (A-L, MŚ 2026 ma 12 grup)
CREATE TABLE groups (
    id   SERIAL PRIMARY KEY,
    name CHAR(1) UNIQUE NOT NULL   -- 'A', 'B', ... 'L'
);

-- Drużyny
CREATE TABLE teams (
    id       SERIAL PRIMARY KEY,
    name     VARCHAR(100) UNIQUE NOT NULL,
    group_id INTEGER REFERENCES groups(id),
    logo_url VARCHAR(255)
);

-- Rundy
CREATE TABLE rounds (
    id       SERIAL PRIMARY KEY,
    name     VARCHAR(50) UNIQUE NOT NULL,
    stage    VARCHAR(20) NOT NULL
             CHECK (stage IN ('group', 'knockout')),
    order_nr SMALLINT NOT NULL
);

-- Mecze
CREATE TABLE matches (
    id           SERIAL PRIMARY KEY,
    round_id     INTEGER NOT NULL REFERENCES rounds(id),
    home_team_id INTEGER REFERENCES teams(id),
    away_team_id INTEGER REFERENCES teams(id),
    starts_at    TIMESTAMPTZ NOT NULL,
    home_score   SMALLINT,
    away_score   SMALLINT,
    status       VARCHAR(20) NOT NULL DEFAULT 'upcoming'
                 CHECK (status IN ('upcoming', 'live', 'finished', 'cancelled'))
);

-- Typy
CREATE TABLE predictions (
    id            SERIAL PRIMARY KEY,
    user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    match_id      INTEGER NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    home_score    SMALLINT NOT NULL,
    away_score    SMALLINT NOT NULL,
    points_earned SMALLINT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, match_id)
);

-- Indeksy
CREATE INDEX ON matches(round_id);
CREATE INDEX ON matches(starts_at);
CREATE INDEX ON matches(status);
CREATE INDEX ON predictions(user_id);
CREATE INDEX ON predictions(match_id);

-- Dane początkowe: rundy
INSERT INTO rounds (name, stage, order_nr) VALUES
  ('Faza grupowa - kolejka 1', 'group',   1),
  ('Faza grupowa - kolejka 2', 'group',   2),
  ('Faza grupowa - kolejka 3', 'group',   3),
  ('1/32 finalu',              'knockout', 4),
  ('1/16 finalu',              'knockout', 5),
  ('Cwiercfinaly',             'knockout', 6),
  ('Polfinaly',                'knockout', 7),
  ('Final',                    'knockout', 8);

-- Dane początkowe: grupy
INSERT INTO groups (name) VALUES
  ('A'), ('B'), ('C'), ('D'), ('E'), ('F'),
  ('G'), ('H'), ('I'), ('J'), ('K'), ('L');
