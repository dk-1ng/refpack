# Fatia 1 — Colar e arrastar: plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task, with the overrides in `docs/WORKFLOW.md`. Steps use checkbox (`- [ ]`) syntax for tracking.

**Objetivo:** o dono cola um screenshot com Ctrl+V e arrasta arquivos para a tela; eles entram na biblioteca como os escolhidos pelo botão.

**Arquitetura:** tudo acontece na tela. Um componente novo escuta, na janela inteira, os eventos de colar e de arrastar do navegador, separa arquivos de pastas e manda os arquivos pelo mesmo caminho de envio que o botão já usa. O servidor, o banco e o pacote não mudam. Os testes de ponta a ponta passam a rodar em dois navegadores.

**Stack:** a da fatia 0, sem dependência nova. O Playwright passa a usar também o Firefox (ADR-0010).

**Spec:** `SPEC.md`, seção 7 (critérios CA-1.1 a CA-1.9). ADRs 0006, 0007, 0008 e 0010.

## Para o dono: o que esta fatia entrega

| Tarefa | O que passa a existir | Critérios |
| --- | --- | --- |
| 1. Testes no Firefox | Todos os testes de tela, inclusive os da fatia 0, rodam no Chromium e no Firefox, na sua máquina e no GitHub. | ADR-0010 |
| 2. Dica e colar | A tela mostra a dica e aceita Ctrl+V: imagem copiada ou arquivos copiados entram na grade. | CA-1.1, 1.2, 1.3, 1.4 |
| 3. Arrastar e soltar | A tela se destaca quando você arrasta arquivos, recebe o que for solto, recusa pastas com aviso e não duplica imagens da grade. | CA-1.5, 1.6, 1.7, 1.8, 1.9 |

O roteiro do seu teste manual, no Firefox, está no fim deste arquivo.

**O que os testes automáticos não cobrem no Firefox:** soltar uma pasta (CA-1.7), porque essa simulação só existe no Chromium, e o colar e o arrastar de verdade, com a sua ferramenta de captura e o seu gerenciador de arquivos. Esses pontos ficam para o seu teste manual.

## Global Constraints

- Nenhuma dependência nova. Nenhuma mudança em `src/server/`, em `src/shared/` ou no banco.
- Só existem os arquivos listados em "Estrutura de arquivos". Precisou de outro: pare e reporte.
- O código do produto não tem ramo por navegador e usa só recursos que existem no Chromium **e** no Firefox: os eventos `paste`, `dragenter`, `dragover`, `dragleave` e `drop`; `DataTransfer.types` e `DataTransfer.items`; `DataTransferItem.getAsFile()` e `DataTransferItem.webkitGetAsEntry()`. Proibidos: `navigator.clipboard.read`, File System Access API e qualquer leitura do conteúdo de uma pasta.
- O `DataTransfer` de um evento é lido **dentro** do tratador do evento, antes de qualquer `await` (o navegador o esvazia depois).
- Os ouvintes ficam na `window`, são registrados em `useEffect` e removidos na limpeza. O app roda em `StrictMode`: um ouvinte duplicado adicionaria cada imagem duas vezes.
- Imagem aceita, limite de 25 MB e mensagens de recusa são os da fatia 0; o envio é o `uploadImage` que já existe.
- Todo texto visível vem dos dicionários `pt-BR` e `en`, com exatamente os textos da tabela "Textos novos".
- Nenhum arquivo de imagem é commitado. Os testes fabricam as imagens.
- Todo teste que cobre um critério traz o identificador no nome, por exemplo `"CA-1.6 ..."`.
- Todo teste de ponta a ponta roda nos dois navegadores. As únicas diferenças permitidas entre eles são as do ADR-0010, item 3: a permissão de área de transferência (Tarefa 1) e os testes que usam `dropPaths` (Tarefa 3), que rodam só no Chromium. Precisou de outra: pare e reporte.
- Os testes novos não usam a área de transferência do sistema nem arrasto pelo sistema operacional. Usam só os ajudantes de `e2e/support.ts` descritos abaixo.
- Se um teste se comportar de outro jeito no Windows ou no Mac do CI: pare e reporte, sem `if` por sistema (R11).
- Commits em inglês, Conventional Commits, um por passo de commit do plano.
- Ao fim de cada tarefa o condutor envia o branch e espera o CI verde antes de começar a próxima.

