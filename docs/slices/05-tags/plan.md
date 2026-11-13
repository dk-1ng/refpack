# Fatia 5 — Etiquetas: plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task, with the overrides in `docs/WORKFLOW.md`. Steps use checkbox (`- [ ]`) syntax for tracking.

**Objetivo:** o dono coloca etiquetas numa imagem aberta, reaproveitando as que já usou, filtra a grade por uma etiqueta, e as etiquetas de cada referência saem no `README.md` do pacote.

**Arquitetura:** as etiquetas ficam em duas tabelas novas (`tags` e `image_tags`) e chegam à tela junto com a lista de imagens (ADR-0017). A tela deriva dessa lista as etiquetas da biblioteca, em ordem alfabética, e as usa nas sugestões e no filtro. Colocar e tirar uma etiqueta são pedidos próprios, e a tela só mostra a mudança confirmada pelo servidor (ADR-0012). O filtro é estado da tela; "Selecionar todas" e "Limpar seleção" com filtro mandam a etiqueta ao servidor. O pacote escreve as etiquetas na linha da referência.

**Stack:** a das fatias 0 a 4, sem dependência nova.

**Spec:** `SPEC.md`, seção 11 (critérios CA-5.1 a CA-5.13). ADRs 0004, 0007, 0008, 0010, 0012 e 0017.

## Para o dono: o que esta fatia entrega

| Tarefa | O que passa a existir | Critérios |
| --- | --- | --- |
| 1. Etiquetas no servidor | A biblioteca guarda etiquetas; selecionar todas por etiqueta. Nada muda na tela ainda. | base de CA-5.1, 5.2, 5.4, 5.7, 5.10, 5.12 |
| 2. Etiquetas no pacote | A linha de cada referência no `README.md` traz as etiquetas dela. Nada muda na tela ainda. | CA-5.11 |
| 3. Etiquetar na imagem aberta | A seção "Etiquetas" com a lista, a caixa, as sugestões e o "Remover"; as etiquetas na grade. | CA-5.1 a 5.5, 5.10, 5.12, 5.13 |
| 4. Filtrar a grade | "Filtrar por etiqueta", a frase "Mostrando N de M imagens", selecionar e navegar com o filtro ligado. | CA-5.6 a 5.10, 5.12 |

O roteiro do seu teste manual, no Firefox, está no fim deste arquivo.

**O que os testes automáticos não cobrem:** a aparência das etiquetas na grade e na imagem aberta, e a leitura do pacote pelo Claude Code (CA-5.11). Esses pontos ficam para o seu teste manual.

## Global Constraints

- Nenhuma dependência nova. O esquema do banco é exatamente o da migração `006` deste plano.
- Só existem os arquivos listados em "Estrutura de arquivos". Precisou de outro: pare e reporte.
- Toda rota nova valida a entrada com zod (ADR-0007, item 3) e fica atrás do `localOnly` que já existe.
- O nome da etiqueta nunca é alterado além do `trim()` das pontas, feito **uma vez, no zod da rota** (ADR-0017, item 5). Nada de normalizar acentos, trocar maiúsculas ou juntar espaços internos. A chave de comparação é `name.toLowerCase()`, só para comparar; o que se guarda e se mostra é `name`.
- Limites: `MAX_TAG_LENGTH = 60` (o mesmo valor no `maxLength` da caixa e no zod do servidor).
- A tela só mostra o que o servidor confirmou (ADR-0012): uma etiqueta colocada ou tirada, as sugestões, as etiquetas da grade e a seleção só mudam depois da resposta do servidor.
- Nenhum temporizador. Nenhum `waitForTimeout` nos testes.
- Todo texto visível vem dos dicionários `pt-BR` e `en`, com exatamente os textos da tabela "Textos novos". O texto do dono é sempre exibido como texto (ADR-0007, item 6).
- O código do produto não tem ramo por navegador nem por sistema operacional (ADR-0010, R11). A ordem alfabética usa `new Intl.Collator("en")` nos dois lados. Um teste que só passa com tratamento especial: pare e reporte.
- Nenhum arquivo de imagem é commitado. Os testes fabricam as imagens.
- Todo teste que cobre um critério traz o identificador no nome, por exemplo `"CA-5.6 ..."`.
- Testes das fatias 0 a 4 só mudam onde este plano diz. Outro teste antigo quebrou: pare e reporte.
- Commits em inglês, Conventional Commits, um por passo de commit do plano.
- Ao fim de cada tarefa o condutor envia o branch e espera o CI verde antes de começar a próxima.

## Textos novos

| Chave | `pt-BR` | `en` | Tarefa |
| --- | --- | --- | --- |
| `tag.listLabel` | Etiquetas desta imagem | Tags on this image | 3 |
| `tag.newLabel` | Nova etiqueta | New tag | 3 |
| `tag.placeholder` | Etiqueta (Enter para adicionar) | Tag (Enter to add) | 3 |
| `tag.add` | Adicionar | Add | 3 |
| `tag.remove` | Remover etiqueta {name} | Remove tag {name} | 3 |
| `tag.suggestions` | Sugestões | Suggestions | 3 |
| `filter.label` | Filtrar por etiqueta | Filter by tag | 4 |
| `filter.all` | Todas as imagens | All images | 4 |
| `filter.showing` | Mostrando {shown} de {total} imagens | Showing {shown} of {total} images | 4 |

O aviso de que não foi possível salvar reutiliza a chave `error.notSaved`, que já existe.

## Review Focus

Condições que o dono pode causar em uso normal. Todas têm critério no SPEC; cada uma tem seu teste na tarefa indicada.

1. Abrir a biblioteca que ele já tem, criada nas fatias 0 a 4 → imagens, notas, marcações, seleção e intenção continuam iguais, e nenhuma imagem tem etiqueta; CA-5.10 (Tarefa 1).
2. Etiqueta com aspas, barra, acento e emoji (`Dashboard "escuro" \ ✨`) → a linha do `README.md` traz o nome inteiro, entre aspas, numa linha só, e a tela mostra o nome como foi escrito; CA-5.1 e CA-5.11 (Tarefas 2 e 3).
3. Escrever uma etiqueta que a imagem já tem, mudando só maiúsculas → nada muda, a caixa esvazia, nenhum pedido vai ao servidor; CA-5.2 (Tarefa 3).
4. "Selecionar todas" com o filtro ligado e depois "Gerar pacote" → as imagens selecionadas antes do filtro, mesmo escondidas, estão no pacote; CA-5.7 (Tarefa 4).
5. Tirar da imagem aberta a etiqueta do filtro e fechar → a imagem continua aberta até fechar; depois, a grade não a mostra; se era a última com a etiqueta, a grade volta a mostrar todas; CA-5.6 e CA-5.8 (Tarefa 4).
6. Uma etiqueta de 60 caracteres entra; a caixa não deixa escrever o 61º; o servidor recusa 61 (CA-5.1, Tarefas 1 e 3).

