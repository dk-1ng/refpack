import { expect, test } from "vitest";
import { sniffImageType } from "./image-type.ts";
import { JPEG_BYTES, PNG_BYTES, WEBP_BYTES } from "./test-support.ts";

test("recognizes PNG, JPEG and WebP by their first bytes", () => {
  expect(sniffImageType(PNG_BYTES)).toEqual({ mimeType: "image/png", extension: "png" });
  expect(sniffImageType(JPEG_BYTES)).toEqual({ mimeType: "image/jpeg", extension: "jpg" });
  expect(sniffImageType(WEBP_BYTES)).toEqual({ mimeType: "image/webp", extension: "webp" });
});

test("returns null for empty, text, truncated signature and non-WebP RIFF", () => {
  expect(sniffImageType(new Uint8Array([]))).toBeNull();
  expect(sniffImageType(new TextEncoder().encode("hello"))).toBeNull();
  expect(sniffImageType(PNG_BYTES.slice(0, 7))).toBeNull();
  expect(sniffImageType(new TextEncoder().encode("RIFF....WAVE"))).toBeNull();
});
