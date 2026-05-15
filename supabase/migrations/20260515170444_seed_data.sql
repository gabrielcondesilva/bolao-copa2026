-- ============================================================
-- SEED: Copa do Mundo FIFA 2026
-- All timestamps in UTC (BRT = UTC-3)
-- Idempotent: uses ON CONFLICT DO NOTHING throughout
-- ============================================================

-- ============================================================
-- GROUPS A–L (fixed UUIDs for stable FK references)
-- ============================================================
INSERT INTO groups (id, name) VALUES
  ('11111111-0001-0000-0000-000000000000', 'A'),
  ('11111111-0002-0000-0000-000000000000', 'B'),
  ('11111111-0003-0000-0000-000000000000', 'C'),
  ('11111111-0004-0000-0000-000000000000', 'D'),
  ('11111111-0005-0000-0000-000000000000', 'E'),
  ('11111111-0006-0000-0000-000000000000', 'F'),
  ('11111111-0007-0000-0000-000000000000', 'G'),
  ('11111111-0008-0000-0000-000000000000', 'H'),
  ('11111111-0009-0000-0000-000000000000', 'I'),
  ('11111111-0010-0000-0000-000000000000', 'J'),
  ('11111111-0011-0000-0000-000000000000', 'K'),
  ('11111111-0012-0000-0000-000000000000', 'L')
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- TEAMS (48 seleções — sorteio FIFA 2026)
-- flag_url uses flagcdn.com CDN (2-letter ISO code, lowercase)
-- ============================================================
INSERT INTO teams (id, name, code, flag_url, group_id) VALUES
  -- GROUP A
  ('22220001-0000-0000-0000-000000000000', 'México',          'MEX', 'https://flagcdn.com/w80/mx.png', '11111111-0001-0000-0000-000000000000'),
  ('22220002-0000-0000-0000-000000000000', 'África do Sul',   'RSA', 'https://flagcdn.com/w80/za.png', '11111111-0001-0000-0000-000000000000'),
  ('22220003-0000-0000-0000-000000000000', 'Islândia',        'ISL', 'https://flagcdn.com/w80/is.png', '11111111-0001-0000-0000-000000000000'),
  ('22220004-0000-0000-0000-000000000000', 'Sérvia',          'SRB', 'https://flagcdn.com/w80/rs.png', '11111111-0001-0000-0000-000000000000'),
  -- GROUP B
  ('22220005-0000-0000-0000-000000000000', 'Argentina',       'ARG', 'https://flagcdn.com/w80/ar.png', '11111111-0002-0000-0000-000000000000'),
  ('22220006-0000-0000-0000-000000000000', 'Marrocos',        'MAR', 'https://flagcdn.com/w80/ma.png', '11111111-0002-0000-0000-000000000000'),
  ('22220007-0000-0000-0000-000000000000', 'Austrália',       'AUS', 'https://flagcdn.com/w80/au.png', '11111111-0002-0000-0000-000000000000'),
  ('22220008-0000-0000-0000-000000000000', 'Iraque',          'IRQ', 'https://flagcdn.com/w80/iq.png', '11111111-0002-0000-0000-000000000000'),
  -- GROUP C
  ('22220009-0000-0000-0000-000000000000', 'Estados Unidos',  'USA', 'https://flagcdn.com/w80/us.png', '11111111-0003-0000-0000-000000000000'),
  ('22220010-0000-0000-0000-000000000000', 'Panamá',          'PAN', 'https://flagcdn.com/w80/pa.png', '11111111-0003-0000-0000-000000000000'),
  ('22220011-0000-0000-0000-000000000000', 'Noruega',         'NOR', 'https://flagcdn.com/w80/no.png', '11111111-0003-0000-0000-000000000000'),
  ('22220012-0000-0000-0000-000000000000', 'Uruguai',         'URU', 'https://flagcdn.com/w80/uy.png', '11111111-0003-0000-0000-000000000000'),
  -- GROUP D
  ('22220013-0000-0000-0000-000000000000', 'França',          'FRA', 'https://flagcdn.com/w80/fr.png', '11111111-0004-0000-0000-000000000000'),
  ('22220014-0000-0000-0000-000000000000', 'Nigéria',         'NGA', 'https://flagcdn.com/w80/ng.png', '11111111-0004-0000-0000-000000000000'),
  ('22220015-0000-0000-0000-000000000000', 'Arábia Saudita',  'KSA', 'https://flagcdn.com/w80/sa.png', '11111111-0004-0000-0000-000000000000'),
  ('22220016-0000-0000-0000-000000000000', 'Tanzânia',        'TAN', 'https://flagcdn.com/w80/tz.png', '11111111-0004-0000-0000-000000000000'),
  -- GROUP E
  ('22220017-0000-0000-0000-000000000000', 'Brasil',          'BRA', 'https://flagcdn.com/w80/br.png', '11111111-0005-0000-0000-000000000000'),
  ('22220018-0000-0000-0000-000000000000', 'Japão',           'JPN', 'https://flagcdn.com/w80/jp.png', '11111111-0005-0000-0000-000000000000'),
  ('22220019-0000-0000-0000-000000000000', 'Costa Rica',      'CRC', 'https://flagcdn.com/w80/cr.png', '11111111-0005-0000-0000-000000000000'),
  ('22220020-0000-0000-0000-000000000000', 'Camarões',        'CMR', 'https://flagcdn.com/w80/cm.png', '11111111-0005-0000-0000-000000000000'),
  -- GROUP F
  ('22220021-0000-0000-0000-000000000000', 'Espanha',         'ESP', 'https://flagcdn.com/w80/es.png', '11111111-0006-0000-0000-000000000000'),
  ('22220022-0000-0000-0000-000000000000', 'Equador',         'ECU', 'https://flagcdn.com/w80/ec.png', '11111111-0006-0000-0000-000000000000'),
  ('22220023-0000-0000-0000-000000000000', 'Rep. Checa',      'CZE', 'https://flagcdn.com/w80/cz.png', '11111111-0006-0000-0000-000000000000'),
  ('22220024-0000-0000-0000-000000000000', 'Gana',            'GHA', 'https://flagcdn.com/w80/gh.png', '11111111-0006-0000-0000-000000000000'),
  -- GROUP G
  ('22220025-0000-0000-0000-000000000000', 'Alemanha',        'GER', 'https://flagcdn.com/w80/de.png', '11111111-0007-0000-0000-000000000000'),
  ('22220026-0000-0000-0000-000000000000', 'Colômbia',        'COL', 'https://flagcdn.com/w80/co.png', '11111111-0007-0000-0000-000000000000'),
  ('22220027-0000-0000-0000-000000000000', 'Eslováquia',      'SVK', 'https://flagcdn.com/w80/sk.png', '11111111-0007-0000-0000-000000000000'),
  ('22220028-0000-0000-0000-000000000000', 'Burkina Faso',    'BFA', 'https://flagcdn.com/w80/bf.png', '11111111-0007-0000-0000-000000000000'),
  -- GROUP H
  ('22220029-0000-0000-0000-000000000000', 'Portugal',        'POR', 'https://flagcdn.com/w80/pt.png', '11111111-0008-0000-0000-000000000000'),
  ('22220030-0000-0000-0000-000000000000', 'Egito',           'EGY', 'https://flagcdn.com/w80/eg.png', '11111111-0008-0000-0000-000000000000'),
  ('22220031-0000-0000-0000-000000000000', 'Venezuela',       'VEN', 'https://flagcdn.com/w80/ve.png', '11111111-0008-0000-0000-000000000000'),
  ('22220032-0000-0000-0000-000000000000', 'Nova Zelândia',   'NZL', 'https://flagcdn.com/w80/nz.png', '11111111-0008-0000-0000-000000000000'),
  -- GROUP I
  ('22220033-0000-0000-0000-000000000000', 'Holanda',         'NED', 'https://flagcdn.com/w80/nl.png', '11111111-0009-0000-0000-000000000000'),
  ('22220034-0000-0000-0000-000000000000', 'Irã',             'IRN', 'https://flagcdn.com/w80/ir.png', '11111111-0009-0000-0000-000000000000'),
  ('22220035-0000-0000-0000-000000000000', 'Chile',           'CHI', 'https://flagcdn.com/w80/cl.png', '11111111-0009-0000-0000-000000000000'),
  ('22220036-0000-0000-0000-000000000000', 'Senegal',         'SEN', 'https://flagcdn.com/w80/sn.png', '11111111-0009-0000-0000-000000000000'),
  -- GROUP J
  ('22220037-0000-0000-0000-000000000000', 'Inglaterra',      'ENG', 'https://flagcdn.com/w80/gb-eng.png', '11111111-0010-0000-0000-000000000000'),
  ('22220038-0000-0000-0000-000000000000', 'Coreia do Sul',   'KOR', 'https://flagcdn.com/w80/kr.png', '11111111-0010-0000-0000-000000000000'),
  ('22220039-0000-0000-0000-000000000000', 'Rep. Dominicana', 'DOM', 'https://flagcdn.com/w80/do.png', '11111111-0010-0000-0000-000000000000'),
  ('22220040-0000-0000-0000-000000000000', 'Argélia',         'ALG', 'https://flagcdn.com/w80/dz.png', '11111111-0010-0000-0000-000000000000'),
  -- GROUP K
  ('22220041-0000-0000-0000-000000000000', 'Bélgica',         'BEL', 'https://flagcdn.com/w80/be.png', '11111111-0011-0000-0000-000000000000'),
  ('22220042-0000-0000-0000-000000000000', 'Canadá',          'CAN', 'https://flagcdn.com/w80/ca.png', '11111111-0011-0000-0000-000000000000'),
  ('22220043-0000-0000-0000-000000000000', 'Marfim',          'CIV', 'https://flagcdn.com/w80/ci.png', '11111111-0011-0000-0000-000000000000'),
  ('22220044-0000-0000-0000-000000000000', 'Suíça',           'SUI', 'https://flagcdn.com/w80/ch.png', '11111111-0011-0000-0000-000000000000'),
  -- GROUP L
  ('22220045-0000-0000-0000-000000000000', 'Itália',          'ITA', 'https://flagcdn.com/w80/it.png', '11111111-0012-0000-0000-000000000000'),
  ('22220046-0000-0000-0000-000000000000', 'Turquia',         'TUR', 'https://flagcdn.com/w80/tr.png', '11111111-0012-0000-0000-000000000000'),
  ('22220047-0000-0000-0000-000000000000', 'Cuba',            'CUB', 'https://flagcdn.com/w80/cu.png', '11111111-0012-0000-0000-000000000000'),
  ('22220048-0000-0000-0000-000000000000', 'Croácia',         'CRO', 'https://flagcdn.com/w80/hr.png', '11111111-0012-0000-0000-000000000000')
ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- SCORING CONFIG (21 rules — exact_score already accumulates winner pts)
-- ============================================================
INSERT INTO scoring_config (rule_key, label, points) VALUES
  -- Group stage
  ('match_winner_group',            'Acertar vencedor/empate (grupos)',       2),
  ('exact_score_group',             'Acertar placar exato (grupos)',           7),  -- 2+5
  ('group_both_correct_order',      'Classificados: ambos na ordem certa',    4),
  ('group_both_wrong_order',        'Classificados: ambos, ordem invertida',  2),
  ('group_one_correct',             'Classificados: apenas um certo',         1),
  -- Round of 32
  ('match_winner_round_of_32',      'Acertar vencedor (décima sexta)',        3),
  ('exact_score_round_of_32',       'Acertar placar exato (décima sexta)',   10),  -- 3+7
  -- Round of 16
  ('match_winner_round_of_16',      'Acertar vencedor (oitavas)',             4),
  ('exact_score_round_of_16',       'Acertar placar exato (oitavas)',        13),  -- 4+9
  -- Quarter-finals
  ('match_winner_quarter',          'Acertar vencedor (quartas)',             5),
  ('exact_score_quarter',           'Acertar placar exato (quartas)',        16),  -- 5+11
  -- Semi-finals
  ('match_winner_semi',             'Acertar vencedor (semis)',               6),
  ('exact_score_semi',              'Acertar placar exato (semis)',          19),  -- 6+13
  -- Third place
  ('match_winner_third',            'Acertar vencedor (3º lugar)',            5),
  ('exact_score_third',             'Acertar placar exato (3º lugar)',       16),  -- 5+11
  -- Final
  ('match_winner_final',            'Acertar vencedor (final)',               8),
  ('exact_score_final',             'Acertar placar exato (final)',          23),  -- 8+15
  -- Tournament predictions
  ('champion',                      'Acertar campeão',                        8),
  ('runner_up',                     'Acertar vice-campeão',                   5),
  ('third_place_tournament',        'Acertar 3º lugar (torneio)',             3),
  ('top_scorer',                    'Acertar artilheiro',                     6)
