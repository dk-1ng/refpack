# ADR-0004: Dados — pasta de biblioteca com SQLite e imagens como arquivos

- **Estado:** Aceito
- **Data:** 2026-11-09

## Contexto

A coleção do dono deve chegar a milhares de imagens, cada uma com nota, marcações, etiquetas, sugestões da IA e grupos. É preciso filtrar e buscar rápido, e nunca perder o que ele escreveu. A coleção não pode ficar dentro do repositório público.

A tentativa antiga guardava um arquivo de texto (JSON) por referência. Para tornar isso confiável, foi preciso escrever à mão a validação, a gravação segura, o índice de busca e a conversão entre versões do formato: cerca de 9 mil linhas, e nenhuma delas visível para o dono.

## Decisão

1. **Uma pasta de biblioteca fora do repositório.** Por padrão, `refpack-library` na pasta pessoal do usuário. A variável de ambiente `REFPACK_LIBRARY` aponta para outro lugar (os testes usam isso).
2. **Dentro dela:**
   - `library.db`: um arquivo de banco de dados **SQLite** com tudo o que é texto e relação (registro das imagens e, nas fatias seguintes, notas, marcações, etiquetas, grupos);
   - `images/`: as imagens, como arquivos comuns;
   - `packs/`: os pacotes gerados.
3. **SQLite pelo módulo embutido do Node** (`node:sqlite`), sem dependência extra. Conferido nesta máquina em 2026-11-09: funciona no Node 26.13 sem aviso de recurso experimental.
4. **Nomes de arquivo vêm só de identificadores gerados pela ferramenta**, nunca do nome original nem de texto digitado. O nome original é guardado no banco como informação.
5. **O formato cresce por fatia.** Cada mudança no banco é uma migração numerada (`src/server/migrations/NNN-nome.sql`), aplicada sozinha ao abrir, só para a frente. Uma fatia cria apenas as tabelas e colunas que ela mesma usa.
6. **Cópia de segurança = copiar a pasta da biblioteca.**

## Por que SQLite

- Gravação segura e "tudo ou nada" já vêm prontas: é o que o código antigo tentou reconstruir à mão.
- Filtrar milhares de imagens por etiqueta ou grupo é uma consulta simples.
- É um arquivo só, sem servidor de banco para instalar ou manter.

## Alternativas rejeitadas

- **Um arquivo JSON por referência** (a escolha antiga): legível e amigo do Git, mas exigiu milhares de linhas de infraestrutura. A vantagem que ele trazia, sincronizar por Git entre computadores, está na lista "Depois".
- **Imagens dentro do banco:** o arquivo ficaria enorme e as imagens deixariam de ser visíveis no gerenciador de arquivos.
- **`better-sqlite3`:** dependência com código nativo, desnecessária já que o módulo embutido funciona.
- **Congelar o formato antes do uso** (a tentativa antiga congelou no dia 1): o formato passou a mandar no produto.

## Consequências

- Os dados não são legíveis num editor de texto. O Claude Code não lê o banco: lê os pacotes, e gravará sugestões por uma porta própria, decidida em ADR na fatia das sugestões da IA.
- O esquema do banco é definido pelo arquiteto no plano de cada fatia; o executor não o altera.
- Usar a mesma biblioteca em dois computadores ao mesmo tempo não é suportado; se virar fatia, pede novo ADR.
- Miniaturas para a grade com milhares de imagens serão decididas na fatia de entrada em volume.
