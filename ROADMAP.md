# ROADMAP — refpack

Uma linha por fatia, dizendo o que eu consigo usar e testar ao final. A ordem segue o valor: o pacote existe desde a fatia 0 e cada fatia seguinte o deixa mais rico.

Cada fatia tem tamanho fixo de **1 a 2 dias**. O que não couber sai da fatia e vai para "Depois"; o prazo não estica.

Só a próxima fatia é detalhada (critérios de aceite no `SPEC.md`, tarefas em `docs/slices/`). As outras ficam em uma linha até a vez delas.

| # | Fatia | O que eu consigo fazer ao final | Estado |
| --- | --- | --- | --- |
| 0 | Walking skeleton | Abrir o refpack, adicionar uma imagem, vê-la na tela e gerar uma pasta-pacote que o Claude Code lê. | feita |
| 1 | Colar e arrastar | Colar um screenshot da área de transferência e arrastar arquivos para a tela; eles entram na biblioteca como os escolhidos pelo botão. | feita |
| 2 | Escolher e dizer a intenção | Escolher quais imagens entram no pacote e escrever a intenção do projeto, que sai no pacote. | feita |
| 3 | Nota geral | Escrever uma nota em cada imagem; ela salva sozinha, fica exatamente como escrevi e sai no pacote. | feita |
| 4 | Marcar partes | Marcar áreas de uma imagem com "gosto" ou "não gosto" e um comentário; o pacote traz o recorte de cada marcação. | próxima |
| 5 | Etiquetas | Etiquetar imagens e filtrar a grade por etiqueta. | roteiro |
| 6 | Entrada em volume | Importar uma pasta inteira; a grade continua rápida com milhares de imagens. | roteiro |
| 7 | Sugestões da IA | Pedir ao Claude Code que descreva as imagens novas e revisar cada sugestão: aceitar, corrigir ou rejeitar. | roteiro |
| 8 | Famílias | Receber famílias estéticas propostas pela IA, aprovar, renomear ou desfazer, e montar um pacote a partir de uma delas. | roteiro |
| 9 | Retorno | Guardar o resultado que o agente gerou, anotar o que acertou e errou, e promovê-lo a referência. | roteiro |

## Entram como critérios na próxima fatia

Decisão do dono ao aprovar a fatia 3. O arquiteto escreve os critérios no `SPEC.md` ao planejar a fatia 4.

- Uma imagem colada ou solta logo que a tela abre, antes de a lista carregar, aparece uma vez só na grade.
- O teste do CA-0.3 espera as imagens carregarem antes de medi-las, sem falhar de vez em quando no CI.
- Quando a tela e o servidor estão em versões diferentes (refpack atualizado sem reiniciar), a tela avisa em vez de mostrar a grade vazia.

## Depois

Ideias aprovadas como parte da visão, sem fatia marcada. Entram no roteiro só por decisão do dono.

- Links de página com captura da página inteira.
- Vídeos curtos.
- Outros destinos do pacote: chat, geradores de interface, geradores de imagem.
- "Proibições" e "descrição da estética" como itens do pacote.
- Montar e gerar o pacote conversando com o Claude Code.
- IA automática dentro da ferramenta, com chave de API.
- Importar de Pinterest e de favoritos do navegador.
- A mesma biblioteca em vários computadores.
- Escolher a pasta de destino do pacote.
- Apagar uma imagem da biblioteca.
- Detecção de imagens repetidas.
- Limpeza técnica: conferir com zod o nome original do arquivo que chega junto com a imagem.
- Rodar `pnpm start` com o refpack já aberto mostra só o aviso, sem a linha de erro do pnpm depois dele.
- Avisos que somem sozinhos ou têm botão de fechar. Hoje eles se acumulam até recarregar a página.
- Reordenar as imagens arrastando na grade.
- Arrastar um texto e soltar na caixa da intenção põe o texto na caixa, sem o aviso de "não havia imagem para adicionar".
- Colar na caixa da intenção algo que traz texto e imagem juntos (por exemplo, células de uma planilha) põe o texto na caixa.
- "Gerar pacote" com o refpack parado mostra o aviso de que não foi possível salvar, em vez de "Algo deu errado".
- Depois de "Começar outro pacote", o caminho do último pacote gerado deixa de aparecer na tela.
