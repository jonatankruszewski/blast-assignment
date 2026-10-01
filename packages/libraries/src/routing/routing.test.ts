import { describe, expect, it } from "vitest";
import {
  guardrailLikeFixture,
  guardrailLikeSizes,
} from "../dependency-graph/dependency-graph.fixtures.js";
import type {
  GraphNode,
  LayoutResult,
  Point,
  Rect,
} from "../dependency-graph/dependency-graph.types.js";
import { layeredLayout } from "../layout/layout.js";
import {
  orthogonalPoints,
  pickSides,
  roundedPath,
  routeEdges,
  sideFacing,
  simplifyPoints,
} from "./routing.js";

const n = (id: string, extra: Partial<GraphNode> = {}): GraphNode => ({
  id,
  type: "box",
  data: null,
  ...extra,
});
const layoutOf = (rects: Record<string, Rect>): LayoutResult => ({
  positions: Object.fromEntries(Object.entries(rects).map(([id, r]) => [id, { x: r.x, y: r.y }])),
  sizes: Object.fromEntries(
    Object.entries(rects).map(([id, r]) => [id, { width: r.width, height: r.height }]),
  ),
  bounds: { x: 0, y: 0, width: 0, height: 0 },
});
const isOrthogonal = (pts: readonly Point[]) =>
  pts.every((p, i) => {
    const prev = pts[i - 1];
    return prev === undefined || prev.x === p.x || prev.y === p.y;
  });

describe("pickSides / sideFacing", () => {
  const a = { x: 0, y: 0, width: 100, height: 40 };
  it("prefers left→right flow", () => {
    expect(pickSides(a, { ...a, x: 200 })).toEqual(["right", "left"]);
    expect(pickSides(a, { ...a, x: -200 })).toEqual(["left", "right"]);
  });
  it("falls back to vertical when columns overlap", () => {
    expect(pickSides(a, { ...a, y: 100 })).toEqual(["bottom", "top"]);
    expect(pickSides(a, { ...a, y: -100 })).toEqual(["top", "bottom"]);
  });
  it("finds the side facing a point", () => {
    expect(sideFacing(a, { x: -5, y: 20 })).toBe("left");
    expect(sideFacing(a, { x: 150, y: 20 })).toBe("right");
    expect(sideFacing(a, { x: 50, y: -10 })).toBe("top");
    expect(sideFacing(a, { x: 50, y: 90 })).toBe("bottom");
  });
});

