# ADR-0018: Opus com esforço alto no lugar do Fable

- **Estado:** Aceito
- **Data:** 2026-11-19

## Contexto

O ADR-0009 deu ao Fable o papel de arquiteto: entrevista da próxima fatia, critérios de aceite no SPEC, ADRs, plano da fatia, decisões de escalada e análise de uma "volta à especificação". O dono deixou de ter acesso ao Fable. O resto do ADR-0009 continua valendo.

## Decisão

1. **O papel de arquiteto passa ao Opus com esforço `high`.** Ele faz exatamente o que o Fable fazia, e nada além disso.
2. **Os papéis continuam separados por sessão, não por modelo.** A sessão de planejamento (Opus, `high`) e a de execução (Opus, `medium`) seguem separadas e começam do zero (`/clear`). Quem conduz a execução continua sem poder mudar design, SPEC ou plano.
3. Para o dono, a troca de modelo vira troca de esforço: planejar com `/model opus` e `/effort high`; executar com `/model opus` e `/effort medium`.
4. Os demais papéis e esforços do ADR-0009 não mudam.

## Alternativas rejeitadas

- **Sonnet com esforço alto como arquiteto:** o planejamento é onde um erro custa mais caro, porque vira código em várias tarefas. Economizar ali não compensa.
- **Juntar planejamento e execução numa sessão só, já que o modelo é o mesmo:** o contexto enche, e quem conduz a execução passaria a reinterpretar o plano no meio do caminho.

## Consequências

- O `docs/WORKFLOW.md` troca "Fable" por "Opus (`high`)" no papel de arquiteto e nas tabelas.
- O ADR-0009 fica com o papel do Fable marcado como superado por este ADR.
- Planejar fica mais barato que antes. A qualidade do plano é conferida como já era: o dono aprova o SPEC e o plano antes do código.
