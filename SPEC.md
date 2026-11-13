# SPEC — refpack

Este documento é a fonte da verdade sobre o que o refpack faz. Quando o código e este documento discordam, o documento vence e o código é corrigido. Mudança de rumo altera este arquivo (ou um ADR em `docs/adr/`) **antes** do código.

Ordem de autoridade: `SPEC.md` → ADRs → plano da fatia (`docs/slices/`) → código.

## 1. Problema

Interfaces geradas por IA saem com a mesma cara. Eu quero que o Claude Code gere telas com o **meu** gosto.

Hoje, a cada projeto, eu procuro screenshots e colo de novo na conversa. As coleções que já tenho (pastas no computador, Pinterest e similares, favoritos do navegador) não chegam ao agente de forma útil.

## 2. Usuário

Uma pessoa só: o dono do produto. Não é desenvolvedor, usa o Claude Code no dia a dia e trabalha em um computador.

O repositório é público, mas não há compromisso de que a ferramenta sirva a mais ninguém.

## 3. O que é sucesso

Ao começar uma tela nova num projeto real, eu digo ao Claude Code "leia a pasta X" em vez de colar imagens, e o resultado sai com a cara das minhas referências.

O coração do produto é **gerar o pacote**: uma pasta que o Claude Code lê. Tudo o mais existe para deixar esse pacote melhor.

## 4. Princípios do produto

1. **Minhas palavras nunca mudam.** O que eu escrevo é guardado exatamente como escrevi.
2. **A IA sugere, eu aprovo.** Toda proposta da IA fica separada das minhas palavras e marcada como "a revisar" até eu aceitar, corrigir ou rejeitar.
3. **Local e privado.** Roda no meu computador, sem conta, sem enviar nada para fora.
4. **A coleção é minha e fica fora do repositório.** Nenhuma imagem de terceiros entra no repositório público.
5. **Tela em português e em inglês** desde a primeira fatia.

## 5. Fluxos principais

Cada fluxo é escrito como "caminho normal" e "quando dá errado". Um "quando dá errado" só entra aqui se eu puder causá-lo em uso normal.

Só o fluxo da fatia em andamento tem critérios de aceite completos. Os outros ficam em poucas frases até a vez deles chegar (ver `ROADMAP.md`).

### F1. Guardar imagens — *fatias 0, 1 e 6*

Eu adiciono imagens à biblioteca e as vejo numa grade: escolhendo arquivos, colando da área de transferência, arrastando para a tela ou importando uma pasta inteira. Com o tempo serão milhares.

### F2. Anotar — *fatias 3, 4 e 5*

Em cada imagem eu escrevo uma nota geral, marco partes com "gosto" ou "não gosto" e um comentário, e coloco etiquetas: palavras livres, minhas, que depois servem para filtrar a grade.

### F3. Receber sugestões da IA — *fatia 7*

Eu peço ao Claude Code que descreva as imagens novas. As sugestões aparecem numa fila; nada vale até eu aceitar, corrigir ou rejeitar. Não há chave de API paga: a IA é o Claude Code que eu já uso.

### F4. Organizar em famílias — *fatia 8*

A IA propõe famílias estéticas com nome. Eu aprovo, renomeio ou desfaço.

### F5. Montar o pacote — *parte na fatia 0, completo nas fatias 2 a 4 e 8*

Eu parto de um grupo pronto, ajusto imagem por imagem e escrevo a intenção do projeto: o que é, para quem, o que a pessoa precisa conseguir fazer.

### F6. Gerar a pasta — *fatia 0*

Um clique gera uma pasta com as imagens numeradas, minhas anotações e a intenção. Eu aponto o Claude Code para ela.

### F7. Trazer o resultado de volta — *fatia 9*

Eu guardo um screenshot do que o agente fez junto do pacote, anoto o que acertou e o que errou e, se ficou bom, promovo o resultado a referência.

## 6. Fatia 0 — walking skeleton

**O que eu consigo fazer ao final:** abrir o refpack, adicionar uma imagem, vê-la na tela e gerar uma pasta-pacote que o Claude Code lê.

É o caminho mais fino que atravessa o produto inteiro: tela → servidor → armazenamento → pacote. Tudo o que não está listado abaixo fica fora desta fatia.

### Definições desta fatia

- **Biblioteca:** a pasta `refpack-library` dentro da minha pasta pessoal. É criada sozinha no primeiro uso. Guarda as imagens e, dentro de `packs/`, os pacotes gerados.
- **Imagem aceita:** arquivo PNG, JPEG ou WebP de até 25 MB.
- **Pacote:** uma pasta `packs/pack-AAAAMMDD-HHMMSS/` dentro da biblioteca.

### Critérios de aceite

**CA-0.1 Abrir**
- Dado que o refpack está instalado,
- quando eu rodo `pnpm start` na pasta do projeto,
- então o terminal mostra o endereço local, a tela do refpack abre no navegador e, se a biblioteca ainda não existe, ela é criada vazia.
- A abertura automática do navegador é conferida no teste manual do dono; o resto, por teste automático.

**CA-0.2 Biblioteca vazia**
- Dado que a biblioteca não tem imagens,
- quando a tela abre,
- então eu vejo um convite para adicionar a primeira imagem, e o botão "Gerar pacote" está desativado com uma explicação.

**CA-0.3 Adicionar imagens**
- Dado que a tela está aberta,
- quando eu clico em "Adicionar imagens" e escolho um ou mais arquivos aceitos,
- então cada um aparece na grade, o mais recente primeiro, sem eu recarregar a página.

**CA-0.4 Meu arquivo original não é tocado**
- Dado um arquivo que eu adicionei,
- quando a adição termina,
- então o arquivo original continua no lugar, com o mesmo conteúdo; a biblioteca guarda uma cópia.

**CA-0.5 Arquivo recusado**
- Dado que eu escolho um arquivo que não é PNG, JPEG ou WebP, ou que passa de 25 MB,
- quando a adição é tentada,
- então a tela mostra uma mensagem, na língua da tela, com o nome do arquivo e o motivo; nada desse arquivo é guardado; os outros arquivos aceitos da mesma escolha são guardados normalmente.
- O tipo é conferido pelo conteúdo do arquivo, não só pela extensão.

**CA-0.6 Fechar e voltar**
- Dado que eu adicionei imagens,
- quando eu fecho o refpack e abro de novo,
- então a grade mostra as mesmas imagens, na mesma ordem.