## Estrutura de arquivos

```
src/server/migrations/006-tags.sql         novo: tabelas tags e image_tags
src/server/tags.ts  tags.test.ts           novos: colocar, tirar e listar etiquetas
src/server/draft.ts  draft.test.ts         modificados: setAllSelected com etiqueta
src/server/app.ts  app.test.ts             modificados: rotas das etiquetas; a imagem traz tags; seleção por etiqueta
src/server/pack.ts  pack.test.ts           modificados: etiquetas na linha da referência e o parágrafo
src/shared/api.ts                          modificado: schemas e limite das etiquetas
src/web/api.ts                             modificado: addTag, removeTag, setAllSelected com etiqueta
src/web/App.tsx                            modificado: tags no estado, filtro, imagens mostradas, vizinhas
src/web/library/ImageGrid.tsx              modificado: etiquetas de cada imagem
src/web/note/ImageViewer.tsx               modificado: TagPanel
src/web/tags/tags.ts  tags.test.ts         novos: funções puras: etiquetas da biblioteca, sugestões, mesma etiqueta
src/web/tags/TagPanel.tsx                  novo: a seção "Etiquetas" da imagem aberta
src/web/tags/TagFilter.tsx                 novo (Tarefa 4): o filtro da grade
src/web/i18n/pt-BR.ts  en.ts               modificados: textos novos
src/web/styles.css                         modificado
e2e/tags.spec.ts                           novo (Tarefa 3): etiquetar
e2e/filter.spec.ts                         novo (Tarefa 4): filtrar
e2e/start-over.spec.ts                     modificado (Tarefa 3): CA-5.12
```

Nos testes de ponta a ponta, as imagens entram por `drop(page, [...])` de `e2e/support.ts` (`a` = `a.png`, `b` = `b.jpg`, `c` = `c.webp`; a grade mostra a mais recente primeiro: `drop(page, [a, b, c])` dá a grade `c.webp, b.jpg, a.png`). Localizadores e ajudas comuns a `e2e/tags.spec.ts` e `e2e/filter.spec.ts` (cada arquivo declara os seus):

```ts
const item = (page: Page, name: string) =>
  page.getByRole("listitem").filter({ has: page.getByAltText(name) });
const images = (page: Page) => page.getByRole("list").getByRole("img");
const gridAlts = (page: Page) =>
  images(page).evaluateAll((imgs) => imgs.map((i) => i.getAttribute("alt") ?? ""));
const viewer = (page: Page) => page.getByRole("dialog");
const tagList = (page: Page) => viewer(page).getByRole("list", { name: "Tags on this image" });
const tagNames = (page: Page) => tagList(page).locator("li > span"); // one per tag, in order
const tagInput = (page: Page) => viewer(page).getByLabel("New tag");
const addButton = (page: Page) => viewer(page).getByRole("button", { name: "Add", exact: true });
const removeButton = (page: Page, name: string) =>
  viewer(page).getByRole("button", { name: `Remove tag ${name}`, exact: true });
const suggestions = (page: Page) =>
  viewer(page).getByRole("list", { name: "Suggestions" }).getByRole("button");
const tagsAlert = (page: Page) => viewer(page).locator(".tags").getByRole("alert");
const chips = (page: Page, name: string) => item(page, name).locator(".tag-chip"); // grid tags
const filter = (page: Page) => page.getByLabel("Filter by tag");

// Clicks "Annotate" on the image and waits for the dialog.
async function open(page: Page, name: string): Promise<void>;
// Types the tag in the box, presses Enter and waits for it in the list of the open image.
async function addTag(page: Page, name: string): Promise<void>;
// Opens the image, adds each tag, closes the image.
async function tagImage(page: Page, image: string, names: string[]): Promise<void>;
```

Com a imagem aberta, o que está por baixo do diálogo não responde: os testes fecham a imagem antes de mexer na grade, no filtro ou no seletor de língua (ADR-0014).

---

### Task 1: A biblioteca guarda etiquetas (servidor)

**Modelo:** Sonnet, esforço `medium`.
**Critérios:** base de CA-5.1, CA-5.2, CA-5.4, CA-5.7, CA-5.10, CA-5.12; ADR-0017, itens 1 a 8.

**Files:**
- Create: `src/server/migrations/006-tags.sql`, `src/server/tags.ts`, `src/server/tags.test.ts`
- Modify: `src/server/draft.ts`, `src/server/draft.test.ts`, `src/server/app.ts`, `src/server/app.test.ts`, `src/shared/api.ts`

Antes do Step 1, o condutor confere que está no branch `slice/05-tags` (criado pelo arquiteto ao aprovar o plano).

**Interfaces:**
- Migração `006-tags.sql`, exatamente:

```sql
CREATE TABLE tags (
  seq INTEGER PRIMARY KEY AUTOINCREMENT,
  id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  key TEXT NOT NULL UNIQUE
) STRICT;
CREATE TABLE image_tags (
  seq INTEGER PRIMARY KEY AUTOINCREMENT,
  image_id TEXT NOT NULL REFERENCES images (id),
  tag_id TEXT NOT NULL REFERENCES tags (id),
  UNIQUE (image_id, tag_id)
) STRICT;
```

- Produces, em `src/shared/api.ts`:

```ts
export const MAX_TAG_LENGTH = 60;
export const TagSchema = z.object({ id: z.uuid(), name: z.string() });
// The body of POST /api/images/:id/tags. Spaces at both ends are not part of the tag.
export const TagBodySchema = z.object({ name: z.string().trim().min(1).max(MAX_TAG_LENGTH) });
// The body of PUT /api/draft/selection: every image, or only those with the tag.
export const SelectionBodySchema = z.object({ selected: z.boolean(), tagId: z.uuid().optional() });
export type Tag = z.infer<typeof TagSchema>;
```

  `ImageSchema` ganha `tags: z.array(TagSchema)`, na ordem em que foram colocadas. `SelectedBodySchema` continua como está, para `PUT /api/images/:id/selected`.

- Produces, em `src/server/tags.ts`:

```ts
export type StoredTag = { id: string; name: string };
export type AddTagResult =
  | { ok: true; tag: StoredTag; linked: boolean } // linked: false when the image already had it
  | { ok: false; code: "not-found" };

// The key two names are compared by: the name in lower case (ADR-0017, item 2).
export function tagKey(name: string): string;
// Puts the tag on the image. Reuses the tag whose key matches, keeping its stored name; creates
// one with `name`, stored exactly as given, when none matches. "not-found": no image has this id.
export function addTag(library: Library, imageId: string, name: string): AddTagResult;
// Takes the tag off the image and deletes the tag once no image has it. False when the image,
// the tag, or the link does not exist; nothing changes then.
export function removeTag(library: Library, imageId: string, tagId: string): boolean;
// Every image's tags, in the order they were put on. Images without tags have no entry.
export function listTags(library: Library): Map<string, StoredTag[]>;
```

  As linhas lidas do banco são conferidas com zod, como em `marks.ts`.

- Changes, em `src/server/draft.ts`:

```ts
// Selects or unselects every image, or only the images with the tag when `tagId` is given.
// False only when `tagId` is given and no tag has that id; nothing changes then.
export function setAllSelected(library: Library, selected: boolean, tagId?: string): boolean;
```

- Changes, em `src/server/app.ts`:
  - `toImage(image, marks, tags)` passa a incluir `tags` (cada uma `{ id, name }`); `GET /api/images` usa `listTags` uma vez; a resposta de `POST /api/images` traz `tags: []`.
  - `POST /api/images/:id/tags` com `TagBodySchema`: `bodyLimit` de `MAX_TEXT_REQUEST_BYTES` → `413 too-large`; corpo que não é JSON ou não passa no schema → `400 invalid-request`; imagem desconhecida ou id malformado → `404 not-found`; colocou → `201` com a etiqueta (`TagSchema`); a imagem já tinha → `200` com a etiqueta.
  - `DELETE /api/images/:id/tags/:tagId` → `204`; imagem, etiqueta ou ligação desconhecida, ou id malformado → `404 not-found`.
  - `PUT /api/draft/selection` passa a ler `SelectionBodySchema`: corpo inválido → `400 invalid-request`; `tagId` que nenhuma etiqueta tem → `404 not-found`; senão `setAllSelected(library, selected, tagId)` → `204`.

- [ ] **Step 1: Testes que falham**

Nos arquivos de teste: `const UNKNOWN = "3f2b8a52-6c1e-4b0f-9a4d-1d2c3b4a5e6f";` e `const FANCY = 'Dashboard "escuro" \\ ✨';`.

`src/server/tags.test.ts` (com `open`, `imageIn` e o `afterEach` no desenho de `marks.test.ts`):

```ts
test("CA-5.10 a library created before slice 5 opens with no tags and keeps notes, marks, selection and intent", ...);
// banco antigo montado à mão, como o teste "created before slice 4" de marks.test.ts:
//   aplicar 001 a 005, user_version = 5; uma imagem com selected = 1 e note = 'antiga'; uma marcação
//   dela (kind 'like', área 0.1/0.2/0.4/0.9, comment 'c'); intent = 'velha'
// abrir → listTags(library).size === 0; listImages = [{ ...a mesma imagem, selected: true, note: "antiga" }];
//   listMarks(library).get(id) tem 1 marcação com comment "c"; getIntent = "velha"

test("CA-5.1 addTag puts a new tag on the image and lists each image's tags in the order they were put", ...);
// a.png e b.jpg; t1 = addTag(a.id, "dashboard"); t2 = addTag(a.id, FANCY)
// t1 = { ok: true, linked: true, tag: { id: (uuid), name: "dashboard" } }; t2.tag.name === FANCY
// listTags(library).get(a.id) = [t1.tag, t2.tag]; listTags(library).has(b.id) === false

test("CA-5.2 addTag reuses a tag that differs only by case and keeps the first spelling", ...);
// t1 = addTag(a.id, "Dashboard"); t2 = addTag(b.id, "dashboard"); t3 = addTag(b.id, "DASHBOARD")
// t2 = { ok: true, linked: true, tag: t1.tag }; t3 = { ok: true, linked: false, tag: t1.tag }
// listTags.get(a.id) = [t1.tag]; listTags.get(b.id) = [t1.tag]
// addTag(a.id, "Ícone") e addTag(b.id, "ícone") → a mesma etiqueta "Ícone"
// addTag(a.id, "icone") → outra etiqueta, name "icone" (acento conta)

test("addTag stores the name exactly as given and answers not-found for an unknown image", ...);
// addTag(a.id, "  dois  espaços  ") → tag.name === "  dois  espaços  " (quem tira as pontas é a rota)
// addTag(UNKNOWN, "x") → { ok: false, code: "not-found" }; listTags não tem UNKNOWN

test("CA-5.4 removeTag takes the tag off the image and deletes the tag once no image has it", ...);
// t = addTag(a.id, "x"); addTag(b.id, "x"); addTag(a.id, "y"); setNote(a.id, "nota"); setSelected(a.id, true)
// removeTag(a.id, t.tag.id) → true; listTags.get(a.id) = [y]; listTags.get(b.id) = [t.tag]
// removeTag(b.id, t.tag.id) → true; listTags.has(b.id) === false
// addTag(b.id, "X") → tag.id !== t.tag.id e name "X" (a antiga foi apagada)
// findImage(a.id) → note "nota", selected true

test("removeTag answers false for an unknown image, an unknown tag, or a tag the image does not have", ...);
// t em a; removeTag(UNKNOWN, t.id), removeTag(a.id, UNKNOWN), removeTag(b.id, t.id) → false; nada mudou

test("CA-5.10 the tags are still there after closing and reopening the library", ...);
// duas etiquetas em a, uma em b; closeLibrary; openLibrary(mesma raiz) → listTags igual a antes

test("CA-5.12 clearing the selection keeps every tag", ...);
// uma etiqueta em a; setSelected(a.id, true); setAllSelected(library, false) → listTags igual a antes
```

`src/server/draft.test.ts`:

```ts
test("CA-5.7 setAllSelected with a tag changes only the images that have it, and answers false for an unknown tag", ...);
// a, b, c; t = addTag(a.id, "ui"); addTag(c.id, "ui"); setSelected(b.id, true)
// setAllSelected(library, true, t.tag.id) → true; selected: a true, b true, c true
// setAllSelected(library, false, t.tag.id) → true; selected: a false, b true, c false
// setAllSelected(library, true, UNKNOWN) → false; nada mudou
// setAllSelected(library, false) → true; todas false
```

