# Chaveamento dos 16-avos usa tabela estática das 495 combinações da FIFA

O chaveamento dos 16-avos de final para terceiros colocados depende de quais 8 dos 12 grupos produzem terceiros classificados — gerando 495 combinações possíveis (Anexo C do regulamento FIFA 2026). Optamos por codificar essa tabela como dado estático no sistema para que o Bracket Simulado consiga montar o caminho completo até a final antes mesmo da Fase de Grupos terminar.

Após a Fase de Grupos, o Admin confirma os confrontos reais no painel (que geralmente baterão com a tabela estática) e pode ajustar qualquer confronto individualmente via Override de Classificado se necessário.

## Considered Options

- **Aguardar o fim da Fase de Grupos e o Admin configurar o bracket manualmente:** mais simples, mas impede o Bracket Simulado de mostrar o caminho completo antes das oitavas, perdendo o principal valor visual da feature.
- **Tabela estática + Override Admin (escolhido):** permite Bracket Simulado completo desde o início; o override é a válvula de escape para qualquer divergência com o resultado real.
