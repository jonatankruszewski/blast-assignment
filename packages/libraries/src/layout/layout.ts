import type {
  GraphNode,
  LayoutEngine,
  LayoutResult,
  MeasuredNode,
  NodeId,
  Point,
  Rect,
  Side,
  Size,
} from "../dependency-graph/dependency-graph.types.js";
import { unionRects } from "../geometry/geometry.js";
import type { LayeredLayoutOptions, ManualLayoutOptions } from "./layout.types.js";

const ROOT = "\u0000root";
const CYCLE = "\u0000cycle";

const DEFAULTS = {
  rankSpacing: 56,
  nodeSpacing: 16,
  groupPadding: 24,
  satelliteGap: 16,
  satelliteSpacing: 12,
} as const satisfies Required<LayeredLayoutOptions>;

/** Ids of nodes that have at least one valid child (`parentId` pointing at them). */
export const getGroupIds = (nodes: readonly GraphNode[]): Set<NodeId> => {
  const ids = new Set(nodes.map((n) => n.id));
  const groups = new Set<NodeId>();
  for (const n of nodes) {
    if (n.parentId !== undefined && n.parentId !== n.id && ids.has(n.parentId)) {
      groups.add(n.parentId);
    }
  }
  return groups;
};

interface Structure {
  byId: Map<NodeId, MeasuredNode>;
  index: Map<NodeId, number>;
  /** Layout scope of each node: `ROOT` or the id of the group it is laid out in. */
  scopeOf: Map<NodeId, string>;
  /** Satellites (valid, acyclic `attach` without `position`) → anchor id. */
  anchorOf: Map<NodeId, NodeId>;
  members: Map<string, NodeId[]>;
  groups: Set<NodeId>;
}

/**
 * Resolves scopes: a satellite lives in its anchor's scope (so it moves with it), any other node
 * in its parent's scope. `parentId` / `attach` cycles are broken deterministically.
 */
const buildStructure = (nodes: readonly MeasuredNode[]): Structure => {
  const byId = new Map(nodes.map((m) => [m.node.id, m]));
  const index = new Map(nodes.map((m, i) => [m.node.id, i]));
  const scopeOf = new Map<NodeId, string>();
  const anchorOf = new Map<NodeId, NodeId>();

  const candidateAnchor = (node: GraphNode): NodeId | undefined => {
    const attach = node.layout?.attach;
    if (attach === undefined || node.layout?.position !== undefined) return undefined;
    return attach.to !== node.id && byId.has(attach.to) ? attach.to : undefined;
  };

  const resolve = (id: NodeId, visiting: Set<NodeId>): string => {
    const known = scopeOf.get(id);
    if (known !== undefined) return known;
    if (visiting.has(id)) return CYCLE;
    const node = byId.get(id)?.node;
    if (node === undefined) return ROOT;
    visiting.add(id);

    const parentScope = (): string => {
      const parentId = node.parentId;
      if (parentId === undefined || parentId === id || !byId.has(parentId)) return ROOT;
      return resolve(parentId, visiting) === CYCLE ? ROOT : parentId;
    };

    let scope: string;
    const anchor = candidateAnchor(node);
    if (anchor === undefined) {
      scope = parentScope();
    } else {
      const anchorScope = resolve(anchor, visiting);
      if (anchorScope === CYCLE) {
        scope = parentScope();
      } else {
        scope = anchorScope;
        anchorOf.set(id, anchor);
      }
    }
    visiting.delete(id);
    scopeOf.set(id, scope);
    return scope;
  };

  for (const m of nodes) resolve(m.node.id, new Set());

  const members = new Map<string, NodeId[]>();
  for (const m of nodes) {
    const scope = scopeOf.get(m.node.id) ?? ROOT;
    const list = members.get(scope);
    if (list === undefined) members.set(scope, [m.node.id]);
    else list.push(m.node.id);
  }
  const groups = getGroupIds(nodes.map((m) => m.node));
  return { byId, index, scopeOf, anchorOf, members, groups };
};

/**
 * Places satellites around already placed anchors (in waves, so satellites of satellites work).
 * Satellites sharing an anchor side are distributed side by side (top/bottom) or stacked
 * (left/right) and aligned as a block against the anchor.
 */
