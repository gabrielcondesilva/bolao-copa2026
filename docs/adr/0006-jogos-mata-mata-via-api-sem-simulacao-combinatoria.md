# Jogos do mata-mata buscados via API — sem tabela de combinações

Os confrontos das Fases Eliminatórias (16-avos em diante) serão obtidos automaticamente da mesma API externa usada para os jogos da Fase de Grupos (ver ADR-0001). O Admin pode corrigir qualquer confronto individualmente pelo painel caso a API retorne dados incorretos. A tabela estática das 495 combinações (Anexo C do regulamento FIFA 2026) não será implementada.

Como consequência, o Bracket Simulado **não exibirá** uma projeção completa do chaveamento antes do fim da Fase de Grupos — os confrontos eliminatórios só aparecem quando a API os publicar. Dentro de cada fase eliminatória, o participante vê os confrontos reais e insere seus palpites de placar; a pontuação de Classificados Derivados é calculada comparando quem o participante previu que avançaria (via seus palpites) com quem realmente avançou.

## Considered Options

- **Tabela estática das 495 combinações (descartada):** permitiria mostrar o chaveamento completo antes da Fase de Grupos terminar, mas exige manutenção de dado estático extenso, lógica de lookup complexa e torna o sistema frágil a qualquer mudança de formato da FIFA.
- **API + override manual (escolhido):** mais simples, consistente com ADR-0001, e suficiente para o escopo do bolão (~50 participantes). A perda do preview antecipado é aceitável.
