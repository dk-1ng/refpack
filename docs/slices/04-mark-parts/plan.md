# Fatia 4 — Marcar partes: plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task, with the overrides in `docs/WORKFLOW.md`. Steps use checkbox (`- [ ]`) syntax for tracking.

**Objetivo:** o dono abre uma imagem, desenha um retângulo sobre uma parte dela, diz se é "gosto" ou "não gosto" e escreve um comentário; o pacote sai com o recorte de cada marcação, o tipo e o comentário.

**Arquitetura:** as marcações ficam numa tabela nova e chegam à tela junto com a lista de imagens (ADR-0015). Ao criar uma marcação, o navegador recorta a área da imagem original num PNG e o envia ao servidor, que o guarda em `marks/` dentro da biblioteca; o pacote copia esses arquivos. Na tela, a imagem aberta (ADR-0014) ganha uma moldura do tamanho exato da imagem, onde os retângulos são desenhados em porcentagem, e uma lista de marcações ao lado da nota. O comentário salva pela fila que já existe (ADR-0012).

**Stack:** a das fatias 0 a 3, sem dependência nova.

**Spec:** `SPEC.md`, seção 10 (critérios CA-4.1 a CA-4.14). ADRs 0004, 0007, 0008, 0010, 0012, 0014 e 0015.

## Para o dono: o que esta fatia entrega

| Tarefa | O que passa a existir | Critérios |
| --- | --- | --- |
| 1. Pendências e o botão "Anotar" | Imagem colada antes de a lista carregar aparece uma vez só; aviso de versões diferentes; o teste instável é corrigido; o botão "Nota" vira "Anotar". | CA-4.12, 4.13, 4.14; mudança no CA-3.1 |
| 2. Marcações no servidor | A biblioteca guarda marcações e recortes. Nada muda na tela ainda. | base de CA-4.2, 4.4, 4.5, 4.6, 4.8, 4.10 |
| 3. Marcações no pacote | O pacote sai com a pasta `marks/` e as linhas no `README.md`. Nada muda na tela ainda. | base de CA-4.9 |
| 4. Desenhar e criar | Arrastar sobre a imagem aberta, escolher "Gosto" ou "Não gosto", ver os retângulos numerados e a lista; o recorte chega ao pacote. | CA-4.1, 4.2, 4.3, 4.8, 4.9, 4.11 |
| 5. Comentário | A caixa de comentário de cada marcação, que salva sozinha e sai no pacote. | CA-4.2, 4.4, 4.9, 4.11; mudanças em CA-3.3, 3.4, 3.9, 3.10 |
| 6. Trocar o tipo, apagar e o sinal na grade | Trocar entre "gosto" e "não gosto", apagar uma marcação, e o sinal com a quantidade na grade. | CA-4.5, 4.6, 4.7, 4.10, 4.11 |

O roteiro do seu teste manual, no Firefox, está no fim deste arquivo.

**O que os testes automáticos não cobrem:** arrastar com o mouse de verdade (o teste simula o mouse dentro do navegador), a aparência dos retângulos e da lista, colar um texto de verdade na caixa de comentário (o teste só confere que nenhum aviso aparece), atualizar o refpack de verdade sem reiniciar (CA-4.13; o teste simula a resposta de um refpack antigo) e a leitura do pacote pelo Claude Code (CA-4.9). Esses pontos ficam para o seu teste manual.

**Um texto que o SPEC não pede:** a lista de marcações mostra sempre a dica "Arraste o mouse sobre a imagem para marcar uma parte.", para a função não ficar escondida. Se você não quiser a dica, ela sai do plano.

## Global Constraints

- Nenhuma dependência nova. O esquema do banco é exatamente o da migração `005` deste plano.
- Só existem os arquivos listados em "Estrutura de arquivos". Precisou de outro: pare e reporte.
- Toda rota nova valida a entrada com zod (ADR-0007, item 3) e fica atrás do `localOnly` que já existe.
- O servidor não abre nem interpreta imagens (ADR-0007, item 5): do recorte ele confere só a assinatura de PNG e o tamanho.
- Nomes de arquivo vêm só de identificadores gerados pela ferramenta (ADR-0004, item 4): o recorte na biblioteca é `marks/<id da marcação>.png`.
- O texto do comentário nunca é alterado: nada de `trim`, de trocar quebras de linha ou de normalizar. O único `trim` permitido é para **decidir** se o comentário está vazio.
- Limites: `MAX_COMMENT_LENGTH = 2_000` (o mesmo valor no `maxLength` da caixa e no zod do servidor); `MAX_CROP_BYTES = 100 * 1024 * 1024`; arrasto mínimo `MIN_DRAG_PIXELS = 10`.
- A tela só mostra o que o servidor confirmou (ADR-0012): uma marcação, um tipo trocado, uma marcação apagada, o sinal da grade e o "Salvo" só mudam depois da resposta do servidor.
- A fila de salvamento é a de `src/web/pack/saver.ts`, sem mudança nenhuma nesse arquivo. Nenhum temporizador no salvamento. Nenhum `waitForTimeout` nos testes.
- Todo texto visível vem dos dicionários `pt-BR` e `en`, com exatamente os textos da tabela "Textos novos". O texto do dono é sempre exibido como texto (ADR-0007, item 6).
- O código do produto não tem ramo por navegador nem por sistema operacional (ADR-0010, R11). Um teste que só passa com tratamento especial: pare e reporte.
- Nenhum arquivo de imagem é commitado. Os testes fabricam as imagens.
- Todo teste que cobre um critério traz o identificador no nome, por exemplo `"CA-4.9 ..."`.
- Testes das fatias 0 a 3 só mudam onde este plano diz. Outro teste antigo quebrou: pare e reporte.
- Commits em inglês, Conventional Commits, um por passo de commit do plano.
- Ao fim de cada tarefa o condutor envia o branch e espera o CI verde antes de começar a próxima.

## Textos novos

| Chave | `pt-BR` | `en` | Tarefa |
| --- | --- | --- | --- |
| `note.open` (muda) | Anotar | Annotate | 1 |
| `error.versionMismatch` | A tela e o refpack estão em versões diferentes. Pare o refpack no terminal e rode pnpm start de novo. | This screen and refpack are on different versions. Stop refpack in the terminal and run pnpm start again. | 1 |
| `mark.listLabel` | Marcações desta imagem | Marks on this image | 4 |
| `mark.hint` | Arraste o mouse sobre a imagem para marcar uma parte. | Drag the mouse over the image to mark a part. | 4 |
| `mark.newLabel` | Nova marcação | New mark | 4 |
| `mark.like` | Gosto | Like | 4 |
| `mark.dislike` | Não gosto | Dislike | 4 |
| `mark.cancel` | Cancelar | Cancel | 4 |
| `mark.itemLabel` | Marcação {number} | Mark {number} | 4 |
| `mark.boxLike` | {number} ✓ | {number} ✓ | 4 |
| `mark.boxDislike` | {number} ✕ | {number} ✕ | 4 |
| `mark.commentLabel` | Comentário da marcação {number} | Comment on mark {number} | 5 |
| `mark.commentPlaceholder` | Comentário (opcional) | Comment (optional) | 5 |
| `mark.confirmLeave` | Um comentário não foi salvo. Sair mesmo assim? | A comment was not saved. Leave anyway? | 5 |
| `mark.delete` | Apagar | Delete | 6 |
| `mark.confirmDelete` | Esta marcação tem um comentário, que será apagado junto. Apagar? | This mark has a comment, which will be deleted with it. Delete? | 6 |
| `mark.count` | Marcações: {count} | Marks: {count} | 6 |

"Salvo" e o aviso de que não foi possível salvar reutilizam as chaves `intent.saved` e `error.notSaved`, que já existem.

## Review Focus

Condições que o dono pode causar em uso normal. Todas têm critério no SPEC; cada uma tem seu teste na tarefa indicada.

1. Abrir a biblioteca que ele já tem, criada nas fatias 0 a 3 → imagens, notas, seleção e intenção continuam iguais, e nenhuma imagem tem marcação; CA-0.6, CA-3.6 e CA-4.8 (Tarefa 2).
2. Marcar uma imagem larga ou alta, que aparece com faixas vazias ao lado ou em cima → o recorte sai do lugar certo da imagem original; CA-4.9 (Tarefa 4).
3. Mudar o tamanho da janela com a imagem aberta → os retângulos continuam sobre a mesma parte da imagem; CA-4.3 (Tarefa 4).
4. Comentário com acentos, emoji, linhas em branco, espaços no começo e no fim e símbolos de Markdown → `marks/NN-M.md` idêntico, byte a byte; CA-4.9 (Tarefas 3 e 5).
5. Apagar uma marcação do meio e gerar o pacote → os números dos arquivos do pacote são os que a tela mostra; CA-4.6 e CA-4.9 (Tarefas 3 e 6).
6. Digitar um comentário, fechar a imagem e clicar em "Gerar pacote" logo em seguida → o comentário inteiro está no pacote; CA-4.4 e CA-4.9 (Tarefa 5).
7. Marcar uma imagem JPEG → o recorte é um PNG; definições da seção 10 (Tarefa 4).

