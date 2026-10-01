import { describe, expect, it } from "vitest";
import {
  anchorPoint,
  portPoint,
  rectCenter,
  sideDirection,
  sidePoint,
  unionRects,
} from "./geometry.js";

const r = { x: 10, y: 20, width: 100, height: 40 };

describe("geometry", () => {
  it("computes side points with offsets (clamped)", () => {
    expect(sidePoint(r, "top")).toEqual({ x: 60, y: 20 });
    expect(sidePoint(r, "bottom", 0.25)).toEqual({ x: 35, y: 60 });
    expect(sidePoint(r, "left", 0)).toEqual({ x: 10, y: 20 });
    expect(sidePoint(r, "right", 2)).toEqual({ x: 110, y: 60 });
    expect(portPoint(r, { id: "p", side: "right" })).toEqual({ x: 110, y: 40 });
  });

  it("computes anchors for sides and corners", () => {
    expect(anchorPoint(r, "top")).toEqual({ x: 60, y: 20 });
    expect(anchorPoint(r, "top-left")).toEqual({ x: 10, y: 20 });
    expect(anchorPoint(r, "top-right")).toEqual({ x: 110, y: 20 });
    expect(anchorPoint(r, "bottom-left")).toEqual({ x: 10, y: 60 });
    expect(anchorPoint(r, "bottom-right")).toEqual({ x: 110, y: 60 });
  });

  it("has outward directions, centres and unions", () => {
    expect(sideDirection("left")).toEqual({ x: -1, y: 0 });
    expect(sideDirection("bottom")).toEqual({ x: 0, y: 1 });
    expect(rectCenter(r)).toEqual({ x: 60, y: 40 });
    expect(unionRects([r, { x: -5, y: 50, width: 10, height: 30 }])).toEqual({
      x: -5,
      y: 20,
      width: 115,
      height: 60,
    });
    expect(unionRects([])).toEqual({ x: 0, y: 0, width: 0, height: 0 });
  });
});
