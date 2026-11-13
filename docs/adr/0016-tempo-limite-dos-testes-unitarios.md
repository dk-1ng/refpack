# ADR-0016: Tempo limite de 20 segundos para cada teste unitário

- **Estado:** Aceito
- **Data:** 2026-11-12

## Contexto

Os testes unitários do servidor criam bibliotecas e pacotes de verdade, em pastas temporárias, e gravam arquivos no disco (ADR-0006). Na máquina Windows do GitHub, gravar arquivos é bem mais lento: o mesmo teste do pacote (CA-3.7) levou 2,4 segundos numa rodada e 5,4 na seguinte, e falhou pelo limite padrão do Vitest, de 5 segundos. A lógica estava certa. As fatias seguintes acrescentam arquivos ao pacote (as marcações da fatia 4), e o tempo tende a crescer.

## Decisão

1. **Cada teste unitário tem até 20 segundos** (`testTimeout: 20_000` em `vitest.config.ts`).
2. **O limite é o mesmo em todos os sistemas.** Nenhum valor por sistema operacional (R11).
3. Um teste que precise de mais de 20 segundos é sinal de problema no teste ou no código, não de limite curto: para e reporta.

## Alternativas rejeitadas

- **Manter 5 segundos:** o CI falha ao acaso no Windows por lentidão do disco, sem defeito nenhum.
- **Limite maior só no Windows:** tratamento especial por sistema (R11).
- **Deixar os testes mais rápidos com dados falsos em memória:** os testes deixariam de passar pelo disco de verdade, que é justamente o que eles conferem (pastas com acentos e espaços, arquivos gravados byte a byte).

## Consequências

- Um teste unitário realmente travado leva até 20 segundos para ser acusado, em vez de 5.
- Nenhuma dependência nova. Os testes de ponta a ponta não mudam (o Playwright já tem limite de 30 segundos).
