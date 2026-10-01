import "@xyflow/react/dist/base.css";
import {
  ReactFlow,
  ReactFlowProvider,
  type Node as FlowNode,
  type NodeProps as FlowNodeProps,
} from "@xyflow/react";
import {
  createContext,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { anchorPoint } from "../geometry/geometry.js";
import { layeredLayout } from "../layout/layout.js";
import { routeEdges } from "../routing/routing.js";
import type {
  DependencyGraphProps,
  EdgeMarker,
  GraphEdge,
  GraphNode,
  LayoutResult,
  NodeId,
  RoutedEdge,
  Size,
} from "./dependency-graph.types.js";

const DEFAULT_PADDING = 24;
const EDGES_NODE_ID = "__dg_edges__";

interface GraphContextValue {
  props: DependencyGraphProps<GraphNode, GraphEdge>;
  layout: LayoutResult;
  routed: readonly RoutedEdge[];
  groupIds: ReadonlySet<NodeId>;
}

const GraphContext = createContext<GraphContextValue | null>(null);

const useGraph = (): GraphContextValue => {
  const ctx = useContext(GraphContext);
  if (ctx === null) throw new Error("DependencyGraph context missing");
  return ctx;
};

interface NodeData extends Record<string, unknown> {
  graphNode: GraphNode;
}

const markerId = (kind: EdgeMarker, edgeId: string, end: "start" | "end") =>
  `dg-${kind}-${end}-${edgeId.replace(/[^\w-]/g, "_")}`;

/** Marker defs per edge so each inherits its edge's stroke color (`currentColor`). */
function EdgeMarkers({ edge }: { edge: GraphEdge }) {
  const defs: ReactNode[] = [];
  for (const end of ["start", "end"] as const) {
    const kind = end === "start" ? edge.markerStart : edge.markerEnd;
    if (kind === undefined || kind === "none") continue;
    const id = markerId(kind, edge.id, end);
    defs.push(
      kind === "arrow" ? (
        <marker
          key={id}
          id={id}
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="8"
          markerHeight="8"
          orient="auto-start-reverse"
        >
          <path d="M0,1 L9,5 L0,9 z" fill="context-stroke" />
        </marker>
      ) : (
        <marker key={id} id={id} viewBox="0 0 10 10" refX="5" refY="5" markerWidth="7" markerHeight="7">
          <circle cx="5" cy="5" r="4" fill="context-stroke" />
        </marker>
      ),
    );
  }
  return <>{defs}</>;
}

/** Every edge in one SVG, hosted by a non-interactive node that spans the layout bounds. */
function EdgesLayer() {
  const { props, layout, routed } = useGraph();
  const { bounds } = layout;
  const EdgeRenderer = props.edgeRenderer;
  return (
    <svg
      width={bounds.width}
      height={bounds.height}
      viewBox={`${String(bounds.x)} ${String(bounds.y)} ${String(bounds.width)} ${String(bounds.height)}`}
      style={{ overflow: "visible", pointerEvents: "none", display: "block" }}
      aria-hidden="true"
    >
      <defs>
        {routed.map((r) => (
          <EdgeMarkers key={r.edge.id} edge={r.edge} />
        ))}
      </defs>
      {routed.map((r) => {
        if (EdgeRenderer) {
          return <EdgeRenderer key={r.edge.id} {...r} selected={false} />;
        }
        const start = r.edge.markerStart;
        const end = r.edge.markerEnd;
        return (
          <path
            key={r.edge.id}
            d={r.path}
            fill="none"
            stroke="currentColor"
            strokeWidth={1}
            markerStart={start && start !== "none" ? `url(#${markerId(start, r.edge.id, "start")})` : undefined}
            markerEnd={end && end !== "none" ? `url(#${markerId(end, r.edge.id, "end")})` : undefined}
            {...props.getEdgeProps?.(r.edge)}
          />
        );
      })}
    </svg>
  );
}

function GraphNodeView({ data, selected }: FlowNodeProps<FlowNode<NodeData>>) {
  const { props, layout, groupIds } = useGraph();
  const node = data.graphNode;
  const Renderer = props.nodeRenderers[node.type];
  const size: Size = layout.sizes[node.id] ?? { width: 0, height: 0 };
  const decorations = props.renderDecorations?.(node) ?? [];
  const activatable = node.inert !== true;

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!activatable) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      props.onSelect?.(node.id);
      props.onNodeActivate?.(node);
    }
  };

  return (
    <div
      data-node-id={node.id}
      style={{ position: "relative", width: size.width, height: size.height }}
      onKeyDown={onKeyDown}
    >
      {Renderer ? (
        <Renderer
          node={node}
          selected={selected}
          focused={false}
          size={size}
          isGroup={groupIds.has(node.id)}
        />
      ) : null}
      {decorations.map((d) => {
        const p = anchorPoint({ x: 0, y: 0, ...size }, d.anchor);
        return (
          <div
            key={d.id}
            style={{
              position: "absolute",
              left: p.x,
              top: p.y,
              transform: "translate(-50%, -50%)",
              pointerEvents: "none",
            }}
          >
            {d.content}
          </div>
        );
      })}
    </div>
  );
}

