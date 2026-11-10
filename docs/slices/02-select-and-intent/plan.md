# Fatia 2 — Escolher e dizer a intenção: plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task, with the overrides in `docs/WORKFLOW.md`. Steps use checkbox (`- [ ]`) syntax for tracking.

**Objetivo:** o dono seleciona quais imagens entram no pacote e escreve a intenção do projeto; o pacote sai só com as selecionadas e com a intenção.

**Arquitetura:** a seleção e a intenção ficam no banco da biblioteca (ADR-0011): uma coluna nova na tabela de imagens e uma tabela de uma linha só. O servidor ganha quatro rotas pequenas e passa a gerar o pacote a partir do que está guardado. Na tela, cada imagem da grade vira uma caixa de marcar, e a caixa da intenção salva sozinha por uma fila de "um envio de cada vez, sempre o mais recente" (ADR-0012).

**Stack:** a das fatias 0 e 1, sem dependência nova.

**Spec:** `SPEC.md`, seção 8 (critérios CA-2.1 a CA-2.12). ADRs 0004, 0007, 0008, 0010, 0011 e 0012.

## Para o dono: o que esta fatia entrega

| Tarefa | O que passa a existir | Critérios |
| --- | --- | --- |
| 1. Seleção no servidor | A biblioteca guarda quais imagens estão selecionadas. Nada muda na tela ainda. | base de CA-2.1, 2.2, 2.3, 2.5 |
| 2. Seleção na tela | Clicar numa imagem seleciona; contador; "Selecionar todas" e "Limpar seleção"; a imagem não fica mais azul. | CA-2.1, 2.2, 2.3, 2.5, 2.11 |
| 3. Pacote só com as selecionadas | "Gerar pacote" leva só as selecionadas e fica desativado sem seleção. | CA-2.6, 2.8, 2.9 |
| 4. Intenção no servidor | A biblioteca guarda a intenção e o pacote sai com o `INTENT.md`. Nada muda na tela ainda. | base de CA-2.4, 2.5, 2.7 |
| 5. Intenção na tela | A caixa "Intenção do projeto", que salva sozinha e mostra "Salvo". | CA-2.4, 2.5, 2.6, 2.7, 2.9, 2.11, 2.12 |
| 6. Começar outro pacote | O botão que limpa a seleção e a intenção, com confirmação. | CA-2.10 |

O roteiro do seu teste manual, no Firefox, está no fim deste arquivo.

**O que os testes automáticos não cobrem:** colar um texto de verdade dentro da caixa da intenção (CA-2.12; o teste só confere que o aviso não aparece), a aparência do destaque da imagem selecionada e a leitura do pacote pelo Claude Code (CA-2.7). Esses pontos ficam para o seu teste manual.

## Global Constraints

- Nenhuma dependência nova. O esquema do banco é exatamente o das migrações `002` e `003` deste plano.
- Só existem os arquivos listados em "Estrutura de arquivos". Precisou de outro: pare e reporte.
- Toda rota nova valida a entrada com zod (ADR-0007, item 3) e fica atrás do `localOnly` que já existe.
- O texto da intenção nunca é alterado: nada de `trim`, de trocar quebras de linha ou de normalizar. O único `trim` permitido é para **decidir** se a intenção está vazia.
- Limite da intenção: `MAX_INTENT_LENGTH = 10_000`, o mesmo valor no `maxLength` da caixa e no zod do servidor.
- A tela só mostra o que o servidor confirmou (ADR-0012): nenhuma atualização antecipada de seleção, e "Salvo" só com o texto atual confirmado.
- Nenhum temporizador (`setTimeout`, espera por pausa na digitação) no salvamento. Nenhum `waitForTimeout` nos testes.
- Todo texto visível vem dos dicionários `pt-BR` e `en`, com exatamente os textos da tabela "Textos novos". O texto do dono é sempre exibido como texto (ADR-0007, item 6).
- O código do produto não tem ramo por navegador nem por sistema operacional (ADR-0010, R11). Um teste que só passa com tratamento especial: pare e reporte.
- Nenhum arquivo de imagem é commitado. Os testes fabricam as imagens.
- Todo teste que cobre um critério traz o identificador no nome, por exemplo `"CA-2.6 ..."`.
- Testes das fatias 0 e 1 só mudam onde este plano diz. Outro teste antigo quebrou: pare e reporte.
- Commits em inglês, Conventional Commits, um por passo de commit do plano.
- Ao fim de cada tarefa o condutor envia o branch e espera o CI verde antes de começar a próxima.

## Textos novos

| Chave | `pt-BR` | `en` | Tarefa |
| --- | --- | --- | --- |
| `selection.count` | {selected} de {total} selecionadas | {selected} of {total} selected | 2 |
| `selection.all` | Selecionar todas | Select all | 2 |
| `selection.clear` | Limpar seleção | Clear selection | 2 |
| `error.notSaved` | Não foi possível salvar. Confira se o refpack ainda está rodando no terminal. | Could not save. Check that refpack is still running in the terminal. | 2 |
| `pack.selectHint` | Selecione pelo menos uma imagem para gerar um pacote. | Select at least one image to generate a pack. | 3 |
| `intent.label` | Intenção do projeto | Project intent | 5 |
| `intent.placeholder` | O que é, para quem é e o que a pessoa precisa conseguir fazer. | What it is, who it is for and what the person needs to be able to do. | 5 |
| `intent.saved` | Salvo | Saved | 5 |
| `pack.startOver` | Começar outro pacote | Start another pack | 6 |
| `pack.confirmStartOver` | Isto tira todas as imagens da seleção e apaga o texto da intenção. Continuar? | This clears the selection and erases the intent text. Continue? | 6 |

## Review Focus

Condições que o dono pode causar em uso normal. Todas têm critério no SPEC; cada uma tem seu teste na tarefa indicada.