## Textos novos

| Chave | `pt-BR` | `en` |
| --- | --- | --- |
| `library.hint` | Você também pode colar com Ctrl+V ou arrastar arquivos para esta tela. | You can also paste with Ctrl+V or drag files onto this screen. |
| `library.dropHere` | Solte para adicionar | Drop to add |
| `error.nothingToPaste` | Não havia imagem para colar. | There was no image to paste. |
| `error.nothingToAdd` | Não havia imagem para adicionar. | There was no image to add. |
| `error.folder` | {name}: pastas ainda não são aceitas. | {name}: folders are not accepted yet. |

A Tarefa 2 acrescenta `library.hint` e `error.nothingToPaste`; a Tarefa 3 acrescenta as outras três chaves.

## Review Focus

Condições que o dono pode causar em uso normal. Todas já têm critério ou regra no SPEC; cada uma tem seu teste na tarefa indicada.

1. Colar a mesma imagem duas vezes → guardada duas vezes, regra da seção "Fora desta fatia" (Tarefa 2).
2. Colar com a tela em português → o aviso sai em português, CA-1.4 (Tarefa 2).
3. Soltar um arquivo que não é imagem junto com imagens → recusa com nome e motivo, as outras entram, CA-1.6 (Tarefa 3).
4. Soltar uma pasta sozinha → só o aviso da pasta, sem o aviso de "não havia imagem", CA-1.7 (Tarefa 3).
5. Pasta com acentos e espaços no nome → o aviso mostra o nome intacto, CA-1.7 (Tarefa 3).

## Estrutura de arquivos

```
playwright.config.ts                modificado: projeto firefox
.github/workflows/ci.yml            modificado: instala o Firefox
e2e/pack.spec.ts                    modificado: permissão de área de transferência só no Chromium
e2e/support.ts                      modificado: ajudantes paste, drop e dropPaths
e2e/paste.spec.ts  e2e/drop.spec.ts novos
src/web/library/add-files.ts        novo: envia uma lista de arquivos e avisa cada resultado (sai de AddImages.tsx)
src/web/library/incoming.ts         novo: lê o que veio num colar ou num soltar: arquivos e pastas
src/web/library/IncomingFiles.tsx   novo: ouvintes da janela (colar, arrastar, soltar) e o destaque da tela
src/web/library/AddImages.tsx       modificado: usa add-files.ts e mostra a dica
src/web/library/ImageGrid.tsx       modificado: imagem da grade não é arrastável
src/web/App.tsx                     modificado: monta <IncomingFiles />
src/web/i18n/pt-BR.ts  src/web/i18n/en.ts   modificados: textos novos
src/web/styles.css                  modificado: dica e destaque
```

---

### Task 1: Testes de ponta a ponta também no Firefox

**Modelo:** Sonnet, esforço `medium`.
**Critérios:** ADR-0010 (nenhum critério novo da tela; os da fatia 0 passam a ser conferidos nos dois navegadores).

**Files:**
- Modify: `playwright.config.ts`, `e2e/pack.spec.ts`, `.github/workflows/ci.yml`

Antes do Step 1, o condutor confere que está no branch `slice/01-paste-and-drag` (criado pelo arquiteto ao aprovar o plano).

- [ ] **Step 1: Projeto `firefox` e ver o teste falhar**

Em `playwright.config.ts`, depois do projeto `chromium`:

```ts
{
  name: "firefox",
  use: {
    ...devices["Desktop Firefox"],
    launchOptions: {
      firefoxUserPrefs: {
        "dom.events.asyncClipboard.readText": true,
        "dom.events.testing.asyncClipboard": true,
      },
    },
  },
},
```

Run: `pnpm exec playwright install firefox` → Expected: Firefox instalado (ou já presente).
Run: `pnpm test:e2e` → Expected: 34 testes; falha só `[firefox] CA-0.8 the copy button puts the path on the clipboard`, com `Unknown permission: clipboard-read`.

- [ ] **Step 2: Permissão só no Chromium**

Em `e2e/pack.spec.ts`, no teste `CA-0.8 the copy button puts the path on the clipboard`: receber também `browserName` e chamar `context.grantPermissions(["clipboard-read", "clipboard-write"])` só quando `browserName === "chromium"`. Nada mais muda no teste.

