# ADR-0013: A nota fica no registro da imagem e sai no pacote em arquivo próprio

- **Estado:** Aceito
- **Data:** 2026-11-11

## Contexto

A fatia 3 cria a nota geral: um texto livre por imagem. O dono decidiu que a nota é da imagem, não do pacote em montagem: fica guardada até ele mudar e vale para todos os pacotes em que a imagem entrar (SPEC, seção 9).

O pacote precisa levar a nota de cada imagem selecionada de um jeito que o agente saiba a qual imagem ela pertence, sem que o texto do dono seja alterado.

## Decisão

1. **A nota é uma coluna da tabela de imagens** (`note`), criada pela migração `004`. Toda imagem tem uma nota; a que nunca foi escrita é um texto vazio.
2. **A lista de imagens que a tela recebe já traz a nota de cada uma.** A tela não faz um pedido a mais ao abrir uma imagem, e o sinal de "tem nota" da grade sai do mesmo dado.
3. **A nota é guardada por um pedido próprio, por imagem,** com a regra do ADR-0012: na hora, um envio de cada vez, e a tela só mostra o que o servidor confirmou. Cada imagem aberta tem a sua fila de envio.
4. **No pacote, cada nota vai num arquivo próprio, `notes/NN.md`,** com o mesmo número da imagem em `refs/` e o texto do dono byte a byte. O `README.md` só aponta para o arquivo, na linha da referência. Nota vazia não gera arquivo; sem nenhuma nota, a pasta `notes/` não existe.

## Alternativas rejeitadas

- **Tabela separada para as notas:** útil se uma imagem tivesse várias notas, o que não existe (R2: nenhum campo para o futuro).
- **Escrever as notas dentro do `README.md`, ou todas num arquivo só:** o texto do dono pode conter símbolos que o Markdown interpreta (títulos, listas) e se misturaria com o texto da ferramenta. É o mesmo motivo do `INTENT.md` (ADR-0011).
- **Arquivo da nota ao lado da imagem, dentro de `refs/`:** `refs/` deixaria de ser "só imagens", que é o que o `README.md` diz ao agente.
- **Mandar à tela só um "tem nota" e buscar o texto ao abrir a imagem:** pede uma rota a mais e um estado de "carregando" na tela, sem ganho no tamanho de biblioteca de hoje.

## Consequências

- Uma biblioteca criada nas fatias 0 a 2 é atualizada sozinha ao abrir: todas as imagens começam com a nota vazia; a seleção e a intenção não mudam.
- Copiar a pasta da biblioteca leva as notas junto.
- "Começar outro pacote" não toca nas notas: elas não fazem parte do pacote em montagem (ADR-0011).
- Com milhares de imagens, mandar todas as notas na lista pode pesar. Isso é reavaliado na fatia de entrada em volume, junto com as miniaturas (ADR-0004).
- As marcações da fatia 4 terão formato próprio, decidido em ADR naquela fatia.