## Estrutura de arquivos

```
src/server/migrations/005-marks.sql        novo: tabela marks
src/server/marks.ts  marks.test.ts         novos: guardar, listar, mudar e apagar marcações
src/server/library.ts                      modificado: marksDir na biblioteca
src/server/app.ts  app.test.ts             modificados: rotas das marcações; a imagem traz marks
src/server/pack.ts  pack.test.ts           modificados: marks/NN-M.png, marks/NN-M.md e o README
src/server/library.test.ts                 modificado: só o esperado dos testes antigos, se preciso
src/shared/api.ts                          modificado: schemas e limites das marcações
src/web/api.ts                             modificado: fetchImages e os pedidos das marcações
src/web/App.tsx                            modificado: lista sem repetição, aviso de versão, marks no estado
src/web/library/ImageGrid.tsx              modificado: sinal com a quantidade de marcações
src/web/note/ImageViewer.tsx               modificado: moldura, lista de marcações, sair guardando comentários
src/web/marks/area.ts  area.test.ts        novos: contas da área (frações, tamanho mínimo, pontos da imagem)
src/web/marks/crop.ts                      novo: o recorte em PNG
src/web/marks/ImageStage.tsx               novo: a imagem aberta com os retângulos e o desenho
src/web/marks/MarkPanel.tsx                novo: a escolha do tipo e a lista de marcações
src/web/marks/MarkItem.tsx                 novo (Tarefa 5): uma marcação na lista
src/web/marks/use-comment.ts               novo (Tarefa 5): o texto do comentário e a fila dele
src/web/i18n/pt-BR.ts  en.ts               modificados: textos novos
src/web/styles.css                         modificado
e2e/support.ts                             modificado: imagens de teste de outros tamanhos; ler um PNG
e2e/marks.spec.ts                          novo
e2e/library.spec.ts  drop.spec.ts  shell.spec.ts  notes.spec.ts  start-over.spec.ts   modificados onde o plano diz
```

Nos testes de ponta a ponta, as imagens entram por `drop(page, [...])` de `e2e/support.ts`; a imagem de teste tem 8×8 pontos, azul `#3366cc`, com o quarto de cima à esquerda amarelo `#ffcc00`. Localizadores e ajudas de `e2e/marks.spec.ts` (a partir da Tarefa 4):

```ts
const item = (page: Page, name: string) =>
  page.getByRole("listitem").filter({ has: page.getByAltText(name) });
const viewer = (page: Page) => page.getByRole("dialog");
const big = (page: Page) => viewer(page).getByRole("img"); // the open image
const box = (page: Page, n: number) => viewer(page).getByTitle(`Mark ${n}`, { exact: true });
const draft = (page: Page) => viewer(page).getByTitle("New mark", { exact: true });
const chooser = (page: Page) => viewer(page).getByRole("group", { name: "New mark" });
const marks = (page: Page) => viewer(page).getByRole("listitem");
const button = (page: Page, name: string) =>
  viewer(page).getByRole("button", { name, exact: true }); // exact: "Dislike" contains "like"

// Opens the image by its grid button.
async function open(page: Page, name: string): Promise<void>;
// Drags the mouse over the open image between two points given as fractions of it:
// mouse.move, mouse.down, mouse.move with { steps: 5 }, mouse.up. Uses big(page).boundingBox().
async function drag(page: Page, from: [number, number], to: [number, number]): Promise<void>;
// drag + click on "Like" or "Dislike" + wait for the new item in the list.
async function mark(page: Page, from: [number, number], to: [number, number], kind: "Like" | "Dislike"): Promise<void>;
// Where a locator's box is, as fractions of the open image: { left, top, right, bottom }.
async function placed(page: Page, target: Locator): Promise<Area>;
// Closes the image, clicks "Select all" and "Generate pack", returns the pack path.
async function generate(page: Page): Promise<string>;
```

"No lugar" nos testes abaixo quer dizer: cada borda de `placed(...)` fica a menos de `0.01` da fração usada no `drag`.

Com a imagem aberta, o que está por baixo do diálogo não responde: os testes fecham a imagem antes de mexer na grade ou no seletor de língua (ADR-0014).

---

### Task 1: Pendências da fatia 3 e o botão "Anotar"

**Modelo:** Sonnet, esforço `medium`.
**Critérios:** CA-4.12, CA-4.13, CA-4.14; mudança no CA-3.1.

**Files:**
- Modify: `src/web/api.ts`, `src/web/App.tsx`, `src/web/i18n/pt-BR.ts`, `src/web/i18n/en.ts`, `e2e/drop.spec.ts`, `e2e/shell.spec.ts`, `e2e/library.spec.ts`, `e2e/notes.spec.ts`, `e2e/start-over.spec.ts`

Antes do Step 1, o condutor confere que está no branch `slice/04-mark-parts` (criado pelo arquiteto ao aprovar o plano).

**Interfaces:**
- Changes, em `src/web/api.ts`:

```ts
// null when the answer arrived but is not the list this screen expects: the running refpack
// is another version (CA-4.13). Still throws when the status is not 2xx.
export async function fetchImages(): Promise<Image[] | null>;
```

  `null` cobre os dois casos: o corpo não é JSON, ou não passa no `ImageListSchema`.

- Changes, em `src/web/App.tsx`:
  - Quando `fetchImages()` devolve `null`: `refuse({ key: "error.versionMismatch" })`, e `images` continua `null` (nem grade, nem convite de biblioteca vazia).
  - Quando a lista chega e o estado já tem imagens (adicionadas antes de ela carregar), as da lista que têm o mesmo `id` de uma do estado não entram de novo; a ordem continua: as do estado primeiro, depois as outras da lista.
- Dicionários: os dois textos da Tarefa 1 na tabela "Textos novos".

- [ ] **Step 1: Testes que falham (CA-4.12 e CA-4.13)**

`e2e/drop.spec.ts`:

```ts
test("CA-4.12 an image dropped before the list loads shows up only once", ...);
// goto; drop b.jpg → images tem count 1
// page.route("**/api/images", ...) segura só os pedidos GET (os outros: route.continue()),
//   com o padrão held/release do teste CA-2.6 de intent.spec.ts
// page.reload(); drop a.png → images tem count 1 (a lista ainda não chegou)
// release() → images tem count 2; gridAlts = ["a.png", "b.jpg"]
```

`e2e/shell.spec.ts`:

```ts
test("CA-4.13 a screen newer than the running refpack says so, in both languages", ...);
// page.route("**/api/images", ...) responde aos GET com status 200 e o JSON de um refpack antigo:
//   { images: [{ id: "3f2b8a52-6c1e-4b0f-9a4d-1d2c3b4a5e6f", originalName: "a.png",
//     url: "/api/images/3f2b8a52-6c1e-4b0f-9a4d-1d2c3b4a5e6f/file", selected: false }] }
// goto → page.getByRole("alert") tem o texto
//   "This screen and refpack are on different versions. Stop refpack in the terminal and run pnpm start again."
// page.getByText("Your library is empty. Add your first image.") tem count 0
// page.getByRole("list").getByRole("img") tem count 0
// língua "Português" → o alerta tem o texto
//   "A tela e o refpack estão em versões diferentes. Pare o refpack no terminal e rode pnpm start de novo."
```

Run: `pnpm test:e2e` → Expected: os dois testes novos FALHAM nos dois navegadores; os outros passam.

- [ ] **Step 2: Implementar** a lista sem repetição. Run: `pnpm check` → o teste do CA-4.12 passa.

`git commit -m "fix: show an image added before the list loads only once"`

- [ ] **Step 3: Implementar** o aviso de versão. Run: `pnpm check` → PASS.

`git commit -m "feat: warn when the screen and refpack are on different versions"`

- [ ] **Step 4: CA-4.14 — o teste do CA-0.3 espera as imagens carregarem**

Em `e2e/library.spec.ts`, no teste `CA-0.3 chosen images appear in the grid...`, o trecho que lê `naturalWidth` de todas as imagens de uma vez (`evaluateAll` seguido do `for`) é trocado por uma espera por imagem:

```ts
for (const image of await images.all()) {
  await expect
    .poll(() => image.evaluate((img) => (img as HTMLImageElement).naturalWidth))
    .toBeGreaterThan(0);
}
```

O nome do teste passa a ser `"CA-0.3 CA-4.14 chosen images appear in the grid, newest first, without reloading"`. Não há código de produto nem fase vermelha neste passo: é correção de teste.

Run: `pnpm check` → PASS.

`git commit -m "test: wait for each image to load before measuring it"`

- [ ] **Step 5: O botão "Nota" passa a "Anotar"**

Primeiro os testes: em `e2e/notes.spec.ts` e `e2e/start-over.spec.ts`, todo `getByRole("button", { name: "Note" })` passa a `{ name: "Annotate" }` e todo `{ name: "Nota" }` a `{ name: "Anotar" }`; o teste `CA-3.1 the Note button opens...` passa a se chamar `CA-3.1 the Annotate button opens...`. Run: `pnpm test:e2e` → os testes de `notes.spec.ts` que usam "Annotate" FALHAM.

