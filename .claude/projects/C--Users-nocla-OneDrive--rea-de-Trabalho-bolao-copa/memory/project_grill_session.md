---
name: grill-session-progress
description: Progresso da sessão grill-with-docs sobre a especificação do Bolão Copa 2026
metadata:
  type: project
---

Sessão de grill da especificação iniciada em 2026-05-22. O arquivo CONTEXT.md e docs/adr/0001 já foram criados com as decisões abaixo.

**Decisões já resolvidas:**
1. O projeto é para a Copa do Mundo FIFA 2026 de seleções (não Club World Cup). README corrigido.
2. Dados de jogos/resultados via API externa gratuita (ex: football-data.org) + override manual pelo Admin. ADR 0001 criado.
3. Prorrogação/pênaltis: placar dos 120 minutos é o resultado considerado, não quem venceu nos pênaltis. Opção A confirmada.
4. Classificados derivados: o sistema calcula automaticamente quem avança com base nos palpites de placar — não há seleção explícita de times pelo participante. Feature "Bracket Simulado" adicionada.
5. Palpite Final (campeão, vice, 3º, 4º, artilheiro, craque): seleção explícita feita na 1ª Etapa, travada após prazo dos grupos. Opção B confirmada.
6. Regras de pontuação simplificadas: 10 pts placar cravado, 5 pts resultado correto, 0 pts erro. Critérios de desempate: 1) placares cravados, 2) resultados corretos, 3) pontos fase de grupos, 4) pontos mata-mata, 5) sorteio. Regras de diferença de gols removidas.
7. ~50 participantes no bolão.

**Ainda a cobrir (próximas perguntas):**
- Tabela palpites_classificados no modelo de dados: como armazenar classificados derivados? View ou tabela materializada?
- Bracket Simulado: nível de detalhe da UI — full tree ou só standings?
- Como funciona o palpite eliminatório: o participante preenche quando o chaveamento é publicado (times reais), fase a fase?
- ranking_cache: computado on-the-fly ou batch? Triggers Supabase?
- Palpites editáveis até o prazo?
- Admin panel: funcionalidades específicas além do descrito?

**Why:** Sessão pausada pelo usuário. Retomar com `/grill-with-docs` referenciando `@doc_especificacao/especificacao.md` e o `CONTEXT.md` existente.
**How to apply:** Quando o usuário voltar e pedir para continuar, retomar pelas perguntas ainda abertas acima, uma de cada vez.
