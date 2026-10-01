import type { DependencyGraphProps, GraphEdge, GraphNode } from "./dependency-graph.types.js";

/** Placeholder until lane A lands the real implementation. */
export function DependencyGraph<N extends GraphNode, E extends GraphEdge>(
  props: DependencyGraphProps<N, E>,
) {
  return (
    <div role="group" aria-label={props.ariaLabel} className={props.className} style={props.style}>
      {props.nodes.length} nodes / {props.edges.length} edges
    </div>
  );
}
