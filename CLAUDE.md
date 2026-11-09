# CLAUDE.md — refpack

Regras para toda sessão e todo agente neste repositório.

## O que é

Uma ferramenta local, para uma pessoa, que guarda referências de design e gera um pacote (uma pasta) que o Claude Code lê. O que ela faz está em `SPEC.md`.

**Leia antes de qualquer tarefa:** `SPEC.md`, a linha da fatia atual em `ROADMAP.md`, o plano da fatia em `docs/slices/` e os ADRs que o plano citar.

Ordem de autoridade: `SPEC.md` → ADRs (`docs/adr/`) → plano da fatia → código.

## Quem decide o quê

- **O dono do produto** decide o que o produto faz, a ordem do roteiro e o que entra ou sai de uma fatia. Ele não é desenvolvedor: fale com ele em português, em linguagem simples, sem jargão.
- **O arquiteto** (a sessão principal) decide a técnica e registra cada decisão em um ADR com justificativa. O arquiteto não amplia escopo.
- **O executor não muda design, dependências, schema ou estrutura de pastas; se encontrar problema, para e reporta.**

Se um pedido do dono contradiz o `SPEC.md`, avise antes de fazer qualquer coisa. Se uma tarefa gera correções repetidas, o problema está na especificação: pare e volte nela.

## Stack

TypeScript estrito em tudo · Node 26 LTS · pnpm · React + Vite (tela) · Hono (servidor) · SQLite pelo `node:sqlite` · zod nas fronteiras · Vitest e Playwright · Biome. Detalhes e justificativas: ADR-0003, ADR-0004 e ADR-0006.

Dependências de produção permitidas: `react`, `react-dom`, `hono`, `@hono/node-server`, `zod`. **Qualquer outra exige ADR aprovado antes de instalar.**

## Estrutura

```
src/server/    servidor local: rotas, banco, arquivos, geração do pacote
src/web/       tela (React); textos em src/web/i18n/
src/shared/    definições de dados usadas pelos dois lados
e2e/           testes de ponta a ponta (Playwright)
docs/adr/      decisões de arquitetura
docs/slices/   um plano por fatia
docs/WORKFLOW.md   como a sessão principal conduz uma fatia
```

`web` e `server` importam de `shared` e nunca um do outro. Pasta nova de primeiro nível exige ADR (ADR-0005).

## Comandos

Criados na fatia 0; a partir dela são os únicos comandos de verificação.

| Comando | O que faz |
| --- | --- |
| `pnpm check` | O portão único: estilo, tipos, testes unitários, montagem da tela e testes de ponta a ponta. |
| `pnpm test` | Testes unitários (Vitest). |
| `pnpm test:e2e` | Testes de ponta a ponta (Playwright). |
| `pnpm dev` | Roda o app em modo de desenvolvimento. |
| `pnpm start` | Roda o app como o dono usa. |

## Convenções

- **TDD.** Escreva o teste, veja-o falhar, depois escreva o código. Todo critério de aceite tem um teste que cita seu identificador (`CA-0.7`) no nome.
- **Dados de teste fabricados na hora.** Nenhuma imagem é commitada. Cada teste usa uma biblioteca temporária em pasta com acentos e espaços.
- **Fronteiras validadas com zod.** Tudo o que chega ao servidor e tudo o que é lido do disco.
- **Textos da tela só pelos dicionários** `pt-BR` e `en`; nunca escritos direto num componente.
- **As palavras do dono nunca são alteradas** pelo código: guardadas e exportadas como digitadas.
- **Nomes de arquivo gerados pela ferramenta**, nunca vindos de texto do usuário. O servidor só grava dentro da pasta da biblioteca.
- **Código agrupado por funcionalidade**, não por camada. Teste unitário ao lado do arquivo testado.
- **Idiomas:** documentos em português; código, nomes, comentários e commits em inglês (ADR-0008).
- **Commits** no padrão Conventional Commits, pequenos, um assunto cada. Um branch por fatia (`slice/NN-nome`), com as tarefas como commits nele; `main` só recebe pull request com CI verde.
- **Sem código para o futuro.** Nada de tabela, campo, pasta, opção ou abstração que a fatia atual não use.