**CA-0.7 Gerar o pacote**
- Dado que a biblioteca tem pelo menos uma imagem,
- quando eu clico em "Gerar pacote",
- então é criada a pasta `packs/pack-AAAAMMDD-HHMMSS/` contendo:
  - `refs/` com uma cópia de cada imagem da biblioteca, nomeada `01`, `02`, … com a extensão do formato da imagem (`.png`, `.jpg` ou `.webp`), na ordem da grade;
  - `README.md`, em inglês, explicando ao agente o que é o pacote e listando cada referência pelo número e pelo arquivo;
  - `.gitignore` que ignora tudo dentro do pacote, para que ele não seja commitado por engano se for copiado para um projeto.
- Nesta fatia o pacote leva **todas** as imagens da biblioteca; escolher quais entram é a fatia 2.

**CA-0.8 Saber onde está o pacote**
- Dado que um pacote acabou de ser gerado,
- quando a geração termina,
- então a tela mostra o caminho completo da pasta e um botão que copia esse caminho.

**CA-0.9 Gerar não altera a biblioteca**
- Dado que eu gerei um pacote,
- quando eu olho a grade,
- então as imagens e a ordem estão iguais; gerar duas vezes cria duas pastas diferentes.

**CA-0.10 Duas línguas**
- Dado que a tela está aberta,
- quando eu troco a língua no seletor,
- então todos os textos mudam na hora entre português e inglês, e a escolha é lembrada ao reabrir.
- Na primeira vez, a língua segue a preferência do navegador: português se ela começar com `pt`, inglês nos outros casos.

**CA-0.11 Só a minha máquina**
- Dado que o refpack está rodando,
- quando um pedido chega de outro computador ou de outro site aberto no navegador,
- então ele é recusado.

**CA-0.12 Funciona nos três sistemas**
- Dado o código da fatia,
- quando o CI roda,
- então a verificação completa passa em Linux, Windows e Mac, incluindo um teste com a biblioteca numa pasta com acentos e espaços no nome.

**CA-0.13 O Claude Code lê o pacote** *(teste manual do dono)*
- Dado um pacote gerado,
- quando eu digo ao Claude Code "leia a pasta" seguido do caminho copiado,
- então ele consegue dizer quantas referências há e descrever cada uma.

**CA-0.14 Já está aberto**
- Dado que o refpack já está rodando,
- quando eu rodo `pnpm start` de novo,
- então o terminal avisa, em português e em inglês, que o refpack já está aberto e mostra o endereço; nenhum segundo servidor é iniciado e nada na biblioteca muda.

### Fora desta fatia, de propósito

- Colar da área de transferência e arrastar para a tela (fatia 1).
- Importar uma pasta inteira (fatia 6).
- Detecção de imagens repetidas: o mesmo arquivo adicionado duas vezes aparece duas vezes.
- Apagar uma imagem, notas, marcações, etiquetas, escolher o que entra no pacote, intenção do projeto.
- Miniaturas e desempenho com milhares de imagens (fatia 6).
- Escolher onde a biblioteca ou o pacote ficam.

## 7. Fatia 1 — colar e arrastar

**O que eu consigo fazer ao final:** colar um screenshot da área de transferência e arrastar arquivos para a tela; eles entram na biblioteca como os escolhidos pelo botão.

O que vale para a fatia 0 continua valendo. Tudo o que não está listado abaixo fica fora desta fatia.

### Definições desta fatia

- **Colar:** apertar Ctrl+V (Cmd+V no Mac) com a tela do refpack em primeiro plano. Não precisa clicar em nenhum lugar antes.
- **Soltar:** arrastar algo de fora do navegador e largar em qualquer ponto da tela do refpack.
- **Entrar como pelo botão:** vale para o que é colado ou solto tudo o que os critérios CA-0.3, CA-0.4 e CA-0.5 dizem para arquivos escolhidos pelo botão "Adicionar imagens": aparece na grade, o mais recente primeiro, sem recarregar a página; o original não é tocado; o que não é imagem aceita é recusado com nome e motivo, e os outros entram normalmente.

### Critérios de aceite

**CA-1.1 Dica na tela**
- Dado que a tela está aberta,
- quando eu olho perto do botão "Adicionar imagens",
- então vejo uma dica curta, na língua da tela, dizendo que também dá para colar com Ctrl+V e arrastar arquivos para a tela.

**CA-1.2 Colar uma imagem copiada**
- Dado que eu copiei uma imagem (um screenshot recém-tirado, ou "Copiar imagem" num site),
- quando eu colo na tela do refpack,
- então a imagem entra como pelo botão.
- Uma imagem copiada assim não tem nome de arquivo; o refpack guarda o nome que o navegador dá a ela.

**CA-1.3 Colar arquivos copiados**
- Dado que eu copiei um ou mais arquivos no gerenciador de arquivos,
- quando eu colo na tela do refpack,
- então cada arquivo entra como pelo botão, com as mesmas recusas do CA-0.5.
- Quem entrega os arquivos copiados à tela é o navegador, e isso depende do navegador e do sistema: é conferido no teste manual do dono. Onde o navegador não entrega arquivo nenhum, vale o CA-1.4.
- No Firefox, o navegador pode entregar só o primeiro dos arquivos copiados; os outros não chegam à tela. Para adicionar vários de uma vez, arraste-os (CA-1.6).

**CA-1.4 Colar sem ter imagem copiada**
- Dado que o que está copiado não é imagem nem arquivo (por exemplo, um texto),
- quando eu colo na tela do refpack,
- então a tela mostra um aviso, na língua da tela, de que não havia imagem para colar; nada é guardado.

**CA-1.5 A tela mostra que vai receber**
- Dado que a tela está aberta,
- quando eu arrasto arquivos por cima dela,
- então a tela inteira ganha um destaque com um convite para soltar, na língua da tela; o destaque some quando eu solto ou quando tiro os arquivos de cima da tela.

**CA-1.6 Soltar arquivos**
- Dado que eu arrasto um ou mais arquivos do gerenciador de arquivos,
- quando eu os solto em qualquer ponto da tela,
- então cada arquivo entra como pelo botão, com as mesmas recusas do CA-0.5.

**CA-1.7 Soltar uma pasta**
- Dado que eu arrasto uma pasta, sozinha ou junto com arquivos,
- quando eu solto na tela,
- então a tela mostra um aviso, na língua da tela, com o nome da pasta e dizendo que pastas ainda não são aceitas; nada de dentro da pasta é guardado; os arquivos soltos junto com ela entram normalmente.

