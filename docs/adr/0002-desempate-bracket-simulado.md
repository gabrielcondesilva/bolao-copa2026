# Simulação de desempate no Bracket Simulado usa Ranking FIFA fixo com Override Admin

O Bracket Simulado aplica as regras oficiais de desempate da FIFA em ordem: pontos → confronto direto (pontos, saldo, gols no jogo entre os times empatados) → saldo de gols geral → gols marcados geral. Fair play é ignorado — participantes só palpitam placares, não cartões, então o critério não é simulável. Quando o empate persiste, o desempate cai no Ranking FIFA de Referência (snapshot da data do sorteio, imutável). Se ainda assim houver empate, o Admin pode reordenar manualmente os Classificados Derivados via painel.

## Considered Options

- **Ranking FIFA ao vivo:** descartado — misturaria dados reais do torneio com a simulação do participante, quebrando a consistência da visão.
- **Desempate determinístico puro (ex: ordem alfabética):** descartado — o Ranking FIFA de Referência é mais justo e alinhado com as regras reais, sendo suficiente para a escala de ~50 participantes.
- **Sem override manual:** descartado — fair play ausente na simulação cria casos ambíguos que o Admin precisa poder corrigir sem deploy.
