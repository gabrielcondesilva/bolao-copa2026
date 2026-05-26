<div align="center">

# ⚽ Bolão Copa 2026

**Plataforma completa de bolão para a Copa do Mundo FIFA 2026**  
Palpites de placar, ranking automático, bracket simulado e muito mais — para até 50 participantes.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38BDF8?logo=tailwindcss)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)

</div>

---

## ✨ O que é isso?

O **Bolão Copa 2026** é uma aplicação web feita para grupos de amigos ou colegas que querem disputar um bolão durante a Copa do Mundo. Cada participante registra os palpites de placar para todos os jogos, e o sistema calcula a pontuação automaticamente conforme os resultados oficiais saem.

Nada de planilha. Nada de apuração manual. Tudo em tempo real.

---

## 🚀 Funcionalidades

| Funcionalidade | Descrição |
|---|---|
| 🎯 **Palpites de Jogo** | Participantes inserem placar previsto para cada partida, fase a fase |
| 🏆 **Ranking Automático** | Pontuação calculada em tempo real — sem cache, sempre atualizada |
| 🌳 **Bracket Simulado** | Monte seu bracket interativo clicando em quem vai avançar em cada fase |
| 🔒 **Prazo por Fase** | Admin configura o prazo de cada fase; após o prazo, palpites são bloqueados |
| 👁️ **Visibilidade Controlada** | Palpites alheios só ficam visíveis após o prazo da fase — sem cola |
| ⚡ **Exceção de Prazo** | Admin pode liberar prazo individualmente para um participante |
| 🛠️ **Painel Admin** | Gerenciamento de jogos, participantes, prazos, classificados e premiação |
| 📱 **Responsivo** | Interface adaptada para celular e desktop |

---

## 🧮 Como a pontuação funciona

| Acerto | Pontos |
|---|---|
| Placar exato (ex: 2×1) | **10 pts** |
| Resultado certo, placar errado (ex: previu 3×1, foi 2×1) | **5 pts** |
| Errou o resultado | **0 pts** |
| Classificados corretos por fase | Pontos extras |
| Palpite final correto (campeão, vice, 3º, 4º) | Pontos extras |

> Desempate por ordem de: pontos totais → placares exatos → resultados certos.

---

## 🗂️ Estrutura do Projeto

```
src/
├── app/
│   ├── jogos/              # Agenda de jogos
│   ├── palpites/           # Palpites de jogo e bracket simulado
│   ├── ranking/            # Ranking geral e perfil de participantes
│   ├── classificacao/      # Classificação dos grupos
│   ├── admin/              # Painel administrativo
│   └── actions/            # Server Actions (salvar palpites, auth, etc.)
├── lib/
│   ├── engines/
│   │   ├── scoring.ts              # Motor de pontuação (função pura)
│   │   ├── standings.ts            # Classificação dos grupos com desempate FIFA
│   │   ├── bracket-simulator.ts    # Simulação do bracket
│   │   └── classification-scorer.ts # Pontos por classificados
│   ├── data/
│   │   └── combinations-495.ts     # Tabela estática dos 495 chaveamentos possíveis (FIFA 2026)
│   └── supabase/           # Clientes server/browser
└── components/             # Componentes reutilizáveis
```

---

## 🏗️ Stack Técnica

- **Framework:** [Next.js 16](https://nextjs.org) — App Router, Server Actions, Server Components
- **Linguagem:** TypeScript
- **Banco de dados:** [Supabase](https://supabase.com) (PostgreSQL + Auth + RLS)
- **Estilo:** Tailwind CSS v4
- **Deploy:** [Vercel](https://vercel.com)
- **Testes:** [Vitest](https://vitest.dev)

> Os motores de pontuação e simulação são **funções puras** sem dependência de banco de dados — testáveis isoladamente com dados de fixture.

---

## ⚙️ Rodando localmente

### Pré-requisitos

- Node.js 20+
- Conta no [Supabase](https://supabase.com)

### Instalação

```bash
# Clone o repositório
git clone https://github.com/gabrielxconde/bolao-copa2026.git
cd bolao-copa2026

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env.local
# Preencha NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### Banco de dados

```bash
# Aplique as migrations no seu projeto Supabase
npx supabase db push
```

### Desenvolvimento

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

---

## 🧪 Testes

```bash
# Rodar todos os testes
npm test

# Rodar um arquivo específico
npm test -- src/lib/engines/scoring.test.ts
```

---

## 🔑 Comandos úteis

| Comando | O que faz |
|---|---|
| `npm run dev` | Sobe o servidor local |
| `npm run build` | Build de produção |
| `npm run lint` | Lint com ESLint |
| `npm test` | Suite de testes com Vitest |

---

## 📐 Decisões de Arquitetura

As principais decisões estão documentadas em [`docs/adr/`](docs/adr/):

- `0001` — Fonte externa para dados de jogos + override admin
- `0002` — Regras de desempate no Bracket Simulator (ordem FIFA)
- `0003` — Chaveamento dos 16-avos via tabela estática de 495 combinações
- `0004` — Palpite não submetido permanece `null` (sem default 0×0)
- `0005` — Ranking calculado on-the-fly, sem tabela de cache

---

<div align="center">

Feito com ☕ para o Bolão Copa 2026

</div>
