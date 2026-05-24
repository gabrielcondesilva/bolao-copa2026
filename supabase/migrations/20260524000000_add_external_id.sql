-- Add external_id to teams and matches for football-data.org API upserts

alter table public.teams
  add column external_id bigint unique;

alter table public.matches
  add column external_id bigint unique;
