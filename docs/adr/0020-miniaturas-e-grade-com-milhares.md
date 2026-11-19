# ADR-0020: Miniaturas feitas pelo navegador, e uma grade sem paginação que só carrega o que está perto da tela

- **Estado:** Aceito
- **Data:** 2026-11-19

## Contexto

A fatia 6 traz a importação de pastas inteiras, e a biblioteca deve chegar a 10.000 imagens (SPEC, seção 12). A grade de hoje desenha cada imagem a partir do arquivo original, que pode ter até 25 MB. Com milhares delas, o navegador baixaria e decodificaria gigabytes, e a tela travaria. O CA-6.13 pede que as primeiras imagens apareçam em até 3 segundos e que selecionar, filtrar e abrir respondam em menos de meio segundo.

O ADR-0004 deixou as miniaturas para esta fatia. O servidor não interpreta o conteúdo das imagens (ADR-0007, item 5), e não há dependência de tratamento de imagem (ADR-0003). O recorte das marcações já é feito pelo navegador (ADR-0015).

## Decisão

1. **Quem faz a miniatura é o navegador.** Ele abre a imagem original, recorta o quadrado do centro (é exatamente o que a grade mostra hoje, com `object-fit: cover`), reduz para no máximo 384 × 384 pontos, sem aumentar imagens menores, e gera um WebP. Se o navegador não gerar WebP, ele entrega PNG, e o servidor aceita os dois.
2. **Um único mecanismo faz todas as miniaturas que faltam.** Com a tela aberta, uma fila percorre, na ordem da grade, as imagens sem miniatura e faz uma de cada vez: baixa o original do próprio refpack, gera a miniatura e a envia. Vale para as imagens antigas, criadas antes desta fatia, e para cada imagem nova, venha de onde vier. Uma imagem cuja miniatura não deu certo não é tentada de novo até a tela ser recarregada.
3. **No servidor, a miniatura é um arquivo em `thumbs/`,** dentro da biblioteca, com o nome gerado a partir do identificador da imagem, e o banco guarda o tipo dela (coluna `thumb_mime_type` da migração `007`). Ela chega por `PUT /api/images/:id/thumb`, com o tipo conferido pelo conteúdo e no máximo 2 MB, e sai por `GET /api/images/:id/thumb`.
4. **A lista de imagens traz `thumbUrl`**, o endereço da miniatura, ou `null` quando ela ainda não existe. A grade usa `thumbUrl` e, sem ela, o original. A imagem aberta e o pacote continuam usando só o original.
5. **A grade continua sendo uma lista única, sem páginas,** e só carrega o que está perto da tela: cada imagem tem carregamento preguiçoso (`loading="lazy"`), e cada item da grade tem `content-visibility: auto`, que faz o navegador pular o desenho do que está fora da tela.
6. **Cada item da grade é um componente que só se redesenha quando a sua imagem muda** (`React.memo`, com funções estáveis vindas do `App`). Selecionar uma imagem redesenha um item, não dez mil.
7. **A lista inteira continua chegando num pedido só** (`GET /api/images`), com notas, marcações e etiquetas, como hoje.

## Alternativas rejeitadas

- **O servidor fazer a miniatura com uma biblioteca de imagem (por exemplo, `sharp`):** é dependência com código nativo, faz o servidor interpretar arquivos que o dono adicionou (ADR-0007, item 5) e foge do padrão do ADR-0015.
- **Fazer a miniatura só na hora de adicionar, a partir do arquivo que está no navegador:** evitaria baixar o original de volta, mas não resolve as imagens antigas; seriam dois caminhos para a mesma coisa.
- **Grade "virtual", que só põe na página os itens visíveis:** é código próprio de rolagem, quebra a busca do navegador (Ctrl+F) e exige que todo item tenha a mesma altura, o que cortaria as etiquetas da grade. Fica como próximo passo se o teste de uso mostrar que os itens 5 e 6 não bastam.
- **Paginação ("Mostrar mais"):** muda o jeito de usar a grade, e o dono não pediu.
- **Mandar a lista em partes:** 10.000 imagens dão poucos megabytes de texto, que chegam e são conferidos rápido num pedido local.

## Consequências

- Nenhuma dependência nova.
- A biblioteca ganha a pasta `thumbs/`, ao lado de `images/`, `marks/` e `packs/`. Copiar a pasta da biblioteca leva as miniaturas junto. Apagar arquivos dela à mão está fora do modelo (SPEC, seção 14).
- Na primeira vez que a tela abre depois desta fatia, a biblioteca do dono gera as miniaturas que faltam, uma por uma, enquanto ele usa a tela.
- Cada imagem adicionada é baixada de volta uma vez pelo navegador, para fazer a miniatura. Num pedido local isso é rápido.
- Uma tela antiga, aberta contra um refpack novo, continua funcionando; uma tela nova contra um refpack antigo mostra o aviso do CA-4.13, porque a lista não traz `thumbUrl`.
