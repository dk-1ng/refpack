# ADR-0005: Estrutura de pastas

- **Estado:** Aceito
- **Data:** 2026-11-09

## Contexto

A tentativa antiga criou 7 pacotes no primeiro dia. Dois deles terminaram com 4 linhas, e as regras de quem pode depender de quem viraram assunto de revisão. O produto tem um servidor pequeno e uma tela.

## Decisão

Um pacote só, com um `package.json` na raiz:

```
refpack/
  SPEC.md  ROADMAP.md  CLAUDE.md  SECURITY.md
  docs/
    adr/                  decisões de arquitetura
    slices/NN-nome/       plano da fatia (plan.md)
  src/
    server/               servidor local: rotas, banco, arquivos, geração do pacote
      migrations/         mudanças numeradas do banco
    web/                  tela (React)
      i18n/               textos em pt-BR e en
    shared/               definições de dados usadas pela tela e pelo servidor
  e2e/                    testes que dirigem o app inteiro pelo navegador
  .github/workflows/      CI
```

Regras:

1. **Uma pasta ou arquivo nasce quando uma fatia precisa dele.** Nada é criado vazio "para depois".
2. **Sentido único das dependências:** `web` e `server` podem importar de `shared`; `shared` não importa de nenhum dos dois; `web` nunca importa de `server` nem o contrário. Eles conversam só pela API.
3. **Teste unitário fica ao lado do arquivo testado** (`coisa.ts` e `coisa.test.ts`).
4. **Mudar esta estrutura exige um ADR novo.** O executor não cria pastas de primeiro nível nem move arquivos entre `server`, `web` e `shared` por conta própria.

## Alternativas rejeitadas

- **Monorepo com vários pacotes:** custo de configuração e de regras entre pacotes sem ganho para este tamanho.
- **Separar por tipo técnico em muitas camadas** (controllers, services, repositories): convida a construir em camadas, que é o que deu errado.

## Consequências

- Se o projeto crescer a ponto de pedir pacotes separados, um ADR novo fará a divisão.
- Dentro de `server` e `web`, os arquivos são agrupados por funcionalidade (por exemplo, tudo de "pacote" junto), não por camada.
