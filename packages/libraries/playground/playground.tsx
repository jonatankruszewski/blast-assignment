/**
 * Dev-only playground (subpath export `@blast/libraries/playground`, not part of the public API).
 * Mounted by the app at http://localhost:5173/?view=graph-playground.
 * Plain bordered boxes only: the library itself ships no visuals.
 */
import type { CSSProperties } from "react";
import { useState } from "react";
import { DependencyGraph } from "../src/dependency-graph/dependency-graph.js";
import {
  guardrailLikeFixture,
  pipelineFixture,
  type FixtureData,
} from "../src/dependency-graph/dependency-graph.fixtures.js";
import type {
  Decoration,
  GraphNode,
  NodeRenderProps,
} from "../src/dependency-graph/dependency-graph.types.js";

type PlaygroundNode = GraphNode<FixtureData>;

const boxStyle = (selected: boolean, focused: boolean): CSSProperties => ({
  border: `1px solid ${selected ? "#2563eb" : "#888"}`,
  outline: focused ? "2px solid #2563eb" : "none",
  outlineOffset: 2,
  borderRadius: 6,
  padding: "4px 10px",
  background: "#fff",
  font: "13px system-ui, sans-serif",
  whiteSpace: "nowrap",
});

function Box({ node, selected, focused }: NodeRenderProps<PlaygroundNode>) {
  return <div style={boxStyle(selected, focused)}>{node.data.label}</div>;
}

function Caption({ node }: NodeRenderProps<PlaygroundNode>) {
  return (
    <div style={{ font: "11px system-ui, sans-serif", textAlign: "center", width: 72 }}>
      {node.data.label}
    </div>
  );
}

function Group({ selected, focused }: NodeRenderProps<PlaygroundNode>) {
  return (
    <div
      style={{
        ...boxStyle(selected, focused),
        padding: 0,
        width: "100%",
        height: "100%",
        boxSizing: "border-box",
        background: "transparent",
      }}
    />
  );
}

function Callout({ node, selected, focused }: NodeRenderProps<PlaygroundNode>) {
  return (
    <div style={{ ...boxStyle(selected, focused), lineHeight: 1.5 }}>
      <strong>{node.data.label}:</strong>
      <div>429 Findings</div>
      <div>19 Issues</div>
      <div>08 Threats</div>
    </div>
  );
}

const renderers = {
  box: Box,
  chip: Box,
  pill: Box,
  caption: Caption,
  group: Group,
  callout: Callout,
};

const decorations = (node: PlaygroundNode): readonly Decoration[] =>
  node.type === "group"
    ? [
        { id: "lock", anchor: "top", content: <span style={badge}>lock</span> },
        {
          id: "port",
          anchor: "bottom-right",
          port: "violations",
          content: (
            <span style={{ ...badge, borderRadius: "50%", width: 8, height: 8, padding: 0 }} />
          ),
        },
      ]
    : [];

const badge: CSSProperties = {
  display: "inline-block",
  border: "1px solid #888",
  background: "#fff",
  borderRadius: 4,
  padding: "0 4px",
  font: "10px system-ui, sans-serif",
};

const frame: CSSProperties = {
  border: "1px dashed #bbb",
  height: 380,
  color: "#666",
};

export function Playground() {
  const [selected, setSelected] = useState<string | null>(null);
  const [activated, setActivated] = useState<string>("—");
  return (
    <main style={{ padding: 24, font: "14px system-ui, sans-serif", display: "grid", gap: 24 }}>
      <h1 style={{ fontSize: 18, margin: 0 }}>@blast/libraries · DependencyGraph playground</h1>
      <p style={{ margin: 0 }}>
        Selected: <code>{selected ?? "none"}</code> · Last activated: <code>{activated}</code>
      </p>

      <section aria-labelledby="pg-guardrail">
        <h2 id="pg-guardrail" style={{ fontSize: 15 }}>
          Guardrail-like topology (fixture)
        </h2>
        <DependencyGraph
          ariaLabel="Guardrail-like fixture"
          nodes={guardrailLikeFixture.nodes}
          edges={guardrailLikeFixture.edges}
          nodeRenderers={renderers}
          renderDecorations={decorations}
          getNodeLabel={(node) => node.data.label}
          selectedId={selected}
          onSelect={setSelected}
          onNodeActivate={(node) => {
            setActivated(node.id);
          }}
          style={frame}
        />
      </section>

      <section aria-labelledby="pg-pipeline">
        <h2 id="pg-pipeline" style={{ fontSize: 15 }}>
          Generic example (pipeline, pan + zoom enabled)
        </h2>
        <DependencyGraph
          ariaLabel="Pipeline example"
          nodes={pipelineFixture.nodes}
          edges={pipelineFixture.edges}
          nodeRenderers={renderers}
          viewport={{ fit: true, pan: true, zoom: true }}
          onSelect={setSelected}
          selectedId={selected}
          style={{ ...frame, height: 240 }}
        />
      </section>

      <section aria-labelledby="pg-empty">
        <h2 id="pg-empty" style={{ fontSize: 15 }}>
          Empty state
        </h2>
        <DependencyGraph
          ariaLabel="Empty example"
          nodes={[]}
          edges={[]}
          nodeRenderers={renderers}
          emptyState={<p>No dependencies to show.</p>}
        />
      </section>
    </main>
  );
}
