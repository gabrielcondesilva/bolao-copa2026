-- Fix infinite recursion in "users: admin read all" policy.
-- The subquery `exists (select 1 from public.users ...)` inside a policy on
-- `public.users` itself causes PostgreSQL error 42P17.
-- This policy is redundant: "users: own row" already lets any user read their
-- own row (including is_admin), and "users: authenticated read all" (added in
-- migration 20260524000001) lets authenticated users read every row.

drop policy if exists "users: admin read all" on public.users;