1. Abrir a biblioteca que ele já tem, criada nas fatias 0 e 1 → as imagens continuam lá, todas sem seleção, intenção vazia; CA-0.6 e definições da seção 8 (Tarefas 1 e 4).
2. Digitar e clicar em "Gerar pacote" logo em seguida → o texto inteiro está no pacote; CA-2.6 (Tarefa 5).
3. Colar um texto copiado de outro lugar dentro da caixa da intenção → nenhum aviso de "não havia imagem"; CA-2.12 (Tarefa 5).
4. Intenção com acentos, emoji, linhas em branco, espaços no começo e no fim e símbolos de Markdown → `INTENT.md` idêntico, byte a byte; CA-2.7 (Tarefa 4).
5. Duas imagens com o mesmo nome (o mesmo arquivo adicionado duas vezes) → selecionar uma não seleciona a outra; CA-2.1 (Tarefa 2).

## Estrutura de arquivos

```
src/server/migrations/002-image-selected.sql   novo: coluna selected
src/server/migrations/003-pack-draft.sql       novo: tabela da intenção
src/server/draft.ts  draft.test.ts             novos: gravar a seleção; ler e gravar a intenção
src/server/library.ts  library.test.ts         modificados: a imagem lida traz selected
src/server/pack.ts  pack.test.ts               modificados: só as selecionadas; INTENT.md
src/server/app.ts  app.test.ts                 modificados: quatro rotas novas
src/shared/api.ts                              modificado: schemas e limites novos
src/web/api.ts                                 modificado: chamadas novas
src/web/App.tsx                                modificado: liga tudo
src/web/library/ImageGrid.tsx                  modificado: uma caixa de marcar por imagem
src/web/library/SelectionBar.tsx               novo: contador, "Selecionar todas", "Limpar seleção"
src/web/library/IncomingFiles.tsx              modificado: colar dentro da caixa da intenção
src/web/pack/saver.ts  saver.test.ts           novos: a fila de salvamento (ADR-0012)
src/web/pack/use-intent.ts                     novo: carrega a intenção e a salva pela fila
src/web/pack/IntentBox.tsx                     novo: a caixa e a indicação "Salvo"
src/web/pack/PackPanel.tsx                     modificado: regra do botão, espera o salvamento, "Começar outro pacote"
src/web/i18n/pt-BR.ts  en.ts                   modificados: textos novos
src/web/styles.css                             modificado
e2e/support.ts                                 modificado: ajudante pasteInto
e2e/pack.spec.ts                               modificado
e2e/selection.spec.ts  intent.spec.ts  start-over.spec.ts   novos
```

Nos testes de ponta a ponta novos, as imagens entram por `drop(page, [...])` de `e2e/support.ts` (funciona nos dois navegadores). Soltar `a.png`, `b.jpg`, `c.webp` deixa a grade na ordem `c.webp`, `b.jpg`, `a.png`. Localizadores usados abaixo: `images = page.getByRole("list").getByRole("img")`; `box(name) = page.getByRole("checkbox", { name })`; `intent = page.getByLabel("Project intent")`.

---

### Task 1: A biblioteca guarda a seleção (servidor)

**Modelo:** Sonnet, esforço `medium`.
**Critérios:** base de CA-2.1, CA-2.2, CA-2.3, CA-2.5; ADR-0011.

**Files:**
- Create: `src/server/migrations/002-image-selected.sql`, `src/server/draft.ts`, `src/server/draft.test.ts`
- Modify: `src/server/library.ts`, `src/server/library.test.ts`, `src/server/app.ts`, `src/server/app.test.ts`, `src/shared/api.ts`

Antes do Step 1, o condutor confere que está no branch `slice/02-select-and-intent` (criado pelo arquiteto ao aprovar o plano).

**Interfaces:**
- Migração `002-image-selected.sql`, exatamente:

```sql
ALTER TABLE images ADD COLUMN selected INTEGER NOT NULL DEFAULT 0 CHECK (selected IN (0, 1));
```

- Changes, em `src/shared/api.ts`: `ImageSchema` ganha `selected: z.boolean()`; `ErrorCodeSchema` ganha `"invalid-request"`; novo `export const SelectedBodySchema = z.object({ selected: z.boolean() });`.
- Changes, em `src/server/library.ts`: `StoredImage` ganha `selected: boolean`; `listImages`, `findImage` e `addImage` passam a devolvê-lo (imagem nova: `false`); a linha lida do banco é conferida com zod (`selected` é `0` ou `1`).
- Produces, em `src/server/draft.ts`:

```ts
// False when no image has this id; nothing changes then.
export function setSelected(library: Library, id: string, selected: boolean): boolean;
export function setAllSelected(library: Library, selected: boolean): void;
```

- Produces, em `src/server/app.ts` (o corpo é JSON conferido com `SelectedBodySchema`; corpo que não é JSON ou não passa no schema → `400` com `invalid-request`):
  - `PUT /api/images/:id/selected` → `204`; id desconhecido ou malformado → `404` com `not-found`.
  - `PUT /api/draft/selection` → `204`; vale para todas as imagens.
  - `toImage` passa a incluir `selected`.

- [ ] **Step 1: Testes que falham**

`src/server/library.test.ts` — a biblioteca que o dono já tem (Review Focus 1):

