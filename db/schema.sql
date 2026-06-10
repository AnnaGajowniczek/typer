-- schema.sql dla MySQL 8+

CREATE TABLE IF NOT EXISTS users (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    email         VARCHAR(255) UNIQUE NOT NULL,
    display_name  VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255),
    points_total  INT NOT NULL DEFAULT 0,
    is_admin      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at    DATETIME NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS `groups` (
    id   INT AUTO_INCREMENT PRIMARY KEY,
    name CHAR(1) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS teams (
    id       INT AUTO_INCREMENT PRIMARY KEY,
    name     VARCHAR(100) UNIQUE NOT NULL,
    group_id INT,
    logo_url VARCHAR(255),
    FOREIGN KEY (group_id) REFERENCES `groups`(id)
);

CREATE TABLE IF NOT EXISTS rounds (
    id       INT AUTO_INCREMENT PRIMARY KEY,
    name     VARCHAR(50) UNIQUE NOT NULL,
    stage    VARCHAR(20) NOT NULL,
    order_nr SMALLINT NOT NULL,
    CHECK (stage IN ('group', 'knockout'))
);

CREATE TABLE IF NOT EXISTS matches (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    round_id     INT NOT NULL,
    home_team_id INT,
    away_team_id INT,
    starts_at    DATETIME NOT NULL,
    home_score   SMALLINT,
    away_score   SMALLINT,
    status       VARCHAR(20) NOT NULL DEFAULT 'upcoming',
    FOREIGN KEY (round_id) REFERENCES rounds(id),
    FOREIGN KEY (home_team_id) REFERENCES teams(id),
    FOREIGN KEY (away_team_id) REFERENCES teams(id),
    CHECK (status IN ('upcoming', 'live', 'finished', 'cancelled'))
);

CREATE TABLE IF NOT EXISTS predictions (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    user_id       INT NOT NULL,
    match_id      INT NOT NULL,
    home_score    SMALLINT NOT NULL,
    away_score    SMALLINT NOT NULL,
    points_earned SMALLINT,
    created_at    DATETIME NOT NULL DEFAULT NOW(),
    UNIQUE KEY unique_prediction (user_id, match_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS app_settings (
    id                INT PRIMARY KEY DEFAULT 1,
    registration_open BOOLEAN NOT NULL DEFAULT TRUE,
    CHECK (id = 1)
);
INSERT IGNORE INTO app_settings (id, registration_open) VALUES (1, TRUE);

CREATE INDEX idx_matches_round_id ON matches(round_id);
CREATE INDEX idx_matches_starts_at ON matches(starts_at);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_predictions_user_id ON predictions(user_id);
CREATE INDEX idx_predictions_match_id ON predictions(match_id);
