-- Bolão Copa 2026 — Initial Schema
-- Applies to Supabase (PostgreSQL)

-- ─── ENUMS ─────────────────────────────────────────────────────────────────

create type phase as enum (
  'group_stage',
  'round_of_32',
  'round_of_16',
  'quarterfinals',
  'semifinals',
  'third_place',
  'final'
);

-- ─── USERS ─────────────────────────────────────────────────────────────────
-- Extends Supabase auth.users. One row per Participante or Admin.

create table public.users (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text not null,
  is_admin    boolean not null default false,
  created_at  timestamptz not null default now()
);

alter table public.users enable row level security;

-- Users can read their own record; admins can read all
create policy "users: own row" on public.users
  for select using (auth.uid() = id);

create policy "users: admin read all" on public.users
  for select using (
    exists (select 1 from public.users where id = auth.uid() and is_admin = true)
  );

-- ─── TEAMS ─────────────────────────────────────────────────────────────────
-- 48 national teams. fifa_ranking_reference is fixed at the draw date — never updated.

create table public.teams (
  id                     uuid primary key default gen_random_uuid(),
  name                   text not null,
  country_code           char(3) not null,  -- ISO 3166-1 alpha-3
  "group"                char(1) not null check ("group" in ('A','B','C','D','E','F','G','H','I','J','K','L')),
  fifa_ranking_reference integer not null,  -- immutable snapshot from draw date
  created_at             timestamptz not null default now()
);

alter table public.teams enable row level security;

create policy "teams: public read" on public.teams
  for select using (true);

create policy "teams: admin write" on public.teams
  for all using (
    exists (select 1 from public.users where id = auth.uid() and is_admin = true)
  );

-- ─── MATCHES ───────────────────────────────────────────────────────────────

create table public.matches (
  id               uuid primary key default gen_random_uuid(),
  phase            phase not null,
  "group"          char(1) check ("group" in ('A','B','C','D','E','F','G','H','I','J','K','L')),  -- null for knockout
  home_team_id     uuid references public.teams(id),
  away_team_id     uuid references public.teams(id),
  scheduled_at     timestamptz not null,
  stadium          text,
  home_score       integer,  -- null until result entered
  away_score       integer,  -- null until result entered
  is_finished      boolean not null default false,
  went_to_extra_time boolean not null default false,
  created_at       timestamptz not null default now()
);

alter table public.matches enable row level security;

create policy "matches: public read" on public.matches
  for select using (true);

create policy "matches: admin write" on public.matches
  for all using (
    exists (select 1 from public.users where id = auth.uid() and is_admin = true)
  );

-- ─── PHASE DEADLINES ───────────────────────────────────────────────────────

create table public.phase_deadlines (
  id          uuid primary key default gen_random_uuid(),
  phase       phase not null unique,
  deadline_at timestamptz not null
);

alter table public.phase_deadlines enable row level security;

create policy "phase_deadlines: public read" on public.phase_deadlines
  for select using (true);

create policy "phase_deadlines: admin write" on public.phase_deadlines
  for all using (
    exists (select 1 from public.users where id = auth.uid() and is_admin = true)
  );

-- ─── PARTICIPANT EXCEPTIONS (Exceção de Prazo) ─────────────────────────────

create table public.participant_exceptions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.users(id) on delete cascade,
  phase        phase not null,
  unlocked_until timestamptz not null,
  created_at   timestamptz not null default now(),
  unique (user_id, phase)
);

alter table public.participant_exceptions enable row level security;

create policy "participant_exceptions: admin all" on public.participant_exceptions
  for all using (
    exists (select 1 from public.users where id = auth.uid() and is_admin = true)
  );

create policy "participant_exceptions: own read" on public.participant_exceptions
  for select using (auth.uid() = user_id);

-- ─── PALPITES DE JOGO ──────────────────────────────────────────────────────
-- Score predictions per match per Participante.
-- home_score/away_score are null when not filled — never defaulted to 0.

create table public.palpites_jogos (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  match_id    uuid not null references public.matches(id) on delete cascade,
  home_score  integer,
  away_score  integer,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, match_id)
);

alter table public.palpites_jogos enable row level security;