```ts
test("CA-0.6 a library created before slice 2 opens with every image unselected", () => {
  const root = tempLibraryRoot();
  mkdirSync(join(root, "images"), { recursive: true });
  const old = new DatabaseSync(join(root, "library.db"));
  old.exec(readFileSync(join(import.meta.dirname, "migrations", "001-images.sql"), "utf8"));
  old.exec("PRAGMA user_version = 1");
  old
    .prepare("INSERT INTO images (id, original_name, mime_type) VALUES (?, ?, ?)")
    .run("3f2b8a52-6c1e-4b0f-9a4d-1d2c3b4a5e6f", "antiga.png", "image/png");
  old.close();
  expect(listImages(open(root))).toEqual([
    {
      id: "3f2b8a52-6c1e-4b0f-9a4d-1d2c3b4a5e6f",
      originalName: "antiga.png",
      mimeType: "image/png",
      fileName: "3f2b8a52-6c1e-4b0f-9a4d-1d2c3b4a5e6f.png",
      selected: false,
    },
  ]);
});
```

`src/server/draft.test.ts` (biblioteca temporária como em `pack.test.ts`; `a`, `b` = imagens de `addImage`, nessa ordem; `flags()` = `listImages(library).map((i) => i.selected)`, na ordem da grade `[b, a]`):

```ts
test("CA-2.1 an image is selected and unselected by its id", ...);
// setSelected(library, b.id, true) → true; flags() = [true, false]
// setSelected(library, b.id, false) → true; flags() = [false, false]

test("setSelected answers false for an unknown id and changes nothing", ...);
// setSelected(library, "3f2b8a52-6c1e-4b0f-9a4d-1d2c3b4a5e6f", true) → false; flags() = [false, false]

test("CA-2.2 setAllSelected selects every image, then none", ...);
// setAllSelected(true) → flags() = [true, true]; setAllSelected(false) → [false, false]

test("CA-2.3 a new image enters unselected and the others keep their selection", ...);
// setSelected(a.id, true); addImage(c) → flags() = [false, false, true]  (grade: c, b, a)

test("CA-2.5 the selection is still there after closing and reopening the library", ...);
// setSelected(b.id, true); closeLibrary; openLibrary(mesma raiz) → flags() = [true, false]
```

`src/server/app.test.ts`:

```ts
test("CA-2.1 PUT /api/images/:id/selected stores the choice and GET /api/images shows it", ...);
// upload → a imagem devolvida tem selected === false
// PUT { selected: true } → 204; GET /api/images → images[0].selected === true

test("PUT /api/images/:id/selected answers 404 not-found for an unknown or malformed id", ...);
// ids "3f2b8a52-6c1e-4b0f-9a4d-1d2c3b4a5e6f" e "not-a-uuid"

test("PUT /api/images/:id/selected answers 400 invalid-request for a wrong body", ...);
// corpos: "{}", '{"selected":"yes"}', "not json" → 400 { error: { code: "invalid-request" } }; GET mostra selected === false

test("CA-2.2 PUT /api/draft/selection selects every image, then none", ...);
// dois uploads; PUT { selected: true } → 204, GET: os dois true; PUT { selected: false } → os dois false

test("CA-0.11 the selection routes are behind the local-only guard", ...);
// PUT /api/draft/selection com host "evil.example" → 403
```

Nos testes antigos que comparam uma imagem inteira com `toEqual`, acrescente `selected: false` ao esperado; nada mais muda neles.

Run: `pnpm test` → Expected: os testes novos FALHAM; os antigos passam.

- [ ] **Step 2: Implementar** conforme Interfaces.

Run: `pnpm check` → Expected: PASS. A tela não mudou.

- [ ] **Step 3: Commit**

`git commit -m "feat: store which images are selected for the next pack"`

---

### Task 2: Selecionar na tela

**Modelo:** Sonnet, esforço `medium`.
**Critérios:** CA-2.1, CA-2.2, CA-2.3, CA-2.5 (seleção), CA-2.11 (clique).

**Files:**
- Create: `src/web/library/SelectionBar.tsx`, `e2e/selection.spec.ts`
- Modify: `src/web/api.ts`, `src/web/App.tsx`, `src/web/library/ImageGrid.tsx`, `src/web/i18n/pt-BR.ts`, `src/web/i18n/en.ts`, `src/web/styles.css`

**Interfaces:**
- Consumes: as rotas e o `ImageSchema` da Tarefa 1.
- Produces, em `src/web/api.ts` — as duas devolvem `true` com resposta 2xx e `false` com qualquer outro status ou erro de rede; nunca lançam:

```ts
export async function setImageSelected(id: string, selected: boolean): Promise<boolean>;
export async function setAllSelected(selected: boolean): Promise<boolean>;
```

- Changes, em `ImageGrid.tsx`: `ImageGrid({ images, onToggle }: { images: Image[]; onToggle: (image: Image) => void })`. Cada item passa a ser:

```tsx
<li key={image.id}>
  <label>
    <input type="checkbox" checked={image.selected} onChange={() => onToggle(image)} />
    <img src={image.url} alt={image.originalName} draggable={false} />
  </label>
</li>
```

- Produces, em `SelectionBar.tsx`: `SelectionBar(props: { selected: number; total: number; onSelectAll: () => void; onClear: () => void })`. Desenha `<span>` com `t("selection.count", { selected: String(selected), total: String(total) })` e dois botões, `selection.all` e `selection.clear`.
- Changes, em `App.tsx`:
  - `toggle(image)`: chama `setImageSelected(image.id, !image.selected)`; `true` → troca o `selected` dessa imagem no estado; `false` → `refuse({ key: "error.notSaved" })` e o estado não muda.
  - `selectAll(selected: boolean)`: chama `setAllSelected(selected)`; `true` → todas as imagens do estado ficam com esse valor; `false` → `refuse({ key: "error.notSaved" })`.
  - `<SelectionBar />` aparece logo acima da grade, só quando há imagens.
- `styles.css`: `.image-grid { user-select: none; }`; o `label` é `display: block; position: relative; cursor: pointer`; a caixa de marcar fica no canto superior esquerdo, por cima da imagem; `.image-grid input:checked + img` ganha `outline: 4px solid #1a56db; outline-offset: -4px`.

- [ ] **Step 1: Testes que falham**