const nodeTypes = { dg: GraphNodeView, dgEdges: EdgesLayer };

/** Renders every node once off-screen at its natural size and reports the measurements. */
function MeasureLayer({
  props,
  groupIds,
  onMeasure,
}: {
  props: DependencyGraphProps<GraphNode, GraphEdge>;
  groupIds: ReadonlySet<NodeId>;
  onMeasure: (sizes: Record<NodeId, Size>) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;
    const read = () => {
      const sizes: Record<NodeId, Size> = {};
      root.querySelectorAll<HTMLElement>("[data-measure-id]").forEach((el) => {
        const id = el.dataset.measureId;
        if (id !== undefined) sizes[id] = { width: el.offsetWidth, height: el.offsetHeight };
      });
      onMeasure(sizes);
    };
    read();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(read);
    root.querySelectorAll("[data-measure-id]").forEach((el) => {
      observer.observe(el);
    });
    return () => {
      observer.disconnect();
    };
  }, [props.nodes, onMeasure]);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      style={{ position: "absolute", left: -10000, top: 0, visibility: "hidden", pointerEvents: "none" }}
    >
      {props.nodes.map((node) => {
        if (groupIds.has(node.id)) return null;
        const Renderer = props.nodeRenderers[node.type];
        return (
          <div key={node.id} data-measure-id={node.id} style={{ display: "inline-block", position: "absolute" }}>
            {Renderer ? (
              <Renderer
                node={node}
                selected={false}
                focused={false}
                size={{ width: 0, height: 0 }}
                isGroup={false}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function sameSizes(a: Record<NodeId, Size>, b: Record<NodeId, Size>): boolean {
  const ka = Object.keys(a);
  if (ka.length !== Object.keys(b).length) return false;
  return ka.every((k) => a[k]?.width === b[k]?.width && a[k]?.height === b[k]?.height);
}

function GraphInner<N extends GraphNode, E extends GraphEdge>(props: DependencyGraphProps<N, E>) {
  const anyProps = props as unknown as DependencyGraphProps<GraphNode, GraphEdge>;
  const groupIds = useMemo(
    () => new Set(props.nodes.flatMap((n) => (n.parentId === undefined ? [] : [n.parentId]))),
    [props.nodes],
  );
  const [measured, setMeasured] = useState<Record<NodeId, Size>>({});
  const [onMeasure] = useState(
    () => (sizes: Record<NodeId, Size>) => {
      setMeasured((prev) => (sameSizes(prev, sizes) ? prev : sizes));
    },
  );

  const ready = props.nodes.every((n) => groupIds.has(n.id) || measured[n.id] !== undefined);

  const computed = useMemo(() => {
    if (!ready || props.nodes.length === 0) return null;
    const engine =
      props.layout ??
      layeredLayout({
        ...(props.spacing?.rank === undefined ? {} : { rankSpacing: props.spacing.rank }),
        ...(props.spacing?.node === undefined ? {} : { nodeSpacing: props.spacing.node }),
      });
    const layout = engine({
      nodes: props.nodes.map((node) => ({ node, size: measured[node.id] ?? { width: 0, height: 0 } })),
      edges: props.edges,
    });
    const routed = routeEdges(
      { nodes: props.nodes, edges: props.edges, layout },
      { routing: props.routing ?? "orthogonal" },
    );
    return { layout, routed };
  }, [ready, measured, props.nodes, props.edges, props.layout, props.routing, props.spacing?.rank, props.spacing?.node]);

  const flowNodes = useMemo<FlowNode[]>(() => {
    if (!computed) return [];
    const { layout } = computed;
    const nodes: FlowNode[] = [
      {
        id: EDGES_NODE_ID,
        type: "dgEdges",
        position: { x: layout.bounds.x, y: layout.bounds.y },
        data: {},
        draggable: false,
        selectable: false,
        focusable: false,
        zIndex: 1,
        style: { pointerEvents: "none" },
      },
    ];
    for (const node of props.nodes) {
      const pos = layout.positions[node.id] ?? { x: 0, y: 0 };
      const isGroup = groupIds.has(node.id);
      nodes.push({
        id: node.id,
        type: "dg",
        position: pos,
        data: { graphNode: node } satisfies NodeData,
        draggable: false,
        connectable: false,
        selectable: node.inert !== true,
        focusable: node.inert !== true,
        selected: props.selectedId === node.id,
        zIndex: isGroup ? 0 : 2,
      } as unknown as FlowNode);
    }
    return nodes;
  }, [computed, props.nodes, props.selectedId, groupIds]);

  const padding = props.viewport?.padding ?? DEFAULT_PADDING;
  const zoom = props.viewport?.zoom;
  const [minZoom, maxZoom] =
    zoom === undefined || zoom === false ? [0.2, 1] : zoom === true ? [0.5, 2] : zoom;
  const naturalHeight = computed ? computed.layout.bounds.height + padding * 2 : 240;

  const style: CSSProperties = {
    position: "relative",
    width: "100%",
    height: naturalHeight,
    ...props.style,
  };

  if (props.nodes.length === 0) {
    return (
      <div role="group" aria-label={props.ariaLabel} className={props.className} style={style}>
        {props.emptyState}
      </div>
    );
  }

  return (
    <div role="group" aria-label={props.ariaLabel} className={props.className} style={style}>
      {props.background ? (
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>{props.background}</div>
      ) : null}
      <MeasureLayer props={anyProps} groupIds={groupIds} onMeasure={onMeasure} />
      {computed ? (
        <GraphContext.Provider value={{ props: anyProps, layout: computed.layout, routed: computed.routed, groupIds }}>
          <ReactFlow
            key={computed.layout.bounds.width + "x" + computed.layout.bounds.height}
            nodes={flowNodes}
            edges={[]}
            nodeTypes={nodeTypes}
            fitView={props.viewport?.fit ?? true}
            fitViewOptions={{ padding: 0.06, maxZoom }}
            minZoom={minZoom}
            maxZoom={maxZoom}
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable
            panOnDrag={props.viewport?.pan ?? false}
            zoomOnScroll={zoom !== undefined && zoom !== false}
            zoomOnPinch={zoom !== undefined && zoom !== false}
            zoomOnDoubleClick={false}
            preventScrolling={zoom !== undefined && zoom !== false}
            proOptions={{ hideAttribution: true }}
            style={{ background: "transparent" }}
            onNodeClick={(_, n) => {
              if (n.id === EDGES_NODE_ID) return;
              const gn = props.nodes.find((x) => x.id === n.id);
              if (!gn || gn.inert === true) return;
              props.onSelect?.(gn.id);
              props.onNodeActivate?.(gn);
            }}
            onPaneClick={() => props.onSelect?.(null)}
          />
        </GraphContext.Provider>
      ) : null}
    </div>
  );
}

export function DependencyGraph<N extends GraphNode, E extends GraphEdge>(props: DependencyGraphProps<N, E>) {
  return (
    <ReactFlowProvider>
      <GraphInner {...props} />
    </ReactFlowProvider>
  );
}