const placeSatellites = (
  satellites: readonly GraphNode[],
  anchorOf: ReadonlyMap<NodeId, NodeId>,
  sizeOf: (id: NodeId) => Size,
  rects: Map<NodeId, Rect>,
  options: { satelliteGap: number; satelliteSpacing: number },
): void => {
  let pending = [...satellites];
  while (pending.length > 0) {
    const ready = pending.filter((n) => {
      const anchor = anchorOf.get(n.id);
      return anchor !== undefined && rects.has(anchor);
    });
    if (ready.length === 0) {
      for (const n of pending) rects.set(n.id, { x: 0, y: 0, ...sizeOf(n.id) });
      return;
    }
    const readyIds = new Set(ready.map((n) => n.id));
    pending = pending.filter((n) => !readyIds.has(n.id));

    const blocks = new Map<string, GraphNode[]>();
    for (const n of ready) {
      const key = `${anchorOf.get(n.id) ?? ""}\u0000${n.layout?.attach?.side ?? "bottom"}`;
      const list = blocks.get(key);
      if (list === undefined) blocks.set(key, [n]);
      else list.push(n);
    }

    for (const block of blocks.values()) {
      const items = block
        .map((node, i) => ({ node, i }))
        .sort(
          (a, b) =>
            (a.node.layout?.order ?? Infinity) - (b.node.layout?.order ?? Infinity) || a.i - b.i,
        )
        .map(({ node }) => node);
      const first = items[0];
      const anchorId = first === undefined ? undefined : anchorOf.get(first.id);
      const anchor = anchorId === undefined ? undefined : rects.get(anchorId);
      if (first === undefined || anchor === undefined) continue;
      const attach = first.layout?.attach;
      const side: Side = attach?.side ?? "bottom";
      const align = attach?.align ?? "center";
      const offset = attach?.offset ?? 0;
      const sizes = items.map((n) => sizeOf(n.id));
      const vertical = side === "top" || side === "bottom";
      const total =
        sizes.reduce((sum, s) => sum + (vertical ? s.width : s.height), 0) +
        options.satelliteSpacing * Math.max(0, items.length - 1);
      const anchorStart = vertical ? anchor.x : anchor.y;
      const anchorLength = vertical ? anchor.width : anchor.height;
      const start =
        (align === "start"
          ? anchorStart
          : align === "end"
            ? anchorStart + anchorLength - total
            : anchorStart + (anchorLength - total) / 2) + offset;

      let cursor = start;
      items.forEach((n, i) => {
        const size = sizes[i] ?? { width: 0, height: 0 };
        const gap = n.layout?.attach?.gap ?? options.satelliteGap;
        let rect: Rect;
        switch (side) {
          case "top":
            rect = { x: cursor, y: anchor.y - gap - size.height, ...size };
            break;
          case "bottom":
            rect = { x: cursor, y: anchor.y + anchor.height + gap, ...size };
            break;
          case "left":
            rect = { x: anchor.x - gap - size.width, y: cursor, ...size };
            break;
          case "right":
            rect = { x: anchor.x + anchor.width + gap, y: cursor, ...size };
            break;
        }
        rects.set(n.id, rect);
        cursor += (vertical ? size.width : size.height) + options.satelliteSpacing;
      });
    }
  }
};

/** Drops back edges (DFS in input order) so the remaining graph is acyclic. */
const acyclic = (ids: readonly NodeId[], edges: readonly [NodeId, NodeId][]) => {
  const out = new Map<NodeId, NodeId[]>(ids.map((id) => [id, []]));
  for (const [s, t] of edges) out.get(s)?.push(t);
  const state = new Map<NodeId, 1 | 2>();
  const kept: [NodeId, NodeId][] = [];
  const visit = (id: NodeId) => {
    state.set(id, 1);
    for (const t of out.get(id) ?? []) {
      const st = state.get(t);
      if (st === 1) continue; // back edge
      kept.push([id, t]);
      if (st === undefined) visit(t);
    }
    state.set(id, 2);
  };
  for (const id of ids) if (!state.has(id)) visit(id);
  return kept;
};