Run: `pnpm check` → Expected: PASS, 34 testes de ponta a ponta (17 em cada navegador).

- [ ] **Step 3: CI**

Em `.github/workflows/ci.yml`, a linha de instalação passa a ser `pnpm exec playwright install --with-deps chromium firefox`.

- [ ] **Step 4: Commit**

`git commit -m "test: run the end-to-end tests in Firefox as well as Chromium"`

O condutor envia o branch. Expected: `gh pr checks` com os 4 jobs verdes. Se algum teste da fatia 0 falhar no Firefox em algum sistema: pare e reporte.

---

### Task 2: Dica na tela e colar

**Modelo:** Sonnet, esforço `medium`.
**Critérios:** CA-1.1, CA-1.2, CA-1.3, CA-1.4.

**Files:**
- Create: `src/web/library/add-files.ts`, `src/web/library/incoming.ts`, `src/web/library/IncomingFiles.tsx`, `e2e/paste.spec.ts`
- Modify: `src/web/library/AddImages.tsx`, `src/web/App.tsx`, `src/web/i18n/pt-BR.ts`, `src/web/i18n/en.ts`, `src/web/styles.css`, `e2e/support.ts`

**Interfaces:**
- Produces, em `src/web/library/add-files.ts` (é o `handleFiles` de `AddImages.tsx`, movido sem mudar o comportamento):

```ts
export type AddHandlers = { onAdded: (image: Image) => void; onRefused: (notice: Notice) => void };
export async function addFiles(files: File[], handlers: AddHandlers): Promise<void>;
```

- Produces, em `src/web/library/incoming.ts`:

```ts
// Files carried by a paste or a drop, in the order the browser lists them.
export function readIncoming(data: DataTransfer | null): File[];
```

  Percorre `data.items`; para cada item com `kind === "file"`, usa `getAsFile()` e ignora `null`. `data === null` devolve `[]`. (A Tarefa 3 muda o retorno para incluir pastas.)

- Produces, em `src/web/library/IncomingFiles.tsx`: `export function IncomingFiles(props: AddHandlers)`. Nesta tarefa não desenha nada (`return null`) e escuta `paste` na `window`: lê `readIncoming(event.clipboardData)`; lista vazia → `onRefused({ key: "error.nothingToPaste" })`; senão → `addFiles(files, props)`.
- Produces, em `e2e/support.ts`:

```ts
export type FakeFile = { name: string; content: "image/png" | "image/jpeg" | "image/webp" | "text" };
// Builds, inside the page, what a paste or a drop carries.
async function makeDataTransfer(page: Page, files: FakeFile[], text?: string): Promise<JSHandle<DataTransfer>>;
// Fires, inside the page, the paste event a browser fires on Ctrl+V.
export async function paste(page: Page, files: FakeFile[], text?: string): Promise<void>;
```

  `makeDataTransfer`, com `page.evaluateHandle`: cria `new DataTransfer()`; para cada item, `data.items.add(new File([...], name, { type }))` — imagem desenhada num canvas 8×8 como em `makeImageFile` (tipo = `content`), ou o texto `"just some text, not an image"` com tipo `text/plain` quando `content` é `"text"`; se `text` veio, `data.setData("text/plain", text)`.

  `paste` dispara assim (o Firefox ignora `clipboardData` passado ao construtor; por isso a propriedade é definida à parte):

```ts
await page.evaluate((data) => {
  const event = new ClipboardEvent("paste", { bubbles: true, cancelable: true });
  Object.defineProperty(event, "clipboardData", { value: data });
  document.body.dispatchEvent(event);
}, await makeDataTransfer(page, files, text));
```

- [ ] **Step 1: Testes que falham**

`e2e/paste.spec.ts` (mesmo estilo de `e2e/library.spec.ts`; `images` = `page.getByRole("list").getByRole("img")`; `alts` = os `alt` na ordem da grade):