**CA-1.8 Soltar algo que não é arquivo**
- Dado que eu arrasto algo que não é arquivo nem pasta (por exemplo, um texto selecionado ou um link),
- quando eu solto na tela,
- então a tela mostra um aviso, na língua da tela, de que não havia imagem para adicionar; nada é guardado; a tela do refpack continua aberta, sem ser trocada por outra página.

**CA-1.9 Imagem da grade não se duplica**
- Dado que a grade tem imagens,
- quando eu arrasto uma imagem da própria grade e solto na tela,
- então nada é adicionado e nenhum aviso aparece.

### Como estes critérios são conferidos

Os testes automáticos rodam no Chromium e no Firefox (ADR-0010) e simulam, dentro do navegador, o colar e o soltar. Soltar uma pasta (CA-1.7) só pode ser simulado no Chromium.

Colar de verdade (com a ferramenta de captura e o gerenciador de arquivos) e arrastar de verdade são conferidos no teste manual do dono, feito no Firefox.

### Fora desta fatia, de propósito

- Botão "Colar": colar é só pelo teclado.
- Arrastar uma imagem direto de um site: não é prometido nem testado. Se o navegador entregar só o link, vale o CA-1.8.
- Importar o conteúdo de uma pasta (fatia 6).
- Colar ou soltar links de página (lista "Depois").
- Detecção de imagens repetidas: colar ou soltar a mesma imagem duas vezes a guarda duas vezes.

## 8. Fatia 2 — escolher e dizer a intenção

**O que eu consigo fazer ao final:** selecionar quais imagens entram no pacote e escrever a intenção do projeto; o pacote sai só com as selecionadas e com a intenção.

O que vale para as fatias 0 e 1 continua valendo, com as mudanças listadas em "O que muda nos critérios anteriores". Tudo o que não está listado abaixo fica fora desta fatia.

### Definições desta fatia

- **Seleção:** as imagens que vão entrar no próximo pacote. Começa vazia.
- **Intenção:** um texto livre, numa caixa só, em que eu digo o que é o projeto, para quem é e o que a pessoa precisa conseguir fazer. É opcional. Tem até 10 000 caracteres; a caixa não aceita mais que isso.
- **Intenção vazia:** sem nenhum caractere, ou só com espaços e quebras de linha.
- **Pacote em montagem:** a seleção mais a intenção. Só existe um. Fica guardado até eu mudar: não se perde ao fechar o refpack nem ao gerar o pacote.

### Critérios de aceite

**CA-2.1 Selecionar e tirar da seleção**
- Dado que a grade tem imagens,
- quando eu clico numa imagem,
- então ela ganha um destaque visível de selecionada; clicando de novo, o destaque sai.
- A tela mostra quantas imagens estão selecionadas e quantas existem (por exemplo, "3 de 12 selecionadas").
- Clicar e arrastar sobre uma imagem não a deixa azul, como se fosse um texto selecionado.

**CA-2.2 Selecionar todas e limpar a seleção**
- Dado que a grade tem imagens,
- quando eu clico em "Selecionar todas", todas ficam selecionadas; quando eu clico em "Limpar seleção", nenhuma fica.
- A intenção não muda em nenhum dos dois casos.

**CA-2.3 Imagem nova entra sem seleção**
- Dado que eu já selecionei algumas imagens,
- quando eu adiciono outra (pelo botão, colando ou soltando),
- então a nova aparece na grade sem estar selecionada, e a seleção que eu já tinha continua igual.

**CA-2.4 Escrever a intenção**
- Dado que a tela está aberta,
- quando eu escrevo na caixa "Intenção do projeto",
- então o texto é guardado sozinho, sem botão de salvar, e a tela mostra que foi guardado.
- A caixa vazia mostra uma dica, na língua da tela, lembrando os três pontos: o que é, para quem e o que a pessoa precisa conseguir fazer.
- O texto fica exatamente como eu digitei: acentos, emojis, quebras de linha e espaços.

**CA-2.5 Fechar e voltar**
- Dado que eu selecionei imagens e escrevi a intenção,
- quando eu fecho o refpack e abro de novo,
- então as mesmas imagens estão selecionadas e a caixa traz o mesmo texto.

**CA-2.6 Gerar com a seleção**
- Dado que há pelo menos uma imagem selecionada,
- quando eu clico em "Gerar pacote",
- então o pacote é criado como no CA-0.7, mas `refs/` e o `README.md` trazem só as imagens selecionadas, numeradas `01`, `02`, … na ordem em que aparecem na grade.
- O que eu acabei de digitar na intenção entra no pacote, mesmo que eu clique em "Gerar pacote" logo em seguida.

**CA-2.7 A intenção sai no pacote**
- Dado que a intenção não está vazia,
- quando o pacote é gerado,
- então ele traz o arquivo `INTENT.md` com o meu texto, exatamente como digitei e sem nada acrescentado; o `README.md` diz ao agente, em inglês, para ler esse arquivo antes de olhar as referências, e avisa que o texto é do dono e pode estar em outra língua.
- Com a intenção vazia, o pacote não tem `INTENT.md` e o `README.md` não fala dele.
- No teste manual do dono, o Claude Code, ao ler a pasta, consegue dizer qual é a intenção e quantas referências há.

**CA-2.8 Nada selecionado**
- Dado que a biblioteca tem imagens mas nenhuma está selecionada,
- quando eu olho o botão "Gerar pacote",
- então ele está desativado, com uma explicação de que é preciso selecionar pelo menos uma imagem.

**CA-2.9 Gerar não altera o pacote em montagem**
- Dado que eu gerei um pacote,
- quando a geração termina,
- então a seleção e a intenção continuam como estavam, para eu ajustar e gerar de novo; gerar de novo cria outra pasta.

**CA-2.10 Começar outro pacote**
- Dado que há imagens selecionadas ou texto na intenção,
- quando eu clico em "Começar outro pacote" e confirmo,
- então a seleção e a caixa da intenção ficam vazias; as imagens da biblioteca e os pacotes já gerados não mudam.
- Antes de limpar, a tela pede confirmação, porque o texto da intenção é apagado. Se eu cancelo, nada muda.

