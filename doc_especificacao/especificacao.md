# Bolão da Copa 2026 — Especificação do Projeto

## Resumo

| Campo | Valor |
|---|---|
| Projeto | Bolão da Copa 2026 - Aplicação Web |
| Objetivo | Digitalização e automação do Bolão da Copa entre amigos |
| Stack principal | Next.js / React, Supabase, Vercel |
| Design | Mobile First, Light Mode, Header escuro estilo FIFA |
| Abas principais | Jogos, Classificação, Palpites, Ranking |

---

## 1. Visão Geral do Projeto

O Bolão da Copa 2026 é uma aplicação web desenvolvida para substituir o processo manual de coleta de palpites entre amigos durante a Copa do Mundo FIFA 2026. A ideia surgiu da necessidade de automatizar o preenchimento dos resultados, calcular pontuações em tempo real e exibir um ranking dinâmico dos participantes.

A aplicação deve ser intuitiva, moderna e fiel ao design do site oficial da FIFA, utilizando o mesmo padrão visual com header escuro e layout clean.

---

## 2. Stack Tecnológica

### Frontend
- **Next.js (React)** — Framework principal com suporte a SSR e SSG
- **Tailwind CSS** — Estilização responsiva Mobile First
- **Design:** Light Mode com header escuro (inspirado no site FIFA)

### Backend & Banco de Dados
- **Supabase** — Backend as a Service
  - Banco de dados PostgreSQL gerenciado
  - Autenticação de usuários integrada
  - Row Level Security (RLS) para controle de acesso
  - Realtime para atualizações ao vivo no ranking

### Deploy & Infraestrutura
- **Vercel** — Hospedagem e CI/CD com deploy automático
- **Repositório:** GitHub

### Integração Externa
- Site FIFA — para Jogos e Classificação
  - Jogos: https://www.fifa.com/pt/tournaments/mens/worldcup/canadamexicousa2026/scores-fixtures?country=BR&wtw-filter=ALL
  - Classificação: https://www.fifa.com/pt/tournaments/mens/worldcup/canadamexicousa2026/standings

---

## 3. Autenticação e Acesso

### Página de Login
- Layout centralizado, clean e responsivo
- Logo da Copa do Mundo 2026 em destaque
- Campos: E-mail e Senha
- Link "Esqueceu a senha?" com fluxo de recuperação por email
- Sem opção de auto-cadastro — apenas o admin cadastra usuários

### Fluxo de Primeiro Acesso
- Admin cadastra o usuário com: nome, e-mail e senha temporária
- No primeiro login, o usuário pode alterar a senha
- Recuperação de senha via e-mail (Supabase Auth)

### Painel Administrativo
Área exclusiva para o usuário com perfil de "admin". Acessível por uma rota protegida (ex: /admin).
- Cadastrar novos participantes (nome, email, senha inicial)
- Visualizar lista de todos os participantes
- Gerenciar prazos por fase
- Inserir resultados oficiais dos jogos (para cálculo de pontuação)
- Liberar visualização dos palpites após o prazo de cada fase

---

## 4. Estrutura da Aplicação — Abas

### 4.1 Header
O header será fixo no topo, com design escuro (igual ao site da FIFA), exibindo:
- Logo da Copa do Mundo 2026 (à esquerda)
- Navegação com 4 abas: **Jogos | Classificação | Palpites | Ranking**
- Indicador da aba ativa
- Menu hamburguer no mobile para navegação responsiva

### 4.2 Aba — Jogos
Exibe os jogos da Copa do Mundo importados via API externa (ver ADR-0001). O Admin pode corrigir qualquer resultado importado.
- Agrupamento por data e fase
- Exibição de horários, times, placares e estádio
- Filtros por fase (Fase de Grupos, 16-avos, Oitavas, Quartas, Semifinais, Final)
- Atualização após inserção/correção de resultado pelo Admin

### 4.3 Aba — Classificação
Exibe a tabela de classificação dos grupos calculada a partir dos resultados importados via API externa (ver ADR-0001).
- Todos os grupos (A a L) com suas respectivas tabelas
- Colunas: J, V, E, D, GP, GC, SG, Pts
- Atualizada conforme o Admin insere os resultados oficiais

### 4.4 Aba — Palpites

#### Fase de Grupos (1ª Etapa)
- Palpite do placar de cada um dos 72 jogos da fase de grupos
- Indicação do Campeão, Vice, 3º e 4º colocados (Palpite Final)
- Indicação do Craque da Copa e Artilheiro (Palpite Final, conforme eleição da FIFA)

> Os classificados por fase (quem avança para os 16-avos, oitavas, quartas etc.) são calculados automaticamente pelo sistema a partir dos palpites de placar — o participante não faz seleção explícita. Ver Classificados Derivados no CONTEXT.md.

#### Fases Eliminatórias (2ª Etapa)
- Palpite dos resultados de cada jogo das fases eliminatórias
- Disponível a cada nova fase, com prazo específico
- Em caso de prorrogação + pênaltis: apenas o resultado dos 120 minutos é considerado

#### Controle de Prazo

| Fase | Prazo |
|---|---|
| 1ª Etapa (Fase de Grupos) | Até 10/06 às 23h59 |
| Oitavas de Final | Até 29/06 às 23h59 |
| Quartas de Final | Até 05/07 às 23h59 |
| Semifinais | Até 09/07 às 23h59 |
| Final | Até 14/07 às 23h59 |

### 4.5 Aba — Ranking
Exibe a classificação em tempo real de todos os participantes do bolão.
- Lista ordenada por total de pontos
- Colunas: Posição, Nome, Pontos Totais, Placares Certos, Resultados Certos
- Atualização em tempo real (Supabase Realtime)