ON CONFLICT (rule_key) DO NOTHING;

-- ============================================================
-- PHASE SCHEDULE (timestamps in UTC = BRT - 3h)
-- ============================================================
INSERT INTO phase_schedule (phase_key, label, order_index, open_at, close_at, status) VALUES
  ('group',       'Fase de Grupos + Torneio',      1, NULL,                        '2026-06-11T19:00:00Z', 'open'),
  ('round_of_32', 'Décima Sexta (Round of 32)',     2, '2026-06-28T04:00:00Z',     '2026-06-28T19:00:00Z', 'pending'),
  ('round_of_16', 'Oitavas de Final',               3, '2026-07-04T03:00:00Z',     '2026-07-09T20:00:00Z', 'pending'),
  ('quarter',     'Quartas de Final',               4, '2026-07-12T03:00:00Z',     '2026-07-14T19:00:00Z', 'pending'),
  ('semi',        'Semifinais',                     5, '2026-07-12T03:00:00Z',     '2026-07-14T19:00:00Z', 'pending'),
  ('third_final', '3º lugar + Final',               6, '2026-07-15T21:00:00Z',     '2026-07-18T21:00:00Z', 'pending')
ON CONFLICT (phase_key) DO NOTHING;

-- ============================================================
-- MATCHES — Group Stage (72 jogos)
-- Horários aproximados baseados no calendário FIFA 2026 oficial.
-- Todos em UTC. Verifique e ajuste conforme calendário definitivo.
-- ============================================================

