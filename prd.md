# PRD — Bolão Copa do Mundo 2026

> Documento de Requisitos do Produto para consumo pelo Claude Code.  
> Data de criação: 2026-05-15 | Autor: Gabriel Conde

---

## 1. Visão do Produto

Aplicação web de bolão para a Copa do Mundo FIFA 2026 (masculina), onde participantes convidados fazem palpites sobre partidas e recebem pontos automaticamente conforme os resultados são processados. A plataforma é moderna, visualmente imersiva, com leaderboard em tempo real e painel administrativo para gestão completa do bolão.

**Missão**: Tornar a experiência de acompanhar a Copa mais competitiva e divertida para grupos de amigos, com uma interface que rivaliza com plataformas profissionais.

---

## 2. Contexto do Negócio

- **Versão inicial**: Uso privado — um único bolão para o grupo do Gabriel.
- **Arquitetura preparada para escalar**: estrutura multi-tenant básica para futura abertura a outros grupos.
- **Copa do Mundo 2026**: 48 seleções, 12 grupos de 4 times, 104 jogos, realizada nos EUA, Canadá e México.
- **Primeiro jogo**: México × África do Sul — 11/06/2026 às 16:00 (horário de Brasília). Este é o deadline global para envio de palpites.

---

## 3. Usuários e Papéis

| Papel | Descrição |
|---|---|
| `admin` | Gerencia partidas, resultados, usuários, configurações de pontuação e estatísticas manuais. Pode conceder permissão de editor. |
| `editor` | Pode inserir/editar resultados de partidas e estatísticas. Não gerencia usuários. |
| `player` | Visualiza tudo, registra palpites dentro do prazo, acompanha sua pontuação. |

---

## 4. Regras de Negócio

### 4.1 Controle Automático de Fases (com override manual)

O sistema abre e fecha cada fase automaticamente com base em datas e horários pré-cadastrados. O admin pode sobrescrever qualquer transição a qualquer momento via painel.

#### Calendário de Fases (todos os horários em BRT — UTC-3)

| # | Fase | Abre automaticamente | Fecha automaticamente |
|---|---|---|---|
| 1 | Fase de Grupos + Torneio (72 jogos + Campeão/Vice/3º/Artilheiro) | Abertura do app (já aberta) | **11/06/2026 às 16:00 BRT** (apito inicial: México × África do Sul) |
| 2 | Décima Sexta — Round of 32 (16 jogos) | **28/06/2026 às 01:00 BRT** (após fim dos últimos jogos dos grupos) | **28/06/2026 às 16:00 BRT** (antes do 1º jogo da fase) |
| 3 | Oitavas de Final (8 jogos) | **04/07/2026 às 00:00 BRT** (após fim da Décima Sexta) | **09/07/2026 às 17:00 BRT** (antes do 1º jogo das Oitavas) |
| 4 | Quartas de Final (4 jogos) | **12/07/2026 às 00:00 BRT** (após fim das Oitavas) | **14/07/2026 às 16:00 BRT** (antes do 1º jogo das Quartas) |
| 5 | Semifinais (2 jogos) | **12/07/2026 às 00:00 BRT** | **14/07/2026 às 16:00 BRT** |
| 6 | 3º lugar + Final (2 jogos) | **15/07/2026 às 18:00 BRT** (após fim da 2ª semifinal) | **18/07/2026 às 18:00 BRT** (antes do jogo de 3º lugar) |

> Datas de referência da FIFA 2026. Sujeitas a alteração — por isso o admin pode ajustar os horários via painel antes de o sistema aplicá-los automaticamente.

#### Regras de transição automática

- O sistema verifica o horário atual a cada minuto (cron job).
- Quando `now() >= open_at` e a fase está `pending` → muda para `open`.
- Quando `now() >= close_at` e a fase está `open` → muda para `closed`.
- Ao fechar uma fase automaticamente, a fase anterior (se ainda `open`) também é fechada.
- Dentro de uma fase aberta, cada jogo individual bloqueia palpite no apito inicial (via status `live` ou `finished` da partida).

#### Override manual pelo admin

