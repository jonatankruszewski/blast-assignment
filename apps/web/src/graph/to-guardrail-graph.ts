import type { ActionEffect, ActionKind, GuardrailDefense } from "../domain/guardrail.types.js";
import {
  TARGET_PORTS,
  type CountedResource,
  type GraphTone,
  type GuardrailGraph,
  type GuardrailGraphEdge,
  type GuardrailGraphNode,
} from "./guardrail-graph.types.js";

export const RANK = { resources: 0, permissions: 1, actions: 2, effects: 3, target: 4 } as const;

export const NODE_ID = {
  caption: "caption",
  permissions: "permissions",
  policy: "policy",
  target: "target",
  service: "service",
  exclusions: "exclusions",
  violations: "violations",
  resource: (resource: CountedResource) => `resource-${resource}`,
  action: (kind: ActionKind) => `action-${kind}`,
  effect: (effect: ActionEffect) => `effect-${effect}`,
  exclusion: (resource: CountedResource) => `exclusion-${resource}`,
} as const;

export const BUNDLE = {
  permissionsIn: "permissions-in",
  permissionsOut: "permissions-out",
  denyIn: "deny-in",
  allowIn: "allow-in",
  targetIn: "target-in",
  exclusionsOut: "exclusions-out",
} as const;

/** Where the violations line leaves the target: bottom edge, near the right corner. */
export const VIOLATIONS_PORT_OFFSET = 0.92;

const ACTION_META: Record<ActionKind, { label: string; tone: GraphTone }> = {
  delete: { label: "Deleting", tone: "orange" },
  create: { label: "Creating", tone: "magenta" },
  edit: { label: "Editing", tone: "purple" },
  discover: { label: "Discovery", tone: "teal" },
  view: { label: "View", tone: "indigo" },
};

const EFFECT_META: Record<ActionEffect, { label: string; tone: GraphTone }> = {
  deny: { label: "Deny", tone: "red" },
  allow: { label: "Allow", tone: "lime" },
};

const RESOURCES: readonly CountedResource[] = ["identities", "buckets"];
const EFFECTS: readonly ActionEffect[] = ["deny", "allow"];

function pluralise(count: number, singular: string, plural: string) {
  return `${String(count)} ${count === 1 ? singular : plural}`;
}

function resourceLabel(resource: CountedResource, count: number) {
  return resource === "identities"
    ? pluralise(count, "identity", "identities")
    : pluralise(count, "bucket", "buckets");
}

/** "08 Threats" — counts are shown with at least two digits, as in the design. */
function violationLine(count: number, label: string) {
  return `${String(count).padStart(2, "0")} ${label}`;
}

function edge(
  source: string,
  target: string,
  tone: GraphTone,
  extra: Omit<Partial<GuardrailGraphEdge>, "id" | "source" | "target" | "type"> = {},
): GuardrailGraphEdge {
  return { id: `${source}->${target}`, source, target, type: tone, data: { dashed: false }, ...extra };
}

/**
 * Pure mapping from a guardrail's defense to the generic graph model.
 * Domain rules live here: which resources/actions/effects exist, what is excluded, what is violated.
 * Zero counts drop their nodes (and the edges touching them).
 */
