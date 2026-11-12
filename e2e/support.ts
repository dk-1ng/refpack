import { type ChildProcess, spawn } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { test as base, type JSHandle, type Locator, type Page } from "@playwright/test";

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

export async function runStart(
  env: Record<string, string>,
): Promise<{ code: number | null; stdout: string; stderr: string }> {
  const child = spawn(process.execPath, ["src/server/main.ts"], {
    cwd: repoRoot,
    env: { ...process.env, ...env, REFPACK_NO_OPEN: "1" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let stdout = "";
  let stderr = "";
  child.stdout?.on("data", (chunk: Buffer) => {
    stdout += chunk.toString("utf8");
  });
  child.stderr?.on("data", (chunk: Buffer) => {
    stderr += chunk.toString("utf8");
  });
  const code = await new Promise<number | null>((resolveCode, reject) => {
    child.once("error", reject);
    child.once("close", (exitCode) => resolveCode(exitCode));
  });
  return { code, stdout, stderr };
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

export type FakeFile = {
  name: string;
  content: "image/png" | "image/jpeg" | "image/webp" | "text";
  width?: number; // default 8
  height?: number; // default 8
};
// The fake image keeps its pattern at any size: blue, with the top-left quarter yellow.

// Builds, inside the page, what a paste or a drop carries.
async function makeDataTransfer(
  page: Page,
  files: FakeFile[],
  text?: string,
): Promise<JSHandle<DataTransfer>> {
  return page.evaluateHandle(
    async ({ files, text }) => {
      const data = new DataTransfer();
      for (const { name, content, width = 8, height = 8 } of files) {
        if (content === "text") {
          data.items.add(new File(["just some text, not an image"], name, { type: "text/plain" }));
          continue;
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d");
        if (context === null) throw new Error("no 2d context");
        context.fillStyle = "#3366cc";
        context.fillRect(0, 0, width, height);
        context.fillStyle = "#ffcc00";
        context.fillRect(0, 0, width / 2, height / 2);
        const blob = await new Promise<Blob | null>((resolveBlob) =>
          canvas.toBlob(resolveBlob, content),
        );
        if (blob === null) throw new Error(`cannot export ${content}`);
        data.items.add(new File([blob], name, { type: content }));
      }
      if (text !== undefined) data.setData("text/plain", text);
      return data;
    },
    { files, text },
  );
}

// Fires, inside the page, the paste event a browser fires on Ctrl+V.
export async function paste(page: Page, files: FakeFile[], text?: string): Promise<void> {
  await page.evaluate(
    (data) => {
      const event = new ClipboardEvent("paste", { bubbles: true, cancelable: true });
      Object.defineProperty(event, "clipboardData", { value: data });
      document.body.dispatchEvent(event);
    },
    await makeDataTransfer(page, files, text),
  );
}

// Fires the paste event on one element, as when the cursor is inside it.
export async function pasteInto(target: Locator, files: FakeFile[], text?: string): Promise<void> {
  await target.evaluate(
    (element, data) => {
      const event = new ClipboardEvent("paste", { bubbles: true, cancelable: true });
      Object.defineProperty(event, "clipboardData", { value: data });
      element.dispatchEvent(event);
    },
    await makeDataTransfer(target.page(), files, text),
  );
}

// Fires, inside the page, the events of a drop on the screen. Works in both browsers.
export async function drop(page: Page, files: FakeFile[], text?: string): Promise<void> {
  const dataTransfer = await makeDataTransfer(page, files, text);
  const target = page.locator("main");
  await target.dispatchEvent("dragenter", { dataTransfer });
  await target.dispatchEvent("dragover", { dataTransfer });
  await target.dispatchEvent("drop", { dataTransfer });
}

// Decodes a PNG file inside the page: its size and the colour of each asked pixel, as "#rrggbb".
export async function readPng(
  page: Page,
  path: string,
  points: [number, number][],
): Promise<{ width: number; height: number; colors: string[] }> {
  const base64 = (await readFile(path)).toString("base64");
  return page.evaluate(
    async ({ base64, points }) => {
      const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
      const bitmap = await createImageBitmap(new Blob([bytes], { type: "image/png" }));
      const canvas = document.createElement("canvas");
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const context = canvas.getContext("2d");
      if (context === null) throw new Error("no 2d context");
      context.drawImage(bitmap, 0, 0);
      const hex = (value: number) => value.toString(16).padStart(2, "0");
      const colors = points.map(([x, y]) => {
        const [r = 0, g = 0, b = 0] = context.getImageData(x, y, 1, 1).data;
        return `#${hex(r)}${hex(g)}${hex(b)}`;
      });
      return { width: bitmap.width, height: bitmap.height, colors };
    },
    { base64, points },
  );
}

// A real drop of files and folders from disk. Chromium only (ADR-0010).
export async function dropPaths(page: Page, paths: string[]): Promise<void> {
  const session = await page.context().newCDPSession(page);
  const data = { items: [], files: paths, dragOperationsMask: 1 };
  for (const type of ["dragEnter", "dragOver", "drop"] as const) {
    await session.send("Input.dispatchDragEvent", { type, x: 200, y: 200, data });
  }
  await session.detach();
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
