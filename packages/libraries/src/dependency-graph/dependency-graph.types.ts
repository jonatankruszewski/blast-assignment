import type { ComponentType, ReactNode, SVGProps } from "react";

/**
 * FROZEN CONTRACT (M0). The app and the components lane build against these types.
 * Additive, optional changes only; anything breaking needs sign-off from the lead.
 */

export type NodeId = string;
export type Side = "top" | "right" | "bottom" | "left";
export type Corner = "top-left" | "top-right" | "bottom-left" | "bottom-right";
export type Anchor = Side | Corner;

export interface Point {
  x: number;
  y: number;
}
export interface Size {
  width: number;
  height: number;
}
export interface Rect extends Point, Size {}

/** A named connection point on a node edge. `offset` is 0..1 along the side (default 0.5). */
export interface GraphPort {
  id: string;
  side: Side;
  offset?: number;
}

export interface NodeLayoutHints {
  /** Column in the layered layout (0 = leftmost). Defaults to longest-path rank. */
  rank?: number;
  /** Position inside its column, top to bottom. */
  order?: number;
  /** Satellite placement relative to another node instead of a column slot. */
  attach?: {
    to: NodeId;
    side: Side;
    gap?: number;
    align?: "start" | "center" | "end";
    /** Extra shift along the anchor side (px) after alignment, e.g. to sit above-left. */
    offset?: number;
  };
  /** Fixed position; wins over everything else. */
  position?: Point;
}

export interface GraphNode<TData = unknown, TType extends string = string> {
  id: NodeId;
  /** Selects the renderer in `nodeRenderers`. */
  type: TType;
  /** Opaque to the library. */
  data: TData;
  /** Compound membership: this node is laid out inside `parentId`. */
  parentId?: NodeId;
  ports?: GraphPort[];
  layout?: NodeLayoutHints;
  /** Excluded from keyboard navigation and activation (captions, decorative nodes). */
  inert?: boolean;
}

export type EdgeMarker = "none" | "arrow" | "dot";

export interface GraphEdge<TData = unknown, TType extends string = string> {
  id: string;
  source: NodeId;
  target: NodeId;
  sourcePort?: string;
  targetPort?: string;
  type?: TType;
  data?: TData;
  /** Edges sharing a key share a trunk segment (fan-out from one source / merge into one target). */
  bundle?: string;
  markerStart?: EdgeMarker;
  markerEnd?: EdgeMarker;
}

export interface Decoration {
  id: string;
  anchor: Anchor;
  content: ReactNode;
  /** Pin to this port of the node instead of `anchor` (falls back to `anchor` if unknown). */
  port?: string;
}

export interface NodeRenderProps<N extends GraphNode = GraphNode> {
  node: N;
  selected: boolean;
  focused: boolean;
  /** Size the layout assigned (groups are sized around their children). */
  size: Size;
  /** For groups: rendered children are placed by the library; render your frame only. */
  isGroup: boolean;
}

export interface RoutedEdge<E extends GraphEdge = GraphEdge> {
  edge: E;
  /** Polyline points in graph coordinates, source to target. */
  points: Point[];
  /** Ready-to-use SVG path `d`, orthogonal with rounded corners when routing is orthogonal. */
  path: string;
}

export interface EdgeRenderProps<E extends GraphEdge = GraphEdge> extends RoutedEdge<E> {
  selected: boolean;
  /** `url(#…)` of the library's marker for `edge.markerStart`, if any. */
  markerStart?: string;
  /** `url(#…)` of the library's marker for `edge.markerEnd`, if any. */
  markerEnd?: string;
}

export interface MeasuredNode<N extends GraphNode = GraphNode> {
  node: N;
  size: Size;
}

export interface LayoutResult {
  /** Top-left position of each node in graph coordinates (children: absolute, not parent-relative). */
  positions: Record<NodeId, Point>;
  /** Final size of each node (groups grow to fit their children). */
  sizes: Record<NodeId, Size>;
  bounds: Rect;
}

export type LayoutEngine = (input: {
  nodes: readonly MeasuredNode[];
  edges: readonly GraphEdge[];
}) => LayoutResult;

export interface ViewportOptions {
  fit?: boolean;
  pan?: boolean;
  zoom?: boolean | readonly [min: number, max: number];
  padding?: number;
}

export interface DependencyGraphProps<
  N extends GraphNode = GraphNode,
  E extends GraphEdge = GraphEdge,
> {
  nodes: readonly N[];
  edges: readonly E[];
  nodeRenderers: Record<string, ComponentType<NodeRenderProps<N>>>;
  edgeRenderer?: ComponentType<EdgeRenderProps<E>>;
  /** Props spread on the default edge `<path>` (stroke, className, strokeDasharray…). */
  getEdgeProps?: (edge: E) => SVGProps<SVGPathElement>;
  renderDecorations?: (node: N) => readonly Decoration[];
  layout?: LayoutEngine;
  routing?: "orthogonal" | "straight";
  /** Gap between columns / rows used by the default layered layout. */
  spacing?: { rank?: number; node?: number };
  background?: ReactNode;
  viewport?: ViewportOptions;
  selectedId?: NodeId | null;
  onSelect?: (id: NodeId | null) => void;
  onNodeActivate?: (node: N) => void;
  ariaLabel: string;
  /** Accessible name for a node (defaults to its rendered text content). */
  getNodeLabel?: (node: N) => string | undefined;
  emptyState?: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}
