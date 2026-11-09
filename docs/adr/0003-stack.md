# ADR-0003: Stack

- **Estado:** Aceito
- **Data:** 2026-11-09

## Contexto

O produto é um servidor local mais uma tela no navegador (ADR-0002). Quem escreve o código são agentes de IA, em sessões curtas, e o dono não lê código. Precisa rodar igual em Linux, Windows e Mac.

As escolhas da tentativa antiga não foram herdadas: cada uma foi reavaliada para "uma pessoa, um computador, milhares de imagens".

## Decisão

- **Uma linguagem só: TypeScript**, no modo estrito, no servidor e na tela.
- **Node 26 LTS** (26.13 ou mais novo) para o servidor. O Node 26 executa TypeScript diretamente, então o servidor não tem etapa de compilação. Conferido nesta máquina em 2026-11-09.
- **pnpm** como gerenciador de pacotes, com a versão fixada no `package.json`.
- **React + Vite** para a tela.
- **Hono** para o servidor (com `@hono/node-server`).
- **zod** para validar todo dado que cruza uma fronteira: o que a tela envia ao servidor e o que o servidor lê do disco.
- **Biome** para padronizar e checar o estilo do código.
- Ferramentas de teste: ADR-0006. Banco de dados: ADR-0004.

Dependências que rodam no produto ficam limitadas a: `react`, `react-dom`, `hono`, `@hono/node-server`, `zod`. Todas as versões são fixadas com número exato e o arquivo de trava (`pnpm-lock.yaml`) é commitado.

**Qualquer dependência nova exige um ADR aprovado antes de ser instalada.**

## Por que estas

- Uma linguagem só reduz o que um agente precisa ter na cabeça por sessão e permite compartilhar as definições de dados entre tela e servidor.
- São ferramentas maduras, muito conhecidas pelos modelos e que funcionam igual nos três sistemas.
- Node, pnpm e git já estão instalados na máquina do dono.
- Poucas dependências significam menos risco de segurança e menos manutenção.

## Alternativas rejeitadas

- **Segunda linguagem no servidor** (Python, Go, Rust): duas cadeias de ferramentas e de testes sem ganho para este tamanho de produto.
- **Framework completo** (Next.js e similares): traz renderização no servidor, rotas e convenções que um app local de uma tela não usa.
- **Compilar o servidor** antes de rodar: desnecessário com o Node 26.

## Consequências

- O código do servidor usa só a sintaxe de TypeScript que o Node executa direto (sem `enum` nem `namespace`).
- Subir de versão do Node ou de qualquer dependência é uma tarefa própria, nunca parte de outra.