O admin pode a qualquer momento:
- **Abrir fase** — ignora o `open_at` agendado e força `open` imediatamente.
- **Bloquear fase** — ignora o `close_at` agendado e força `closed` imediatamente.
- **Editar os horários** `open_at` / `close_at` de qualquer fase antes de ela ser acionada.

Toda ação manual gera entrada no log de auditoria com o admin responsável, horário e motivo opcional.

#### Estados possíveis de uma fase

```
pending  →  open  →  closed
              ↑          ↑
         (override)  (override)
```

O painel admin exibe para cada fase: status atual, próxima transição agendada e botões de override.

### 4.2 Categorias de Palpite

#### A. Fase de Grupos (bloqueada pelo admin)
- Placar exato de cada um dos 72 jogos da fase de grupos.
- Quais 2 times se classificam em 1º e 2º em cada um dos 12 grupos.
- Palpites do torneio: **Campeão, Vice-campeão, 3º lugar e Artilheiro** — preenchidos nesta fase e bloqueados junto com ela. Não podem ser alterados depois.

#### B. Décima Sexta — Round of 32 (16 jogos)
- Placar exato de cada jogo. Os confrontos já são os reais (times classificados de verdade).
- Palpite liberado após o admin abrir a fase no painel.

#### C. Oitavas de Final (8 jogos)
- Placar exato de cada jogo com os times reais classificados.

#### D. Quartas de Final (4 jogos)
- Placar exato de cada jogo.

#### E. Semifinais (2 jogos)
- Placar exato de cada jogo.

#### F. 3º lugar + Final (2 jogos)
- Placar exato dos dois jogos finais.

> Em todas as fases do mata-mata, o usuário palpita o resultado ao final dos 90 minutos regulares. Em caso de prorrogação/pênaltis, conta o resultado do 0–0 (ou placar dos 90 min) para o palpite de placar exato, mas o vencedor classificado é considerado para o palpite de vencedor.

### 4.3 Sistema de Pontuação (valores padrão — configuráveis via admin)

#### Fase de Grupos

| Evento | Pontos |
|---|---|
| Acertar o vencedor/empate da partida | 2 pts |
| Acertar o placar exato da partida | 5 pts (acumula com o de cima) |
| Acertar os dois classificados do grupo (ordem correta: 1º e 2º certos) | 4 pts |
| Acertar os dois classificados do grupo (ordem invertida) | 2 pts |
| Acertar apenas um dos classificados (qualquer posição) | 1 pt |

#### Mata-mata (pontuação crescente por fase)

| Fase | Acertar vencedor | Acertar placar exato |
|---|---|---|
| Décima Sexta (Round of 32) | 3 pts | 7 pts |
| Oitavas de Final | 4 pts | 9 pts |
| Quartas de Final | 5 pts | 11 pts |
| Semifinais | 6 pts | 13 pts |
| 3º lugar | 5 pts | 11 pts |
| Final | 8 pts | 15 pts |

#### Palpites do Torneio (bloqueiam junto com a Fase de Grupos)

| Evento | Pontos |
|---|---|
| Acertar o Campeão | 8 pts |
| Acertar o Vice-campeão | 5 pts |
| Acertar o 3º lugar | 3 pts |
| Acertar o Artilheiro | 6 pts |

> Campeão, Vice, 3º e Artilheiro são preenchidos durante a Fase de Grupos e bloqueiam no mesmo momento que ela. Não há reabertura desses palpites em nenhuma hipótese.

> Todos os valores de pontuação são editáveis pelo admin no painel de configuração. Pontos do mata-mata são proporcionalmente maiores para compensar o menor número de jogos e manter a emoção nas fases finais.

### 4.4 Processamento de Pontuação

- Ao admin salvar o resultado de uma partida, o sistema recalcula automaticamente os pontos de todos os palpites daquela partida.
- Os dados de artilheiro, assistências e cartões são coletados via API externa (ver seção 9).
- A pontuação total de cada usuário é atualizada em tempo real via Supabase Realtime.

---

## 5. Funcionalidades

### 5.1 Página Pública (Landing Page)

- Hero visual imersivo com tema Copa 2026 (dark mode, cores dos países-sede: azul EUA, vermelho Canadá, verde México).
- Countdown para o primeiro jogo.
- Chamada para login/cadastro.
- Preview das estatísticas da Copa (sem acesso ao bolão).

