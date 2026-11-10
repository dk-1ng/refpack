import { type ChildProcess, spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { test as base } from "@playwright/test";

export type RunningApp = {
  url: string;
  libraryDir: string;
  stop(): Promise<void>;
};

const repoRoot = resolve(import.meta.dirname, "..");
const readyPrefix = "refpack: ";

export async function startApp(options?: { libraryDir?: string }): Promise<RunningApp> {
  const tempRoot =
    options?.libraryDir === undefined ? await mkdtemp(join(tmpdir(), "refpack-")) : undefined;
  const libraryDir = options?.libraryDir ?? join(tempRoot as string, "Bibliotéca de tésté");

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

  const removeTemp = async (): Promise<void> => {
    if (tempRoot !== undefined) {
      await rm(tempRoot, { recursive: true, force: true, maxRetries: 5 });
    }
  };

  const stop = async (): Promise<void> => {
    if (child.exitCode === null && child.signalCode === null) {
      child.kill();
    }
    await exited;
    await removeTemp();
  };

  try {
    const url = await waitForReadyLine(child);
    return { url, libraryDir, stop };
  } catch (error) {
    await stop();
    throw error;
  }
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