describe("simplifyPoints", () => {
  it("drops duplicates and collinear points", () => {
    expect(
      simplifyPoints([
        { x: 0, y: 0 },
        { x: 0, y: 0 },
        { x: 5, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
      ]),
    ).toEqual([
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
    ]);
  });
});

describe("roundedPath", () => {
  it("draws a straight segment", () => {
    expect(
      roundedPath(
        [
          { x: 0, y: 0 },
          { x: 10, y: 0 },
        ],
        8,
      ),
    ).toBe("M0,0 L10,0");
  });
  it("rounds corners with the given radius", () => {
    expect(
      roundedPath(
        [
          { x: 0, y: 0 },
          { x: 50, y: 0 },
          { x: 50, y: 50 },
        ],
        8,
      ),
    ).toBe("M0,0 L42,0 Q50,0 50,8 L50,50");
  });
  it("clamps the radius to half the shorter segment", () => {
    expect(
      roundedPath(
        [
          { x: 0, y: 0 },
          { x: 50, y: 0 },
          { x: 50, y: 6 },
          { x: 100, y: 6 },
        ],
        8,
      ),
    ).toBe("M0,0 L47,0 Q50,0 50,3 L50,3 Q50,6 53,6 L100,6");
  });
  it("returns an empty string without points", () => {
    expect(roundedPath([], 8)).toBe("");
  });
});

describe("orthogonalPoints", () => {
  it("routes right→left as H-V-H through the midpoint", () => {
    expect(orthogonalPoints({ x: 0, y: 0 }, "right", { x: 100, y: 40 }, "left", 10)).toEqual([
      { x: 0, y: 0 },
      { x: 50, y: 0 },
      { x: 50, y: 40 },
      { x: 100, y: 40 },
    ]);
  });
  it("uses a forced trunk coordinate", () => {
    const pts = orthogonalPoints({ x: 0, y: 0 }, "right", { x: 100, y: 40 }, "left", 10, 20);
    expect(pts[1]).toEqual({ x: 20, y: 0 });
  });
  it("routes bottom→top as V-H-V", () => {
    expect(orthogonalPoints({ x: 0, y: 0 }, "bottom", { x: 40, y: 100 }, "top", 10)).toEqual([
      { x: 0, y: 0 },
      { x: 0, y: 50 },
      { x: 40, y: 50 },
      { x: 40, y: 100 },
    ]);
  });
  it("uses one corner for vertical exit into a horizontal entry", () => {
    expect(orthogonalPoints({ x: 0, y: 0 }, "bottom", { x: 80, y: 60 }, "left", 10)).toEqual([
      { x: 0, y: 0 },
      { x: 0, y: 60 },
      { x: 80, y: 60 },
    ]);
  });
  it("uses one corner for horizontal exit into a vertical entry", () => {
    expect(orthogonalPoints({ x: 0, y: 0 }, "right", { x: 80, y: 60 }, "top", 10)).toEqual([
      { x: 0, y: 0 },
      { x: 80, y: 0 },
      { x: 80, y: 60 },
    ]);
  });
  it("detours around when the target is behind", () => {
    const pts = orthogonalPoints({ x: 100, y: 0 }, "right", { x: 0, y: 80 }, "left", 10);
    expect(pts[1]).toEqual({ x: 110, y: 0 });
    expect(pts[pts.length - 2]).toEqual({ x: -10, y: 80 });
    expect(isOrthogonal(pts)).toBe(true);
  });
  it("routes same-side connections around both", () => {
    const pts = orthogonalPoints({ x: 100, y: 0 }, "right", { x: 50, y: 80 }, "right", 10);
    expect(pts).toEqual([
      { x: 100, y: 0 },
      { x: 110, y: 0 },
      { x: 110, y: 80 },
      { x: 50, y: 80 },
    ]);
  });
});

describe("routeEdges", () => {
  const box = (x: number, y: number): Rect => ({ x, y, width: 100, height: 40 });

  it("connects right side to left side by default", () => {
    const [r] = routeEdges({
      nodes: [n("a"), n("b")],
      edges: [{ id: "e", source: "a", target: "b" }],
      layout: layoutOf({ a: box(0, 0), b: box(200, 0) }),
    });
    expect(r?.points).toEqual([
      { x: 100, y: 20 },
      { x: 200, y: 20 },
    ]);
    expect(r?.path).toBe("M100,20 L200,20");
  });

  it("resolves ports with side and offset", () => {
    const [r] = routeEdges({
      nodes: [n("a", { ports: [{ id: "p", side: "bottom", offset: 0.9 }] }), n("b")],
      edges: [{ id: "e", source: "a", sourcePort: "p", target: "b" }],
      layout: layoutOf({ a: box(0, 0), b: box(200, 100) }),
    });
    expect(r?.points).toEqual([
      { x: 90, y: 40 },
      { x: 90, y: 120 },
      { x: 200, y: 120 },
    ]);
  });

  it("connects satellites vertically through their attach side", () => {
    const [up, down] = routeEdges({
      nodes: [
        n("a"),
        n("below", { layout: { attach: { to: "a", side: "bottom" } } }),
        n("above", { layout: { attach: { to: "a", side: "top" } } }),
      ],
      edges: [
        { id: "up", source: "below", target: "a" },
        { id: "down", source: "a", target: "above" },
      ],
      layout: layoutOf({ a: box(0, 100), below: box(0, 200), above: box(0, 0) }),
    });
    expect(up?.points).toEqual([
      { x: 50, y: 200 },
      { x: 50, y: 140 },
    ]);
    expect(down?.points).toEqual([
      { x: 50, y: 100 },
      { x: 50, y: 40 },
    ]);
  });

  it("shares one trunk for a fan-out bundle", () => {
    const routed = routeEdges({
      nodes: [n("s"), n("t1"), n("t2"), n("t3")],
      edges: ["t1", "t2", "t3"].map((t) => ({ id: t, source: "s", target: t, bundle: "fan" })),
      layout: layoutOf({ s: box(0, 50), t1: box(200, 0), t2: box(300, 50), t3: box(200, 100) }),
    });
    // trunk at midpoint between source right (100) and nearest target left (200)
    for (const r of routed) {
      expect(r.points[0]).toEqual({ x: 100, y: 70 });
      if (r.points.length > 2) expect(r.points[1]?.x).toBe(150);
    }
    expect(routed.find((r) => r.edge.id === "t2")?.points).toEqual([
      { x: 100, y: 70 },
      { x: 300, y: 70 },
    ]);
  });

  it("shares one trunk for a merge bundle", () => {
    const routed = routeEdges({
      nodes: [n("s1"), n("s2"), n("t")],
      edges: ["s1", "s2"].map((s) => ({ id: s, source: s, target: "t", bundle: "merge" })),
      layout: layoutOf({
        s1: box(0, 0),
        s2: { x: 0, y: 100, width: 60, height: 40 },
        t: box(200, 50),
      }),
    });
    // trunk between farthest source exit (100) and target left (200)
    expect(routed.map((r) => r.points[1]?.x)).toEqual([150, 150]);
    expect(routed.every((r) => r.points.at(-1)?.x === 200 && r.points.at(-1)?.y === 70)).toBe(true);
  });

  it("bundles vertical fan-outs with a horizontal bus", () => {
    const routed = routeEdges({
      nodes: [
        n("s"),
        n("a", { layout: { attach: { to: "s", side: "bottom" } } }),
        n("b", { layout: { attach: { to: "s", side: "bottom" } } }),
      ],
      edges: ["a", "b"].map((t) => ({ id: t, source: "s", target: t, bundle: "v" })),
      layout: layoutOf({ s: box(50, 0), a: box(0, 100), b: box(120, 120) }),
    });
    expect(routed.map((r) => r.points[1]?.y)).toEqual([70, 70]);
  });

  it("supports straight routing", () => {
    const [r] = routeEdges(
      {
        nodes: [n("a"), n("b")],
        edges: [{ id: "e", source: "a", target: "b" }],
        layout: layoutOf({ a: box(0, 0), b: box(200, 100) }),
      },
      { routing: "straight" },
    );
    expect(r?.path).toBe("M100,20 L200,120");
  });

  it("routes self loops orthogonally and skips unknown nodes", () => {
    const routed = routeEdges({
      nodes: [n("a")],
      edges: [
        { id: "self", source: "a", target: "a" },
        { id: "ghost", source: "a", target: "missing" },
      ],
      layout: layoutOf({ a: box(0, 0) }),
    });
    expect(routed.map((r) => r.edge.id)).toEqual(["self"]);
    expect(isOrthogonal(routed[0]?.points ?? [])).toBe(true);
  });

  describe("guardrail-like fixture", () => {
    const { nodes, edges } = guardrailLikeFixture;
    const layout = layeredLayout()({
      nodes: nodes.map((node) => ({
        node,
        size: guardrailLikeSizes[node.id] ?? { width: 0, height: 0 },
      })),
      edges,
    });
    const routed = routeEdges({ nodes, edges, layout });
    const byId = new Map(routed.map((r) => [r.edge.id, r]));
    const get = (id: string) => {
      const r = byId.get(id);
      if (r === undefined) throw new Error(id);
      return r;
    };
    const right = (id: string) => (layout.positions[id]?.x ?? 0) + (layout.sizes[id]?.width ?? 0);

    it("routes every edge orthogonally", () => {
      expect(routed).toHaveLength(edges.length);
      for (const r of routed) expect(isOrthogonal(r.points)).toBe(true);
    });

    it("fans permissions out over one vertical bus", () => {
      const xs = new Set(
        routed
          .filter((r) => r.edge.bundle === "permissions" && r.points.length > 2)
          .map((r) => r.points[1]?.x),
      );
      expect(xs.size).toBe(1);
      const [x] = xs;
      expect(x).toBeGreaterThan(right("permissions"));
      expect(x).toBeLessThan(layout.positions["action-editing"]?.x ?? 0);
    });

    it("merges actions into deny over one bus", () => {
      const merge = routed.filter((r) => r.edge.bundle === "deny");
      const ends = new Set(merge.map((r) => JSON.stringify(r.points.at(-1))));
      expect(ends.size).toBe(1);
      expect(
        new Set(merge.filter((r) => r.points.length > 2).map((r) => r.points[1]?.x)).size,
      ).toBe(1);
    });

    it("drops the policy satellite into the target's left port", () => {
      const pts = get("e-scp-target").points;
      expect(pts).toHaveLength(3);
      expect(pts.at(-1)?.x).toBe(layout.positions.target?.x);
      expect(pts[0]?.y).toBe((layout.positions.scp?.y ?? 0) + (layout.sizes.scp?.height ?? 0));
    });

    it("leaves the violations port downward then turns right", () => {
      const pts = get("e-target-violations").points;
      const target = layout.positions.target;
      const size = layout.sizes.target;
      expect(pts[0]).toEqual({
        x: (target?.x ?? 0) + (size?.width ?? 0) * 0.9,
        y: (target?.y ?? 0) + (size?.height ?? 0),
      });
      expect(pts[1]?.x).toBe(pts[0]?.x);
      expect(pts.at(-1)?.x).toBe(layout.positions.violations?.x);
    });

    it("connects exclusions up into the target and down to its chips", () => {
      expect(get("e-exclusions-target").points).toHaveLength(2);
      const bus = [get("e-exclusions-users"), get("e-exclusions-buckets")].map(
        (r) => r.points[1]?.y,
      );
      expect(bus[0]).toBe(bus[1]);
    });
  });
});