-- Participante can write own palpites only before the phase deadline (or within exception window)
create policy "palpites_jogos: own write" on public.palpites_jogos
  for insert with check (
    auth.uid() = user_id
    and (
      -- Within global deadline
      exists (
        select 1 from public.phase_deadlines pd
        join public.matches m on m.id = match_id
        where pd.phase = m.phase and pd.deadline_at > now()
      )
      or
      -- Within personal exception window
      exists (
        select 1 from public.participant_exceptions pe
        join public.matches m on m.id = match_id
        where pe.user_id = auth.uid() and pe.phase = m.phase and pe.unlocked_until > now()
      )
    )
  );

create policy "palpites_jogos: own update" on public.palpites_jogos
  for update using (
    auth.uid() = user_id
    and (
      exists (
        select 1 from public.phase_deadlines pd
        join public.matches m on m.id = match_id
        where pd.phase = m.phase and pd.deadline_at > now()
      )
      or
      exists (
        select 1 from public.participant_exceptions pe
        join public.matches m on m.id = match_id
        where pe.user_id = auth.uid() and pe.phase = m.phase and pe.unlocked_until > now()
      )
    )
  );

-- Read own palpites always; read others' only after first match of phase started
create policy "palpites_jogos: own read" on public.palpites_jogos
  for select using (auth.uid() = user_id);

create policy "palpites_jogos: others read after phase starts" on public.palpites_jogos
  for select using (
    auth.uid() != user_id
    and exists (
      select 1 from public.matches first_match
      join public.matches this_match on this_match.id = match_id
      where first_match.phase = this_match.phase
        and first_match.scheduled_at <= now()
      limit 1
    )
  );

create policy "palpites_jogos: admin read all" on public.palpites_jogos
  for select using (
    exists (select 1 from public.users where id = auth.uid() and is_admin = true)
  );

-- ─── PALPITES FINAIS ───────────────────────────────────────────────────────
-- Long-term predictions: champion, runner-up, 3rd, 4th, top scorer, best player.
-- Locked at group_stage deadline.

create table public.palpites_finais (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.users(id) on delete cascade unique,
  champion_team_id  uuid references public.teams(id),
  runner_up_team_id uuid references public.teams(id),
  third_team_id     uuid references public.teams(id),
  fourth_team_id    uuid references public.teams(id),
  top_scorer        text,  -- free text, confirmed by FIFA
  best_player       text,  -- free text, confirmed by FIFA
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

alter table public.palpites_finais enable row level security;

create policy "palpites_finais: own write" on public.palpites_finais
  for all using (
    auth.uid() = user_id
    and exists (
      select 1 from public.phase_deadlines
      where phase = 'group_stage' and deadline_at > now()
    )
  );

create policy "palpites_finais: own read" on public.palpites_finais
  for select using (auth.uid() = user_id);

create policy "palpites_finais: others read after phase starts" on public.palpites_finais
  for select using (
    auth.uid() != user_id
    and exists (
      select 1 from public.matches
      where phase = 'group_stage' and scheduled_at <= now()
      limit 1
    )
  );

create policy "palpites_finais: admin read all" on public.palpites_finais
  for select using (
    exists (select 1 from public.users where id = auth.uid() and is_admin = true)
  );

-- ─── BRACKET OVERRIDES ─────────────────────────────────────────────────────
-- Admin can adjust the real 16-avos bracket after group stage (ADR-0003).

create table public.bracket_overrides (
  id           uuid primary key default gen_random_uuid(),
  phase        phase not null,
  match_slot   integer not null,  -- slot index within the phase
  home_team_id uuid references public.teams(id),
  away_team_id uuid references public.teams(id),
  created_at   timestamptz not null default now(),
  unique (phase, match_slot)
);

alter table public.bracket_overrides enable row level security;

create policy "bracket_overrides: public read" on public.bracket_overrides
  for select using (true);

create policy "bracket_overrides: admin write" on public.bracket_overrides
  for all using (
    exists (select 1 from public.users where id = auth.uid() and is_admin = true)
  );

-- ─── CLASSIFIER OVERRIDES ──────────────────────────────────────────────────
-- Admin can reorder third-place qualifiers when auto-tiebreaker is ambiguous (ADR-0002).

create table public.classifier_overrides (
  id               uuid primary key default gen_random_uuid(),
  phase            phase not null unique,
  ordered_team_ids uuid[] not null,  -- ordered array of team IDs
  created_at       timestamptz not null default now()
);

alter table public.classifier_overrides enable row level security;

create policy "classifier_overrides: public read" on public.classifier_overrides
  for select using (true);

create policy "classifier_overrides: admin write" on public.classifier_overrides
  for all using (
    exists (select 1 from public.users where id = auth.uid() and is_admin = true)
  );
