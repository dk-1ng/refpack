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

Em cada imagem eu escrevo uma nota geral, marco partes com "gosto" ou "não gosto" e um comentário, e coloco etiquetas (tipo de tela, componente, aspecto).

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

## 7. Depois

O que é parte da visão mas não cabe na fatia atual vai para a lista "Depois", que vive em um lugar só: o `ROADMAP.md`. Nada dessa lista é construído sem antes virar fatia, por decisão do dono.

## 8. Fora do escopo

- Contas, login, nuvem, vários usuários.
- Celular.
- Instalação e suporte para outras pessoas.
- Proteção contra situações que eu não causo em uso normal: queda de energia no meio de uma gravação, dois programas gravando ao mesmo tempo, arquivos da biblioteca editados à mão.
