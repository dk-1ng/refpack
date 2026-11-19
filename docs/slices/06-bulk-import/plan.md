# Fatia 6 — Entrada em volume: plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task, with the overrides in `docs/WORKFLOW.md`. Steps use checkbox (`- [ ]`) syntax for tracking.

**Objetivo:** o dono importa uma pasta inteira, com subpastas, pelo botão "Importar pasta" ou soltando-a na tela; acompanha o andamento, pode parar e vê um resumo; imagens idênticas às da biblioteca são puladas; a grade usa miniaturas e continua rápida com 10.000 imagens.

**Arquitetura:** o servidor ganha a impressão digital do conteúdo de cada imagem (SHA-256, coluna `content_hash`) e as miniaturas (`thumbs/`, coluna `thumb_mime_type`), na migração `007`. `POST /api/images?skipIdentical=1` não guarda uma imagem cujo conteúdo já existe (ADR-0021). A tela faz as miniaturas que faltam, uma por vez, e as envia (ADR-0020). A grade passa a carregar só o que está perto da tela. A importação é conduzida pela tela: lê os arquivos da pasta, ordena pelo caminho e envia uma imagem por vez, de trás para a frente (ADR-0021).

**Stack:** a das fatias 0 a 5, sem dependência nova.

**Spec:** `SPEC.md`, seção 12 (critérios CA-6.1 a CA-6.15). ADRs 0004, 0007, 0010, 0012, 0015, 0017, 0020 e 0021.

## Para o dono: o que esta fatia entrega

| Tarefa | O que passa a existir | Critérios |
| --- | --- | --- |
| 1. Impressão digital e miniaturas no servidor | A biblioteca reconhece imagens idênticas e guarda miniaturas. Nada muda na tela ainda. | base de CA-6.6, 6.12, 6.14, 6.15 |
| 2. Miniaturas na grade | A grade mostra miniaturas; as imagens que você já tem ganham a sua sozinhas. | CA-6.12, 6.14 |
| 3. Grade rápida | A grade só carrega o que está perto da tela; teste com 10.000 imagens. | CA-6.13 |
| 4. Importar pelo botão | "Importar pasta", o andamento, "Parar" e o resumo. | CA-6.1, 6.3 a 6.11, 6.14 |
| 5. Importar soltando | Soltar uma pasta na tela importa; a dica e o aviso de pasta mudam. | CA-6.2, 6.4; mudanças em CA-1.1, 1.7, 3.10 |

O roteiro do teste de uso, feito por um agente, está no fim deste arquivo.

**O que os testes automáticos não cobrem:** os tempos do CA-6.13 (medidos no teste de uso), a janela do sistema para escolher a pasta e o arrastar de verdade, e soltar uma pasta no Firefox.

## Global Constraints

- Nenhuma dependência nova. O esquema do banco é exatamente o da migração `007` deste plano.
- Só existem os arquivos listados em "Estrutura de arquivos". Precisou de outro: pare e reporte.
- Toda rota nova ou mudada valida a entrada com zod (ADR-0007, item 3) e fica atrás do `localOnly` que já existe.
- O servidor não interpreta imagens: confere o tipo pelos primeiros bytes (`sniffImageType`) e calcula o SHA-256 dos bytes, nada mais (ADR-0007, item 5).
- Limites: `MAX_IMAGE_BYTES` continua 25 MB; `MAX_THUMB_BYTES = 2 * 1024 * 1024`; `THUMB_SIZE = 384`.
- A ordem por caminho usa `new Intl.Collator("en")`, a mesma de `libraryTags` (ADR-0017). Nenhum ramo por navegador ou sistema operacional no código do produto (ADR-0010, R11). Um teste que só passa com tratamento especial: pare e reporte.
- A importação envia uma imagem por vez, nunca em paralelo (ADR-0021, item 1).
- Nenhum temporizador no código do produto. Nenhum `waitForTimeout` nos testes: o que precisa esperar usa `expect.poll`, `toHaveText` ou uma rota segurada por `page.route` e liberada pelo teste.
- Todo texto visível vem dos dicionários `pt-BR` e `en`, com exatamente os textos da tabela "Textos novos e mudados". Caminhos e nomes de arquivo do dono são exibidos como texto (ADR-0007, item 6).
- Nenhum arquivo de imagem é commitado. Os testes fabricam as imagens.
- Todo teste que cobre um critério traz o identificador no nome, por exemplo `"CA-6.6 ..."`.
- Testes das fatias 0 a 5 só mudam onde este plano diz. Outro teste antigo quebrou: pare e reporte.
- Commits em inglês, Conventional Commits, um por passo de commit do plano.
- Ao fim de cada tarefa o condutor envia o branch e espera o CI verde antes de começar a próxima.

## Textos novos e mudados

| Chave | `pt-BR` | `en` | Tarefa |
| --- | --- | --- | --- |
| `import.button` | Importar pasta | Import folder | 4 |
| `import.label` | Importação | Import | 4 |
| `import.progress` | Importando {done} de {total} imagens | Importing {done} of {total} images | 4 |
| `import.stop` | Parar | Stop | 4 |
| `import.done` | Importação concluída. | Import finished. | 4 |
| `import.stopped` | Importação parada. | Import stopped. | 4 |
| `import.added` | Entraram na biblioteca: {count} | Added to the library: {count} | 4 |
| `import.identical` | Já estavam na biblioteca: {count} | Already in the library: {count} | 4 |
| `import.refused` | Recusadas: {count} | Refused: {count} | 4 |
| `import.ignored` | Arquivos ignorados por não serem imagem: {count} | Files ignored because they are not images: {count} | 4 |
| `import.notImported` | Não chegaram a ser importadas: {count} | Not imported: {count} | 4 |
| `import.none` | Nenhuma imagem encontrada na pasta. | No images found in the folder. | 4 |
| `import.close` | Fechar resumo | Close summary | 4 |
| `import.busy` | Espere a importação terminar, ou pare-a, antes de adicionar mais imagens. | Wait for the import to finish, or stop it, before adding more images. | 4 |
| `library.hint` (muda) | Você também pode colar com Ctrl+V ou arrastar arquivos e pastas para esta tela. | You can also paste with Ctrl+V or drag files and folders onto this screen. | 5 |
| `error.folder` (muda) | {name}: para importar uma pasta, arraste-a para a tela ou use "Importar pasta". | {name}: to import a folder, drag it onto the screen or use "Import folder". | 5 |

Cada recusada do resumo reutiliza `error.unsupportedType` e `error.tooLarge`, com o caminho no lugar de `{name}`. O aviso de que não foi possível salvar reutiliza `error.notSaved`.

## Review Focus

Condições que o dono pode causar em uso normal. Todas têm critério no SPEC; cada uma tem seu teste na tarefa indicada.

