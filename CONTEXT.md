# Bolão Copa 2026

Aplicação web para gerenciar um bolão da Copa do Mundo FIFA 2026 de seleções entre um grupo fechado de amigos, com coleta de palpites, cálculo automático de pontuação e ranking em tempo real.

O bolão tem aproximadamente **50 participantes**. Escala pequena — cálculos de ranking e Bracket Simulado podem ser feitos on-the-fly sem cache agressivo.

## Language

### Participantes e Acesso

**Participante**:
Usuário cadastrado pelo Admin que faz palpites e acompanha o ranking.
_Evitar_: usuário, jogador, apostador

**Admin**:
Único perfil com acesso ao painel administrativo; cadastra Participantes e insere resultados oficiais.
_Evitar_: administrador, moderador

### Torneio

**Torneio**:
A Copa do Mundo FIFA 2026 de seleções (48 times, formato com 16-avos de final).
_Evitar_: Copa, Mundial, Copa do Mundo de Clubes

**Fase de Grupos**:
Primeira etapa do Torneio, com 48 times em 12 grupos, totalizando 72 jogos.
_Evitar_: 1ª etapa, grupos

**Fases Eliminatórias**:
Etapas seguintes à Fase de Grupos: 16-avos, Oitavas, Quartas, Semifinais, Disputa de 3º e Final.
_Evitar_: mata-mata, 2ª etapa, playoff

### Dados do Torneio

**Fonte de Dados**:
API externa gratuita (ex: football-data.org) usada para importar jogos, resultados e classificação. O Admin pode editar qualquer resultado importado para corrigir erros.
_Evitar_: scraping, embed, integração direta com FIFA

### Palpites

**Palpite de Jogo**:
Previsão de placar (gols casa × gols fora) para um jogo específico.
_Evitar_: aposta, chute, resultado

**Classificados Derivados**:
Times que avançam de fase, calculados automaticamente pelo sistema a partir dos Palpites de Jogo do Participante — nunca uma seleção explícita. O sistema aplica as regras da FIFA (pontos, saldo de gols, etc.) sobre os placares previstos para determinar quem passa.
_Evitar_: palpite de classificados, seleção de classificados, bracket manual

**Bracket Simulado**:
Visão dentro da aba Palpites mostrando o universo do Participante fase a fase. Antes da Fase de Grupos terminar: usa os Palpites de Jogo para simular quem classificaria e monta o chaveamento completo via Tabela de Combinações dos 16-avos. Após cada fase terminar (todos os jogos encerrados com resultados oficiais), aquela parte do bracket trava e mostra os palpites do Participante congelados. Nas Fases Eliminatórias, os confrontos exibidos são os jogos reais (chaveamento oficial), mas os placares mostrados são os Palpites de Jogo do Participante para aqueles jogos.
_Evitar_: simulação, projeção, chaveamento

**Ranking FIFA de Referência**:
Snapshot do ranking FIFA na data do sorteio, armazenado no sistema e imutável durante o Torneio. Usado como penúltimo critério de desempate na simulação do Bracket Simulado — após pontos, confronto direto, saldo de gols e gols marcados. Fair play é ignorado por não ser derivável dos Palpites de Jogo.
_Evitar_: ranking atual, ranking FIFA em tempo real

**Override de Classificado**:
Ação disponível no painel Admin para reordenar manualmente os Classificados Derivados quando o desempate automático produz resultado incorreto ou ambíguo. Funciona como lista reordenável sobre o resultado calculado automaticamente.
_Evitar_: edição manual de classificados, correção de classificados

**Palpite Final**:
Apostas de longo prazo feitas na 1ª Etapa: campeão, vice, 3º colocado, 4º colocado, artilheiro e craque da Copa. São entradas explícitas, independentes dos palpites de placar, e ficam travadas após o prazo da Fase de Grupos.
_Evitar_: palpite especial, palpite adiantado

**Prazo de Fase**:
Data e hora limite para submissão de palpites de uma fase, configurável pelo Admin. Após o prazo, a fase trava e nenhum palpite pode ser alterado. Participantes que não submeteram simplesmente não recebem pontos nos jogos não preenchidos — nenhum placar padrão é atribuído.
_Evitar_: deadline, data limite, prazo global

**Visibilidade de Palpites**:
Palpites de um Participante ficam visíveis para todos os outros a partir do momento em que o **primeiro jogo da fase começa** — não no Prazo de Fase. Isso garante que Participantes com Exceção de Prazo não vejam os palpites alheios antes de encerrar o próprio preenchimento.
_Evitar_: liberação de palpites, publicação de palpites

**Exceção de Prazo**:
Desbloqueio temporário por Participante concedido pelo Admin após o Prazo de Fase, permitindo preenchimento tardio antes do primeiro jogo daquela fase começar. O Admin deve re-travar manualmente após a janela de exceção.
_Evitar_: liberação de prazo, extensão de prazo

### Regras de Jogo

**Resultado de Prorrogação**:
Em jogos das Fases Eliminatórias que vão a prorrogação, o placar considerado para pontuação é o placar ao final dos 120 minutos — não importa quem venceu nos pênaltis. Um empate 1×1 após 120 min vale como resultado "1×1" para todos os efeitos.
_Evitar_: resultado final, placar após pênaltis

### Pontuação

**Placar Cravado**:
Acerto do placar exato de um jogo. Vale 10 pontos. Implica Resultado Correto.
_Evitar_: placar exato, acerto total

**Resultado Correto**:
Acerto do vencedor (ou empate) sem acertar o placar exato. Vale 5 pontos. Um empate previsto corretamente sem acertar o placar exato também vale 5 pts.
_Evitar_: acerto parcial, resultado certo

**Critérios de Desempate** (em ordem):
1. Mais Placares Cravados
2. Mais Resultados Corretos
3. Melhor pontuação na Fase de Grupos
4. Melhor pontuação nas Fases Eliminatórias
5. Sorteio
_Evitar_: diferença de gols, acerto de gols parcial (regras removidas por complexidade desnecessária)
