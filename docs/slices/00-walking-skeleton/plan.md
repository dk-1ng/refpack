# Fatia 0 — Walking skeleton: plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task, with the overrides in `docs/WORKFLOW.md`. Steps use checkbox (`- [ ]`) syntax for tracking.

**Objetivo:** o dono abre o refpack, adiciona uma imagem, vê a imagem na tela e gera uma pasta-pacote que o Claude Code lê.

**Arquitetura:** um servidor local (Hono sobre Node) guarda as imagens numa pasta de biblioteca com um banco SQLite e gera os pacotes; uma tela React, servida pelo mesmo servidor, conversa com ele por uma API pequena. O servidor só atende a própria máquina.

**Stack:** TypeScript estrito · Node 26.13 · pnpm 12.16.1 · Hono · `node:sqlite` · zod · React + Vite · Vitest · Playwright · Biome.

**Spec:** `SPEC.md`, seção 6 (critérios CA-0.1 a CA-0.14). ADRs 0002 a 0008.

## Para o dono: o que esta fatia entrega

| Tarefa | O que passa a existir | Critérios |
| --- | --- | --- |
| 1. Fundação e CI | O projeto roda uma página vazia e os testes passam nos três sistemas, no GitHub. | CA-0.12 |
| 2. Biblioteca | O servidor guarda imagens, recusa o que não é imagem e só atende a sua máquina. | CA-0.5, 0.6, 0.11 |
| 3. Tela e línguas | A tela abre com a biblioteca vazia e troca entre português e inglês. | CA-0.2, 0.10 |
| 4. Adicionar e ver | O botão "Adicionar imagens" funciona e a grade mostra as imagens. | CA-0.3, 0.4, 0.5, 0.6 |
| 5. Pacote | O botão "Gerar pacote" cria a pasta e mostra o caminho. | CA-0.2, 0.7, 0.8, 0.9 |
| 6. Abrir com um comando | `pnpm start` abre a tela no navegador. | CA-0.1, 0.14, 0.13 |

O roteiro do seu teste manual está no fim deste arquivo.

## Global Constraints

- Node `>=26.13.0`; `.node-version` contém `26.13.0`. pnpm `12.16.1` em `packageManager`.
- Dependências, com versão exata, e **nenhuma outra**:
  - produção: `react@19.3.1`, `react-dom@19.3.1`, `hono@4.13.17`, `@hono/node-server@2.1.6`, `zod@4.6.7`;
  - desenvolvimento: `typescript@6.0.3`, `vite@8.3.7`, `@vitejs/plugin-react@6.3.0`, `vitest@5.1.0`, `@playwright/test@1.65.0`, `@biomejs/biome@2.6.6`, `@types/node@26.6.6`, `@types/react@19.3.0`, `@types/react-dom@19.3.0`.
- Se a instalação pedir aprovação de script de instalação de alguma dependência, pare e reporte.
- O servidor roda TypeScript direto no Node: imports relativos com extensão `.ts`; sem `enum`, sem `namespace`, sem parameter properties.
- `web` e `server` importam de `shared` e nunca um do outro.
- Só existem os arquivos listados em "Estrutura de arquivos". Precisou de outro: pare e reporte.
- Só existe a tabela `images` descrita na Tarefa 2. Nenhuma coluna a mais.
- Imagem aceita: PNG, JPEG ou WebP, conferida pelos primeiros bytes, até `25 * 1024 * 1024` bytes.
- Todo texto visível da tela vem dos dicionários `pt-BR` e `en`. O nome "refpack" não é traduzido.
- Nenhum arquivo de imagem é commitado. Os testes fabricam as imagens.
- Todo teste que cobre um critério traz o identificador no nome, por exemplo `"CA-0.7 ..."`.
- Precisou de `if` por sistema operacional fora de `open-browser.ts`: pare e reporte.
- Commits em inglês, Conventional Commits, um por passo de commit do plano.
- Ao fim de cada tarefa o condutor envia o branch e espera o CI verde antes de começar a próxima.

## Review Focus

Condições que o dono pode causar em uso normal. Todas já têm critério ou regra no SPEC; cada uma tem seu teste na tarefa indicada.

1. Rodar `pnpm start` com o refpack já aberto → CA-0.14 (Tarefa 6).
2. Adicionar o mesmo arquivo duas vezes → aparece duas vezes, regra da seção "Fora desta fatia" (Tarefa 4).
3. Gerar dois pacotes no mesmo segundo → duas pastas diferentes, CA-0.9 (Tarefa 5).
4. Arquivo com acentos, espaços e parênteses no nome → o nome original é guardado intacto (Tarefa 2).

## Estrutura de arquivos

```
package.json  pnpm-lock.yaml  .node-version
tsconfig.json  biome.json  vite.config.ts  vitest.config.ts  playwright.config.ts
.github/workflows/ci.yml
src/shared/api.ts                 limites, códigos de erro e formatos da API (zod)
src/server/main.ts                entrada: lê o ambiente, abre a biblioteca, sobe o servidor
src/server/app.ts                 createApp: rotas, guarda e arquivos da tela
src/server/guard.ts               só a própria máquina (CA-0.11)
src/server/image-type.ts          reconhece PNG, JPEG e WebP pelos bytes
src/server/library.ts             pasta da biblioteca, banco, adicionar e listar
src/server/migrations/001-images.sql
src/server/pack.ts                gera a pasta-pacote
src/server/open-browser.ts        abre o navegador (único lugar com código por sistema)
src/server/test-support.ts        ajudas de teste do servidor
src/web/index.html  src/web/main.tsx  src/web/App.tsx  src/web/styles.css
src/web/api.ts                    chamadas à API, com respostas validadas por zod
src/web/i18n/index.tsx  src/web/i18n/pt-BR.ts  src/web/i18n/en.ts
src/web/library/AddImages.tsx  src/web/library/ImageGrid.tsx
src/web/pack/PackPanel.tsx
e2e/support.ts                    sobe o app real numa biblioteca temporária
e2e/shell.spec.ts  e2e/library.spec.ts  e2e/pack.spec.ts  e2e/start.spec.ts
```