1. Abrir a biblioteca que ele já tem, das fatias 0 a 5 → tudo igual; as imagens ganham impressão digital ao abrir e miniatura com a tela aberta; importar uma pasta com uma imagem que ele já tinha a pula; CA-6.12 e CA-6.15 (Tarefas 1 e 2).
2. Uma pasta com `.PNG` maiúsculo, `.DS_Store`, `.txt`, `.gif` e um `.png` que não é imagem → o `.PNG` entra; `.DS_Store`, `.txt` e `.gif` são só contados (o `.DS_Store` é conferido no teste unitário); o falso `.png` aparece entre as recusadas, com o caminho; CA-6.7 (Tarefa 4).
3. Dois arquivos idênticos na mesma pasta, e a mesma pasta importada duas vezes → só um entra; a segunda importação não traz nada; CA-6.6 (Tarefas 1 e 4).
4. "Parar", recarregar a tela ou parar o refpack no meio → o que entrou fica; importar de novo traz o resto e a grade fica na ordem alfabética; CA-6.5, CA-6.10, CA-6.11 (Tarefa 4).
5. Colar ou soltar durante uma importação → aviso, nada entra; com uma imagem aberta, soltar uma pasta não faz nada; CA-6.4 e CA-3.10 (Tarefas 4 e 5).
6. Uma imagem panorâmica ou muito alta → a miniatura é o quadrado do centro, a mesma aparência de hoje; a imagem aberta e o pacote usam o original; CA-6.12 (Tarefa 2).

## Estrutura de arquivos

```
src/server/migrations/007-volume.sql       novo: content_hash, thumb_mime_type, índice
src/server/library.ts  library.test.ts     modificados: impressão digital, pular idênticas, miniaturas
src/server/app.ts  app.test.ts             modificados: skipIdentical; rotas da miniatura; thumbUrl
src/server/tags.test.ts  marks.test.ts     modificados (Tarefa 1): StoredImage ganha thumbMimeType nos esperados
src/shared/api.ts                          modificado: thumbUrl, "identical", MAX_THUMB_BYTES, schemas
src/web/api.ts                             modificado: uploadThumbnail (T2); uploadImage com skipIdentical (T4)
src/web/library/thumbnail.ts  .test.ts     novos (T2): o quadrado do centro e a miniatura
src/web/library/use-thumbnails.ts          novo (T2): a fila das miniaturas que faltam
src/web/library/ImageGrid.tsx              modificado: miniatura (T2); item memorizado, carregamento preguiçoso (T3)
src/web/library/AddImages.tsx              modificado (T4): desativado durante a importação
src/web/library/IncomingFiles.tsx          modificado: aviso de ocupado (T4); soltar pasta importa (T5)
src/web/import/import.ts  import.test.ts   novos (T4): separar, ordenar e enviar
src/web/import/use-import.ts               novo (T4): o estado da importação na tela
src/web/import/ImportFolder.tsx            novo (T4): o botão "Importar pasta"
src/web/import/ImportStatus.tsx            novo (T4): andamento e resumo
src/web/import/dropped.ts                  novo (T5): ler as pastas soltas
src/web/App.tsx                            modificado (T2, T3, T4, T5)
src/web/i18n/pt-BR.ts  en.ts               modificados (T4, T5)
src/web/styles.css                         modificado (T3, T4)
e2e/support.ts                             modificado: makeImageFile com cor (T2); seedLibrary (T3)
e2e/thumbnails.spec.ts                     novo (T2)
e2e/volume.spec.ts                         novo (T3)
e2e/import.spec.ts                         novo (T4)
e2e/drop.spec.ts                           modificado (T5): os testes do CA-1.7 dão lugar aos do CA-6.2
e2e/paste.spec.ts                          modificado (T5): o texto da dica (CA-1.1)
```

`src/web/import/` é uma pasta nova dentro de `src/web/`, agrupada por funcionalidade como `tags/` e `marks/`; não é pasta de primeiro nível (ADR-0005).

Nos testes de ponta a ponta valem os localizadores das fatias anteriores:

```ts
const item = (page: Page, name: string) =>
  page.getByRole("listitem").filter({ has: page.getByAltText(name) });
const images = (page: Page) => page.getByRole("list").getByRole("img");
const gridAlts = (page: Page) =>
  images(page).evaluateAll((imgs) => imgs.map((i) => i.getAttribute("alt") ?? ""));
const gridSrc = (page: Page, name: string) =>
  item(page, name).getByRole("img").evaluate((img) => img.getAttribute("src") ?? "");
const importStatus = (page: Page) => page.getByRole("region", { name: "Import" });
const folderInput = (page: Page) => page.locator("input[webkitdirectory]");
```

`makeImageFile` (em `e2e/support.ts`) ganha, na Tarefa 2, um quinto parâmetro opcional `color = "#3366cc"`: a cor de fundo da imagem (o quarto amarelo continua). **Duas imagens do mesmo formato e da mesma cor saem idênticas**; os testes que querem imagens diferentes usam cores diferentes.

---

### Task 1: Impressão digital, pular idênticas e miniaturas (servidor)

**Modelo:** Sonnet, esforço `medium`.
**Critérios:** base de CA-6.6, CA-6.12, CA-6.14, CA-6.15; ADR-0020, item 3; ADR-0021, itens 5 e 6.

**Files:**
- Create: `src/server/migrations/007-volume.sql`
- Modify: `src/server/library.ts`, `src/server/library.test.ts`, `src/server/app.ts`, `src/server/app.test.ts`, `src/shared/api.ts`, `src/server/tags.test.ts`, `src/server/marks.test.ts`

Antes do Step 1, o condutor confere que está no branch `slice/06-bulk-import` (criado pelo arquiteto ao aprovar o plano).

**Interfaces:**
- Migração `007-volume.sql`, exatamente:

```sql
ALTER TABLE images ADD COLUMN content_hash TEXT;
ALTER TABLE images ADD COLUMN thumb_mime_type TEXT;
CREATE INDEX images_content_hash ON images (content_hash);
```

- Produces, em `src/shared/api.ts`:

```ts
export const MAX_THUMB_BYTES = 2 * 1024 * 1024;
// The query of POST /api/images. skipIdentical=1: an image whose content is already in the
// library is not stored, and the answer is 409 "identical" (ADR-0021, item 6).
export const AddImageQuerySchema = z.object({ skipIdentical: z.literal("1").optional() });
// The answer of PUT /api/images/:id/thumb.
export const ThumbSavedSchema = z.object({ thumbUrl: z.string() });
```

  `ImageSchema` ganha `thumbUrl: z.string().nullable()`. `ErrorCodeSchema` ganha `"identical"`.

- Changes, em `src/server/library.ts`:

```ts
export type Library = { ...; thumbsDir: string }; // join(root, "thumbs"), created when needed
export type StoredImage = { ...; thumbMimeType: ImageType["mimeType"] | null };
export type AddImageResult =
  | { ok: true; image: StoredImage }
  | { ok: false; code: "unsupported-type" | "too-large" | "identical" };
// Always stores the SHA-256 (hex) of the bytes in content_hash. With skipIdentical, when an image
// with the same content_hash exists, writes nothing and answers "identical". The checks run in
// this order: too-large, unsupported-type, identical.
export function addImage(
  library: Library,
  input: { bytes: Uint8Array; originalName: string; skipIdentical?: boolean },
): AddImageResult;
// The name of the image's thumbnail inside thumbsDir (`<id>.<extension>`), null without one.
export function thumbFileName(image: StoredImage): string | null;
export type SetThumbnailResult = { ok: true } | { ok: false; code: "not-found" | "unsupported-type" };
// Checks the type by content, writes thumbsDir/<id>.<extension> (creating the folder), deletes the
// image's previous thumbnail file when its extension differs, and stores thumb_mime_type.
export function setThumbnail(library: Library, id: string, bytes: Uint8Array): SetThumbnailResult;
```

  `openLibrary`, depois de `migrate`, calcula a impressão digital de toda imagem com `content_hash IS NULL` cujo arquivo existe em `images/`, numa transação só; se o arquivo não existe, ela fica `NULL` e nada falha. `ImageRowSchema` e as consultas de `listImages`/`findImage` passam a ler `thumb_mime_type` (nulo ou um dos três tipos).

