export type ImageType =
  | { mimeType: "image/png"; extension: "png" }
  | { mimeType: "image/jpeg"; extension: "jpg" }
  | { mimeType: "image/webp"; extension: "webp" };

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const JPEG_SIGNATURE = [0xff, 0xd8, 0xff];
const RIFF = [0x52, 0x49, 0x46, 0x46];
const WEBP = [0x57, 0x45, 0x42, 0x50];

function hasBytesAt(bytes: Uint8Array, offset: number, expected: number[]): boolean {
  return expected.every((value, index) => bytes[offset + index] === value);
}

export function sniffImageType(bytes: Uint8Array): ImageType | null {
  if (hasBytesAt(bytes, 0, PNG_SIGNATURE)) {
    return { mimeType: "image/png", extension: "png" };
  }
  if (hasBytesAt(bytes, 0, JPEG_SIGNATURE)) {
    return { mimeType: "image/jpeg", extension: "jpg" };
  }
  if (hasBytesAt(bytes, 0, RIFF) && hasBytesAt(bytes, 8, WEBP)) {
    return { mimeType: "image/webp", extension: "webp" };
  }
  return null;
}
