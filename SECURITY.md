# Segurança — refpack

O refpack é uma ferramenta local, feita para uma pessoa usar no próprio computador. Este arquivo reúne as regras do dia a dia. O raciocínio por trás delas está no [ADR-0007](docs/adr/0007-seguranca.md).

## Segredos

- **A ferramenta não precisa de nenhum segredo.** Não há chave de API, senha nem token: a IA usada é o Claude Code do próprio usuário, fora do refpack.
- Arquivos `.env` nunca são commitados (estão no `.gitignore`).
- Nenhum segredo aparece em código, testes, documentos, mensagens de commit, issues ou pull requests.
- No GitHub, a detecção de segredos (secret scanning, com bloqueio no push) fica ligada desde a criação do repositório.
- Se um segredo vazar: ele é trocado na origem imediatamente. Apagar o commit não basta.

## Dependências

- **Dependência nova só com ADR aprovado** antes de instalar. A lista permitida está no [ADR-0003](docs/adr/0003-stack.md).
- Só licenças permissivas: MIT, Apache-2.0, BSD ou ISC.
- Versões fixadas com número exato; o `pnpm-lock.yaml` é commitado e o CI instala exatamente o que está nele.
- Scripts de instalação de dependências ficam desligados, salvo exceção registrada em ADR.
- Os alertas de vulnerabilidade do GitHub (Dependabot) ficam ligados. Subir a versão de uma dependência é uma tarefa própria, com `pnpm check` verde.
- No CI, as ações são fixadas por identificador de commit e rodam só com permissão de leitura.

## Dados sensíveis

- **A biblioteca do usuário fica fora do repositório** (por padrão, `refpack-library` na pasta pessoal). Ela contém imagens de terceiros e anotações pessoais.
- **Nenhuma imagem ou vídeo entra no repositório**, nem em issues ou pull requests. O CI recusa arquivos de mídia. Os testes fabricam as próprias imagens.
- **Nada pessoal no repositório:** nomes de clientes, projetos ou briefings reais, caminhos da máquina do usuário, capturas de tela da biblioteca dele.
- Cada pacote gerado leva um `.gitignore` que ignora todo o seu conteúdo, para não ser commitado por engano num projeto de destino.
- **O servidor só atende a própria máquina** e recusa pedidos de outros sites ou computadores. A ferramenta não faz chamadas à internet e não coleta dados de uso.

## Fora do modelo de ameaças

Quem já controla a conta do usuário no computador; queda de energia no meio de uma gravação; dois programas gravando na biblioteca ao mesmo tempo; arquivos da biblioteca editados à mão; a segurança do agente de IA que lê os pacotes.

## Reportar uma vulnerabilidade

Use o recurso de relato privado de vulnerabilidade do GitHub neste repositório (aba *Security* → *Report a vulnerability*). Não abra uma issue pública. Diga o que encontrou, como reproduzir e o impacto esperado.

Só o último commit de `main` recebe correções.
