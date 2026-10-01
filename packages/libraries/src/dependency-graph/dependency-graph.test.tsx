import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DependencyGraph } from "./dependency-graph.js";
import { pipelineFixture, type FixtureData } from "./dependency-graph.fixtures.js";
import type {
  DependencyGraphProps,
  GraphEdge,
  GraphNode,
  NodeRenderProps,
} from "./dependency-graph.types.js";

type Node = GraphNode<FixtureData>;

function Box({ node, selected }: NodeRenderProps<Node>) {
  return <span data-selected={selected}>{node.data.label}</span>;
}
const renderers = { box: Box };

const renderPipeline = (props: Partial<DependencyGraphProps<Node>> = {}) =>
  render(
    <DependencyGraph<Node, GraphEdge>
      ariaLabel="Pipeline"
      nodes={pipelineFixture.nodes}
      edges={pipelineFixture.edges}
      nodeRenderers={renderers}
      style={{ width: 800, height: 400 }}
      {...props}
    />,
  );

/** The element a keyboard user lands on for a node: its nearest focusable ancestor. */
const focusTarget = (label: string) =>
  visibleNode(label)?.closest<HTMLElement>("[tabindex]") ?? visibleNode(label);

const visibleNode = (label: string) =>
  screen
    .getAllByText(label)
    .map((el) => el.closest<HTMLElement>("[data-node-id]"))
    .find((el): el is HTMLElement => el !== null);

describe("DependencyGraph", () => {
  it("exposes a labelled group", () => {
    renderPipeline();
    expect(screen.getByRole("group", { name: "Pipeline" })).toBeInTheDocument();
  });

  it("renders every node through its renderer once laid out", async () => {
    renderPipeline();
    await waitFor(() => {
      for (const n of pipelineFixture.nodes) expect(visibleNode(n.data.label)).toBeDefined();
    });
  });

  it("draws one path per edge", async () => {
    const { container } = renderPipeline();
    await waitFor(() => {
      expect(container.querySelectorAll("svg path[d^='M']").length).toBeGreaterThanOrEqual(
        pipelineFixture.edges.length,
      );
    });
  });

  it("applies getEdgeProps to the default edge path", async () => {
    const { container } = renderPipeline({
      getEdgeProps: (e) => ({ className: `edge-${e.id}` }),
    });
    await waitFor(() => {
      expect(container.querySelector("path.edge-a")).not.toBeNull();
    });
  });

  it("delegates to a custom edge renderer", async () => {
    renderPipeline({
      edgeRenderer: ({ edge, path }) => <path data-testid={`custom-${edge.id}`} d={path} />,
    });
    await waitFor(() => {
      expect(screen.getByTestId("custom-e")).toHaveAttribute(
        "d",
        expect.stringMatching(/^M/) as string,
      );
    });
  });

  it("renders decorations for nodes", async () => {
    renderPipeline({
      renderDecorations: (node) =>
        node.id === "deploy" ? [{ id: "lock", anchor: "top", content: <span>locked</span> }] : [],
    });
    expect(await screen.findByText("locked")).toBeInTheDocument();
  });

  it("activates and selects a node on Enter", async () => {
    const onSelect = vi.fn();
    const onNodeActivate = vi.fn();
    renderPipeline({ onSelect, onNodeActivate });
    await waitFor(() => expect(visibleNode("Build")).toBeDefined());
    focusTarget("Build")?.focus();
    await userEvent.keyboard("{Enter}");
    expect(onSelect).toHaveBeenCalledWith("build");
    expect(onNodeActivate).toHaveBeenCalledWith(expect.objectContaining({ id: "build" }));
  });

  it("does not activate inert nodes", async () => {
    const onNodeActivate = vi.fn();
    renderPipeline({ onNodeActivate });
    await waitFor(() => expect(visibleNode("manual approval")).toBeDefined());
    focusTarget("manual approval")?.focus();
    await userEvent.keyboard("{Enter}");
    expect(onNodeActivate).not.toHaveBeenCalled();
  });

  it("passes the controlled selection to renderers", async () => {
    renderPipeline({ selectedId: "test" });
    await waitFor(() => {
      expect(
        screen.getAllByText("Test").some((el) => el.getAttribute("data-selected") === "true"),
      ).toBe(true);
    });
  });

  it("shows the empty state without nodes", () => {
    render(
      <DependencyGraph
        ariaLabel="Empty"
        nodes={[]}
        edges={[]}
        nodeRenderers={renderers}
        emptyState={<p>Nothing to show</p>}
      />,
    );
    expect(screen.getByRole("group", { name: "Empty" })).toHaveTextContent("Nothing to show");
  });
});