Testes unitários ficam ao lado do arquivo (`pack.ts` → `pack.test.ts`).

---

### Task 1: Fundação, página mínima e CI

**Modelo:** Opus, esforço `high` (integração de ferramentas e CI em três sistemas).
**Critérios:** CA-0.12.

**Files:**
- Create: `package.json`, `.node-version`, `tsconfig.json`, `biome.json`, `vite.config.ts`, `vitest.config.ts`, `playwright.config.ts`, `.github/workflows/ci.yml`
- Create: `src/server/main.ts`, `src/server/app.ts`, `src/web/index.html`, `src/web/main.tsx`, `src/web/App.tsx`, `src/web/styles.css`
- Create: `e2e/support.ts`, `e2e/shell.spec.ts`

Antes do Step 1, o condutor cria o branch local `slice/00-walking-skeleton` a partir de `main`.

**Interfaces:**
- Produces: `createApp(deps: { webDir: string }): Hono` em `src/server/app.ts` (as tarefas 2 e 5 acrescentam campos a `deps`).
- Produces, em `src/server/app.ts`: `listenLocal(fetch: (request: Request) => Response | Promise<Response>, port: number): Promise<{ address: string; port: number; close(): Promise<void> }>` — escuta só em `127.0.0.1`, resolve quando está ouvindo (com a porta real) e rejeita com o erro do Node se não conseguir (por exemplo `EADDRINUSE`).
- Produces: `main.ts` lê `REFPACK_PORT` (padrão `4747`; `0` = porta livre) e escuta em `127.0.0.1`. Ao subir, imprime exatamente uma linha `refpack: http://127.0.0.1:<porta>`.
- Produces: em `e2e/support.ts`:
  - `type RunningApp = { url: string; libraryDir: string; stop(): Promise<void> }`
  - `startApp(options?: { libraryDir?: string }): Promise<RunningApp>` — cria (se não vier) uma pasta temporária `<tmp>/refpack-XXXXXX/Bibliotéca de tésté`, inicia `node src/server/main.ts` como processo filho (com `process.execPath`, a partir da raiz do repositório) com `REFPACK_LIBRARY`, `REFPACK_PORT=0` e `REFPACK_NO_OPEN=1`, espera a linha `refpack: ` e devolve a URL. `stop()` encerra o processo, espera ele terminar e só então apaga a pasta temporária (`rm` com `recursive`, `force` e `maxRetries: 5`).
  - `test`: o `test` do Playwright estendido com a fixture `app: RunningApp`, que chama `startApp()` antes e `stop()` depois de cada teste.

- [ ] **Step 1: `package.json`, `.node-version` e instalação**

`package.json`: `"name": "refpack"`, `"private": true`, `"type": "module"`, `"packageManager": "pnpm@12.16.1"`, `"engines": { "node": ">=26.13.0" }`, as dependências de Global Constraints e estes scripts:

```json
{
  "start": "vite build && node src/server/main.ts",
  "dev": "pnpm run \"/^dev:.*/\"",
  "dev:web": "vite build --watch",
  "dev:server": "node --watch src/server/main.ts",
  "lint": "biome check .",
  "typecheck": "tsc --noEmit",
  "test": "vitest run",
  "test:e2e": "vite build && playwright test",
  "check": "pnpm lint && pnpm typecheck && pnpm test && pnpm test:e2e"
}
```

Run: `pnpm install` → Expected: termina sem erro e cria `pnpm-lock.yaml`.
Run: `pnpm exec playwright install chromium` → Expected: Chromium instalado.

- [ ] **Step 2: Configurações**

- `tsconfig.json`: `strict`, `noUncheckedIndexedAccess`, `noEmit`, `module` e `moduleResolution` para bundler (`"module": "preserve"`, `"moduleResolution": "bundler"`), `allowImportingTsExtensions`, `verbatimModuleSyntax`, `erasableSyntaxOnly`, `jsx: "react-jsx"`, `lib: ["ES2024", "DOM", "DOM.Iterable"]`, `types: ["node", "vite/client"]`, `include: ["src", "e2e", "*.config.ts"]`.
- `biome.json`: schema `2.6.6`; `vcs` com `enabled`, `clientKind: "git"`, `useIgnoreFile: true`; formatador com espaços e `lineWidth: 100`; regras recomendadas do linter.
- `vite.config.ts`: `root: "src/web"`, plugin React, `build.outDir: "../../dist/web"`, `build.emptyOutDir: true`.
- `vitest.config.ts`: `include: ["src/**/*.test.ts"]`, `environment: "node"`.
- `playwright.config.ts`: `testDir: "e2e"`, um projeto Chromium, `use.locale: "en-US"`, `retries: 0`, `forbidOnly: !!process.env.CI`, `reporter: "list"`.

- [ ] **Step 3: Teste de ponta a ponta que falha**

`e2e/shell.spec.ts`:

```ts
test("CA-0.12 the app serves its screen from a library path with accents and spaces", async ({ page, app }) => {
  expect(app.libraryDir).toContain("Bibliotéca de tésté");
  await page.goto(app.url);
  await expect(page.getByRole("heading", { level: 1, name: "refpack" })).toBeVisible();
});
```

Escreva `e2e/support.ts` conforme Interfaces.
Run: `pnpm test:e2e` → Expected: FAIL (não existe `src/server/main.ts`).

- [ ] **Step 4: Servidor e página mínimos**

- `src/server/app.ts`: `createApp({ webDir })` devolve um `Hono` que serve os arquivos de `webDir` com `serveStatic` de `@hono/node-server/serve-static`.
- `src/server/app.ts`: `listenLocal` usa `serve` de `@hono/node-server` com `hostname: "127.0.0.1"`.
- `src/server/main.ts`: `webDir` é `dist/web` resolvido a partir da raiz do repositório (via `import.meta.dirname`), não do diretório atual. Sobe com `listenLocal(app.fetch, port)` e imprime a linha `refpack: ...` com a porta real.
- `src/web/`: `index.html` com `<div id="root">`; `main.tsx` monta `<App />`; `App.tsx` mostra `<h1>refpack</h1>`; `styles.css` com tipografia do sistema e margens simples.

Run: `pnpm check` → Expected: todos os passos passam; 1 teste e2e passou.

- [ ] **Step 5: Commit**

`git commit -m "chore: set up the toolchain and a minimal app served end to end"`

- [ ] **Step 6: CI**

`.github/workflows/ci.yml`, com `permissions: contents: read`, em `pull_request` e em `push` para `main`:

- job `policy` (ubuntu): falha se `git ls-files` listar arquivo com extensão `png jpg jpeg gif webp avif bmp ico tif tiff heic svg mp4 webm mov m4v mkv avi` (sem diferenciar maiúsculas).
- job `check`, matriz `ubuntu-latest`, `windows-latest`, `macos-latest`, `fail-fast: false`: checkout → pnpm → Node pelo `.node-version` → `pnpm install --frozen-lockfile` → `pnpm exec playwright install --with-deps chromium` → `pnpm check`.
- Ações fixadas por commit:
  - `actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1` (v7.0.1), com `persist-credentials: false`
  - `pnpm/action-setup@ea17c68df8912ef543352723c149a84f56e3d413` (v6.1.0)
  - `actions/setup-node@949feb2413d6458794dcd2491c4babbbce0c15c1` (v7.1.0)

`git commit -m "ci: run the check on Linux, Windows and macOS and refuse media files"`

- [ ] **Step 7: Repositório no GitHub — feito pelo condutor, com confirmação do dono na hora**

Antes de qualquer comando, o condutor pede ao dono a confirmação para criar o repositório **público** `refpack` na conta dele. Com o "sim":

1. Criar o repositório e enviar `main` (só documentos até aqui).
2. Ligar secret scanning com bloqueio no push, alertas do Dependabot e relato privado de vulnerabilidade.
3. Enviar o branch `slice/00-walking-skeleton` e abrir o pull request em rascunho.
4. Com os 4 jobs do CI verdes, criar a regra de proteção de `main`: só por pull request, com os 4 jobs obrigatórios.

Expected: `gh pr checks` mostra `policy` e os três `check` verdes.

---

### Task 2: Biblioteca, API de imagens e guarda local

**Modelo:** Sonnet, esforço `medium`.
**Critérios:** CA-0.5 (servidor), CA-0.6 (servidor), CA-0.11; parte de CA-0.1 (biblioteca criada vazia).

**Files:**
- Create: `src/shared/api.ts`, `src/server/image-type.ts`, `src/server/library.ts`, `src/server/migrations/001-images.sql`, `src/server/guard.ts`, `src/server/test-support.ts`
- Create: `src/server/image-type.test.ts`, `src/server/library.test.ts`, `src/server/guard.test.ts`, `src/server/app.test.ts`
- Modify: `src/server/app.ts`, `src/server/main.ts`

**Interfaces:**
- Consumes: `createApp` e `main.ts` da Tarefa 1.
- Produces, em `src/shared/api.ts`:

```ts
export const MAX_IMAGE_BYTES = 25 * 1024 * 1024;
export const ImageSchema = z.object({ id: z.uuid(), originalName: z.string(), url: z.string() });
export const ImageListSchema = z.object({ images: z.array(ImageSchema) });
export const ErrorCodeSchema = z.enum(["unsupported-type", "too-large", "empty-library", "forbidden", "not-found"]);
export const ErrorSchema = z.object({ error: z.object({ code: ErrorCodeSchema }) });
export const PackCreatedSchema = z.object({ path: z.string(), count: z.number().int().positive() });
// mais os tipos: Image, ErrorCode, PackCreated (z.infer)
```

- Produces, em `src/server/image-type.ts`:

```ts
export type ImageType =
  | { mimeType: "image/png"; extension: "png" }
  | { mimeType: "image/jpeg"; extension: "jpg" }
  | { mimeType: "image/webp"; extension: "webp" };
export function sniffImageType(bytes: Uint8Array): ImageType | null;
```

- Produces, em `src/server/library.ts`:

```ts
export type Library = { root: string; imagesDir: string; packsDir: string; db: DatabaseSync };
export type StoredImage = { id: string; originalName: string; mimeType: ImageType["mimeType"]; fileName: string };
export function resolveLibraryRoot(env: NodeJS.ProcessEnv, homeDir: string): string;
export function openLibrary(root: string): Library;
export function closeLibrary(library: Library): void;
export type AddImageResult =
  | { ok: true; image: StoredImage }
  | { ok: false; code: "unsupported-type" | "too-large" };
export function addImage(library: Library, input: { bytes: Uint8Array; originalName: string }): AddImageResult;
export function listImages(library: Library): StoredImage[]; // a mais recente primeiro
export function findImage(library: Library, id: string): StoredImage | null;
```

