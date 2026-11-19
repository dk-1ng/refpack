# ADR-0019: O teste de uso é feito por um agente, e o dono aprova pelo relatório

- **Estado:** Aceito
- **Data:** 2026-11-19

## Contexto

Até a fatia 5, o dono fechava cada fatia seguindo à mão um roteiro de teste de cerca de 15 passos, no Firefox, com a biblioteca dele. O dono decidiu que esse roteiro passa a ser feito por um agente: ele aprova a fatia lendo o relatório, sem abrir o app. Decidiu também que um defeito encontrado nesse teste é corrigido antes de chegar a ele, com no máximo 2 rodadas de correção.

O Claude Code desta máquina tem uma ferramenta que controla um navegador de verdade: abre a página, clica, digita, cola e tira foto da tela. Conferido em 2026-11-19, ela abre o **Chrome**, não o Firefox.

## Decisão

1. **O nome passa a ser "teste de uso".** O plano de cada fatia continua terminando com um roteiro de passos numerados, cada um com o que fazer, o resultado esperado e os critérios de aceite que confere.
2. **Quem faz:** um agente novo, que não escreveu nada da fatia. É um Sonnet com esforço `medium`, chamado com modelo e esforço explícitos e com o texto-padrão do `docs/WORKFLOW.md`. Sem arquivo de agente próprio (ADR-0009, item 9).
3. **Quando:** depois da revisão da fatia aprovada e do CI verde, antes da entrega ao dono.
4. **Biblioteca de teste fabricada, nunca a do dono.** O agente cria uma biblioteca numa pasta temporária com acentos e espaços no nome (`REFPACK_LIBRARY`), com imagens geradas na hora. Ele a preenche rodando o app na versão do `main`, que é a versão anterior. Depois para o app e o roda de novo a partir do branch da fatia. Assim o passo "os dados antigos continuam lá" é conferido sem tocar nos dados do dono. O app roda com `REFPACK_PORT` próprio e `REFPACK_NO_OPEN`.
5. **Navegador:** a ferramenta de navegador do Claude Code, que abre o Chrome. O Firefox continua coberto pelos testes automáticos (ADR-0010).
6. **"O Claude Code lê o pacote":** o próprio agente lê a pasta gerada e escreve o que entendeu dela. Esse texto é comparado com o esperado do roteiro.
7. **O que fica fora do alcance do agente:** tudo o que acontece fora da página. Por exemplo, colar direto da ferramenta de captura do sistema, arrastar do gerenciador de arquivos, a janela do sistema para escolher uma pasta e o navegador abrindo sozinho. O plano marca esses passos como "fora do alcance do agente". O agente faz o equivalente mais próximo dentro da página e o relatório diz isso com todas as letras. Na aprovação do plano, o dono decide se confere algum deles pessoalmente; se não, o passo fica coberto só pelo equivalente.
8. **Relatório:** a primeira linha diz `APROVADO` ou `DEFEITOS`. Depois vem uma linha por passo, com o esperado, o que aconteceu e o caminho da foto. O relatório e as fotos ficam fora do repositório e nunca são commitados.
9. **Defeito:** é corrigido com teste primeiro, como qualquer defeito. Depois de cada rodada de correção, o agente refaz os passos que falharam. **No máximo 2 rodadas**; se o defeito continuar, a execução para e volta-se à especificação.
10. **Aprovação do dono:** ele lê o relatório e responde "aprovado" ou descreve o problema. Se algo faz o que o critério diz mas não do jeito que ele queria, e ele só descobrir isso usando o app depois, vira mudança de SPEC numa próxima fatia ou item de "Depois".

## Alternativas rejeitadas

- **O dono continua fazendo o roteiro:** decisão do dono.
- **O agente faz o roteiro e o dono ainda dá uma olhada rápida no app:** decisão do dono.
- **Configurar a ferramenta de navegador para abrir o Firefox:** exige mudar a configuração global do Claude Code, fora do projeto, e uma atualização da ferramenta desfaria a mudança. O Firefox já é coberto pelos testes automáticos.
- **Opus como agente do teste:** o roteiro traz o resultado esperado de cada passo, então seguir e comparar é o trabalho de um executor. Se o Sonnet não conseguir operar um passo, vale a escalada de sempre: um Opus novo assume.
- **Usar uma cópia da biblioteca do dono:** as imagens dele iriam para as fotos do relatório, e o teste dependeria do que houver na biblioteca naquele dia.

## Consequências

- O item 10 da Definition of Done passa a ser: o teste de uso terminou aprovado e o dono aprovou o relatório.
- Ninguém mais confere à mão, no Firefox e com o mouse, o que só aparece de verdade lá. Defeitos que só aparecem no Firefox dependem dos testes automáticos.
- O dono só vê a aparência da tela pelas fotos do relatório.
- A ferramenta de navegador grava arquivos na pasta `.playwright-mcp/` do projeto; ela entra no `.gitignore`.
- O ADR-0009 fica com o teste manual do dono marcado como superado por este ADR.