`src/server/app.test.ts` (`tagsOf = (id) => "/api/images/" + id + "/tags"`; corpos JSON com header `content-type: application/json`):

```ts
test("CA-5.1 POST /api/images/:id/tags puts the tag on the image and GET /api/images returns it", ...);
// upload → a imagem devolvida tem tags = []
// POST tagsOf(id) { name: FANCY } → 201; corpo passa no TagSchema e tem name FANCY
// GET /api/images → images[0].tags = [essa etiqueta]

test("CA-5.2 POST /api/images/:id/tags drops the spaces at the ends, reuses a tag by case, and answers 200 when the image already has it", ...);
// duas imagens; POST em a { name: "  dashboard " } → 201, name "dashboard"
// POST em b { name: "Dashboard" } → 201, o mesmo id e name "dashboard"
// POST em b { name: "DASHBOARD" } → 200, o mesmo corpo
// GET → a.tags e b.tags têm 1 etiqueta cada, a mesma

test("POST /api/images/:id/tags answers 400 for a wrong body, 404 for an unknown or malformed image, and 413 above 128 KiB", ...);
// "{}", '{"name":""}', '{"name":"   "}', '{"name":5}', "not json", { name: "x".repeat(61) } → 400
// { name: "x".repeat(60) } → 201; { name: " " + "x".repeat(60) + " " } → 201 (60 depois do trim)
// UNKNOWN e "not-a-uuid" com corpo válido → 404 not-found
// corpo "x".repeat(128 * 1024 + 1) → 413 too-large

test("CA-5.4 DELETE /api/images/:id/tags/:tagId takes the tag off the image", ...);
// POST → tag; DELETE tagsOf(id) + "/" + tag.id → 204; GET → tags = []; DELETE de novo → 404
// DELETE com imagem UNKNOWN e com tagId "not-a-uuid" → 404 not-found

test("CA-5.7 PUT /api/draft/selection with a tagId selects only the images with that tag", ...);
// a, b, c; etiqueta "ui" em a e c (POST); PUT { selected: true, tagId } → 204
// GET → selected: a true, b false, c true
// PUT { selected: false, tagId } → 204 → todas false
// PUT { selected: true, tagId: UNKNOWN } → 404 not-found; PUT { selected: true, tagId: "x" } → 400
// PUT { selected: true } → 204 → todas true (como antes)

test("CA-0.11 the tag routes are behind the local-only guard", ...);
// POST tags e DELETE tags com host "evil.example" → 403
```

Nos testes antigos que comparam uma imagem inteira da API com `toEqual`, acrescente `tags: []` ao esperado; nada mais muda neles.

Run: `pnpm test` → Expected: os testes novos FALHAM; os antigos passam.

- [ ] **Step 2: Implementar** conforme Interfaces.

Run: `pnpm check` → Expected: PASS. A tela não mudou.

- [ ] **Step 3: Commit**

`git commit -m "feat: store tags on images and select all images with a tag"`

---

### Task 2: As etiquetas saem no pacote (servidor)

**Modelo:** Sonnet, esforço `medium`.
**Critérios:** CA-5.11; ADR-0017, item 9.

**Files:**
- Modify: `src/server/pack.ts`, `src/server/pack.test.ts`

**Interfaces:**
- Consumes: `listTags`, `addTag` (Tarefa 1).
- Changes, em `src/server/pack.ts` — a assinatura de `createPack` não muda:
  - Na linha de cada referência, depois do trecho da nota (quando existe) e antes das linhas das marcações: `` — tags: "a", "b" ``, com cada nome passado por `JSON.stringify`, separados por `, `, na ordem em que foram colocados. Sem etiqueta, nada é acrescentado à linha.
  - Se alguma imagem do pacote tem etiqueta, o `README.md` ganha um parágrafo, depois do parágrafo das marcações (quando existe) e antes de `- Created:`, separado por uma linha em branco, com exatamente este texto:

    ``Some references have tags: short labels the owner put on the image, listed after `tags:` on its line below, each in double quotes. They are in the owner's own words and may be in a language other than English. References that share a tag have that kind or quality in common.``

  - Sem nenhuma etiqueta entre as imagens selecionadas, o pacote sai byte a byte como hoje.

- [ ] **Step 1: Testes que falham**

`src/server/pack.test.ts` (`TAGS_LINE` = o parágrafo acima; `FANCY` como na Tarefa 1; grade de `fillLibrary`: `c.webp`, `b.jpg`, `a.png`; `[c, b, a] = listImages(library)`):

```ts
test("CA-5.11 the README lists each selected image's tags, in order and exactly as written, with its note and marks", ...);
// fillLibrary; setAllSelected(true); setIntent(INTENT); setNote(b.id, NOTE)
// addTag(b.id, FANCY); addTag(b.id, "tabela"); addTag(a.id, "ícone ✨")
// addMark(b.id, { kind: "like", area: { left: 0.1, top: 0.2, right: 0.4, bottom: 0.9 }, crop: PNG_BYTES })
// README.md é exatamente: [..., "", INTENT_LINE, "", NOTES_LINE, "", MARKS_LINE, "", TAGS_LINE, "",
//   "- Created: 2026-11-09 14:05:09", "- References: 3", "", "## References", "",
//   "1. `refs/01.webp`",
//   '2. `refs/02.jpg` — note: `notes/02.md` — tags: "Dashboard \\"escuro\\" \\\\ ✨", "tabela"',
//   "   - Mark 1 (like): `marks/02-1.png` — area: x 10%–40%, y 20%–90%",
//   '3. `refs/03.png` — tags: "ícone ✨"', ""].join("\n")
// (a linha 2 tem, no arquivo, a aspa e a barra escapadas como JSON.stringify(FANCY) as escreve)

test("CA-5.11 tags of unselected images stay out, and without tags the README does not mention them", ...);
// fillLibrary; setSelected(a.id, true) só; addTag(b.id, "x")
// README não contém "tag"; é igual ao expectedReadme de uma imagem selecionada sem etiqueta
```

O teste `CA-0.9 CA-2.9 generating a pack leaves the library unchanged` ganha uma etiqueta em `b` antes de gerar, e compara `listTags(library)` de antes e de depois.

Run: `pnpm test` → Expected: os testes novos FALHAM; os antigos passam.

- [ ] **Step 2: Implementar** conforme Interfaces.

Run: `pnpm check` → Expected: PASS. A tela não mudou.