-- GROUP A: México, África do Sul, Islândia, Sérvia
INSERT INTO matches (home_team_id, away_team_id, scheduled_at, venue, city, stage, group_id) VALUES
  ('22220001-0000-0000-0000-000000000000','22220002-0000-0000-0000-000000000000','2026-06-11T19:00:00Z','SoFi Stadium','Los Angeles','group','11111111-0001-0000-0000-000000000000'),
  ('22220003-0000-0000-0000-000000000000','22220004-0000-0000-0000-000000000000','2026-06-11T22:00:00Z','Rose Bowl','Los Angeles','group','11111111-0001-0000-0000-000000000000'),
  ('22220001-0000-0000-0000-000000000000','22220003-0000-0000-0000-000000000000','2026-06-15T19:00:00Z','Lumen Field','Seattle','group','11111111-0001-0000-0000-000000000000'),
  ('22220004-0000-0000-0000-000000000000','22220002-0000-0000-0000-000000000000','2026-06-15T22:00:00Z','Lumen Field','Seattle','group','11111111-0001-0000-0000-000000000000'),
  ('22220001-0000-0000-0000-000000000000','22220004-0000-0000-0000-000000000000','2026-06-19T22:00:00Z','AT&T Stadium','Dallas','group','11111111-0001-0000-0000-000000000000'),
  ('22220002-0000-0000-0000-000000000000','22220003-0000-0000-0000-000000000000','2026-06-19T22:00:00Z','AT&T Stadium','Dallas','group','11111111-0001-0000-0000-000000000000')
