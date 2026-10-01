import type { Anchor, GraphPort, Point, Rect, Side } from "../dependency-graph/dependency-graph.types.js";

export const OPPOSITE_SIDE: Readonly<Record<Side, Side>> = {
  top: "bottom",
  right: "left",
  bottom: "top",
  left: "right",
};

export const isHorizontalSide = (side: Side): boolean => side === "left" || side === "right";

/** Unit vector pointing out of the node through `side`. */
export const sideDirection = (side: Side): Point => {
  switch (side) {
    case "top":
      return { x: 0, y: -1 };
    case "right":
      return { x: 1, y: 0 };
    case "bottom":
      return { x: 0, y: 1 };
    case "left":
      return { x: -1, y: 0 };
  }
};

export const rectCenter = (rect: Rect): Point => ({
  x: rect.x + rect.width / 2,
  y: rect.y + rect.height / 2,
});

/** Point on `side` of `rect`, `offset` 0..1 along the side (left→right / top→bottom). */
export const sidePoint = (rect: Rect, side: Side, offset = 0.5): Point => {
  const t = Math.min(1, Math.max(0, offset));
  switch (side) {
    case "top":
      return { x: rect.x + rect.width * t, y: rect.y };
    case "bottom":
      return { x: rect.x + rect.width * t, y: rect.y + rect.height };
    case "left":
      return { x: rect.x, y: rect.y + rect.height * t };
    case "right":
      return { x: rect.x + rect.width, y: rect.y + rect.height * t };
  }
};

export const portPoint = (rect: Rect, port: GraphPort): Point =>
  sidePoint(rect, port.side, port.offset ?? 0.5);

/** Side midpoint or corner of `rect`. */
export const anchorPoint = (rect: Rect, anchor: Anchor): Point => {
  switch (anchor) {
    case "top":
    case "right":
    case "bottom":
    case "left":
      return sidePoint(rect, anchor);
    case "top-left":
      return { x: rect.x, y: rect.y };
    case "top-right":
      return { x: rect.x + rect.width, y: rect.y };
    case "bottom-left":
      return { x: rect.x, y: rect.y + rect.height };
    case "bottom-right":
      return { x: rect.x + rect.width, y: rect.y + rect.height };
  }
};

export const unionRects = (rects: readonly Rect[]): Rect => {
  if (rects.length === 0) return { x: 0, y: 0, width: 0, height: 0 };
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const r of rects) {
    minX = Math.min(minX, r.x);
    minY = Math.min(minY, r.y);
    maxX = Math.max(maxX, r.x + r.width);
    maxY = Math.max(maxY, r.y + r.height);
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
};