- [ ] **Step 3: Commit**

`git commit -m "feat: list each reference's tags in the pack README"`

---

### Task 3: Etiquetar na imagem aberta (tela)

**Modelo:** Sonnet, esforço `medium`.
**Critérios:** CA-5.1, CA-5.2, CA-5.3, CA-5.4, CA-5.5, CA-5.10, CA-5.12, CA-5.13; ADR-0017, itens 6 e 7.

**Files:**
- Create: `src/web/tags/tags.ts`, `src/web/tags/tags.test.ts`, `src/web/tags/TagPanel.tsx`, `e2e/tags.spec.ts`
- Modify: `src/web/api.ts`, `src/web/App.tsx`, `src/web/library/ImageGrid.tsx`, `src/web/note/ImageViewer.tsx`, `src/web/i18n/pt-BR.ts`, `src/web/i18n/en.ts`, `src/web/styles.css`, `e2e/start-over.spec.ts`

**Interfaces:**
- Consumes: as rotas `POST /api/images/:id/tags` e `DELETE /api/images/:id/tags/:tagId`, `Tag`, `TagSchema`, `MAX_TAG_LENGTH` (Tarefa 1).
- Produces, em `src/web/tags/tags.ts` (funções puras, sem DOM):

```ts
// Every tag any image has, once each, sorted by name with new Intl.Collator("en").
export function libraryTags(images: Image[]): Tag[];
// True when the two names are the same tag: equal after toLowerCase().
export function sameTag(a: string, b: string): boolean;
// The tags of `all` the image does not have whose name contains `typed` (trimmed, case
// ignored). `all` is already sorted; the order is kept. Empty `typed` keeps every candidate.
export function suggest(all: Tag[], own: Tag[], typed: string): Tag[];
```

- Produces, em `src/web/api.ts` — nunca lançam:

```ts
// The tag the server stored (its name may differ in case from `name`). null with any status
// that is not 2xx, an answer that is not a tag, or a network error.
export async function addTag(imageId: string, name: string): Promise<Tag | null>;
// True with a 2xx answer.
export async function removeTag(imageId: string, tagId: string): Promise<boolean>;
```

- Produces, em `src/web/tags/TagPanel.tsx`:

```ts
export function TagPanel(props: {
  tags: Tag[]; // the open image's tags, in order
  all: Tag[]; // the library's tags, sorted (libraryTags)
  onAdd: (name: string) => Promise<boolean>; // false when it could not be saved
  onRemove: (tagId: string) => Promise<boolean>;
});
```

  Desenha `<div className="tags">` com, nesta ordem:
  - se há etiquetas, `<ul className="tag-list" aria-label={t("tag.listLabel")}>` com um `<li>` por etiqueta: `<span>{tag.name}</span>` e `<button type="button" aria-label={t("tag.remove", { name })} title={...o mesmo...}>×</button>`;
  - `<form className="tag-form" onSubmit={...}>` com `<input type="text" aria-label={t("tag.newLabel")} placeholder={t("tag.placeholder")} maxLength={MAX_TAG_LENGTH} value={text} />` e `<button type="submit">{t("tag.add")}</button>`; o `onSubmit` faz `preventDefault()` e chama `add(text)`;
  - se a última mudança falhou, `<p role="alert">{t("error.notSaved")}</p>`;
  - se `suggest(all, tags, text)` não está vazio, `<ul className="tag-suggestions" aria-label={t("tag.suggestions")}>` com um `<li>` por sugestão contendo `<button type="button" onClick={() => add(tag.name)}>{tag.name}</button>`.
  - `add(name)`: `trimmed = name.trim()`; vazio → nada. Se `tags.some((tag) => sameTag(tag.name, trimmed))` → só limpa a caixa (nenhum pedido). Senão, com um `ref` que ignora um segundo pedido enquanto o primeiro está a caminho: `await onAdd(trimmed)`; `true` → limpa a caixa e `failed = false`; `false` → o texto fica e `failed = true`. Nos dois casos o cursor volta para a caixa (`inputRef.current?.focus()`).
  - `remove(tagId)`: `await onRemove(tagId)`; `failed = !ok`.

- Changes, em `ImageViewer.tsx`:
  - Novas props `allTags: Tag[]` e `onTags: (id: string, change: (tags: Tag[]) => Tag[]) => void`.
  - `<TagPanel>` fica em `viewer-side`, entre o `status` da nota e o `<MarkPanel>`.
  - `onAdd(name)`: `tag = await addTag(image.id, name)`; `null` → `false`; senão `onTags(image.id, (tags) => tags.some((t) => t.id === tag.id) ? tags : [...tags, tag])` e `true`.
  - `onRemove(tagId)`: `await removeTag(image.id, tagId)` → `true`: `onTags(image.id, (tags) => tags.filter((t) => t.id !== tagId))`.
  - O cursor continua começando na caixa da nota (CA-3.1). Sair da imagem não espera nada das etiquetas: não há texto pendente (o que está na caixa e não foi adicionado é descartado, como o retângulo sem tipo).
- Changes, em `App.tsx`: `tagsChanged(id, change)` no desenho de `marksChanged`; `const allTags = useMemo(() => libraryTags(images ?? []), [images])`; `<ImageViewer ... allTags={allTags} onTags={tagsChanged} />`.
- Changes, em `ImageGrid.tsx`: depois do botão "Anotar", se `image.tags.length > 0`: `<p className="image-tags">` com um `<span className="tag-chip">{tag.name}</span>` por etiqueta, na ordem.
- `styles.css`: `.tag-list` e `.tag-suggestions` sem marcadores, em linha, com espaço entre os itens; `.tag-chip` em letra pequena com fundo cinza claro; `.tag-form` com a caixa e o botão na mesma linha; `.tags p[role="alert"]` em vermelho como o das marcações. A seção `.tags` não cresce além do conteúdo (`flex: 0 0 auto`); `.marks` continua rolando por dentro.
- Dicionários: os seis textos da Tarefa 3 na tabela "Textos novos".

- [ ] **Step 1: Testes que falham**

`src/web/tags/tags.test.ts` (`tag = (id, name) => ({ id, name })`, ids `"1"`, `"2"`…; `img = (tags) => ({ id, originalName, url, selected: false, note: "", marks: [], tags })`):