### 5.2 Autenticação

- Login com Google OAuth (foto de perfil puxada automaticamente).
- Login com Email + Senha.
- Cadastro de novos usuários via admin (acesso por convite/aprovação).
- O jogador não consegue se cadastrar sozinho — precisa ser adicionado pelo admin.

### 5.3 Dashboard do Jogador

- **Leaderboard em tempo real**: classificação geral dos participantes com foto de perfil circular, pontuação total e variação (+/- desde ontem). Destaque visual para o 1º colocado (troféu). Indicador destacado da posição do usuário logado.
- **Meus Palpites**: lista de todos os palpites do usuário com status (pendente, correto, errado, parcial).
- **Resumo de pontos**: breakdown por categoria (partidas, grupos, torneio).

### 5.4 Grupos da Copa

- 12 grupos (A–L), cada um com 4 times.
- Tabela de classificação do grupo com: jogos, vitórias, empates, derrotas, gols pró, gols contra, saldo, pontos.
- Atualização automática conforme os resultados chegam.
- Indicação visual dos classificados (1º e 2º automáticos + melhores 3ºs).
- Palpite do usuário sobre quem passa do grupo embutido na tela do grupo.

### 5.5 Calendário de Partidas

- Lista/grid de todas as partidas com: times, data, hora (BRT), estádio e cidade.
- Status da partida: `Não iniciada`, `Ao vivo`, `Encerrada`.
- Placar ao vivo para jogos em andamento.
- Campo de palpite inline (bloqueado após o deadline).
- Filtros por: grupo, fase, data.

### 5.6 Chaveamento (Bracket)

- Visualização gráfica do mata-mata: Décima Sexta → Oitavas → Quartas → Semis → 3º lugar → Final.
- Times populados com os classificados reais conforme cada fase avança.
- **Palpites fase a fase**: o campo de palpite de cada jogo só aparece quando o admin abre aquela fase. Fases futuras mostram os slots como "A definir".
- Indicador visual de status por fase: `Bloqueada` / `Aberta para palpites` / `Encerrada`.
- O palpite do usuário fica visível no bracket ao lado do resultado real (após o jogo), com indicação de acerto (verde), erro (vermelho) ou parcial (amarelo — acertou vencedor mas não o placar).
- Bracket é responsivo: scroll horizontal no mobile, visão completa no desktop.

### 5.7 Estatísticas da Copa

- **Artilheiros**: foto, nome, seleção, nº de gols.
- **Assistências**: ranking similar.
- **Cartões amarelos**: ranking.
- **Cartões vermelhos**: ranking.
- Dados coletados via API (ver seção 9) com atualização automática a cada X minutos.

### 5.8 Leaderboard em Tempo Real (destaque na home)

- Widget fixo/destacado mostrando top 5 participantes.
- Foto de perfil circular pequena ao lado do nome.
- Pontuação total.
- Posição atual com seta de variação.
- Usuário logado sempre visível (mesmo que não esteja no top 5).
- Atualização via WebSocket (Supabase Realtime).
- Possibilidade futura: gráfico de evolução de pontuação ao longo da Copa.

### 5.9 Painel Administrativo

Acessível via rota `/admin` apenas para roles `admin` e `editor`.

**Gestão de Usuários (admin)**:
- Adicionar usuário (nome, email, foto opcional, role).
- Editar/desativar usuário.
- Ver palpites de qualquer usuário.

**Gestão de Partidas (admin/editor)**:
- Inserir resultado de uma partida (placar final).
- Marcar partida como "Ao vivo" / "Encerrada".
- Editar resultado (com log de auditoria).

**Gestão de Estatísticas (admin/editor)**:
- Painel para inserir/editar artilheiros, assistências e cartões manualmente (fallback se a API falhar).

**Configuração de Pontuação (admin)**:
- Tabela editável com todos os valores de pontuação.
- Botão "Recalcular todos os pontos" — reprocessa histórico completo.