`e2e/selection.spec.ts`:

```ts
test("CA-2.1 clicking an image selects it and clicking it again takes it out", ...);
// drop a.png, b.jpg, c.webp → "0 of 3 selected" visível
// page.getByAltText("b.jpg").click() → box("b.jpg") marcada; box("a.png") e box("c.webp") não; "1 of 3 selected"
// clicar de novo → box("b.jpg") desmarcada; "0 of 3 selected"

test("CA-2.1 two images with the same name are selected one at a time", ...);
// dois drops de a.png → images.first().click() → box("a.png").nth(0) marcada, .nth(1) não; "1 of 2 selected"

test("CA-2.1 the grid cannot be selected like text", ...);
// drop a.png → await expect(page.getByRole("list")).toHaveCSS("user-select", "none")

test("CA-2.2 select all and clear selection", ...);
// biblioteca vazia: o botão "Select all" tem count 0
// drop a.png, b.jpg, c.webp → "Select all" → as 3 caixas marcadas; "3 of 3 selected"
// "Clear selection" → nenhuma marcada; "0 of 3 selected"
// língua "Português" → "0 de 3 selecionadas", botões "Selecionar todas" e "Limpar seleção"

test("CA-2.3 a new image enters unselected and the selection stays", ...);
// drop a.png, b.jpg; clicar em a.png; drop c.webp → box("c.webp") não marcada; box("a.png") marcada; "1 of 3 selected"

test("CA-2.5 the same images are selected after closing and opening again", ...);
// drop a.png, b.jpg; clicar em b.jpg; esperar box("b.jpg") marcada
// app.restart(); page.goto(nova url) → box("b.jpg") marcada; box("a.png") não; "1 of 2 selected"

test("CA-2.11 a click that cannot be saved warns and leaves the image unselected", ...);
// drop a.png; await page.route("**/api/**", (route) => route.abort("connectionrefused"))
// clicar em a.png → alert contém "Could not save. Check that refpack is still running in the terminal."
// box("a.png") não marcada; "0 of 1 selected"
// língua "Português" → alert contém "Não foi possível salvar. Confira se o refpack ainda está rodando no terminal."
```

Run: `pnpm test:e2e` → Expected: os testes novos FALHAM nos dois navegadores; os outros passam.

- [ ] **Step 2: Implementar** conforme Interfaces, com os textos da Tarefa 2 na tabela "Textos novos".

Run: `pnpm check` → Expected: PASS.

- [ ] **Step 3: Commit**

`git commit -m "feat: select images in the grid, with a counter, select all and clear"`

---

### Task 3: O pacote leva só as selecionadas

**Modelo:** Sonnet, esforço `medium`.
**Critérios:** CA-2.6 (primeira parte), CA-2.8, CA-2.9 (seleção); mudanças em CA-0.2, CA-0.7 e CA-0.9.

**Files:**
- Modify: `src/server/pack.ts`, `src/server/pack.test.ts`, `src/server/app.ts`, `src/server/app.test.ts`, `src/shared/api.ts`, `src/web/api.ts`, `src/web/pack/PackPanel.tsx`, `src/web/App.tsx`, `src/web/i18n/pt-BR.ts`, `src/web/i18n/en.ts`, `e2e/pack.spec.ts`

**Interfaces:**
- Consumes: `StoredImage.selected`, `setSelected`, `setAllSelected` (Tarefa 1); o botão "Select all" (Tarefa 2).
- Changes, em `src/shared/api.ts`: em `ErrorCodeSchema`, `"empty-library"` é **trocado** por `"nothing-selected"`.
- Changes, em `src/server/pack.ts`: `createPack(library, now)` usa só as imagens com `selected === true`, na ordem de `listImages`; a numeração e o `README.md` contam só elas. Nenhuma selecionada → `{ ok: false, code: "nothing-selected" }`, sem criar pasta. A assinatura não muda.
- Changes, em `src/server/app.ts`: `POST /api/packs` responde `409` com `nothing-selected`.
- Changes, em `src/web/api.ts`: em `CreatePackResult`, `"empty-library"` vira `"nothing-selected"`.
- Changes, em `PackPanel.tsx`: props `{ imageCount: number; selectedCount: number; onFailed }`. O botão fica desativado quando `selectedCount === 0`. Explicação: `pack.disabledHint` quando `imageCount === 0`; `pack.selectHint` quando há imagens e `selectedCount === 0`; nenhuma nos outros casos.
- Changes, em `App.tsx`: passa `selectedCount` (quantas imagens do estado têm `selected`).

- [ ] **Step 1: Testes que falham**

`src/server/pack.test.ts`:
- Os testes `CA-0.7 creates the pack folder…` e os dois `CA-0.9` passam a chamar `setAllSelected(library, true)` depois de `fillLibrary`; o esperado deles não muda. O segundo `CA-0.9` ganha `CA-2.9` no nome (a comparação de `listImages` já cobre o `selected`).
- O teste `an empty library creates nothing and answers empty-library` passa a esperar `nothing-selected`.
- Novos:

```ts
test("CA-2.6 only the selected images enter the pack, numbered in grid order", ...);
// a.png, b.jpg, c.webp adicionadas; setSelected de a e de c
// count 2; readdirSync(refs).sort() = ["01.webp", "02.png"]
// README contém "- References: 2", "1. `refs/01.webp`", "2. `refs/02.png`" e não contém "03"

test("CA-2.8 images with none selected create nothing and answer nothing-selected", ...);
// fillLibrary sem selecionar → { ok: false, code: "nothing-selected" }; packsDir não existe
```

`src/server/app.test.ts`: o teste `CA-0.7 POST /api/packs…` seleciona tudo com `PUT /api/draft/selection` antes de gerar; o teste do `409` passa a esperar `nothing-selected` e ganha um segundo caso, com imagens e nenhuma selecionada.