- Produces: `createApp(deps: { webDir: string; library: Library })`.
- Produces, em `src/server/test-support.ts`: `tempLibraryRoot(): string` (pasta nova `<tmp>/refpack-XXXXXX/Bibliotéca de tésté`, ainda não criada); `PNG_BYTES`, `JPEG_BYTES`, `WEBP_BYTES` (assinatura válida + alguns bytes); `localRequest(app, path, init?)`, que chama `app.request("http://127.0.0.1:4747" + path, ...)` acrescentando o cabeçalho `host: "127.0.0.1:4747"`.

**Decisões fixas:**

- Assinaturas: PNG `89 50 4E 47 0D 0A 1A 0A`; JPEG `FF D8 FF`; WebP `RIFF` nos bytes 0–3 e `WEBP` nos bytes 8–11.
- `resolveLibraryRoot`: `env.REFPACK_LIBRARY` se definido e não vazio; senão `join(homeDir, "refpack-library")`.
- `openLibrary` cria `root` e `root/images` se faltarem, abre `root/library.db` e aplica as migrações de `src/server/migrations/` em ordem de nome, guardando a última aplicada em `PRAGMA user_version`. `packsDir` é `root/packs` e **não** é criado aqui.
- `001-images.sql`:

```sql
CREATE TABLE images (
  seq INTEGER PRIMARY KEY AUTOINCREMENT,
  id TEXT NOT NULL UNIQUE,
  original_name TEXT NOT NULL,
  mime_type TEXT NOT NULL
) STRICT;
```

- `addImage`: confere o tamanho, depois o tipo; `id` é `crypto.randomUUID()`; grava `images/<id>.<extension>` e só então insere a linha. `fileName` é sempre `<id>.<extension>`, derivado, não guardado. As linhas lidas do banco passam por um schema zod antes de virar `StoredImage`.
- `listImages` ordena por `seq` decrescente.
- Rotas:
  - `GET /api/images` → 200, `ImageListSchema`; `url` é `/api/images/<id>/file`.
  - `POST /api/images` → corpo = bytes do arquivo; cabeçalho `x-original-name` = nome com `encodeURIComponent`. Respostas: 201 com `ImageSchema`; 415 `unsupported-type`; 413 `too-large` (via `bodyLimit` de `hono/body-limit`, `maxSize: MAX_IMAGE_BYTES`).
  - `GET /api/images/:id/file` → 200 com os bytes e o `content-type` do tipo; 404 `not-found` (também quando `:id` não é UUID).
  - Erros sempre no formato `ErrorSchema`.
- `guard.ts` — `localOnly(): MiddlewareHandler`, aplicado a tudo, antes das rotas e dos arquivos da tela:
  - Em **todo** pedido: `Host` precisa casar com `^(127\.0\.0\.1|localhost):\d+$`; senão 403 `forbidden`.
  - Só em caminhos que começam com `/api/`: se houver `Origin`, precisa ser igual a `http://` + `Host`; se houver `Sec-Fetch-Site`, precisa ser `same-origin` ou `none`; senão 403 `forbidden`.
  - Toda resposta leva `X-Content-Type-Options: nosniff`.
- Os testes unitários fecham a biblioteca (`closeLibrary`) ao terminar e não apagam a pasta temporária.
- `main.ts` passa a abrir a biblioteca com `resolveLibraryRoot(process.env, os.homedir())`.

- [ ] **Step 1: Testes de `sniffImageType` (falham)**

`image-type.test.ts`: reconhece `PNG_BYTES`, `JPEG_BYTES` e `WEBP_BYTES` com o `mimeType` e a `extension` certos; devolve `null` para array vazio, para texto (`"hello"`), para os 7 primeiros bytes da assinatura PNG e para `RIFF....WAVE`.

Run: `pnpm test` → Expected: FAIL. Implemente. Run: `pnpm test` → PASS. Commit: `feat: recognize PNG, JPEG and WebP by their first bytes`.

- [ ] **Step 2: Testes da biblioteca (falham)**

`library.test.ts`:

```ts
test("CA-0.1 opening a library that does not exist creates it empty", ...);
// existe root/library.db e root/images; listImages(lib) é []
test("CA-0.6 images are still there, in the same order, after closing and reopening", ...);
// adiciona PNG, JPEG, WEBP; fecha; reabre; ids na ordem [webp, jpeg, png]
test("CA-0.5 a file that is not an accepted image is refused and nothing is stored", ...);
// code "unsupported-type"; pasta images vazia; listImages []
test("CA-0.5 a file over 25 MB is refused and nothing is stored", ...);
// PNG_BYTES estendido até MAX_IMAGE_BYTES + 1 → code "too-large"
test("the original name is kept exactly, with accents, spaces and parentheses", ...);
// originalName "ação tela (1).png" volta igual em listImages
test("the stored file name comes from the generated id, never from the original name", ...);
// fileName casa com /^[0-9a-f-]{36}\.png$/ e o arquivo existe em imagesDir com os mesmos bytes
test("resolveLibraryRoot uses REFPACK_LIBRARY when set and the home folder otherwise", ...);
```

Run: `pnpm test` → FAIL. Implemente `library.ts` e a migração. Run: `pnpm test` → PASS. Commit: `feat: store images in a library folder with a SQLite index`.

