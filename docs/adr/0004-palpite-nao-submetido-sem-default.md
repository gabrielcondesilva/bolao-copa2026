# Palpite não submetido não recebe placar padrão

Participantes que não preencherem seus palpites antes do Prazo de Fase simplesmente não recebem pontos naqueles jogos — o sistema não atribui nenhum placar padrão (como 0×0). O prazo é configurável pelo Admin e pode ser estendido globalmente para todos os participantes da fase. Para casos individuais, o Admin pode conceder uma Exceção de Prazo, desbloqueando temporariamente o preenchimento de um participante específico e re-travando manualmente depois.

## Considered Options

- **Atribuir 0×0 como placar padrão:** descartado — jogos que terminam 0×0 dariam pontos indevidos a participantes que nunca preencheram, distorcendo o ranking.
- **Sem default, sem exceção (prazo rígido):** descartado — há janelas legítimas entre o prazo e o primeiro jogo da fase onde o Admin pode querer liberar preenchimento tardio sem prejudicar a integridade do bolão.
