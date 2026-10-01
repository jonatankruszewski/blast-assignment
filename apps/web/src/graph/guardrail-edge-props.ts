import { edgeTone } from "@blast/components";
import type { GuardrailGraphEdge } from "./guardrail-graph.types.js";

/** Edge stroke comes from the design system's tone classes; the edge `type` is its tone. */
export function guardrailEdgeProps(edge: GuardrailGraphEdge) {
  return edgeTone(edge.type ?? "neutral", { dashed: edge.data?.dashed ?? false });
}