/** Longest-path ranks honouring fixed `layout.rank` values; returned as compact column indices. */
export const computeRanks = (
  ids: readonly NodeId[],
  edges: readonly [NodeId, NodeId][],
  fixedRank: (id: NodeId) => number | undefined,
): Map<NodeId, number> => {
  const dag = acyclic(ids, edges);
  const preds = new Map<NodeId, NodeId[]>(ids.map((id) => [id, []]));
  const indeg = new Map<NodeId, number>(ids.map((id) => [id, 0]));
  const succs = new Map<NodeId, NodeId[]>(ids.map((id) => [id, []]));
  for (const [s, t] of dag) {
    preds.get(t)?.push(s);
    succs.get(s)?.push(t);
    indeg.set(t, (indeg.get(t) ?? 0) + 1);
  }
  const queue = ids.filter((id) => indeg.get(id) === 0);
  const rank = new Map<NodeId, number>();
  while (queue.length > 0) {
    const id = queue.shift();
    if (id === undefined) break;
    const fixed = fixedRank(id);
    const fromPreds = Math.max(-1, ...(preds.get(id) ?? []).map((p) => rank.get(p) ?? 0)) + 1;
    rank.set(id, fixed ?? fromPreds);
    for (const t of succs.get(id) ?? []) {
      const d = (indeg.get(t) ?? 0) - 1;
      indeg.set(t, d);
      if (d === 0) queue.push(t);
    }
  }
  const distinct = [...new Set(rank.values())].sort((a, b) => a - b);
  const column = new Map(distinct.map((r, i) => [r, i]));
  return new Map([...rank].map(([id, r]) => [id, column.get(r) ?? 0]));
};

/** Orders nodes inside columns: `layout.order` first, else barycenter sweeps (down, up, down). */
export const orderColumns = (
  columns: NodeId[][],
  edges: readonly [NodeId, NodeId][],
  fixedOrder: (id: NodeId) => number | undefined,
): NodeId[][] => {
  const cols = columns.map((c) => [...c]);
  const preds = new Map<NodeId, NodeId[]>();
  const succs = new Map<NodeId, NodeId[]>();
  for (const [s, t] of edges) {
    preds.set(t, [...(preds.get(t) ?? []), s]);
    succs.set(s, [...(succs.get(s) ?? []), t]);
  }
  const positionIndex = () => {
    const pos = new Map<NodeId, number>();
    for (const col of cols) col.forEach((id, i) => pos.set(id, i));
    return pos;
  };
  const sortColumn = (ci: number, neighbours: Map<NodeId, NodeId[]>) => {
    const col = cols[ci];
    if (col === undefined) return;
    const pos = positionIndex();
    const key = (id: NodeId, i: number): number => {
      const fixed = fixedOrder(id);
      if (fixed !== undefined) return fixed;
      const ns = (neighbours.get(id) ?? []).filter((n) => pos.has(n));
      if (ns.length === 0) return i;
      return ns.reduce((sum, n) => sum + (pos.get(n) ?? 0), 0) / ns.length;
    };
    const keyed = col.map((id, i) => ({ id, i, k: key(id, i) }));
    keyed.sort((a, b) => a.k - b.k || a.i - b.i);
    cols[ci] = keyed.map((x) => x.id);
  };
  for (let ci = 0; ci < cols.length; ci++) sortColumn(ci, new Map());
  for (let ci = 1; ci < cols.length; ci++) sortColumn(ci, preds);
  for (let ci = cols.length - 2; ci >= 0; ci--) sortColumn(ci, succs);
  for (let ci = 1; ci < cols.length; ci++) sortColumn(ci, preds);
  return cols;
};

const resolveSize = (m: MeasuredNode | undefined): Size => ({
  width: Math.max(0, m?.size.width ?? 0),
  height: Math.max(0, m?.size.height ?? 0),
});

/**
 * Default layout. Longest-path columns from the edges, `layout.rank`/`order` overrides, columns
 * centred vertically against each other; satellites (`layout.attach`) around their anchors;
 * groups sized around their children (laid out recursively, inside `groupPadding`).
 * `layout.position` wins: graph coordinates at top level, parent-relative inside a group.
 */
