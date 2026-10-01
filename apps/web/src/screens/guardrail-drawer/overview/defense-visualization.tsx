import { Cloud, DotGrid, EmptyState, ErrorState, Layers, MenuSelect, Section, Skeleton } from "@blast/components";
import { DependencyGraph } from "@blast/libraries";
import type { DefenseLayer } from "../../../domain/guardrail.types.js";
import { useCloudUnits } from "../../../hooks/use-cloud-units.js";
import { useDrawerRoute } from "../../../hooks/use-drawer-route.js";
import { useGuardrailDefense } from "../../../hooks/use-guardrail-defense.js";
import { guardrailDecorations } from "../../../graph/guardrail-decorations.js";
import { guardrailEdgeProps } from "../../../graph/guardrail-edge-props.js";
import type { GuardrailGraphEdge, GuardrailGraphNode } from "../../../graph/guardrail-graph.types.js";
import { guardrailNodeRenderers } from "../../../graph/guardrail-node-renderers.js";
import { toGuardrailGraph } from "../../../graph/to-guardrail-graph.js";

const LAYER_OPTIONS: { value: DefenseLayer; label: string }[] = [
  { value: "all", label: "All" },
  { value: "permissions", label: "Permissions" },
  { value: "exclusions", label: "Exclusions" },
  { value: "violations", label: "Violations" },
];

interface DefenseVisualizationProps {
  guardrailId: string;
  /** Seam for later: node click / Enter. Not wired to any behaviour yet. */
  onNodeActivate?: (node: GuardrailGraphNode) => void;
}

export function DefenseVisualization({ guardrailId, onNodeActivate }: DefenseVisualizationProps) {
  const { route, setLayers, setCloudUnit } = useDrawerRoute();
  const cloudUnits = useCloudUnits();
  const defense = useGuardrailDefense(guardrailId, { cloudUnit: route.cloudUnit });

  const actions = (
    <>
      <MenuSelect
        ariaLabel="Layers"
        label="Layers"
        icon={<Layers />}
        value={route.layers}
        options={LAYER_OPTIONS}
        menuAlign="end"
        onChange={(value) => {
          const layer = LAYER_OPTIONS.find((o) => o.value === value);
          if (layer) setLayers(layer.value);
        }}
      />
      <MenuSelect
        ariaLabel="Cloud unit"
        placeholder="Select Cloud Unit"
        icon={<Cloud />}
        value={route.cloudUnit ?? undefined}
        options={(cloudUnits.data ?? []).map((u) => ({ value: u.id, label: u.name }))}
        menuAlign="end"
        disabled={!cloudUnits.isSuccess}
        onChange={setCloudUnit}
      />
    </>
  );

  return (
    <Section title="Defense Visualization" actions={actions} grow>
      {defense.isPending ? (
        <Skeleton height={380} radius="md" />
      ) : defense.isError ? (
        <ErrorState
          title="Could not load the defense visualization"
          description={defense.error.message}
          onRetry={() => {
            void defense.refetch();
          }}
        />
      ) : (
        <DependencyGraph<GuardrailGraphNode, GuardrailGraphEdge>
          ariaLabel="Defense visualization"
          {...toGuardrailGraph(defense.data)}
          nodeRenderers={guardrailNodeRenderers}
          getEdgeProps={guardrailEdgeProps}
          renderDecorations={guardrailDecorations}
          background={<DotGrid />}
          viewport={{ fit: true, padding: 24 }}
          emptyState={<EmptyState title="Nothing to visualize for this cloud unit" />}
          {...(onNodeActivate ? { onNodeActivate } : {})}
        />
      )}
    </Section>
  );
}