Depois os dicionários: `note.open` = `Anotar` / `Annotate`. Run: `pnpm check` → PASS.

`git commit -m "feat: rename the Note button to Annotate"`

---

### Task 2: A biblioteca guarda marcações (servidor)

**Modelo:** Sonnet, esforço `medium`.
**Critérios:** base de CA-4.2, CA-4.4, CA-4.5, CA-4.6, CA-4.8, CA-4.10; ADR-0015, itens 1 a 6.

**Files:**
- Create: `src/server/migrations/005-marks.sql`, `src/server/marks.ts`, `src/server/marks.test.ts`
- Modify: `src/server/library.ts`, `src/server/app.ts`, `src/server/app.test.ts`, `src/shared/api.ts`; `src/server/library.test.ts` só se um esperado antigo precisar de `marksDir`

**Interfaces:**
- Migração `005-marks.sql`, exatamente:

```sql
CREATE TABLE marks (
  seq INTEGER PRIMARY KEY AUTOINCREMENT,
  id TEXT NOT NULL UNIQUE,
  image_id TEXT NOT NULL REFERENCES images (id),
  kind TEXT NOT NULL CHECK (kind IN ('like', 'dislike')),
  area_left REAL NOT NULL,
  area_top REAL NOT NULL,
  area_right REAL NOT NULL,
  area_bottom REAL NOT NULL,
  comment TEXT NOT NULL DEFAULT ''
) STRICT;
```

- Produces, em `src/shared/api.ts`:

```ts
export const MAX_COMMENT_LENGTH = 2_000;
export const MAX_CROP_BYTES = 100 * 1024 * 1024;
export const MarkKindSchema = z.enum(["like", "dislike"]);
// The four edges of a mark, as fractions (0 to 1) of the image's width and height.
export const AreaSchema = z
  .object({
    left: z.number().min(0).max(1),
    top: z.number().min(0).max(1),
    right: z.number().min(0).max(1),
    bottom: z.number().min(0).max(1),
  })
  .refine((area) => area.left < area.right && area.top < area.bottom);
export const MarkSchema = z.object({
  id: z.uuid(),
  kind: MarkKindSchema,
  area: AreaSchema,
  comment: z.string(),
});
// The body of PUT /api/marks/:id/kind.
export const MarkKindBodySchema = z.object({ kind: MarkKindSchema });
// The body of PUT /api/marks/:id/comment.
export const MarkCommentSchema = z.object({ comment: z.string().max(MAX_COMMENT_LENGTH) });
export type MarkKind = z.infer<typeof MarkKindSchema>;
export type Area = z.infer<typeof AreaSchema>;
export type Mark = z.infer<typeof MarkSchema>;
```

  `ImageSchema` ganha `marks: z.array(MarkSchema)`, na ordem de criação. O número da marcação é a posição nessa lista, começando em 1.

- Changes, em `src/server/library.ts`: `Library` ganha `marksDir: string` (`join(root, "marks")`). A pasta não é criada ao abrir a biblioteca.
- Produces, em `src/server/marks.ts`:

```ts
export type StoredMark = { id: string; imageId: string; kind: MarkKind; area: Area; comment: string };
export type AddMarkResult =
  | { ok: true; mark: StoredMark }
  | { ok: false; code: "not-found" | "unsupported-type" };

// Stores the mark and writes the crop to marksDir/<mark id>.png (the folder is created when needed).
// "not-found": no image has this id. "unsupported-type": the crop is not a PNG, by its content.
// Nothing is stored in either case. The new mark has an empty comment.
export function addMark(
  library: Library,
  imageId: string,
  input: { kind: MarkKind; area: Area; crop: Uint8Array },
): AddMarkResult;
// Every mark, grouped by image id; each list in creation order. Images without marks have no entry.
export function listMarks(library: Library): Map<string, StoredMark[]>;
// The three below answer false when no mark has this id; nothing changes then.
export function setMarkKind(library: Library, markId: string, kind: MarkKind): boolean;
// The text is stored exactly as given: no trimming, no normalization.
export function setMarkComment(library: Library, markId: string, comment: string): boolean;
// Removes the mark and its crop file.
export function deleteMark(library: Library, markId: string): boolean;
// The name of a mark's crop inside library.marksDir.
export function cropFileName(markId: string): string; // `${markId}.png`
```

  As linhas lidas do banco são conferidas com zod, como em `library.ts`. O PNG é conferido com `sniffImageType` de `image-type.ts`.

- Changes, em `src/server/app.ts`:
  - `toImage(image, marks)` passa a incluir `marks` (cada uma como `{ id, kind, area, comment }`); `GET /api/images` usa `listMarks` uma vez; a resposta de `POST /api/images` traz `marks: []`.
  - `POST /api/images/:id/marks?kind=&left=&top=&right=&bottom=` — o corpo são os bytes do recorte. Nesta ordem: `bodyLimit` de `MAX_CROP_BYTES` → `413 too-large`; `kind` fora do `MarkKindSchema`, ou alguma borda que não é número, ou a área fora do `AreaSchema` → `400 invalid-request`; imagem desconhecida ou id malformado → `404 not-found`; corpo que não é PNG → `415 unsupported-type`; gravou → `201` com a marcação (`MarkSchema`).
  - `PUT /api/marks/:id/kind` com `MarkKindBodySchema` e `PUT /api/marks/:id/comment` com `MarkCommentSchema`: `bodyLimit` de `MAX_TEXT_REQUEST_BYTES` → `413 too-large`; corpo que não é JSON ou não passa no schema → `400 invalid-request`; id desconhecido ou malformado → `404 not-found`; gravou → `204`.
  - `DELETE /api/marks/:id` → `204`; id desconhecido ou malformado → `404 not-found`.

- [ ] **Step 1: Testes que falham**

Nos dois arquivos: `const COMMENT = "  # Gosto do espaçamento 🍇\n\n\t* evitar o \`azul\` & a sombra  \n";`, `const AREA = { left: 0.1, top: 0.2, right: 0.4, bottom: 0.9 };`, `const CROP = PNG_BYTES;` e `const UNKNOWN = "3f2b8a52-6c1e-4b0f-9a4d-1d2c3b4a5e6f";`.

`src/server/marks.test.ts`:

```ts
test("CA-0.6 CA-4.8 a library created before slice 4 opens with no marks and keeps notes, selection and intent", ...);
// banco antigo montado à mão, como o teste "created before slice 3" de library.test.ts:
//   aplicar 001 a 004, user_version = 4; uma imagem com selected = 1 e note = 'antiga'; intent = 'velha'
// abrir → listMarks(library).size === 0; listImages = [{ ...a mesma imagem, selected: true, note: "antiga" }];
//   getIntent = "velha"

test("CA-4.2 addMark stores kind, area and crop, and lists the marks of each image in creation order", ...);
// a.png e b.jpg; m1 = addMark(a.id, { kind: "like", area: AREA, crop: CROP });
//   m2 = addMark(a.id, { kind: "dislike", area: { left: 0, top: 0, right: 1, bottom: 1 }, crop: CROP })
// m1.mark = { id: (uuid), imageId: a.id, kind: "like", area: AREA, comment: "" }
// listMarks(library).get(a.id) = [m1.mark, m2.mark]; listMarks(library).has(b.id) === false
// readFileSync(join(library.marksDir, cropFileName(m1.mark.id))) é igual a Buffer.from(CROP)

test("addMark refuses an unknown image and a crop that is not a PNG, storing nothing", ...);
// addMark(UNKNOWN, ...) → { ok: false, code: "not-found" }
// addMark(a.id, { ..., crop: JPEG_BYTES }) → { ok: false, code: "unsupported-type" }
// listMarks(library).size === 0; existsSync(library.marksDir) === false

test("CA-4.5 setMarkKind changes only the kind", ...);
// duas marcações em a; setMarkComment(m1, COMMENT); setMarkKind(m1, "dislike") → true
// a lista de a = [{ ...m1, kind: "dislike", comment: COMMENT }, m2]

test("CA-4.4 setMarkComment stores the text exactly as given", ...);
// setMarkComment(m1, COMMENT) → true; listMarks(...).get(a.id)[0].comment === COMMENT

test("CA-4.6 deleteMark removes the mark and its crop file and keeps the others in order", ...);
// três marcações em a; setNote(a.id, "nota"); deleteMark(m2) → true
// a lista de a = [m1, m3]; o arquivo de m2 não existe; os de m1 e m3 existem
// findImage(a.id)?.note === "nota"

test("setMarkKind, setMarkComment and deleteMark answer false for an unknown id and change nothing", ...);

test("CA-4.8 the marks are still there after closing and reopening the library", ...);
// duas marcações, um comentário; closeLibrary; openLibrary(mesma raiz) → listMarks igual a antes

test("CA-4.10 clearing the selection keeps every mark", ...);
// uma marcação com comentário; setSelected(a.id, true); setAllSelected(library, false) → listMarks igual a antes
```

`src/server/app.test.ts` (`query = "kind=like&left=0.1&top=0.2&right=0.4&bottom=0.9"`):

