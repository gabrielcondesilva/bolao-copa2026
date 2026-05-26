<div align="center">

# ⚽ Bolão Copa 2026

**Plataforma web completa de bolão para a Copa do Mundo FIFA 2026**

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38BDF8?logo=tailwindcss)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)

</div>

---

## Sobre o projeto

Sistema de bolão desenvolvido para um grupo fechado de ~50 participantes. Cada participante registra palpites de placar para todos os jogos da Copa; o sistema calcula pontuação, ranking e classificação automaticamente — sem planilha, sem apuração manual.

---

## Funcionalidades

| | Funcionalidade | Descrição |
|---|---|---|
| 🎯 | **Palpites de Jogo** | Preenche placar previsto para cada partida, fase a fase |
| 🌳 | **Bracket Simulado** | Monte seu bracket clicando em quem avança em cada fase do mata-mata |
| 🏆 | **Ranking em tempo real** | Pontuação calculada on-the-fly — sem cache, sempre atualizada |
| 🔒 | **Prazo por Fase** | Admin configura deadline de cada fase; palpites bloqueiam automaticamente |
| 👁️ | **Visibilidade controlada** | Palpites alheios só aparecem após o prazo — sem copiar do líder |
| ⚡ | **Exceção individual** | Admin libera prazo para um participante específico quando necessário |
| 📊 | **Classificação dos grupos** | Tabela de grupos com critérios de desempate FIFA |
| 🛠️ | **Painel Admin** | Gerencia jogos, participantes, prazos, classificados e premiação |

---

## Como a pontuação funciona

| Acerto | Pontos |
|---|---|
| Placar exato (ex: 2×1 → 2×1) | **10 pts** |
| Resultado certo, placar errado (ex: previu 3×1, foi 2×1) | **5 pts** |
| Resultado errado | **0 pts** |
| Classificados corretos por fase | Pontos extras |
| Palpite final correto (campeão, vice, 3º, 4º) | Pontos extras |

Desempate: pontos totais → placares exatos → resultados certos.

---

## Stack

- **Framework:** Next.js 16 — App Router, Server Actions, Server Components
- **Linguagem:** TypeScript
- **Banco de dados:** Supabase (PostgreSQL + Auth + RLS)
- **Estilo:** Tailwind CSS v4
- **Deploy:** Vercel
- **Testes:** Vitest

---

## Arquitetura

Os motores de lógica são **funções puras** isoladas do banco de dados — sem side effects, testáveis com dados de fixture.

| Módulo | O que faz |
|---|---|
| `scoring.ts` | `scoreMatch(previsto, oficial) → 0 \| 5 \| 10` |
| `standings.ts` | Classificação dos grupos com cadeia completa de desempate FIFA |
| `bracket-simulator.ts` | Simula o bracket completo a partir dos palpites de jogo |
| `classification-scorer.ts` | Calcula pontos por classificados derivados |
| `combinations-495.ts` | Tabela estática dos 495 chaveamentos possíveis nos 16-avos (Anexo C FIFA 2026) |

O ranking é computado on-the-fly via query composta — sem tabela de cache. Supabase Realtime notifica os clientes quando resultados mudam.

---

## Decisões de Arquitetura

Documentadas em `docs/adr/`:

- `0001` — Fonte externa para dados de jogos + override admin
- `0002` — Regras de desempate no Bracket Simulator (ordem FIFA)
- `0003` — Chaveamento dos 16-avos via tabela estática de 495 combinações
- `0004` — Palpite não submetido permanece `null` (sem default 0×0)
- `0005` — Ranking on-the-fly, sem tabela de cache

---

<div align="center">
Feito com ☕ para o Bolão Copa 2026
</div>