```ts
test("CA-1.1 a hint next to the add button says images can be pasted or dragged", ...);
// visível: "You can also paste with Ctrl+V or drag files onto this screen."
// trocar a língua para "Português" → visível: "Você também pode colar com Ctrl+V ou arrastar arquivos para esta tela."

test("CA-1.2 a pasted image enters the library like a chosen one", ...);
// paste(page, [{ name: "image.png", content: "image/png" }])
// images tem 1; naturalWidth > 0; alts = ["image.png"]; o convite da biblioteca vazia sumiu; nenhum reload

test("CA-1.3 pasted files enter newest first and a refused one is named with the reason", ...);
// paste(page, [a.png (image/png), b.jpg (image/jpeg), notes.png (text)])
// alts = ["b.jpg", "a.png"]; alert contém "notes.png: unsupported type. Use PNG, JPEG or WebP."

test("CA-1.4 pasting text shows a notice in the screen language and keeps nothing", ...);
// paste(page, [], "hello") → alert tem o texto "There was no image to paste."; nenhuma img
// trocar para "Português" → alert tem o texto "Não havia imagem para colar."
// page.reload() → o convite da biblioteca vazia continua visível

test("the same image pasted twice appears twice", ...);
// dois paste iguais, esperando a grade entre um e outro → alts = ["image.png", "image.png"]
```

Run: `pnpm test:e2e` → Expected: os 5 testes novos FALHAM nos dois navegadores; os da fatia 0 passam.

- [ ] **Step 2: Implementar**

- `add-files.ts`, `incoming.ts`, `IncomingFiles.tsx` conforme Interfaces.
- `AddImages.tsx`: passa a chamar `addFiles`; depois do botão, `<span className="add-hint">{t("library.hint")}</span>`.
- `App.tsx`: monta `<IncomingFiles />` com os mesmos `onAdded` e `onRefused` passados a `<AddImages />`.
- Dicionários: `library.hint` e `error.nothingToPaste`.
- `styles.css`: `.add-hint` no mesmo estilo de `.pack-hint`.

Run: `pnpm check` → Expected: PASS, com os 5 testes novos passando nos dois navegadores.

- [ ] **Step 3: Commit**

`git commit -m "feat: paste images into the library and show the paste and drag hint"`

---

### Task 3: Arrastar e soltar

**Modelo:** Sonnet, esforço `medium`.
**Critérios:** CA-1.5, CA-1.6, CA-1.7, CA-1.8, CA-1.9.

**Files:**
- Create: `e2e/drop.spec.ts`
- Modify: `src/web/library/incoming.ts`, `src/web/library/IncomingFiles.tsx`, `src/web/library/ImageGrid.tsx`, `src/web/i18n/pt-BR.ts`, `src/web/i18n/en.ts`, `src/web/styles.css`, `e2e/support.ts`

**Interfaces:**
- Consumes: `addFiles`, `AddHandlers`, `readIncoming`, `IncomingFiles`, `FakeFile` e `makeDataTransfer` da Tarefa 2.
- Changes, em `src/web/library/incoming.ts`:

```ts
export type Incoming = { files: File[]; folders: string[] };
export function readIncoming(data: DataTransfer | null): Incoming;
```

  Para cada item com `kind === "file"`: se `item.webkitGetAsEntry()` devolver uma entrada com `isDirectory === true`, o `name` dela vai para `folders`; senão `getAsFile()` vai para `files` (entrada `null` conta como arquivo).

- Changes, em `IncomingFiles.tsx` — uma regra só para colar e soltar:
  1. cada pasta → `onRefused({ key: "error.folder", vars: { name } })`;
  2. sem arquivos **e** sem pastas → `onRefused` com `error.nothingToPaste` (colar) ou `error.nothingToAdd` (soltar);
  3. arquivos → `addFiles`.
- Changes, em `IncomingFiles.tsx` — ouvintes novos na `window` e o destaque:
  - `dragenter`: `preventDefault()`; se `event.dataTransfer?.types.includes("Files")`, liga o destaque.
  - `dragover`: `preventDefault()` sempre (sem isso o navegador não entrega o `drop` e pode abrir o que foi solto).
  - `drop`: `preventDefault()`, desliga o destaque e aplica a regra acima a `event.dataTransfer`.
  - Com o destaque ligado, o componente desenha `<div className="drop-overlay" onDragLeave={desliga}><p>{t("library.dropHere")}</p></div>`. No CSS: `.drop-overlay` com `position: fixed; inset: 0`, fundo claro semitransparente, borda tracejada e o texto centralizado; `.drop-overlay p` com `pointer-events: none` (sem isso, passar por cima do texto apaga o destaque).