**Controle de Fases (admin)**:
- Painel dedicado `/admin/fases` com card para cada fase mostrando: status atual, `open_at` e `close_at` agendados, próxima transição automática com countdown.
- Botão **"Abrir agora"** — força `open` imediatamente, independente do agendamento.
- Botão **"Bloquear agora"** — força `closed` imediatamente.
- Campos editáveis de `open_at` e `close_at` (date-time picker) para ajustar o agendamento antes de ele disparar.
- Badge de status: `Pendente` (cinza) / `Aberta` (verde pulsante) / `Bloqueada` (vermelho).
- Histórico de overrides manuais com admin, horário e motivo.

**Dashboard admin**:
- Resumo: nº de participantes, total de palpites enviados, partidas encerradas/pendentes.
- Alerta destacado: próxima transição de fase automática com countdown.
- Log de ações recentes.

---

## 6. Telas / Rotas

```
/                        → Landing page
/login                   → Login (Google + Email/Senha)
/dashboard               → Home do jogador (leaderboard + resumo)
/palpites                → Todos os palpites do usuário logado
/grupos                  → Visão geral dos 12 grupos
/grupos/[id]             → Grupo específico com tabela + palpite de classificação
/partidas                → Calendário completo
/chaveamento             → Bracket do mata-mata
/estatisticas            → Artilheiros, assistências, cartões
/admin                   → Dashboard admin
/admin/usuarios          → Gestão de usuários
/admin/partidas          → Inserção de resultados
/admin/estatisticas      → Estatísticas manuais
/admin/pontuacao         → Configuração de pontuação
/admin/fases             → Controle de fases (agendamento + override)
/admin/logs              → Log de auditoria
```

---

## 7. Design & UX

### 7.1 Estilo Visual

- **Tema**: Dark mode predominante.
- **Paleta**: 
  - Background: `#0A0A0F` (quase preto)
  - Surface: `#13131A`
  - Primary: `#1B6FFF` (azul FIFA/EUA)
  - Accent: `#FF3B3B` (vermelho Canadá)
  - Success: `#00C853` (verde México)
  - Text: `#F0F0F5`
- **Tipografia**: Inter ou Geist (otimizada para Next.js).
- **Elementos visuais**: glassmorphism sutil nos cards, gradientes nas áreas de destaque, animações suaves (Framer Motion).
- **Bandeiras**: SVG das seleções para todos os 48 países.

### 7.2 Responsividade

- Mobile-first. Todas as telas devem funcionar perfeitamente em telas de 375px+.
- Navegação mobile via bottom navigation bar.
- Desktop com sidebar fixa.

### 7.3 Componentes Chave

- `MatchCard`: card de partida com times, placar, status e campo de palpite.
- `GroupTable`: tabela de grupo responsiva.
- `LeaderboardRow`: linha do ranking com foto, nome, pontos, variação.
- `BracketTree`: visualização SVG/DOM do chaveamento.
- `StatCard`: card de estatística (artilheiro, etc.).
- `CountdownTimer`: contador regressivo para o primeiro jogo.

---

## 8. Arquitetura Técnica

### 8.1 Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 15 (App Router) |
| Linguagem | TypeScript (strict mode) |
| Estilização | Tailwind CSS v4 + shadcn/ui |
| Animações | Framer Motion |
| Banco de Dados | PostgreSQL via Supabase |
| Auth | Supabase Auth (Google OAuth + Email/Password) |
| Realtime | Supabase Realtime (WebSockets) |
| ORM | Supabase JS Client + tipos gerados automaticamente |
| API de Dados da Copa | API-Football (RapidAPI) |
| Hospedagem Frontend | Vercel |
| Hospedagem Backend/DB | Supabase (cloud) |
| Testes | Vitest + Testing Library |

### 8.2 Schema do Banco de Dados (PostgreSQL)