```ts
test("CA-5.3 libraryTags lists each tag once, in alphabetical order", ...);
// imagens com tags [zebra(1), dashboard(2)], [dashboard(2), Ícone(3)], [] e [abacaxi(4)]
// → [abacaxi, dashboard, Ícone, zebra]

test("CA-5.2 sameTag ignores case only", ...);
// ("Dashboard", "dashboard") true; ("DASHBOARD", "dashboard") true; ("ícone", "Ícone") true
// ("icone", "ícone") false; ("dash board", "dashboard") false

test("CA-5.3 suggest leaves out the image's own tags and narrows by the typed text, keeping the order", ...);
// all = [abacaxi, dashboard, Ícone, tabela]; own = [dashboard]
// suggest(all, own, "") → [abacaxi, Ícone, tabela]
// suggest(all, own, " TAB ") → [tabela]; suggest(all, own, "a") → [abacaxi, tabela]
// suggest(all, own, "dash") → []; suggest(all, own, "ícone") → [Ícone]
```

`e2e/tags.spec.ts`, com os localizadores e as ajudas da seção "Estrutura de arquivos" (`FANCY` como na Tarefa 1):

```ts
test("CA-5.1 the open image shows its tags and a box that adds one on Enter or with the Add button", ...);
// drop a; open a → tagList count 0; tagInput visível, placeholder "Tag (Enter to add)", maxlength "60";
//   addButton visível; a caixa da nota (getByLabel("Note on this image")) está focada
// tagInput.fill("dashboard"); press Enter → tagNames toHaveText(["dashboard"]); tagInput valor ""; tagInput focada
// tagInput.fill("tabela"); addButton.click() → tagNames ["dashboard", "tabela"]; valor ""; tagInput focada
// removeButton("dashboard") e removeButton("tabela") visíveis

test("CA-5.1 an empty or blank tag adds nothing and sends nothing", ...);
// contar, com page.on("request"), os POST cujo endereço passa em /\/api\/images\/[^/]+\/tags$/
// drop a; open; press Enter na caixa vazia; fill("   "); Enter; addButton.click()
// → tagList count 0; nenhum POST

test("CA-5.1 CA-5.10 spaces at the ends are dropped, the rest is kept exactly, and the tags come back after restart", ...);
// drop a; open; fill("  " + FANCY + "  "); Enter → tagNames [FANCY]; addTag(page, "tabela"); close
// chips(a) toHaveText([FANCY, "tabela"])
// app.restart(); goto → chips(a) iguais; open a → tagNames [FANCY, "tabela"]

test("CA-5.2 a tag that differs only by case is the same tag, shown as first written, and adding one the image has changes nothing", ...);
// drop a, b; tagImage(a, ["Dashboard"]); open b; addTag(page, "dashboard") → tagNames ["Dashboard"]
// contar POST .../tags; fill("DASHBOARD"); Enter → tagNames ["Dashboard"]; valor ""; nenhum POST novo
// close → chips(a) ["Dashboard"]; chips(b) ["Dashboard"]

test("CA-5.3 the suggestions list the library's other tags alphabetically, narrow as I type, and add on click", ...);
// drop a, b; tagImage(a, ["zebra", "Ícone", "abacaxi", "dashboard"]); open b
// suggestions toHaveText(["abacaxi", "dashboard", "Ícone", "zebra"])
// tagInput.fill("DASH") → suggestions ["dashboard"]; clicar → tagNames ["dashboard"]; valor "";
//   suggestions ["abacaxi", "Ícone", "zebra"]; tagInput focada
// tagInput.fill("a") → suggestions ["abacaxi", "zebra"]
// clicar "zebra"; clicar "abacaxi"; fill(""); clicar "Ícone" → tagNames ["dashboard", "zebra", "abacaxi", "Ícone"]
// viewer.getByRole("list", { name: "Suggestions" }) count 0

test("CA-5.3 without tags to suggest the list is not there", ...);
// drop a; open → sem lista "Suggestions"; addTag "x" → ainda sem lista

test("CA-5.4 CA-5.5 Remove takes the tag off without asking, the grid follows, and a tag no image has is gone", ...);
// drop a, b; tagImage(a, ["x", "y"]); tagImage(b, ["x"]); chips(a) ["x", "y"]; chips(b) ["x"]
// contar dialogs (page.on("dialog")); open a; nota.fill("n"); removeButton("y").click()
//   → tagNames ["x"]; nenhum dialog; suggestions count 0 (b só tem "x", que a tem); nota valor "n"
// close → chips(a) ["x"]; "0 of 2 selected" visível
// open b; removeButton("x").click() → tagList count 0; suggestions ["x"] (a ainda tem)
// close → chips(b) count 0
// open a; removeButton("x").click() → tagList count 0; sem lista "Suggestions"
// close → chips(a) count 0; page.getByTitle("Has a note") count 1 (só a, pela nota "n");
//   page.getByTitle(/^Marks: /) count 0

test("CA-5.13 with refpack stopped, adding or removing a tag changes nothing and the screen says so", ...);
// drop a; open; addTag(page, "x")
// page.route(/\/api\/images\/[^/]+\/tags/, (route) => route.abort("connectionrefused"))
// fill("y"); Enter → tagsAlert tem o texto "Could not save. Check that refpack is still running in the terminal.";
//   tagNames ["x"]; tagInput valor "y"
// removeButton("x").click() → tagNames ["x"]; o alerta continua
// page.unroute(...); Enter na caixa (ainda com "y") → tagNames ["x", "y"]; tagsAlert count 0

test("CA-5.1 the tags follow the screen language", ...);
// língua "Português"; drop a; abrir pelo botão "Anotar"
// getByLabel("Nova etiqueta") com placeholder "Etiqueta (Enter para adicionar)"; botão "Adicionar"
// fill("x"); Enter → viewer.getByRole("list", { name: "Etiquetas desta imagem" }) visível;
//   botão "Remover etiqueta x" visível; close; drop b; abrir b → lista "Sugestões" com o botão "x"
```

`e2e/start-over.spec.ts`:

```ts
test("CA-5.12 starting another pack keeps every tag", ...);
// drop a; abrir pelo botão "Annotate"; etiqueta "keep"; fechar → chips(a) ["keep"]
// clicar em a.png (seleciona); dialog: accept(); "Start another pack" → "0 of 1 selected"
// chips(a) ["keep"]; page.reload() → chips(a) ["keep"]
```

Run: `pnpm test` e `pnpm test:e2e` → Expected: os testes novos FALHAM (os de ponta a ponta, nos dois navegadores); os antigos passam.

- [ ] **Step 2: Implementar** `tags.ts`. Run: `pnpm test` → PASS.

`git commit -m "feat: work out the library's tags and the suggestions for an image"`

