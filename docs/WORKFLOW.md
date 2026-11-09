# Workflow — como uma fatia é construída

Este arquivo é para a **sessão principal** (quem conduz a fatia). Os agentes que ela chama recebem só a tarefa deles e o `CLAUDE.md`. A justificativa das escolhas está no [ADR-0009](adr/0009-papeis-dos-modelos-e-ciclo-da-fatia.md).

O ciclo usa as skills do plugin superpowers. Onde este arquivo e uma skill discordam, **este arquivo vence** (ver "Ajustes sobre o superpowers").

## Papel de cada modelo

| Modelo | Papel | Faz | Não faz |
| --- | --- | --- | --- |
| **Fable** | Arquiteto | Entrevista da próxima fatia, critérios de aceite no SPEC, ADRs, plano da fatia; decide quando alguém "para e reporta"; analisa a especificação quando as correções se repetem. | Implementar tarefas; conduzir a execução do dia a dia. |
| **Opus** | Condutor e revisor | Conduz a sessão de execução (chama os agentes, lê os relatórios, monta as revisões). Faz a revisão final da fatia, em contexto limpo. Implementa as tarefas marcadas "difícil" no plano e assume uma tarefa em que o Sonnet travou. | Mudar design, SPEC ou plano. |
| **Sonnet** | Executor padrão | Implementa uma tarefa por vez em TDD, em contexto novo. Faz a revisão de cada tarefa e a reverificação de correções pequenas. | Decidir qualquer coisa que o plano não decidiu. |
| **Haiku** | Mecânico | Tarefas em que o plano já traz o conteúdo exato (configuração, dicionários de texto), correções de um arquivo só, resumo de logs do CI. | Revisar; implementar a partir de descrição em prosa. |

## Nível de esforço

| Atividade | Modelo | Esforço |
| --- | --- | --- |
| Planejar a fatia, SPEC, ADRs | Fable | `high` |
| Analisar uma "volta à especificação" | Fable | `high` |
| Conduzir a execução | Opus | `medium` |
| Revisão final da fatia | Opus | `high` |
| Tarefa difícil ou tarefa travada | Opus | `high` |
| Implementar uma tarefa | Sonnet | `medium` |
| Revisão por tarefa e reverificação | Sonnet | `medium` |
| Trabalho mecânico, resumo de log | Haiku | `low` |

Regra geral: o modelo e o esforço menos caros que dão conta do papel.

- **Todo agente é chamado com modelo e esforço escritos explicitamente**, conforme a tabela; sem isso ele herda os da sessão, que costumam ser os mais caros.
- **`xhigh` e `max` só por decisão do dono**, para um caso específico.

Para o dono: sessões de **planejamento** rodam com `/model fable` e `/effort high`; sessões de **execução** com `/model opus` e `/effort medium`. Cada uma começa do zero (`/clear`).

## O ciclo

### 1. Planejar — sessão em Fable

1. Mini-entrevista com o dono sobre a próxima fatia, em um bloco de até 5 perguntas.
2. Escrever os critérios de aceite da fatia no `SPEC.md`. O dono aprova.
3. Se a fatia pede decisão técnica nova, escrever o ADR.
4. Escrever `docs/slices/NN-nome/plan.md` com a skill `superpowers:writing-plans`: no máximo **6 tarefas**, cada uma do tamanho de uma sessão, cada uma ligada aos critérios de aceite que cobre, e com um **roteiro de teste manual** para o dono no final. Se não couber em 6, a fatia está grande: cortar e mandar o resto para "Depois".
5. O dono aprova o plano. A aprovação autoriza criar o branch `slice/NN-nome`, enviá-lo ao GitHub e abrir um pull request em rascunho. Não autoriza o merge.

### 2. Implementar com testes — sessão em Opus

Skill: `superpowers:subagent-driven-development`, com `superpowers:test-driven-development`.

- Um branch por fatia. Cada tarefa é feita por um agente novo (Sonnet por padrão), que escreve o teste, vê falhar, implementa, roda `pnpm check` e commita.
- Depois de cada tarefa: revisão da tarefa (Sonnet) contra os critérios dela, e envio do branch para o CI rodar.
- O condutor confere ele mesmo a saída de `pnpm check` antes de aceitar um relatório (`superpowers:verification-before-completion`).

### 3. CI

Verde em Linux, Windows e Mac no pull request. Falhou: o log é resumido (Haiku) e a correção começa por um teste que reproduz a falha (`superpowers:systematic-debugging`).