**CA-2.11 A tela ficou aberta com o refpack parado**
- Dado que eu parei o refpack no terminal e a tela continuou aberta no navegador,
- quando eu clico numa imagem ou escrevo na intenção,
- então a tela avisa, na língua da tela, que não conseguiu guardar; a imagem clicada não aparece como selecionada; o texto que eu digitei continua na caixa, sem a indicação de guardado, para eu poder copiá-lo.

**CA-2.12 Colar com o cursor na caixa da intenção**
- Dado que o cursor está na caixa da intenção,
- quando eu colo um texto, ele entra na caixa, como em qualquer campo de texto, e nenhum aviso aparece;
- quando eu colo uma imagem ou arquivos, eles entram na biblioteca como pelo botão (CA-1.2 e CA-1.3) e o texto da caixa não muda.

### O que muda nos critérios anteriores

- **CA-1.4:** o aviso de "não havia imagem para colar" não aparece quando o cursor está na caixa da intenção; ali vale o CA-2.12.
- **CA-0.2:** com a biblioteca vazia, o botão "Gerar pacote" continua desativado com a explicação de hoje. Com imagens e nenhuma selecionada, vale o CA-2.8.
- **CA-0.7:** o pacote deixa de levar todas as imagens. Leva as selecionadas (CA-2.6) e, se houver, a intenção (CA-2.7).
- **CA-0.9:** gerar também não altera a seleção nem a intenção (CA-2.9).

### Como estes critérios são conferidos

Os testes automáticos rodam no Chromium e no Firefox (ADR-0010). O teste manual do dono é feito no Firefox e termina pedindo ao Claude Code que leia o pacote gerado.

### Fora desta fatia, de propósito

- Vários pacotes em montagem ao mesmo tempo, ou pacote com nome: só existe um.
- Mudar a ordem das imagens no pacote: ela segue a ordem da grade.
- Selecionar várias de uma vez com Shift ou arrastando: é uma imagem por clique, ou todas.
- Mostrar só as selecionadas ou filtrar a grade (etiquetas são a fatia 5).
- Partir de um grupo pronto (famílias, fatia 8).
- Lista dos pacotes já gerados, reabrir ou alterar um pacote gerado.
- Desfazer o "Começar outro pacote".
- Nota em cada imagem (fatia 3).

## 9. Fatia 3 — nota geral

**O que eu consigo fazer ao final:** abrir uma imagem em tamanho grande, escrever uma nota sobre ela e passar para a seguinte; a nota se guarda sozinha, fica exatamente como escrevi e sai no pacote.

O que vale para as fatias 0, 1 e 2 continua valendo, com as mudanças listadas em "O que muda nos critérios anteriores". Tudo o que não está listado abaixo fica fora desta fatia.

### Definições desta fatia

- **Nota:** um texto livre sobre uma imagem, numa caixa só, em que eu digo o que quero que o agente aproveite ou evite nela. É opcional. Tem até 10 000 caracteres; a caixa não aceita mais que isso.
- **Nota vazia:** sem nenhum caractere, ou só com espaços e quebras de linha.
- **A nota é da imagem**, não do pacote em montagem. Fica guardada com a imagem até eu mudá-la e vale para todos os pacotes em que a imagem entrar.
- **Imagem aberta:** a imagem em tamanho grande, por cima da grade, com a caixa da nota ao lado. Só uma imagem fica aberta por vez.

### Critérios de aceite

**CA-3.1 Abrir uma imagem**
- Dado que a grade tem imagens,
- quando eu clico no botão "Nota" de uma imagem,
- então ela abre em tamanho grande, inteira, sem cortes, com a caixa da nota ao lado trazendo a nota que essa imagem já tem.
- O cursor já está na caixa da nota: eu posso começar a digitar sem clicar em nada.
- Clicar no botão "Nota" não muda a seleção da imagem. Clicar na imagem, na grade, continua servindo para selecioná-la (CA-2.1).

**CA-3.2 Escrever a nota**
- Dado que uma imagem está aberta,
- quando eu escrevo na caixa da nota,
- então o texto é guardado sozinho, sem botão de salvar, e a tela mostra que foi guardado.
- A caixa vazia mostra uma dica, na língua da tela, lembrando para que serve a nota: dizer o que aproveitar e o que evitar nesta imagem.
- O texto fica exatamente como eu digitei: acentos, emojis, quebras de linha e espaços.

**CA-3.3 Fechar a imagem**
- Dado que uma imagem está aberta,
- quando eu clico em "Fechar" ou aperto Esc,
- então a imagem fecha e eu volto à grade, no mesmo ponto em que ela estava.
- O que eu digitei até o instante de fechar fica guardado.

**CA-3.4 Anterior e próxima**
- Dado que uma imagem está aberta,
- quando eu clico em "Próxima" ou em "Anterior",
- então a imagem aberta passa a ser a seguinte ou a anterior, na ordem da grade, com a nota dela na caixa e o cursor na caixa.
- O que eu digitei na imagem de que saí fica guardado.
- Na primeira imagem da grade o botão "Anterior" está desativado; na última, o "Próxima".

**CA-3.5 Sinal de nota na grade**
- Dado que uma imagem tem nota que não está vazia,
- quando eu olho a grade,
- então essa imagem mostra um sinal pequeno de que tem nota; as imagens sem nota não mostram.
- O sinal aparece ou some sem eu recarregar a página, conforme a nota passa a existir ou fica vazia.

**CA-3.6 Fechar e voltar**
- Dado que eu escrevi notas,
- quando eu fecho o refpack e abro de novo,
- então cada imagem traz a mesma nota, e a grade mostra os mesmos sinais.

**CA-3.7 A nota sai no pacote**
- Dado que uma imagem selecionada tem nota que não está vazia,
- quando o pacote é gerado,
- então ele traz, na pasta `notes/`, um arquivo com o mesmo número da imagem (`notes/01.md` para `refs/01.png`), com o meu texto exatamente como digitei e sem nada acrescentado.
- O `README.md` mostra, na lista de referências, qual é o arquivo de nota de cada imagem que tem nota. Ele diz ao agente, em inglês, para ler a nota junto com a imagem, e avisa que o texto é do dono e pode estar em outra língua.
- Imagem selecionada sem nota não ganha arquivo, e o `README.md` não fala de nota para ela. Se nenhuma imagem selecionada tem nota, o pacote não tem a pasta `notes/`.
- A nota de uma imagem que não está selecionada não entra no pacote.
- O que eu acabei de digitar na nota entra no pacote, mesmo que eu feche a imagem e clique em "Gerar pacote" logo em seguida.
- No teste manual do dono, o Claude Code, ao ler a pasta, consegue dizer o que a nota de cada imagem pede.

