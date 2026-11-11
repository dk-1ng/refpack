# Fatia 3 — Nota geral: plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task, with the overrides in `docs/WORKFLOW.md`. Steps use checkbox (`- [ ]`) syntax for tracking.

**Objetivo:** o dono abre uma imagem em tamanho grande, escreve uma nota sobre ela e passa para a seguinte; a nota se guarda sozinha, fica exatamente como ele escreveu e sai no pacote.

**Arquitetura:** a nota é uma coluna nova na tabela de imagens e chega à tela junto com a lista de imagens (ADR-0013). O servidor ganha uma rota para gravá-la e o pacote passa a levar um arquivo `notes/NN.md` por nota. Na tela, cada imagem da grade ganha um botão "Nota" que abre um `<dialog>` modal do navegador (ADR-0014) com a imagem grande e a caixa da nota, que salva pela fila que já existe (ADR-0012).

**Stack:** a das fatias 0 a 2, sem dependência nova.

**Spec:** `SPEC.md`, seção 9 (critérios CA-3.1 a CA-3.10). ADRs 0004, 0007, 0008, 0010, 0012, 0013 e 0014.

## Para o dono: o que esta fatia entrega

| Tarefa | O que passa a existir | Critérios |
| --- | --- | --- |
| 1. Nota no servidor | A biblioteca guarda uma nota por imagem. Nada muda na tela ainda. | base de CA-3.2, 3.6, 3.8 |
| 2. Nota no pacote | O pacote sai com um arquivo de nota para cada imagem selecionada que tem nota. Nada muda na tela ainda. | base de CA-3.7 |
| 3. Abrir a imagem e escrever a nota | O botão "Nota", a imagem grande com a caixa ao lado, o "Salvo", o "Fechar" e o Esc, e o sinal na grade. | CA-3.1, 3.2, 3.3, 3.5, 3.6, 3.7, 3.9 |
| 4. Anterior e próxima | Os dois botões para anotar várias imagens em sequência. | CA-3.4, 3.9 |
| 5. Colar, soltar e começar outro pacote | Com uma imagem aberta, colar e soltar não adicionam nada. "Começar outro pacote" não apaga notas. | CA-3.8, 3.10 |

O roteiro do seu teste manual, no Firefox, está no fim deste arquivo.

**O que os testes automáticos não cobrem:** colar um texto de verdade dentro da caixa da nota (CA-3.10; o teste só confere que nenhum aviso aparece), arrastar um arquivo de verdade com uma imagem aberta, a aparência da imagem grande e do sinal de nota, e a leitura do pacote pelo Claude Code (CA-3.7). Esses pontos ficam para o seu teste manual.

## Global Constraints

- Nenhuma dependência nova. O esquema do banco é exatamente o da migração `004` deste plano.
- Só existem os arquivos listados em "Estrutura de arquivos". Precisou de outro: pare e reporte.
- A rota nova valida a entrada com zod (ADR-0007, item 3) e fica atrás do `localOnly` que já existe.
- O texto da nota nunca é alterado: nada de `trim`, de trocar quebras de linha ou de normalizar. O único `trim` permitido é para **decidir** se a nota está vazia.
- Limite da nota: `MAX_NOTE_LENGTH = 10_000`, o mesmo valor no `maxLength` da caixa e no zod do servidor.
- A tela só mostra o que o servidor confirmou (ADR-0012): o sinal de nota na grade e o "Salvo" só mudam depois da resposta do servidor.
- A fila de salvamento é a de `src/web/pack/saver.ts`, sem mudança nenhuma nesse arquivo. Nenhum temporizador no salvamento. Nenhum `waitForTimeout` nos testes.
- Todo texto visível vem dos dicionários `pt-BR` e `en`, com exatamente os textos da tabela "Textos novos". O texto do dono é sempre exibido como texto (ADR-0007, item 6).
- O código do produto não tem ramo por navegador nem por sistema operacional (ADR-0010, R11). Um teste que só passa com tratamento especial: pare e reporte.
- Nenhum arquivo de imagem é commitado. Os testes fabricam as imagens.
- Todo teste que cobre um critério traz o identificador no nome, por exemplo `"CA-3.7 ..."`.
- Testes das fatias 0 a 2 só mudam onde este plano diz. Outro teste antigo quebrou: pare e reporte.
- Commits em inglês, Conventional Commits, um por passo de commit do plano.
- Ao fim de cada tarefa o condutor envia o branch e espera o CI verde antes de começar a próxima.

## Textos novos

