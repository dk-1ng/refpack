# ADR-0002: Forma do produto — app local que abre no navegador

- **Estado:** Aceito
- **Data:** 2026-11-09

## Contexto

O dono quer fazer tudo numa tela visual: ver imagens, marcar partes delas, montar e gerar o pacote. A ferramenta é para uma pessoa, num computador, e precisa passar nos testes em Linux, Windows e Mac. O pacote é uma pasta no disco, que o Claude Code lê.

Uma página de navegador sozinha não consegue gravar pastas livremente no disco; alguma parte do programa precisa rodar fora do navegador.

## Decisão

O refpack é um **app local** com duas partes:

- um **servidor pequeno** que roda no próprio computador, guarda as imagens e grava os pacotes no disco;
- uma **tela** que abre no navegador e conversa só com esse servidor.

Um único comando (`pnpm start`) inicia o servidor e abre a tela.

## Alternativas rejeitadas

- **App de desktop empacotado** (Electron, Tauri): exigiria montar e testar um instalador por sistema operacional, o que não cabe em fatias de 1 a 2 dias e não traz nada que o dono pediu.
- **Serviço hospedado na internet:** contraria "local e privado" e exigiria conta e nuvem, que estão fora do escopo.
- **Linha de comando como interface principal** (a tentativa antiga): o dono não é desenvolvedor e pediu uma tela.

## Consequências

- O dono inicia a ferramenta por um comando no terminal. Um atalho de um clique pode virar fatia no futuro.
- Por haver um servidor local, ele precisa recusar pedidos que não venham da própria máquina (ADR-0007).
- A mesma tela pode, no futuro, ser usada junto com uma conversa com o Claude Code, sem mudar esta decisão.
