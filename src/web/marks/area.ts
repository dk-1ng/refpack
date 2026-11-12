import type { Area } from "../../shared/api.ts";

export const MIN_DRAG_PIXELS = 10;
export type Point = { x: number; y: number };
export type Box = { left: number; top: number; width: number; height: number };

// Keeps a measure that only differs from the limit by rounding (0.025 × 400 = 9.999…) at the limit.
const ROUNDING = 1e-9;

function clamp(value: number): number {
  return Math.min(1, Math.max(0, value));
}

// Where a pointer is over the frame, as fractions of it, kept inside 0..1.
export function toFraction(pointer: Point, frame: Box): Point {
  return {
    x: clamp((pointer.x - frame.left) / frame.width),
    y: clamp((pointer.y - frame.top) / frame.height),
  };
}

// The area between two corners, whatever the direction of the drag.
export function areaBetween(a: Point, b: Point): Area {
  return {
    left: Math.min(a.x, b.x),
    top: Math.min(a.y, b.y),
    right: Math.max(a.x, b.x),
    bottom: Math.max(a.y, b.y),
  };
}

// False when the area is under MIN_DRAG_PIXELS wide or tall on a frame of this size.
export function isBigEnough(area: Area, frame: { width: number; height: number }): boolean {
  const width = (area.right - area.left) * frame.width;
  const height = (area.bottom - area.top) * frame.height;
  return width >= MIN_DRAG_PIXELS - ROUNDING && height >= MIN_DRAG_PIXELS - ROUNDING;
}

// The pixels of the original image the area covers: left and top rounded down, right and
// bottom rounded up, so it is never empty.
export function pixelRect(
  area: Area,
  natural: { width: number; height: number },
): { x: number; y: number; width: number; height: number } {
  const x = Math.min(natural.width - 1, Math.floor(area.left * natural.width));
  const y = Math.min(natural.height - 1, Math.floor(area.top * natural.height));
  const right = Math.min(natural.width, Math.ceil(area.right * natural.width));
  const bottom = Math.min(natural.height, Math.ceil(area.bottom * natural.height));
  return { x, y, width: Math.max(1, right - x), height: Math.max(1, bottom - y) };
}