| Chave | `pt-BR` | `en` | Tarefa |
| --- | --- | --- | --- |
| `note.open` | Nota | Note | 3 |
| `note.has` | Tem nota | Has a note | 3 |
| `note.label` | Nota desta imagem | Note on this image | 3 |
| `note.placeholder` | O que aproveitar e o que evitar nesta imagem. | What to take from this image and what to avoid. | 3 |
| `note.confirmLeave` | Esta nota não foi salva. Sair mesmo assim? | This note was not saved. Leave anyway? | 3 |
| `viewer.close` | Fechar | Close | 3 |
| `viewer.previous` | Anterior | Previous | 4 |
| `viewer.next` | Próxima | Next | 4 |

"Salvo" e o aviso de que não foi possível salvar reutilizam as chaves `intent.saved` e `error.notSaved`, que já existem.

## Review Focus

Condições que o dono pode causar em uso normal. Todas têm critério no SPEC; cada uma tem seu teste na tarefa indicada.

1. Abrir a biblioteca que ele já tem, criada nas fatias 0 a 2 → as imagens, a seleção e a intenção continuam iguais, e toda nota começa vazia; CA-0.6, CA-2.5 e definições da seção 9 (Tarefa 1).
2. Nota com acentos, emoji, linhas em branco, espaços no começo e no fim e símbolos de Markdown → `notes/NN.md` idêntico, byte a byte; CA-3.7 (Tarefa 2).
3. Digitar, fechar a imagem e clicar em "Gerar pacote" logo em seguida → o texto inteiro está no pacote; CA-3.3 e CA-3.7 (Tarefa 3).
4. Apagar toda a nota, ou deixar só espaços → o sinal some da grade e o pacote não ganha arquivo para ela; CA-3.5 e CA-3.7 (Tarefas 2 e 3).
5. Duas imagens com o mesmo nome (o mesmo arquivo adicionado duas vezes) → a nota de uma não aparece na outra; CA-3.1 e CA-3.5 (Tarefa 3).

## Estrutura de arquivos

```
src/server/migrations/004-image-note.sql   novo: coluna note
src/server/library.ts  library.test.ts     modificados: a imagem lida traz note; setNote
src/server/app.ts  app.test.ts             modificados: rota da nota
src/server/pack.ts  pack.test.ts           modificados: notes/NN.md e a linha do README
src/shared/api.ts                          modificado: note na imagem, schema e limite
src/web/api.ts                             modificado: saveNote
src/web/App.tsx                            modificado: qual imagem está aberta; liga tudo
src/web/library/ImageGrid.tsx              modificado: botão "Nota" e sinal de nota
src/web/library/IncomingFiles.tsx          modificado: pausa com uma imagem aberta
src/web/note/use-note.ts                   novo: o texto da nota aberta e a fila dela
src/web/note/ImageViewer.tsx               novo: o diálogo com a imagem grande e a caixa
src/web/i18n/pt-BR.ts  en.ts               modificados: textos novos
src/web/styles.css                         modificado
e2e/notes.spec.ts                          novo
e2e/start-over.spec.ts                     modificado: um teste novo (CA-3.8)
```

Nos testes de ponta a ponta, as imagens entram por `drop(page, [...])` de `e2e/support.ts`. Soltar `a.png`, `b.jpg`, `c.webp` deixa a grade na ordem `c.webp`, `b.jpg`, `a.png`. Localizadores usados abaixo:

```ts
const images = page.getByRole("list").getByRole("img");
const item = (name: string) => page.getByRole("listitem").filter({ has: page.getByAltText(name) });
const noteButton = (name: string) => item(name).getByRole("button", { name: "Note" });
const mark = (name: string) => item(name).getByTitle("Has a note");
const viewer = page.getByRole("dialog");
const note = viewer.getByLabel("Note on this image");
const status = viewer.getByRole("status");
const button = (name: string) => viewer.getByRole("button", { name });
```

Com a imagem aberta, o que está por baixo do diálogo não responde: os testes fecham a imagem antes de mexer na grade ou no seletor de língua (ADR-0014).

---

### Task 1: A biblioteca guarda a nota (servidor)

**Modelo:** Sonnet, esforço `medium`.
**Critérios:** base de CA-3.2, CA-3.6, CA-3.8; ADR-0013, itens 1 a 3.

**Files:**
- Create: `src/server/migrations/004-image-note.sql`
- Modify: `src/server/library.ts`, `src/server/library.test.ts`, `src/server/app.ts`, `src/server/app.test.ts`, `src/shared/api.ts`

Antes do Step 1, o condutor confere que está no branch `slice/03-image-note` (criado pelo arquiteto ao aprovar o plano).

**Interfaces:**
- Migração `004-image-note.sql`, exatamente:

```sql
ALTER TABLE images ADD COLUMN note TEXT NOT NULL DEFAULT '';
```

- Changes, em `src/shared/api.ts`: `export const MAX_NOTE_LENGTH = 10_000;`; `ImageSchema` ganha `note: z.string()`; novo schema:

```ts
// The body of PUT /api/images/:id/note.
export const NoteSchema = z.object({ note: z.string().max(MAX_NOTE_LENGTH) });
```

- Changes, em `src/server/library.ts`: `StoredImage` ganha `note: string`; `listImages`, `findImage` e `addImage` passam a devolvê-lo (imagem nova: `""`); a linha lida do banco é conferida com zod (`note: z.string()`).
- Produces, em `src/server/library.ts`:

```ts
// False when no image has this id; nothing changes then.
// The text is stored exactly as given: no trimming, no normalization.
export function setNote(library: Library, id: string, note: string): boolean;
```

- Changes, em `src/server/app.ts`:
  - `toImage` passa a incluir `note`.
  - A constante `MAX_INTENT_REQUEST_BYTES` passa a se chamar `MAX_TEXT_REQUEST_BYTES` (mesmo valor, `128 * 1024`) e vale para as duas rotas de texto.
  - `PUT /api/images/:id/note`: `bodyLimit` de `MAX_TEXT_REQUEST_BYTES` → `413` com `too-large`; corpo que não é JSON ou não passa no `NoteSchema` → `400` com `invalid-request`; id desconhecido ou malformado → `404` com `not-found`; gravou → `204`. As conferências acontecem nessa ordem.

- [ ] **Step 1: Testes que falham**

`const NOTE = "  # Gosto do espaçamento 🍇\n\n\t* evitar o \`azul\` & a sombra  \n";` nos dois arquivos de teste.

`src/server/library.test.ts`:

```ts
test("CA-0.6 a library created before slice 3 opens with empty notes and keeps selection and intent", ...);
// banco antigo montado à mão, como no teste "created before slice 2": aplicar 001, 002 e 003, user_version = 3
// inserir uma imagem com selected = 1; UPDATE pack_draft SET intent = 'antiga'
// abrir → listImages = [{ ...a mesma imagem, selected: true, note: "" }]; getIntent = "antiga"

test("CA-3.2 setNote stores the text exactly as given", ...);
// a.png e b.jpg adicionadas; setNote(library, b.id, NOTE) → true
// listImages(library).map((i) => i.note) = [NOTE, ""]; findImage(library, b.id)?.note === NOTE

test("setNote answers false for an unknown id and changes nothing", ...);
// id "3f2b8a52-6c1e-4b0f-9a4d-1d2c3b4a5e6f" → false; todas as notas continuam ""

test("CA-3.6 the notes are still there after closing and reopening the library", ...);
// setNote(b.id, NOTE); closeLibrary; openLibrary(mesma raiz) → notas = [NOTE, ""]

test("CA-3.8 clearing the selection keeps every note", ...);
// setNote(a.id, NOTE); setSelected(a.id, true); setAllSelected(library, false) → findImage(a.id)?.note === NOTE
```

`src/server/app.test.ts`:

```ts
test("CA-3.2 PUT /api/images/:id/note stores the text and GET /api/images returns it unchanged", ...);
// upload → a imagem devolvida tem note === ""
// PUT { note: NOTE } → 204; GET /api/images → images[0].note === NOTE

test("PUT /api/images/:id/note takes 10 000 characters and refuses 10 001", ...);
// "x".repeat(MAX_NOTE_LENGTH) → 204; com +1 → 400 invalid-request; a nota guardada continua a de 10 000

test("PUT /api/images/:id/note answers 404 not-found for an unknown or malformed id", ...);
// ids "3f2b8a52-6c1e-4b0f-9a4d-1d2c3b4a5e6f" e "not-a-uuid", com corpo válido

test("PUT /api/images/:id/note answers 400 invalid-request for a wrong body", ...);
// corpos: "{}", '{"note":5}', "not json" → 400; GET mostra note === ""

test("PUT /api/images/:id/note answers 413 too-large above 128 KiB", ...);
// corpo "x".repeat(128 * 1024 + 1) → 413 too-large

test("CA-0.11 the note route is behind the local-only guard", ...);
// PUT com host "evil.example" → 403
```

Nos testes antigos que comparam uma imagem inteira com `toEqual`, acrescente `note: ""` ao esperado; nada mais muda neles.

Run: `pnpm test` → Expected: os testes novos FALHAM; os antigos passam.

- [ ] **Step 2: Implementar** conforme Interfaces.

Run: `pnpm check` → Expected: PASS. A tela não mudou.

- [ ] **Step 3: Commit**

`git commit -m "feat: store a note for each image"`

---

### Task 2: A nota sai no pacote (servidor)

**Modelo:** Sonnet, esforço `medium`.
**Critérios:** base de CA-3.7; ADR-0013, item 4.