ON CONFLICT DO NOTHING;

-- GROUP B: Argentina, Marrocos, Austrália, Iraque
INSERT INTO matches (home_team_id, away_team_id, scheduled_at, venue, city, stage, group_id) VALUES
  ('22220005-0000-0000-0000-000000000000','22220006-0000-0000-0000-000000000000','2026-06-12T16:00:00Z','MetLife Stadium','Nova York','group','11111111-0002-0000-0000-000000000000'),
  ('22220007-0000-0000-0000-000000000000','22220008-0000-0000-0000-000000000000','2026-06-12T19:00:00Z','MetLife Stadium','Nova York','group','11111111-0002-0000-0000-000000000000'),
  ('22220005-0000-0000-0000-000000000000','22220007-0000-0000-0000-000000000000','2026-06-16T16:00:00Z','Gillette Stadium','Boston','group','11111111-0002-0000-0000-000000000000'),
  ('22220008-0000-0000-0000-000000000000','22220006-0000-0000-0000-000000000000','2026-06-16T19:00:00Z','Gillette Stadium','Boston','group','11111111-0002-0000-0000-000000000000'),
  ('22220005-0000-0000-0000-000000000000','22220008-0000-0000-0000-000000000000','2026-06-20T22:00:00Z','Hard Rock Stadium','Miami','group','11111111-0002-0000-0000-000000000000'),
  ('22220006-0000-0000-0000-000000000000','22220007-0000-0000-0000-000000000000','2026-06-20T22:00:00Z','Hard Rock Stadium','Miami','group','11111111-0002-0000-0000-000000000000')
ON CONFLICT DO NOTHING;

-- GROUP C: EUA, Panamá, Noruega, Uruguai
INSERT INTO matches (home_team_id, away_team_id, scheduled_at, venue, city, stage, group_id) VALUES
  ('22220009-0000-0000-0000-000000000000','22220010-0000-0000-0000-000000000000','2026-06-12T22:00:00Z','SoFi Stadium','Los Angeles','group','11111111-0003-0000-0000-000000000000'),
  ('22220011-0000-0000-0000-000000000000','22220012-0000-0000-0000-000000000000','2026-06-13T02:00:00Z','Rose Bowl','Los Angeles','group','11111111-0003-0000-0000-000000000000'),
  ('22220009-0000-0000-0000-000000000000','22220011-0000-0000-0000-000000000000','2026-06-17T22:00:00Z','SoFi Stadium','Los Angeles','group','11111111-0003-0000-0000-000000000000'),
  ('22220012-0000-0000-0000-000000000000','22220010-0000-0000-0000-000000000000','2026-06-17T22:00:00Z','SoFi Stadium','Los Angeles','group','11111111-0003-0000-0000-000000000000'),
  ('22220009-0000-0000-0000-000000000000','22220012-0000-0000-0000-000000000000','2026-06-21T22:00:00Z','AT&T Stadium','Dallas','group','11111111-0003-0000-0000-000000000000'),
  ('22220010-0000-0000-0000-000000000000','22220011-0000-0000-0000-000000000000','2026-06-21T22:00:00Z','AT&T Stadium','Dallas','group','11111111-0003-0000-0000-000000000000')