`e2e/pack.spec.ts`: `addTwoImages` termina clicando em "Select all" e esperando "2 of 2 selected". Novos:

```ts
test("CA-2.8 with images and nothing selected the generate button is disabled with an explanation", ...);
// drop a.png → botão "Generate pack" desativado; "Select at least one image to generate a pack." visível
// "Add at least one image to generate a pack." tem count 0
// clicar em a.png → botão ativado; "Select at least one image…" tem count 0

test("CA-2.6 the pack holds only the selected images", ...);
// drop a.png, b.jpg; clicar em a.png; generate
// readdir(join(path, "refs")) = ["01.png"]; README.md contém "- References: 1"

test("CA-2.9 the selection is the same after generating", ...);
// drop a.png, b.jpg; clicar em a.png; generate → box("a.png") marcada; box("b.jpg") não; "1 of 2 selected"
```

Run: `pnpm check` → Expected: os testes novos e os alterados FALHAM.

- [ ] **Step 2: Implementar** conforme Interfaces.

Run: `pnpm check` → Expected: PASS.

- [ ] **Step 3: Commit**

`git commit -m "feat: generate the pack from the selected images only"`

---

### Task 4: A biblioteca guarda a intenção e o pacote a leva (servidor)

**Modelo:** Sonnet, esforço `medium`.
**Critérios:** base de CA-2.4, CA-2.5; CA-2.7; CA-2.9 (intenção); ADR-0011.

**Files:**
- Create: `src/server/migrations/003-pack-draft.sql`
- Modify: `src/server/draft.ts`, `src/server/draft.test.ts`, `src/server/library.test.ts`, `src/server/pack.ts`, `src/server/pack.test.ts`, `src/server/app.ts`, `src/server/app.test.ts`, `src/shared/api.ts`

**Interfaces:**
- Migração `003-pack-draft.sql`, exatamente:

```sql
CREATE TABLE pack_draft (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  intent TEXT NOT NULL
) STRICT;
INSERT INTO pack_draft (id, intent) VALUES (1, '');
```

- Produces, em `src/shared/api.ts`:

```ts
export const MAX_INTENT_LENGTH = 10_000;
// The body of PUT /api/draft/intent and the answer of GET /api/draft.
export const IntentSchema = z.object({ intent: z.string().max(MAX_INTENT_LENGTH) });
```

- Produces, em `src/server/draft.ts` (a linha lida é conferida com zod; o texto vai e volta sem nenhuma alteração):

```ts
export function getIntent(library: Library): string;
export function setIntent(library: Library, intent: string): void;
```

- Produces, em `src/server/app.ts`:
  - `GET /api/draft` → `200` com `{ intent }`.
  - `PUT /api/draft/intent` → `204`. Corpo conferido com `IntentSchema`; inválido → `400` com `invalid-request` e nada é gravado. Com `bodyLimit` de `128 * 1024` bytes; acima disso → `413` com `too-large`.
- Changes, em `src/server/pack.ts`: com `getIntent(library).trim() !== ""`, o pacote ganha `INTENT.md`, gravado com `writeFileSync(path, intent)` — o texto guardado, sem cabeçalho e sem quebra de linha a mais — e o `README.md` ganha, logo depois da linha ``Use the images in `refs/`…``, uma linha em branco e esta linha:

```
Read `INTENT.md` before you look at the references. It says what is being built, for whom, and what they need to be able to do. It is in the owner's own words and may be in a language other than English.
```

  Com a intenção vazia (`trim() === ""`) o pacote sai exatamente como na Tarefa 3.

- [ ] **Step 1: Testes que falham**

Texto usado nos testes (Review Focus 4):

```ts
const INTENT = "  # Painel de açaí 🍇\n\n\t* Para quem vende na feira.\n`rápido` & simples  \n";
```

`src/server/draft.test.ts`:

```ts
test("CA-2.4 the intent starts empty and comes back exactly as stored", ...);
// getIntent → ""; setIntent(INTENT) → getIntent === INTENT

test("CA-2.5 the intent is still there after closing and reopening the library", ...);
```

`src/server/library.test.ts`: o teste `CA-0.6 a library created before slice 2…` ganha `expect(getIntent(library)).toBe("")`.

`src/server/pack.test.ts`:

```ts
test("CA-2.7 a pack with an intent carries INTENT.md with exactly the text, and the README points to it", ...);
// fillLibrary + setAllSelected(true) + setIntent(INTENT)
// readFileSync(join(path, "INTENT.md")) é igual a Buffer.from(INTENT, "utf8")
// README.md é igual ao esperado do teste CA-0.7 com as duas linhas novas no lugar indicado em Interfaces

test("CA-2.7 an empty or blank intent leaves no INTENT.md and no mention of it", ...);
// para "" e " \n\t ": INTENT.md não existe; README.md é igual ao esperado do teste CA-0.7

test("CA-2.9 generating a pack leaves the intent unchanged", ...);
```

`src/server/app.test.ts`:

```ts
test("CA-2.4 PUT /api/draft/intent stores the text and GET /api/draft returns it unchanged", ...);
// GET → { intent: "" }; PUT { intent: INTENT } → 204; GET → { intent: INTENT }

test("PUT /api/draft/intent takes 10 000 characters and refuses 10 001", ...);
// "x".repeat(10_000) → 204; "x".repeat(10_001) → 400 invalid-request, e GET ainda devolve o texto de 10 000

test("PUT /api/draft/intent answers 400 invalid-request for a wrong body", ...);
// corpos: "{}", '{"intent":5}', "not json"
```

Run: `pnpm test` → Expected: os testes novos FALHAM.

- [ ] **Step 2: Implementar** conforme Interfaces.

Run: `pnpm check` → Expected: PASS. A tela não mudou.

- [ ] **Step 3: Commit**

