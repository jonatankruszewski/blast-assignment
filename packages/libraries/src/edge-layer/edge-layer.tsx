import type { Edge, EdgeProps } from "@xyflow/react";
import { createContext, use, type ComponentType, type SVGProps } from "react";
import type {
  EdgeMarker,
  EdgeRenderProps,
  GraphEdge,
  NodeId,
  RoutedEdge,
} from "../dependency-graph/dependency-graph.types.js";

export type FlowEdgeData = { routed: RoutedEdge };
export type FlowEdge = Edge<FlowEdgeData, "routed">;

export interface EdgeContextValue {
  markerPrefix: string;
  selectedId: NodeId | null;
  edgeRenderer?: ComponentType<EdgeRenderProps> | undefined;
  getEdgeProps?: ((edge: GraphEdge) => SVGProps<SVGPathElement>) | undefined;
}

export const EdgeContext = createContext<EdgeContextValue>({ markerPrefix: "", selectedId: null });

export const markerId = (prefix: string, marker: EdgeMarker): string => `${prefix}-${marker}`;

const markerUrl = (prefix: string, marker: EdgeMarker | undefined): string | undefined =>
  marker === undefined || marker === "none" ? undefined : `url(#${markerId(prefix, marker)})`;

/**
 * Marker definitions. Fill uses `context-stroke` (marker takes the edge's stroke) and falls back to
 * `currentColor` where unsupported.
 */
export function EdgeMarkers({ prefix }: { prefix: string }) {
  return (
    <svg
      aria-hidden="true"
      width="0"
      height="0"
      style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}
    >
      <defs>
        <marker
          id={markerId(prefix, "arrow")}
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="8"
          markerHeight="8"
          markerUnits="userSpaceOnUse"
          orient="auto-start-reverse"
        >
          <path d="M0,1 L9,5 L0,9 z" fill="currentColor" style={{ fill: "context-stroke" }} />
        </marker>
        <marker
          id={markerId(prefix, "dot")}
          viewBox="0 0 10 10"
          refX="5"
          refY="5"
          markerWidth="8"
          markerHeight="8"
          markerUnits="userSpaceOnUse"
          orient="auto"
        >
          <circle cx="5" cy="5" r="4" fill="currentColor" style={{ fill: "context-stroke" }} />
        </marker>
      </defs>
    </svg>
  );
}

/** The single xyflow edge type: draws the path computed by `routeEdges`. */
export function RoutedEdgeView({ data }: EdgeProps<FlowEdge>) {
  const ctx = use(EdgeContext);
  if (data === undefined) return null;
  const { routed } = data;
  const { edge } = routed;
  const selected = ctx.selectedId !== null && (edge.source === ctx.selectedId || edge.target === ctx.selectedId);
  const markerStart = markerUrl(ctx.markerPrefix, edge.markerStart);
  const markerEnd = markerUrl(ctx.markerPrefix, edge.markerEnd);
  const Renderer = ctx.edgeRenderer;
  if (Renderer !== undefined) {
    return (
      <Renderer
        {...routed}
        selected={selected}
        {...(markerStart === undefined ? {} : { markerStart })}
        {...(markerEnd === undefined ? {} : { markerEnd })}
      />
    );
  }
  return (
    <path
      d={routed.path}
      fill="none"
      stroke="currentColor"
      markerStart={markerStart}
      markerEnd={markerEnd}
      data-edge-id={edge.id}
      {...ctx.getEdgeProps?.(edge)}
    />
  );
}
