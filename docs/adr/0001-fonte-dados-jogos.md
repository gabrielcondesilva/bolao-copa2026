# Fonte de dados de jogos via API externa com override manual

Optamos por consumir os dados de jogos, resultados e classificação de uma API externa gratuita (ex: football-data.org) em vez de scraping do site da FIFA ou entrada totalmente manual. O site da FIFA bloqueia embedding e scraping é frágil a mudanças de layout. O Admin pode editar qualquer resultado importado pela API para corrigir erros pontuais, eliminando dependência crítica de uptime da API durante o torneio.

## Considered Options

- **Scraping do site FIFA:** frágil, provável violação de ToS, bloqueado por rate limiting
- **iFrame/embed:** bloqueado via `X-Frame-Options` no site da FIFA
- **Entrada 100% manual:** confiável, mas muito trabalhosa para 104 jogos
- **API externa + override manual (escolhido):** automação com válvula de escape para erros
