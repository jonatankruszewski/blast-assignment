import { EmptyState } from "@blast/components";
import type { Guardrail, GuardrailTab } from "../../domain/guardrail.types.js";
import { RowTabPanel } from "./row-tabs/row-tab-panel.js";
import { OverviewTab } from "./overview/overview-tab.js";

interface TabContentProps {
  guardrail: Guardrail;
  tab: GuardrailTab;
}

export function TabContent({ guardrail, tab }: TabContentProps) {
  switch (tab) {
    case "overview":
      return <OverviewTab guardrailId={guardrail.id} />;
    case "enforcement-analysis":
      return (
        <EmptyState
          title="Enforcement analysis is not available yet"
          description="Run an analysis to see how this guardrail would affect your environment."
        />
      );
    default:
      return <RowTabPanel key={tab} guardrailId={guardrail.id} tab={tab} />;
  }
}
