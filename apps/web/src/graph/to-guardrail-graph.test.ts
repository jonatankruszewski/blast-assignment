import { describe, expect, it } from "vitest";
import type { GuardrailDefense } from "../domain/guardrail.types.js";
import {
  defenseFixture,
  guardrailsFixture,
  SCREENSHOT_GUARDRAIL_ID,
} from "../mocks/guardrails.fixtures.js";
import { TARGET_PORTS, type GuardrailGraph } from "./guardrail-graph.types.js";
import {
  BUNDLE,
  NODE_ID,
  RANK,
  toGuardrailGraph,
  VIOLATIONS_PORT_OFFSET,
} from "./to-guardrail-graph.js";

const screenshotGuardrail = guardrailsFixture.find((g) => g.id === SCREENSHOT_GUARDRAIL_ID);
if (!screenshotGuardrail) throw new Error("fixture missing");
const defense = defenseFixture(screenshotGuardrail);

function node(graph: GuardrailGraph, id: string) {
  const found = graph.nodes.find((n) => n.id === id);
  if (!found) throw new Error(`node ${id} not found`);
  return found;
}

function ids(graph: GuardrailGraph) {
  return graph.nodes.map((n) => n.id);
}

function withDefense(patch: Partial<GuardrailDefense>): GuardrailDefense {
  return { ...defense, ...patch };
}

describe("toGuardrailGraph — screenshot guardrail", () => {
  const graph = toGuardrailGraph(defense);

  it("emits every node in the design", () => {
    expect(ids(graph).sort()).toEqual(
      [
        "caption",
        "resource-identities",
        "resource-buckets",
        "permissions",
        "action-delete",
        "action-create",
        "action-edit",
        "action-discover",
        "action-view",
        "effect-deny",
        "target",
        "service",
        "policy",
        "exclusions",
        "exclusion-identities",
        "exclusion-buckets",
        "violations",
      ].sort(),
    );
  });

  it("uses unique node and edge ids", () => {
    expect(new Set(ids(graph)).size).toBe(graph.nodes.length);
    expect(new Set(graph.edges.map((e) => e.id)).size).toBe(graph.edges.length);
  });

  it("only connects existing nodes", () => {
    const known = new Set(ids(graph));
    for (const e of graph.edges) {
      expect(known.has(e.source), e.id).toBe(true);
      expect(known.has(e.target), e.id).toBe(true);
    }
  });

  it("assigns column ranks left to right", () => {
    expect(node(graph, "resource-identities").layout?.rank).toBe(RANK.resources);
    expect(node(graph, "resource-buckets").layout?.rank).toBe(RANK.resources);
    expect(node(graph, "permissions").layout?.rank).toBe(RANK.permissions);
    expect(node(graph, "action-view").layout?.rank).toBe(RANK.actions);
    expect(node(graph, "effect-deny").layout?.rank).toBe(RANK.effects);
    expect(node(graph, "target").layout?.rank).toBe(RANK.target);
    expect(RANK).toEqual({ resources: 0, permissions: 1, actions: 2, effects: 3, target: 4 });
  });

  it("keeps action order and tones from the design", () => {
    const actions = graph.nodes.filter((n) => n.type === "action");
    expect(actions.map((n) => [n.data.label, n.data.tone, n.layout?.order])).toEqual([
      ["Deleting", "orange", 0],
      ["Creating", "magenta", 1],
      ["Editing", "purple", 2],
      ["Discovery", "teal", 3],
      ["View", "indigo", 4],
    ]);
  });

  it("maps resource counts into lime chips with accessible labels", () => {
    expect(node(graph, "resource-identities").data).toEqual({
      resource: "identities",
      count: 15,
      tone: "lime",
      label: "15 identities",
    });
    expect(node(graph, "resource-buckets").data).toMatchObject({ count: 2, label: "2 buckets" });
  });

  it("floats an inert caption above the first resource chip", () => {
    const caption = node(graph, NODE_ID.caption);
    expect(caption.inert).toBe(true);
    expect(caption.data).toEqual({ label: "Affected Resources", tone: "lime" });
    expect(caption.layout?.attach).toMatchObject({ to: "resource-identities", side: "top" });
    expect(caption.layout?.rank).toBeUndefined();
  });

  it("bundles the permission fan-out and the merge into deny", () => {
    const out = graph.edges.filter((e) => e.bundle === BUNDLE.permissionsOut);
    expect(out).toHaveLength(5);
    expect(out.every((e) => e.source === "permissions" && e.type === "neutral")).toBe(true);

    const denyIn = graph.edges.filter((e) => e.bundle === BUNDLE.denyIn);
    expect(denyIn).toHaveLength(5);
    expect(denyIn.every((e) => e.target === "effect-deny" && e.type === "red")).toBe(true);

    const permissionsIn = graph.edges.filter((e) => e.bundle === BUNDLE.permissionsIn);
    expect(permissionsIn.map((e) => e.source)).toEqual(["resource-identities", "resource-buckets"]);
  });

  it("points deny and the SCP into the target's left port with arrows", () => {
    const into = graph.edges.filter(
      (e) => e.target === "target" && e.targetPort === TARGET_PORTS.in,
    );
    expect(into.map((e) => [e.source, e.type, e.markerEnd, e.bundle])).toEqual([
      ["effect-deny", "red", "arrow", BUNDLE.targetIn],
      ["policy", "indigo", "arrow", BUNDLE.targetIn],
    ]);
  });

  it("nests the service pill inside the locked target", () => {
    expect(node(graph, "service").parentId).toBe("target");
    expect(node(graph, "service").data).toMatchObject({ label: "Access Analyzer" });
    expect(node(graph, "target").data).toEqual({ label: "Access Analyzer", locked: true });
  });

  it("attaches the SCP above the target aligned to its start", () => {
    expect(node(graph, "policy").layout?.attach).toMatchObject({
      to: "target",
      side: "top",
      align: "start",
    });
    expect(node(graph, "policy").data).toEqual({ label: "Service control policy", tone: "indigo" });
  });

  it("attaches exclusions below the target and its two chips below exclusions", () => {
    expect(node(graph, "exclusions").layout?.attach).toMatchObject({
      to: "target",
      side: "bottom",
    });
    expect(node(graph, "exclusion-identities").layout?.attach).toMatchObject({
      to: "exclusions",
      side: "bottom",
      align: "start",
    });
    expect(node(graph, "exclusion-buckets").layout?.attach).toMatchObject({
      to: "exclusions",
      side: "bottom",
      align: "end",
    });
    expect(node(graph, "exclusion-identities").data).toMatchObject({ count: 2, tone: "sky" });
    expect(node(graph, "exclusion-buckets").data).toMatchObject({ count: 1, tone: "sky" });
    const exclusionEdges = graph.edges.filter((e) => e.source === "exclusions");
    expect(exclusionEdges.every((e) => e.type === "sky")).toBe(true);
    expect(
      graph.edges.find((e) => e.target === "target" && e.source === "exclusions")?.targetPort,
    ).toBe(TARGET_PORTS.exclusions);
  });

  it("connects violations from the target's bottom-right port", () => {
    const port = node(graph, "target").ports?.find((p) => p.id === TARGET_PORTS.violations);
    expect(port).toEqual({ id: "violations", side: "bottom", offset: VIOLATIONS_PORT_OFFSET });
    const line = graph.edges.find((e) => e.target === "violations");
    expect(line).toMatchObject({ source: "target", sourcePort: "violations", type: "red" });
  });

  it("formats violation counts with two digits", () => {
    expect(node(graph, "violations").data).toEqual({
      title: "Violations:",
      tone: "red",
      items: ["429 Findings", "19 Issues", "08 Threats"],
    });
  });

  it("is pure: same input gives equal output and the input is untouched", () => {
    const snapshot = structuredClone(defense);
    expect(toGuardrailGraph(defense)).toEqual(toGuardrailGraph(defense));
    expect(defense).toEqual(snapshot);
  });
});

