-- Issue #18 — Visibilidade de Palpites
--
-- Fix: users table only had "own row" + "admin read all" policies.
-- Any authenticated participant needs to read all users rows so the ranking
-- page can list all participants (names + ids).
--
-- The scoring/ranking always uses all palpites regardless of phase visibility
-- (computed server-side with admin client). The "others read after phase starts"
-- policies on palpites_jogos/palpites_finais govern the *Palpites* UI only.

create policy "users: authenticated read all" on public.users
  for select using (auth.uid() is not null);