## Definition of Done

Vale para toda tarefa, sem exceção. Uma tarefa só está pronta quando **todos** os itens são verdadeiros:

1. Cada critério de aceite da tarefa tem teste escrito antes do código, e todos passam.
2. `pnpm check` está verde na máquina.
3. O CI está verde em Linux, Windows e Mac.
4. Todo texto novo da tela existe em português e em inglês.
5. Nenhuma mudança de design, dependência, schema ou estrutura de pastas foi feita sem ADR aprovado.
6. `SPEC.md` e `ROADMAP.md` foram atualizados se o comportamento mudou.
7. O diff não contém mídia de terceiros, dado pessoal nem segredo.
8. A revisão da tarefa terminou aprovada.

Para fechar uma **fatia**, além disso:

9. A revisão da fatia inteira, em contexto limpo e contra o `SPEC.md`, terminou aprovada.
10. O dono fez o teste manual e aprovou.

**Nunca diga que algo está pronto sem os testes passando.** Mostre a saída do comando. Se um teste falhou ou um passo foi pulado, diga isso.

## Ciclo de uma fatia

1. **Planejar:** o arquiteto escreve `docs/slices/NN-nome/plan.md` com tarefas de uma sessão cada, derivadas dos critérios de aceite. O dono aprova.
2. **Implementar com testes:** um agente novo por tarefa, em TDD.
3. **CI:** verde nos três sistemas.
4. **Revisão com contexto limpo contra o SPEC:** bloqueante, com lista de correções.
5. **Teste manual do dono.**
6. **Merge.**

A sessão principal segue `docs/WORKFLOW.md`, que traz o papel de cada modelo, quando escalar e os ajustes sobre o superpowers (ADR-0009). Um agente chamado para uma tarefa não precisa lê-lo: faz a tarefa recebida e, diante de qualquer dúvida de design, para e reporta.

## Regras do projeto

Vêm das lições da primeira tentativa (`taste-library`).

- **R1.** Toda fatia termina com algo que o dono usa na tela. Código que só serve a fatias futuras não entra.
- **R2.** O formato dos dados nasce com a fatia que precisa dele. Nenhum campo para funcionalidade futura.
- **R3.** A ordem do roteiro segue o valor: o caminho mais curto até o pacote vem primeiro.
- **R4.** "Quando dá errado" só entra no SPEC se o dono puder causá-lo em uso normal e aprovar. O revisor não inventa condições.
- **R5.** A revisão mede só contra os critérios de aceite da fatia, a Definition of Done e o ADR-0007. Uma revisão e uma reverificação; se ainda falhar, volta-se à especificação.
- **R6.** O processo não tem código próprio e não muda no meio de uma fatia. Mudança de processo só entre fatias, por ADR.
- **R7.** Decisões em ADRs separados. ADR superado é marcado, nunca apagado.
- **R8.** Documentos que cabem numa leitura. O SPEC detalha só a fatia atual.
- **R9.** O executor não muda design; o arquiteto não amplia escopo. O que surgir vai para "Depois" no `ROADMAP.md` e o dono decide.
- **R10.** As ameaças são as de uma pessoa, num computador (ADR-0007).
- **R11.** Testes nos três sistemas desde o dia 1, sem engenhosidade de sistema de arquivos. Precisar de tratamento especial por sistema é sinal para parar e reportar.
- **R12.** Pastas e arquivos nascem quando uma fatia precisa. Nada vazio.

## Cuidados

- **Confirme com o dono antes de qualquer ação pública ou difícil de desfazer:** criar ou mudar repositório no GitHub, publicar, forçar push, apagar branches.
- **A pasta `../taste-library` é a tentativa antiga.** Serve só para consulta. Não copie código dela e não a modifique.
- **Nunca coloque no repositório:** imagens ou vídeos de terceiros, a biblioteca do dono, caminhos da máquina dele, nomes de clientes ou projetos reais, segredos. Veja `SECURITY.md`.
