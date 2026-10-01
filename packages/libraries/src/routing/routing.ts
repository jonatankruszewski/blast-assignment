import type {
  GraphEdge,
  GraphNode,
  LayoutResult,
  NodeId,
  Point,
  Rect,
  RoutedEdge,
  Side,
} from "../dependency-graph/dependency-graph.types.js";
import { OPPOSITE_SIDE, isHorizontalSide, sideDirection, sidePoint } from "../geometry/geometry.js";
import type { RouteOptions } from "./routing.types.js";

const round = (n: number): number => Math.round(n * 100) / 100;

/** Side of `rect` facing point `p` (left→right flow preferred). */
export const sideFacing = (rect: Rect, p: Point): Side => {
  if (p.x <= rect.x) return "left";
  if (p.x >= rect.x + rect.width) return "right";
  return p.y <= rect.y ? "top" : "bottom";
};

/** Default sides for an edge between two rects without ports. */
export const pickSides = (source: Rect, target: Rect): [Side, Side] => {
  if (target.x >= source.x + source.width) return ["right", "left"];
  if (target.x + target.width <= source.x) return ["left", "right"];
  if (target.y + target.height <= source.y) return ["top", "bottom"];
  return ["bottom", "top"];
};

/** Removes duplicate and collinear points. */
export const simplifyPoints = (points: readonly Point[]): Point[] => {
  const out: Point[] = [];
  for (const p of points) {
    const last = out[out.length - 1];
    if (last !== undefined && Math.abs(last.x - p.x) < 0.01 && Math.abs(last.y - p.y) < 0.01) {
      continue;
    }
    const prev = out[out.length - 2];
    if (
      prev !== undefined &&
      last !== undefined &&
      ((Math.abs(prev.x - last.x) < 0.01 && Math.abs(last.x - p.x) < 0.01) ||
        (Math.abs(prev.y - last.y) < 0.01 && Math.abs(last.y - p.y) < 0.01))
    ) {
      out[out.length - 1] = p;
      continue;
    }
    out.push(p);
  }
  return out;
};

/** SVG path through `points` with quadratic rounded corners of up to `radius`. */
export const roundedPath = (points: readonly Point[], radius: number): string => {
  const first = points[0];
  if (first === undefined) return "";
  let d = `M${round(first.x)},${round(first.y)}`;
  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1];
    const cur = points[i];
    const next = points[i + 1];
    if (prev === undefined || cur === undefined || next === undefined) continue;
    const lenIn = Math.hypot(cur.x - prev.x, cur.y - prev.y);
    const lenOut = Math.hypot(next.x - cur.x, next.y - cur.y);
    const r = Math.min(radius, lenIn / 2, lenOut / 2);
    if (r <= 0 || lenIn === 0 || lenOut === 0) {
      d += ` L${round(cur.x)},${round(cur.y)}`;
      continue;
    }
    const a = { x: cur.x - ((cur.x - prev.x) / lenIn) * r, y: cur.y - ((cur.y - prev.y) / lenIn) * r };
    const b = { x: cur.x + ((next.x - cur.x) / lenOut) * r, y: cur.y + ((next.y - cur.y) / lenOut) * r };
    d += ` L${round(a.x)},${round(a.y)} Q${round(cur.x)},${round(cur.y)} ${round(b.x)},${round(b.y)}`;
  }
  const last = points[points.length - 1];
  if (last !== undefined && points.length > 1) d += ` L${round(last.x)},${round(last.y)}`;
  return d;
};

/**
 * Orthogonal polyline from `start` (leaving through `sourceSide`) to `end` (entering through
 * `targetSide`). `mid` fixes the coordinate of the middle segment (used to share bundle trunks).
 */
export const orthogonalPoints = (
  start: Point,
  sourceSide: Side,
  end: Point,
  targetSide: Side,
  stub: number,
  mid?: number,
): Point[] => {
  const sd = sideDirection(sourceSide);
  const td = sideDirection(targetSide);
  const p1 = { x: start.x + sd.x * stub, y: start.y + sd.y * stub };
  const q1 = { x: end.x + td.x * stub, y: end.y + td.y * stub };
  const sh = isHorizontalSide(sourceSide);
  const th = isHorizontalSide(targetSide);

  if (sh && th) {
    if (sourceSide === targetSide) {
      const x = sd.x > 0 ? Math.max(start.x, end.x) + stub : Math.min(start.x, end.x) - stub;
      return [start, { x, y: start.y }, { x, y: end.y }, end];
    }
    if ((end.x - start.x) * sd.x >= 2 * stub || ((end.x - start.x) * sd.x > 0 && mid !== undefined)) {
      const m = mid ?? (start.x + end.x) / 2;
      return [start, { x: m, y: start.y }, { x: m, y: end.y }, end];
    }
    const my = (start.y + end.y) / 2;
    return [start, p1, { x: p1.x, y: my }, { x: q1.x, y: my }, q1, end];
  }
  if (!sh && !th) {
    if (sourceSide === targetSide) {
      const y = sd.y > 0 ? Math.max(start.y, end.y) + stub : Math.min(start.y, end.y) - stub;
      return [start, { x: start.x, y }, { x: end.x, y }, end];
    }
    if ((end.y - start.y) * sd.y >= 2 * stub || ((end.y - start.y) * sd.y > 0 && mid !== undefined)) {
      const m = mid ?? (start.y + end.y) / 2;
      return [start, { x: start.x, y: m }, { x: end.x, y: m }, end];
    }
    const mx = (start.x + end.x) / 2;
    return [start, p1, { x: mx, y: p1.y }, { x: mx, y: q1.y }, q1, end];
  }
  if (sh) {
    // Horizontal exit, vertical entry: one corner when the target is ahead and faces us.
    if ((end.x - start.x) * sd.x > 0 && (start.y - end.y) * td.y > 0) {
      return [start, { x: end.x, y: start.y }, end];
    }
    return [start, p1, { x: p1.x, y: q1.y }, q1, end];
  }
  // Vertical exit, horizontal entry.
  if ((end.y - start.y) * sd.y > 0 && (start.x - end.x) * td.x > 0) {
    return [start, { x: start.x, y: end.y }, end];
  }
  return [start, p1, { x: q1.x, y: p1.y }, q1, end];
};

