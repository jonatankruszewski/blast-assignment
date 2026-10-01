import { Stack } from "@blast/components";
import { ActivitiesSection } from "./activities-section.js";
import { DefenseVisualization } from "./defense-visualization.js";

export function OverviewTab({ guardrailId }: { guardrailId: string }) {
  return (
    <Stack direction="column" gap={6}>
      <DefenseVisualization guardrailId={guardrailId} />
      <ActivitiesSection guardrailId={guardrailId} />
    </Stack>
  );
}