ON CONFLICT DO NOTHING;

-- GROUP D: França, Nigéria, Arábia Saudita, Tanzânia
INSERT INTO matches (home_team_id, away_team_id, scheduled_at, venue, city, stage, group_id) VALUES
  ('22220013-0000-0000-0000-000000000000','22220014-0000-0000-0000-000000000000','2026-06-13T16:00:00Z','Estadio Azteca','Cidade do México','group','11111111-0004-0000-0000-000000000000'),
  ('22220015-0000-0000-0000-000000000000','22220016-0000-0000-0000-000000000000','2026-06-13T19:00:00Z','Estadio Azteca','Cidade do México','group','11111111-0004-0000-0000-000000000000'),
  ('22220013-0000-0000-0000-000000000000','22220015-0000-0000-0000-000000000000','2026-06-17T16:00:00Z','Estadio BBVA','Monterrey','group','11111111-0004-0000-0000-000000000000'),
  ('22220016-0000-0000-0000-000000000000','22220014-0000-0000-0000-000000000000','2026-06-17T19:00:00Z','Estadio BBVA','Monterrey','group','11111111-0004-0000-0000-000000000000'),
  ('22220013-0000-0000-0000-000000000000','22220016-0000-0000-0000-000000000000','2026-06-21T19:00:00Z','Estadio Akron','Guadalajara','group','11111111-0004-0000-0000-000000000000'),
  ('22220014-0000-0000-0000-000000000000','22220015-0000-0000-0000-000000000000','2026-06-21T19:00:00Z','Estadio Akron','Guadalajara','group','11111111-0004-0000-0000-000000000000')
ON CONFLICT DO NOTHING;

-- GROUP E: Brasil, Japão, Costa Rica, Camarões
INSERT INTO matches (home_team_id, away_team_id, scheduled_at, venue, city, stage, group_id) VALUES
  ('22220017-0000-0000-0000-000000000000','22220018-0000-0000-0000-000000000000','2026-06-14T02:00:00Z','AT&T Stadium','Dallas','group','11111111-0005-0000-0000-000000000000'),
  ('22220019-0000-0000-0000-000000000000','22220020-0000-0000-0000-000000000000','2026-06-14T05:00:00Z','AT&T Stadium','Dallas','group','11111111-0005-0000-0000-000000000000'),
  ('22220017-0000-0000-0000-000000000000','22220019-0000-0000-0000-000000000000','2026-06-18T02:00:00Z','Hard Rock Stadium','Miami','group','11111111-0005-0000-0000-000000000000'),
  ('22220020-0000-0000-0000-000000000000','22220018-0000-0000-0000-000000000000','2026-06-18T05:00:00Z','Hard Rock Stadium','Miami','group','11111111-0005-0000-0000-000000000000'),
  ('22220017-0000-0000-0000-000000000000','22220020-0000-0000-0000-000000000000','2026-06-22T19:00:00Z','MetLife Stadium','Nova York','group','11111111-0005-0000-0000-000000000000'),
  ('22220018-0000-0000-0000-000000000000','22220019-0000-0000-0000-000000000000','2026-06-22T19:00:00Z','MetLife Stadium','Nova York','group','11111111-0005-0000-0000-000000000000')
ON CONFLICT DO NOTHING;

-- GROUP F: Espanha, Equador, Rep. Checa, Gana
INSERT INTO matches (home_team_id, away_team_id, scheduled_at, venue, city, stage, group_id) VALUES
  ('22220021-0000-0000-0000-000000000000','22220022-0000-0000-0000-000000000000','2026-06-14T16:00:00Z','Lumen Field','Seattle','group','11111111-0006-0000-0000-000000000000'),
  ('22220023-0000-0000-0000-000000000000','22220024-0000-0000-0000-000000000000','2026-06-14T19:00:00Z','Lumen Field','Seattle','group','11111111-0006-0000-0000-000000000000'),
  ('22220021-0000-0000-0000-000000000000','22220023-0000-0000-0000-000000000000','2026-06-18T19:00:00Z','Gillette Stadium','Boston','group','11111111-0006-0000-0000-000000000000'),
  ('22220024-0000-0000-0000-000000000000','22220022-0000-0000-0000-000000000000','2026-06-18T22:00:00Z','Gillette Stadium','Boston','group','11111111-0006-0000-0000-000000000000'),
  ('22220021-0000-0000-0000-000000000000','22220024-0000-0000-0000-000000000000','2026-06-22T22:00:00Z','Rose Bowl','Los Angeles','group','11111111-0006-0000-0000-000000000000'),
  ('22220022-0000-0000-0000-000000000000','22220023-0000-0000-0000-000000000000','2026-06-22T22:00:00Z','Rose Bowl','Los Angeles','group','11111111-0006-0000-0000-000000000000')
ON CONFLICT DO NOTHING;