**CA-3.8 Começar outro pacote não apaga notas**
- Dado que há imagens com nota,
- quando eu clico em "Começar outro pacote" e confirmo,
- então a seleção e a intenção ficam vazias, como no CA-2.10, e todas as notas continuam como estavam.

**CA-3.9 A tela ficou aberta com o refpack parado**
- Dado que eu parei o refpack no terminal e a tela continuou aberta no navegador, com uma imagem aberta,
- quando eu escrevo na nota,
- então a tela avisa, na língua da tela, que não conseguiu guardar; o texto que eu digitei continua na caixa, sem a indicação de guardado, para eu poder copiá-lo.
- Se, com esse texto ainda não guardado, eu tento fechar a imagem ou passar para outra, a tela pergunta antes se eu quero sair sem guardar. Se eu cancelo, a imagem continua aberta com o texto na caixa.

**CA-3.10 Colar e soltar com uma imagem aberta**
- Dado que uma imagem está aberta,
- quando eu colo um texto com o cursor na caixa da nota, ele entra na caixa, como em qualquer campo de texto, e nenhum aviso aparece;
- quando eu colo uma imagem ou arquivos, ou solto qualquer coisa na tela, nada é adicionado à biblioteca e nenhum aviso aparece; o texto da nota não muda e a tela do refpack continua aberta, sem ser trocada por outra página.
- Para adicionar imagens, eu fecho a imagem aberta antes.

### O que muda nos critérios anteriores

- **CA-0.7 e CA-2.6:** além das imagens e da intenção, o pacote leva as notas das imagens selecionadas (CA-3.7).
- **CA-2.10:** "Começar outro pacote" não apaga notas (CA-3.8).
- **CA-1.2 a CA-1.8 e CA-2.12:** colar e soltar não adicionam imagens enquanto uma imagem está aberta; ali vale o CA-3.10.

### Como estes critérios são conferidos

Os testes automáticos rodam no Chromium e no Firefox (ADR-0010). O teste manual do dono é feito no Firefox e termina pedindo ao Claude Code que leia o pacote gerado.

### Fora desta fatia, de propósito

- Marcar partes da imagem (fatia 4) e etiquetas (fatia 5).
- Selecionar ou tirar da seleção com a imagem aberta: a seleção continua sendo feita na grade.
- Passar de imagem pelas setas do teclado: na caixa da nota elas movem o cursor.
- Ampliar a imagem aberta além do tamanho da tela (zoom).
- Fechar a imagem clicando fora dela.
- Ler a nota na grade sem abrir a imagem.
- Formatação na nota (negrito, listas): é texto simples.
- Buscar ou filtrar imagens pelo texto da nota.
- Adicionar imagens com uma imagem aberta (CA-3.10).

## 10. Fatia 4 — marcar partes

**O que eu consigo fazer ao final:** abrir uma imagem, desenhar um retângulo sobre uma parte dela, dizer se é "gosto" ou "não gosto" e escrever um comentário; o pacote sai com o recorte de cada marcação, o tipo e o comentário.

O que vale para as fatias 0 a 3 continua valendo, com as mudanças listadas em "O que muda nos critérios anteriores". Tudo o que não está listado abaixo fica fora desta fatia.

### Definições desta fatia

- **Marcação:** uma área retangular de uma imagem, com um tipo e um comentário. Uma imagem pode ter várias, e elas podem se sobrepor.
- **Tipo:** "gosto" ou "não gosto". Toda marcação tem um; sou eu que escolho, nunca a ferramenta.
- **Comentário:** um texto livre sobre a área marcada. É opcional. Tem até 2 000 caracteres; a caixa não aceita mais que isso.
- **Comentário vazio:** sem nenhum caractere, ou só com espaços e quebras de linha.
- **Número da marcação:** as marcações de uma imagem são numeradas 1, 2, 3… na ordem em que foram criadas. Quando uma é apagada, as seguintes sobem um número.
- **Recorte:** um arquivo de imagem só com a área marcada, tirado da imagem original, sem reduzir. É sempre um PNG, qualquer que seja o formato da imagem.
- **A marcação é da imagem**, como a nota: fica guardada com a imagem até eu mudar ou apagar e vale para todos os pacotes em que a imagem entrar.

### Critérios de aceite

**CA-4.1 Desenhar uma área**
- Dado que uma imagem está aberta,
- quando eu aperto o botão do mouse sobre a imagem, arrasto e solto,
- então um retângulo acompanha o mouse enquanto eu arrasto e fica na imagem quando eu solto, à espera do tipo (CA-4.2).
- Se eu arrasto para fora da imagem, o retângulo para na borda dela.
- Um clique sem arrastar, ou um arrasto com menos de 10 pixels de largura ou de altura na tela, não cria nada.
- Arrastar sobre a imagem aberta só desenha: a imagem não sai do lugar nem fica azul, como se fosse um texto selecionado.
- Eu posso começar um retângulo em cima de outro que já existe.

**CA-4.2 Dizer se é "gosto" ou "não gosto"**
- Dado que eu acabei de desenhar um retângulo,
- quando eu clico em "Gosto" ou em "Não gosto",
- então a marcação passa a existir: é guardada sozinha, aparece na imagem e na lista ao lado com o seu número e o seu tipo, e o cursor vai para a caixa de comentário dela.
- Se eu clico em "Cancelar", desenho outro retângulo, fecho a imagem ou passo para outra sem escolher o tipo, o retângulo some e nada é guardado.

**CA-4.3 Ver as marcações de uma imagem**
- Dado que uma imagem tem marcações,
- quando eu a abro,
- então cada marcação aparece como um retângulo sobre a imagem, no lugar em que eu desenhei, com o seu número; ao lado da imagem, uma lista traz cada marcação com o número, o tipo e o comentário.
- "Gosto" e "não gosto" são diferentes pela cor e também por um sinal ou palavra: dá para saber qual é qual sem depender da cor.
- A caixa da nota continua lá, e o cursor começa nela, como no CA-3.1.

