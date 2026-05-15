-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- GROUPS
-- ============================================================
CREATE TABLE groups (
  id   uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name char(1) NOT NULL UNIQUE, -- 'A'..'L'
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- TEAMS
-- ============================================================
CREATE TABLE teams (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       text NOT NULL,
  code       char(3) NOT NULL UNIQUE, -- 'BRA', 'ARG', etc.
  flag_url   text,
  group_id   uuid REFERENCES groups(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PLAYERS
-- ============================================================
CREATE TABLE players (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         text NOT NULL,
  team_id      uuid REFERENCES teams(id) ON DELETE CASCADE,
  photo_url    text,
  goals        int NOT NULL DEFAULT 0,
  assists      int NOT NULL DEFAULT 0,
  yellow_cards int NOT NULL DEFAULT 0,
  red_cards    int NOT NULL DEFAULT 0,
  updated_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE players ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PROFILES (mirrors auth.users with extra data)
-- ============================================================
CREATE TABLE profiles (
  id                 uuid PRIMARY KEY, -- same as auth.users.id
  name               text,
  email              text UNIQUE,
  avatar_url         text,
  role               text NOT NULL DEFAULT 'player'
                       CHECK (role IN ('admin', 'editor', 'player')),
  is_active          bool NOT NULL DEFAULT true,
  total_points       int NOT NULL DEFAULT 0,
  position_yesterday int,
  created_at         timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles REPLICA IDENTITY FULL;

-- ============================================================
-- MATCHES
-- ============================================================
CREATE TABLE matches (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  home_team_id  uuid REFERENCES teams(id) ON DELETE RESTRICT,
  away_team_id  uuid REFERENCES teams(id) ON DELETE RESTRICT,
  scheduled_at  timestamptz NOT NULL,
  venue         text,
  city          text,
  stage         text NOT NULL
                  CHECK (stage IN ('group','round_of_32','round_of_16','quarter','semi','third_place','final')),
  group_id      uuid REFERENCES groups(id) ON DELETE SET NULL,
  home_score    int,
  away_score    int,
  status        text NOT NULL DEFAULT 'scheduled'
                  CHECK (status IN ('scheduled','live','finished')),
  external_id   text UNIQUE,
  created_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT no_self_match CHECK (home_team_id <> away_team_id OR home_team_id IS NULL)
);

ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches REPLICA IDENTITY FULL;

CREATE INDEX idx_matches_scheduled_at ON matches(scheduled_at);
CREATE INDEX idx_matches_status       ON matches(status);
CREATE INDEX idx_matches_stage        ON matches(stage);
CREATE INDEX idx_matches_group_id     ON matches(group_id);

-- ============================================================
-- SCORING CONFIG
-- ============================================================
CREATE TABLE scoring_config (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  rule_key   text NOT NULL UNIQUE,
  label      text NOT NULL,
  points     int NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE scoring_config ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PHASE SCHEDULE
-- ============================================================
CREATE TABLE phase_schedule (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  phase_key        text NOT NULL UNIQUE
                     CHECK (phase_key IN ('group','round_of_32','round_of_16','quarter','semi','third_final')),
  label            text NOT NULL,
  order_index      int NOT NULL,
  open_at          timestamptz,
  close_at         timestamptz,
  status           text NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending','open','closed')),
  override_by      uuid REFERENCES profiles(id) DEFERRABLE INITIALLY DEFERRED,
  override_at      timestamptz,
  override_reason  text,
  updated_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE phase_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE phase_schedule REPLICA IDENTITY FULL;

-- ============================================================
-- MATCH PREDICTIONS
-- ============================================================
CREATE TABLE match_predictions (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  match_id        uuid NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  home_score      int NOT NULL CHECK (home_score >= 0),
  away_score      int NOT NULL CHECK (away_score >= 0),
  points_awarded  int,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, match_id)
);

ALTER TABLE match_predictions ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_match_predictions_match_id ON match_predictions(match_id);
CREATE INDEX idx_match_predictions_user_id  ON match_predictions(user_id);

-- ============================================================
-- GROUP PREDICTIONS
-- ============================================================
CREATE TABLE group_predictions (
  id                    uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  group_id              uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  first_place_team_id   uuid REFERENCES teams(id) ON DELETE SET NULL,
  second_place_team_id  uuid REFERENCES teams(id) ON DELETE SET NULL,
  points_awarded        int,
  created_at            timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, group_id)
);

ALTER TABLE group_predictions ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_group_predictions_user_id ON group_predictions(user_id);

-- ============================================================
-- TOURNAMENT PREDICTIONS
-- ============================================================
CREATE TABLE tournament_predictions (
  id                    uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  champion_team_id      uuid REFERENCES teams(id) ON DELETE SET NULL,
  runner_up_team_id     uuid REFERENCES teams(id) ON DELETE SET NULL,
  third_place_team_id   uuid REFERENCES teams(id) ON DELETE SET NULL,
  top_scorer_player_id  uuid REFERENCES players(id) ON DELETE SET NULL,
  points_awarded        int,
  created_at            timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

ALTER TABLE tournament_predictions ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- AUDIT LOGS
-- ============================================================
CREATE TABLE audit_logs (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id    uuid REFERENCES profiles(id) ON DELETE SET NULL,
  action      text NOT NULL,
  entity_type text,
  entity_id   uuid,
  old_value   jsonb,
  new_value   jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_actor_id   ON audit_logs(actor_id);

-- ============================================================
-- LEADERBOARD INDEX
-- ============================================================
CREATE INDEX idx_profiles_total_points ON profiles(total_points DESC);

-- ============================================================
-- TRIGGER: auto-create profile on auth.users insert
-- role is read from raw_app_meta_data (not raw_user_meta_data — user-editable)
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id, email, name, avatar_url, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.raw_app_meta_data->>'role', 'player')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- TRIGGER: maintain profiles.total_points
-- Fires on INSERT OR UPDATE OF points_awarded on each prediction table
-- ============================================================
CREATE OR REPLACE FUNCTION update_profile_total_points()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  v_user_id := COALESCE(NEW.user_id, OLD.user_id);

  UPDATE profiles
  SET total_points = (
    SELECT COALESCE(SUM(points_awarded), 0)
    FROM match_predictions
    WHERE user_id = v_user_id
  ) + (
    SELECT COALESCE(SUM(points_awarded), 0)
    FROM group_predictions
    WHERE user_id = v_user_id
  ) + (
    SELECT COALESCE(points_awarded, 0)
    FROM tournament_predictions
    WHERE user_id = v_user_id
  )
  WHERE id = v_user_id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_match_predictions_points
  AFTER INSERT OR UPDATE OF points_awarded ON match_predictions
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_total_points();

CREATE TRIGGER trg_group_predictions_points
  AFTER INSERT OR UPDATE OF points_awarded ON group_predictions
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_total_points();

CREATE TRIGGER trg_tournament_predictions_points
  AFTER INSERT OR UPDATE OF points_awarded ON tournament_predictions
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_total_points();

-- ============================================================
-- TRIGGER: updated_at maintenance
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_phase_schedule_updated_at
  BEFORE UPDATE ON phase_schedule
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_scoring_config_updated_at
  BEFORE UPDATE ON scoring_config
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();
