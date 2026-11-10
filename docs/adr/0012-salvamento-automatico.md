# ADR-0012: Salvamento automático — na hora, um de cada vez, e a tela só mostra o que foi confirmado

- **Estado:** Aceito
- **Data:** 2026-11-10

## Contexto

Na fatia 2 o dono seleciona imagens e escreve a intenção, e tudo se guarda sozinho, sem botão de salvar (CA-2.4). Na fatia 3 as notas das imagens vão se guardar do mesmo jeito.

Três coisas não podem acontecer: o texto chegar ao servidor fora de ordem (uma versão antiga por cima da nova), o dono gerar o pacote antes de o último trecho digitado ter sido guardado (CA-2.6), e a tela mostrar como guardado o que não foi (CA-2.11).

## Decisão

1. **Cada mudança é enviada na hora**, sem esperar o dono parar de digitar. O servidor é local; o envio leva milésimos de segundo.
2. **Texto: um envio de cada vez, e sempre o mais recente.** Enquanto um envio está a caminho, a tela guarda só a última versão do texto; quando o envio termina, manda essa versão, se for diferente. Nunca há dois envios do mesmo texto ao mesmo tempo, então a ordem não se perde.
3. **Antes de gerar o pacote, a tela espera o envio pendente terminar.**
4. **A tela só mostra o que o servidor confirmou.** Uma imagem só aparece selecionada depois da resposta do servidor. A indicação "Salvo" só aparece quando o texto que está na caixa é o que foi confirmado.
5. **Se o envio falha, o texto continua na caixa** e a tela avisa. A próxima mudança, ou o clique em "Gerar pacote", tenta de novo.

## Alternativas rejeitadas

- **Esperar uma pausa na digitação para enviar** (o jeito mais comum): o trecho digitado no último instante se perde se o dono fechar a aba ou gerar o pacote logo em seguida, e os testes precisariam esperar por relógio.
- **Mostrar a mudança na hora e desfazer se falhar:** por um instante a tela mostraria como guardado o que não foi.
- **Botão "Salvar":** o SPEC pede que se guarde sozinho.

## Consequências

- Digitar gera um pedido ao servidor por tecla, no máximo um por vez. Para um servidor local isso é irrelevante.
- A regra do item 2 vive em um arquivo só (`src/web/pack/saver.ts`), com testes próprios, e será reutilizada pelas notas na fatia 3.
- O ADR não cobre o servidor parar no meio de um envio além do aviso do item 5; isso está fora do modelo (ADR-0007).
