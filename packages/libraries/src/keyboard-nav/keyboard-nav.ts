import type { NodeId, Rect } from "../dependency-graph/dependency-graph.types.js";

export type Direction = "up" | "down" | "left" | "right";

export const KEY_DIRECTIONS: Readonly<Record<string, Direction>> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
};

export interface NavItem {
  id: NodeId;
  rect: Rect;
}

const center = (r: Rect) => ({ x: r.x + r.width / 2, y: r.y + r.height / 2 });

/**
 * Nearest item in `direction` from `fromId`, scored by distance along the direction plus a
 * penalty for drifting sideways. Returns `undefined` at the edge of the graph.
 */
export const nextInDirection = (
  items: readonly NavItem[],
  fromId: NodeId,
  direction: Direction,
): NodeId | undefined => {
  const from = items.find((i) => i.id === fromId);
  if (from === undefined) return items[0]?.id;
  const c = center(from.rect);
  let best: { id: NodeId; score: number } | undefined;
  for (const item of items) {
    if (item.id === fromId) continue;
    const p = center(item.rect);
    const dx = p.x - c.x;
    const dy = p.y - c.y;
    const [main, cross] =
      direction === "left"
        ? [-dx, dy]
        : direction === "right"
          ? [dx, dy]
          : direction === "up"
            ? [-dy, dx]
            : [dy, dx];
    if (main <= 0.5) continue;
    const score = main + 2 * Math.abs(cross);
    if (best === undefined || score < best.score) best = { id: item.id, score };
  }
  return best?.id;
};

/** Reading order for a left→right graph: by column (x), then top to bottom. */
export const readingOrder = (items: readonly NavItem[]): NodeId[] =>
  [...items].sort((a, b) => a.rect.x - b.rect.x || a.rect.y - b.rect.y).map((i) => i.id);
