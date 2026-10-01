import { describe, expect, it } from "vitest";
import {
  guardrailLikeFixture,
  guardrailLikeSizes,
} from "../dependency-graph/dependency-graph.fixtures.js";
import type {
  GraphEdge,
  GraphNode,
  LayoutResult,
  MeasuredNode,
  Rect,
} from "../dependency-graph/dependency-graph.types.js";
import { computeRanks, getGroupIds, layeredLayout, manualLayout, orderColumns } from "./layout.js";

const box = { width: 100, height: 40 };
const n = (id: string, extra: Partial<GraphNode> = {}): GraphNode => ({
  id,
  type: "box",
  data: null,
  ...extra,
});
const e = (source: string, target: string, extra: Partial<GraphEdge> = {}): GraphEdge => ({
  id: `${source}-${target}`,
  source,
  target,
  ...extra,
});
const measure = (nodes: GraphNode[], size = box): MeasuredNode[] =>
  nodes.map((node) => ({ node, size }));
const rect = (r: LayoutResult, id: string): Rect => {
  const p = r.positions[id];
  const s = r.sizes[id];
  if (p === undefined || s === undefined) throw new Error(`missing ${id}`);
  return { ...p, ...s };
};
const cx = (r: Rect) => r.x + r.width / 2;
const cy = (r: Rect) => r.y + r.height / 2;

describe("computeRanks", () => {
  it("assigns longest-path ranks", () => {
    const ranks = computeRanks(
      ["a", "b", "c", "d"],
      [
        ["a", "b"],
        ["b", "c"],
        ["a", "c"],
        ["c", "d"],
      ],
      () => undefined,
    );
    expect(Object.fromEntries(ranks)).toEqual({ a: 0, b: 1, c: 2, d: 3 });
  });

  it("honours fixed ranks and propagates them to successors", () => {
    const ranks = computeRanks(["a", "b", "c"], [["b", "c"]], (id) => (id === "b" ? 2 : undefined));
    // a=0, b=2, c=3 → compacted to columns 0,1,2
    expect(Object.fromEntries(ranks)).toEqual({ a: 0, b: 1, c: 2 });
  });

  it("survives cycles", () => {
    const ranks = computeRanks(
      ["a", "b", "c"],
      [
        ["a", "b"],
        ["b", "c"],
        ["c", "a"],
      ],
      () => undefined,
    );
    expect(Object.fromEntries(ranks)).toEqual({ a: 0, b: 1, c: 2 });
  });
});

describe("orderColumns", () => {
  it("orders by barycenter of predecessors", () => {
    const cols = orderColumns(
      [
        ["a", "b"],
        ["y", "x"],
      ],
      [
        ["a", "x"],
        ["b", "y"],
      ],
      () => undefined,
    );
    expect(cols).toEqual([
      ["a", "b"],
      ["x", "y"],
    ]);
  });

  it("explicit order wins", () => {
    const cols = orderColumns([["a", "b", "c"]], [], (id) => ({ a: 2, b: 0, c: 1 })[id]);
    expect(cols).toEqual([["b", "c", "a"]]);
  });
});

describe("getGroupIds", () => {
  it("returns only existing parents", () => {
    const ids = getGroupIds([n("g"), n("c", { parentId: "g" }), n("x", { parentId: "missing" })]);
    expect([...ids]).toEqual(["g"]);
  });
});