**Files:**
- Modify: `src/server/pack.ts`, `src/server/pack.test.ts`

**Interfaces:**
- Consumes: `StoredImage.note` e `setNote` (Tarefa 1).
- Changes, em `src/server/pack.ts` — a assinatura de `createPack` não muda:
  - Uma imagem **tem nota** quando `image.note.trim() !== ""`.
  - Para cada imagem selecionada que tem nota, grava `notes/NN.md`, com `NN` igual ao número da imagem em `refs/` (o mesmo `refNumber`), e o conteúdo `image.note` sem nenhuma mudança. A pasta `notes/` só é criada se houver pelo menos uma.
  - No `README.md`, a linha de uma referência que tem nota passa a ser ``2. `refs/02.jpg` — note: `notes/02.md` ``; a de uma sem nota continua como hoje.
  - Se alguma imagem do pacote tem nota, o `README.md` ganha um parágrafo, depois do parágrafo do `INTENT.md` (quando existe) e antes de `- Created:`, separado por uma linha em branco, com exatamente este texto:

    `Some references have a note from the owner, shown next to the image in the list below. Read each note together with its image: it says what to take from that reference and what to avoid. The notes are in the owner's own words and may be in a language other than English.`

  - Sem nenhuma nota, o `README.md` sai byte a byte como hoje.

- [ ] **Step 1: Testes que falham**

`src/server/pack.test.ts` (`NOTE` como na Tarefa 1; `NOTES_LINE` = o parágrafo acima; grade de `fillLibrary`: `c.webp`, `b.jpg`, `a.png`; `b = listImages(library)[1]`):

```ts
test("CA-3.7 a selected image with a note gets notes/NN.md with exactly the text, and the README points to it", ...);
// fillLibrary; setAllSelected(true); setIntent(INTENT); setNote(b.id, NOTE)
// readdirSync(join(path, "notes")) = ["02.md"]
// readFileSync(join(path, "notes", "02.md")) é igual a Buffer.from(NOTE, "utf8")
// README.md é exatamente: [..., "", INTENT_LINE, "", NOTES_LINE, "", "- Created: 2026-11-09 14:05:09",
//   "- References: 3", "", "## References", "", "1. `refs/01.webp`",
//   "2. `refs/02.jpg` — note: `notes/02.md`", "3. `refs/03.png`", ""].join("\n")

test("CA-3.7 the note file takes the number the image has in this pack, and unselected notes stay out", ...);
// fillLibrary; selecionar só a.png e c.webp; setNote(a.id, "on a"); setNote(b.id, "on b")
// readdirSync(refs).sort() = ["01.webp", "02.png"]; readdirSync(notes) = ["02.md"]; notes/02.md === "on a"
// README contém "2. `refs/02.png` — note: `notes/02.md`" e "1. `refs/01.webp`\n"

test("CA-3.7 an empty or blank note leaves no file, no folder and no mention", ...);
// para cada nota em ["", " \n\t "]: fillLibrary; setAllSelected(true); setNote(b.id, nota)
// existsSync(join(path, "notes")) === false; README === expectedReadme(false)
```

O teste `CA-0.9 CA-2.9 generating a pack leaves the library unchanged` ganha uma nota em `b` antes de gerar; a comparação de `listImages` que ele já faz passa a cobrir a nota.

Run: `pnpm test` → Expected: os testes novos FALHAM; os antigos passam.

- [ ] **Step 2: Implementar** conforme Interfaces.

Run: `pnpm check` → Expected: PASS. A tela não mudou.

- [ ] **Step 3: Commit**

`git commit -m "feat: export each selected image's note in the pack"`

---

### Task 3: Abrir a imagem e escrever a nota (tela)

**Modelo:** Sonnet, esforço `medium`.
**Critérios:** CA-3.1, CA-3.2, CA-3.3, CA-3.5, CA-3.6, CA-3.7 (ponta a ponta), CA-3.9 (fechar); ADR-0012 e ADR-0014.

**Files:**
- Create: `src/web/note/use-note.ts`, `src/web/note/ImageViewer.tsx`, `e2e/notes.spec.ts`
- Modify: `src/web/api.ts`, `src/web/App.tsx`, `src/web/library/ImageGrid.tsx`, `src/web/i18n/pt-BR.ts`, `src/web/i18n/en.ts`, `src/web/styles.css`

**Interfaces:**
- Consumes: a rota e o `ImageSchema` da Tarefa 1; `createSaver` e `SaveState` de `src/web/pack/saver.ts`.
- Produces, em `src/web/api.ts` — `true` com resposta 2xx, `false` com qualquer outro status ou erro de rede; nunca lança:

```ts
export async function saveNote(id: string, note: string): Promise<boolean>;
```

- Produces, em `src/web/note/use-note.ts`:

```ts
export type NoteDraft = {
  text: string;
  saveState: SaveState;
  change(text: string): void; // shows the text in the box and pushes it to the saver
  flush(): Promise<boolean>;
};
// `saved` is the note the server last confirmed; it is read once, when the image opens.
export function useNote(
  id: string,
  saved: string,
  onSaved: (id: string, note: string) => void,
): NoteDraft;
```

  Cria **um** `Saver` por montagem. O envio dele chama `saveNote(id, text)` e, quando a resposta é `true`, chama `onSaved(id, text)` antes de devolver. A nota carregada não é enviada de volta.

- Produces, em `src/web/note/ImageViewer.tsx`:

```ts
export function ImageViewer(props: {
  image: Image;
  onClose: () => void;
  onSaved: (id: string, note: string) => void;
});
```

  - Desenha um `<dialog className="viewer" aria-label={image.originalName}>` com: `<img className="viewer-image" src={image.url} alt={image.originalName} />`; um `<label htmlFor="note">` com `note.label`; `<textarea id="note">` com `maxLength={MAX_NOTE_LENGTH}`, `placeholder` de `note.placeholder`, valor e `onChange` do `useNote(image.id, image.note, onSaved)`; `<span role="status">` com `intent.saved` quando `saveState === "saved"`, `error.notSaved` quando `"failed"`, vazio nos outros estados; e o botão `viewer.close`.
  - Ao montar, num `useLayoutEffect`: `dialog.showModal()` e depois `textarea.focus()`.
  - Sair passa sempre por uma função só, usada pelo botão e pela tecla Esc:

```ts
// Runs `then` once the note is saved; when it cannot be saved, asks first (CA-3.9).
// A call made while another one is still running is ignored.
async function leave(then: () => void): Promise<void>;
// body: if ((await note.flush()) || window.confirm(t("note.confirmLeave"))) then();
```

  - Esc: `onKeyDown` no `<dialog>` (tecla `Escape` → `preventDefault()` e `leave(onClose)`) e `onCancel` (`preventDefault()` e `leave(onClose)`). `onClose` do `<dialog>` (o navegador fechou por conta própria) → `props.onClose()`.

- Changes, em `ImageGrid.tsx`: nova prop `onOpenNote: (image: Image) => void`. Dentro de cada `<li>`, depois do `<label>`:

```tsx
<button type="button" className="note-button" onClick={() => onOpenNote(image)}>
  {t("note.open")}
  {image.note.trim() !== "" ? <span className="note-mark" title={t("note.has")} /> : null}
</button>
```

- Changes, em `App.tsx`:
  - Estado `openId: string | null`; `openImage` = a imagem do estado com esse id, ou `null`.
  - `noteSaved(id, note)`: troca o `note` dessa imagem no estado.
  - `<ImageGrid ... onOpenNote={(image) => setOpenId(image.id)} />`.
  - Quando `openImage !== null`: `<ImageViewer key={openImage.id} image={openImage} onClose={() => setOpenId(null)} onSaved={noteSaved} />`. O `key` faz cada imagem aberta ter o seu próprio texto e a sua própria fila.
- `styles.css`: o layout do diálogo vai em `.viewer[open]` (nunca em `.viewer` sozinho, que mostraria o diálogo fechado): duas colunas, a imagem à esquerda e a caixa à direita, ocupando quase toda a janela. `.viewer-image` tem `object-fit: contain` e nunca passa da área dela. `.note-mark` é um círculo pequeno e cheio, `display: inline-block`, ao lado do texto do botão. O `status` tem altura mínima de uma linha.

- [ ] **Step 1: Testes que falham**

`e2e/notes.spec.ts`, com os localizadores da seção "Estrutura de arquivos" e:

