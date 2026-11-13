# ADR-0017: Etiquetas em tabela própria, únicas sem distinguir maiúsculas, e vivas enquanto alguma imagem as tem

- **Estado:** Aceito
- **Data:** 2026-11-13

## Contexto

A fatia 5 cria as etiquetas: palavras livres que o dono coloca numa imagem e usa para filtrar a grade (SPEC, seção 11). O dono decidiu que não há categorias nem lista pronta; que "Dashboard" e "dashboard" são a mesma etiqueta, mostrada como foi escrita na primeira vez; que uma etiqueta existe só enquanto alguma imagem a tem; que o filtro é de uma etiqueta por vez e não é lembrado ao reabrir; e que as etiquetas de cada referência saem no `README.md` do pacote.

Com milhares de imagens, filtrar por etiqueta precisa ser uma consulta simples (ADR-0004). O texto do dono não pode ser alterado além do que o SPEC define: os espaços nas pontas não fazem parte da etiqueta.

## Decisão

1. **Duas tabelas, criadas pela migração `006`:** `tags` (a etiqueta: um identificador gerado, o nome como foi escrito na primeira vez e uma chave para comparar) e `image_tags` (que imagem tem que etiqueta, na ordem em que foi colocada). A ordem de criação da ligação é a ordem em que a tela mostra as etiquetas de uma imagem.
2. **A chave de comparação é o nome em minúsculas**, calculada no servidor com `toLowerCase()` do JavaScript, que não depende da língua do sistema, e única na tabela. Só maiúsculas e minúsculas são ignoradas; acentos contam. O `lower()` e o `COLLATE NOCASE` do SQLite só tratam letras sem acento, por isso a chave não é calculada no banco.
3. **Colocar uma etiqueta reaproveita a que tem a mesma chave,** com o nome guardado; só cria uma nova quando nenhuma tem essa chave. Colocar numa imagem uma etiqueta que ela já tem não muda nada.
4. **Tirar a última ligação de uma etiqueta apaga a etiqueta.** Não há etiquetas órfãs: a lista de etiquetas da biblioteca é, por definição, a das que estão em alguma imagem.
5. **Os espaços nas pontas são removidos pelo servidor, na validação da entrada** (zod, com `trim()`), e uma etiqueta vazia depois disso é recusada. O resto do texto é guardado byte a byte. O limite é 60 caracteres depois de tirar os espaços.
6. **A lista de imagens que a tela recebe já traz as etiquetas de cada uma** (`tags: [{ id, name }]`), como traz a nota e as marcações. Não há rota para listar as etiquetas da biblioteca: a tela deriva essa lista das imagens, em ordem alfabética com `Intl.Collator("en")`, a mesma em todo navegador e sistema.
7. **Cada mudança tem o seu pedido:** colocar (`POST /api/images/:id/tags`, que responde com a etiqueta guardada) e tirar (`DELETE /api/images/:id/tags/:tagId`). A tela só mostra a mudança depois que o servidor confirma (ADR-0012, regra da seleção).
8. **O filtro é estado da tela.** "Selecionar todas" e "Limpar seleção" com o filtro ligado mandam a etiqueta junto (`PUT /api/draft/selection` com `tagId`), e o servidor muda só as imagens que a têm. Assim a tela e o banco concordam sem a tela enviar uma lista de imagens.
9. **No pacote, as etiquetas vão na linha da referência no `README.md`,** depois da nota, como `tags: "dashboard", "tabela"`: cada nome entre aspas no formato JSON (`JSON.stringify`), que escapa aspas e barras e cabe numa linha. Um parágrafo explica ao agente o que são. Não há arquivo próprio: a etiqueta é curta e de uma linha, ao contrário da nota (ADR-0013).

## Alternativas rejeitadas

- **Uma coluna de texto na imagem com as etiquetas separadas por vírgula ou em JSON:** filtrar exigiria ler todas as imagens, e "a mesma etiqueta ignorando maiúsculas" não teria onde morar.
- **Rota própria para listar as etiquetas da biblioteca:** repetiria o que a lista de imagens já traz; com milhares de imagens, isso é reavaliado junto com notas e marcações (ADR-0013, ADR-0015).
- **Manter etiquetas sem imagem,** para o dono reaproveitar depois: o SPEC diz que ela deixa de existir, e a lista do filtro ficaria com itens que não mostram nada.
- **Comparar ignorando também acentos** ("ícone" e "icone"): o dono não pediu, e a regra ficaria difícil de explicar.
- **Lembrar o filtro no navegador** (como a língua): o SPEC diz que ao reabrir a grade mostra tudo.
- **Tela enviar a lista das imagens mostradas para "Selecionar todas":** um pedido maior, e a tela poderia estar desatualizada; mandar a etiqueta é um valor só.

## Consequências

- Nenhuma dependência nova.
- Uma biblioteca criada nas fatias 0 a 4 é atualizada sozinha ao abrir: nenhuma imagem tem etiqueta; notas, marcações, seleção e intenção não mudam.
- Uma tela nova com um refpack antigo rodando recebe imagens sem `tags` e mostra o aviso de versões diferentes (CA-4.13), sem código novo.
- Renomear uma etiqueta ou tirá-la de todas as imagens, se virarem fatia, são operações sobre a tabela `tags`, sem mudar o formato.
- Com milhares de imagens, mandar todas as etiquetas na lista pode pesar. Isso é reavaliado na fatia de entrada em volume, junto com as notas, as marcações e as miniaturas (ADR-0004).