- Changes, em `src/server/app.ts`:
  - `toImage` inclui `thumbUrl: image.thumbMimeType === null ? null : "/api/images/<id>/thumb"`.
  - `POST /api/images`: `AddImageQuerySchema.safeParse(c.req.query())`; falhou → `400 invalid-request`; `skipIdentical === "1"` passa `skipIdentical: true` a `addImage`; `"identical"` → `409` com `{ error: { code: "identical" } }`. O resto não muda.
  - `PUT /api/images/:id/thumb`: `bodyLimit` de `MAX_THUMB_BYTES` → `413 too-large`; imagem desconhecida ou id malformado → `404 not-found`; tipo → `415 unsupported-type`; guardou → `200` com `{ thumbUrl }` (o mesmo endereço do `toImage`).
  - `GET /api/images/:id/thumb`: imagem desconhecida ou sem miniatura → `404 not-found`; senão os bytes, com `content-type` igual a `thumbMimeType`.

- [ ] **Step 1: Testes que falham**

Nos arquivos de teste: `const UNKNOWN = "3f2b8a52-6c1e-4b0f-9a4d-1d2c3b4a5e6f";` e `const other = (bytes: Uint8Array) => new Uint8Array([...bytes, 9]);` (mesmo tipo, conteúdo diferente).

`src/server/library.test.ts`:

```ts
test("CA-6.6 addImage with skipIdentical stores nothing when the same content is already there, under any name", ...);
// a = addImage({ bytes: PNG_BYTES, originalName: "a.png" }) (sem skipIdentical)
// addImage({ bytes: PNG_BYTES, originalName: "outro nome.png", skipIdentical: true }) → { ok: false, code: "identical" }
// listImages tem 1; readdirSync(imagesDir) tem 1 arquivo
// addImage({ bytes: other(PNG_BYTES), originalName: "b.png", skipIdentical: true }) → ok; listImages tem 2
// addImage({ bytes: JPEG_BYTES, ..., skipIdentical: true }) → ok (conteúdo novo)

test("CA-6.6 without skipIdentical the same content is stored again, as before", ...);
// duas vezes PNG_BYTES sem skipIdentical → 2 imagens com ids diferentes

test("addImage checks size and type before looking for an identical image", ...);
// a com PNG_BYTES; skipIdentical com bytes "not an image" → unsupported-type;
// com MAX_IMAGE_BYTES + 1 bytes → too-large

test("CA-6.15 a library created before slice 6 gets the content hash of its images on open and keeps everything else", ...);
// banco antigo à mão, como o de tags.test.ts: aplicar 001 a 006, user_version = 6
//   imagem UNKNOWN (selected 1, note 'antiga') com o arquivo images/<UNKNOWN>.png = PNG_BYTES
//   imagem SEM_ARQUIVO (outro uuid) sem arquivo em images/
//   a etiqueta "velha" em UNKNOWN (linhas em tags e image_tags); intent = 'velha'
// abrir → listImages traz as duas, com selected/note de antes e thumbMimeType null
// listTags(library).get(UNKNOWN) = [{ name: "velha", ... }]; getIntent = "velha"
// addImage({ bytes: PNG_BYTES, originalName: "x.png", skipIdentical: true }) → identical

test("CA-6.12 setThumbnail stores the thumbnail and replaces the previous one", ...);
// a; setThumbnail(a.id, WEBP_BYTES) → { ok: true }; findImage(a.id).thumbMimeType = "image/webp"
// readFileSync(join(thumbsDir, a.id + ".webp")) = WEBP_BYTES; thumbFileName(findImage(a.id)) = a.id + ".webp"
// setThumbnail(a.id, PNG_BYTES) → ok; readdirSync(thumbsDir) = [a.id + ".png"]
// a imagem original em images/ não mudou

test("setThumbnail answers not-found and unsupported-type and then changes nothing", ...);
// setThumbnail(UNKNOWN, PNG_BYTES) → not-found
// a com miniatura PNG; setThumbnail(a.id, "not an image") → unsupported-type; a miniatura PNG continua

test("CA-6.14 the thumbnail and the content hash are still there after reopening", ...);
// a; setThumbnail(a.id, WEBP_BYTES); closeLibrary; openLibrary(mesma raiz)
// findImage(a.id).thumbMimeType = "image/webp"; addImage(PNG_BYTES, skipIdentical) → identical
```

`src/server/app.test.ts`:

```ts
test("CA-6.6 POST /api/images?skipIdentical=1 answers 409 identical for content already in the library", ...);
// POST PNG_BYTES → 201; POST ?skipIdentical=1 PNG_BYTES → 409 { error: { code: "identical" } }
// POST sem o parâmetro → 201; GET → 2 imagens
// ?skipIdentical=yes → 400 invalid-request

test("CA-6.12 PUT and GET /api/images/:id/thumb store and return the thumbnail, and the list gives its address", ...);
// upload → thumbUrl null; PUT WEBP_BYTES → 200 { thumbUrl: "/api/images/<id>/thumb" }
// GET /api/images → images[0].thumbUrl igual; GET thumbUrl → WEBP_BYTES, content-type image/webp
// GET /api/images/<id>/file → ainda PNG_BYTES

test("the thumbnail routes answer 404, 415 and 413", ...);
// GET thumb de imagem sem miniatura → 404; PUT/GET com UNKNOWN e "not-a-uuid" → 404 not-found
// PUT "not an image" → 415 unsupported-type; PUT MAX_THUMB_BYTES + 1 bytes → 413 too-large

test("CA-0.11 the thumbnail routes are behind the local-only guard", ...);
// PUT e GET thumb com host "evil.example" → 403
```

Nos testes antigos que comparam uma imagem inteira com `toEqual`: em `app.test.ts`, acrescente `thumbUrl: null`; em `library.test.ts`, `tags.test.ts` e `marks.test.ts`, acrescente `thumbMimeType: null` ao `StoredImage` esperado. Nada mais muda neles.

Run: `pnpm test` → Expected: os testes novos FALHAM; os antigos passam.

- [ ] **Step 2: Implementar** conforme Interfaces.

Run: `pnpm check` → Expected: PASS. A tela não mudou.

- [ ] **Step 3: Commit**

`git commit -m "feat: fingerprint image content, skip identical images on request and store thumbnails"`

---

### Task 2: Miniaturas na grade (tela)

**Modelo:** Sonnet, esforço `medium`.
**Critérios:** CA-6.12, CA-6.14; ADR-0020, itens 1, 2 e 4.