-- GROUP G: Alemanha, Colômbia, Eslováquia, Burkina Faso
INSERT INTO matches (home_team_id, away_team_id, scheduled_at, venue, city, stage, group_id) VALUES
  ('22220025-0000-0000-0000-000000000000','22220026-0000-0000-0000-000000000000','2026-06-15T02:00:00Z','Levi''s Stadium','São Francisco','group','11111111-0007-0000-0000-000000000000'),
  ('22220027-0000-0000-0000-000000000000','22220028-0000-0000-0000-000000000000','2026-06-15T05:00:00Z','Levi''s Stadium','São Francisco','group','11111111-0007-0000-0000-000000000000'),
  ('22220025-0000-0000-0000-000000000000','22220027-0000-0000-0000-000000000000','2026-06-19T02:00:00Z','Arrowhead Stadium','Kansas City','group','11111111-0007-0000-0000-000000000000'),
  ('22220028-0000-0000-0000-000000000000','22220026-0000-0000-0000-000000000000','2026-06-19T05:00:00Z','Arrowhead Stadium','Kansas City','group','11111111-0007-0000-0000-000000000000'),
  ('22220025-0000-0000-0000-000000000000','22220028-0000-0000-0000-000000000000','2026-06-23T02:00:00Z','SoFi Stadium','Los Angeles','group','11111111-0007-0000-0000-000000000000'),
  ('22220026-0000-0000-0000-000000000000','22220027-0000-0000-0000-000000000000','2026-06-23T02:00:00Z','SoFi Stadium','Los Angeles','group','11111111-0007-0000-0000-000000000000')
ON CONFLICT DO NOTHING;

-- GROUP H: Portugal, Egito, Venezuela, Nova Zelândia
INSERT INTO matches (home_team_id, away_team_id, scheduled_at, venue, city, stage, group_id) VALUES
  ('22220029-0000-0000-0000-000000000000','22220030-0000-0000-0000-000000000000','2026-06-15T16:00:00Z','BC Place','Vancouver','group','11111111-0008-0000-0000-000000000000'),
  ('22220031-0000-0000-0000-000000000000','22220032-0000-0000-0000-000000000000','2026-06-15T19:00:00Z','BC Place','Vancouver','group','11111111-0008-0000-0000-000000000000'),
  ('22220029-0000-0000-0000-000000000000','22220031-0000-0000-0000-000000000000','2026-06-19T16:00:00Z','BMO Field','Toronto','group','11111111-0008-0000-0000-000000000000'),
  ('22220032-0000-0000-0000-000000000000','22220030-0000-0000-0000-000000000000','2026-06-19T19:00:00Z','BMO Field','Toronto','group','11111111-0008-0000-0000-000000000000'),
  ('22220029-0000-0000-0000-000000000000','22220032-0000-0000-0000-000000000000','2026-06-23T22:00:00Z','MetLife Stadium','Nova York','group','11111111-0008-0000-0000-000000000000'),
  ('22220030-0000-0000-0000-000000000000','22220031-0000-0000-0000-000000000000','2026-06-23T22:00:00Z','MetLife Stadium','Nova York','group','11111111-0008-0000-0000-000000000000')
ON CONFLICT DO NOTHING;

-- GROUP I: Holanda, Irã, Chile, Senegal
INSERT INTO matches (home_team_id, away_team_id, scheduled_at, venue, city, stage, group_id) VALUES
  ('22220033-0000-0000-0000-000000000000','22220034-0000-0000-0000-000000000000','2026-06-16T02:00:00Z','Estadio Azteca','Cidade do México','group','11111111-0009-0000-0000-000000000000'),
  ('22220035-0000-0000-0000-000000000000','22220036-0000-0000-0000-000000000000','2026-06-16T05:00:00Z','Estadio Azteca','Cidade do México','group','11111111-0009-0000-0000-000000000000'),
  ('22220033-0000-0000-0000-000000000000','22220035-0000-0000-0000-000000000000','2026-06-20T02:00:00Z','Estadio BBVA','Monterrey','group','11111111-0009-0000-0000-000000000000'),
  ('22220036-0000-0000-0000-000000000000','22220034-0000-0000-0000-000000000000','2026-06-20T05:00:00Z','Estadio BBVA','Monterrey','group','11111111-0009-0000-0000-000000000000'),
  ('22220033-0000-0000-0000-000000000000','22220036-0000-0000-0000-000000000000','2026-06-24T22:00:00Z','Lumen Field','Seattle','group','11111111-0009-0000-0000-000000000000'),
  ('22220034-0000-0000-0000-000000000000','22220035-0000-0000-0000-000000000000','2026-06-24T22:00:00Z','Lumen Field','Seattle','group','11111111-0009-0000-0000-000000000000')
ON CONFLICT DO NOTHING;