- [ ] **Step 3: Testes da guarda (falham)**

`guard.test.ts`, sobre um `Hono` mínimo com `localOnly()` e as rotas `GET /api/x` e `GET /page`:

```ts
test("CA-0.11 a request with a foreign Host header is refused", ...);        // host "evil.example" → 403 forbidden
test("CA-0.11 a request with no Host header is refused", ...);               // 403
test("CA-0.11 an API request from another origin is refused", ...);          // /api/x, origin "http://evil.example" → 403
test("CA-0.11 a cross-site or same-site API request is refused", ...);       // /api/x, sec-fetch-site "cross-site" e "same-site" → 403
test("CA-0.11 a same-origin request from 127.0.0.1 or localhost passes", ...); // /api/x → 200, com e sem Origin
test("a page opened from a link on another site still loads", ...);          // /page, sec-fetch-site "cross-site" → 200
test("every response carries X-Content-Type-Options: nosniff", ...);
test("CA-0.11 the server listens on 127.0.0.1 only", ...);                   // listenLocal(app.fetch, 0) → address "127.0.0.1"
```

Run: `pnpm test` → FAIL. Implemente. PASS. Commit: `feat: refuse requests that do not come from this machine`.

- [ ] **Step 4: Testes das rotas (falham)**

`app.test.ts`, com `createApp` sobre `tempLibraryRoot()` e `localRequest`:

```ts
test("CA-0.3 POST /api/images stores the image and GET /api/images lists it first", ...);
// 201; corpo passa em ImageSchema; a lista traz a nova em images[0]
test("CA-0.5 POST /api/images answers 415 unsupported-type for a text file", ...);
test("CA-0.5 POST /api/images answers 413 too-large over 25 MB", ...);
test("GET /api/images/:id/file returns the same bytes with the image content type", ...);
test("GET /api/images/:id/file answers 404 not-found for an unknown or malformed id", ...);
test("CA-0.11 the API is behind the local-only guard", ...); // host estranho em /api/images → 403
```

Run: `pnpm test` → FAIL. Implemente as rotas e ligue `localOnly()`. Run: `pnpm check` → PASS. Commit: `feat: add the images API`.

---

### Task 3: Tela, biblioteca vazia e duas línguas

**Modelo:** Sonnet, esforço `medium`.
**Critérios:** CA-0.2 (convite), CA-0.10.

**Files:**
- Create: `src/web/i18n/index.tsx`, `src/web/i18n/pt-BR.ts`, `src/web/i18n/en.ts`, `src/web/i18n/i18n.test.ts`, `src/web/api.ts`
- Modify: `src/web/App.tsx`, `src/web/main.tsx`, `src/web/styles.css`, `e2e/shell.spec.ts`

**Interfaces:**
- Consumes: `GET /api/images`, `ImageListSchema`.
- Produces, em `src/web/i18n/index.tsx`:

```ts
export type Language = "pt-BR" | "en";
export const LANGUAGES: readonly Language[];
export type MessageKey = keyof typeof ptBR;
export function detectLanguage(preferred: readonly string[]): Language; // preferred[0] começa com "pt" → "pt-BR"; senão "en"
export function loadLanguage(storage: Pick<Storage, "getItem">, preferred: readonly string[]): Language;
export function saveLanguage(storage: Pick<Storage, "setItem">, language: Language): void; // chave "refpack.language"
export function translate(language: Language, key: MessageKey, vars?: Record<string, string>): string; // troca {nome} pelos vars
export function I18nProvider(props): JSX.Element;
export function useI18n(): { language: Language; setLanguage(language: Language): void; t(key: MessageKey, vars?: Record<string, string>): string };
```

- Produces, em `src/web/api.ts`: `fetchImages(): Promise<Image[]>` (valida com `ImageListSchema`).

**Textos (exatos; as tarefas 4 e 5 usam as chaves já criadas aqui):**

| Chave | pt-BR | en |
| --- | --- | --- |
| `language.label` | Língua | Language |
| `language.pt-BR` | Português | Português |
| `language.en` | English | English |
| `library.empty` | Sua biblioteca está vazia. Adicione a primeira imagem. | Your library is empty. Add your first image. |
| `library.add` | Adicionar imagens | Add images |
| `pack.generate` | Gerar pacote | Generate pack |
| `pack.disabledHint` | Adicione pelo menos uma imagem para gerar um pacote. | Add at least one image to generate a pack. |
| `pack.created` | Pacote gerado em: | Pack created at: |
| `pack.copy` | Copiar caminho | Copy path |
| `pack.copied` | Caminho copiado | Path copied |
| `error.unsupportedType` | {name}: tipo não aceito. Use PNG, JPEG ou WebP. | {name}: unsupported type. Use PNG, JPEG or WebP. |
| `error.tooLarge` | {name}: passa de 25 MB. | {name}: larger than 25 MB. |
| `error.generic` | Algo deu errado. Tente de novo. | Something went wrong. Try again. |

- [ ] **Step 1: Testes unitários de i18n (falham)**

`i18n.test.ts`:

```ts
test("CA-0.10 both languages have exactly the same keys and no empty text", ...);
test("CA-0.10 the first language follows the browser: pt* gives pt-BR, anything else en", ...);
// ["pt-BR","en"] → pt-BR; ["pt"] → pt-BR; ["en-US","pt-BR"] → en; ["fr"] → en; [] → en
test("CA-0.10 a saved choice wins over the browser preference", ...);
test("translate replaces {name} with the given value", ...);
```