**Files:**
- Create: `src/web/library/thumbnail.ts`, `src/web/library/thumbnail.test.ts`, `src/web/library/use-thumbnails.ts`, `e2e/thumbnails.spec.ts`
- Modify: `src/web/api.ts`, `src/web/App.tsx`, `src/web/library/ImageGrid.tsx`, `e2e/support.ts`

**Interfaces:**
- Consumes: `PUT /api/images/:id/thumb`, `ThumbSavedSchema`, `thumbUrl` (Tarefa 1).
- Produces, em `src/web/library/thumbnail.ts`:

```ts
export const THUMB_SIZE = 384;
// The centre square of a width × height image, and the side of the thumbnail drawn from it:
// side = min(width, height); x = floor((width - side) / 2); y = floor((height - side) / 2);
// size = min(THUMB_SIZE, side) (never larger than the image).
export function centreSquare(width: number, height: number): { x: number; y: number; side: number; size: number };
// The thumbnail of an image file: the centre square drawn on a size × size canvas with
// imageSmoothingQuality "high", exported with toBlob("image/webp", 0.85). The browser may hand back
// PNG instead; that is fine. null when it cannot read or draw the image (never throws).
export async function makeThumbnail(file: Blob): Promise<Blob | null>;
```

- Produces, em `src/web/api.ts` — nunca lança:

```ts
// The thumbnail's address as the server stored it. null on any status that is not 2xx, an answer
// that is not ThumbSavedSchema, or a network error.
export async function uploadThumbnail(imageId: string, thumb: Blob): Promise<string | null>;
```

- Produces, em `src/web/library/use-thumbnails.ts`:

```ts
// While the screen is open, makes the missing thumbnails one at a time, in the order of `images`
// (ADR-0020, item 2): fetch(image.url) → makeThumbnail → uploadThumbnail → onThumb(id, thumbUrl).
// Each image is tried once per page load, whatever the outcome. Shows no notice.
export function useThumbnails(
  images: Image[] | null,
  onThumb: (id: string, thumbUrl: string) => void,
): void;
```

  Uma única fila: um `ref` com as imagens mais recentes, um `Set` com os ids já tentados e um `ref` que impede duas filas ao mesmo tempo (vale também para o efeito rodado duas vezes pelo `StrictMode`). A fila procura a próxima imagem com `thumbUrl === null` que ainda não foi tentada, nas imagens mais recentes; quando não há mais, para; um efeito sobre `images` a reinicia.

- Changes, em `App.tsx`: `thumbReady(id, thumbUrl)` com `useCallback`, que troca o `thumbUrl` da imagem no estado; `useThumbnails(images, thumbReady)`.
- Changes, em `ImageGrid.tsx`: `<img src={image.thumbUrl ?? image.url} ...>`. Nada mais.
- Changes, em `e2e/support.ts`: `makeImageFile(page, dir, name, mimeType, color = "#3366cc")`, com `color` no lugar do azul fixo.

- [ ] **Step 1: Testes que falham**

`src/web/library/thumbnail.test.ts`:

```ts
test("CA-6.12 centreSquare takes the middle of a wide, a tall and a square image", ...);
// (1200, 800) → { x: 200, y: 0, side: 800, size: 384 }
// (800, 3000) → { x: 0, y: 1100, side: 800, size: 384 }
// (500, 500) → { x: 0, y: 0, side: 500, size: 384 }
// (101, 100) → { x: 0, y: 0, side: 100, size: 100 } (não aumenta)
// (8, 8) → { x: 0, y: 0, side: 8, size: 8 }
```

`e2e/thumbnails.spec.ts` (`thumbPath = /\/api\/images\/[^/]+\/thumb$/`; `filePath = /\/api\/images\/[^/]+\/file$/`):

```ts
test("CA-6.12 a new image gets a thumbnail of its centre square, and the open image and the pack keep the original", ...);
// drop [{ name: "wide.png", content: "image/png", width: 1200, height: 800 }]
// expect.poll(gridSrc("wide.png")).toMatch(thumbPath)
// no navegador: fetch(src) → createImageBitmap → width 384, height 384;
//   pixel (10, 10) amarelado (r > 200, g > 150, b < 100) e pixel (370, 370) azulado (b > 150, r < 100)
//   (a miniatura é WebP: as cores são conferidas com folga)
// readdir(join(app.libraryDir, "thumbs")) tem 1 arquivo
// abrir pelo "Annotate" → a imagem do diálogo tem src que passa em filePath
// fechar; selecionar; "Generate pack" → readPng(refs/01.png) tem width 1200, height 800

test("CA-6.12 an image whose thumbnail could not be made shows the original, and gets one by itself after a reload", ...);
// page.route(thumbPath, (route) => route.request().method() === "PUT" ? route.abort("connectionrefused") : route.continue())
// contar os PUT em thumbPath com page.on("request")
// drop a → expect.poll(contagem de PUT) toBe(1); gridSrc("a.png") passa em filePath;
//   a imagem da grade tem naturalWidth > 0 (expect.poll); nenhum alerta na tela
// page.unroute(thumbPath); page.reload() → expect.poll(gridSrc("a.png")).toMatch(thumbPath)

test("CA-6.14 the thumbnails come back after a restart and are not made again", ...);
// drop a, b → as duas passam em thumbPath (poll)
// app.restart(); contar PUT em thumbPath a partir daqui; goto → as duas passam em thumbPath;
//   gridAlts ["b.jpg", "a.png"]; depois de as duas terem naturalWidth > 0, contagem de PUT = 0
```

Run: `pnpm test` e `pnpm test:e2e` → Expected: os testes novos FALHAM; os antigos passam.

- [ ] **Step 2: Implementar** conforme Interfaces.

Run: `pnpm check` → Expected: PASS.

- [ ] **Step 3: Commit**

`git commit -m "feat: show thumbnails in the grid and make the missing ones in the background"`

---

### Task 3: Grade rápida com 10.000 imagens (tela)

**Modelo:** Sonnet, esforço `medium`.
**Critérios:** CA-6.13; ADR-0020, itens 5 a 7.

**Files:**
- Create: `e2e/volume.spec.ts`
- Modify: `src/web/library/ImageGrid.tsx`, `src/web/App.tsx`, `src/web/styles.css`, `e2e/support.ts`

**Interfaces:**
- Changes, em `ImageGrid.tsx`: o `<li>` de cada imagem vira o componente `GridItem`, envolvido em `memo`, com as props `image`, `onToggle` e `onOpenNote`. O `<img>` ganha `loading="lazy"` e `decoding="async"`. O que é desenhado não muda.
- Changes, em `App.tsx`: `openNote = useCallback((image: Image) => setOpenId(image.id), [])`, passado como `onOpenNote`. `toggle` já é estável; confira que continua.
- Changes, em `styles.css`: `.image-grid > li { content-visibility: auto; contain-intrinsic-size: auto 12rem; }`.
- Produces, em `e2e/support.ts` (único ponto em que um teste de ponta a ponta importa de `src/server`: fabricar 10.000 imagens por pedidos levaria minutos):