```ts
const TEXT = "  # Gosto do espaçamento 🍇\n\n* evitar o `azul` & a sombra  \n";

test("CA-3.1 the Note button opens the image large, whole, with the cursor in the note box", ...);
// drop a.png, b.jpg; noteButton("b.jpg").click()
// page.getByRole("dialog", { name: "b.jpg" }) visível; viewer.getByRole("img", { name: "b.jpg" }) visível
//   e com CSS object-fit "contain"; note focada e com valor ""
// button("Close").click() → viewer tem count 0; "0 of 2 selected" visível (abrir não seleciona)

test("CA-3.2 the note box shows a hint and saves by itself, in both languages", ...);
// drop a.png; abrir → note tem placeholder "What to take from this image and what to avoid."
//   e maxlength "10000"; status ""; note.fill("Great spacing") → status "Saved"; fechar
// língua "Português" → item("a.png").getByRole("button", { name: "Nota" }).click()
// viewer.getByLabel("Nota desta imagem") tem valor "Great spacing" e placeholder
//   "O que aproveitar e o que evitar nesta imagem."; botão "Fechar" visível

test("CA-3.2 CA-3.6 the note comes back exactly as typed after closing and opening again", ...);
// drop a.png; abrir; note.fill(TEXT); status "Saved"; fechar; app.restart(); goto
// mark("a.png") visível; abrir → note tem valor TEXT

test("CA-3.2 a note typed key by key is saved whole and in order", ...);
// abrir; note.pressSequentially("hello world"); status "Saved"; fechar; page.reload(); abrir → "hello world"

test("CA-3.1 CA-3.5 two images with the same name keep separate notes", ...);
// dois drops de a.png; abrir a primeira da grade; note.fill("first"); status "Saved"; fechar
// page.getByTitle("Has a note") tem count 1; abrir a segunda → note tem valor ""

test("CA-3.3 Close and Esc go back to the grid at the same point", ...);
// page.setViewportSize({ width: 800, height: 400 }); drop de 6 imagens png
// rolar até o fim: page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
// abrir a última imagem da grade; y = window.scrollY (> 0); button("Close").click()
//   → viewer count 0; window.scrollY === y
// abrir de novo; page.keyboard.press("Escape") → viewer count 0; window.scrollY === y

test("CA-3.3 CA-3.7 a note typed right before closing and generating is in the pack", ...);
// page.route("**/api/images/*/note", ...) segura o envio, como o teste CA-2.6 de intent.spec.ts
// drop a.png; "Select all"; abrir; note.fill(TEXT); button("Close").click()
// viewer continua visível (o envio está seguro); release() → viewer tem count 0
// "Generate pack" → readFile(join(path, "notes", "01.md"), "utf8") === TEXT
// README.md contém "1. `refs/01.png` — note: `notes/01.md`"

test("CA-3.5 the grid marks the images that have a note, without reloading", ...);
// drop a.png, b.jpg → page.getByTitle("Has a note") tem count 0
// abrir b.jpg; note.fill("x"); status "Saved"; fechar → mark("b.jpg") visível; mark("a.png") count 0
// abrir b.jpg; note.fill("  \n "); status "Saved"; fechar → mark("b.jpg") count 0

test("CA-3.9 a note that cannot be saved stays in the box with a warning, and closing asks first", ...);
// drop a.png; abrir; page.route("**/api/images/*/note", (route) => route.abort("connectionrefused"))
// note.pressSequentially("abc") → status "Could not save. Check that refpack is still running in the terminal."
// viewer.getByText("Saved", { exact: true }) tem count 0; note tem valor "abc"
// dialog do navegador: guardar a mensagem e dismiss(); button("Close").click()
//   → mensagem === "This note was not saved. Leave anyway?"; viewer visível; note tem valor "abc"
// dialog: dismiss(); page.keyboard.press("Escape") → viewer visível; note tem valor "abc"
// dialog: accept(); button("Close").click() → viewer count 0; mark("a.png") count 0
```

Run: `pnpm test:e2e` → Expected: os testes novos FALHAM nos dois navegadores; os outros passam.

- [ ] **Step 2: Implementar** conforme Interfaces, com os textos da Tarefa 3.

Run: `pnpm check` → Expected: PASS.

- [ ] **Step 3: Commit**

`git commit -m "feat: open an image large and write its note, saved automatically"`

---

### Task 4: Anterior e próxima

**Modelo:** Sonnet, esforço `medium`.
**Critérios:** CA-3.4, CA-3.9 (passar para outra).

**Files:**
- Modify: `src/web/note/ImageViewer.tsx`, `src/web/App.tsx`, `src/web/i18n/pt-BR.ts`, `src/web/i18n/en.ts`, `src/web/styles.css`, `e2e/notes.spec.ts`

**Interfaces:**
- Consumes: `ImageViewer` e a função `leave` da Tarefa 3.
- Changes, em `ImageViewer.tsx`: novas props `previousId: string | null`, `nextId: string | null` e `onOpen: (id: string) => void`. Dois botões, `viewer.previous` e `viewer.next`, antes do "Fechar"; cada um fica desativado quando o id dele é `null` e, ao clicar, chama `leave(() => onOpen(id))`.
- Changes, em `App.tsx`: `previousId` e `nextId` são os ids das imagens vizinhas de `openImage` na ordem do estado (a ordem da grade), ou `null` nas pontas; `onOpen={setOpenId}`. O `key` da Tarefa 3 já garante a nota e o cursor certos na imagem que passa a aparecer.

- [ ] **Step 1: Testes que falham**

`e2e/notes.spec.ts`:

```ts
test("CA-3.4 Next and Previous walk the grid order, each image with its own note", ...);
// drop a.png, b.jpg, c.webp; abrir c.webp → button("Previous") desativado; button("Next") ativado
// note.fill("on c"); button("Next").click() (sem esperar o "Saved")
// → page.getByRole("dialog", { name: "b.jpg" }) visível; note focada, valor ""
// note.fill("on b"); "Next" → dialog "a.png"; "Next" desativado
// "Previous" → dialog "b.jpg", note tem valor "on b"; "Previous" → dialog "c.webp", note tem valor "on c"
// fechar → mark("c.webp") e mark("b.jpg") visíveis; mark("a.png") count 0
// page.reload(); abrir c.webp → note tem valor "on c"

test("CA-3.4 the buttons follow the screen language", ...);
// língua "Português"; drop a.png, b.jpg; abrir b.jpg
// botões "Anterior" (desativado) e "Próxima" (ativado) dentro do diálogo

test("CA-3.9 moving to another image with an unsaved note asks first", ...);
// drop a.png, b.jpg; abrir b.jpg; route abort como na Tarefa 3; note.pressSequentially("abc")
// status mostra o aviso; dialog: dismiss(); button("Next").click()
//   → mensagem "This note was not saved. Leave anyway?"; dialog "b.jpg" visível; note tem valor "abc"
// dialog: accept(); button("Next").click() → dialog "a.png" visível; note tem valor ""
```

Run: `pnpm test:e2e` → Expected: os testes novos FALHAM nos dois navegadores.

- [ ] **Step 2: Implementar** conforme Interfaces, com os textos da Tarefa 4.

Run: `pnpm check` → Expected: PASS.

- [ ] **Step 3: Commit**

`git commit -m "feat: move to the previous and next image while writing notes"`

---

### Task 5: Colar, soltar e começar outro pacote

**Modelo:** Sonnet, esforço `medium`.
**Critérios:** CA-3.8, CA-3.10; mudanças em CA-1.2 a CA-1.8, CA-2.10 e CA-2.12.

**Files:**
- Modify: `src/web/library/IncomingFiles.tsx`, `src/web/App.tsx`, `e2e/notes.spec.ts`, `e2e/start-over.spec.ts`

**Interfaces:**
- Changes, em `IncomingFiles.tsx`: nova prop `paused: boolean`. Com `paused === true`:
  - colar: se o alvo é uma caixa de texto (`HTMLTextAreaElement`) e o que foi colado não traz arquivo nem pasta, não faz nada (o texto é da caixa); em qualquer outro caso, `event.preventDefault()` e mais nada;
  - `dragenter` e `dragover`: `event.preventDefault()`, sem mostrar o convite para soltar;
  - `drop`: `event.preventDefault()` e mais nada.

  Com `paused === false` nada muda em relação a hoje.
- Changes, em `App.tsx`: `<IncomingFiles ... paused={openImage !== null} />`.
- "Começar outro pacote" não muda de código: já não toca nas notas. A tarefa só acrescenta o teste.

- [ ] **Step 1: Testes que falham**

`e2e/notes.spec.ts` (`paste`, `pasteInto` e `drop` de `e2e/support.ts`; com a imagem aberta eles continuam podendo disparar os eventos):

```ts
test("CA-3.10 text pasted into the note box shows no notice", ...);
// drop a.png; abrir; pasteInto(note, [], "hello"); fechar → page.getByRole("alert") tem count 0

test("CA-3.10 with an image open, pasting and dropping add nothing and show no notice", ...);
// drop a.png; abrir; note.fill("abc"); status "Saved"; url = page.url()
// pasteInto(note, [{ name: "p.png", content: "image/png" }]); paste(page, [{ name: "q.png", content: "image/png" }])
// paste(page, [], "x"); drop(page, [{ name: "d.png", content: "image/png" }]); drop(page, [], "some text")
// só o dragenter com um arquivo, montado como no teste CA-1.5 de drop.spec.ts
//   → page.getByText("Drop to add") tem count 0
// note tem valor "abc"; page.url() === url; fechar
// depois de fechar, adicionar volta a funcionar: drop c.webp → images tem count 2
// page.getByRole("alert") tem count 0
```

`e2e/start-over.spec.ts`:

```ts
test("CA-3.8 starting another pack keeps every note", ...);
// drop a.png; abrir a nota; preencher "keep me"; "Saved"; fechar; clicar em a.png (seleciona)
// dialog: accept(); "Start another pack" → "0 of 1 selected"
// o sinal "Has a note" de a.png continua visível; abrir → a nota tem valor "keep me"
// page.reload() → o sinal continua visível
```

Run: `pnpm test:e2e` → Expected: o segundo teste de CA-3.10 FALHA nos dois navegadores; o primeiro e o de CA-3.8 podem já passar (o comportamento já existe; eles ficam como proteção).

