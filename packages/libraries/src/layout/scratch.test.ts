import { test } from "vitest";
import { layeredLayout } from "./layout.js";
import { routeEdges } from "../routing/routing.js";
import { guardrailLikeFixture as f, guardrailLikeSizes as s } from "../dependency-graph/dependency-graph.fixtures.js";
test("print", () => {
  const r = layeredLayout()({ nodes: f.nodes.map((node) => ({ node, size: s[node.id] ?? { width: 0, height: 0 } })), edges: f.edges });
  for (const n of f.nodes) console.log(n.id, JSON.stringify(r.positions[n.id]), JSON.stringify(r.sizes[n.id]));
  console.log("bounds", JSON.stringify(r.bounds));
  for (const e of routeEdges({ nodes: f.nodes, edges: f.edges, layout: r })) console.log(e.edge.id, JSON.stringify(e.points));
});