```ts
import { addImage, closeLibrary, openLibrary, setThumbnail } from "../src/server/library.ts";
import { addTag } from "../src/server/tags.ts";
// Writes `count` images straight into a new library at `libraryDir`, in one transaction
// (BEGIN … COMMIT on library.db). Image i (0-based) has the bytes of `png` followed by the 4 bytes
// of i, so each content differs; its name is `img-${String(i).padStart(5, "0")}.png`; its
// thumbnail is `png`. The first `tagged` images get the tag "ui". For CA-6.13.
export function seedLibrary(libraryDir: string, count: number, png: Uint8Array, tagged?: number): void;
```

- [ ] **Step 1: Teste que falha**

`e2e/volume.spec.ts`, um teste só, com `test.setTimeout(300_000)`. Não usa a fixture `app`: cria uma pasta temporária com acentos e espaços, chama `seedLibrary` e depois `startApp({ libraryDir })`; num `finally`, `app.stop()` e apaga a pasta.

```ts
test("CA-6.13 with 10,000 images the grid opens, fetches only what is near the screen, scrolls to the end, and selecting, filtering and opening work", ...);
// png = readFile(makeImageFile(page, pasta, "seed.png", "image/png")); seedLibrary(lib, 10_000, png, 10)
// contar os pedidos que passam em /\/api\/images\/[^/]+\/(thumb|file)$/
// goto → o primeiro item da grade tem alt "img-09999.png" e naturalWidth > 0 (poll);
//   "0 of 10000 selected" visível
// até aqui: nenhum pedido em /file; menos de 500 pedidos em /thumb
// item("img-00000.png").scrollIntoViewIfNeeded() → a imagem dele tem naturalWidth > 0 (poll)
// checkbox "img-00000.png" → "1 of 10000 selected"
// "Filter by tag" → "ui" → 10 imagens, de "img-00009.png" a "img-00000.png"; "Showing 10 of 10000 images"
// "Annotate" em "img-00005.png" → dialog com nome "img-00005.png"; fechar
```

Run: `pnpm test:e2e e2e/volume.spec.ts` → Expected: FALHA (hoje a grade baixa as 10.000 imagens).

- [ ] **Step 2: Implementar** conforme Interfaces.

Run: `pnpm check` → Expected: PASS.

- [ ] **Step 3: Commit**

`git commit -m "perf: load only the grid images near the screen and redraw only the item that changed"`

---

### Task 4: Importar uma pasta pelo botão (tela)

**Modelo:** **difícil** — Opus, esforço `high` (é a tarefa com mais estado e mais testes; ver `docs/WORKFLOW.md`).
**Critérios:** CA-6.1, CA-6.3 a CA-6.11, CA-6.14; mudanças em CA-0.3, CA-0.5, CA-1.2, CA-1.3, CA-1.6 e CA-5.9; ADR-0021, itens 1 a 4, 7 e 8.

**Files:**
- Create: `src/web/import/import.ts`, `src/web/import/import.test.ts`, `src/web/import/use-import.ts`, `src/web/import/ImportFolder.tsx`, `src/web/import/ImportStatus.tsx`, `e2e/import.spec.ts`
- Modify: `src/web/api.ts`, `src/web/App.tsx`, `src/web/library/AddImages.tsx`, `src/web/library/IncomingFiles.tsx`, `src/web/i18n/pt-BR.ts`, `src/web/i18n/en.ts`, `src/web/styles.css`

**Interfaces:**
- Consumes: `POST /api/images?skipIdentical=1` e o código `identical` (Tarefa 1).
- Changes, em `src/web/api.ts`:

```ts
export type UploadResult =
  | { ok: true; image: Image }
  | { ok: false; code: "unsupported-type" | "too-large" | "identical" | "generic" };
// With skipIdentical, sends POST /api/images?skipIdentical=1. "generic" also covers a network error.
export async function uploadImage(file: File, options?: { skipIdentical?: boolean }): Promise<UploadResult>;
```

  `addFiles` continua chamando `uploadImage(file)`, sem a opção; se algum dia receber `identical`, trata como `generic`.

- Produces, em `src/web/import/import.ts` (sem DOM; roda no Vitest):

```ts
export type Entry = { path: string; file: File };
// True for names ending in .png, .jpg, .jpeg or .webp, in any case.
export function isImageName(name: string): boolean;
// The image files (by file.name), sorted by path with new Intl.Collator("en"), and how many other
// files there were.
export function planImport(entries: Entry[]): { images: Entry[]; ignored: number };
export type Refusal = { path: string; code: "unsupported-type" | "too-large" };
export type ImportSummary = {
  found: number; // image files
  added: number;
  identical: number;
  refused: Refusal[]; // in the order they were met
  ignored: number;
  notImported: number; // found - added - identical - refused.length
  stopped: boolean; // asked to stop, or failed
  failed: boolean; // a send got no answer, or an unexpected one ("generic")
};
export type ImportDeps = {
  upload: (file: File) => Promise<UploadResult>;
  onAdded: (image: Image) => void;
  onProgress: (done: number, total: number) => void;
  shouldStop: () => boolean;
};
// planImport, then onProgress(0, found), then, from the last image to the first: shouldStop() →
// stop; file.size > MAX_IMAGE_BYTES → refused "too-large" without sending; otherwise upload and
// count the outcome; "generic" → stop with failed. onProgress(done, found) after each image counted.
export async function runImport(entries: Entry[], deps: ImportDeps): Promise<ImportSummary>;
```

- Produces, em `src/web/import/use-import.ts`:

```ts
export type ImportProgress = { done: number; total: number };
export function useImport(handlers: {
  onAdded: (image: Image) => void;
  onStart: () => void; // the screen turns the tag filter off (CA-6.9)
  onFailed: () => void; // the screen shows error.notSaved (CA-6.10)
}): {
  running: boolean;
  progress: ImportProgress | null; // while running
  summary: ImportSummary | null; // after it ends, until dismissed or another import starts
  start: (entries: Entry[]) => void; // does nothing while running
  stop: () => void;
  dismiss: () => void;
};
```

  `start`: limpa o resumo, chama `onStart`, roda `runImport` com `upload = (file) => uploadImage(file, { skipIdentical: true })` e `shouldStop` lendo um `ref` que `stop` liga; no fim, `progress = null`, `running = false`, guarda o resumo e, se `failed`, chama `onFailed`. Os `handlers` são lidos por `ref`, para `start`, `stop` e `dismiss` serem estáveis.

- Produces, em `src/web/import/ImportFolder.tsx`:

```ts
export function ImportFolder(props: { disabled: boolean; onFiles: (entries: Entry[]) => void });
```

  Um `<button type="button" disabled={disabled}>{t("import.button")}</button>` que clica num `<input type="file" multiple hidden>`; o atributo `webkitdirectory` é posto pelo `ref` (`setAttribute("webkitdirectory", "")`), porque o React não o conhece. No `onChange`: `entries = files.map((file) => ({ path: file.webkitRelativePath || file.name, file }))`, limpa o `value`, chama `onFiles(entries)`.

- Produces, em `src/web/import/ImportStatus.tsx`:

```ts
export function ImportStatus(props: {
  progress: ImportProgress | null;
  summary: ImportSummary | null;
  onStop: () => void;
  onClose: () => void;
});
```

  Nada quando os dois são `null`. Senão, `<section className="import-status" aria-label={t("import.label")}>` com:
  - andamento: `<p role="status">{t("import.progress", { done, total })}</p>` e `<button type="button">{t("import.stop")}</button>`;
  - resumo: `<p>{stopped ? t("import.stopped") : t("import.done")}</p>`; se `found === 0`, `<p>{t("import.none")}</p>`; um `<ul>` com uma linha por número diferente de zero, nesta ordem: `import.added`, `import.identical`, `import.refused` (com um `<ul>` dentro, uma linha por recusada: `t(code === "too-large" ? "error.tooLarge" : "error.unsupportedType", { name: path })`), `import.ignored`, `import.notImported`; e `<button type="button">{t("import.close")}</button>`.
  Os números são mostrados com `String(n)`, como no resto da tela.

- Changes, em `AddImages.tsx`: prop `disabled: boolean` no botão.
- Changes, em `IncomingFiles.tsx`: prop `busy: boolean`. Fora de uma imagem aberta (`paused` falso), com `busy`, colar ou soltar algo que traz arquivos ou pastas faz `preventDefault()`, mostra `import.busy` e não adiciona nada. Colar texto na caixa da intenção continua como hoje (CA-2.12).
- Changes, em `App.tsx`: `importer = useImport({ onAdded: addImage, onStart: () => setFilterTagId(null), onFailed: () => refuse({ key: "error.notSaved" }) })`; `<ImportFolder disabled={importer.running} onFiles={importer.start} />` logo depois de `<AddImages>` (que recebe `disabled={importer.running}`); `<ImportStatus>` logo depois; `<IncomingFiles busy={importer.running} ...>`.
- `styles.css`: `.import-status` como um bloco com borda clara e espaço interno, acima da caixa da intenção; listas sem marcadores.
- Dicionários: os textos da Tarefa 4.

- [ ] **Step 1: Testes que falham**

`src/web/import/import.test.ts` (`entry = (path, content = "x") => ({ path, file: new File([content], path.split("/").at(-1) ?? path) })`; um `upload` falso que devolve, por nome de arquivo, o resultado de um mapa e registra a ordem dos nomes recebidos; `image(name)` monta uma `Image` com esse `originalName`):

```ts
test("CA-6.7 isImageName accepts .png, .jpg, .jpeg and .webp in any case, and nothing else", ...);
// a.png, b.JPG, c.jpeg, d.WebP, e.PNG → true; .DS_Store, notes.txt, anim.gif, png, a.png.txt, a.svg → false

test("CA-6.3 planImport keeps the image files sorted by path and counts the others", ...);
// ["P/sub/b.jpg", "P/.DS_Store", "P/a.png", "P/D.PNG", "P/notes.txt", "P/sub/deep/c.webp"]
// → images ["P/a.png", "P/D.PNG", "P/sub/b.jpg", "P/sub/deep/c.webp"]; ignored 2

test("CA-6.3 CA-6.4 runImport sends from the last path to the first and reports progress after each image", ...);
// a.png, b.png, c.png todas "added" → ordem enviada ["c.png", "b.png", "a.png"]; onAdded na mesma ordem
// onProgress: [0,3], [1,3], [2,3], [3,3]
// resumo { found: 3, added: 3, identical: 0, refused: [], ignored: 0, notImported: 0, stopped: false, failed: false }

test("CA-6.6 CA-6.7 runImport counts identical and refused images and goes on", ...);
// "P/a.png" identical, "P/b.png" unsupported-type, "P/c.png" added, "P/x.txt",
//   "P/big.png" com MAX_IMAGE_BYTES + 1 bytes
// → big.png não é enviada; resumo found 4, added 1, identical 1, ignored 1, notImported 0,
//   refused [{ path: "P/big.png", code: "too-large" }, { path: "P/b.png", code: "unsupported-type" }]

test("CA-6.5 runImport stops before the next send once asked, and counts what was not imported", ...);
// 5 imagens; shouldStop passa a true depois do 2º upload → 2 enviadas;
//   resumo added 2, notImported 3, stopped true, failed false

test("CA-6.10 runImport stops when a send gets no answer", ...);
// 3 imagens; a 2ª enviada dá "generic" → nenhuma outra é enviada;
//   resumo added 1, notImported 2, stopped true, failed true

test("CA-6.8 runImport with no image files sends nothing", ...);
// só "P/notes.txt" → upload nunca chamado; resumo found 0, ignored 1; onProgress [0, 0]
```

`e2e/import.spec.ts` (nos dois navegadores; cada teste cria uma pasta de trabalho com `mkdtemp` e a apaga no `afterEach`; as imagens vêm de `makeImageFile` com cores diferentes, salvo quando o teste quer idênticas; "segurar" um envio é `page.route(/\/api\/images\?skipIdentical=1$/, ...)` guardando a `route` num vetor que o teste libera com `route.continue()`):

```ts
test("CA-6.1 CA-6.3 CA-6.7 CA-6.8 importing a folder with the button brings its images in path order and sums up", ...);
// pasta "Pasta de tésté": a.png, D.PNG (conteúdo PNG), sub/b.jpg, sub/deep/c.webp, notes.txt (texto),
//   anim.gif (texto), broken.png (texto). Sem arquivo começado por ponto: o navegador pode omiti-lo.
// guardar os bytes dos originais; goto; folderInput.setInputFiles(pasta)
// importStatus contém "Import finished.", "Added to the library: 4", "Refused: 1",
//   "Pasta de tésté/broken.png: unsupported type. Use PNG, JPEG or WebP.",
//   "Files ignored because they are not images: 2"; não contém "Already" nem "Not imported"
// gridAlts ["a.png", "D.PNG", "b.jpg", "c.webp"]; "0 of 4 selected"; os originais não mudaram
// botão "Close summary" → importStatus count 0

test("CA-6.6 identical images are skipped, also inside the same folder, and importing the same folder twice adds nothing", ...);
// old.png (vermelho) adicionada por "Add images" (setInputFiles no input sem webkitdirectory)
// pasta: copia.png = cópia byte a byte de old.png; x1.png (verde); x2.png = cópia de x1.png
// importar → "Added to the library: 1", "Already in the library: 2"; gridAlts ["x2.png", "old.png"]
//   (x2.png é a última na ordem, então é enviada primeiro e entra; x1.png é pulada)
// importar a mesma pasta de novo → "Already in the library: 3"; sem "Added"; gridAlts igual

test("CA-6.4 CA-6.5 during an import the screen shows progress, blocks adding, stays usable, and Stop keeps what entered", ...);
// drop old (laranja, pelo helper drop); pasta com 1.png a 5.png (cores diferentes); segurar os envios
// importar → importStatus "Importing 0 of 5 images"; botões "Add images" e "Import folder" desativados
// drop(page, [{ name: "z.png", content: "image/png" }]) → alerta contém
//   "Wait for the import to finish, or stop it, before adding more images."; gridAlts ["old.png"]
// checkbox de old.png → "1 of 1 selected"; abrir old.png pelo "Annotate" e fechar
// liberar o 1º → "Importing 1 of 5 images"; gridAlts ["5.png", "old.png"]
// "Stop"; liberar o 2º → "Import stopped.", "Added to the library: 2", "Not imported: 3"
// foram feitos 2 envios; os botões voltam a estar ativos; gridAlts ["4.png", "5.png", "old.png"]

test("CA-6.9 starting an import turns the tag filter off", ...);
// drop a; etiqueta "ui" em a (abrir, Enter, fechar); filtro "ui"
// importar uma pasta com n.png → "Filter by tag" com valor ""; gridAlts ["n.png", "a.png"]

test("CA-6.10 when refpack stops during an import, the import stops, says it could not save, and sums up", ...);
// pasta 1.png a 3.png; page.route: o 1º envio continua, os outros route.abort("connectionrefused")
// importar → alerta contém "Could not save. Check that refpack is still running in the terminal.";
//   "Import stopped.", "Added to the library: 1", "Not imported: 2"; foram feitos 2 envios

test("CA-6.11 closing the screen in the middle keeps what entered, and importing again brings only the rest, in the same order", ...);
// pasta 1.png a 5.png; segurar; importar; liberar o 1º e o 2º; com o 3º segurado, page.reload()
//   e então route.abort() no 3º (dentro de try/catch); page.unroute
// gridAlts ["4.png", "5.png"]; nenhuma "Import" na tela
// importar de novo → "Added to the library: 3", "Already in the library: 2";
//   gridAlts ["1.png", "2.png", "3.png", "4.png", "5.png"]

test("CA-6.8 a folder with no image files says no image was found", ...);
// pasta só com notes.txt → "No images found in the folder.",
//   "Files ignored because they are not images: 1"; images count 0

test("CA-6.14 imported images come back after a restart, in the same order, with thumbnails", ...);
// importar 1.png a 3.png → gridAlts ["1.png", "2.png", "3.png"]; app.restart(); goto
// gridAlts igual; gridSrc de cada uma passa em /\/thumb$/ (poll)

test("CA-6.8 the import follows the screen language", ...);
// língua "Português"; botão "Importar pasta" visível; pasta com a.png e notes.txt; importar
// getByRole("region", { name: "Importação" }) contém "Importação concluída.",
//   "Entraram na biblioteca: 1", "Arquivos ignorados por não serem imagem: 1"; botão "Fechar resumo"
```

