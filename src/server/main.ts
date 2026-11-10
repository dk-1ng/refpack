import { homedir } from "node:os";
import { resolve } from "node:path";
import { createApp, listenLocal } from "./app.ts";
import { openLibrary, resolveLibraryRoot } from "./library.ts";
import { openBrowser } from "./open-browser.ts";

const defaultPort = 4747;

const port = Number(process.env.REFPACK_PORT ?? defaultPort);
const webDir = resolve(import.meta.dirname, "../../dist/web");

let app: ReturnType<typeof createApp> | undefined;
const startingUp = (): Response => new Response("starting", { status: 503 });

let server: Awaited<ReturnType<typeof listenLocal>>;
try {
  server = await listenLocal((request) => (app ? app.fetch(request) : startingUp()), port);
} catch (error) {
  if ((error as NodeJS.ErrnoException).code === "EADDRINUSE") {
    const url = `http://127.0.0.1:${port}`;
    console.error(`refpack já está aberto em ${url}`);
    console.error(`refpack is already open at ${url}`);
    process.exit(1);
  }
  throw error;
}

app = createApp({
  webDir,
  library: openLibrary(resolveLibraryRoot(process.env, homedir())),
  now: () => new Date(),
});

const url = `http://${server.address}:${server.port}`;
console.log(`refpack: ${url}`);
if (process.env.REFPACK_NO_OPEN === undefined) openBrowser(url);
