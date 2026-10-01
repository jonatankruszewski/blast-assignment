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
import { anchorPoint, portPoint } from "../geometry/geometry.js";
import { KEY_DIRECTIONS, nextInDirection, readingOrder } from "../keyboard-nav/keyboard-nav.js";
import { getGroupIds, layeredLayout } from "../layout/layout.js";
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
  config: DependencyGraphProps;
  layout: LayoutResult;
  routed: readonly RoutedEdge[];
  groupIds: ReadonlySet<NodeId>;
  /** Roving tabindex holder. */
  activeId: NodeId | undefined;
  /** Node that currently has DOM focus. */
  focusedId: NodeId | undefined;
  setFocusedId: (id: NodeId | undefined) => void;
  registerNode: (id: NodeId, el: HTMLElement | null) => void;
  moveFocus: (from: NodeId, key: string) => boolean;
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
        <marker
          key={id}
          id={id}
          viewBox="0 0 10 10"
          refX="5"
          refY="5"
          markerWidth="7"
          markerHeight="7"
        >
          <circle cx="5" cy="5" r="4" fill="context-stroke" />
        </marker>
      ),
    );
  }
  return <>{defs}</>;
}

/** Every edge in one SVG, hosted by a non-interactive node that spans the layout bounds. */
function EdgesLayer() {
  const { config, layout, routed } = useGraph();
  const { bounds } = layout;
  const EdgeRenderer = config.edgeRenderer;
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
            markerStart={
              start && start !== "none" ? `url(#${markerId(start, r.edge.id, "start")})` : undefined
            }
            markerEnd={
              end && end !== "none" ? `url(#${markerId(end, r.edge.id, "end")})` : undefined
            }
            {...config.getEdgeProps?.(r.edge)}
          />
        );
      })}
    </svg>
  );
}