Run: `pnpm test` e `pnpm test:e2e` → Expected: os testes novos FALHAM (os de ponta a ponta, nos dois navegadores); os antigos passam.

- [ ] **Step 2: Implementar** `import.ts`. Run: `pnpm test` → PASS.

`git commit -m "feat: plan and run a folder import one image at a time"`

- [ ] **Step 3: Implementar** o resto, conforme Interfaces, com os textos da Tarefa 4.

Run: `pnpm check` → Expected: PASS.

- [ ] **Step 4: Commit**

`git commit -m "feat: import a folder with a button, with progress, stop and summary"`

---

### Task 5: Importar soltando uma pasta (tela)

**Modelo:** Sonnet, esforço `medium`.
**Critérios:** CA-6.2, CA-6.4 (soltar durante a importação); mudanças em CA-1.1, CA-1.7 e CA-3.10; ADR-0021, itens 1 e 2.

**Files:**
- Create: `src/web/import/dropped.ts`
- Modify: `src/web/library/IncomingFiles.tsx`, `src/web/App.tsx`, `src/web/i18n/pt-BR.ts`, `src/web/i18n/en.ts`, `e2e/drop.spec.ts`, `e2e/paste.spec.ts`

**Interfaces:**
- Consumes: `Entry` e `useImport().start` (Tarefa 4).
- Produces, em `src/web/import/dropped.ts`:

```ts
// The entries of what was dropped (webkitGetAsEntry of each "file" item). Must run before the first
// await: the browser empties the data after the handler returns.
export function takeEntries(data: DataTransfer | null): FileSystemEntry[];
// Every file under the entries, at any depth, each with its path: entry.fullPath without the
// leading "/" ("Pasta/sub/a.png"; a loose file is just its name). Each folder is read with
// createReader().readEntries until it answers an empty batch. A folder or file the browser cannot
// read is left out.
export async function readDropped(entries: FileSystemEntry[]): Promise<Entry[]>;
```

- Changes, em `IncomingFiles.tsx`: nova prop `onImport: (entries: Entry[]) => void`. No `drop`, nesta ordem: imagem aberta (`paused`) → nada, como hoje (CA-3.10); `busy` com arquivos ou pastas → `import.busy` (Tarefa 4); **há pelo menos uma pasta** → `const entries = takeEntries(data)` ainda antes de qualquer `await`, depois `void readDropped(entries).then(onImport)`, e nenhum aviso de pasta; sem pasta → como hoje. Colar uma pasta continua mostrando `error.folder`, com o texto novo.
- Changes, em `App.tsx`: `<IncomingFiles ... onImport={importer.start} />`.
- Dicionários: `library.hint` e `error.folder` mudam, com os textos da tabela.

- [ ] **Step 1: Testes que falham**

`e2e/paste.spec.ts`: o teste `CA-1.1` passa a esperar `"You can also paste with Ctrl+V or drag files and folders onto this screen."`.

`e2e/drop.spec.ts`, dentro de `test.describe("real files and folders from disk")` (só Chromium, ADR-0010): os dois testes `CA-1.7` saem e entram:

```ts
test("CA-6.2 a dropped folder, with the files dropped with it, becomes one import", ...);
// a.png (vermelho) solto; pasta "Pasta de tésté" com inner.png (verde), sub/deep.jpg e notes.txt
// guardar os bytes; dropPaths(page, [a, pasta])
// importStatus contém "Import finished.", "Added to the library: 3",
//   "Files ignored because they are not images: 1"; nenhum alerta com "folder"
// gridAlts ["a.png", "inner.png", "deep.jpg"]; os originais não mudaram

test("CA-6.2 two folders dropped together become one import", ...);
// pastas "A" (um.png, vermelho) e "B" (dois.png, verde) → um só importStatus, "Added to the library: 2";
//   gridAlts ["um.png", "dois.png"]

test("CA-3.10 with an image open, dropping a folder adds nothing and shows nothing", ...);
// dropPaths([a]) → 1 imagem; abrir a.png; dropPaths([pasta com x.png]) → nenhum alerta,
//   importStatus count 0; fechar → images count 1

test("CA-6.4 dropping a folder during an import shows the busy notice and adds nothing", ...);
// pasta1 com 1.png e 2.png; segurar os envios (como na Tarefa 4); importar pasta1 pelo botão
// dropPaths([pasta2 com z.png]) → alerta contém "Wait for the import to finish, or stop it,
//   before adding more images."; liberar os envios → "Added to the library: 2"; gridAlts sem "z.png"
```

Run: `pnpm test:e2e` → Expected: os testes novos e o `CA-1.1` FALHAM no Chromium; os outros passam.

- [ ] **Step 2: Implementar** conforme Interfaces, com os textos da Tarefa 5.

Run: `pnpm check` → Expected: PASS.

- [ ] **Step 3: Commit**

`git commit -m "feat: import the folders dropped on the screen"`

- [ ] **Step 4: Conferência final da fatia — feita pelo condutor**

Run: `pnpm check` → PASS, saída guardada para o relatório.
Run: `gh pr checks` → todos os jobs verdes.
Conferir que CA-6.1 a CA-6.15 têm teste com o identificador no nome: `grep -rhoE "CA-6\.[0-9]+" src e2e | sort -u`.

