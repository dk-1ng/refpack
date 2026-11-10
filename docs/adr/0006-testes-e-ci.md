# ADR-0006: Testes e CI

- **Estado:** Aceito. No item 2, o trecho "só com Chromium" foi superado pelo ADR-0010.
- **Data:** 2026-11-09

## Contexto

O dono não lê código: a prova de que algo funciona são testes que passam e o teste manual dele. O método pede TDD, testes derivados dos critérios de aceite e CI desde o primeiro dia. A ferramenta precisa passar em Linux, Windows e Mac.

A tentativa antiga acumulou mecanismos de verificação (testes de mutação, orçamento de desempenho, limites de palavras, auditorias) que passaram a gerar trabalho próprio.

## Decisão

1. **Um comando único de verificação: `pnpm check`.** Roda, nesta ordem: estilo (Biome), tipos (TypeScript), testes unitários, montagem da tela e testes de ponta a ponta. É o mesmo comando na máquina e no CI. Verde em `pnpm check` é condição para dizer que algo está pronto.
2. **Dois níveis de teste:**
   - **Vitest** para o servidor e para a lógica pura (`pnpm test`);
   - **Playwright**, só com Chromium, dirigindo o app real pelo navegador (`pnpm test:e2e`). O comportamento da tela é testado aqui, não com simulação de navegador.
3. **Todo critério de aceite do `SPEC.md` tem pelo menos um teste que cita o seu identificador** (por exemplo, `CA-0.7`) no nome. Critérios marcados como "teste manual do dono" são a exceção.
4. **TDD:** o teste é escrito e visto falhar antes do código que o faz passar.
5. **Dados de teste são fabricados na hora.** As imagens de teste são geradas pelo próprio teste; nenhuma imagem é commitada. Cada teste usa uma biblioteca temporária própria, numa pasta com acentos e espaços no nome.
6. **Testes determinísticos:** relógio injetado, sem rede, sem depender da ordem de listagem de arquivos.
7. **CI no GitHub Actions**, em Linux, Windows e Mac, a cada pull request e a cada mudança em `main`. Uma checagem extra recusa qualquer arquivo de imagem ou vídeo no repositório. As ações são fixadas por identificador de commit e rodam com permissão só de leitura.
8. **`main` é protegida:** só entra código por pull request com CI verde.

## Alternativas rejeitadas

- **Testes de mutação e orçamento de desempenho:** verificações de segunda ordem que geraram correções sem valor para o dono.
- **Simular o navegador nos testes da tela** (jsdom): mais dependências e menos fidelidade do que dirigir o app real.
- **Deixar os testes de ponta a ponta fora do comando único:** criaria dois significados para "passou".

## Consequências

- `pnpm check` fica mais lento por incluir o navegador; aceito, porque há um só portão.
- Precisar de tratamento especial por sistema operacional para um teste passar é sinal de design complicado demais: o executor para e reporta em vez de contornar.
- Se algo só puder ser conferido à mão, isso fica escrito no critério de aceite.