- [ ] **Step 3: Implementar** o resto, conforme Interfaces, com os textos da Tarefa 3.

Run: `pnpm check` → Expected: PASS.

- [ ] **Step 4: Commit**

`git commit -m "feat: put tags on the open image and show them in the grid"`

---

### Task 4: Filtrar a grade por etiqueta (tela)

**Modelo:** Sonnet, esforço `medium`.
**Critérios:** CA-5.6, CA-5.7, CA-5.8, CA-5.9, CA-5.10 (filtro), CA-5.12 (filtro); mudanças em CA-2.2, CA-3.4, CA-0.3/1.2/1.3/1.6; ADR-0017, item 8.

**Files:**
- Create: `src/web/tags/TagFilter.tsx`, `e2e/filter.spec.ts`
- Modify: `src/web/api.ts`, `src/web/App.tsx`, `src/web/i18n/pt-BR.ts`, `src/web/i18n/en.ts`, `src/web/styles.css`

**Interfaces:**
- Consumes: `PUT /api/draft/selection` com `tagId` (Tarefa 1); `libraryTags` e `allTags` (Tarefa 3).
- Changes, em `src/web/api.ts` — a assinatura muda; os chamadores de hoje continuam válidos:

```ts
// Every image, or only the images with the tag when `tagId` is given.
export function setAllSelected(selected: boolean, tagId: string | null = null): Promise<boolean>;
// body: tagId === null ? { selected } : { selected, tagId }
```

- Produces, em `src/web/tags/TagFilter.tsx`:

```ts
export function TagFilter(props: {
  tags: Tag[]; // sorted
  value: string | null; // the chosen tag id, null for all images
  shown: number;
  total: number;
  onChange: (tagId: string | null) => void;
});
```

  Desenha `<div className="tag-filter">` com `<label>{t("filter.label")} <select value={value ?? ""}>` com `<option value="">{t("filter.all")}</option>` e uma `<option value={tag.id}>{tag.name}</option>` por etiqueta; e, se `value !== null`, `<span>{t("filter.showing", { shown, total })}</span>`. `onChange` recebe `null` para `""`.

- Changes, em `App.tsx`:
  - Estado `filterTagId: string | null` (inicial `null`). Derivados:

```ts
const activeFilter = allTags.some((tag) => tag.id === filterTagId) ? filterTagId : null; // CA-5.6: a tag that is gone turns the filter off
const hasFilterTag = (image: Image) => image.tags.some((tag) => tag.id === activeFilter);
const shown = activeFilter === null ? images : images.filter(hasFilterTag);
// The images Previous and Next walk: the shown ones, plus the open image when it lost the tag (CA-5.8).
const navigable = activeFilter === null ? images : images.filter((image) => image.id === openId || hasFilterTag(image));
```

  - `<TagFilter>` aparece só quando `allTags.length > 0`, acima do `<SelectionBar>`; a grade recebe `shown`; `SelectionBar` continua com as contagens da biblioteca inteira; `previousId`/`nextId` vêm de `navigable`.
  - `selectAll(selected)`: `setAllSelected(selected, activeFilter)`; no estado, muda só as imagens com `activeFilter === null || hasFilterTag(image)`. `startOver` continua com `setAllSelected(false)` e limpa todas.
  - `addImage`: além de pôr a imagem no estado, `setFilterTagId(null)` (CA-5.9).
- Dicionários: os três textos da Tarefa 4.
- `styles.css`: `.tag-filter` na linha acima da barra de seleção, com espaço entre o seletor e a frase.

- [ ] **Step 1: Testes que falham**

`e2e/filter.spec.ts`, com os localizadores e as ajudas da seção "Estrutura de arquivos" e `const box = (page: Page, name: string) => page.getByRole("checkbox", { name });`:

```ts
test("CA-5.6 the filter lists the tags alphabetically and shows only the images with the chosen one", ...);
// drop a, b, c → filter count 0
// tagImage(c, ["ui"]); tagImage(a, ["zebra", "ui"]); tagImage(b, ["dark"])
// filter visível; filter.locator("option") toHaveText(["All images", "dark", "ui", "zebra"]); filter valor ""
// page.getByText(/^Showing /) count 0
// filter.selectOption({ label: "ui" }) → gridAlts ["c.webp", "a.png"]; "Showing 2 of 3 images" visível
// filter.selectOption({ label: "dark" }) → gridAlts ["b.jpg"]; "Showing 1 of 3 images"
// filter.selectOption({ label: "All images" }) → gridAlts ["c.webp", "b.jpg", "a.png"]; sem "Showing"

test("CA-5.6 CA-5.8 when the filter's tag ceases to exist the grid shows all again", ...);
// drop a, b; tagImage(a, ["solo"]); filter "solo" → gridAlts ["a.png"]
// open a; removeButton("solo").click() → tagList count 0; viewer continua visível
// close → gridAlts ["b.jpg", "a.png"]; filter count 0 (não há mais etiquetas); sem "Showing"

test("CA-5.7 with the filter on, Select all and Clear selection act only on the shown images, and the pack takes every selected image", ...);
// drop a, b, c; tagImage(a, ["ui"]); tagImage(c, ["ui"]); box(b).click() → "1 of 3 selected"
// filter "ui"; "Select all" → box(a) e box(c) marcadas; "3 of 3 selected"
// "Clear selection" → box(a) e box(c) desmarcadas; "1 of 3 selected"
// filter "All images" → box(b) ainda marcada; "1 of 3 selected"
// filter "ui"; "Select all"; "Generate pack" → o caminho aparece; readdir(join(path, "refs")) tem 3 arquivos

test("CA-5.8 with the filter on, Previous and Next walk only the shown images", ...);
// drop a, b, c; tagImage(a, ["ui"]); tagImage(c, ["ui"]); filter "ui"
// open c → botão "Previous" desativado; "Next" → dialog com nome "a.png"; "Next" desativado
// removeButton("ui").click() → dialog "a.png" continua visível; "Previous" → dialog "c.webp";
//   agora "Next" está desativado (a.png saiu das mostradas e não é mais a imagem aberta)
// close → gridAlts ["c.webp"]; "Showing 1 of 3 images"

test("CA-5.9 adding an image with the filter on turns the filter off", ...);
// drop a, b; tagImage(a, ["ui"]); filter "ui" → gridAlts ["a.png"]
// drop c → gridAlts ["c.webp", "b.jpg", "a.png"]; filter valor ""; sem "Showing"
// filter "ui"; paste(page, [{ name: "d.png", content: "image/png" }]) → gridAlts com 4, "d.png" primeiro; filter ""

test("CA-5.10 CA-5.12 the filter is All images after reopening, and Start another pack keeps it", ...);
// drop a, b; tagImage(a, ["ui"]); filter "ui"; box(a).click()
// dialog: accept(); "Start another pack" → "0 of 2 selected"; o filtro continua ligado: gridAlts ["a.png"]
//   e "Showing 1 of 2 images" visível
// app.restart(); goto → filter valor ""; gridAlts ["b.jpg", "a.png"]

test("CA-5.6 the filter follows the screen language", ...);
// língua "Português"; drop a; abrir pelo botão "Anotar"; etiqueta "ui"; fechar
// getByLabel("Filtrar por etiqueta") com options ["Todas as imagens", "ui"]; escolher "ui" → "Mostrando 1 de 1 imagens"
```