`git commit -m "feat: store the project intent and write it to the pack as INTENT.md"`

---

### Task 5: Escrever a intenção na tela

**Modelo:** Opus, esforço `high` — tarefa **difícil** (ordem dos envios e estado assíncrono; ADR-0012).
**Critérios:** CA-2.4, CA-2.5 (intenção), CA-2.6 (segunda parte), CA-2.7, CA-2.9 (intenção), CA-2.11 (texto), CA-2.12.

**Files:**
- Create: `src/web/pack/saver.ts`, `src/web/pack/saver.test.ts`, `src/web/pack/use-intent.ts`, `src/web/pack/IntentBox.tsx`, `e2e/intent.spec.ts`
- Modify: `src/web/api.ts`, `src/web/App.tsx`, `src/web/pack/PackPanel.tsx`, `src/web/library/IncomingFiles.tsx`, `src/web/i18n/pt-BR.ts`, `src/web/i18n/en.ts`, `src/web/styles.css`, `e2e/support.ts`

**Interfaces:**
- Consumes: `GET /api/draft`, `PUT /api/draft/intent`, `IntentSchema`, `MAX_INTENT_LENGTH` (Tarefa 4).
- Produces, em `src/web/api.ts`:

```ts
export async function fetchIntent(): Promise<string>;                  // throws when the request fails, like fetchImages
export async function saveIntent(intent: string): Promise<boolean>;    // true on 2xx; false otherwise; never throws
```

- Produces, em `src/web/pack/saver.ts` — a regra do ADR-0012, sem React e sem temporizador:

```ts
export type SaveState = "idle" | "saving" | "saved" | "failed";
export type Saver = {
  // Records the latest text and makes sure it gets sent. Never two sends at once.
  push(text: string): void;
  // Sends what is still unsent (also after a failure), waits until nothing is in flight,
  // and answers whether the latest text is the one the server confirmed.
  flush(): Promise<boolean>;
};
export function createSaver(
  send: (text: string) => Promise<boolean>,
  onState: (state: SaveState) => void,
): Saver {
  let latest: string | null = null; // last text pushed
  let confirmed: string | null = null; // last text the server confirmed
  let running: Promise<void> | null = null;

  async function run(): Promise<void> {
    onState("saving");
    let ok = true;
    while (ok && latest !== confirmed) {
      const text = latest as string;
      ok = await send(text);
      if (ok) confirmed = text;
    }
    running = null;
    onState(ok ? "saved" : "failed");
  }

  function start(): void {
    if (running === null && latest !== confirmed) running = run();
  }

  return {
    push(text) {
      latest = text;
      if (running === null && latest === confirmed) onState("saved");
      start();
    },
    async flush() {
      start();
      while (running !== null) await running;
      return latest === confirmed;
    },
  };
}
```

- Produces, em `src/web/pack/use-intent.ts`:

```ts
export type IntentDraft = {
  text: string | null; // null until it is loaded from the server
  saveState: SaveState;
  change(text: string): void; // shows the text in the box and pushes it to the saver
  flush(): Promise<boolean>;
};
export function useIntent(): IntentDraft;
```

  Carrega com `fetchIntent` ao montar (com o mesmo cuidado de cancelamento do `fetchImages` em `App.tsx`); cria **um** `Saver` por montagem, com `saveIntent` e o `setState` do `saveState`. O texto carregado não é enviado de volta.

- Produces, em `src/web/pack/IntentBox.tsx`: `IntentBox(props: { text: string | null; saveState: SaveState; onChange: (text: string) => void })`:

```tsx
<div className="intent">
  <label htmlFor="intent">{t("intent.label")}</label>
  <textarea
    id="intent"
    rows={5}
    maxLength={MAX_INTENT_LENGTH}
    placeholder={t("intent.placeholder")}
    disabled={text === null}
    value={text ?? ""}
    onChange={(event) => onChange(event.target.value)}
  />
  <span role="status" className="intent-status">{/* see below */}</span>
</div>
```

  O `status` mostra `t("intent.saved")` quando `saveState === "saved"`, `t("error.notSaved")` quando `"failed"`, e fica vazio nos outros estados. No CSS, o `status` tem altura mínima de uma linha, para a tela não pular.

- Changes, em `PackPanel.tsx`: nova prop `beforeGenerate: () => Promise<boolean>`. `generate()` começa com `if (!(await beforeGenerate())) { onFailed({ key: "error.notSaved" }); return; }`.
- Changes, em `App.tsx`: `const intent = useIntent()`; `<IntentBox />` entre `<IncomingFiles />` e `<PackPanel />`; `beforeGenerate={intent.flush}`.
- Changes, em `IncomingFiles.tsx`, só no tratador de `paste` (CA-2.12): quando `event.target instanceof HTMLTextAreaElement` — sem arquivos e sem pastas: não faz nada (o texto é da caixa); com arquivos ou pastas: `event.preventDefault()` e segue a regra de sempre. Fora de uma caixa de texto nada muda.
- Produces, em `e2e/support.ts`:

```ts
// Fires the paste event on one element, as when the cursor is inside it.
export async function pasteInto(target: Locator, files: FakeFile[], text?: string): Promise<void>;
```

  Igual ao `paste`, com `element.dispatchEvent(event)` no lugar de `document.body.dispatchEvent(event)`.

- [ ] **Step 1: Testes da fila que falham**

`src/web/pack/saver.test.ts` — `send` é um falso que guarda cada texto recebido e devolve uma promessa que o teste resolve à mão; `states` guarda cada chamada de `onState`:

```ts
test("ADR-0012 a pushed text is sent and reported as saving, then saved", ...);
// push("a") → sent = ["a"], states = ["saving"]; resolver true → states = ["saving", "saved"]

test("ADR-0012 never two sends at once, and only the latest text follows", ...);
// push("a"), push("ab"), push("abc") com o primeiro a caminho → sent = ["a"]
// resolver true → sent = ["a", "abc"]; resolver true → último estado "saved"; "ab" nunca foi enviado

test("ADR-0012 a failed send is reported and flush tries the same text again", ...);
// push("a"); resolver false → último estado "failed"
// flush() → sent = ["a", "a"]; resolver true → flush devolve true; último estado "saved"

test("ADR-0012 flush waits for the send in flight", ...);
// push("a"); const done = flush(); a promessa não resolveu ainda; resolver true → await done === true

test("ADR-0012 flush answers true when nothing was pushed", ...);

test("ADR-0012 going back to the confirmed text after a failure reports saved without sending", ...);
// push("a") ok; push("ab") falha → "failed"; push("a") → último estado "saved"; sent = ["a", "ab"]
```

Run: `pnpm test` → Expected: FALHAM (o arquivo não existe).

- [ ] **Step 2: Implementar `saver.ts`** com o código de Interfaces.

Run: `pnpm test` → Expected: PASS.

- [ ] **Step 3: Commit**

`git commit -m "feat: add the latest-wins save queue for autosaved text"`

- [ ] **Step 4: Testes de tela que falham**

`e2e/intent.spec.ts` (`status = page.getByRole("status")`):

```ts
const TEXT = "  # Painel de açaí 🍇\n\n* Para quem vende na feira.\n`rápido` & simples  \n";

test("CA-2.4 the intent box shows a hint and saves by itself", ...);
// intent tem placeholder "What it is, who it is for and what the person needs to be able to do."
// status tem texto ""; intent.fill("A dashboard") → status tem texto "Saved"
// língua "Português" → page.getByLabel("Intenção do projeto") visível, com placeholder
//   "O que é, para quem é e o que a pessoa precisa conseguir fazer."; status "Salvo"

test("CA-2.4 the box takes at most 10 000 characters", ...);
// await expect(intent).toHaveAttribute("maxlength", "10000")

test("CA-2.4 CA-2.5 the intent comes back exactly as typed after closing and opening again", ...);
// intent.fill(TEXT); status "Saved"; app.restart(); goto → await expect(intent).toHaveValue(TEXT)

test("CA-2.4 text typed key by key is saved whole and in order", ...);
// intent.pressSequentially("hello world"); status "Saved"; page.reload() → intent tem valor "hello world"

test("CA-2.6 CA-2.7 text typed right before generating is in the pack", ...);
// drop a.png; "Select all"; intent.fill(TEXT); clicar em "Generate pack" SEM esperar o "Saved"
// readFile(join(path, "INTENT.md"), "utf8") === TEXT; README.md contém "Read `INTENT.md`"

test("CA-2.7 with an empty intent the pack has no INTENT.md", ...);
// drop a.png; "Select all"; generate → readdir(path) não contém "INTENT.md"

test("CA-2.9 the intent is the same after generating", ...);
// como o CA-2.6; depois de gerar, intent tem valor TEXT; page.reload() → ainda TEXT

test("CA-2.11 text that cannot be saved stays in the box with a warning instead of Saved", ...);
// await page.route("**/api/draft/intent", (route) => route.abort("connectionrefused"))
// intent.fill("abc") → status tem texto "Could not save. Check that refpack is still running in the terminal."
// page.getByText("Saved", { exact: true }) tem count 0; intent tem valor "abc"

test("CA-2.12 text pasted into the intent box shows no notice", ...);
// pasteInto(intent, [], "hello"); depois paste(page, [], "x") no corpo da página
// → page.getByRole("alert").locator("li") tem count 1 (só o aviso do segundo colar)

test("CA-2.12 an image pasted into the intent box enters the library and the text stays", ...);
// intent.fill("abc"); status "Saved"; pasteInto(intent, [{ name: "image.png", content: "image/png" }])
// images tem 1; intent tem valor "abc"; page.getByRole("alert") tem count 0
```

Run: `pnpm test:e2e` → Expected: os testes novos FALHAM nos dois navegadores.

- [ ] **Step 5: Implementar** o resto de Interfaces, com os textos da Tarefa 5.

Run: `pnpm check` → Expected: PASS.

- [ ] **Step 6: Commit**

`git commit -m "feat: write the project intent on screen, saved automatically"`

---

### Task 6: Começar outro pacote

**Modelo:** Sonnet, esforço `medium`.
**Critérios:** CA-2.10.

**Files:**
- Create: `e2e/start-over.spec.ts`
- Modify: `src/web/pack/PackPanel.tsx`, `src/web/App.tsx`, `src/web/i18n/pt-BR.ts`, `src/web/i18n/en.ts`, `src/web/styles.css`

**Interfaces:**
- Consumes: `setAllSelected` de `src/web/api.ts` (Tarefa 2); `intent.change` e `intent.flush` (Tarefa 5). Nenhuma rota nova: limpar é "tirar todas da seleção" mais "salvar a intenção vazia".
- Changes, em `PackPanel.tsx`: novas props `canStartOver: boolean` e `onStartOver: () => void`; um botão `t("pack.startOver")`, depois do "Gerar pacote", desativado quando `!canStartOver`.
- Changes, em `App.tsx`:
  - `canStartOver` = há imagem selecionada **ou** `(intent.text ?? "") !== ""`.
  - `startOver()`, nesta ordem:
    1. `if (!window.confirm(t("pack.confirmStartOver"))) return;`
    2. `await setAllSelected(false)`. Falhou: `refuse({ key: "error.notSaved" })` e para aqui, sem mexer na intenção.
    3. Todas as imagens do estado ficam sem seleção.
    4. `intent.change("")` e `await intent.flush()`. Devolveu `false`: `refuse({ key: "error.notSaved" })`.

- [ ] **Step 1: Testes que falham**