- [ ] **Step 2: Implementar** conforme Interfaces.

Run: `pnpm check` → Expected: PASS.

- [ ] **Step 3: Commit**

`git commit -m "feat: pause pasting and dropping images while an image is open"`

- [ ] **Step 4: Conferência final da fatia — feita pelo condutor**

Run: `pnpm check` → PASS, saída guardada para o relatório.
Run: `gh pr checks` → todos os jobs verdes.
Conferir que CA-3.1 a CA-3.10 têm teste com o identificador no nome: `grep -rhoE "CA-3\.[0-9]+" src e2e | sort -u`.

Só então: revisão da fatia (Opus, contexto limpo), conforme `docs/WORKFLOW.md`.

- [ ] **Step 5: Depois do "aprovado" do dono**

Em `ROADMAP.md`, a fatia 3 passa a `feita` e a fatia 4 a `próxima`. Commit: `docs: mark slice 3 as done`. Merge do pull request.

---

## Roteiro de teste manual do dono

O condutor deixa o branch pronto e avisa. Faça no **Firefox**, com a sua biblioteca de verdade (a que você já usou nas fatias 0 a 2).

1. Rode `pnpm start`.
   **Esperado:** as suas imagens continuam todas lá, com a mesma seleção e a mesma intenção de antes. Cada imagem tem um botão "Nota". Nenhuma mostra o sinal de nota. *(CA-0.6, CA-2.5)*
2. Clique no botão "Nota" de uma imagem.
   **Esperado:** a imagem abre grande, inteira, sem cortes, com a caixa da nota ao lado. O cursor já está na caixa, que mostra uma dica. A imagem não foi selecionada nem tirada da seleção. *(CA-3.1)*
3. Escreva duas ou três linhas, com acentos e uma linha em branco no meio.
   **Esperado:** aparece "Salvo". *(CA-3.2)*
4. Copie um parágrafo de qualquer lugar e cole dentro da caixa da nota.
   **Esperado:** o texto entra na caixa e nenhum aviso aparece. *(CA-3.10)*
5. Clique em "Próxima", escreva uma nota curta, e clique em "Anterior".
   **Esperado:** "Próxima" mostra a imagem seguinte da grade, com a caixa vazia e o cursor nela. "Anterior" volta à primeira, com a nota que você escreveu. Na primeira imagem da grade, "Anterior" fica desativado; na última, "Próxima". *(CA-3.4)*
6. Com uma imagem aberta, cole um screenshot com Ctrl+V e depois arraste um arquivo de imagem para a tela.
   **Esperado:** nada acontece: nenhuma imagem é adicionada, nenhum aviso aparece e a tela não muda de página. *(CA-3.10)*
7. Aperte Esc.
   **Esperado:** a imagem fecha e a grade está no mesmo ponto. As duas imagens que você anotou mostram o sinal de nota; as outras não. Agora cole o screenshot de novo: ele entra na biblioteca. *(CA-3.3, CA-3.5)*
8. Abra uma imagem que tem nota, apague todo o texto e clique em "Fechar".
   **Esperado:** o sinal dessa imagem some. Escreva a nota de novo para os próximos passos. *(CA-3.5)*
9. Feche a aba, pare o refpack no terminal (Ctrl+C) e rode `pnpm start` de novo.
   **Esperado:** os mesmos sinais na grade; abrindo cada imagem, a mesma nota. *(CA-3.6)*
10. Selecione duas imagens, uma com nota e uma sem. Clique em "Gerar pacote", copie o caminho e abra a pasta.
    **Esperado:** existe a pasta `notes` com um arquivo só, com o mesmo número da imagem que tem nota (por exemplo, `notes/01.md` para `refs/01.png`), e o texto igual ao que você digitou. A imagem sem nota não tem arquivo. *(CA-3.7)*
11. No Claude Code, diga "leia a pasta" e cole o caminho.
    **Esperado:** ele diz o que a sua nota pede para a imagem que tem nota. *(CA-3.7)*
12. Clique em "Começar outro pacote" e confirme.
    **Esperado:** a seleção e a intenção ficam vazias; os sinais de nota e as notas continuam. *(CA-3.8)*
13. Abra uma imagem. Pare o refpack no terminal (Ctrl+C) e **deixe a aba aberta**. Escreva algo na nota e clique em "Fechar".
    **Esperado:** um aviso de que não foi possível salvar, e o que você escreveu continua na caixa, sem o "Salvo". Ao clicar em "Fechar", a tela pergunta se você quer sair sem guardar. Cancelando, a imagem continua aberta com o texto; confirmando, ela fecha. *(CA-3.9)*

Responda "aprovado" ou diga em qual passo o resultado foi diferente do esperado.