Run: `pnpm test` → FAIL. Implemente. PASS. Commit: `feat: add the pt-BR and en dictionaries`.

- [ ] **Step 2: Testes de ponta a ponta (falham)**

Em `e2e/shell.spec.ts`:

```ts
test("CA-0.2 an empty library shows the invitation to add the first image", ...);
// texto "Your library is empty. Add your first image." visível
test("CA-0.10 switching the language changes every text at once and is remembered", ...);
// escolhe "Português" no seletor rotulado "Language" → "Sua biblioteca está vazia..." visível,
// <html lang="pt-BR">; após page.reload() continua em português
test.describe("browser in Portuguese", () => {
  test.use({ locale: "pt-BR" });
  test("CA-0.10 the first visit follows the browser language", ...); // convite em português
});
```

Run: `pnpm test:e2e` → FAIL.

- [ ] **Step 3: Implementar a tela**

`App.tsx`: cabeçalho com `<h1>refpack</h1>` e um `<select>` rotulado por `language.label`; corpo que carrega `fetchImages()` e, com lista vazia, mostra `library.empty`. `document.documentElement.lang` acompanha a língua. `main.tsx` envolve em `I18nProvider`, usando `localStorage` e `navigator.languages`.

Run: `pnpm check` → PASS. Commit: `feat: show the empty library in Portuguese or English`.

---

### Task 4: Adicionar imagens e ver a grade

**Modelo:** Sonnet, esforço `medium`.
**Critérios:** CA-0.3, CA-0.4, CA-0.5 (tela), CA-0.6 (ponta a ponta).

**Files:**
- Create: `src/web/library/AddImages.tsx`, `src/web/library/ImageGrid.tsx`, `e2e/library.spec.ts`
- Modify: `src/web/api.ts`, `src/web/App.tsx`, `src/web/styles.css`, `e2e/support.ts`

**Interfaces:**
- Consumes: `POST /api/images`, `ImageSchema`, `ErrorSchema`, `MAX_IMAGE_BYTES`, `useI18n`.
- Produces, em `src/web/api.ts`:

```ts
export type UploadResult = { ok: true; image: Image } | { ok: false; code: "unsupported-type" | "too-large" | "generic" };
export function uploadImage(file: File): Promise<UploadResult>;
```

- Produces, em `e2e/support.ts`:
  - `makeImageFile(page, dir, name, mimeType): Promise<string>` — desenha um canvas 8×8 no navegador, exporta no `mimeType` pedido (`image/png`, `image/jpeg` ou `image/webp`), grava em `dir/name` e devolve o caminho. É assim que os testes fabricam imagens de verdade.
  - `RunningApp` ganha `restart(): Promise<RunningApp>`: para o processo e sobe outro na mesma `libraryDir`.

**Decisões fixas:**

- `AddImages`: um botão `library.add` que aciona um `<input type="file" multiple>` escondido, com `accept=".png,.jpg,.jpeg,.webp"`.
- Os arquivos escolhidos são enviados **um por vez, na ordem em que vieram**. Um arquivo com `size > MAX_IMAGE_BYTES` não é enviado: gera direto o erro `too-large`.
- Cada imagem aceita entra no topo da grade assim que a resposta chega. Cada recusa acrescenta uma linha numa lista de avisos (`role="alert"`), com `error.unsupportedType` ou `error.tooLarge` e o nome do arquivo. Falha de rede ou resposta inesperada: `error.generic`.
- `ImageGrid`: uma lista (`<ul>`) de `<img>` com `src` = `url` e `alt` = `originalName`.

- [ ] **Step 1: Testes de ponta a ponta (falham)**

`e2e/library.spec.ts`:

```ts
test("CA-0.3 chosen images appear in the grid, newest first, without reloading", ...);
// escolhe a.png, b.jpg e c.webp de uma vez pelo botão "Add images" →
// 3 imagens na grade, na ordem alt [c.webp, b.jpg, a.png], todas com naturalWidth > 0;
// o convite de biblioteca vazia some
test("CA-0.4 the original file is left untouched", ...);
// bytes do arquivo de origem iguais antes e depois de adicionar
test("CA-0.5 a file that is not an image is refused with its name and the reason, and the others are kept", ...);
// escolhe a.png + notes.png (conteúdo de texto) → alerta "notes.png: unsupported type. Use PNG, JPEG or WebP.";
// a grade tem só a.png
test("CA-0.5 a file over 25 MB is refused with its name and the reason", ...);
// arquivo big.png de MAX_IMAGE_BYTES + 1 bytes → alerta "big.png: larger than 25 MB."; grade vazia
test("CA-0.6 the same images are there, in the same order, after closing and opening again", ...);
// adiciona 2; app.restart(); page.goto(nova url) → mesmos alts na mesma ordem
test("the same file added twice appears twice", ...);
```

Run: `pnpm test:e2e` → FAIL.

- [ ] **Step 2: Implementar**

Run: `pnpm check` → PASS. Commit: `feat: add images from the screen and show them in a grid`.

---

### Task 5: Gerar o pacote

**Modelo:** Sonnet, esforço `medium`.
**Critérios:** CA-0.2 (botão desativado), CA-0.7, CA-0.8, CA-0.9.

**Files:**
- Create: `src/server/pack.ts`, `src/server/pack.test.ts`, `src/web/pack/PackPanel.tsx`, `e2e/pack.spec.ts`
- Modify: `src/server/app.ts`, `src/server/app.test.ts`, `src/server/main.ts`, `src/web/api.ts`, `src/web/App.tsx`, `src/web/styles.css`