**CA-4.4 Escrever o comentário**
- Dado que uma imagem aberta tem marcações,
- quando eu escrevo na caixa de comentário de uma delas,
- então o texto é guardado sozinho, sem botão de salvar, e a tela mostra que foi guardado.
- O texto fica exatamente como eu digitei: acentos, emojis, quebras de linha e espaços.
- O que eu digitei até o instante de fechar a imagem ou de passar para outra fica guardado.

**CA-4.5 Trocar o tipo**
- Dado que uma marcação existe,
- quando eu troco o tipo dela na lista, de "gosto" para "não gosto" ou o contrário,
- então a mudança é guardada sozinha e aparece na lista e no retângulo; o comentário e a área não mudam.

**CA-4.6 Apagar uma marcação**
- Dado que uma marcação existe,
- quando eu clico em "Apagar" nela,
- então ela some da imagem e da lista, e as seguintes sobem um número.
- Se o comentário dela não está vazio, a tela pede confirmação antes, porque o meu texto é apagado. Se eu cancelo, nada muda.
- Apagar uma marcação não mexe na nota, nas outras marcações nem na seleção da imagem.

**CA-4.7 Sinal de marcação na grade**
- Dado que uma imagem tem pelo menos uma marcação,
- quando eu olho a grade,
- então essa imagem mostra um sinal pequeno com a quantidade de marcações; as imagens sem marcação não mostram.
- O sinal muda sem eu recarregar a página, conforme eu crio ou apago marcações. O sinal de nota (CA-3.5) continua como está.

**CA-4.8 Fechar e voltar**
- Dado que eu fiz marcações,
- quando eu fecho o refpack e abro de novo,
- então cada imagem traz as mesmas marcações, com a mesma área, o mesmo tipo, o mesmo comentário e a mesma ordem, e a grade mostra os mesmos sinais.

**CA-4.9 As marcações saem no pacote**
- Dado que uma imagem selecionada tem marcações,
- quando o pacote é gerado,
- então ele traz, na pasta `marks/`, para cada marcação:
  - o recorte, nomeado com o número da imagem e o número da marcação (`marks/01-2.png` é a marcação 2 de `refs/01.png`);
  - se o comentário não está vazio, um arquivo com o mesmo nome (`marks/01-2.md`), com o meu texto exatamente como digitei e sem nada acrescentado.
- O `README.md` mostra, embaixo de cada referência, as marcações dela: o número, o tipo (em inglês, "like" ou "dislike"), o arquivo do recorte, o arquivo do comentário quando existe, e onde a área fica na imagem, em porcentagem da largura e da altura.
- O `README.md` diz ao agente, em inglês, que "like" é algo a aproveitar e "dislike" é algo a evitar, e avisa que os comentários são do dono e podem estar em outra língua.
- Marcação sem comentário sai só com o recorte e a linha no `README.md`. Se nenhuma imagem selecionada tem marcação, o pacote não tem a pasta `marks/` e o `README.md` não fala dela.
- As marcações de uma imagem que não está selecionada não entram no pacote.
- O que eu acabei de digitar num comentário entra no pacote, mesmo que eu feche a imagem e clique em "Gerar pacote" logo em seguida.
- No teste manual do dono, o Claude Code, ao ler a pasta, consegue dizer, para cada marcação, qual parte da imagem é, se é para aproveitar ou evitar, e o que o comentário pede.

**CA-4.10 Começar outro pacote não apaga marcações**
- Dado que há imagens com marcações,
- quando eu clico em "Começar outro pacote" e confirmo,
- então a seleção e a intenção ficam vazias, como no CA-2.10, e todas as marcações continuam como estavam.

**CA-4.11 A tela ficou aberta com o refpack parado**
- Dado que eu parei o refpack no terminal e a tela continuou aberta no navegador, com uma imagem aberta,
- quando eu desenho um retângulo e escolho o tipo, troco o tipo de uma marcação ou apago uma,
- então a tela avisa, na língua da tela, que não conseguiu guardar, e as marcações continuam como estavam antes: a nova não aparece, o tipo não muda, a apagada continua lá.
- Quando eu escrevo num comentário, vale o mesmo do CA-3.9 para a nota: o aviso aparece, o texto continua na caixa sem a indicação de guardado, e a tela pergunta antes de eu sair da imagem sem guardar.

**CA-4.12 Imagem adicionada logo que a tela abre**
- Dado que a tela acabou de abrir e a lista de imagens ainda não carregou,
- quando eu colo ou solto uma imagem,
- então ela aparece uma vez só na grade.

**CA-4.13 Tela e refpack em versões diferentes**
- Dado que o refpack foi atualizado e eu rodei `pnpm start` sem parar o que já estava rodando (a tela é a nova, o refpack ainda é o antigo),
- quando a tela abre,
- então ela mostra um aviso, na língua da tela, de que a tela e o refpack estão em versões diferentes e de que é preciso parar o refpack no terminal e rodar `pnpm start` de novo.
- A tela não fica em branco nem mostra o convite de biblioteca vazia.

**CA-4.14 O teste de adicionar imagens não falha à toa**
- Dado o código da fatia,
- quando o CI roda,
- então o teste do CA-0.3 espera as imagens terminarem de carregar antes de medi-las.
- É conferido pelo CI, não na tela.

**CA-4.15 O teste de adicionar o mesmo arquivo duas vezes não falha à toa**
- Dado o código da fatia,
- quando o CI roda,
- então o teste "o mesmo arquivo adicionado duas vezes aparece duas vezes" passa sempre no Firefox, também com a máquina lenta. A causa da falha de vez em quando é encontrada e corrigida, sem tratamento especial por navegador.
- É conferido pelo CI, não na tela.

**CA-4.16 Os testes do pacote e da intenção não falham à toa**
- Dado o código da fatia,
- quando o CI roda,
- então os testes unitários que gravam arquivos têm tempo para terminar também na máquina Windows lenta, com o mesmo limite em todos os sistemas (ADR-0016);
- e o teste "texto digitado tecla a tecla é salvo inteiro e em ordem" (CA-2.4) passa sempre, também com a máquina lenta. A causa da falha de vez em quando é encontrada; se for um defeito da tela, ele é corrigido.
- É conferido pelo CI, não na tela.

### O que muda nos critérios anteriores

