# ADR-0015: Marcações em tabela própria, com o recorte feito pelo navegador na hora de marcar

- **Estado:** Aceito
- **Data:** 2026-11-11

## Contexto

A fatia 4 cria as marcações: áreas retangulares de uma imagem, cada uma com um tipo ("gosto" ou "não gosto") e um comentário opcional (SPEC, seção 10). Uma imagem pode ter várias. O dono decidiu que a marcação é da imagem, como a nota, e que a área não muda depois de criada: para mudar, ele apaga e desenha de novo.

O pacote precisa levar um **recorte** de cada marcação: um arquivo de imagem só com a área marcada, na resolução original (CA-4.9). Recortar exige abrir a imagem e ler os pontos dela. O servidor não faz isso (ADR-0007, item 5) e não há dependência de tratamento de imagem (ADR-0003).

## Decisão

1. **As marcações ficam numa tabela própria, `marks`,** criada pela migração `005`: a imagem a que pertence, o tipo, a área e o comentário. A ordem de criação é a ordem da tabela, e o número que o dono vê (1, 2, 3…) é a posição da marcação nessa ordem; ele não é guardado.
2. **A área é guardada como quatro frações da imagem,** de 0 a 1: as bordas esquerda, de cima, direita e de baixo. Assim ela não depende do tamanho em que a imagem aparece na tela, e vira direto as porcentagens do `README.md` do pacote.
3. **Quem faz o recorte é o navegador, na hora em que a marcação é criada.** A tela já tem a imagem aberta; ela desenha a área num quadro invisível (`canvas`), na resolução original, gera um PNG e o envia junto com o pedido de criar a marcação. O servidor confere pelo conteúdo que é um PNG, limita o tamanho a 100 MB e guarda o arquivo em `marks/` dentro da biblioteca, com nome gerado por ele. Como a área não muda, o recorte nunca é refeito.
4. **A lista de imagens que a tela recebe já traz as marcações de cada uma,** como já traz a nota (ADR-0013). O sinal da grade e a imagem aberta saem do mesmo dado.
5. **Cada mudança tem o seu pedido:** criar, trocar o tipo, guardar o comentário e apagar. O comentário segue a regra de texto do ADR-0012 (um envio de cada vez, sempre o mais recente), com uma fila por marcação. Criar, trocar o tipo e apagar seguem a regra da seleção: a tela só mostra a mudança depois que o servidor confirma.
6. **Apagar uma marcação apaga também o arquivo do recorte.**
7. **No pacote, tudo de uma marcação fica em `marks/`:** o recorte em `marks/NN-M.png` e, se houver comentário, o texto do dono byte a byte em `marks/NN-M.md` (`NN` é o número da imagem no pacote, `M` o da marcação). O `README.md` só aponta para os arquivos e diz o tipo e a área.
8. **Na tela, os retângulos são desenhados sobre a imagem aberta, dentro do diálogo do ADR-0014,** numa moldura que tem exatamente o tamanho em que a imagem aparece. A posição de cada retângulo é dada em porcentagem dessa moldura, então ele continua no lugar quando a janela muda de tamanho.

## Alternativas rejeitadas

- **O servidor recortar a imagem:** pede uma biblioteca de tratamento de imagem, com código nativo, e faz o servidor interpretar arquivos que o dono adicionou, o que o ADR-0007 evita de propósito.
- **Recortar só na hora de gerar o pacote:** a tela teria de abrir, uma por uma, todas as imagens selecionadas antes de gerar. Ficaria lento e a geração deixaria de ser um pedido só.
- **Não levar recorte, só a posição em texto:** o dono pediu o recorte; o agente lê uma imagem pequena melhor do que coordenadas.
- **Guardar as marcações como texto (JSON) numa coluna da imagem:** trocar o tipo ou o comentário de uma marcação regravaria todas, e duas filas de salvamento escreveriam no mesmo campo.
- **Guardar a área em pontos da imagem:** o servidor não conhece o tamanho da imagem (não a interpreta), e sem ele não daria para dizer no pacote onde a área fica.
- **Guardar o número da marcação:** apagar uma obrigaria a renumerar as outras no banco.

## Consequências

- Nenhuma dependência nova.
- A biblioteca ganha a pasta `marks/`, ao lado de `images/` e `packs/`. Copiar a pasta da biblioteca leva as marcações e os recortes junto.
- Uma biblioteca criada nas fatias 0 a 3 é atualizada sozinha ao abrir: nenhuma imagem tem marcação; as notas, a seleção e a intenção não mudam.
- O recorte é sempre PNG, mesmo de uma imagem JPEG ou WebP, e por isso pode pesar mais que o trecho original. O recorte de uma área enorme de uma foto muito grande pode passar de 100 MB, ou do tamanho que o navegador consegue desenhar; nesse caso a marcação não é criada e a tela mostra o aviso de que não foi possível salvar. O SPEC não trata desse caso.
- "Começar outro pacote" não toca nas marcações: elas não fazem parte do pacote em montagem (ADR-0011).
- Mover ou redimensionar uma marcação, se um dia virar fatia, pede refazer o recorte e, portanto, rever o item 3.
- Com milhares de imagens, mandar todas as marcações na lista pode pesar. Isso é reavaliado na fatia de entrada em volume, junto com as notas e as miniaturas (ADR-0004, ADR-0013).