```sql
-- Seleções
teams (
  id uuid PK,
  name text,          -- "Brasil"
  code char(3),       -- "BRA"
  flag_url text,
  group_id uuid FK,
  created_at timestamptz
)

-- Grupos
groups (
  id uuid PK,
  name char(1),       -- "A" .. "L"
  created_at timestamptz
)

-- Jogadores (para artilheiro etc.)
players (
  id uuid PK,
  name text,
  team_id uuid FK,
  goals int DEFAULT 0,
  assists int DEFAULT 0,
  yellow_cards int DEFAULT 0,
  red_cards int DEFAULT 0,
  updated_at timestamptz
)

-- Partidas
matches (
  id uuid PK,
  home_team_id uuid FK,
  away_team_id uuid FK,
  scheduled_at timestamptz,    -- UTC
  venue text,
  city text,
  stage text,  -- 'group', 'round_of_32', 'round_of_16', 'quarter', 'semi', 'third_place', 'final'
  group_id uuid FK NULLABLE,
  home_score int NULLABLE,
  away_score int NULLABLE,
  status text DEFAULT 'scheduled',  -- 'scheduled' | 'live' | 'finished'
  external_id text,           -- ID na API externa
  created_at timestamptz
)

-- Usuários (espelha Supabase Auth com dados extras)
profiles (
  id uuid PK,          -- mesmo ID do auth.users
  name text,
  email text UNIQUE,
  avatar_url text,
  role text DEFAULT 'player',  -- 'admin' | 'editor' | 'player'
  is_active bool DEFAULT true,
  created_at timestamptz
)

-- Palpites de partidas
match_predictions (
  id uuid PK,
  user_id uuid FK → profiles,
  match_id uuid FK → matches,
  home_score int NOT NULL,
  away_score int NOT NULL,
  points_awarded int NULLABLE,
  created_at timestamptz,
  UNIQUE(user_id, match_id)
)

-- Palpites de classificação de grupo
group_predictions (
  id uuid PK,
  user_id uuid FK → profiles,
  group_id uuid FK → groups,
  first_place_team_id uuid FK → teams,
  second_place_team_id uuid FK → teams,
  points_awarded int NULLABLE,
  created_at timestamptz,
  UNIQUE(user_id, group_id)
)

-- Palpites do torneio
tournament_predictions (
  id uuid PK,
  user_id uuid FK → profiles,
  champion_team_id uuid FK → teams NULLABLE,
  runner_up_team_id uuid FK → teams NULLABLE,
  third_place_team_id uuid FK → teams NULLABLE,
  top_scorer_player_id uuid FK → players NULLABLE,
  points_awarded int NULLABLE,
  created_at timestamptz,
  UNIQUE(user_id)
)

-- Configuração de pontuação
scoring_config (
  id uuid PK,
  rule_key text UNIQUE,       -- ex: 'match_winner', 'exact_score'
  label text,
  points int NOT NULL,
  updated_at timestamptz
)

-- Agendamento e controle de fases
phase_schedule (
  id uuid PK,
  phase_key text UNIQUE,   -- 'group' | 'round_of_32' | 'round_of_16' | 'quarter' | 'semi' | 'third_final'
  label text,              -- "Fase de Grupos", "Décima Sexta", etc.
  order_index int,         -- 1..6, define a sequência
  open_at timestamptz,     -- horário automático de abertura (UTC)
  close_at timestamptz,    -- horário automático de fechamento (UTC)
  status text DEFAULT 'pending',  -- 'pending' | 'open' | 'closed'
  override_by uuid FK → profiles NULLABLE,  -- admin que fez override
  override_at timestamptz NULLABLE,
  override_reason text NULLABLE,
  updated_at timestamptz
)

-- Seed inicial da tabela phase_schedule (horários em UTC = BRT-3):
-- group:        open_at=NULL (já aberta),  close_at=2026-06-11T19:00:00Z
-- round_of_32:  open_at=2026-06-28T04:00Z, close_at=2026-06-28T19:00Z
-- round_of_16:  open_at=2026-07-04T03:00Z, close_at=2026-07-09T20:00Z
-- quarter:      open_at=2026-07-12T03:00Z, close_at=2026-07-14T19:00Z
-- semi:         open_at=2026-07-12T03:00Z, close_at=2026-07-14T19:00Z
-- third_final:  open_at=2026-07-15T21:00Z, close_at=2026-07-18T21:00Z

-- Auditoria
audit_logs (
  id uuid PK,
  actor_id uuid FK → profiles,
  action text,
  entity_type text,
  entity_id uuid,
  old_value jsonb,
  new_value jsonb,
  created_at timestamptz
)
```

### 8.3 Row Level Security (RLS) — Supabase

