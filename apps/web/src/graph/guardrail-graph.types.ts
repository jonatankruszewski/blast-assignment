import type { Tone } from "@blast/components";
import type { GraphEdge, GraphNode } from "@blast/libraries";
import type { ActionEffect, ActionKind } from "../domain/guardrail.types.js";

/** Edge/node tones are the design-system tones (type-only import keeps the mapper UI-free). */
export type GraphTone = Tone;

export type CountedResource = "identities" | "buckets";

export interface NodeDataByType {
  caption: { label: string; tone: GraphTone };
  resourceCount: { resource: CountedResource; count: number; tone: GraphTone; label: string };
  permissionHub: { label: string };
  action: { kind: ActionKind; label: string; tone: GraphTone };
  effect: { effect: ActionEffect; label: string; tone: GraphTone };
  policy: { label: string; tone: GraphTone };
  target: { label: string; locked: boolean };
  service: { label: string; tone: GraphTone };
  exclusions: { label: string; tone: GraphTone };
  violations: { title: string; items: string[]; tone: GraphTone };
}

export type GuardrailNodeType = keyof NodeDataByType;

export type GuardrailGraphNode = {
  [K in GuardrailNodeType]: GraphNode<NodeDataByType[K], K>;
}[GuardrailNodeType];

export interface GuardrailEdgeData {
  dashed: boolean;
}

/** Edge `type` is the tone it is drawn in. */
export type GuardrailGraphEdge = GraphEdge<GuardrailEdgeData, GraphTone>;

export interface GuardrailGraph {
  nodes: GuardrailGraphNode[];
  edges: GuardrailGraphEdge[];
}

export const TARGET_PORTS = {
  in: "in",
  exclusions: "exclusions",
  violations: "violations",
} as const;