- **CA-3.1:** o botão de cada imagem na grade passa a se chamar "Anotar" (em inglês, "Annotate"), porque agora abre a imagem para a nota e para as marcações.
- **CA-3.3 e CA-3.4:** ao fechar a imagem ou passar para outra, os comentários digitados também ficam guardados (CA-4.4), e um retângulo ainda sem tipo é descartado (CA-4.2).
- **CA-3.9:** a pergunta antes de sair sem guardar vale também para um comentário que não foi guardado (CA-4.11).
- **CA-3.10:** colar um texto com o cursor numa caixa de comentário põe o texto na caixa, como na caixa da nota.
- **CA-0.7, CA-2.6 e CA-3.7:** além das imagens, da intenção e das notas, o pacote leva as marcações das imagens selecionadas (CA-4.9).
- **CA-2.10 e CA-3.8:** "Começar outro pacote" não apaga marcações (CA-4.10).
- **CA-0.3, CA-1.2, CA-1.3 e CA-1.6:** uma imagem adicionada antes de a lista carregar aparece uma vez só (CA-4.12).

### Como estes critérios são conferidos

Os testes automáticos rodam no Chromium e no Firefox (ADR-0010) e simulam o arrastar do mouse sobre a imagem aberta. O recorte é conferido com imagens fabricadas pelo teste, de cores conhecidas.

O teste manual do dono é feito no Firefox, com o mouse de verdade, e termina pedindo ao Claude Code que leia o pacote gerado.

### Fora desta fatia, de propósito

- Mover ou redimensionar uma marcação: para mudar a área, eu apago e desenho de novo.
- Formas que não sejam retângulo.
- Uma cópia da imagem inteira com os retângulos desenhados, dentro do pacote.
- Marcações que valem só para um pacote.
- Tipos além de "gosto" e "não gosto".
- Mudar a ordem das marcações.
- Desfazer o "Apagar".
- Marcar pelo teclado, sem mouse.
- Ampliar a imagem aberta além do tamanho da tela (zoom).
- Ver os retângulos na grade: a grade mostra só o sinal com a quantidade.
- Etiquetas (fatia 5).

## 11. Fatia 5 — etiquetas

**O que eu consigo fazer ao final:** colocar etiquetas numa imagem, reaproveitando as que já usei, e filtrar a grade por uma etiqueta; as etiquetas de cada imagem saem no `README.md` do pacote.

O que vale para as fatias 0 a 4 continua valendo, com as mudanças listadas em "O que muda nos critérios anteriores". Tudo o que não está listado abaixo fica fora desta fatia.

### Definições desta fatia

- **Etiqueta:** uma palavra ou expressão curta, numa linha só, que eu escrevo e coloco numa imagem (por exemplo, "dashboard", "tabela", "muito espaço em branco"). Não há categorias nem lista pronta: a etiqueta é o que eu digito. Tem até 60 caracteres; a caixa não aceita mais que isso.
- **Espaços nas pontas não fazem parte da etiqueta.** O resto fica exatamente como eu digitei: acentos, maiúsculas, emojis e espaços entre as palavras. Uma etiqueta só de espaços, ou vazia, não existe.
- **Mesma etiqueta:** duas etiquetas que diferem só por letras maiúsculas e minúsculas são a mesma ("Dashboard" e "dashboard"). A etiqueta aparece em todo lugar do jeito que foi escrita na primeira vez em que foi criada.
- **Uma etiqueta existe enquanto pelo menos uma imagem a tem.** Quando é tirada da última imagem, ela deixa de existir: não é mais sugerida nem aparece no filtro. Se eu a escrever de novo, ela nasce de novo, com a grafia nova.
- **A etiqueta é da imagem**, como a nota e as marcações: fica guardada com a imagem até eu tirar e vale para todos os pacotes em que a imagem entrar. Uma imagem pode ter várias etiquetas; elas ficam na ordem em que eu as coloquei.
- **Filtro:** uma etiqueta escolhida para a grade mostrar só as imagens que a têm. Só uma de cada vez. O filtro é da tela, não da biblioteca: ao reabrir o refpack, a grade mostra todas as imagens.
- **Imagens mostradas:** as que a grade está mostrando: todas, sem filtro; só as que têm a etiqueta, com filtro.

### Critérios de aceite

**CA-5.1 Ver e colocar etiquetas na imagem aberta**
- Dado que uma imagem está aberta,
- quando eu olho ao lado dela,
- então vejo a seção "Etiquetas" com as etiquetas que essa imagem já tem, na ordem em que foram colocadas, e uma caixa para escrever uma nova.
- Quando eu escrevo na caixa e aperto Enter, ou clico em "Adicionar", a etiqueta é guardada sozinha, aparece na lista da imagem, a caixa fica vazia e o cursor continua nela, para eu escrever a próxima.
- Com a caixa vazia ou só com espaços, Enter e "Adicionar" não fazem nada.
- O cursor continua começando na caixa da nota (CA-3.1).

**CA-5.2 Reaproveitar uma etiqueta que já existe**
- Dado que alguma imagem da biblioteca tem a etiqueta "dashboard",
- quando eu escrevo "Dashboard" (ou "DASHBOARD") em outra imagem,
- então essa imagem recebe a etiqueta "dashboard", escrita como da primeira vez; nenhuma etiqueta nova é criada.
- Se eu escrevo uma etiqueta que a imagem aberta já tem, nada muda: a caixa só fica vazia.

**CA-5.3 Sugestões**
- Dado que uma imagem está aberta,
- quando eu olho embaixo da caixa de etiqueta,
- então vejo, em ordem alfabética, as etiquetas que existem na biblioteca e que esta imagem ainda não tem; conforme eu escrevo, ficam só as que contêm o que eu escrevi, sem distinguir maiúsculas de minúsculas.
- Clicar numa sugestão coloca essa etiqueta na imagem, como no CA-5.1, e a caixa fica vazia.
- Sem nenhuma etiqueta para sugerir, a lista de sugestões não aparece.

**CA-5.4 Tirar uma etiqueta**
- Dado que a imagem aberta tem etiquetas,
- quando eu clico em "Remover" numa delas,
- então ela some da lista da imagem, sem pergunta de confirmação, e a mudança é guardada sozinha.
- Se nenhuma outra imagem tinha essa etiqueta, ela deixa de existir: não aparece mais nas sugestões nem no filtro.
- Tirar uma etiqueta não mexe na nota, nas marcações, nas outras etiquetas nem na seleção da imagem.