`e2e/start-over.spec.ts` (a confirmação é o diálogo do navegador: registrar `page.once("dialog", ...)` **antes** do clique):

```ts
test("CA-2.10 start another pack is disabled while there is nothing to clear", ...);
// tela nova → botão "Start another pack" desativado
// drop a.png; clicar em a.png → ativado; clicar de novo → desativado; intent.fill("x") → ativado

test("CA-2.10 confirming clears the selection and the intent and keeps images and packs", ...);
// drop a.png, b.jpg; "Select all"; intent.fill("A dashboard"); generate → path
// dialog: guardar dialog.message() e accept(); clicar em "Start another pack"
// mensagem === "This clears the selection and erases the intent text. Continue?"
// "0 of 2 selected"; intent tem valor ""; images tem 2; existsSync(path) === true
// page.reload() → "0 of 2 selected"; intent tem valor ""

test("CA-2.10 cancelling the confirmation changes nothing", ...);
// língua "Português"; drop a.png; clicar em a.png; preencher a intenção com "Um painel"
// dialog: guardar a mensagem e dismiss(); clicar em "Começar outro pacote"
// mensagem === "Isto tira todas as imagens da seleção e apaga o texto da intenção. Continuar?"
// "1 de 1 selecionadas"; a intenção tem valor "Um painel"
```

Run: `pnpm test:e2e` → Expected: os testes novos FALHAM nos dois navegadores.

- [ ] **Step 2: Implementar** conforme Interfaces, com os textos da Tarefa 6.

Run: `pnpm check` → Expected: PASS.

- [ ] **Step 3: Commit**

`git commit -m "feat: start another pack, clearing the selection and the intent"`

- [ ] **Step 4: Conferência final da fatia — feita pelo condutor**

Run: `pnpm check` → PASS, saída guardada para o relatório.
Run: `gh pr checks` → os 4 jobs verdes.
Conferir que CA-2.1 a CA-2.12 têm teste com o identificador no nome: `grep -rhoE "CA-2\.[0-9]+" src e2e | sort -u`.

Só então: revisão da fatia (Opus, contexto limpo), conforme `docs/WORKFLOW.md`.

- [ ] **Step 5: Depois do "aprovado" do dono**

Em `ROADMAP.md`, a fatia 2 passa a `feita` e a fatia 3 a `próxima`. Commit: `docs: mark slice 2 as done`. Merge do pull request.

---

## Roteiro de teste manual do dono

O condutor deixa o branch pronto e avisa. Faça no **Firefox**, com a sua biblioteca de verdade (a que você já usou nas fatias 0 e 1).

1. Rode `pnpm start`.
   **Esperado:** as suas imagens continuam todas lá, nenhuma selecionada. Acima da grade aparece "0 de N selecionadas". O botão "Gerar pacote" está desativado, com a explicação de que é preciso selecionar pelo menos uma imagem. *(CA-0.6, CA-2.8)*
2. Clique em três imagens. Clique de novo em uma delas.
   **Esperado:** cada clique destaca a imagem e muda o contador; o segundo clique tira o destaque. Sobram duas selecionadas. *(CA-2.1)*
3. Clique numa imagem e arraste o mouse por cima das outras.
   **Esperado:** nenhuma imagem fica azul. *(CA-2.1)*
4. Clique em "Selecionar todas" e depois em "Limpar seleção". Depois selecione duas imagens de novo.
   **Esperado:** todas ficam selecionadas, depois nenhuma. *(CA-2.2)*
5. Cole um screenshot com Ctrl+V.
   **Esperado:** ele entra na grade sem estar selecionado; as duas que você tinha selecionado continuam. *(CA-2.3)*
6. Na caixa "Intenção do projeto", escreva duas ou três linhas sobre um projeto seu, com acentos e uma linha em branco no meio.
   **Esperado:** a caixa vazia mostrava uma dica com os três pontos; depois de escrever, aparece "Salvo". *(CA-2.4)*
7. Copie um parágrafo de qualquer lugar e cole dentro da caixa da intenção.
   **Esperado:** o texto entra na caixa e **não** aparece o aviso "Não havia imagem para colar." *(CA-2.12)*
8. Feche a aba, pare o refpack no terminal (Ctrl+C) e rode `pnpm start` de novo.
   **Esperado:** as mesmas duas imagens selecionadas e o mesmo texto na caixa. *(CA-2.5)*
9. Clique em "Gerar pacote", copie o caminho e abra a pasta.
   **Esperado:** `refs` tem só as duas imagens selecionadas, `01` e `02`; existe um arquivo `INTENT.md` com o seu texto, igual ao que você digitou. Na tela, a seleção e a intenção continuam como estavam. *(CA-2.6, CA-2.7, CA-2.9)*
10. No Claude Code, diga "leia a pasta" e cole o caminho.
    **Esperado:** ele diz qual é a intenção do projeto e que há duas referências. *(CA-2.7)*
11. Clique em "Começar outro pacote" e, na pergunta, cancele. Clique de novo e confirme.
    **Esperado:** ao cancelar, nada muda. Ao confirmar, nenhuma imagem selecionada e a caixa vazia; as imagens continuam na biblioteca e a pasta do passo 9 continua existindo. *(CA-2.10)*
12. Selecione uma imagem e gere um pacote sem escrever nada na intenção. Abra a pasta.
    **Esperado:** não existe `INTENT.md`. *(CA-2.7)*
13. Pare o refpack no terminal (Ctrl+C) e **deixe a aba aberta**. Clique numa imagem e escreva algo na caixa da intenção.
    **Esperado:** um aviso de que não foi possível salvar; a imagem não fica selecionada; o que você escreveu continua na caixa, sem o "Salvo". *(CA-2.11)*

Responda "aprovado" ou diga em qual passo o resultado foi diferente do esperado.
