# ADR-0014: A imagem aberta usa o diálogo do próprio navegador

- **Estado:** Aceito
- **Data:** 2026-11-11

## Contexto

Na fatia 3 o dono abre uma imagem em tamanho grande, por cima da grade, com a caixa da nota ao lado (SPEC, seção 9). Enquanto ela está aberta, o resto da tela não pode ser usado, a tecla Esc fecha, e ao fechar ele volta à grade no mesmo ponto (CA-3.3). Colar e soltar não adicionam imagens nesse momento (CA-3.10).

O projeto não tem biblioteca de componentes, e uma dependência nova exige ADR.

## Decisão

1. **A imagem aberta é um `<dialog>` do HTML, aberto como modal** (`showModal()`). O navegador cuida de três coisas que teriam de ser escritas à mão: deixar o resto da tela sem uso enquanto o diálogo está aberto, manter o teclado dentro dele e avisar quando o dono aperta Esc.
2. **A grade continua montada por baixo.** Por isso, ao fechar, ela está no mesmo ponto, sem código para lembrar a posição.
3. **Quem fecha é sempre o código do refpack, nunca o navegador sozinho.** O aviso de Esc é interceptado e passa pelo mesmo caminho dos botões "Fechar", "Anterior" e "Próxima": primeiro espera a nota ser guardada (ADR-0012) e, se não foi possível guardar, pergunta antes de sair (CA-3.9).
4. **Só uma imagem fica aberta por vez.** A tela principal guarda qual é. Passar para a anterior ou a próxima troca a imagem aberta; não abre um segundo diálogo.
5. **Enquanto uma imagem está aberta, o tratamento de colar e soltar fica em pausa:** continua impedindo o navegador de trocar a página, mas não adiciona nada nem mostra aviso.

## Alternativas rejeitadas

- **Uma camada própria por cima da tela** (um bloco comum, posicionado): o bloqueio do resto da tela, o teclado e a tecla Esc teriam de ser escritos e testados à mão, nos dois navegadores.
- **Uma tela separada para a imagem, no lugar da grade:** o projeto não tem navegação entre telas, e a posição da grade teria de ser guardada e restaurada.
- **Uma biblioteca de diálogos:** dependência nova para algo que o navegador já faz.

## Consequências

- Nenhuma dependência nova.
- Nos testes de ponta a ponta, enquanto a imagem está aberta, o que fica por baixo não responde a cliques nem aparece para o teste como utilizável. Os testes fecham a imagem antes de mexer na grade.
- As marcações da fatia 4 serão desenhadas dentro deste mesmo diálogo.
