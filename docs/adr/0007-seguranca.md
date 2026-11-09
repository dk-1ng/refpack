# ADR-0007: Segurança

- **Estado:** Aceito
- **Data:** 2026-11-09

## Contexto

O refpack roda no computador de uma pessoa, com a conta dela, e guarda imagens que ela mesma escolheu. Há um servidor local (ADR-0002). O repositório é público.

A tentativa antiga adotou um modelo de ameaças amplo (queda de energia, gravadores simultâneos, bibliotecas clonadas de estranhos, links simbólicos, antivírus do Windows). Cada item gerou código, testes e achados de revisão, sem que o dono tivesse esses problemas.

## Decisão

**Quem é protegido de quê:** uma pessoa, no próprio computador, protegida de (a) outros sites e outras máquinas alcançarem o servidor local, (b) arquivos que ela adiciona causarem dano, e (c) dados dela vazarem para o repositório público.

1. **Servidor só local.** Escuta apenas em `127.0.0.1`. Recusa pedidos cujo cabeçalho `Host` não seja o endereço local e pedidos vindos de outra origem (`Origin`). Isso impede que um site aberto no navegador converse com o refpack.
2. **Sem rede para fora.** A ferramenta não faz nenhuma chamada à internet: sem telemetria, sem conta, sem carregar código remoto.
3. **Entrada conferida na fronteira.** Todo pedido ao servidor é validado com zod. Um arquivo enviado tem o tipo conferido pelo conteúdo (não só pela extensão) e o tamanho limitado.
4. **Caminhos nunca vêm do usuário.** Nomes de arquivo na biblioteca e no pacote são gerados pela ferramenta. O servidor só grava dentro da pasta da biblioteca.
5. **O servidor não interpreta o conteúdo das imagens.** Ele guarda e entrega os bytes; quem desenha a imagem é o navegador.
6. **Texto do usuário é sempre exibido como texto**, nunca inserido como HTML.
7. **Nada da coleção no repositório.** A biblioteca fica fora dele; o CI recusa arquivos de mídia (ADR-0006).

**Fora do modelo, de propósito:** quem já controla a conta do usuário; queda de energia no meio de uma gravação; dois programas gravando na biblioteca ao mesmo tempo; arquivos da biblioteca editados à mão; uso em vários computadores.

## Alternativas rejeitadas

- **O modelo de ameaças da tentativa antiga:** pensado para um produto público, com vários computadores e bibliotecas de terceiros.
- **Senha ou token para a tela local:** atrito diário para proteger de um risco que os itens 1 e 2 já cobrem.

## Consequências

- O revisor mede contra esta lista e contra os critérios de aceite. Uma condição fora do modelo não é achado.
- Uma funcionalidade que traga risco novo (por exemplo, capturar páginas da internet, ou o agente gravando sugestões) pede um ADR de segurança próprio antes de ser construída.
- As regras do dia a dia sobre segredos, dependências e dados sensíveis estão em `SECURITY.md`.