- `profiles`: leitura pública (nome, avatar), escrita apenas pelo próprio usuário ou admin.
- `match_predictions`: escrita apenas pelo dono, somente se `phase_schedule.status = 'open'` para a fase correspondente e a partida ainda não iniciou.
- `matches`: leitura pública, escrita apenas admin/editor.
- `phase_schedule`: leitura pública (frontend usa para saber se fase está aberta), escrita apenas admin.
- `scoring_config`: leitura pública, escrita apenas admin.
- `audit_logs`: apenas admin lê/escreve.

### 8.4 Realtime

Canais Supabase Realtime:
- `channel: scores` — dispara quando `profiles.total_points` é atualizado → atualiza leaderboard.
- `channel: matches` — dispara quando `matches.status` ou `matches.home_score` muda → atualiza placares ao vivo.
- `channel: phases` — dispara quando `phase_schedule.status` muda → frontend atualiza UI de palpites em tempo real (abre/bloqueia campos).

### 8.5 Cron Job — Transição Automática de Fases

**Vercel Cron** configurado em `vercel.json` para rodar a cada minuto durante o período da Copa:

```json
{
  "crons": [
    { "path": "/api/cron/phase-transition", "schedule": "* * * * *" },
    { "path": "/api/cron/sync-matches",     "schedule": "*/5 * * * *" }
  ]
}
```

Lógica de `/api/cron/phase-transition`:
1. Busca todas as fases com `status = 'pending'` onde `open_at <= now()`.
2. Atualiza para `status = 'open'`.
3. Busca todas as fases com `status = 'open'` onde `close_at <= now()`.
4. Atualiza para `status = 'closed'`.
5. Para cada transição, grava em `audit_logs` com `actor_id = NULL` (transição automática).
6. Dispara notificação Supabase Realtime no canal `phases`.

A rota é protegida por `Authorization: Bearer $CRON_SECRET` — apenas a Vercel pode chamá-la.

### 8.6 Processamento de Pontuação

Server Action no Next.js (ou Edge Function no Supabase) chamada `recalculate_match_points(match_id)`:
1. Busca o resultado final da partida.
2. Para cada `match_prediction` daquela partida:
   - Calcula pontos conforme regras da `scoring_config`.
   - Atualiza `points_awarded` na prediction.
3. Recalcula `total_points` do usuário (soma de todas as categorias).
4. Grava log de auditoria.

---

## 9. Integração com API Externa (Dados da Copa)

### 9.1 Provedor Recomendado

**API-Football** (via RapidAPI) — plano gratuito suficiente para desenvolvimento, plano básico para produção.

- Endpoint de partidas: `GET /fixtures?league=1&season=2026`
- Endpoint de artilheiros: `GET /players/topscorers?league=1&season=2026`
- Endpoint de estatísticas: `GET /fixtures/statistics?fixture={id}`

### 9.2 Estratégia de Sincronização

- **Cron job** (Vercel Cron ou Supabase Edge Function agendada): roda a cada 5 minutos durante jogos ao vivo, a cada 1 hora fora de jogos.
- Busca partidas com status `live` ou `finished` na API.
- Atualiza `matches` no banco se houver mudança.
- Dispara `recalculate_match_points` automaticamente ao detectar partida finalizada.
- Atualiza tabela `players` com estatísticas (gols, assistências, cartões).

### 9.3 Fallback Manual

Se a API falhar ou atrasar, o admin pode inserir resultados manualmente via painel. O processamento de pontuação é o mesmo.

### 9.4 Variáveis de Ambiente

```env
RAPIDAPI_KEY=
RAPIDAPI_HOST=api-football-v1.p.rapidapi.com
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
CRON_SECRET=
```

---

## 10. Fluxos Principais

### 10.1 Novo Usuário

```
Admin adiciona usuário (email) →
Supabase envia email de convite →
Usuário clica no link e define senha (ou usa Google) →
Perfil criado com role 'player' →
Usuário acessa /dashboard →
Preenche palpites antes do deadline
```

### 10.2 Inserção de Resultado (Admin)

```
Admin acessa /admin/partidas →
Seleciona partida encerrada →
Insere placar final →
Salva →
Sistema: recalculate_match_points() →
Pontos atualizados →
Supabase Realtime notifica todos os clientes →
Leaderboard atualiza em tempo real
```

