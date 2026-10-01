import { LockBadge, PortDot } from "@blast/components";
import type { Decoration } from "@blast/libraries";
import { TARGET_PORTS, type GuardrailGraphNode } from "./guardrail-graph.types.js";

/** Lock badge on a protected target; a dot where the violations line leaves it. */
export function guardrailDecorations(node: GuardrailGraphNode): readonly Decoration[] {
  if (node.type !== "target") return [];
  const decorations: Decoration[] = [];
  if (node.data.locked) decorations.push({ id: "lock", anchor: "top", content: <LockBadge /> });
  if (node.ports?.some((p) => p.id === TARGET_PORTS.violations)) {
    decorations.push({
      id: "violations-port",
      anchor: "bottom-right",
      content: <PortDot tone="red" />,
    });
  }
  return decorations;
}