**CA-5.5 Etiquetas na grade**
- Dado que uma imagem tem etiquetas,
- quando eu olho a grade,
- então essa imagem mostra as etiquetas dela, em letra pequena, na ordem em que foram colocadas; as imagens sem etiqueta não mostram nada a mais.
- A grade muda sem eu recarregar a página, conforme eu coloco ou tiro etiquetas. Os sinais de nota (CA-3.5) e de marcações (CA-4.7) continuam como estão.

**CA-5.6 Filtrar a grade por etiqueta**
- Dado que a biblioteca tem imagens com etiquetas,
- quando eu escolho uma etiqueta em "Filtrar por etiqueta",
- então a grade mostra só as imagens que têm essa etiqueta, na mesma ordem de sempre, e a tela diz quantas estão sendo mostradas de quantas existem (por exemplo, "Mostrando 4 de 12 imagens").
- A lista do filtro traz, em ordem alfabética, todas as etiquetas que existem na biblioteca, e a opção "Todas as imagens", que é a inicial. Escolher "Todas as imagens" tira o filtro.
- Sem nenhuma etiqueta na biblioteca, o filtro não aparece.
- Se a etiqueta do filtro deixa de existir (CA-5.4), o filtro sai sozinho e a grade volta a mostrar todas as imagens.

**CA-5.7 Selecionar com o filtro ligado**
- Dado que a grade está filtrada,
- quando eu clico em "Selecionar todas" ou em "Limpar seleção",
- então só as imagens mostradas são selecionadas ou tiradas da seleção; as outras continuam como estavam.
- A contagem "X de Y selecionadas" continua falando da biblioteca inteira.
- "Gerar pacote" leva todas as imagens selecionadas, mostradas ou não: o filtro só muda o que eu vejo.

**CA-5.8 Imagem aberta com o filtro ligado**
- Dado que a grade está filtrada e eu abro uma imagem,
- quando eu clico em "Anterior" ou "Próxima",
- então passo só pelas imagens mostradas, na ordem da grade.
- Se eu tiro da imagem aberta a etiqueta do filtro, a imagem continua aberta até eu fechar; ao fechar, ela não está mais na grade. "Anterior" e "Próxima" continuam levando às vizinhas entre as mostradas.

**CA-5.9 Adicionar imagens com o filtro ligado**
- Dado que a grade está filtrada,
- quando eu adiciono imagens (pelo botão, colando ou soltando),
- então o filtro sai sozinho e a grade mostra todas as imagens, com as novas primeiro, como sempre.

**CA-5.10 Fechar e voltar**
- Dado que eu coloquei etiquetas,
- quando eu fecho o refpack e abro de novo,
- então cada imagem traz as mesmas etiquetas, na mesma ordem, a grade mostra as mesmas etiquetas em cada imagem, e o filtro está em "Todas as imagens".

**CA-5.11 As etiquetas saem no pacote**
- Dado que uma imagem selecionada tem etiquetas,
- quando o pacote é gerado,
- então a linha dessa referência no `README.md` traz as etiquetas dela, entre aspas, na ordem em que foram colocadas e exatamente como escritas.
- O `README.md` diz ao agente, em inglês, que as etiquetas são palavras do dono, podem estar em outra língua, e que imagens com a mesma etiqueta têm algo em comum.
- Imagem selecionada sem etiqueta não ganha nada na linha. Se nenhuma imagem selecionada tem etiqueta, o `README.md` não fala de etiquetas.
- As etiquetas de uma imagem que não está selecionada não entram no pacote.
- No teste manual do dono, o Claude Code, ao ler a pasta, consegue dizer quais etiquetas cada referência tem.

**CA-5.12 Começar outro pacote não apaga etiquetas**
- Dado que há imagens com etiquetas,
- quando eu clico em "Começar outro pacote" e confirmo,
- então a seleção e a intenção ficam vazias, como no CA-2.10, e todas as etiquetas continuam como estavam. O filtro também não muda.

**CA-5.13 A tela ficou aberta com o refpack parado**
- Dado que eu parei o refpack no terminal e a tela continuou aberta no navegador, com uma imagem aberta,
- quando eu coloco ou tiro uma etiqueta,
- então a tela avisa, na língua da tela, que não conseguiu guardar; as etiquetas da imagem continuam como estavam, e o texto que eu digitei continua na caixa.

### O que muda nos critérios anteriores

- **CA-2.2:** com o filtro ligado, "Selecionar todas" e "Limpar seleção" agem só sobre as imagens mostradas (CA-5.7). Sem filtro, nada muda.
- **CA-3.4:** com o filtro ligado, "Anterior" e "Próxima" passam só pelas imagens mostradas (CA-5.8).
- **CA-0.3, CA-1.2, CA-1.3 e CA-1.6:** adicionar imagens com o filtro ligado tira o filtro (CA-5.9).
- **CA-0.7, CA-2.6, CA-3.7 e CA-4.9:** o `README.md` do pacote leva também as etiquetas das imagens selecionadas (CA-5.11).
- **CA-2.10, CA-3.8 e CA-4.10:** "Começar outro pacote" não apaga etiquetas (CA-5.12).

### Como estes critérios são conferidos

Os testes automáticos rodam no Chromium e no Firefox (ADR-0010). O teste manual do dono é feito no Firefox e termina pedindo ao Claude Code que leia o pacote gerado.

### Fora desta fatia, de propósito

- Categorias de etiqueta (tipo de tela, componente, aspecto) e lista pronta de etiquetas.
- Renomear uma etiqueta, ou tirá-la de todas as imagens de uma vez.
- Etiquetar várias imagens de uma vez, ou etiquetar direto na grade sem abrir a imagem.
- Filtrar por mais de uma etiqueta, ou por "sem etiqueta".
- Lembrar o filtro ao reabrir o refpack.
- Escolher uma sugestão pelas setas do teclado: é por clique, ou escrevendo a etiqueta inteira.
- Buscar imagens por texto da nota, do comentário ou da etiqueta.
- Cores ou ícones nas etiquetas.
- Etiquetas sugeridas pela IA (fatia 7).

## 12. Depois

O que é parte da visão mas não cabe na fatia atual vai para a lista "Depois", que vive em um lugar só: o `ROADMAP.md`. Nada dessa lista é construído sem antes virar fatia, por decisão do dono.

## 13. Fora do escopo

- Contas, login, nuvem, vários usuários.
- Celular.
- Instalação e suporte para outras pessoas.
- Proteção contra situações que eu não causo em uso normal: queda de energia no meio de uma gravação, dois programas gravando ao mesmo tempo, arquivos da biblioteca editados à mão.
