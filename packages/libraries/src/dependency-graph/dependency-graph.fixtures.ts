import type { GraphEdge, GraphNode, Size } from "./dependency-graph.types.js";

/**
 * Test / playground fixtures. NOT exported from the package index.
 * `guardrailLikeFixture` reproduces the topology of the design's "Defense Visualization" graph
 * using only generic primitives (types are arbitrary renderer keys).
 */
export interface FixtureData {
  label: string;
}

export type FixtureNodeType = "chip" | "caption" | "pill" | "group" | "callout";
export type FixtureNode = GraphNode<FixtureData, FixtureNodeType>;
export type FixtureEdge = GraphEdge;

const node = (
  id: string,
  type: FixtureNodeType,
  label: string,
  extra: Partial<Omit<FixtureNode, "id" | "type" | "data">> = {},
): FixtureNode => ({ id, type, data: { label }, ...extra });

const ACTIONS = ["Deleting", "Creating", "Editing", "Discovery", "View"] as const;

export const guardrailLikeFixture: { nodes: FixtureNode[]; edges: FixtureEdge[] } = {
  nodes: [
    node("resources-caption", "caption", "Affected Resources", {
      inert: true,
      layout: { attach: { to: "resource-users", side: "top", gap: 4 } },
    }),
    node("resource-users", "chip", "15 users", { layout: { order: 0 } }),
    node("resource-buckets", "chip", "2 buckets", { layout: { order: 1 } }),
    node("permissions", "pill", "Permissions"),
    ...ACTIONS.map((label, order) => node(`action-${label.toLowerCase()}`, "pill", label, { layout: { order } })),
    node("deny", "pill", "Deny"),
    node("target", "group", "Target", {
      ports: [
        { id: "in", side: "left" },
        { id: "violations", side: "bottom", offset: 0.9 },
      ],
    }),
    node("analyzer", "pill", "Access Analyzer", { parentId: "target" }),
    node("scp", "pill", "Service control policy", {
      layout: { attach: { to: "target", side: "top", align: "start", offset: -110, gap: 16 } },
    }),
    node("violations", "callout", "Violations", {
      layout: { attach: { to: "target", side: "right", align: "start", offset: 64, gap: 48 } },
    }),
    node("exclusions", "pill", "Exclusions", {
      layout: { attach: { to: "target", side: "bottom", gap: 32 } },
    }),
    node("exclusion-users", "chip", "2 users", {
      layout: { attach: { to: "exclusions", side: "bottom", gap: 24 } },
    }),
    node("exclusion-buckets", "chip", "1 bucket", {
      layout: { attach: { to: "exclusions", side: "bottom", gap: 24 } },
    }),
  ],
  edges: [
    { id: "e-res-users", source: "resource-users", target: "permissions", bundle: "resources" },
    { id: "e-res-buckets", source: "resource-buckets", target: "permissions", bundle: "resources" },
    ...ACTIONS.map((label) => ({
      id: `e-perm-${label.toLowerCase()}`,
      source: "permissions",
      target: `action-${label.toLowerCase()}`,
      bundle: "permissions",
    })),
    ...ACTIONS.map((label) => ({
      id: `e-${label.toLowerCase()}-deny`,
      source: `action-${label.toLowerCase()}`,
      target: "deny",
      bundle: "deny",
    })),
    { id: "e-deny-target", source: "deny", target: "target", targetPort: "in", markerEnd: "arrow" },
    { id: "e-scp-target", source: "scp", target: "target", targetPort: "in", markerEnd: "arrow" },
    {
      id: "e-target-violations",
      source: "target",
      sourcePort: "violations",
      target: "violations",
      markerStart: "dot",
    },
    { id: "e-exclusions-target", source: "exclusions", target: "target", markerEnd: "arrow" },
    {
      id: "e-exclusions-users",
      source: "exclusions",
      target: "exclusion-users",
      bundle: "exclusions",
    },
    {
      id: "e-exclusions-buckets",
      source: "exclusions",
      target: "exclusion-buckets",
      bundle: "exclusions",
    },
  ],
};

/** Deterministic sizes for layout/routing tests (roughly the design's proportions). */
export const guardrailLikeSizes: Record<string, Size> = {
  "resources-caption": { width: 72, height: 32 },
  "resource-users": { width: 60, height: 28 },
  "resource-buckets": { width: 60, height: 28 },
  permissions: { width: 104, height: 32 },
  "action-deleting": { width: 110, height: 36 },
  "action-creating": { width: 110, height: 36 },
  "action-editing": { width: 110, height: 36 },
  "action-discovery": { width: 110, height: 36 },
  "action-view": { width: 110, height: 36 },
  deny: { width: 72, height: 30 },
  target: { width: 0, height: 0 },
  analyzer: { width: 190, height: 40 },
  scp: { width: 172, height: 24 },
  violations: { width: 128, height: 88 },
  exclusions: { width: 110, height: 30 },
  "exclusion-users": { width: 54, height: 28 },
  "exclusion-buckets": { width: 54, height: 28 },
};

/** A small, non-domain example: a build pipeline. */
export const pipelineFixture: { nodes: GraphNode<FixtureData, "box">[]; edges: GraphEdge[] } = {
  nodes: [
    { id: "src", type: "box", data: { label: "Source" } },
    { id: "lint", type: "box", data: { label: "Lint" } },
    { id: "test", type: "box", data: { label: "Test" } },
    { id: "build", type: "box", data: { label: "Build" } },
    { id: "deploy", type: "box", data: { label: "Deploy" } },
    {
      id: "note",
      type: "box",
      data: { label: "manual approval" },
      inert: true,
      layout: { attach: { to: "deploy", side: "bottom" } },
    },
  ],
  edges: [
    { id: "a", source: "src", target: "lint", markerEnd: "arrow" },
    { id: "b", source: "src", target: "test", markerEnd: "arrow" },
    { id: "c", source: "lint", target: "build", markerEnd: "arrow" },
    { id: "d", source: "test", target: "build", markerEnd: "arrow" },
    { id: "e", source: "build", target: "deploy", markerEnd: "arrow" },
  ],
};
