# ADR-0010: Testes de ponta a ponta também no Firefox

- **Estado:** Aceito
- **Data:** 2026-11-10

## Contexto

O ADR-0006 decidiu rodar os testes de ponta a ponta "só com Chromium". O dono usa o refpack no **Firefox**, e pediu, ao planejar a fatia 1, que os testes automáticos rodem também nele.

A fatia 1 (colar e arrastar) depende justamente de comportamentos em que os navegadores diferem: o que chega num colar, o que chega num soltar, o que acontece ao arrastar uma imagem da própria página.

Conferido nesta máquina em 2026-11-10, com o Firefox do Playwright:

- 16 dos 17 testes de ponta a ponta da fatia 0 passam sem mudança. O que falha é o do botão "Copiar caminho", só porque o teste pede a permissão de área de transferência de um jeito que existe apenas no Chromium.
- Colar e soltar arquivos podem ser simulados dentro da página, do mesmo jeito, nos dois navegadores.
- Soltar arquivos e pastas **reais** do disco só pode ser simulado pelo protocolo de controle do Chromium. No Firefox não há equivalente.

## Decisão

1. **Os testes de ponta a ponta rodam no Chromium e no Firefox**, na máquina e no CI, nos três sistemas. `pnpm check` continua sendo o portão único e passa a rodar os dois.
2. **Todo teste vale para os dois navegadores**, salvo as exceções do item 3.
3. **Exceções, em lista fechada:**
   - a permissão de área de transferência é dada de um jeito em cada navegador (no Chromium, pelo teste; no Firefox, pela configuração do Playwright);
   - os testes que soltam arquivos e pastas reais do disco rodam só no Chromium. O que eles cobrem é conferido no Firefox pelo teste manual do dono.
4. **O código do produto não tem ramo por navegador.** Ele usa só recursos que os dois têm.
5. **O teste manual do dono é feito no Firefox.**

Este ADR supera, no item 2 do ADR-0006, o trecho "só com Chromium". O resto do ADR-0006 continua valendo.

## Alternativas rejeitadas

- **Continuar só com Chromium:** o navegador que o dono usa de verdade ficaria coberto apenas pelo teste manual.
- **Trocar o Chromium pelo Firefox:** perderia a única simulação fiel de soltar uma pasta real.
- **Acrescentar também o WebKit (Safari):** o dono não usa.

## Consequências

- O CI baixa dois navegadores e cada verificação roda os testes de tela duas vezes. Na máquina do dono a diferença é de segundos.
- Em cada máquina é preciso rodar uma vez `pnpm exec playwright install firefox`.
- Uma exceção nova à lista do item 3, ou um `if` por navegador no código do produto, não é decisão do executor: ele para e reporta.
- Um teste que só falha em um navegador é tratado como defeito do produto até prova em contrário.
