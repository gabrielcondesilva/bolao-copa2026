-- Persiste as escolhas do bracket simulado no banco para não depender só do localStorage.
-- Armazena o JSON completo de BracketPicks (round_of_32, round_of_16, quarterfinals,
-- semifinals, final, third_place) junto ao palpite final do participante.

alter table public.palpites_finais
  add column bracket_picks jsonb;