```ts
test("CA-4.2 POST /api/images/:id/marks creates a mark and GET /api/images returns it", ...);
// upload → a imagem devolvida tem marks = []
// POST ...marks?query com CROP → 201; corpo passa no MarkSchema e é { id, kind: "like", area: AREA, comment: "" }
// GET /api/images → images[0].marks = [essa marcação]

test("POST /api/images/:id/marks answers 400 invalid-request for a wrong kind or area", ...);
// queries: sem kind; kind=love; left=abc; sem bottom; left=0.5&right=0.5; left=0.6&right=0.4; right=1.2; top=-0.1
// cada uma → 400; GET mostra marks = []

test("POST /api/images/:id/marks answers 404 for an unknown or malformed image id and 415 for a crop that is not a PNG", ...);
// ids UNKNOWN e "not-a-uuid" com query e CROP válidos → 404 not-found
// imagem real, query válida, corpo JPEG_BYTES → 415 unsupported-type; GET mostra marks = []

test("CA-4.4 CA-4.5 PUT /api/marks/:id/comment and /kind store the change and GET /api/images returns it", ...);
// PUT comment { comment: COMMENT } → 204; PUT kind { kind: "dislike" } → 204
// GET → marks[0] = { id, kind: "dislike", area: AREA, comment: COMMENT }

test("PUT /api/marks/:id/comment takes 2 000 characters and refuses 2 001", ...);
// "x".repeat(MAX_COMMENT_LENGTH) → 204; com +1 → 400 invalid-request; o comentário guardado continua o de 2 000

test("the mark routes answer 400 for a wrong body, 404 for an unknown or malformed id, and 413 above 128 KiB", ...);
// PUT kind: "{}", '{"kind":"love"}', "not json" → 400; PUT comment: "{}", '{"comment":5}', "not json" → 400
// PUT kind, PUT comment e DELETE com UNKNOWN e "not-a-uuid" → 404 not-found
// PUT comment com corpo "x".repeat(128 * 1024 + 1) → 413 too-large

test("CA-4.6 DELETE /api/marks/:id removes the mark", ...);
// duas marcações; DELETE a primeira → 204; GET → marks = [a segunda]; DELETE de novo → 404

test("CA-0.11 the mark routes are behind the local-only guard", ...);
// POST, PUT kind, PUT comment e DELETE com host "evil.example" → 403
```

Nos testes antigos que comparam uma imagem inteira da API com `toEqual`, acrescente `marks: []` ao esperado; nada mais muda neles.

Run: `pnpm test` → Expected: os testes novos FALHAM; os antigos passam.

- [ ] **Step 2: Implementar** conforme Interfaces.

Run: `pnpm check` → Expected: PASS. A tela não mudou.

- [ ] **Step 3: Commit**

`git commit -m "feat: store marks and their crops for each image"`

---

### Task 3: As marcações saem no pacote (servidor)

**Modelo:** Sonnet, esforço `medium`.
**Critérios:** base de CA-4.9; ADR-0015, item 7.

**Files:**
- Modify: `src/server/pack.ts`, `src/server/pack.test.ts`

**Interfaces:**
- Consumes: `listMarks`, `addMark`, `setMarkComment`, `deleteMark`, `cropFileName` e `Library.marksDir` (Tarefa 2).
- Changes, em `src/server/pack.ts` — a assinatura de `createPack` não muda:
  - Para a marcação de número `M` (posição na lista da imagem, começando em 1, sem zeros à esquerda) da imagem de número `NN` no pacote (o mesmo `refNumber` de `refs/`): copia o recorte para `marks/NN-M.png`; se `comment.trim() !== ""`, grava `marks/NN-M.md` com o comentário sem nenhuma mudança. A pasta `marks/` só é criada se alguma imagem selecionada tem marcação.
  - No `README.md`, logo abaixo da linha de cada referência, uma linha por marcação dela, com três espaços no começo:

    ``   - Mark 1 (like): `marks/02-1.png` — comment: `marks/02-1.md` — area: x 10%–40%, y 20%–90%``

    Sem comentário, o trecho `` — comment: `…` `` não aparece. As porcentagens são `Math.round(fração * 100)`, na ordem esquerda–direita e cima–baixo, separadas por meia-risca (`–`).
  - Se alguma imagem do pacote tem marcação, o `README.md` ganha um parágrafo, depois do parágrafo das notas (quando existe) e antes de `- Created:`, separado por uma linha em branco, com exatamente este texto:

    ``Some references have marks: parts of the image the owner pointed at, listed under the image below. Each mark has a crop of that part in `marks/`. `like` means the owner wants this taken as a quality to reproduce; `dislike` means avoid it. A mark may also have a comment file, in the owner's own words and possibly in a language other than English. `area` says where the part is in the full image, as percentages of its width (x, from the left) and of its height (y, from the top).``

  - Sem nenhuma marcação entre as imagens selecionadas, o pacote sai byte a byte como hoje.

- [ ] **Step 1: Testes que falham**

`src/server/pack.test.ts` (`COMMENT` como na Tarefa 2; `MARKS_LINE` = o parágrafo acima; `crop(n)` = `PNG_BYTES` seguido do byte `n`, para cada recorte ser diferente; grade de `fillLibrary`: `c.webp`, `b.jpg`, `a.png`; `b = listImages(library)[1]`):

```ts
test("CA-4.9 each mark of a selected image gets its crop and its comment in marks/, and the README lists them", ...);
// fillLibrary; setAllSelected(true); setIntent(INTENT); setNote(b.id, NOTE)
// m1 = addMark(b.id, { kind: "like", area: { left: 0.1, top: 0.2, right: 0.4, bottom: 0.9 }, crop: crop(1) })
// m2 = addMark(b.id, { kind: "dislike", area: { left: 0.604, top: 0, right: 1, bottom: 0.338 }, crop: crop(2) })
// setMarkComment(m1.id, COMMENT)
// readdirSync(join(path, "marks")).sort() = ["02-1.md", "02-1.png", "02-2.png"]
// marks/02-1.png é igual a Buffer.from(crop(1)); marks/02-2.png a crop(2)
// marks/02-1.md é igual a Buffer.from(COMMENT, "utf8")
// README.md é exatamente: [..., "", INTENT_LINE, "", NOTES_LINE, "", MARKS_LINE, "",
//   "- Created: 2026-11-09 14:05:09", "- References: 3", "", "## References", "",
//   "1. `refs/01.webp`",
//   "2. `refs/02.jpg` — note: `notes/02.md`",
//   "   - Mark 1 (like): `marks/02-1.png` — comment: `marks/02-1.md` — area: x 10%–40%, y 20%–90%",
//   "   - Mark 2 (dislike): `marks/02-2.png` — area: x 60%–100%, y 0%–34%",
//   "3. `refs/03.png`", ""].join("\n")

test("CA-4.6 CA-4.9 the files take the image's number in this pack and the mark's number after a delete, and unselected marks stay out", ...);
// fillLibrary; selecionar só a.png e c.webp
// em a.png: três marcações com crop(1), crop(2), crop(3); deleteMark da primeira
// em b.jpg (não selecionada): uma marcação
// readdirSync(marks).sort() = ["02-1.png", "02-2.png"]; 02-1.png === crop(2); 02-2.png === crop(3)
// README contém "2. `refs/02.png`\n   - Mark 1 (like): `marks/02-1.png` — area:" e não contém "marks/01-"

test("CA-4.9 a mark with an empty or blank comment has only its crop", ...);
// para cada comentário em ["", " \n\t "]: uma marcação em b com esse comentário; setAllSelected(true)
// readdirSync(marks) = ["02-1.png"]; a linha do README não contém "comment:"

test("CA-4.9 without marks on the selected images the pack has no marks folder and no mention", ...);
// fillLibrary; selecionar só a.png; uma marcação em b.jpg
// existsSync(join(path, "marks")) === false; README não contém "mark"
```

O teste `CA-0.9 CA-2.9 generating a pack leaves the library unchanged` ganha uma marcação com comentário em `b` antes de gerar, e compara `listMarks(library)` de antes e de depois.

Run: `pnpm test` → Expected: os testes novos FALHAM; os antigos passam.

- [ ] **Step 2: Implementar** conforme Interfaces.

Run: `pnpm check` → Expected: PASS. A tela não mudou.

- [ ] **Step 3: Commit**

`git commit -m "feat: export each mark's crop and comment in the pack"`

---

### Task 4: Desenhar uma área e criar a marcação (tela)

**Modelo:** Opus, esforço `high` (tarefa difícil: geometria da imagem, eventos do mouse e recorte nos dois navegadores).
**Critérios:** CA-4.1, CA-4.2, CA-4.3, CA-4.8, CA-4.9 (ponta a ponta), CA-4.11 (criar); ADR-0015, itens 3, 4 e 8.

**Files:**
- Create: `src/web/marks/area.ts`, `src/web/marks/area.test.ts`, `src/web/marks/crop.ts`, `src/web/marks/ImageStage.tsx`, `src/web/marks/MarkPanel.tsx`, `e2e/marks.spec.ts`
- Modify: `src/web/api.ts`, `src/web/App.tsx`, `src/web/note/ImageViewer.tsx`, `src/web/i18n/pt-BR.ts`, `src/web/i18n/en.ts`, `src/web/styles.css`, `e2e/support.ts`