Só então: revisão da fatia (Opus, contexto limpo) e teste de uso, conforme `docs/WORKFLOW.md`.

- [ ] **Step 5: Depois do "aprovado" do dono**

Em `ROADMAP.md`, a fatia 6 passa a `feita` e a fatia 7 a `próxima`. Commit: `docs: mark slice 6 as done`. Merge do pull request.

---

## Roteiro de teste de uso

Feito por um agente, no Chrome, com uma biblioteca fabricada (ADR-0019 e `docs/WORKFLOW.md`, seção 5). As imagens são geradas na hora, com cores diferentes entre si, salvo onde o roteiro pede cópias idênticas.

**Começo (no `main`, versão anterior):** adicione pelo botão "Adicionar imagens" três imagens: `antiga-1.png`, `antiga-2.jpg` e `antiga-3.webp`. Escreva uma nota em `antiga-1.png`, marque uma parte dela como "gosto", coloque a etiqueta "velha" em `antiga-2.jpg`, selecione `antiga-3.webp` e escreva uma intenção. Guarde fora da biblioteca uma cópia byte a byte de `antiga-1.png`, que vai para a pasta do passo 3.

1. Rode o app a partir do branch da fatia e abra a tela.
   **Esperado:** as três imagens, a nota, a marcação, a etiqueta, a seleção e a intenção continuam iguais. Depois de alguns segundos, a pasta `thumbs/` da biblioteca tem três arquivos, e a grade tem a mesma aparência de antes. *(CA-6.15, CA-6.12)*
2. Olhe a tela.
   **Esperado:** ao lado de "Adicionar imagens" há o botão "Importar pasta", e a dica fala de arrastar arquivos e pastas. *(CA-6.1, CA-1.1)*
3. Monte a pasta "Referências de tésté" com: `capa.png`; `panorama.png` com 3000 × 1000 pontos, com a faixa da esquerda e a da direita pretas e o terço do meio branco; `copia-da-antiga.png` (a cópia guardada no começo); `dup-1.png`; `notas.txt`; `anim.gif` (um texto com esse nome); `quebrada.png` (um texto com esse nome); e a subpasta `Telas` com `login.jpg`, `painel.WEBP`, `dup-2.png` (cópia byte a byte de `dup-1.png`) e a subpasta `Detalhes`, com `tabela.PNG`. Clique em "Importar pasta" e escolha essa pasta. *(Fora do alcance do agente: a janela do sistema. Equivalente: entregar a pasta ao campo de arquivo pela ferramenta de navegador.)*
   **Esperado:** aparece "Importando N de 9 imagens" e, no fim, o resumo: "Importação concluída.", "Entraram na biblioteca: 6", "Já estavam na biblioteca: 2", "Recusadas: 1" com "Referências de tésté/quebrada.png: tipo não aceito…", "Arquivos ignorados por não serem imagem: 2". A grade começa com `capa.png`, `panorama.png`, `tabela.PNG`, `dup-2.png`, `login.jpg`, `painel.WEBP`, seguidas das três antigas. Nenhuma está selecionada além de `antiga-3.webp`. *(CA-6.1, CA-6.3, CA-6.6, CA-6.7, CA-6.8)*
4. Olhe `panorama.png` na grade e depois clique em "Anotar" nela.
   **Esperado:** na grade, um quadrado branco (o centro). Aberta, a imagem inteira, com as faixas pretas. *(CA-6.12)*
5. Clique em "Fechar resumo" e importe a mesma pasta de novo.
   **Esperado:** o resumo diz "Já estavam na biblioteca: 8" e "Recusadas: 1"; nenhuma imagem nova na grade. *(CA-6.6)*
6. Filtre a grade pela etiqueta "velha" e importe uma pasta com uma imagem nova, `nova.png`.
   **Esperado:** o filtro volta a "Todas as imagens", e `nova.png` aparece primeiro. *(CA-6.9)*
7. Monte uma pasta "Lote" com 300 imagens (`0001.png` a `0300.png`). Importe-a e, enquanto o andamento aparece: selecione uma imagem; abra e feche uma imagem; confira que "Adicionar imagens" e "Importar pasta" estão desativados; cole uma imagem (Ctrl+V). Depois clique em "Parar".
   **Esperado:** selecionar, abrir e fechar funcionam; colar mostra o aviso de esperar a importação terminar, e nada entra por ele. Depois de "Parar", o resumo diz "Importação parada.", quantas entraram e quantas não chegaram a ser importadas. *(CA-6.4, CA-6.5)*
8. Importe a pasta "Lote" de novo, até o fim.
   **Esperado:** entram só as que faltavam; o resumo conta as outras como já estavam; a grade mostra `0001.png` a `0300.png` em ordem, de cima para baixo. *(CA-6.6, CA-6.11)*
9. Monte uma pasta "Lote 2" com 300 imagens novas, importe-a e recarregue a página no meio.
   **Esperado:** a importação para; as que entraram estão na grade. Importe "Lote 2" de novo: entram só as que faltavam, e a grade fica em ordem. *(CA-6.11)*
10. Monte "Lote 3" com 300 imagens novas, importe-a e, no meio, pare o refpack (encerre o processo).
    **Esperado:** aparece o aviso de que não foi possível salvar e o resumo com "Importação parada." e o que entrou. Rode o app de novo e recarregue: as que entraram estão lá. *(CA-6.10)*
11. Arraste para a tela uma pasta "Solta" com duas imagens e um `.txt`, junto com um arquivo solto `avulsa.png`. *(Fora do alcance do agente: arrastar do gerenciador de arquivos. Equivalente: o evento de soltar com os caminhos reais, pelo protocolo do Chrome.)*
    **Esperado:** uma importação só: "Entraram na biblioteca: 3" e "Arquivos ignorados por não serem imagem: 1". *(CA-6.2)*
12. Abra uma imagem e, com ela aberta, solte a pasta "Solta" de novo (pelo mesmo equivalente).
    **Esperado:** nada acontece: nenhum aviso, nenhuma importação. *(CA-3.10)*
13. Pare o app, rode de novo e abra a tela.
    **Esperado:** a mesma grade, na mesma ordem, com as miniaturas. *(CA-6.14)*
14. Em outra biblioteca, nova e vazia, importe uma pasta com 10.000 imagens pequenas e diferentes, e espere terminar (anote quanto tempo levou). Recarregue a página e meça, com o relógio da página: o tempo até as primeiras imagens da grade aparecerem; o tempo entre clicar numa imagem para selecioná-la e a seleção aparecer; o tempo entre escolher um filtro e a grade mudar (coloque antes uma etiqueta em 5 imagens); o tempo entre clicar em "Anotar" e a imagem abrir. Role a grade até o fim.
    **Esperado:** primeiras imagens em até 3 segundos; selecionar, filtrar e abrir em menos de meio segundo cada; a rolagem não trava e as imagens aparecem conforme chegam à tela. *(CA-6.13)*
15. Na primeira biblioteca, selecione `panorama.png` e `capa.png`, gere o pacote e leia a pasta gerada.
    **Esperado:** `refs/` tem as duas imagens originais: `panorama.png` com 3000 × 1000 pontos e as faixas pretas, byte a byte igual ao arquivo da pasta importada. *(CA-6.12)*