#### Visualização de Palpites por Usuário
A partir do início do primeiro jogo de cada fase, os palpites de todos os participantes ficam visíveis. No ranking, ao clicar no nome de um usuário, abre-se um modal/dropdown com:
- Lista de jogos com o palpite do usuário
- Indicação visual do resultado de cada palpite:
  - 🟢 Verde: Placar cravado (10 pts)
  - 🟡 Amarelo: Resultado correto, placar errado (5 pts)
  - 🔴 Vermelho: Palpite errado (0 pts)
- Pontuação total acumulada
- Classificados acertados em cada fase

---

## 5. Regras de Pontuação

### 5.1 Palpites de Resultados dos Jogos

| Evento | Pontos | Exemplo |
|---|---|---|
| Acertar o placar exato do jogo | 10 pts | Apostou 2x1, terminou 2x1 |
| Acertar o resultado (vencedor ou empate) | 5 pts | Apostou 3x2, terminou 1x0 |
| Errar placar e resultado | 0 pts | Apostou 1x0, terminou 1x2 |

### 5.2 Classificados por Fase

| Fase | Pts/time | Total máx |
|---|---|---|
| Classificados para as 16-avos (32 times) | 2 pts | 64 pts |
| Classificados para as oitavas (16 times) | 4 pts | 64 pts |
| Classificados para as quartas (8 times) | 6 pts | 48 pts |
| Semifinalistas (4 times) | 8 pts | 32 pts |
| Disputa de 3º e 4º lugar (2 times) | 10 pts | 20 pts |
| Finalistas (2 times) | 12 pts | 24 pts |

### 5.3 Classificação Final

| Posição | Pontos |
|---|---|
| 4º colocado | 5 pts |
| 3º colocado | 10 pts |
| Vice-Campeão | 20 pts |
| Campeão | 40 pts |

### 5.4 Prêmios Extras
- Artilheiro da Copa (eleito pela FIFA): 10 pontos
- Craque da Copa (eleito pela FIFA): 10 pontos

### 5.5 Pontuação Total Máxima

| Categoria | Máximo | % |
|---|---|---|
| Resultados dos jogos (104 jogos) | 1040 pts | 75% |
| Classificados por fase | 252 pts | 18.2% |
| Classificação final (1º ao 4º) | 75 pts | 5.4% |
| Extras (Artilheiro + Craque) | 20 pts | 1.4% |
| **TOTAL** | **1387 pts** | **100%** |

---

## 6. Critérios de Desempate

Em caso de empate na pontuação total, os seguintes critérios serão aplicados em ordem:

1. Mais Placares Cravados
2. Mais Resultados Corretos
3. Melhor pontuação na Fase de Grupos
4. Melhor pontuação nas Fases Eliminatórias
5. Sorteio

---

## 7. Modelo de Dados — Supabase

### Tabelas Principais

**users**
`id, nome, email, senha_hash, is_admin, created_at`

**jogos**
`id, fase, grupo, time_casa, time_fora, data_hora, estadio, placar_casa, placar_fora, finalizado`

**palpites_jogos**
`id, user_id, jogo_id, placar_casa, placar_fora, pontos_obtidos, created_at, updated_at`

**palpites_finais**
`id, user_id, campao, vice, terceiro, quarto, artilheiro, craque, pontos_obtidos`

---

## 8. Fluxo do Usuário

### Participante
1. Recebe e-mail com credenciais de acesso do admin
2. Faz login na aplicação
3. Acessa a aba "Palpites" e preenche seus palpites para a 1ª etapa
4. Salva os palpites (editável até o prazo)
5. Acompanha os jogos na aba "Jogos" e a tabela de grupos em "Classificação"
6. Acompanha sua posição em tempo real na aba "Ranking"
7. A cada fase eliminatória, acessa novamente "Palpites" para a 2ª etapa
8. Após o prazo de cada fase, pode visualizar os palpites dos outros participantes

### Administrador
1. Acessa o painel admin em /admin
2. Cadastra todos os participantes com nome, e-mail e senha
3. Insere os resultados oficiais dos jogos para cálculo de pontuação
4. Monitora prazos e libera visualização de palpites

---

## 9. Diferenciais e Decisões de Design

- Layout inspirado no site oficial da FIFA — familiaridade para os usuários
- Mobile First — experiência otimizada para celular
- Atualização em tempo real do ranking via Supabase Realtime
- Transparência pós-prazo: palpites de todos ficam visíveis após o prazo
- Indicadores visuais claros: verde (placar certo), amarelo (resultado certo), vermelho (errou)
- Sem cadastro livre: apenas o admin cadastra, garantindo controle do grupo
- Supabase Auth para recuperação de senha de forma segura
- Deploy automático na Vercel com zero configuração de servidor

---

## 10. Próximos Passos

1. Criar repositório no GitHub e configurar projeto Next.js
2. Configurar projeto no Supabase (tabelas, RLS, Auth)
3. Implementar página de login e fluxo de autenticação
4. Desenvolver o header e estrutura de navegação
5. Integrar aba Jogos (embed ou scraping do site FIFA)
6. Integrar aba Classificação (embed ou scraping do site FIFA)
7. Desenvolver aba Palpites — Fase de Grupos
8. Desenvolver aba Ranking com modal de palpites por usuário
9. Implementar cálculo automático de pontuação
10. Desenvolver painel Admin
11. Desenvolver aba Palpites — Fases Eliminatórias
12. Testes, ajustes de design e deploy na Vercel
