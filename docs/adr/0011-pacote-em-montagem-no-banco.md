# ADR-0011: O pacote em montagem fica no banco da biblioteca

- **Estado:** Aceito
- **Data:** 2026-11-10

## Contexto

A fatia 2 cria o "pacote em montagem": quais imagens estão selecionadas e o texto da intenção. O dono decidiu que ele fica guardado até ser mudado: não se perde ao fechar o refpack nem ao gerar o pacote, e só existe um.

Quem gera o pacote é o servidor. Ele precisa saber a seleção e a intenção na hora de gerar.

## Decisão

1. **A seleção e a intenção ficam no `library.db`**, junto com o registro das imagens (ADR-0004).
2. **A seleção é uma coluna da tabela de imagens** (`selected`), criada pela migração `002`.
3. **A intenção é a única linha de uma tabela nova** (`pack_draft`), criada pela migração `003`.
4. **Gerar o pacote não recebe dados da tela.** O servidor lê a seleção e a intenção do banco.
5. **No pacote, a intenção vai num arquivo próprio, `INTENT.md`**, com o texto do dono byte a byte. O `README.md` só aponta para ele.

## Alternativas rejeitadas

- **Guardar no navegador** (onde já fica a língua da tela) e mandar tudo junto ao gerar: a seleção se perderia ao trocar de navegador ou limpar os dados dele, e a cópia de segurança deixaria de ser "copiar a pasta da biblioteca".
- **Tabela separada só para a seleção:** útil quando houver vários pacotes em montagem, o que está fora desta fatia (R2: nenhum campo para o futuro).
- **Escrever a intenção dentro do `README.md`:** o texto do dono pode conter símbolos que o Markdown interpreta, e se misturaria com o texto da ferramenta. Em arquivo próprio ele sai idêntico ao digitado.

## Consequências

- Uma biblioteca criada nas fatias 0 e 1 é atualizada sozinha ao abrir: todas as imagens começam sem seleção e a intenção começa vazia.
- Copiar a pasta da biblioteca leva junto o pacote em montagem.
- Se um dia houver vários pacotes em montagem, a coluna `selected` dá lugar a uma tabela, por migração e ADR novos.
