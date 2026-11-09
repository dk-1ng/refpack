# ADR-0009: Papéis dos modelos e ciclo da fatia

- **Estado:** Aceito
- **Data:** 2026-11-09

## Contexto

O ADR-0001 decidiu usar as skills do superpowers para o ciclo de trabalho. Faltava definir quem faz o quê entre os modelos disponíveis (Fable, Opus, Sonnet, Haiku), quando um problema sobe de nível e como o ciclo que o dono pediu se encaixa nas skills:

planejar → implementar com testes → CI → revisão com contexto limpo contra o SPEC (bloqueante) → teste manual do dono → merge.

Lido como vem, o superpowers tem três comportamentos que contrariam regras deste projeto:

- o condutor é instruído a decidir conflitos sozinho e seguir em frente, sem parar;
- o revisor é instruído a tratar o silêncio da especificação como possível defeito;
- cada tarefa pode passar por até 5 rodadas de correção.

Na tentativa antiga, foram revisores medindo contra condições que ninguém pediu, em várias rodadas, que geraram a fila sem fim de correções.

## Decisão

1. **Um papel por modelo**, pelo critério "o menos caro que dá conta":
   - **Fable:** arquiteto. SPEC, ADRs, plano da fatia, decisões de escalada.
   - **Opus:** condutor da execução, revisor final da fatia, implementador das tarefas difíceis.
   - **Sonnet:** executor padrão e revisor de cada tarefa.
   - **Haiku:** trabalho mecânico e leitura de logs.
2. **Um nível de esforço por atividade**, pelo mesmo critério: `high` para planejar, para a revisão final e para tarefas difíceis; `medium` para conduzir, implementar e revisar tarefas; `low` para trabalho mecânico. `xhigh` e `max` só por decisão do dono. Todo agente é chamado com modelo e esforço explícitos. A tabela completa está em `docs/WORKFLOW.md`.
3. **Planejamento e execução são sessões separadas:** a de planejamento em Fable, a de execução em Opus. O plano carrega tudo o que a execução precisa.
4. **Um branch e um pull request por fatia.** Cada tarefa é um agente novo; o CI roda a cada envio.
5. **Duas revisões com alcances diferentes:** uma por tarefa (Sonnet, só o diff da tarefa) e uma da fatia inteira (Opus, contexto limpo, contra o SPEC), que é a bloqueante.
6. **Limites duros:** 2 rodadas de correção por tarefa; uma reverificação na revisão da fatia; 6 tarefas por fatia. Passou disso, a execução para e volta-se à especificação.
7. **Ajustes sobre o superpowers**, listados em `docs/WORKFLOW.md`. Os principais: "para e reporta" no lugar de "decide e segue" para tudo que toca design; limite de rodadas; revisor que não bloqueia pelo que o SPEC não cobre; ordem CI → revisão → teste manual → merge; fechamento sempre por pull request.
8. **O modo de operar fica em `docs/WORKFLOW.md`**, lido pela sessão principal. O `CLAUDE.md` guarda só o que todo agente precisa.
9. **Nenhuma definição própria de agente** em `.claude/agents/`: os agentes são chamados com os modelos e textos-padrão do superpowers mais os ajustes acima.

## Alternativas rejeitadas

- **Superpowers sem ajustes:** os três comportamentos acima recriariam o problema da tentativa antiga.
- **Agentes e roteiro próprios** (a tentativa antiga tinha 5 agentes e um roteiro de 2.300 palavras): processo com vida própria.
- **Tudo no modelo mais capaz:** gasta o plano de uso do dono em trabalho que um modelo menor faz igual.
- **Uma sessão só fazendo tudo:** o contexto enche, e quem escreveu o código revisaria o próprio trabalho.
- **Revisão só no fim, sem revisão por tarefa:** um erro na tarefa 1 só apareceria depois de cinco tarefas construídas em cima dele.

## Consequências

- O dono troca de modelo em dois momentos por fatia (`/model fable` para planejar, `/model opus` para executar).
- O que o revisor notar fora do SPEC não se perde: vai para o dono como lista, e ele decide.
- Uma atualização do superpowers pode mudar seus textos-padrão; os ajustes em `docs/WORKFLOW.md` continuam valendo sobre eles.
- Mudar este ciclo no meio de uma fatia não é permitido (R6); só entre fatias, por novo ADR.