**Interfaces:**
- Consumes: `Library`, `listImages`, `PackCreatedSchema`.
- Produces, em `src/server/pack.ts`:

```ts
export function packFolderName(now: Date): string;              // "pack-20261109-140509", hora local
export function refNumber(index: number, count: number): string; // largura = max(2, dígitos de count)
export type PackResult = { ok: true; path: string; count: number } | { ok: false; code: "empty-library" };
export function createPack(library: Library, now: Date): PackResult;
```

- Produces: `createApp(deps: { webDir: string; library: Library; now: () => Date })`; `main.ts` passa `() => new Date()`.
- Produces: `POST /api/packs` → 201 com `PackCreatedSchema` (`path` absoluto); 409 `empty-library`.
- Produces, em `src/web/api.ts`: `createPack(): Promise<{ ok: true; pack: PackCreated } | { ok: false; code: "empty-library" | "generic" }>`.

**Decisões fixas:**

- A pasta é `packsDir/<packFolderName(now)>`. `packsDir` é criado se faltar. Se a pasta já existir, tenta o mesmo nome com `-2`, depois `-3`, e assim por diante.
- Biblioteca vazia: devolve `empty-library` e **não cria nada**.
- Conteúdo, com as imagens na ordem de `listImages` (a mais recente é a `01`):
  - `refs/<refNumber>.<extension>`: cópia byte a byte de cada imagem;
  - `.gitignore`: exatamente `*` e uma quebra de linha;
  - `README.md`: exatamente este texto, com quebras de linha `\n`, terminando em uma quebra de linha (o exemplo é de 3 imagens em 9/11/2026 14:05:09):

```markdown
# Reference pack

This folder is a set of design references exported from refpack.
Use the images in `refs/` as visual references for the interface you are asked to build.

- Created: 2026-11-09 14:05:09
- References: 3

## References

1. `refs/01.webp`
2. `refs/02.jpg`
3. `refs/03.png`
```

- `PackPanel`: botão `pack.generate`. Com zero imagens fica desativado e `pack.disabledHint` aparece ao lado. Depois de gerar: `pack.created`, o caminho num `<code>`, e um botão `pack.copy` que usa `navigator.clipboard.writeText(path)` e passa a mostrar `pack.copied`.

- [ ] **Step 1: Testes unitários do pacote (falham)**

`pack.test.ts`, com `new Date(2026, 10, 9, 14, 5, 9)` (hora local):

```ts
test("packFolderName formats the local date and time", ...);            // "pack-20261109-140509"
test("refNumber pads to two digits, or more when the pack needs it", ...); // (1,3)→"01"; (12,12)→"12"; (7,120)→"007"
test("CA-0.7 creates the pack folder with numbered refs, README and .gitignore", ...);
// biblioteca com PNG, JPEG, WEBP (nessa ordem de adição) → path = join(packsDir,"pack-20261109-140509");
// refs/01.webp, refs/02.jpg, refs/03.png com os bytes das imagens; .gitignore === "*\n";
// README.md === o texto acima
test("CA-0.9 generating twice in the same second creates two different folders", ...); // segunda termina em "-2"
test("CA-0.9 generating a pack leaves the library unchanged", ...);     // listImages e arquivos de imagesDir iguais
test("an empty library creates nothing and answers empty-library", ...); // packsDir não existe depois
```

Run: `pnpm test` → FAIL. Implemente. PASS. Commit: `feat: generate a pack folder from the library`.

- [ ] **Step 2: Testes da rota (falham)**

Em `app.test.ts`:

```ts
test("CA-0.7 POST /api/packs answers 201 with the absolute path and the count", ...);
test("POST /api/packs answers 409 empty-library when there are no images", ...);
```

Run: `pnpm test` → FAIL. Implemente a rota. PASS. Commit: `feat: add the packs API`.

- [ ] **Step 3: Testes de ponta a ponta (falham)**

`e2e/pack.spec.ts`:

```ts
test("CA-0.2 the generate button is disabled with an explanation while the library is empty", ...);
test("CA-0.7 CA-0.8 generating shows the full path of a folder that holds the pack", ...);
// adiciona 2 imagens; clica "Generate pack"; o caminho mostrado existe no disco, fica dentro de
// join(app.libraryDir, "packs") e contém README.md, .gitignore, refs/01.* e refs/02.*
test("CA-0.8 the copy button puts the path on the clipboard", ...);
// context.grantPermissions(["clipboard-read","clipboard-write"]); clica "Copy path";
// navigator.clipboard.readText() === caminho mostrado; o botão mostra "Path copied"
test("CA-0.9 the grid is the same after generating", ...);
```

Run: `pnpm test:e2e` → FAIL. Implemente `PackPanel` e ligue em `App.tsx`. Run: `pnpm check` → PASS. Commit: `feat: generate the pack from the screen and show where it is`.

---

### Task 6: Abrir com um comando

**Modelo:** Sonnet, esforço `medium`.
**Critérios:** CA-0.1, CA-0.14; prepara CA-0.13.

**Files:**
- Create: `src/server/open-browser.ts`, `src/server/open-browser.test.ts`, `e2e/start.spec.ts`
- Modify: `src/server/main.ts`, `e2e/support.ts`, `ROADMAP.md`

**Interfaces:**
- Consumes: `main.ts`, `listenLocal`, `startApp`.
- Produces, em `e2e/support.ts`: `runStart(env: Record<string, string>): Promise<{ code: number | null; stdout: string; stderr: string }>` — roda `node src/server/main.ts` com esse ambiente (mais `REFPACK_NO_OPEN=1`) e espera o processo terminar.
- Produces, em `src/server/open-browser.ts`:

```ts
export function browserCommand(platform: NodeJS.Platform, url: string): { command: string; args: string[] };
export function openBrowser(url: string): void;
```

**Decisões fixas:**

- `browserCommand`: `linux` → `xdg-open [url]`; `darwin` → `open [url]`; `win32` → `cmd ["/c", "start", "", url]`; qualquer outro → como `linux`.
- `openBrowser` inicia o comando solto do processo (`detached`, `stdio: "ignore"`, `unref()`) e ignora qualquer falha, inclusive o evento `error` do processo filho (precisa de um ouvinte vazio): o endereço já está no terminal.
- `main.ts`: depois de imprimir a linha `refpack: ...`, chama `openBrowser(url)`, a não ser que `REFPACK_NO_OPEN` esteja definido.
- `main.ts` passa a **escutar antes de abrir a biblioteca**: chama `listenLocal` com um `fetch` que responde 503 enquanto o app não existe e delega a `app.fetch` depois; em seguida abre a biblioteca, cria o app e imprime a linha `refpack: ...`.
- Porta ocupada (`listenLocal` rejeita com `EADDRINUSE`): `main.ts` imprime estas duas linhas no erro padrão e termina com código 1, sem ter aberto nem criado a biblioteca:

```
refpack já está aberto em http://127.0.0.1:<porta>
refpack is already open at http://127.0.0.1:<porta>
```

- [ ] **Step 1: Testes (falham)**

`open-browser.test.ts`:

```ts
test("CA-0.1 browserCommand picks the opener of each system", ...); // os três casos acima + "freebsd"
```

`e2e/start.spec.ts`:

```ts
test("CA-0.1 starting prints the local address and creates the library", ...);
// app.url casa com /^http:\/\/127\.0\.0\.1:\d+$/; existe join(app.libraryDir, "library.db")
test("CA-0.14 starting again while it is open says so in both languages and starts nothing", ...);
// runStart({ REFPACK_PORT: porta do primeiro, REFPACK_LIBRARY: outra pasta ainda inexistente }) →
// code === 1; stderr contém as duas linhas com a URL do primeiro;
// a segunda libraryDir não foi criada; a primeira tela continua respondendo
```

Run: `pnpm check` → FAIL. Implemente. Run: `pnpm check` → PASS. Commit: `feat: open the screen in the browser on start and report when already open`.

- [ ] **Step 2: Conferência final da fatia — feita pelo condutor**

Run: `pnpm check` → PASS, saída guardada para o relatório.
Run: `gh pr checks` → os 4 jobs verdes.
Conferir, um a um, que CA-0.1 a CA-0.12 e CA-0.14 têm teste com o identificador no nome: `grep -rhoE "CA-0\.[0-9]+" src e2e | sort -u`.

Só então: revisão da fatia (Opus, contexto limpo), conforme `docs/WORKFLOW.md`.

- [ ] **Step 3: Depois do "aprovado" do dono**

Em `ROADMAP.md`, fatia 0 passa a `feita` e a fatia 1 a `próxima`. Commit: `docs: mark slice 0 as done`. Merge do pull request.

---

## Roteiro de teste manual do dono

O condutor deixa o branch pronto e avisa. Você precisa de duas ou três imagens suas (PNG, JPEG ou WebP) e de um arquivo qualquer que não seja imagem.

1. No terminal, dentro da pasta `refpack`, rode `pnpm start`.
   **Esperado:** aparece uma linha `refpack: http://127.0.0.1:4747` e a tela abre sozinha no navegador. *(CA-0.1)*
2. Olhe a tela.
   **Esperado:** um convite para adicionar a primeira imagem; o botão "Gerar pacote" está apagado, com uma explicação ao lado. *(CA-0.2)*
3. Troque a língua no seletor, para inglês e de volta.
   **Esperado:** todos os textos mudam na hora. *(CA-0.10)*
4. Clique em "Adicionar imagens" e escolha duas imagens de uma vez.
   **Esperado:** as duas aparecem na grade sem recarregar a página. *(CA-0.3)*
5. Clique em "Adicionar imagens" e escolha o arquivo que não é imagem.
   **Esperado:** um aviso com o nome do arquivo e o motivo; a grade não muda. *(CA-0.5)*
6. Confira que suas imagens originais continuam onde estavam. *(CA-0.4)*
7. Clique em "Gerar pacote".
   **Esperado:** a tela mostra o caminho de uma pasta e um botão "Copiar caminho". *(CA-0.7, CA-0.8)*
8. Abra essa pasta no gerenciador de arquivos.
   **Esperado:** uma pasta `refs` com suas imagens numeradas (`01`, `02`) e um arquivo `README.md`. *(CA-0.7)*
9. Sem fechar o refpack, abra outro terminal na pasta `refpack` e rode `pnpm start` de novo.
   **Esperado:** um aviso de que o refpack já está aberto, com o endereço. *(CA-0.14)*
10. Feche o refpack (Ctrl+C no primeiro terminal), rode `pnpm start` outra vez.
    **Esperado:** as mesmas imagens, na mesma ordem, e a língua que você deixou. *(CA-0.6, CA-0.10)*
11. Clique em "Copiar caminho". Numa sessão do Claude Code, escreva "leia a pasta" e cole o caminho.
    **Esperado:** ele diz quantas referências há e descreve cada uma. *(CA-0.13)*

Responda "aprovado" ou diga em qual passo o resultado foi diferente do esperado.