export function toGuardrailGraph(defense: GuardrailDefense): GuardrailGraph {
  const nodes: GuardrailGraphNode[] = [];
  const edges: GuardrailGraphEdge[] = [];

  // Rank 0: affected resources, with the caption floating above the first chip.
  const resources = RESOURCES.filter((r) => defense.affectedResources[r] > 0);
  resources.forEach((resource, order) => {
    const count = defense.affectedResources[resource];
    nodes.push({
      id: NODE_ID.resource(resource),
      type: "resourceCount",
      data: { resource, count, tone: "lime", label: resourceLabel(resource, count) },
      layout: { rank: RANK.resources, order },
    });
    edges.push(edge(NODE_ID.resource(resource), NODE_ID.permissions, "neutral", { bundle: BUNDLE.permissionsIn }));
  });
  const [firstResource] = resources;
  if (firstResource) {
    nodes.push({
      id: NODE_ID.caption,
      type: "caption",
      data: { label: "Affected Resources", tone: "lime" },
      inert: true,
      layout: { attach: { to: NODE_ID.resource(firstResource), side: "top", gap: 4, align: "center" } },
    });
  }

  // Rank 1: permissions hub.
  nodes.push({
    id: NODE_ID.permissions,
    type: "permissionHub",
    data: { label: "Permissions" },
    layout: { rank: RANK.permissions, order: 0 },
  });

  // Rank 2: actions, each feeding the effect it resolves to (rank 3).
  defense.actions.forEach((action, order) => {
    const id = NODE_ID.action(action.kind);
    nodes.push({
      id,
      type: "action",
      data: { kind: action.kind, ...ACTION_META[action.kind] },
      layout: { rank: RANK.actions, order },
    });
    edges.push(edge(NODE_ID.permissions, id, "neutral", { bundle: BUNDLE.permissionsOut }));
    edges.push(
      edge(id, NODE_ID.effect(action.effect), EFFECT_META[action.effect].tone, {
        bundle: action.effect === "deny" ? BUNDLE.denyIn : BUNDLE.allowIn,
      }),
    );
  });

  const effects = EFFECTS.filter((e) => defense.actions.some((a) => a.effect === e));
  effects.forEach((effect, order) => {
    nodes.push({
      id: NODE_ID.effect(effect),
      type: "effect",
      data: { effect, ...EFFECT_META[effect] },
      layout: { rank: RANK.effects, order },
    });
    edges.push(
      edge(NODE_ID.effect(effect), NODE_ID.target, EFFECT_META[effect].tone, {
        targetPort: TARGET_PORTS.in,
        bundle: BUNDLE.targetIn,
        markerEnd: "arrow",
      }),
    );
  });

  // Rank 4: the protected target (a group containing the service pill).
  const exclusionTotal = defense.exclusions.identities + defense.exclusions.buckets;
  const violationTotal = defense.violations.findings + defense.violations.issues + defense.violations.threats;
  const targetPorts: NonNullable<GuardrailGraphNode["ports"]> = [{ id: TARGET_PORTS.in, side: "left", offset: 0.5 }];
  if (exclusionTotal > 0) targetPorts.push({ id: TARGET_PORTS.exclusions, side: "bottom", offset: 0.5 });
  if (violationTotal > 0) {
    targetPorts.push({ id: TARGET_PORTS.violations, side: "bottom", offset: VIOLATIONS_PORT_OFFSET });
  }
  nodes.push({
    id: NODE_ID.target,
    type: "target",
    data: { label: defense.target.service, locked: defense.target.locked },
    ports: targetPorts,
    layout: { rank: RANK.target, order: 0 },
  });
  nodes.push({
    id: NODE_ID.service,
    type: "service",
    parentId: NODE_ID.target,
    data: { label: defense.target.service, tone: "red" },
  });

  // Satellite: the policy that enforces the guardrail, above the target.
  nodes.push({
    id: NODE_ID.policy,
    type: "policy",
    data: { label: defense.policy.label, tone: "indigo" },
    layout: { attach: { to: NODE_ID.target, side: "top", gap: 48, align: "start" } },
  });
  edges.push(
    edge(NODE_ID.policy, NODE_ID.target, "indigo", {
      targetPort: TARGET_PORTS.in,
      bundle: BUNDLE.targetIn,
      markerEnd: "arrow",
    }),
  );

  // Satellite: exclusions below the target, with one chip per excluded resource kind below it.
  if (exclusionTotal > 0) {
    nodes.push({
      id: NODE_ID.exclusions,
      type: "exclusions",
      data: { label: "Exclusions", tone: "sky" },
      layout: { attach: { to: NODE_ID.target, side: "bottom", gap: 40, align: "center" } },
    });
    edges.push(
      edge(NODE_ID.exclusions, NODE_ID.target, "sky", { targetPort: TARGET_PORTS.exclusions, markerEnd: "arrow" }),
    );
    const excluded = RESOURCES.filter((r) => defense.exclusions[r] > 0);
    excluded.forEach((resource, index) => {
      const count = defense.exclusions[resource];
      const align = excluded.length === 1 ? "center" : index === 0 ? "start" : "end";
      nodes.push({
        id: NODE_ID.exclusion(resource),
        type: "resourceCount",
        data: { resource, count, tone: "sky", label: `${resourceLabel(resource, count)} excluded` },
        layout: { attach: { to: NODE_ID.exclusions, side: "bottom", gap: 24, align } },
      });
      edges.push(edge(NODE_ID.exclusions, NODE_ID.exclusion(resource), "sky", { bundle: BUNDLE.exclusionsOut }));
    });
  }

  // Violations: a callout connected from the target's bottom-right port.
  if (violationTotal > 0) {
    const { findings, issues, threats } = defense.violations;
    nodes.push({
      id: NODE_ID.violations,
      type: "violations",
      data: {
        title: "Violations:",
        tone: "red",
        items: [violationLine(findings, "Findings"), violationLine(issues, "Issues"), violationLine(threats, "Threats")],
      },
      ports: [{ id: "in", side: "left", offset: 0.25 }],
      layout: { attach: { to: NODE_ID.target, side: "right", gap: 56, align: "end" } },
    });
    edges.push(
      edge(NODE_ID.target, NODE_ID.violations, "red", { sourcePort: TARGET_PORTS.violations, targetPort: "in" }),
    );
  }

  return { nodes, edges };
}