describe("layeredLayout", () => {
  it("places a chain left to right with rank spacing", () => {
    const r = layeredLayout({ rankSpacing: 50 })({
      nodes: measure([n("a"), n("b"), n("c")]),
      edges: [e("a", "b"), e("b", "c")],
    });
    expect(r.positions).toEqual({ a: { x: 0, y: 0 }, b: { x: 150, y: 0 }, c: { x: 300, y: 0 } });
    expect(r.bounds).toEqual({ x: 0, y: 0, width: 400, height: 40 });
  });

  it("stacks a column with node spacing and centres columns against each other", () => {
    const r = layeredLayout({ rankSpacing: 50, nodeSpacing: 10 })({
      nodes: measure([n("hub"), n("a"), n("b"), n("c")]),
      edges: [e("hub", "a"), e("hub", "b"), e("hub", "c")],
    });
    expect(rect(r, "a").y).toBe(0);
    expect(rect(r, "b").y).toBe(50);
    expect(rect(r, "c").y).toBe(100);
    expect(cy(rect(r, "hub"))).toBe(cy(rect(r, "b")));
  });

  it("centres narrower nodes horizontally inside their column", () => {
    const r = layeredLayout({ rankSpacing: 50 })({
      nodes: [
        { node: n("root"), size: box },
        { node: n("wide"), size: { width: 200, height: 40 } },
        { node: n("narrow"), size: { width: 100, height: 40 } },
      ],
      edges: [e("root", "wide"), e("root", "narrow")],
    });
    expect(cx(rect(r, "narrow"))).toBe(cx(rect(r, "wide")));
  });

  it("uses rank and order hints", () => {
    const r = layeredLayout({ rankSpacing: 50, nodeSpacing: 10 })({
      nodes: measure([
        n("a", { layout: { rank: 1, order: 1 } }),
        n("b", { layout: { rank: 1, order: 0 } }),
        n("c"),
      ]),
      edges: [],
    });
    expect(rect(r, "c").x).toBe(0);
    expect(rect(r, "a").x).toBe(150);
    expect(rect(r, "b").y).toBeLessThan(rect(r, "a").y);
  });

  it("lets layout.position win", () => {
    const r = layeredLayout()({
      nodes: measure([n("a"), n("b", { layout: { position: { x: 500, y: -20 } } })]),
      edges: [e("a", "b")],
    });
    expect(r.positions.b).toEqual({ x: 500, y: -20 });
    expect(r.positions.a).toEqual({ x: 0, y: 0 });
    expect(r.bounds).toEqual({ x: 0, y: -20, width: 600, height: 60 });
  });

  it("places satellites on each side with gap and alignment", () => {
    const r = layeredLayout({ satelliteGap: 10 })({
      nodes: [
        { node: n("anchor"), size: { width: 200, height: 100 } },
        { node: n("t", { layout: { attach: { to: "anchor", side: "top" } } }), size: box },
        {
          node: n("b", { layout: { attach: { to: "anchor", side: "bottom", align: "start" } } }),
          size: box,
        },
        {
          node: n("l", { layout: { attach: { to: "anchor", side: "left", gap: 5 } } }),
          size: box,
        },
        {
          node: n("r", { layout: { attach: { to: "anchor", side: "right", align: "end" } } }),
          size: box,
        },
      ],
      edges: [],
    });
    expect(rect(r, "t")).toEqual({ x: 50, y: -50, ...box });
    expect(rect(r, "b")).toEqual({ x: 0, y: 110, ...box });
    expect(rect(r, "l")).toEqual({ x: -105, y: 30, ...box });
    expect(rect(r, "r")).toEqual({ x: 210, y: 60, ...box });
  });

  it("applies attach.offset after alignment", () => {
    const r = layeredLayout({ satelliteGap: 0 })({
      nodes: [
        { node: n("anchor"), size: { width: 200, height: 100 } },
        {
          node: n("s", {
            layout: { attach: { to: "anchor", side: "top", align: "start", offset: -30 } },
          }),
          size: box,
        },
      ],
      edges: [],
    });
    expect(rect(r, "s").x).toBe(-30);
  });

  it("distributes satellites sharing a side side by side, centred on the anchor", () => {
    const r = layeredLayout({ satelliteGap: 10, satelliteSpacing: 20 })({
      nodes: [
        { node: n("anchor"), size: { width: 100, height: 40 } },
        { node: n("s1", { layout: { attach: { to: "anchor", side: "bottom" } } }), size: box },
        { node: n("s2", { layout: { attach: { to: "anchor", side: "bottom" } } }), size: box },
      ],
      edges: [],
    });
    // block width 220 centred on anchor centre (50) → starts at -60
    expect(rect(r, "s1")).toEqual({ x: -60, y: 50, ...box });
    expect(rect(r, "s2")).toEqual({ x: 60, y: 50, ...box });
  });

  it("stacks left/right satellites vertically", () => {
    const r = layeredLayout({ satelliteGap: 10, satelliteSpacing: 10 })({
      nodes: [
        { node: n("anchor"), size: { width: 100, height: 40 } },
        {
          node: n("s1", { layout: { attach: { to: "anchor", side: "right" }, order: 1 } }),
          size: box,
        },
        {
          node: n("s2", { layout: { attach: { to: "anchor", side: "right" }, order: 0 } }),
          size: box,
        },
      ],
      edges: [],
    });
    expect(rect(r, "s2").y).toBe(-25);
    expect(rect(r, "s1").y).toBe(25);
    expect(rect(r, "s1").x).toBe(110);
  });

  it("supports satellites of satellites", () => {
    const r = layeredLayout({ satelliteGap: 10 })({
      nodes: measure([
        n("a"),
        n("s", { layout: { attach: { to: "a", side: "bottom" } } }),
        n("ss", { layout: { attach: { to: "s", side: "bottom" } } }),
      ]),
      edges: [],
    });
    expect(rect(r, "s").y).toBe(50);
    expect(rect(r, "ss").y).toBe(100);
  });

  it("ignores satellites when ranking and breaks attach cycles", () => {
    const r = layeredLayout({ rankSpacing: 50 })({
      nodes: measure([
        n("a"),
        n("b"),
        n("s", { layout: { attach: { to: "b", side: "top" } } }),
        n("x", { layout: { attach: { to: "y", side: "top" } } }),
        n("y", { layout: { attach: { to: "x", side: "top" } } }),
      ]),
      edges: [e("a", "b"), e("s", "a")],
    });
    expect(rect(r, "a").x).toBe(0);
    expect(rect(r, "b").x).toBe(150);
    expect(Number.isFinite(rect(r, "x").x)).toBe(true);
    expect(Number.isFinite(rect(r, "y").x)).toBe(true);
  });

  it("sizes groups around their children with padding", () => {
    const r = layeredLayout({ groupPadding: 20, rankSpacing: 50 })({
      nodes: measure([n("before"), n("g"), n("c1", { parentId: "g" }), n("c2", { parentId: "g" })]),
      edges: [e("before", "g"), e("c1", "c2")],
    });
    const g = rect(r, "g");
    expect(g.width).toBe(100 + 50 + 100 + 40);
    expect(g.height).toBe(80);
    expect(rect(r, "c1")).toEqual({ x: g.x + 20, y: g.y + 20, ...box });
    expect(rect(r, "c2")).toEqual({ x: g.x + 170, y: g.y + 20, ...box });
    expect(g.x).toBe(150);
  });

  it("lifts edges into children to their group when ranking", () => {
    const r = layeredLayout({ rankSpacing: 50 })({
      nodes: measure([n("a"), n("g"), n("c", { parentId: "g" })]),
      edges: [e("a", "c")],
    });
    expect(rect(r, "g").x).toBeGreaterThan(rect(r, "a").x);
  });

  it("handles nested groups and parent cycles", () => {
    const r = layeredLayout({ groupPadding: 10 })({
      nodes: measure([
        n("outer"),
        n("inner", { parentId: "outer" }),
        n("leaf", { parentId: "inner" }),
        n("p", { parentId: "q" }),
        n("q", { parentId: "p" }),
      ]),
      edges: [],
    });
    expect(rect(r, "inner").width).toBe(120);
    expect(rect(r, "outer").width).toBe(140);
    expect(rect(r, "leaf").x).toBe(rect(r, "outer").x + 20);
  });

  it("returns empty bounds for an empty graph", () => {
    expect(layeredLayout()({ nodes: [], edges: [] })).toEqual({
      positions: {},
      sizes: {},
      bounds: { x: 0, y: 0, width: 0, height: 0 },
    });
  });

  describe("guardrail-like fixture", () => {
    const { nodes, edges } = guardrailLikeFixture;
    const r = layeredLayout()({
      nodes: nodes.map((node) => ({
        node,
        size: guardrailLikeSizes[node.id] ?? { width: 0, height: 0 },
      })),
      edges,
    });
    const ids = (prefix: string) => nodes.filter((x) => x.id.startsWith(prefix)).map((x) => x.id);

    it("produces the column order resources → permissions → actions → deny → target", () => {
      const xs = ["resource-users", "permissions", "action-editing", "deny", "target"].map(
        (id) => rect(r, id).x,
      );
      expect([...xs].sort((a, b) => a - b)).toEqual(xs);
      expect(new Set(ids("action-").map((id) => rect(r, id).x)).size).toBe(1);
    });

    it("centres the hub on the action column", () => {
      expect(cy(rect(r, "permissions"))).toBe(cy(rect(r, "action-editing")));
      expect(cy(rect(r, "deny"))).toBe(cy(rect(r, "action-editing")));
    });

    it("keeps action order", () => {
      const ys = ids("action-").map((id) => rect(r, id).y);
      expect([...ys].sort((a, b) => a - b)).toEqual(ys);
    });

    it("places satellites around the target", () => {
      const target = rect(r, "target");
      expect(rect(r, "scp").y + rect(r, "scp").height).toBe(target.y - 16);
      expect(cx(rect(r, "scp"))).toBeLessThan(target.x);
      expect(rect(r, "exclusions").y).toBe(target.y + target.height + 32);
      expect(cx(rect(r, "exclusions"))).toBe(cx(target));
      expect(rect(r, "violations").x).toBe(target.x + target.width + 48);
      const chips = [rect(r, "exclusion-users"), rect(r, "exclusion-buckets")];
      expect(chips[0]?.y).toBe(chips[1]?.y);
      expect(((chips[0]?.x ?? 0) + (chips[1]?.x ?? 0) + 54) / 2).toBe(cx(rect(r, "exclusions")));
      expect(rect(r, "resources-caption").y + 32 + 4).toBe(rect(r, "resource-users").y);
    });

    it("wraps the target group around its child", () => {
      const target = rect(r, "target");
      const child = rect(r, "analyzer");
      expect(child.x - target.x).toBe(24);
      expect(target.width).toBe(190 + 48);
      expect(cy(child)).toBe(cy(target));
    });

    it("bounds contain every node", () => {
      for (const node of nodes) {
        const b = rect(r, node.id);
        expect(b.x).toBeGreaterThanOrEqual(r.bounds.x);
        expect(b.y).toBeGreaterThanOrEqual(r.bounds.y);
        expect(b.x + b.width).toBeLessThanOrEqual(r.bounds.x + r.bounds.width);
        expect(b.y + b.height).toBeLessThanOrEqual(r.bounds.y + r.bounds.height);
      }
    });
  });
});

describe("manualLayout", () => {
  it("uses positions, follows anchors and grows groups around children", () => {
    const r = manualLayout({ groupPadding: 10, satelliteGap: 5 })({
      nodes: measure([
        n("a", { layout: { position: { x: 10, y: 20 } } }),
        n("s", { layout: { attach: { to: "a", side: "right" } } }),
        n("g"),
        n("c", { parentId: "g", layout: { position: { x: 300, y: 300 } } }),
        n("loose"),
      ]),
      edges: [],
    });
    expect(r.positions.a).toEqual({ x: 10, y: 20 });
    expect(r.positions.s).toEqual({ x: 115, y: 20 });
    expect(rect(r, "g")).toEqual({ x: 290, y: 290, width: 120, height: 60 });
    expect(r.positions.loose).toEqual({ x: 0, y: 0 });
  });
});