**Interfaces:**
- Consumes: a rota `POST /api/images/:id/marks`, `Mark`, `MarkKind`, `Area`, `MarkSchema` (Tarefa 2); o pacote da Tarefa 3.
- Produces, em `src/web/marks/area.ts` (funções puras, sem DOM):

```ts
export const MIN_DRAG_PIXELS = 10;
export type Point = { x: number; y: number };
export type Box = { left: number; top: number; width: number; height: number };
// Where a pointer is over the frame, as fractions of it, kept inside 0..1.
export function toFraction(pointer: Point, frame: Box): Point;
// The area between two corners, whatever the direction of the drag.
export function areaBetween(a: Point, b: Point): Area;
// False when the area is under MIN_DRAG_PIXELS wide or tall on a frame of this size.
export function isBigEnough(area: Area, frame: { width: number; height: number }): boolean;
// The pixels of the original image the area covers: left and top rounded down, right and
// bottom rounded up, so it is never empty.
export function pixelRect(
  area: Area,
  natural: { width: number; height: number },
): { x: number; y: number; width: number; height: number };
```

- Produces, em `src/web/marks/crop.ts`:

```ts
// A PNG with the part of the image the area covers, at the image's own resolution
// (pixelRect of naturalWidth × naturalHeight, drawn on a canvas of that size).
// null when the browser cannot make it.
export function cropToPng(image: HTMLImageElement, area: Area): Promise<Blob | null>;
```

- Produces, em `src/web/api.ts` — `null` com qualquer status que não seja 2xx, resposta fora do `MarkSchema` ou erro de rede; nunca lança:

```ts
export async function createMark(
  imageId: string,
  kind: MarkKind,
  area: Area,
  crop: Blob,
): Promise<Mark | null>;
```

- Produces, em `src/web/marks/ImageStage.tsx`:

```ts
export function ImageStage(props: {
  image: Image;
  imageRef: RefObject<HTMLImageElement | null>; // the viewer crops from this element
  pending: Area | null; // the rectangle waiting for its kind
  onPending: (area: Area | null) => void;
});
```

  - Desenha `<div className="viewer-stage">` com, dentro, `<div className="viewer-frame">` contendo: `<img className="viewer-image" src={image.url} alt={image.originalName} draggable={false} />`; um retângulo por marcação; e o retângulo em desenho ou à espera do tipo.
  - **A moldura tem exatamente o tamanho em que a imagem aparece:** a maior caixa com a proporção da imagem que cabe em `viewer-stage`, centralizada. Imagem pequena é ampliada até caber, como hoje. A proporção vem de `naturalWidth / naturalHeight`, lida no `onLoad` da imagem e passada à moldura numa variável CSS (`--ratio`); o tamanho é resolvido só em CSS, com unidades de contêiner (`cqw`/`cqh`): nenhum `ResizeObserver` e nenhuma conta de tamanho em JavaScript. A imagem preenche a moldura e mantém `object-fit: contain`.
  - Os retângulos só aparecem, e o desenho só funciona, depois de a imagem carregar.
  - Retângulo de marcação: `<div className="mark-box ..." title={t("mark.itemLabel", { number })}>` com o texto `mark.boxLike` ou `mark.boxDislike`; posição e tamanho em porcentagem da moldura (`left`, `top`, `width`, `height`); `pointer-events: none`. "Gosto" tem borda contínua verde `#1a7f37`; "não gosto", borda tracejada vermelha `#b00020`.
  - Retângulo em desenho ou à espera do tipo: `<div className="mark-box mark-new" title={t("mark.newLabel")}>`, sem texto.
  - Desenho, com eventos de ponteiro na moldura e `setPointerCapture`: só o botão principal; apertar descarta o retângulo à espera (`onPending(null)`) e começa outro; mover atualiza o retângulo (`toFraction` + `areaBetween`); soltar chama `onPending(area)` se `isBigEnough`, senão não deixa nada.
  - A moldura tem `user-select: none`; a imagem, `draggable={false}`.

- Produces, em `src/web/marks/MarkPanel.tsx`:

```ts
export function MarkPanel(props: {
  marks: Mark[];
  pending: Area | null;
  failed: boolean; // the last change to the marks could not be saved
  onChoose: (kind: MarkKind) => void;
  onCancel: () => void;
});
```

  Desenha `<section className="marks" aria-label={t("mark.listLabel")}>` com, nesta ordem: `<p>` com `mark.hint`; se `pending !== null`, `<div role="group" aria-label={t("mark.newLabel")}>` com os botões `mark.like`, `mark.dislike` e `mark.cancel`; se `failed`, `<p role="alert">` com `error.notSaved`; se há marcações, `<ol>` com um `<li>` por marcação trazendo `mark.itemLabel` e a palavra do tipo (`mark.like` ou `mark.dislike`).

- Changes, em `ImageViewer.tsx`:
  - Nova prop `onMarks: (id: string, change: (marks: Mark[]) => Mark[]) => void`.
  - O `<img>` sai daqui e passa a ser desenhado por `<ImageStage>`; `<MarkPanel>` fica em `viewer-side`, entre o `status` da nota e os botões.
  - Estado `pending` e `failed`. `onChoose(kind)`: `cropToPng` → `createMark`; deu certo → `onMarks(image.id, (marks) => [...marks, mark])` e `failed = false`; recorte `null` ou `createMark` `null` → `failed = true`. Nos dois casos `pending` volta a `null`. Um segundo clique enquanto o primeiro pedido está a caminho é ignorado.
  - O cursor continua começando na caixa da nota (CA-3.1). Sair da imagem não muda: o `key` do `App` já descarta o retângulo à espera.
- Changes, em `App.tsx`: `marksChanged(id, change)` aplica `change` às `marks` dessa imagem no estado; `<ImageViewer ... onMarks={marksChanged} />`.
- Changes, em `e2e/support.ts`:

```ts
export type FakeFile = {
  name: string;
  content: "image/png" | "image/jpeg" | "image/webp" | "text";
  width?: number; // default 8
  height?: number; // default 8
};
// The fake image keeps its pattern at any size: blue, with the top-left quarter yellow.

// Decodes a PNG file inside the page: its size and the colour of each asked pixel, as "#rrggbb".
export async function readPng(
  page: Page,
  path: string,
  points: [number, number][],
): Promise<{ width: number; height: number; colors: string[] }>;
```

- `styles.css`: `.viewer-side > textarea` (e não todo `textarea`) ocupa o espaço que sobra; `.marks` rola por dentro quando a lista é longa e nunca empurra os botões para fora do diálogo.

- [ ] **Step 1: Testes que falham**

`src/web/marks/area.test.ts`:

```ts
test("CA-4.1 toFraction gives the pointer as fractions of the frame and stops at its edges", ...);
// frame { left: 100, top: 50, width: 400, height: 200 }
// (300, 150) → { x: 0.5, y: 0.5 }; (100, 50) → { x: 0, y: 0 }; (40, 20) → { x: 0, y: 0 }; (900, 900) → { x: 1, y: 1 }

test("areaBetween orders the edges whatever the drag direction", ...);
// ({ x: 0.7, y: 0.6 }, { x: 0.2, y: 0.1 }) → { left: 0.2, top: 0.1, right: 0.7, bottom: 0.6 }

test("CA-4.1 isBigEnough refuses an area under 10 pixels wide or tall on the screen", ...);
// frame 400×200: largura 0.025 (10 px) e altura 0.05 (10 px) → true
// largura 0.0225 (9 px) → false; altura 0.045 (9 px) → false; área de tamanho zero → false

test("CA-4.9 pixelRect covers every pixel the area touches and is never empty", ...);
// natural 8×8: { left: 0.1, top: 0.1, right: 0.4, bottom: 0.4 } → { x: 0, y: 0, width: 4, height: 4 }
// { left: 0.6, top: 0.6, right: 0.9, bottom: 0.9 } → { x: 4, y: 4, width: 4, height: 4 }
// { left: 0.5, top: 0.5, right: 0.51, bottom: 0.51 } → { x: 4, y: 4, width: 1, height: 1 }
// natural 1000×500: { left: 0, top: 0, right: 1, bottom: 1 } → { x: 0, y: 0, width: 1000, height: 500 }
```

`e2e/marks.spec.ts`, com os localizadores e as ajudas da seção "Estrutura de arquivos" (`a` = `a.png`, `b` = `b.jpg`):

