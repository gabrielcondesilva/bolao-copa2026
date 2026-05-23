# Ranking calculado on-the-fly, sem tabela de cache

O ranking é calculado diretamente via query a partir das tabelas `palpites_jogos`, `jogos` e demais palpites — sem uma tabela `ranking_cache` intermediária. Com ~50 participantes, a query é executada em milissegundos no Supabase. O Supabase Realtime notifica os clientes quando `jogos` é atualizado (novo resultado inserido pelo Admin) e os clientes refazem a query de ranking.

A tabela `ranking_cache` foi removida do modelo de dados para eliminar uma fonte de bugs (cache desatualizado após correção de resultado) e simplificar a manutenção.

## Considered Options

- **ranking_cache (descartado):** leitura mais rápida, mas requer re-cálculo e escrita sincronizada sempre que um resultado mudar — complexidade não justificada pela escala de 50 participantes.
- **On-the-fly (escolhido):** query única, sem estado derivado para manter, e com performance suficiente para a escala do projeto.