Run: `pnpm test:e2e` → Expected: os testes novos FALHAM nos dois navegadores; os outros passam.

- [ ] **Step 2: Implementar** conforme Interfaces, com os textos da Tarefa 4.

Run: `pnpm check` → Expected: PASS.

- [ ] **Step 3: Commit**

`git commit -m "feat: filter the grid by a tag"`

- [ ] **Step 4: Conferência final da fatia — feita pelo condutor**

Run: `pnpm check` → PASS, saída guardada para o relatório.
Run: `gh pr checks` → todos os jobs verdes.
Conferir que CA-5.1 a CA-5.13 têm teste com o identificador no nome: `grep -rhoE "CA-5\.[0-9]+" src e2e | sort -u`.

Só então: revisão da fatia (Opus, contexto limpo), conforme `docs/WORKFLOW.md`.

- [ ] **Step 5: Depois do "aprovado" do dono**

Em `ROADMAP.md`, a fatia 5 passa a `feita` e a fatia 6 a `próxima`. Commit: `docs: mark slice 5 as done`. Merge do pull request.

---

## Roteiro de teste manual do dono

O condutor deixa o branch pronto e avisa. Faça no **Firefox**, com a sua biblioteca de verdade (a que você já usou nas fatias 0 a 4).

1. Rode `pnpm start`.
   **Esperado:** as suas imagens continuam todas lá, com as mesmas notas, marcações, seleção e intenção. Nenhuma mostra etiqueta, e não há "Filtrar por etiqueta" na tela. *(CA-5.10)*
2. Clique em "Anotar" numa imagem.
   **Esperado:** abaixo da nota aparece a seção com a caixa "Etiqueta (Enter para adicionar)" e o botão "Adicionar". O cursor está na caixa da nota, como antes. *(CA-5.1)*
3. Escreva "dashboard" e aperte Enter. Depois escreva " Tabela de dados " (com espaços nas pontas) e clique em "Adicionar".
   **Esperado:** as duas etiquetas aparecem na lista da imagem, "Tabela de dados" sem os espaços das pontas; a caixa fica vazia e o cursor continua nela. *(CA-5.1)*
4. Escreva "DASHBOARD" e aperte Enter.
   **Esperado:** nada muda: a imagem continua com uma só "dashboard", e a caixa fica vazia. *(CA-5.2)*
5. Clique em "Próxima".
   **Esperado:** embaixo da caixa de etiqueta aparecem as sugestões "dashboard" e "Tabela de dados". Escreva "tab": fica só "Tabela de dados". Clique nela. *(CA-5.3)*
6. Escreva "Dashboard" (com D maiúsculo) e aperte Enter.
   **Esperado:** a imagem recebe "dashboard", escrito em minúsculas como da primeira vez. As sugestões somem, porque a imagem já tem as duas. *(CA-5.2, CA-5.3)*
7. Clique no "×" de "Tabela de dados" nesta imagem.
   **Esperado:** ela sai sem pergunta e volta a aparecer nas sugestões (a outra imagem ainda a tem). *(CA-5.4)*
8. Feche a imagem.
   **Esperado:** na grade, cada imagem mostra as etiquetas dela em letra pequena. Apareceu "Filtrar por etiqueta" acima da grade. *(CA-5.5, CA-5.6)*
9. Escolha "dashboard" no filtro.
   **Esperado:** a grade mostra só as duas imagens etiquetadas, e a frase "Mostrando 2 de N imagens". *(CA-5.6)*
10. Com o filtro ligado, clique em "Selecionar todas", depois em "Limpar seleção".
    **Esperado:** só as duas imagens mostradas são selecionadas e depois desmarcadas; a contagem "X de N selecionadas" fala da biblioteca inteira. *(CA-5.7)*
11. Selecione uma das duas, clique em "Anotar" nela e use "Próxima" e "Anterior".
    **Esperado:** você passa só pelas duas imagens do filtro. Tire "dashboard" da imagem aberta: ela continua aberta. Feche: ela não está mais na grade, e a frase diz "Mostrando 1 de N imagens". *(CA-5.8)*
12. Com o filtro ainda ligado, cole um screenshot (Ctrl+V).
    **Esperado:** o filtro volta a "Todas as imagens" e a grade mostra tudo, com a imagem nova primeiro. *(CA-5.9)*
13. Feche a aba, pare o refpack no terminal (Ctrl+C) e rode `pnpm start` de novo.
    **Esperado:** as mesmas etiquetas na grade e nas imagens; o filtro em "Todas as imagens". *(CA-5.10)*
14. Selecione a imagem com "dashboard" e uma sem etiqueta. Clique em "Gerar pacote", copie o caminho e abra o `README.md` da pasta.
    **Esperado:** a linha da imagem etiquetada termina com `tags: "dashboard"`; a linha da outra não fala de etiqueta; há um parágrafo explicando as etiquetas. *(CA-5.11)*
15. No Claude Code, diga "leia a pasta" e cole o caminho.
    **Esperado:** ele diz quais etiquetas cada referência tem. *(CA-5.11)*
16. Clique em "Começar outro pacote" e confirme.
    **Esperado:** a seleção e a intenção ficam vazias; as etiquetas continuam na grade. *(CA-5.12)*
17. Abra uma imagem, pare o refpack no terminal (Ctrl+C) e, com a tela ainda aberta, escreva uma etiqueta e aperte Enter; depois clique no "×" de uma etiqueta existente.
    **Esperado:** aparece o aviso de que não foi possível salvar; nenhuma etiqueta entra nem sai, e o texto continua na caixa. Rode `pnpm start` de novo. *(CA-5.13)*