### 4. Revisão da fatia — bloqueante

Com o CI verde, um agente **Opus em contexto limpo e somente leitura** revisa o branch inteiro (`superpowers:requesting-code-review`). Ele recebe: a seção da fatia no `SPEC.md`, a Definition of Done, o ADR-0007 e o diff. Roda `pnpm check` por conta própria.

Saída, nesta forma:

- Primeira linha: `APROVADO` ou `MUDANÇAS PEDIDAS`.
- **Bloqueios:** cada um com arquivo:linha, o critério de aceite, item da DoD ou item do ADR-0007 que quebra, e um cenário concreto. Esta é a lista de correções.
- **Fora do SPEC:** o que ele notou e o SPEC não cobre. Não bloqueia.

Os bloqueios são corrigidos (teste primeiro) e o revisor confere **uma vez** só as correções. Se ainda houver bloqueio, vale a regra "volta à especificação" abaixo.

A lista "Fora do SPEC" vai para o dono, que decide item a item: vira critério de aceite, vai para "Depois" ou é descartado.

### 5. Teste manual do dono

O condutor deixa o app pronto para uso no branch da fatia e entrega ao dono, em português simples:

- o que foi construído;
- a prova (saída de `pnpm check`, link do CI, veredito da revisão);
- o roteiro de teste manual do plano;
- a lista "Fora do SPEC".

O dono responde "aprovado" ou descreve o problema.

- **Não faz o que o critério diz:** é defeito. Corrige-se com teste primeiro.
- **Faz o que o critério diz, mas o dono quer diferente:** é mudança de SPEC. Nada é codificado agora; vira ajuste do SPEC para uma próxima fatia ou item de "Depois".

### 6. Merge

Só depois do "aprovado" do dono **para esta fatia**: marcar a fatia como feita no `ROADMAP.md`, fazer o merge do pull request em um commit só (squash) e apagar o branch (`superpowers:finishing-a-development-branch`, opção de pull request).

## Quando escalar

| Situação | O que acontece |
| --- | --- |
| Tarefa mecânica falha com Haiku | Refaz com Sonnet. |
| Sonnet não resolve a mesma falha em 1 rodada de correção | Um agente Opus novo assume, com `superpowers:systematic-debugging`. |
| 2 rodadas de correção na mesma tarefa sem resolver | **Volta à especificação.** |
| Revisão da fatia ainda bloqueia depois da reverificação | **Volta à especificação.** |
| O teste manual do dono falha duas vezes no mesmo ponto | **Volta à especificação.** |
| Executor precisa mudar design, dependência, schema ou estrutura | Para e reporta. O arquiteto (Fable) decide por ADR. |
| Critério de aceite ambíguo ou contraditório | Para e reporta. O arquiteto esclarece no SPEC; se muda o que o produto faz, o dono decide. |
| Um teste só passa com tratamento especial por sistema operacional | Para e reporta. O arquiteto simplifica o design (R11). |
| A fatia não vai caber em 2 dias ou em 6 tarefas | Para. O dono decide o que sai e vai para "Depois". O prazo não estica. |
| Algo público ou difícil de desfazer | O dono confirma antes. |

**Volta à especificação** significa: a execução para; o arquiteto escreve, em poucas linhas, o que estava ambíguo ou errado no SPEC ou no plano; corrige o documento; o dono aprova; só então a execução recomeça. Mais uma rodada de correção sem isso não é permitida.

## Ajustes sobre o superpowers

1. **Local dos documentos:** a especificação é o `SPEC.md` da raiz; o plano fica em `docs/slices/NN-nome/plan.md`.
2. **O condutor não decide sozinho o que toca design, dependência, schema, estrutura ou o sentido de um critério.** A skill manda "decidir e seguir"; aqui, nesses casos, para e reporta. Detalhe local de implementação ele decide e registra.
3. **No máximo 2 rodadas de correção por tarefa** (a skill permite 5), e uma só reverificação na revisão da fatia.
4. **O revisor não trata o silêncio do SPEC como defeito.** O que o SPEC não cobre vai para a lista "Fora do SPEC" e não bloqueia (R4, R5).
5. **"Review Focus" do plano:** só entram condições que o dono pode causar em uso normal. Cada uma vira critério de aceite aprovado por ele antes do código, ou sai.
6. **A revisão final vem depois do CI verde**, e o merge só depois do teste manual do dono.
7. **Fechamento sempre por pull request**; nunca merge local direto em `main`.