### 10.3 Sincronização Automática

```
Cron dispara a cada 5 min →
Busca partidas "live/finished" na API-Football →
Compara com banco →
Se mudou: atualiza match + dispara recalculo →
Leaderboard atualiza
```

---

## 11. Cronograma de Desenvolvimento (Fases)

### Fase 1 — MVP (prioridade máxima, antes de 11/06/2026)

- [ ] Setup Next.js + Supabase + Auth
- [ ] Schema completo do banco + RLS
- [ ] Seed: 48 times, 12 grupos, 104 partidas
- [ ] Cadastro de usuários pelo admin
- [ ] Tela de palpites (partidas + grupos + torneio)
- [ ] Deadline automático (11/06/2026 16:00 BRT)
- [ ] Painel admin básico (inserção de resultados)
- [ ] Engine de pontuação
- [ ] Dashboard com leaderboard básico

### Fase 2 — Produto Completo

- [ ] Integração API-Football (sync automático)
- [ ] Leaderboard em tempo real (Supabase Realtime)
- [ ] Visualização de grupos com tabela dinâmica
- [ ] Calendário completo de partidas
- [ ] Estatísticas (artilheiros, assistências, cartões)
- [ ] Bracket do mata-mata
- [ ] Design final (landing page, dark mode, animações)
- [ ] Responsividade mobile

### Fase 3 — Polimento e Escala

- [ ] Configuração de pontuação via painel (editável)
- [ ] Gráfico de evolução de pontuação por usuário
- [ ] Log de auditoria completo
- [ ] Recálculo em massa de pontuação
- [ ] Notificações (email ou push) de resultado

---

## 12. Considerações de Performance e Segurança

- **RLS obrigatório** em todas as tabelas — nenhuma tabela acessível sem política definida.
- **Rate limiting** nas rotas de API (Next.js middleware).
- **Palpites imutáveis** após o deadline — validação no servidor, nunca só no cliente.
- **Recálculo idempotente** — pode rodar N vezes sem duplicar pontos.
- **Cache de dados estáticos** (times, grupos) via `unstable_cache` do Next.js.
- **Dados ao vivo** sem cache ou com cache de 30s máximo.
- **Imagens de bandeiras**: servidas via CDN ou otimizadas com `next/image`.

---

## 13. Decisões Abertas (a definir antes de começar)

| # | Decisão | Opções |
|---|---|---|
| 1 | Provedor de bandeiras/imagens dos times | Flagcdn, CountryFlags.io, ou SVGs locais |
| 2 | Como lidar com times do mata-mata ainda não definidos | Placeholder "Vencedor Grupo X" |
| 3 | Notificações ao usuário quando pontos são atualizados | Email via Resend / push / nenhuma por ora |
| 4 | Nome do produto / domínio | A definir |

---

## 14. Estrutura de Pastas Sugerida

```
bolao-copa2026/
├── app/
│   ├── (auth)/
│   │   └── login/
│   ├── (public)/
│   │   └── page.tsx          # Landing
│   ├── (app)/
│   │   ├── dashboard/
│   │   ├── palpites/
│   │   ├── grupos/
│   │   ├── partidas/
│   │   ├── chaveamento/
│   │   └── estatisticas/
│   └── admin/
│       ├── usuarios/
│       ├── partidas/
│       ├── estatisticas/
│       ├── pontuacao/
│       └── logs/
├── components/
│   ├── ui/                   # shadcn/ui
│   ├── match-card.tsx
│   ├── group-table.tsx
│   ├── leaderboard-row.tsx
│   ├── bracket-tree.tsx
│   └── stat-card.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── types.ts          # gerado pelo Supabase CLI
│   ├── scoring/
│   │   └── engine.ts         # lógica de pontuação
│   └── api-football/
│       └── sync.ts           # integração API externa
├── supabase/
│   ├── migrations/
│   └── seed.sql
└── public/
    └── flags/                # SVGs das seleções
```

---

*Este PRD foi gerado a partir de sessão de brainstorm em 2026-05-15.*  
*Stack: Next.js 15 + Supabase + TypeScript + Tailwind CSS v4.*
