-- Grant table-level permissions to anon and authenticated roles.
-- RLS policies control row-level access; these grants are the prerequisite
-- layer that PostgreSQL checks before RLS is even evaluated.
-- Without these grants, queries fail with "permission denied for table X"
-- even when a valid RLS policy would allow the row.

-- Public read (anon + authenticated)
grant select on public.teams                to anon, authenticated;
grant select on public.matches              to anon, authenticated;
grant select on public.phase_deadlines      to anon, authenticated;
grant select on public.bracket_overrides    to anon, authenticated;
grant select on public.classifier_overrides to anon, authenticated;

-- Authenticated read
grant select on public.users                    to authenticated;
grant select on public.palpites_jogos           to authenticated;
grant select on public.palpites_finais          to authenticated;
grant select on public.participant_exceptions   to authenticated;

-- Authenticated write (RLS policies still enforce who can actually write)
grant insert, update, delete on public.teams                to authenticated;
grant insert, update, delete on public.matches              to authenticated;
grant insert, update, delete on public.phase_deadlines      to authenticated;
grant insert, update, delete on public.bracket_overrides    to authenticated;
grant insert, update, delete on public.classifier_overrides to authenticated;
grant insert, update, delete on public.participant_exceptions to authenticated;
grant insert, update, delete on public.palpites_jogos       to authenticated;
grant insert, update, delete on public.palpites_finais      to authenticated;
