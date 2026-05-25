-- Admin-controlled flags: marks whether a participant correctly predicted
-- the top scorer (artilheiro) and best player (craque) awards.
alter table public.palpites_finais
  add column artilheiro_correct boolean not null default false,
  add column best_player_correct boolean not null default false;
