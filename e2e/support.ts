import { type ChildProcess, spawn } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { test as base, type Page } from "@playwright/test";

export type RunningApp = {
  url: string;
  libraryDir: string;
  stop(): Promise<void>;
  restart(): Promise<RunningApp>;
};

const repoRoot = resolve(import.meta.dirname, "..");
const readyPrefix = "refpack: ";

type Launched = { child: ChildProcess; exited: Promise<void>; url: string };

async function launch(libraryDir: string): Promise<Launched> {
  const child = spawn(process.execPath, ["src/server/main.ts"], {
    cwd: repoRoot,
    env: {
      ...process.env,
      REFPACK_LIBRARY: libraryDir,
      REFPACK_PORT: "0",
      REFPACK_NO_OPEN: "1",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  const exited = new Promise<void>((resolveExit) => {
    if (child.exitCode !== null || child.signalCode !== null) {
      resolveExit();
      return;
    }
    child.once("exit", () => resolveExit());
  });

  try {
    const url = await waitForReadyLine(child);
    return { child, exited, url };
  } catch (error) {
    await terminate({ child, exited });
    throw error;
  }
}

async function terminate(running: Pick<Launched, "child" | "exited">): Promise<void> {
  if (running.child.exitCode === null && running.child.signalCode === null) {
    running.child.kill();
  }
  await running.exited;
}

export async function startApp(options?: { libraryDir?: string }): Promise<RunningApp> {
  const tempRoot =
    options?.libraryDir === undefined ? await mkdtemp(join(tmpdir(), "refpack-")) : undefined;
  const libraryDir = options?.libraryDir ?? join(tempRoot as string, "Bibliotéca de tésté");

  const removeTemp = async (): Promise<void> => {
    if (tempRoot !== undefined) {
      await rm(tempRoot, { recursive: true, force: true, maxRetries: 5 });
    }
  };

  let current: Launched;
  try {
    current = await launch(libraryDir);
  } catch (error) {
    await removeTemp();
    throw error;
  }

  const app: RunningApp = {
    url: current.url,
    libraryDir,
    async stop() {
      await terminate(current);
      await removeTemp();
    },
    async restart() {
      await terminate(current);
      current = await launch(libraryDir);
      app.url = current.url;
      return app;
    },
  };
  return app;
}

export async function makeImageFile(
  page: Page,
  dir: string,
  name: string,
  mimeType: "image/png" | "image/jpeg" | "image/webp",
): Promise<string> {
  const base64 = await page.evaluate(async (type) => {
    const canvas = document.createElement("canvas");
    canvas.width = 8;
    canvas.height = 8;
    const context = canvas.getContext("2d");
    if (context === null) throw new Error("no 2d context");
    context.fillStyle = "#3366cc";
    context.fillRect(0, 0, 8, 8);
    context.fillStyle = "#ffcc00";
    context.fillRect(0, 0, 4, 4);
    const blob = await new Promise<Blob | null>((resolveBlob) => canvas.toBlob(resolveBlob, type));
    if (blob === null) throw new Error(`cannot export ${type}`);
    const bytes = new Uint8Array(await blob.arrayBuffer());
    let binary = "";
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return btoa(binary);
  }, mimeType);
  await mkdir(dir, { recursive: true });
  const path = join(dir, name);
  await writeFile(path, Buffer.from(base64, "base64"));
  return path;
}

function waitForReadyLine(child: ChildProcess): Promise<string> {
  return new Promise((resolveUrl, reject) => {
    let stdout = "";
    let stderr = "";
    const onStdout = (chunk: Buffer): void => {
      stdout += chunk.toString("utf8");
      for (const line of stdout.split(/\r?\n/)) {
        if (line.startsWith(readyPrefix)) {
          cleanup();
          resolveUrl(line.slice(readyPrefix.length).trim());
          return;
        }
      }
    };
    const onStderr = (chunk: Buffer): void => {
      stderr += chunk.toString("utf8");
    };
    const onExit = (code: number | null): void => {
      cleanup();
      reject(new Error(`refpack exited with code ${code} before it was ready.\n${stderr}`));
    };
    const cleanup = (): void => {
      child.stdout?.off("data", onStdout);
      child.off("exit", onExit);
    };
    child.stdout?.on("data", onStdout);
    child.stderr?.on("data", onStderr);
    child.once("exit", onExit);
  });
}

export const test = base.extend<{ app: RunningApp }>({
  // biome-ignore lint/correctness/noEmptyPattern: Playwright requires a destructured first argument.
  app: async ({}, use) => {
    const app = await startApp();
    try {
      await use(app);
    } finally {
      await app.stop();
    }
  },
});

export { expect } from "@playwright/test";
