-- ============================================================
-- Helper: check if the calling user is admin or editor
-- ============================================================
CREATE OR REPLACE FUNCTION is_admin_or_editor()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND role IN ('admin', 'editor')
      AND is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND role = 'admin'
      AND is_active = true
  );
$$;

-- ============================================================
-- GROUPS — public read, admin/editor write
-- ============================================================
CREATE POLICY "groups_select_public"
  ON groups FOR SELECT USING (true);

CREATE POLICY "groups_write_admin_editor"
  ON groups FOR ALL
  USING (is_admin_or_editor())
  WITH CHECK (is_admin_or_editor());

-- ============================================================
-- TEAMS — public read, admin/editor write
-- ============================================================
CREATE POLICY "teams_select_public"
  ON teams FOR SELECT USING (true);

CREATE POLICY "teams_write_admin_editor"
  ON teams FOR ALL
  USING (is_admin_or_editor())
  WITH CHECK (is_admin_or_editor());

-- ============================================================
-- PLAYERS — public read, admin/editor write
-- ============================================================
CREATE POLICY "players_select_public"
  ON players FOR SELECT USING (true);

CREATE POLICY "players_write_admin_editor"
  ON players FOR ALL
  USING (is_admin_or_editor())
  WITH CHECK (is_admin_or_editor());

-- ============================================================
-- PROFILES
-- Public read (leaderboard needs all profiles).
-- Each user updates only their own row; admins update any.
-- INSERT is handled by the handle_new_user trigger (SECURITY DEFINER),
-- so no INSERT policy is needed for regular users.
-- ============================================================
CREATE POLICY "profiles_select_public"
  ON profiles FOR SELECT USING (true);

CREATE POLICY "profiles_update_own_or_admin"
  ON profiles FOR UPDATE
  USING (auth.uid() = id OR is_admin())
  WITH CHECK (auth.uid() = id OR is_admin());

-- Admin can insert profiles manually (e.g. bulk import)
CREATE POLICY "profiles_insert_admin"
  ON profiles FOR INSERT
  WITH CHECK (is_admin());

-- Admin can delete / deactivate profiles
CREATE POLICY "profiles_delete_admin"
  ON profiles FOR DELETE
  USING (is_admin());

-- ============================================================
-- MATCHES — public read, admin/editor write
-- ============================================================
CREATE POLICY "matches_select_public"
  ON matches FOR SELECT USING (true);

CREATE POLICY "matches_write_admin_editor"
  ON matches FOR ALL
  USING (is_admin_or_editor())
  WITH CHECK (is_admin_or_editor());

-- ============================================================
-- SCORING CONFIG — public read, admin write
-- ============================================================
CREATE POLICY "scoring_config_select_public"
  ON scoring_config FOR SELECT USING (true);

CREATE POLICY "scoring_config_write_admin"
  ON scoring_config FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================================
-- PHASE SCHEDULE — public read, admin write
-- ============================================================
CREATE POLICY "phase_schedule_select_public"
  ON phase_schedule FOR SELECT USING (true);

CREATE POLICY "phase_schedule_write_admin"
  ON phase_schedule FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================================
-- MATCH PREDICTIONS
-- SELECT: own rows only (admins see all via service role).
-- INSERT/UPDATE: only when:
--   1. user_id = auth.uid()
--   2. the match's phase is 'open'
--   3. match.status = 'scheduled'
-- DELETE: disallowed for everyone (predictions are immutable).
-- ============================================================
CREATE POLICY "match_predictions_select_own"
  ON match_predictions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "match_predictions_upsert_when_phase_open"
  ON match_predictions
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM matches m
      JOIN phase_schedule ps
        ON ps.phase_key = CASE m.stage
          WHEN 'group'      THEN 'group'
          WHEN 'round_of_32' THEN 'round_of_32'
          WHEN 'round_of_16' THEN 'round_of_16'
          WHEN 'quarter'    THEN 'quarter'
          WHEN 'semi'       THEN 'semi'
          ELSE 'third_final'
        END
      WHERE m.id = match_predictions.match_id
        AND ps.status = 'open'
        AND m.status = 'scheduled'
    )
  );

CREATE POLICY "match_predictions_update_when_phase_open"
  ON match_predictions
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM matches m
      JOIN phase_schedule ps
        ON ps.phase_key = CASE m.stage
          WHEN 'group'      THEN 'group'
          WHEN 'round_of_32' THEN 'round_of_32'
          WHEN 'round_of_16' THEN 'round_of_16'
          WHEN 'quarter'    THEN 'quarter'
          WHEN 'semi'       THEN 'semi'
          ELSE 'third_final'
        END
      WHERE m.id = match_predictions.match_id
        AND ps.status = 'open'
        AND m.status = 'scheduled'
    )
  );

-- ============================================================
-- GROUP PREDICTIONS — gated to group phase being open
-- ============================================================
CREATE POLICY "group_predictions_select_own"
  ON group_predictions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "group_predictions_insert_when_open"
  ON group_predictions FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM phase_schedule
      WHERE phase_key = 'group' AND status = 'open'
    )
  );

CREATE POLICY "group_predictions_update_when_open"
  ON group_predictions FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM phase_schedule
      WHERE phase_key = 'group' AND status = 'open'
    )
  );

-- ============================================================
-- TOURNAMENT PREDICTIONS — same gate as group phase
-- ============================================================
CREATE POLICY "tournament_predictions_select_own"
  ON tournament_predictions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "tournament_predictions_insert_when_open"
  ON tournament_predictions FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM phase_schedule
      WHERE phase_key = 'group' AND status = 'open'
    )
  );

CREATE POLICY "tournament_predictions_update_when_open"
  ON tournament_predictions FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM phase_schedule
      WHERE phase_key = 'group' AND status = 'open'
    )
  );

-- ============================================================
-- AUDIT LOGS — admin read/write only
-- (cron jobs use service role key which bypasses RLS)
-- ============================================================
CREATE POLICY "audit_logs_admin_only"
  ON audit_logs FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================================
-- GRANT access to anon and authenticated roles
-- (required for Supabase Data API / PostgREST)
-- ============================================================
GRANT SELECT ON groups, teams, players, matches, profiles, scoring_config, phase_schedule
  TO anon, authenticated;

GRANT SELECT, INSERT, UPDATE ON match_predictions, group_predictions, tournament_predictions
  TO authenticated;

GRANT SELECT ON audit_logs TO authenticated;
