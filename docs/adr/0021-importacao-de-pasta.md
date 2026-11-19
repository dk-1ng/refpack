# ADR-0021: A importação de pasta é conduzida pela tela, uma imagem por vez, e as idênticas são reconhecidas pela impressão digital do conteúdo

- **Estado:** Aceito
- **Data:** 2026-11-19

## Contexto

A fatia 6 permite importar uma pasta inteira, com subpastas, pelo botão "Importar pasta" ou soltando-a na tela (SPEC, seção 12). O dono decidiu que: a tela mostra o andamento e tem "Parar"; no fim aparece um resumo; arquivos sem extensão de imagem são só contados; imagens idênticas às que já estão na biblioteca são puladas, só na importação; a tela continua utilizável durante a importação, menos para adicionar mais imagens; e, na grade, a pasta aparece na ordem alfabética do caminho.

O servidor só conhece o que o navegador lhe envia: os caminhos do computador do dono nunca chegam a ele (ADR-0007, item 4). Quem tem acesso aos arquivos escolhidos ou soltos é o navegador.

## Decisão

1. **A tela conduz a importação.** Ela recebe os arquivos da pasta (pelo `<input type="file" webkitdirectory>` do botão, ou lendo as pastas soltas com `webkitGetAsEntry`), separa os arquivos de imagem pelo nome, ordena pelo caminho e envia **uma imagem por vez**, pela mesma rota de hoje, `POST /api/images`. Não há rota nova de importação nem estado de importação no servidor.
2. **O caminho de cada arquivo começa pelo nome da pasta** (`Pasta/sub/a.png`); um arquivo solto junto com pastas tem só o nome. A ordem é a de `Intl.Collator("en")` sobre esse caminho, a mesma em todo navegador e sistema (como no ADR-0017). O caminho fica só na tela, para ordenar e para o resumo; ao servidor vai, como hoje, só o nome do arquivo.
3. **A tela envia de trás para a frente:** a última imagem na ordem entra primeiro. Como a grade mostra a mais recente primeiro, a pasta aparece na ordem alfabética. Se a importação para no meio e a mesma pasta é importada de novo, as que faltavam entram na frente, e a ordem final é a mesma.
4. **Parar** é um aviso que a tela verifica antes de cada envio: o envio em andamento termina, e nenhum outro começa. Fechar ou recarregar a tela interrompe a importação do mesmo jeito, sem nada a limpar no servidor, porque cada imagem é um pedido completo.
5. **Impressão digital do conteúdo.** O servidor calcula o SHA-256 dos bytes de toda imagem que entra, por qualquer caminho, e o guarda na coluna `content_hash` (migração `007`, com índice). As imagens que já existiam ganham a impressão digital ao abrir a biblioteca, uma vez só. Isso é ler bytes, não interpretar a imagem (ADR-0007, item 5).
6. **"Pular idênticas" é um pedido da tela, não uma regra do servidor.** A importação envia `POST /api/images?skipIdentical=1`. Se já existe uma imagem com a mesma impressão digital, o servidor não guarda nada e responde `409` com o código `identical`. Sem esse parâmetro, nada muda: o botão "Adicionar imagens", colar e soltar arquivos continuam guardando repetidas (SPEC, seção 12).
7. **Sem rede, a importação para.** Se um envio falha sem resposta do servidor, a tela para a importação, mostra o aviso de que não conseguiu guardar e mostra o resumo do que entrou.
8. **O andamento e o resumo são estado da tela.** Não são guardados: recarregar a tela os perde, e o que entrou fica na biblioteca.

## Alternativas rejeitadas

- **O servidor ler a pasta no disco, a partir de um caminho:** a tela não conhece o caminho real da pasta escolhida, e o dono teria de digitá-lo; além disso, o servidor passaria a ler lugares do computador escolhidos por texto, o que o ADR-0007 evita.
- **Mandar a pasta inteira num pedido só:** milhares de arquivos de até 25 MB num pedido; sem andamento por imagem, e "Parar" perderia tudo o que estava a caminho.
- **Enviar várias imagens ao mesmo tempo:** a ordem de entrada deixaria de ser garantida, e duas idênticas na mesma pasta poderiam entrar as duas. Num pedido local, uma por vez já é rápido.
- **Comparar pelo nome e tamanho do arquivo:** dois screenshots diferentes podem ter o mesmo nome e tamanho, e a mesma imagem pode ter nomes diferentes.
- **Calcular a impressão digital na tela:** o servidor teria de confiar no valor que recebe, e as imagens antigas ficariam sem impressão digital.

## Consequências

- Nenhuma dependência nova.
- A biblioteca do dono é lida inteira uma vez, na primeira abertura depois desta fatia, para calcular as impressões digitais. Com centenas de imagens, isso leva poucos segundos.
- A importação só vive enquanto a tela está aberta. "Continuar uma importação parada" é importar a mesma pasta de novo.
- Soltar uma pasta só pode ser simulado no Chromium (ADR-0010); escolher pelo botão é simulado nos dois navegadores.
- Se um dia pular idênticas valer também para o botão, colar e soltar, basta a tela mandar o mesmo parâmetro; a decisão é do dono.