-- GROUP J: Inglaterra, Coreia do Sul, Rep. Dominicana, Argélia
INSERT INTO matches (home_team_id, away_team_id, scheduled_at, venue, city, stage, group_id) VALUES
  ('22220037-0000-0000-0000-000000000000','22220038-0000-0000-0000-000000000000','2026-06-16T22:00:00Z','Gillette Stadium','Boston','group','11111111-0010-0000-0000-000000000000'),
  ('22220039-0000-0000-0000-000000000000','22220040-0000-0000-0000-000000000000','2026-06-17T01:00:00Z','Gillette Stadium','Boston','group','11111111-0010-0000-0000-000000000000'),
  ('22220037-0000-0000-0000-000000000000','22220039-0000-0000-0000-000000000000','2026-06-20T22:00:00Z','MetLife Stadium','Nova York','group','11111111-0010-0000-0000-000000000000'),
  ('22220040-0000-0000-0000-000000000000','22220038-0000-0000-0000-000000000000','2026-06-21T01:00:00Z','MetLife Stadium','Nova York','group','11111111-0010-0000-0000-000000000000'),
  ('22220037-0000-0000-0000-000000000000','22220040-0000-0000-0000-000000000000','2026-06-25T02:00:00Z','Hard Rock Stadium','Miami','group','11111111-0010-0000-0000-000000000000'),
  ('22220038-0000-0000-0000-000000000000','22220039-0000-0000-0000-000000000000','2026-06-25T02:00:00Z','Hard Rock Stadium','Miami','group','11111111-0010-0000-0000-000000000000')
ON CONFLICT DO NOTHING;

-- GROUP K: Bélgica, Canadá, Marfim, Suíça
INSERT INTO matches (home_team_id, away_team_id, scheduled_at, venue, city, stage, group_id) VALUES
  ('22220041-0000-0000-0000-000000000000','22220042-0000-0000-0000-000000000000','2026-06-17T22:00:00Z','BMO Field','Toronto','group','11111111-0011-0000-0000-000000000000'),
  ('22220043-0000-0000-0000-000000000000','22220044-0000-0000-0000-000000000000','2026-06-18T01:00:00Z','BMO Field','Toronto','group','11111111-0011-0000-0000-000000000000'),
  ('22220041-0000-0000-0000-000000000000','22220043-0000-0000-0000-000000000000','2026-06-21T22:00:00Z','BC Place','Vancouver','group','11111111-0011-0000-0000-000000000000'),
  ('22220044-0000-0000-0000-000000000000','22220042-0000-0000-0000-000000000000','2026-06-22T01:00:00Z','BC Place','Vancouver','group','11111111-0011-0000-0000-000000000000'),
  ('22220041-0000-0000-0000-000000000000','22220044-0000-0000-0000-000000000000','2026-06-25T22:00:00Z','Arrowhead Stadium','Kansas City','group','11111111-0011-0000-0000-000000000000'),
  ('22220042-0000-0000-0000-000000000000','22220043-0000-0000-0000-000000000000','2026-06-25T22:00:00Z','Arrowhead Stadium','Kansas City','group','11111111-0011-0000-0000-000000000000')
ON CONFLICT DO NOTHING;

-- GROUP L: Itália, Turquia, Cuba, Croácia
INSERT INTO matches (home_team_id, away_team_id, scheduled_at, venue, city, stage, group_id) VALUES
  ('22220045-0000-0000-0000-000000000000','22220046-0000-0000-0000-000000000000','2026-06-18T16:00:00Z','Levi''s Stadium','São Francisco','group','11111111-0012-0000-0000-000000000000'),
  ('22220047-0000-0000-0000-000000000000','22220048-0000-0000-0000-000000000000','2026-06-18T19:00:00Z','Levi''s Stadium','São Francisco','group','11111111-0012-0000-0000-000000000000'),
  ('22220045-0000-0000-0000-000000000000','22220047-0000-0000-0000-000000000000','2026-06-22T16:00:00Z','Arrowhead Stadium','Kansas City','group','11111111-0012-0000-0000-000000000000'),
  ('22220048-0000-0000-0000-000000000000','22220046-0000-0000-0000-000000000000','2026-06-22T19:00:00Z','Arrowhead Stadium','Kansas City','group','11111111-0012-0000-0000-000000000000'),
  ('22220045-0000-0000-0000-000000000000','22220048-0000-0000-0000-000000000000','2026-06-26T02:00:00Z','AT&T Stadium','Dallas','group','11111111-0012-0000-0000-000000000000'),
  ('22220046-0000-0000-0000-000000000000','22220047-0000-0000-0000-000000000000','2026-06-26T02:00:00Z','AT&T Stadium','Dallas','group','11111111-0012-0000-0000-000000000000')
ON CONFLICT DO NOTHING;

