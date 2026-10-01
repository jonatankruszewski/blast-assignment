import { describe, expect, it } from "vitest";
import { nextInDirection, readingOrder, type NavItem } from "./keyboard-nav.js";

const item = (id: string, x: number, y: number): NavItem => ({
  id,
  rect: { x, y, width: 20, height: 20 },
});
// a   c
// b   d   e
const items = [
  item("a", 0, 0),
  item("b", 0, 50),
  item("c", 100, 0),
  item("d", 100, 50),
  item("e", 200, 60),
];

describe("nextInDirection", () => {
  it("moves to the nearest node in each direction", () => {
    expect(nextInDirection(items, "a", "right")).toBe("c");
    expect(nextInDirection(items, "a", "down")).toBe("b");
    expect(nextInDirection(items, "d", "up")).toBe("c");
    expect(nextInDirection(items, "d", "left")).toBe("b");
    expect(nextInDirection(items, "d", "right")).toBe("e");
  });

  it("stops at the edge and recovers from unknown ids", () => {
    expect(nextInDirection(items, "a", "left")).toBeUndefined();
    expect(nextInDirection(items, "a", "up")).toBeUndefined();
    expect(nextInDirection(items, "zzz", "up")).toBe("a");
  });

  it("orders by column, then top to bottom", () => {
    expect(readingOrder(items)).toEqual(["a", "b", "c", "d", "e"]);
  });
});