- Produces, em `e2e/support.ts`:

```ts
// Fires, inside the page, the events of a drop on the screen. Works in both browsers.
export async function drop(page: Page, files: FakeFile[], text?: string): Promise<void>;
// A real drop of files and folders from disk. Chromium only (ADR-0010).
export async function dropPaths(page: Page, paths: string[]): Promise<void> {
  const session = await page.context().newCDPSession(page);
  const data = { items: [], files: paths, dragOperationsMask: 1 };
  for (const type of ["dragEnter", "dragOver", "drop"] as const) {
    await session.send("Input.dispatchDragEvent", { type, x: 200, y: 200, data });
  }
  await session.detach();
}
```

  `drop`: com `dataTransfer = await makeDataTransfer(page, files, text)`, dispara em `page.locator("main")`, nesta ordem, `dispatchEvent("dragenter", { dataTransfer })`, `"dragover"` e `"drop"`.

- [ ] **Step 1: Testes que falham — destaque, soltar, pasta, o que não é arquivo**

`e2e/drop.spec.ts`:

```ts
test("CA-1.5 dragging files over the screen shows the invitation to drop until they leave", async ({ page, app }) => {
  await page.goto(app.url);
  const dataTransfer = await page.evaluateHandle(() => {
    const data = new DataTransfer();
    data.items.add(new File(["x"], "a.png", { type: "image/png" }));
    return data;
  });
  await page.locator("main").dispatchEvent("dragenter", { dataTransfer });
  await expect(page.getByText("Drop to add")).toBeVisible();
  await page.locator(".drop-overlay").dispatchEvent("dragleave", { dataTransfer });
  await expect(page.getByText("Drop to add")).toHaveCount(0);
});

test("CA-1.6 dropped files enter the library like chosen ones", ...);
// drop(page, [a.png (image/png), b.jpg (image/jpeg), notes.png (text)])
// alts = ["b.jpg", "a.png"]; alert contém "notes.png: unsupported type. Use PNG, JPEG or WebP."
// "Drop to add" tem count 0

test("CA-1.8 dropping text shows a notice, keeps nothing and leaves the screen open", ...);
// drop(page, [], "hello")
// alert tem o texto "There was no image to add."; nenhuma img
// o título "refpack" continua visível e page.url() não mudou

test.describe("real files and folders from disk", () => {
  test.skip(({ browserName }) => browserName !== "chromium", "driven through the Chromium protocol (ADR-0010)");
  // workDir temporário como em e2e/library.spec.ts

  test("CA-1.6 a real dropped file enters and the original is left untouched", ...);
  // a.png por makeImageFile; dropPaths(page, [a])
  // alts = ["a.png"]; o conteúdo de a.png no disco é igual ao de antes

  test("CA-1.7 a dropped folder is refused by name and the files dropped with it are kept", ...);
  // pasta join(workDir, "Pasta de tésté") com inner.png (imagem válida) dentro; a.png fora
  // dropPaths(page, [a, pasta])
  // alert contém "Pasta de tésté: folders are not accepted yet."; alts = ["a.png"]

  test("CA-1.7 a folder dropped alone adds nothing and shows only the folder notice", ...);
  // alert contém o aviso da pasta e NÃO contém "There was no image to add."; nenhuma img
});
```

Run: `pnpm test:e2e` → Expected: os testes novos FALHAM (3 nos dois navegadores, 3 só no Chromium).

- [ ] **Step 2: Implementar**

`incoming.ts`, `IncomingFiles.tsx`, dicionários (`library.dropHere`, `error.nothingToAdd`, `error.folder`) e `styles.css` conforme Interfaces.

Run: `pnpm check` → Expected: PASS.

- [ ] **Step 3: Commit**

`git commit -m "feat: drop files onto the screen, with a notice for folders and for non-files"`

- [ ] **Step 4: Teste que falha — imagem da grade**

```ts
test("CA-1.9 an image dragged from the grid and dropped on the screen adds nothing", ...);
// drop(page, [{ name: "a.png", content: "image/png" }]) → images tem 1
// images.first().dragTo(page.getByRole("heading", { name: "refpack" }))
// images continua com 1; page.getByRole("alert") tem count 0
```

