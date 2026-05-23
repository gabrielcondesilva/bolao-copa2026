@AGENTS.md

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is

A web application for managing a FIFA World Cup 2026 prediction pool (~50 participants). Participants submit match score predictions; the system automatically derives who they predicted to advance through each phase and calculates scores on-the-fly. See `doc_especificacao/especificacao.md` for the full spec.

**Stack:** Next.js 16 (App Router, TypeScript) + Tailwind CSS v4 → Supabase (PostgreSQL + Auth + Realtime) → Vercel

## Commands

```bash
npm run dev        # local dev server (http://localhost:3000)
npm run build      # production build
npm run lint       # ESLint
npm test           # Vitest test suite
npm test -- src/lib/engines/scoring.test.ts  # single test file
```

## Domain language

**Read `CONTEXT.md` before writing any domain-related code.** It defines canonical terms and what to avoid. The most important ones:

- **Participante** — not "usuário" or "jogador"
- **Palpite de Jogo** — score prediction (goals home × goals away); not "aposta"
- **Classificados Derivados** — teams that advance, auto-derived from Palpites de Jogo; never an explicit selection by the Participante
- **Bracket Simulado** — the visual "what-if" bracket; not "simulação" or "chaveamento"
- **Prazo de Fase** — phase deadline, configurable by Admin
- **Visibilidade de Palpites** — palpites become visible to others when the first match of the phase starts, not at the deadline

## Architecture

### Core engines — pure functions, no DB access

These four modules are the heart of the scoring and simulation logic. They take inputs and return outputs with zero side effects — no Supabase calls, no React, no I/O. Keep them that way.

| Module | Issue | Location | What it does |
|--------|-------|----------|-------------|
| Scoring Engine | #4 | `src/lib/engines/scoring.ts` | `scoreMatch(predicted, official, wentToExtraTime) → 0 \| 5 \| 10` |
| Group Standings Calculator | #5 | `src/lib/engines/standings.ts` | `calculateStandings(matches, teams) → GroupStanding[]` with full FIFA tiebreaker chain |
| Bracket Simulator | #11 | `src/lib/engines/bracket-simulator.ts` | `simulateBracket(palpites, teams, combinationsTable, overrides) → SimulatedBracket` |
| Classification Scorer | #7 | `src/lib/engines/classification-scorer.ts` | `scoreClassifications(simulated, actual, phase) → number` |

These modules are designed to be tested in isolation with fixture data — no mocking needed. Tests live alongside the module (e.g. `scoring.test.ts`).

### Static data

`src/lib/data/combinations-495.ts` (issue #6) — static TypeScript file encoding all 495 possible round-of-32 bracket configurations for third-place teams. Source: FIFA 2026 regulations Annex C. Validated at build time. See `docs/adr/0003-chaveamento-16-avos-tabela-estatica.md`.

### Supabase client pattern

- `src/lib/supabase/server.ts` — server-side client (Server Components, Route Handlers, Server Actions) using `createServerClient` from `@supabase/ssr`
- `src/lib/supabase/client.ts` — browser client using `createBrowserClient` from `@supabase/ssr`
- `src/middleware.ts` — session refresh on every request

### Ranking — on-the-fly, no cache

The ranking is computed by a single Supabase query composing the pure function modules above. There is no `ranking_cache` table. Supabase Realtime notifies clients when `matches` changes; clients re-run the ranking query. See `docs/adr/0005-ranking-on-the-fly-sem-cache.md`.

### Bracket Simulado — phase-by-phase locking

- Before group stage ends: full simulation from 72 predicted scores via Bracket Simulator + 495-combinations table
- After all matches in a phase have `is_finished = true`: that portion of the bracket freezes
- In knockout phases: real matchups (official bracket) + participant's predicted scores for those games

### Deadline and visibility enforcement

- **Prazo de Fase** is enforced server-side via Supabase RLS + Server Action validation — not just UI state
- **Palpite visibility**: RLS policy reads the `scheduled_at` of the first match of each phase; palpites become readable by others only after that timestamp is reached
- **No default scores**: unsubmitted palpites stay `null` — never 0×0. See `docs/adr/0004-palpite-nao-submetido-sem-default.md`
- Admin can grant per-participant `Exceção de Prazo` (stored in `participant_exceptions` table with `unlocked_until` timestamp)

### Database schema (key tables)

```
users              — id, name, email, is_admin
teams              — id, name, group, fifa_ranking_reference  ← immutable after setup
matches            — id, phase, group, home_team_id, away_team_id, scheduled_at,
                     home_score, away_score, is_finished, went_to_extra_time
palpites_jogos     — id, user_id, match_id, home_score, away_score
palpites_finais    — id, user_id, champion_team_id, runner_up_team_id,
                     third_team_id, fourth_team_id, top_scorer, best_player
phase_deadlines    — id, phase, deadline_at
participant_exceptions — id, user_id, phase, unlocked_until
bracket_overrides  — id, phase, match_slot, home_team_id, away_team_id
classifier_overrides   — id, phase, ordered_team_ids (JSON)
```

`fifa_ranking_reference` on `teams` is fixed at the draw date and never updated — it's the tiebreaker of last resort in the Bracket Simulator.

### Migrations

Database migrations live in `supabase/migrations/`. Run `npx supabase db push` to apply to a remote project or `npx supabase start` for a local Supabase instance.

## ADRs

All architectural decisions are in `docs/adr/`. Read the relevant ADR before touching the area it covers:

- `0001` — external API + admin override for match data
- `0002` — Bracket Simulator tiebreaker rules (FIFA order, fair play skipped, Ranking FIFA de Referência)
- `0003` — 16-avos bracket via 495-combinations static table
- `0004` — no default score for unsubmitted palpites
- `0005` — ranking on-the-fly, no cache table

## GitHub Issues

Implementation is tracked as 20 vertical slices in https://github.com/gabrielxconde/bolao-copa2026/issues (#2–#21). Each issue is an end-to-end slice with acceptance criteria. Start with the pure-function modules (#4, #5, #6, #7) — they have no infrastructure dependencies and can be built and tested immediately after project setup (#2).