function GraphNodeView({ data, selected }: FlowNodeProps<FlowNode<NodeData>>) {
  const { config, layout, groupIds, activeId, focusedId, setFocusedId, registerNode, moveFocus } =
    useGraph();
  const node = data.graphNode;
  const Renderer = config.nodeRenderers[node.type];
  const size: Size = layout.sizes[node.id] ?? { width: 0, height: 0 };
  const decorations = config.renderDecorations?.(node) ?? [];
  const activatable = node.inert !== true;
  const frame = { x: 0, y: 0, ...size };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      config.onSelect?.(node.id);
      config.onNodeActivate?.(node);
    } else if (event.key === "Escape") {
      config.onSelect?.(null);
    } else if (moveFocus(node.id, event.key)) {
      event.preventDefault();
    }
  };

  const content = (
    <>
      {Renderer ? (
        <Renderer
          node={node}
          selected={selected}
          focused={focusedId === node.id}
          size={size}
          isGroup={groupIds.has(node.id)}
        />
      ) : null}
      {decorations.map((d) => {
        const port = d.port === undefined ? undefined : node.ports?.find((p) => p.id === d.port);
        const p = port === undefined ? anchorPoint(frame, d.anchor) : portPoint(frame, port);
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
    </>
  );
  const style = { position: "relative", width: size.width, height: size.height } as const;

  if (!activatable) {
    return (
      <div data-node-id={node.id} style={style}>
        {content}
      </div>
    );
  }
  return (
    <div
      ref={(el) => {
        registerNode(node.id, el);
      }}
      data-node-id={node.id}
      role="button"
      tabIndex={activeId === node.id ? 0 : -1}
      aria-label={config.getNodeLabel?.(node)}
      aria-pressed={config.onSelect === undefined ? undefined : selected}
      style={style}
      onKeyDown={onKeyDown}
      onFocus={() => {
        setFocusedId(node.id);
      }}
      onBlur={() => {
        setFocusedId(undefined);
      }}
    >
      {content}
    </div>
  );
}

const nodeTypes = { dg: GraphNodeView, dgEdges: EdgesLayer };

/** Renders every node once off-screen at its natural size and reports the measurements. */
function MeasureLayer({
  graph,
  groupIds,
  onMeasure,
}: {
  graph: DependencyGraphProps;
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
  }, [graph.nodes, onMeasure]);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      style={{
        position: "absolute",
        left: -10000,
        top: 0,
        visibility: "hidden",
        pointerEvents: "none",
      }}
    >
      {graph.nodes.map((node) => {
        if (groupIds.has(node.id)) return null;
        const Renderer = graph.nodeRenderers[node.type];
        return (
          <div
            key={node.id}
            data-measure-id={node.id}
            style={{ display: "inline-block", position: "absolute" }}
          >
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
  const anyProps = props as unknown as DependencyGraphProps;
  const groupIds = useMemo(() => getGroupIds(props.nodes), [props.nodes]);
  const [measured, setMeasured] = useState<Record<NodeId, Size>>({});
  const [onMeasure] = useState(() => (sizes: Record<NodeId, Size>) => {
    setMeasured((prev) => (sameSizes(prev, sizes) ? prev : sizes));
  });

  const ready = props.nodes.every((n) => groupIds.has(n.id) || measured[n.id] !== undefined);

  const rankSpacing = props.spacing?.rank;
  const nodeSpacing = props.spacing?.node;
  const computed = useMemo(() => {
    if (!ready || props.nodes.length === 0) return null;
    const engine = props.layout ?? layeredLayout({ rankSpacing, nodeSpacing });
    const layout = engine({
      nodes: props.nodes.map((node) => ({
        node,
        size: measured[node.id] ?? { width: 0, height: 0 },
      })),
      edges: props.edges,
    });
    const routed = routeEdges(
      { nodes: props.nodes, edges: props.edges, layout },
      { routing: props.routing ?? "orthogonal" },
    );
    return { layout, routed };
  }, [
    ready,
    measured,
    props.nodes,
    props.edges,
    props.layout,
    props.routing,
    rankSpacing,
    nodeSpacing,
  ]);

  // Keyboard: roving tabindex over non-inert nodes, arrow keys move spatially.
  const [activeIdState, setActiveId] = useState<NodeId | undefined>(undefined);
  const [focusedId, setFocusedIdState] = useState<NodeId | undefined>(undefined);
  const nodeEls = useRef(new Map<NodeId, HTMLElement>());
  const nav = useMemo(() => {
    if (!computed) return { items: [], order: [] };
    const items = props.nodes
      .filter((n) => n.inert !== true)
      .map((n) => ({
        id: n.id,
        rect: {
          ...(computed.layout.positions[n.id] ?? { x: 0, y: 0 }),
          ...(computed.layout.sizes[n.id] ?? { width: 0, height: 0 }),
        },
      }));
    return { items, order: readingOrder(items) };
  }, [computed, props.nodes]);
  const isNavigable = (id: NodeId | null | undefined): id is NodeId =>
    id !== null && id !== undefined && nav.order.includes(id);
  const activeId = isNavigable(activeIdState)
    ? activeIdState
    : isNavigable(props.selectedId)
      ? props.selectedId
      : nav.order[0];

  const setFocusedId = (id: NodeId | undefined) => {
    setFocusedIdState(id);
    if (id !== undefined) setActiveId(id);
  };
  const registerNode = (id: NodeId, el: HTMLElement | null) => {
    if (el === null) nodeEls.current.delete(id);
    else nodeEls.current.set(id, el);
  };
  const moveFocus = (from: NodeId, key: string): boolean => {
    const direction = KEY_DIRECTIONS[key];
    let next: NodeId | undefined;
    if (direction !== undefined) next = nextInDirection(nav.items, from, direction);
    else if (key === "Home") next = nav.order[0];
    else if (key === "End") next = nav.order[nav.order.length - 1];
    else return false;
    if (next !== undefined) {
      setActiveId(next);
      nodeEls.current.get(next)?.focus();
    }
    return true;
  };

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
        // Focus lives on the node's own role="button" element (roving tabindex), not xyflow's wrapper.
        focusable: false,
        selected: props.selectedId === node.id,
        zIndex: isGroup ? 0 : 2,
      });
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
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          {props.background}
        </div>
      ) : null}
      <MeasureLayer graph={anyProps} groupIds={groupIds} onMeasure={onMeasure} />
      {computed ? (
        <GraphContext.Provider
          value={{
            config: anyProps,
            layout: computed.layout,
            routed: computed.routed,
            groupIds,
            activeId,
            focusedId,
            setFocusedId,
            registerNode,
            moveFocus,
          }}
        >
          <ReactFlow
            key={`${String(computed.layout.bounds.width)}x${String(computed.layout.bounds.height)}`}
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
            deleteKeyCode={null}
            selectionKeyCode={null}
            multiSelectionKeyCode={null}
            panActivationKeyCode={null}
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

export function DependencyGraph<N extends GraphNode, E extends GraphEdge>(
  props: DependencyGraphProps<N, E>,
) {
  return (
    <ReactFlowProvider>
      <GraphInner {...props} />
    </ReactFlowProvider>
  );
}