-- ============================================================
-- KNOCKOUT PLACEHOLDER MATCHES (32 jogos)
-- home_team_id / away_team_id são NULL até as equipes serem conhecidas.
-- Horários aproximados (UTC); stage indica a fase.
-- ============================================================

-- Round of 32 (16 jogos)
INSERT INTO matches (scheduled_at, venue, city, stage) VALUES
  ('2026-06-29T19:00:00Z', 'MetLife Stadium',   'Nova York',         'round_of_32'),
  ('2026-06-29T22:00:00Z', 'AT&T Stadium',      'Dallas',            'round_of_32'),
  ('2026-06-30T01:00:00Z', 'Hard Rock Stadium', 'Miami',             'round_of_32'),
  ('2026-06-30T19:00:00Z', 'SoFi Stadium',      'Los Angeles',       'round_of_32'),
  ('2026-06-30T22:00:00Z', 'Rose Bowl',         'Los Angeles',       'round_of_32'),
  ('2026-07-01T01:00:00Z', 'Levi''s Stadium',   'São Francisco',     'round_of_32'),
  ('2026-07-01T19:00:00Z', 'Gillette Stadium',  'Boston',            'round_of_32'),
  ('2026-07-01T22:00:00Z', 'Lumen Field',       'Seattle',           'round_of_32'),
  ('2026-07-02T01:00:00Z', 'Arrowhead Stadium', 'Kansas City',       'round_of_32'),
  ('2026-07-02T19:00:00Z', 'BMO Field',         'Toronto',           'round_of_32'),
  ('2026-07-02T22:00:00Z', 'BC Place',          'Vancouver',         'round_of_32'),
  ('2026-07-03T01:00:00Z', 'Estadio Azteca',    'Cidade do México',  'round_of_32'),
  ('2026-07-03T19:00:00Z', 'Estadio BBVA',      'Monterrey',         'round_of_32'),
  ('2026-07-03T22:00:00Z', 'Estadio Akron',     'Guadalajara',       'round_of_32'),
  ('2026-07-04T01:00:00Z', 'MetLife Stadium',   'Nova York',         'round_of_32'),
  ('2026-07-04T19:00:00Z', 'AT&T Stadium',      'Dallas',            'round_of_32')
ON CONFLICT DO NOTHING;

-- Round of 16 (8 jogos)
INSERT INTO matches (scheduled_at, venue, city, stage) VALUES
  ('2026-07-10T19:00:00Z', 'MetLife Stadium',   'Nova York',         'round_of_16'),
  ('2026-07-10T22:00:00Z', 'AT&T Stadium',      'Dallas',            'round_of_16'),
  ('2026-07-11T01:00:00Z', 'SoFi Stadium',      'Los Angeles',       'round_of_16'),
  ('2026-07-11T19:00:00Z', 'Hard Rock Stadium', 'Miami',             'round_of_16'),
  ('2026-07-11T22:00:00Z', 'Rose Bowl',         'Los Angeles',       'round_of_16'),
  ('2026-07-12T01:00:00Z', 'Levi''s Stadium',   'São Francisco',     'round_of_16'),
  ('2026-07-12T19:00:00Z', 'Gillette Stadium',  'Boston',            'round_of_16'),
  ('2026-07-12T22:00:00Z', 'Lumen Field',       'Seattle',           'round_of_16')
ON CONFLICT DO NOTHING;

-- Quarter-finals (4 jogos)
INSERT INTO matches (scheduled_at, venue, city, stage) VALUES
  ('2026-07-15T22:00:00Z', 'MetLife Stadium',   'Nova York',         'quarter'),
  ('2026-07-16T01:00:00Z', 'AT&T Stadium',      'Dallas',            'quarter'),
  ('2026-07-16T22:00:00Z', 'SoFi Stadium',      'Los Angeles',       'quarter'),
  ('2026-07-17T01:00:00Z', 'Hard Rock Stadium', 'Miami',             'quarter')
ON CONFLICT DO NOTHING;

-- Semi-finals (2 jogos)
INSERT INTO matches (scheduled_at, venue, city, stage) VALUES
  ('2026-07-19T22:00:00Z', 'MetLife Stadium',   'Nova York',         'semi'),
  ('2026-07-20T22:00:00Z', 'AT&T Stadium',      'Dallas',            'semi')
ON CONFLICT DO NOTHING;

-- Third place (1 jogo)
INSERT INTO matches (scheduled_at, venue, city, stage) VALUES
  ('2026-07-18T22:00:00Z', 'SoFi Stadium',      'Los Angeles',       'third_place')
ON CONFLICT DO NOTHING;

-- Final (1 jogo)
INSERT INTO matches (scheduled_at, venue, city, stage) VALUES
  ('2026-07-19T22:00:00Z', 'MetLife Stadium',   'Nova York',         'final')
ON CONFLICT DO NOTHING;
