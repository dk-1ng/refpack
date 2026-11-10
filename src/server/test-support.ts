import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Hono } from "hono";

export function tempLibraryRoot(): string {
  return join(mkdtempSync(join(tmpdir(), "refpack-")), "Bibliotéca de tésté");
}

export const PNG_BYTES = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3, 4,
]);
export const JPEG_BYTES = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3, 4]);
export const WEBP_BYTES = new Uint8Array([
  0x52, 0x49, 0x46, 0x46, 4, 0, 0, 0, 0x57, 0x45, 0x42, 0x50, 1, 2, 3, 4,
]);

export function localRequest(
  app: Hono,
  path: string,
  init?: RequestInit,
): Response | Promise<Response> {
  const headers = new Headers(init?.headers);
  headers.set("host", "127.0.0.1:4747");
  return app.request(`http://127.0.0.1:4747${path}`, { ...init, headers });
}
