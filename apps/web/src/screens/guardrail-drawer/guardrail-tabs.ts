import { GUARDRAIL_TABS, type Guardrail, type GuardrailTab } from "../../domain/guardrail.types.js";

const TAB_LABELS: Record<GuardrailTab, string> = {
  overview: "Overview",
  "previous-activities": "Previous Activities",
  "affected-resources": "Affected Resources",
  violations: "Violations",
  exclusions: "Exclusions",
  tasks: "Tasks",
  "enforcement-analysis": "Enforcement Analysis",
};

export function guardrailTabItems(guardrail: Guardrail) {
  return GUARDRAIL_TABS.map((id) => {
    const count =
      id === "overview" || id === "enforcement-analysis" ? undefined : guardrail.counts[id];
    return count === undefined
      ? { id, label: TAB_LABELS[id] }
      : { id, label: TAB_LABELS[id], count };
  });
}

export function toGuardrailTab(id: string): GuardrailTab | undefined {
  return GUARDRAIL_TABS.find((tab) => tab === id);
}
