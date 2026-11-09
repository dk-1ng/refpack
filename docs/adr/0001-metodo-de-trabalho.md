# ADR-0001: Método de trabalho

- **Estado:** Aceito
- **Data:** 2026-11-09

## Contexto

A primeira tentativa (`taste-library`) detalhou o plano inteiro no início, construiu em camadas e deixou o processo crescer mais que o produto: em 6 dias, o script que automatizava o fluxo ficou maior que a interface, e nada ficou utilizável.

O dono pediu um método guiado por especificação. A ideia inicial era usar o spec-kit do GitHub. O plugin superpowers, já instalado no Claude Code do dono, cobre o mesmo ciclo.

## Decisão

1. **`SPEC.md` na raiz é a fonte da verdade.** Ordem de autoridade: `SPEC.md` → ADRs → plano da fatia → código. Mudança de rumo altera SPEC ou ADR antes do código.
2. **O ciclo de trabalho usa as skills do superpowers:** planejar a fatia, TDD, execução por subagentes, revisão com contexto limpo, verificação antes de declarar algo pronto e fechamento do branch. O detalhe do ciclo e o papel de cada modelo ficam no `CLAUDE.md`.
3. **Um plano por fatia**, em `docs/slices/NN-nome/plan.md`, escrito só quando a fatia começa. Este local substitui o padrão do plugin.
4. **Fatias verticais de 1 a 2 dias.** O que não couber vai para "Depois" no `ROADMAP.md`; o prazo não estica.
5. **O processo não tem código próprio** (nenhum script de loop, quadro ou automação de etiquetas) e não muda no meio de uma fatia. Mudança de processo acontece entre fatias, por ADR.
6. **Uma Definition of Done única**, no `CLAUDE.md`, aplicada a toda tarefa.

## Alternativas rejeitadas

- **spec-kit:** seria uma segunda ferramenta de processo a instalar e manter, fazendo o que o superpowers já faz.
- **Um documento único de design com tabela de decisões** (como na tentativa antiga): cresceu até 12 mil palavras e as decisões superadas eram apagadas, perdendo a história.
- **Automação própria do fluxo** (como o `loop.mjs` antigo): virou um segundo produto.

## Consequências

- O superpowers pode mudar entre versões; o que vale para este projeto é o que está no `CLAUDE.md`.
- O dono lê três documentos curtos (`SPEC.md`, `ROADMAP.md`, ADRs) em vez de um longo.
- Sem automação de quadro, o estado das fatias é mantido à mão na coluna "Estado" do `ROADMAP.md`.