describe("toGuardrailGraph — data variations", () => {
  it("adds an allow effect for allowed actions, bundled separately", () => {
    const graph = toGuardrailGraph(
      withDefense({
        actions: [
          { kind: "delete", effect: "deny" },
          { kind: "view", effect: "allow" },
        ],
      }),
    );
    expect(node(graph, "effect-allow").data).toMatchObject({ label: "Allow", tone: "lime" });
    expect(node(graph, "effect-allow").layout).toEqual({ rank: RANK.effects, order: 1 });
    expect(graph.edges.find((e) => e.source === "action-view")).toMatchObject({
      target: "effect-allow",
      bundle: BUNDLE.allowIn,
      type: "lime",
    });
  });

  it("omits the deny effect when nothing is denied", () => {
    const graph = toGuardrailGraph(withDefense({ actions: [{ kind: "view", effect: "allow" }] }));
    expect(ids(graph)).not.toContain("effect-deny");
  });

  it("drops zero-count resource chips and moves the caption to the remaining chip", () => {
    const graph = toGuardrailGraph(
      withDefense({ affectedResources: { identities: 0, buckets: 3 } }),
    );
    expect(ids(graph)).not.toContain("resource-identities");
    expect(node(graph, "resource-buckets").layout?.order).toBe(0);
    expect(node(graph, "caption").layout?.attach?.to).toBe("resource-buckets");
  });

  it("drops the caption when there are no affected resources", () => {
    const graph = toGuardrailGraph(
      withDefense({ affectedResources: { identities: 0, buckets: 0 } }),
    );
    expect(ids(graph)).not.toContain("caption");
    expect(graph.edges.some((e) => e.bundle === BUNDLE.permissionsIn)).toBe(false);
  });

  it("drops exclusions and their port when nothing is excluded", () => {
    const graph = toGuardrailGraph(withDefense({ exclusions: { identities: 0, buckets: 0 } }));
    expect(ids(graph).filter((id) => id.startsWith("exclusion"))).toEqual([]);
    expect(node(graph, "target").ports?.map((p) => p.id)).not.toContain(TARGET_PORTS.exclusions);
  });

  it("centres a single exclusion chip", () => {
    const graph = toGuardrailGraph(withDefense({ exclusions: { identities: 0, buckets: 4 } }));
    expect(node(graph, "exclusion-buckets").layout?.attach?.align).toBe("center");
    expect(ids(graph)).not.toContain("exclusion-identities");
  });

  it("drops violations and their port when there are none", () => {
    const graph = toGuardrailGraph(
      withDefense({ violations: { findings: 0, issues: 0, threats: 0 } }),
    );
    expect(ids(graph)).not.toContain("violations");
    expect(node(graph, "target").ports?.map((p) => p.id)).toEqual([
      TARGET_PORTS.in,
      TARGET_PORTS.exclusions,
    ]);
  });

  it("does not filter by layers (layers are UI-only for now)", () => {
    const filtered = toGuardrailGraph(withDefense({ layers: ["permissions"] }));
    expect(filtered.nodes).toHaveLength(toGuardrailGraph(defense).nodes.length);
  });

  it("maps every fixture guardrail to a connected graph", () => {
    for (const guardrail of guardrailsFixture) {
      const graph = toGuardrailGraph(defenseFixture(guardrail));
      const known = new Set(ids(graph));
      expect(
        graph.edges.every((e) => known.has(e.source) && known.has(e.target)),
        guardrail.id,
      ).toBe(true);
    }
  });
});
