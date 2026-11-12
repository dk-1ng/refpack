import { expect, test } from "vitest";
import { areaBetween, isBigEnough, pixelRect, toFraction } from "./area.ts";

test("CA-4.1 toFraction gives the pointer as fractions of the frame and stops at its edges", () => {
  const frame = { left: 100, top: 50, width: 400, height: 200 };
  expect(toFraction({ x: 300, y: 150 }, frame)).toEqual({ x: 0.5, y: 0.5 });
  expect(toFraction({ x: 100, y: 50 }, frame)).toEqual({ x: 0, y: 0 });
  expect(toFraction({ x: 40, y: 20 }, frame)).toEqual({ x: 0, y: 0 });
  expect(toFraction({ x: 900, y: 900 }, frame)).toEqual({ x: 1, y: 1 });
});

test("areaBetween orders the edges whatever the drag direction", () => {
  expect(areaBetween({ x: 0.7, y: 0.6 }, { x: 0.2, y: 0.1 })).toEqual({
    left: 0.2,
    top: 0.1,
    right: 0.7,
    bottom: 0.6,
  });
  expect(areaBetween({ x: 0.2, y: 0.6 }, { x: 0.7, y: 0.1 })).toEqual({
    left: 0.2,
    top: 0.1,
    right: 0.7,
    bottom: 0.6,
  });
});

test("CA-4.1 isBigEnough refuses an area under 10 pixels wide or tall on the screen", () => {
  const frame = { width: 400, height: 200 };
  expect(isBigEnough({ left: 0, top: 0, right: 0.025, bottom: 0.05 }, frame)).toBe(true);
  expect(isBigEnough({ left: 0, top: 0, right: 0.0225, bottom: 0.5 }, frame)).toBe(false);
  expect(isBigEnough({ left: 0, top: 0, right: 0.5, bottom: 0.045 }, frame)).toBe(false);
  expect(isBigEnough({ left: 0.3, top: 0.3, right: 0.3, bottom: 0.3 }, frame)).toBe(false);
});

test("CA-4.9 pixelRect covers every pixel the area touches and is never empty", () => {
  const small = { width: 8, height: 8 };
  expect(pixelRect({ left: 0.1, top: 0.1, right: 0.4, bottom: 0.4 }, small)).toEqual({
    x: 0,
    y: 0,
    width: 4,
    height: 4,
  });
  expect(pixelRect({ left: 0.6, top: 0.6, right: 0.9, bottom: 0.9 }, small)).toEqual({
    x: 4,
    y: 4,
    width: 4,
    height: 4,
  });
  expect(pixelRect({ left: 0.5, top: 0.5, right: 0.51, bottom: 0.51 }, small)).toEqual({
    x: 4,
    y: 4,
    width: 1,
    height: 1,
  });
  expect(pixelRect({ left: 0, top: 0, right: 1, bottom: 1 }, { width: 1000, height: 500 })).toEqual(
    { x: 0, y: 0, width: 1000, height: 500 },
  );
});