interface Resolved<E extends GraphEdge> {
  edge: E;
  start: Point;
  end: Point;
  sourceSide: Side;
  targetSide: Side;
  selfLoop: boolean;
}

/**
 * Routes edges over a layout. Ports (`side` + `offset`) win; otherwise satellites connect through
 * their attach side and other nodes by relative position (left→right preferred). Edges sharing a
 * `bundle` key share the coordinate of their middle segment, which draws a common trunk/bus.
 */
export const routeEdges = <E extends GraphEdge>(
  input: { nodes: readonly GraphNode[]; edges: readonly E[]; layout: LayoutResult },
  options: RouteOptions = {},
): RoutedEdge<E>[] => {
  const radius = options.cornerRadius ?? 8;
  const stub = options.stub ?? 12;
  const straight = options.routing === "straight";
  const byId = new Map(input.nodes.map((n) => [n.id, n]));
  const rectOf = (id: NodeId): Rect | undefined => {
    const p = input.layout.positions[id];
    const s = input.layout.sizes[id];
    return p === undefined || s === undefined ? undefined : { ...p, ...s };
  };

  const resolved: Resolved<E>[] = [];
  for (const edge of input.edges) {
    const source = byId.get(edge.source);
    const target = byId.get(edge.target);
    const sr = rectOf(edge.source);
    const tr = rectOf(edge.target);
    if (source === undefined || target === undefined || sr === undefined || tr === undefined) {
      continue;
    }
    const sPort = source.ports?.find((p) => p.id === edge.sourcePort);
    const tPort = target.ports?.find((p) => p.id === edge.targetPort);
    const selfLoop = source.id === target.id;

    let sourceSide: Side;
    let targetSide: Side;
    if (selfLoop) {
      sourceSide = sPort?.side ?? "right";
      targetSide = tPort?.side ?? "top";
    } else {
      const sAttach = source.layout?.attach;
      const tAttach = target.layout?.attach;
      let auto: [Side, Side];
      if (sAttach?.to === target.id && source.layout?.position === undefined) {
        auto = [OPPOSITE_SIDE[sAttach.side], sAttach.side];
      } else if (tAttach?.to === source.id && target.layout?.position === undefined) {
        auto = [tAttach.side, OPPOSITE_SIDE[tAttach.side]];
      } else {
        auto = pickSides(sr, tr);
      }
      const sp = sPort === undefined ? undefined : sidePoint(sr, sPort.side, sPort.offset);
      const tp = tPort === undefined ? undefined : sidePoint(tr, tPort.side, tPort.offset);
      const relation = sAttach?.to === target.id || tAttach?.to === source.id;
      sourceSide =
        sPort?.side ??
        (tp !== undefined && !relation ? sideFacing(sr, tp) : auto[0]);
      targetSide =
        tPort?.side ??
        (sp !== undefined && !relation ? sideFacing(tr, sp) : auto[1]);
    }
    const start = sidePoint(sr, sourceSide, sPort?.offset ?? 0.5);
    const end = sidePoint(tr, targetSide, tPort?.offset ?? 0.5);
    resolved.push({ edge, start, end, sourceSide, targetSide, selfLoop });
  }

  // Shared trunk coordinate per bundle and orientation.
  const trunks = new Map<string, number>();
  const trunkKey = (r: Resolved<E>) =>
    r.edge.bundle === undefined ? undefined : `${r.edge.bundle}\u0000${r.sourceSide}>${r.targetSide}`;
  const groups = new Map<string, Resolved<E>[]>();
  for (const r of resolved) {
    const key = trunkKey(r);
    if (key === undefined || r.selfLoop || OPPOSITE_SIDE[r.sourceSide] !== r.targetSide) continue;
    const list = groups.get(key);
    if (list === undefined) groups.set(key, [r]);
    else list.push(r);
  }
  for (const [key, list] of groups) {
    const first = list[0];
    if (first === undefined) continue;
    const axis = isHorizontalSide(first.sourceSide) ? "x" : "y";
    const forward = sideDirection(first.sourceSide)[axis] > 0;
    const starts = list.map((r) => r.start[axis]);
    const ends = list.map((r) => r.end[axis]);
    const exit = forward ? Math.max(...starts) : Math.min(...starts);
    const entry = forward ? Math.min(...ends) : Math.max(...ends);
    trunks.set(key, (exit + entry) / 2);
  }

  return resolved.map((r) => {
    let points: Point[];
    if (straight) {
      points = [r.start, r.end];
    } else {
      const key = trunkKey(r);
      const mid = key === undefined ? undefined : trunks.get(key);
      points = simplifyPoints(
        orthogonalPoints(r.start, r.sourceSide, r.end, r.targetSide, stub, mid),
      );
    }
    const path = straight
      ? `M${round(r.start.x)},${round(r.start.y)} L${round(r.end.x)},${round(r.end.y)}`
      : roundedPath(points, radius);
    return { edge: r.edge, points, path };
  });
};
