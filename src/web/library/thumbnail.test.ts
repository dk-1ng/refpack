import { expect, test } from "vitest";
import { centreSquare } from "./thumbnail.ts";

test("CA-6.12 centreSquare takes the middle of a wide, a tall and a square image", () => {
  expect(centreSquare(1200, 800)).toEqual({ x: 200, y: 0, side: 800, size: 384 });
  expect(centreSquare(800, 3000)).toEqual({ x: 0, y: 1100, side: 800, size: 384 });
  expect(centreSquare(500, 500)).toEqual({ x: 0, y: 0, side: 500, size: 384 });
  expect(centreSquare(101, 100)).toEqual({ x: 0, y: 0, side: 100, size: 100 });
  expect(centreSquare(8, 8)).toEqual({ x: 0, y: 0, side: 8, size: 8 });
});