export const layeredLayout =
  (options: LayeredLayoutOptions = {}): LayoutEngine =>
  ({ nodes, edges }) => {
    const opts = resolveOptions(options);
    const s = buildStructure(nodes);
    const sizes = new Map<NodeId, Size>();
    /** Position relative to the scope origin (parent top-left for group members). */
    const relative = new Map<NodeId, Point>();

    /** Walks up scopes until reaching the member of `scope` that contains `id`. */
    const representative = (id: NodeId, scope: string): NodeId | undefined => {
      let cur: string = id;
      for (let guard = 0; guard <= nodes.length; guard++) {
        const sc = s.scopeOf.get(cur);
        if (sc === undefined) return undefined;
        if (sc === scope) return cur;
        if (sc === ROOT) return undefined;
        cur = sc;
      }
      return undefined;
    };

    const layoutScope = (scope: string): Rect => {
      const members = s.members.get(scope) ?? [];
      for (const id of members) {
        if (s.groups.has(id) || (s.members.get(id)?.length ?? 0) > 0) {
          const inner = layoutScope(id);
          const p = opts.groupPadding;
          sizes.set(id, { width: inner.width + 2 * p, height: inner.height + 2 * p });
          for (const child of s.members.get(id) ?? []) {
            const r = relative.get(child);
            if (r !== undefined)
              relative.set(child, { x: r.x - inner.x + p, y: r.y - inner.y + p });
          }
        } else {
          sizes.set(id, resolveSize(s.byId.get(id)));
        }
      }
      const sizeOf = (id: NodeId): Size => sizes.get(id) ?? { width: 0, height: 0 };

      const rects = new Map<NodeId, Rect>();
      const satellites: GraphNode[] = [];
      const columnIds: NodeId[] = [];
      for (const id of members) {
        const node = s.byId.get(id)?.node;
        if (node === undefined) continue;
        const position = node.layout?.position;
        if (position !== undefined) rects.set(id, { ...position, ...sizeOf(id) });
        else if (s.anchorOf.has(id)) satellites.push(node);
        else columnIds.push(id);
      }

      const columnSet = new Set(columnIds);
      const scopeEdges: [NodeId, NodeId][] = [];
      for (const e of edges) {
        const a = representative(e.source, scope);
        const b = representative(e.target, scope);
        if (a !== undefined && b !== undefined && a !== b && columnSet.has(a) && columnSet.has(b)) {
          scopeEdges.push([a, b]);
        }
      }
      const node = (id: NodeId) => s.byId.get(id)?.node;
      const ranks = computeRanks(columnIds, scopeEdges, (id) => node(id)?.layout?.rank);
      const columnCount = Math.max(0, ...ranks.values()) + (columnIds.length > 0 ? 1 : 0);
      const columns: NodeId[][] = Array.from({ length: columnCount }, () => []);
      for (const id of columnIds) columns[ranks.get(id) ?? 0]?.push(id);
      const ordered = orderColumns(columns, scopeEdges, (id) => node(id)?.layout?.order);

      const widths = ordered.map((col) => Math.max(0, ...col.map((id) => sizeOf(id).width)));
      const heights = ordered.map(
        (col) =>
          col.reduce((sum, id) => sum + sizeOf(id).height, 0) +
          opts.nodeSpacing * Math.max(0, col.length - 1),
      );
      const maxHeight = Math.max(0, ...heights);
      let x = 0;
      ordered.forEach((col, ci) => {
        const width = widths[ci] ?? 0;
        let y = (maxHeight - (heights[ci] ?? 0)) / 2;
        for (const id of col) {
          const size = sizeOf(id);
          rects.set(id, { x: x + (width - size.width) / 2, y, ...size });
          y += size.height + opts.nodeSpacing;
        }
        x += width + opts.rankSpacing;
      });

      placeSatellites(satellites, s.anchorOf, sizeOf, rects, opts);

      for (const [id, r] of rects) relative.set(id, { x: r.x, y: r.y });
      return unionRects([...rects.values()]);
    };

    layoutScope(ROOT);
    return compose(nodes, s, relative, sizes);
  };