```ts
test("CA-4.1 dragging over the open image draws a rectangle that waits for its kind", ...);
// drop a; open; mouse.move até (0.1, 0.1) da imagem, mouse.down, mouse.move até (0.4, 0.5) em 5 passos
//   → draft visível e no lugar { left: 0.1, top: 0.1, right: 0.4, bottom: 0.5 }
// mouse.up → draft continua no lugar; chooser visível com os botões "Like", "Dislike" e "Cancel"
// marks tem count 0

test("CA-4.1 a click or a drag under 10 pixels creates nothing", ...);
// clique no meio da imagem → draft count 0; chooser count 0
// arrasto de 9 px de largura por 60 de altura, e outro de 60 por 9 → draft count 0

test("CA-4.1 a drag that leaves the image stops at its edge, in any direction", ...);
// arrastar de (0.5, 0.5) até 10 px além do canto de baixo à direita da imagem (dentro da janela)
//   → draft no lugar { left: 0.5, top: 0.5, right: 1, bottom: 1 }
// arrastar de (0.5, 0.5) até 10 px além do canto de cima à esquerda
//   → draft no lugar { left: 0, top: 0, right: 0.5, bottom: 0.5 }

test("CA-4.1 dragging does not move the image or select it like text", ...);
// big tem o atributo draggable "false" e CSS user-select "none"

test("CA-4.2 CA-4.3 choosing Like or Dislike creates the mark, numbered, on the image and in the list", ...);
// drop a; open; drag (0.1, 0.1)–(0.4, 0.4); button("Like").click()
//   → box(1) no lugar, com o texto "1 ✓"; marks count 1, o item contém "Mark 1" e "Like"
//   draft count 0; chooser count 0
// drag (0.6, 0.6)–(0.9, 0.9); button("Dislike").click()
//   → box(2) no lugar, texto "2 ✕"; marks count 2; o segundo item contém "Mark 2" e "Dislike"
// viewer.getByText("Drag the mouse over the image to mark a part.") visível

test("CA-4.2 Cancel, another rectangle, closing and moving on drop the rectangle without a kind", ...);
// contar, com page.on("request"), os pedidos POST cujo endereço passa em /\/api\/images\/[^/]+\/marks/
// drop a, b; open b; drag; button("Cancel").click() → draft count 0; chooser count 0
// drag (0.1, 0.1)–(0.3, 0.3); drag (0.5, 0.5)–(0.8, 0.8) → draft count 1, no lugar do segundo
// button("Close").click(); open b → draft count 0; marks count 0
// drag; button("Next").click(); button("Previous").click() → draft count 0; marks count 0
// nenhum pedido POST foi feito

test("CA-4.1 a rectangle can start on top of an existing mark", ...);
// mark (0.1, 0.1)–(0.7, 0.7) "Like"; drag (0.2, 0.2)–(0.5, 0.5) → draft no lugar

test("CA-4.3 CA-4.8 the marks come back in place after restart and stay on the same part when the window changes", ...);
// drop a; open; mark (0.1, 0.1)–(0.4, 0.4) "Like"; mark (0.6, 0.2)–(0.9, 0.9) "Dislike"; fechar
// app.restart(); goto; open → a caixa da nota está focada; box(1) "1 ✓" e box(2) "2 ✕" no lugar;
//   marks count 2, na ordem "Mark 1" / "Mark 2"
// page.setViewportSize({ width: 700, height: 900 }) → box(1) e box(2) continuam no lugar

test("CA-4.3 the marks follow the screen language", ...);
// língua "Português"; drop a; abrir pelo botão "Anotar"; drag → grupo "Nova marcação" com os botões
//   "Gosto", "Não gosto" e "Cancelar"; clicar "Não gosto"
//   → viewer.getByTitle("Marcação 1") com o texto "1 ✕"; o item da lista contém "Marcação 1" e "Não gosto"
// viewer.getByText("Arraste o mouse sobre a imagem para marcar uma parte.") visível

test("CA-4.9 the pack carries the crop of each mark, cut from the original image", ...);
// drop a (png 8×8); open; mark (0.1, 0.1)–(0.4, 0.4) "Like"; mark (0.6, 0.6)–(0.9, 0.9) "Dislike"
// path = generate(page); readdir(join(path, "marks")).sort() = ["01-1.png", "01-2.png"]
// readPng(01-1.png, [[0, 0], [3, 3]]) = { width: 4, height: 4, colors: ["#ffcc00", "#ffcc00"] }
// readPng(01-2.png, [[0, 0], [3, 3]]) = { width: 4, height: 4, colors: ["#3366cc", "#3366cc"] }
// README.md contém "   - Mark 1 (like): `marks/01-1.png` — area: x 10%–40%, y 10%–40%"
//   e "   - Mark 2 (dislike): `marks/01-2.png` — area: x 60%–90%, y 60%–90%"

test("CA-4.9 the crop comes from the right place on a wide and on a tall image", ...);
// drop { name: "wide.png", content: "image/png", width: 16, height: 8 }; open
//   a caixa de big tem largura / altura entre 1.98 e 2.02
//   mark (0.05, 0.1)–(0.45, 0.4) "Like"; fechar
// drop { name: "tall.png", content: "image/png", width: 8, height: 16 }; open
//   a caixa de big tem altura / largura entre 1.98 e 2.02
//   mark (0.1, 0.05)–(0.4, 0.45) "Like"
// generate → a grade é tall.png, wide.png:
//   readPng(01-1.png, [[0, 0], [3, 7]]) = { width: 4, height: 8, colors: ["#ffcc00", "#ffcc00"] }
//   readPng(02-1.png, [[0, 0], [7, 3]]) = { width: 8, height: 4, colors: ["#ffcc00", "#ffcc00"] }

test("CA-4.9 the crop of a JPEG image is a PNG", ...);
// drop b (jpeg); open; mark (0.1, 0.1)–(0.9, 0.9) "Like"; generate
// readdir(marks) = ["01-1.png"]; readPng(01-1.png, []) tem width 8 e height 8

test("CA-4.11 with refpack stopped, a new mark is not created and the screen says so", ...);
// drop a; open; page.route(/\/api\/images\/[^/]+\/marks/, (route) => route.abort("connectionrefused"))
//   (o pedido de criar leva a área no endereço, depois de "?": por isso a expressão regular, e não um padrão com *)
// drag; button("Like").click()
//   → viewer.getByRole("alert") tem o texto "Could not save. Check that refpack is still running in the terminal."
//   marks count 0; box(1) count 0; draft count 0
// page.unroute(...); mark (0.1, 0.1)–(0.4, 0.4) "Like" → viewer.getByRole("alert") count 0; marks count 1
```

Run: `pnpm test` e `pnpm test:e2e` → Expected: os testes novos FALHAM (os de ponta a ponta, nos dois navegadores); os antigos passam.

- [ ] **Step 2: Implementar** `area.ts` e `crop.ts`. Run: `pnpm test` → PASS.

`git commit -m "feat: work out a mark's area and crop it from the image"`

- [ ] **Step 3: Implementar** o resto, conforme Interfaces, com os textos da Tarefa 4.

Run: `pnpm check` → Expected: PASS. Se a moldura não ficar do tamanho da imagem só com CSS num dos dois navegadores: pare e reporte.

- [ ] **Step 4: Commit**

`git commit -m "feat: draw an area on the open image and mark it as like or dislike"`

---

### Task 5: O comentário da marcação (tela)

**Modelo:** Sonnet, esforço `medium`.
**Critérios:** CA-4.2 (cursor), CA-4.4, CA-4.9 (comentário, ponta a ponta), CA-4.11 (comentário); mudanças em CA-3.3, CA-3.4, CA-3.9 e CA-3.10; ADR-0012.

**Files:**
- Create: `src/web/marks/MarkItem.tsx`, `src/web/marks/use-comment.ts`
- Modify: `src/web/api.ts`, `src/web/marks/MarkPanel.tsx`, `src/web/note/ImageViewer.tsx`, `src/web/i18n/pt-BR.ts`, `src/web/i18n/en.ts`, `src/web/styles.css`, `e2e/marks.spec.ts`

**Interfaces:**
- Consumes: `MarkPanel`, `ImageViewer.leave` e `onMarks` (Tarefa 4); `createSaver` e `SaveState` de `src/web/pack/saver.ts`; a rota `PUT /api/marks/:id/comment` (Tarefa 2).
- Produces, em `src/web/api.ts` — `true` com resposta 2xx, `false` com qualquer outro status ou erro de rede; nunca lança:

```ts
export async function saveMarkComment(markId: string, comment: string): Promise<boolean>;
```

- Produces, em `src/web/marks/use-comment.ts` — o mesmo desenho de `src/web/note/use-note.ts`, com um `Saver` por montagem:

```ts
export type CommentDraft = {
  text: string;
  saveState: SaveState;
  change(text: string): void;
  flush(): Promise<boolean>;
};
// `saved` is the comment the server last confirmed; it is read once, when the item mounts.
export function useComment(
  markId: string,
  saved: string,
  onSaved: (markId: string, comment: string) => void,
): CommentDraft;
```

- Produces, em `src/web/marks/MarkItem.tsx`:

```ts
export function MarkItem(props: {
  mark: Mark;
  number: number;
  focus: boolean; // put the cursor in the comment box when the item mounts
  onCommentSaved: (markId: string, comment: string) => void;
  // Gives the viewer this item's flush while it is mounted, and null when it unmounts.
  registerFlush: (markId: string, flush: (() => Promise<boolean>) | null) => void;
});
```

  Desenha o `<li>` da marcação: `mark.itemLabel`, a palavra do tipo, `<textarea aria-label={t("mark.commentLabel", { number })} placeholder={t("mark.commentPlaceholder")} maxLength={MAX_COMMENT_LENGTH}>` e `<span role="status">` com `intent.saved` quando `saveState === "saved"`, `error.notSaved` quando `"failed"`, vazio nos outros estados.