Run: `pnpm test:e2e` → Expected: FALHA nos dois navegadores (aparece o aviso "There was no image to add.").

- [ ] **Step 5: Implementar**

`ImageGrid.tsx`: `draggable={false}` em cada `<img>`.

Run: `pnpm check` → Expected: PASS.

- [ ] **Step 6: Commit**

`git commit -m "fix: keep grid images from being dragged back into the library"`

- [ ] **Step 7: Conferência final da fatia — feita pelo condutor**

Run: `pnpm check` → PASS, saída guardada para o relatório.
Run: `gh pr checks` → os 4 jobs verdes.
Conferir que CA-1.1 a CA-1.9 têm teste com o identificador no nome: `grep -rhoE "CA-1\.[0-9]+" src e2e | sort -u`.

Só então: revisão da fatia (Opus, contexto limpo), conforme `docs/WORKFLOW.md`.

- [ ] **Step 8: Depois do "aprovado" do dono**

Em `ROADMAP.md`, fatia 1 passa a `feita` e a fatia 2 a `próxima`. Commit: `docs: mark slice 1 as done`. Merge do pull request.

---

## Roteiro de teste manual do dono

O condutor deixa o branch pronto e avisa. Faça no **Firefox**. Você precisa de duas ou três imagens suas, de um arquivo que não seja imagem (um PDF, por exemplo) e de uma pasta qualquer.

1. Rode `pnpm start` e olhe perto do botão "Adicionar imagens".
   **Esperado:** uma dica dizendo que dá para colar com Ctrl+V e arrastar arquivos. *(CA-1.1)*
2. Tire um screenshot com a sua ferramenta de captura, deixando a imagem copiada. Clique na janela do refpack e aperte Ctrl+V.
   **Esperado:** o screenshot aparece em primeiro lugar na grade. *(CA-1.2)*
3. Em um site qualquer, clique com o botão direito numa imagem, escolha "Copiar imagem", volte ao refpack e aperte Ctrl+V.
   **Esperado:** a imagem aparece na grade. *(CA-1.2)*
4. No gerenciador de arquivos, selecione duas imagens, aperte Ctrl+C, volte ao refpack e aperte Ctrl+V.
   **Esperado:** as duas aparecem na grade. Se em vez disso aparecer o aviso "Não havia imagem para colar.", o Firefox não entrega arquivos copiados no seu sistema: me diga, porque é o ponto que só este teste confirma. *(CA-1.3)*
5. Copie um texto qualquer e aperte Ctrl+V no refpack.
   **Esperado:** o aviso "Não havia imagem para colar."; a grade não muda. *(CA-1.4)*
6. Arraste duas imagens do gerenciador de arquivos para cima da tela, sem soltar; depois leve-as de volta para fora da janela.
   **Esperado:** a tela inteira ganha um destaque com "Solte para adicionar", que some quando as imagens saem. *(CA-1.5)*
7. Arraste as duas imagens de novo e solte em qualquer ponto da tela.
   **Esperado:** o destaque some e as duas aparecem na grade; os arquivos originais continuam no lugar. *(CA-1.6)*
8. Arraste juntos uma imagem e o arquivo que não é imagem, e solte.
   **Esperado:** a imagem entra; um aviso traz o nome do outro arquivo e o motivo. *(CA-1.6)*
9. Arraste uma pasta e solte na tela.
   **Esperado:** um aviso com o nome da pasta dizendo que pastas ainda não são aceitas; a grade não muda. Este passo é o único jeito de conferir o CA-1.7 no Firefox. *(CA-1.7)*
10. Em outra janela, selecione um trecho de texto (ou pegue um link), arraste e solte na tela do refpack.
    **Esperado:** o aviso "Não havia imagem para adicionar."; a tela do refpack continua aberta, sem virar outra página. *(CA-1.8)*
11. Arraste uma imagem da própria grade e solte em outro ponto da tela.
    **Esperado:** nada acontece: nenhuma imagem nova, nenhum aviso. *(CA-1.9)*
12. Clique em "Gerar pacote" e abra a pasta.
    **Esperado:** as imagens coladas e soltas estão em `refs`, numeradas junto com as outras. *(CA-0.7)*

Responda "aprovado" ou diga em qual passo o resultado foi diferente do esperado.
