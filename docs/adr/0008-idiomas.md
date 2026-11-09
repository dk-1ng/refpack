# ADR-0008: Idiomas

- **Estado:** Aceito
- **Data:** 2026-11-09

## Contexto

O dono decidiu que a tela existe em português e em inglês desde a primeira fatia, e que os documentos que ele lê e aprova ficam em português. Agentes de IA escrevem o código.

## Decisão

1. **Tela em pt-BR e en.** Os textos ficam em dois dicionários simples em `src/web/i18n/` (um arquivo por língua, chave → texto). Nenhum componente contém texto visível escrito direto no código.
2. **Um teste falha** se uma chave existir em uma língua e faltar na outra, ou se um texto estiver vazio.
3. **Primeira língua:** a preferência do navegador (começa com `pt` → português; qualquer outra → inglês). Um seletor troca na hora, e a escolha é lembrada no navegador.
4. **Mensagens de erro do servidor** saem como um código estável; a tela traduz o código para a língua escolhida.
5. **Documentos em português:** `SPEC.md`, `ROADMAP.md`, `CLAUDE.md`, `SECURITY.md`, ADRs e planos de fatia.
6. **Em inglês:** código, nomes de arquivos e pastas, comentários, mensagens de commit e o `README.md` que vai dentro de cada pacote gerado (quem o lê é o agente).
7. **O que o dono escreve na ferramenta** (notas, comentários, intenção) é guardado e exportado exatamente como ele escreveu, em qualquer língua.

## Alternativas rejeitadas

- **Biblioteca de tradução externa** (i18next e similares): uma dependência para resolver o que dois arquivos e uma função pequena resolvem.
- **Uma língua só agora:** decisão de produto do dono foi ter as duas desde o início.
- **Tudo em inglês, inclusive documentos:** o dono precisa ler e aprovar SPEC, ROADMAP e ADRs sem esforço.

## Consequências

- Toda tarefa que mexe na tela entrega os textos nas duas línguas; isso está na Definition of Done.
- Plural e formatação de datas e números por língua serão tratados quando uma fatia precisar, usando o que o navegador já oferece.