- Changes, em `MarkPanel.tsx`: o `<li>` passa a ser `<MarkItem key={mark.id} ...>`; novas props `focusId: string | null`, `onCommentSaved` e `registerFlush`, repassadas.
- Changes, em `ImageViewer.tsx`:
  - Depois de criar uma marcação com sucesso, `focusId` passa a ser o id dela (o cursor vai para a caixa de comentário dela, CA-4.2).
  - `onCommentSaved(markId, comment)` → `onMarks(image.id, ...)` trocando o comentário dessa marcação.
  - `leave` passa a esperar também os comentários:

```ts
// Runs `then` once the note and every comment are saved; when something cannot be saved, asks
// first, once: about the note if it is the note, otherwise about the comment (CA-3.9, CA-4.11).
async function leave(then: () => void): Promise<void>;
// noteOk = await note.flush(); commentsOk = every registered flush answered true
// if (noteOk && commentsOk) then();
// else if (window.confirm(t(noteOk ? "mark.confirmLeave" : "note.confirmLeave"))) then();
```

- Colar texto numa caixa de comentário não pede código: `IncomingFiles` já deixa passar o texto colado em qualquer `<textarea>` com uma imagem aberta. A tarefa só acrescenta o teste.

- [ ] **Step 1: Testes que falham**

`e2e/marks.spec.ts`, com `const comment = (page: Page, n: number) => viewer(page).getByLabel(`Comment on mark ${n}`);`, `const saved = (page: Page, n: number) => marks(page).nth(n - 1).getByRole("status");` e `const TEXT = "  # Gosto do espaçamento 🍇\n\n* evitar o `azul` & a sombra  \n";`:

```ts
test("CA-4.2 after choosing the kind the cursor is in the new mark's comment box", ...);
// drop a; open; mark ... "Like" → comment(1) focada, valor "", placeholder "Comment (optional)", maxlength "2000"
// mark ... "Dislike" → comment(2) focada

test("CA-4.4 CA-4.8 a comment saves by itself and comes back exactly as typed", ...);
// mark; saved(1) tem texto ""; comment(1).fill(TEXT) → saved(1) "Saved"; fechar
// app.restart(); goto; open → comment(1) tem valor TEXT; a caixa da nota está focada

test("CA-4.4 each mark keeps its own comment, and moving on saves what was typed", ...);
// drop a, b; open b; duas marcações; comment(1).fill("one"); comment(2).pressSequentially("two")
// button("Next").click() sem esperar o "Saved"; button("Previous").click()
//   → comment(1) "one"; comment(2) "two"
// page.reload(); open b → os mesmos valores

test("CA-4.4 CA-4.9 a comment typed right before closing and generating is in the pack", ...);
// page.route("**/api/marks/*/comment", ...) segura o envio (padrão held/release)
// drop a; open; mark (0.1, 0.1)–(0.4, 0.4) "Like"; comment(1).fill(TEXT); button("Close").click()
// viewer continua visível; release() → viewer count 0
// generate → readFile(join(path, "marks", "01-1.md"), "utf8") === TEXT
// README.md contém "   - Mark 1 (like): `marks/01-1.png` — comment: `marks/01-1.md` — area: x 10%–40%, y 10%–40%"

test("CA-4.11 a comment that cannot be saved stays in the box with a warning, and leaving asks first", ...);
// drop a, b; open b; mark; page.route("**/api/marks/*/comment", (route) => route.abort("connectionrefused"))
// comment(1).pressSequentially("abc")
//   → saved(1) "Could not save. Check that refpack is still running in the terminal."; comment(1) valor "abc"
// dialog do navegador: guardar a mensagem e dismiss(); button("Close").click()
//   → mensagem "A comment was not saved. Leave anyway?"; viewer visível; comment(1) valor "abc"
// dialog: accept(); button("Next").click() → page.getByRole("dialog", { name: "a.png" }) visível

test("CA-3.9 CA-4.11 with the note and a comment unsaved, the screen asks once, about the note", ...);
// abortar **/api/images/*/note e **/api/marks/*/comment; digitar na nota e no comentário
// contar os dialogs; dismiss(); button("Close").click()
//   → um dialog só, mensagem "This note was not saved. Leave anyway?"; viewer visível

test("CA-3.10 text pasted into a comment box shows no notice, and a pasted image adds nothing", ...);
// drop a; open; mark; pasteInto(comment(1), [], "hello");
//   pasteInto(comment(1), [{ name: "p.png", content: "image/png" }])
// comment(1) tem valor ""; fechar → page.getByRole("alert") count 0; a grade tem 1 imagem

test("CA-4.4 the comment box follows the screen language", ...);
// língua "Português"; drop a; abrir; drag; "Gosto"
//   → viewer.getByLabel("Comentário da marcação 1") focada, placeholder "Comentário (opcional)"
```

Run: `pnpm test:e2e` → Expected: os testes novos FALHAM nos dois navegadores; os outros passam.

- [ ] **Step 2: Implementar** conforme Interfaces, com os textos da Tarefa 5.

Run: `pnpm check` → Expected: PASS.

- [ ] **Step 3: Commit**

`git commit -m "feat: write a comment on each mark, saved automatically"`

---

### Task 6: Trocar o tipo, apagar e o sinal na grade (tela)

**Modelo:** Sonnet, esforço `medium`.
**Critérios:** CA-4.5, CA-4.6, CA-4.7, CA-4.10, CA-4.11 (trocar e apagar).

**Files:**
- Modify: `src/web/api.ts`, `src/web/marks/MarkItem.tsx`, `src/web/marks/MarkPanel.tsx`, `src/web/note/ImageViewer.tsx`, `src/web/library/ImageGrid.tsx`, `src/web/i18n/pt-BR.ts`, `src/web/i18n/en.ts`, `src/web/styles.css`, `e2e/marks.spec.ts`, `e2e/start-over.spec.ts`

**Interfaces:**
- Consumes: `MarkItem`, `MarkPanel`, o estado `failed` e `onMarks` (Tarefas 4 e 5); as rotas `PUT /api/marks/:id/kind` e `DELETE /api/marks/:id` (Tarefa 2).
- Produces, em `src/web/api.ts` — `true` com resposta 2xx, `false` com qualquer outro status ou erro de rede; nunca lançam:

```ts
export async function saveMarkKind(markId: string, kind: MarkKind): Promise<boolean>;
export async function deleteMark(markId: string): Promise<boolean>;
```

- Changes, em `MarkItem.tsx`: novas props `onKind: (markId: string, kind: MarkKind) => void` e `onDelete: (markId: string) => void`.
  - A palavra do tipo dá lugar a `<div role="radiogroup" aria-label={t("mark.itemLabel", { number })}>` com dois `<label><input type="radio" name={`kind-${mark.id}`} />…</label>`, `mark.like` e `mark.dislike`. O marcado é sempre `mark.kind` (o que o servidor confirmou); clicar no outro chama `onKind`.
  - Botão `mark.delete`. Ao clicar: se o texto que está na caixa de comentário não é vazio (`trim`), `window.confirm(t("mark.confirmDelete"))`; recusou → nada acontece. Senão, ou confirmou → `onDelete(mark.id)`.
- Changes, em `MarkPanel.tsx`: novas props `onKind` e `onDelete`, repassadas.
- Changes, em `ImageViewer.tsx`:
  - `onKind(markId, kind)`: `saveMarkKind` → deu certo: `onMarks(image.id, ...)` trocando o tipo e `failed = false`; não deu: `failed = true`.
  - `onDelete(markId)`: `deleteMark` → deu certo: `onMarks(image.id, ...)` tirando a marcação e `failed = false`; não deu: `failed = true`.
- Changes, em `ImageGrid.tsx`: dentro do botão, depois do sinal de nota:

```tsx
{image.marks.length > 0 ? (
  <span className="mark-count" title={t("mark.count", { count: String(image.marks.length) })}>
    {image.marks.length}
  </span>
) : null}
```

- "Começar outro pacote" não muda de código: não toca nas marcações. A tarefa só acrescenta o teste.

- [ ] **Step 1: Testes que falham**

`e2e/marks.spec.ts`, com `const kind = (page: Page, n: number, name: "Like" | "Dislike") => marks(page).nth(n - 1).getByRole("radio", { name, exact: true });` e `const del = (page: Page, n: number) => marks(page).nth(n - 1).getByRole("button", { name: "Delete" });`:

```ts
test("CA-4.5 changing the kind saves by itself and shows on the list and on the rectangle", ...);
// drop a; open; mark (0.1, 0.1)–(0.4, 0.4) "Like"; comment(1).fill("keep"); saved(1) "Saved"
// kind(1, "Like") marcado; kind(1, "Dislike").click()
//   → kind(1, "Dislike") marcado; box(1) tem o texto "1 ✕" e continua no lugar; comment(1) valor "keep"
// page.reload(); open → kind(1, "Dislike") marcado; box(1) "1 ✕"

test("CA-4.6 Delete removes the mark and the next ones move up one number", ...);
// drop a; open; a caixa da nota recebe "note"; marcações: (0.05, 0.05)–(0.25, 0.25) "Like",
//   (0.3, 0.3)–(0.5, 0.5) "Dislike", (0.6, 0.6)–(0.9, 0.9) "Like"
// contar os dialogs do navegador; del(2).click() → nenhum dialog
//   → marks count 2; box(3) count 0; box(2) tem o texto "2 ✓" e está no lugar da terceira
//   box(1) "1 ✓" no lugar; a caixa da nota tem valor "note"
// fechar → "0 of 1 selected" visível (apagar não seleciona)
// page.reload(); open → marks count 2

test("CA-4.6 deleting a mark that has a comment asks first", ...);
// mark; comment(1).fill("why"); saved(1) "Saved"
// dialog: guardar a mensagem e dismiss(); del(1).click()
//   → mensagem "This mark has a comment, which will be deleted with it. Delete?"; marks count 1
// dialog: accept(); del(1).click() → marks count 0; box(1) count 0

test("CA-4.6 CA-4.9 the pack uses the numbers the screen shows after a delete", ...);
// drop a; open; mark (0.1, 0.1)–(0.4, 0.4) "Like" (amarelo); mark (0.6, 0.6)–(0.9, 0.9) "Dislike" (azul)
// del(1).click(); generate → readdir(marks) = ["01-1.png"]
// readPng(01-1.png, [[0, 0]]).colors = ["#3366cc"]; README contém "   - Mark 1 (dislike): `marks/01-1.png`"

test("CA-4.7 the grid shows how many marks each image has, without reloading", ...);
// drop a, b → page.getByTitle(/^Marks: /) count 0
// open b; duas marcações; fechar → item(page, "b.jpg").getByTitle("Marks: 2") visível, com o texto "2";
//   page.getByTitle(/^Marks: /) count 1; page.getByTitle("Has a note") count 0
// open b; del(1).click(); fechar → item(page, "b.jpg").getByTitle("Marks: 1") visível
// open b; del(1).click(); fechar → page.getByTitle(/^Marks: /) count 0
// língua "Português"; abrir b.jpg pelo botão "Anotar"; uma marcação; fechar → page.getByTitle("Marcações: 1") visível

test("CA-4.11 with refpack stopped, changing the kind or deleting changes nothing and the screen says so", ...);
// drop a; open; mark ... "Like"
// page.route("**/api/marks/**", (route) => route.abort("connectionrefused"))
// kind(1, "Dislike").click() → viewer.getByRole("alert") tem o texto de error.notSaved em inglês;
//   kind(1, "Like") marcado; box(1) "1 ✓"
// del(1).click() → o alerta continua; marks count 1; box(1) visível
// page.unroute(...); kind(1, "Dislike").click() → kind(1, "Dislike") marcado; viewer.getByRole("alert") count 0
```

`e2e/start-over.spec.ts`:

```ts
test("CA-4.10 starting another pack keeps every mark", ...);
// drop a.png; abrir pelo botão "Annotate"; desenhar e marcar "Like"; comentário "keep me"; "Saved"; fechar
// clicar em a.png (seleciona); dialog: accept(); "Start another pack" → "0 of 1 selected"
// o sinal "Marks: 1" de a.png continua visível; abrir → o comentário da marcação 1 tem valor "keep me"
// page.reload() → o sinal continua visível
```

Run: `pnpm test:e2e` → Expected: os testes novos FALHAM nos dois navegadores; os outros passam.

- [ ] **Step 2: Implementar** conforme Interfaces, com os textos da Tarefa 6.

Run: `pnpm check` → Expected: PASS.

- [ ] **Step 3: Commit**

`git commit -m "feat: change a mark's kind, delete it, and count marks in the grid"`

- [ ] **Step 4: Conferência final da fatia — feita pelo condutor**

Run: `pnpm check` → PASS, saída guardada para o relatório.
Run: `gh pr checks` → todos os jobs verdes.
Conferir que CA-4.1 a CA-4.14 têm teste com o identificador no nome: `grep -rhoE "CA-4\.[0-9]+" src e2e | sort -u`.

Só então: revisão da fatia (Opus, contexto limpo), conforme `docs/WORKFLOW.md`.

- [ ] **Step 5: Depois do "aprovado" do dono**

Em `ROADMAP.md`, a fatia 4 passa a `feita` e a fatia 5 a `próxima`. Commit: `docs: mark slice 4 as done`. Merge do pull request.

---

## Roteiro de teste manual do dono

O condutor deixa o branch pronto e avisa. Faça no **Firefox**, com o mouse, com a sua biblioteca de verdade (a que você já usou nas fatias 0 a 3).

1. Rode `pnpm start`.
   **Esperado:** as suas imagens continuam todas lá, com as mesmas notas, a mesma seleção e a mesma intenção. O botão de cada imagem agora se chama "Anotar". Nenhuma mostra sinal de marcação. *(CA-0.6, CA-3.6, CA-4.8)*
2. Clique em "Anotar" numa imagem larga (um screenshot de tela inteira).
   **Esperado:** a imagem abre como antes, com a caixa da nota e o cursor nela. Ao lado, a lista de marcações, vazia, com a dica de arrastar o mouse. *(CA-4.3)*
3. Arraste o mouse sobre uma parte da imagem e solte.
   **Esperado:** um retângulo acompanha o mouse e fica na imagem. Aparecem os botões "Gosto", "Não gosto" e "Cancelar". A imagem não sai do lugar nem fica azul. *(CA-4.1)*
4. Clique em "Gosto" e escreva um comentário com acentos.
   **Esperado:** o retângulo ganha o número 1 e o sinal de "gosto"; a marcação aparece na lista; o cursor já está na caixa de comentário dela; aparece "Salvo". *(CA-4.2, CA-4.4)*
5. Desenhe outro retângulo, por cima de parte do primeiro, e clique em "Não gosto". Não escreva comentário.
   **Esperado:** marcação 2, com cor e sinal diferentes da primeira. *(CA-4.1, CA-4.3)*
6. Desenhe um terceiro retângulo e clique em "Cancelar". Depois dê um clique simples na imagem, sem arrastar.
   **Esperado:** nos dois casos, nada é criado. *(CA-4.1, CA-4.2)*
7. Arraste começando dentro da imagem e soltando fora dela.
   **Esperado:** o retângulo para na borda da imagem. Clique em "Gosto". *(CA-4.1)*
8. Na lista, troque a marcação 3 para "Não gosto". Depois clique em "Apagar" na marcação 2.
   **Esperado:** o retângulo 3 muda de cor e de sinal. Ao apagar a 2 (sem comentário), ela some sem pergunta e a 3 passa a ser a 2. *(CA-4.5, CA-4.6)*
9. Clique em "Apagar" na marcação 1, que tem comentário, e cancele a pergunta.
   **Esperado:** a tela pergunta antes; ao cancelar, a marcação continua. *(CA-4.6)*
10. Aumente e diminua a janela do navegador.
    **Esperado:** os retângulos continuam sobre as mesmas partes da imagem. *(CA-4.3)*
11. Clique em "Próxima", marque uma parte de uma imagem alta (um screenshot de celular ou de página inteira), e clique em "Fechar".
    **Esperado:** na grade, as duas imagens mostram o sinal com a quantidade de marcações (2 e 1). *(CA-4.7)*
12. Feche a aba, pare o refpack no terminal (Ctrl+C) e rode `pnpm start` de novo.
    **Esperado:** os mesmos sinais na grade; abrindo cada imagem, as mesmas marcações, no mesmo lugar, com o mesmo tipo e o mesmo comentário. *(CA-4.8)*
13. Selecione as duas imagens marcadas e mais uma sem marcação. Clique em "Gerar pacote", copie o caminho e abra a pasta.
    **Esperado:** existe a pasta `marks` com um recorte por marcação (`01-1.png`, `01-2.png`, `02-1.png`…). Cada recorte mostra só a parte que você marcou, nítida, no tamanho original. Há um arquivo `.md` com o seu texto só para a marcação que tem comentário. *(CA-4.9)*
14. No Claude Code, diga "leia a pasta" e cole o caminho.
    **Esperado:** para cada marcação, ele diz que parte da imagem é, se é para aproveitar ou evitar, e o que o seu comentário pede. *(CA-4.9)*
15. Clique em "Começar outro pacote" e confirme.
    **Esperado:** a seleção e a intenção ficam vazias; os sinais de marcação e as marcações continuam. *(CA-4.10)*
16. Abra uma imagem, pare o refpack no terminal (Ctrl+C) e, com a tela ainda aberta, desenhe um retângulo e clique em "Gosto".
    **Esperado:** aparece o aviso de que não foi possível salvar, e a marcação não é criada. Rode `pnpm start` de novo antes do próximo passo. *(CA-4.11)*
O CA-4.12 (imagem colada antes de a lista carregar) e o CA-4.13 (tela e refpack em versões diferentes) não dão para provocar à mão com segurança: são conferidos só pelos testes automáticos, cuja saída o condutor mostra junto com este roteiro.