/** Turns scope-relative positions into absolute ones and computes bounds. */
const compose = (
  nodes: readonly MeasuredNode[],
  s: Structure,
  relative: ReadonlyMap<NodeId, Point>,
  sizes: ReadonlyMap<NodeId, Size>,
): LayoutResult => {
  const positions: Record<NodeId, Point> = {};
  const sizeRecord: Record<NodeId, Size> = {};
  const absolute = (id: NodeId, depth: number): Point => {
    const done = positions[id];
    if (done !== undefined) return done;
    const rel = relative.get(id) ?? { x: 0, y: 0 };
    const scope = s.scopeOf.get(id) ?? ROOT;
    const origin =
      scope === ROOT || depth > nodes.length ? { x: 0, y: 0 } : absolute(scope, depth + 1);
    const p = { x: origin.x + rel.x, y: origin.y + rel.y };
    positions[id] = p;
    return p;
  };
  for (const m of nodes) {
    absolute(m.node.id, 0);
    sizeRecord[m.node.id] = sizes.get(m.node.id) ?? resolveSize(m);
  }
  const bounds = unionRects(
    nodes.map((m) => ({
      ...(positions[m.node.id] ?? { x: 0, y: 0 }),
      ...(sizeRecord[m.node.id] ?? { width: 0, height: 0 }),
    })),
  );
  return { positions, sizes: sizeRecord, bounds };
};

const resolveOptions = (
  o: LayeredLayoutOptions,
): Required<{ [K in keyof LayeredLayoutOptions]: number }> => ({
  rankSpacing: o.rankSpacing ?? DEFAULTS.rankSpacing,
  nodeSpacing: o.nodeSpacing ?? DEFAULTS.nodeSpacing,
  groupPadding: o.groupPadding ?? DEFAULTS.groupPadding,
  satelliteGap: o.satelliteGap ?? DEFAULTS.satelliteGap,
  satelliteSpacing: o.satelliteSpacing ?? DEFAULTS.satelliteSpacing,
});

/**
 * Fixed layout: every node at `layout.position` (graph coordinates, also for children).
 * Satellites without a position follow their anchor; groups grow to contain their children plus
 * padding; anything else without a position sits at the origin.
 */
export const manualLayout =
  (options: ManualLayoutOptions = {}): LayoutEngine =>
  ({ nodes }) => {
    const opts = resolveOptions(options);
    const s = buildStructure(nodes);
    const rects = new Map<NodeId, Rect>();
    const sizes = new Map<NodeId, Size>();
    for (const m of nodes) {
      const size = resolveSize(m);
      sizes.set(m.node.id, size);
      const pos = m.node.layout?.position;
      if (pos !== undefined || !s.anchorOf.has(m.node.id)) {
        rects.set(m.node.id, { ...(pos ?? { x: 0, y: 0 }), ...size });
      }
    }
    // Groups, deepest first, grow around their positioned members.
    const depth = (id: NodeId): number => {
      let d = 0;
      let cur = s.byId.get(id)?.node.parentId;
      while (cur !== undefined && d <= nodes.length) {
        d++;
        cur = s.byId.get(cur)?.node.parentId;
      }
      return d;
    };
    const groups = [...s.groups].sort((a, b) => depth(b) - depth(a));
    for (const g of groups) {
      const childRects = nodes
        .filter((m) => m.node.parentId === g)
        .map((m) => rects.get(m.node.id))
        .filter((r): r is Rect => r !== undefined);
      if (childRects.length === 0) continue;
      const inner = unionRects(childRects);
      const p = opts.groupPadding;
      const padded = {
        x: inner.x - p,
        y: inner.y - p,
        width: inner.width + 2 * p,
        height: inner.height + 2 * p,
      };
      const own = rects.get(g);
      const hasOwnPosition = s.byId.get(g)?.node.layout?.position !== undefined;
      const rect = own !== undefined && hasOwnPosition ? unionRects([own, padded]) : padded;
      rects.set(g, rect);
      sizes.set(g, { width: rect.width, height: rect.height });
    }
    const satellites = nodes.map((m) => m.node).filter((n) => !rects.has(n.id));
    placeSatellites(
      satellites,
      s.anchorOf,
      (id) => sizes.get(id) ?? { width: 0, height: 0 },
      rects,
      opts,
    );
    const positions: Record<NodeId, Point> = {};
    const sizeRecord: Record<NodeId, Size> = {};
    for (const m of nodes) {
      const r = rects.get(m.node.id) ?? { x: 0, y: 0, width: 0, height: 0 };
      positions[m.node.id] = { x: r.x, y: r.y };
      sizeRecord[m.node.id] = { width: r.width, height: r.height };
    }
    return { positions, sizes: sizeRecord, bounds: unionRects([...rects.values()]) };
  };
