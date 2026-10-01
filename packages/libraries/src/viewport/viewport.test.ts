import { describe, expect, it } from "vitest";
import { fitTransform, naturalHeight, zoomRange } from "./viewport.js";

describe("fitTransform", () => {
  it("centres content without upscaling past 1", () => {
    expect(
      fitTransform({ x: 0, y: 0, width: 100, height: 50 }, { width: 400, height: 250 }, 20),
    ).toEqual({
      zoom: 1,
      x: 150,
      y: 100,
    });
  });

  it("scales down to fit and compensates for the bounds origin", () => {
    const t = fitTransform(
      { x: -100, y: 0, width: 1000, height: 100 },
      { width: 520, height: 400 },
      10,
    );
    expect(t.zoom).toBe(0.5);
    expect(t.x).toBe(10 + 50);
    expect(t.y).toBe(175);
  });

  it("respects a custom max zoom and empty bounds", () => {
    expect(
      fitTransform({ x: 0, y: 0, width: 100, height: 100 }, { width: 400, height: 400 }, 0, 2).zoom,
    ).toBe(2);
    expect(
      fitTransform({ x: 0, y: 0, width: 0, height: 0 }, { width: 400, height: 400 }).zoom,
    ).toBe(1);
  });
});

describe("zoomRange", () => {
  it("maps options to limits", () => {
    expect(zoomRange(undefined)).toEqual([0.05, 1]);
    expect(zoomRange(false)).toEqual([0.05, 1]);
    expect(zoomRange(true)).toEqual([0.5, 2]);
    expect(zoomRange([3, 0.2])).toEqual([0.2, 3]);
  });
});

describe("naturalHeight", () => {
  it("is the content height at the width-fitting scale plus padding", () => {
    expect(naturalHeight({ x: 0, y: 0, width: 200, height: 100 }, 1000, 10)).toBe(120);
    expect(naturalHeight({ x: 0, y: 0, width: 400, height: 100 }, 220, 10)).toBe(70);
    expect(naturalHeight({ x: 0, y: 0, width: 0, height: 30 }, 220, 10)).toBe(50);
  });
});
