import { Tag, type DataTableColumn, type Tone } from "@blast/components";
import type {
  ActivityOutcome,
  RowTab,
  TabRowMap,
  TaskStatus,
} from "../../../domain/guardrail.types.js";
import { SEVERITY_TONE } from "../severity.js";

const OUTCOME_TONE: Record<ActivityOutcome, Tone> = {
  passed: "lime",
  blocked: "red",
  excluded: "indigo",
};
const STATUS_TONE: Record<TaskStatus, Tone> = {
  open: "neutral",
  "in-progress": "sky",
  done: "lime",
};

const capitalise = (value: string) =>
  value.charAt(0).toUpperCase() + value.slice(1).replace("-", " ");

export const ROW_TAB_COLUMNS: { [K in RowTab]: DataTableColumn<TabRowMap[K]>[] } = {
  "previous-activities": [
    { key: "date", header: "Date", width: 120 },
    { key: "actor", header: "Actor" },
    { key: "action", header: "Action", render: (row) => capitalise(row.action) },
    { key: "resource", header: "Resource" },
    {
      key: "outcome",
      header: "Outcome",
      render: (row) => <Tag tone={OUTCOME_TONE[row.outcome]}>{capitalise(row.outcome)}</Tag>,
    },
  ],
  "affected-resources": [
    { key: "name", header: "Resource" },
    { key: "kind", header: "Type", render: (row) => capitalise(row.kind) },
    { key: "account", header: "Account" },
    { key: "region", header: "Region", width: 120 },
  ],
  violations: [
    { key: "title", header: "Violation" },
    {
      key: "severity",
      header: "Severity",
      render: (row) => <Tag tone={SEVERITY_TONE[row.severity]}>{row.severity.toUpperCase()}</Tag>,
    },
    { key: "resource", header: "Resource" },
    { key: "detectedAt", header: "Detected", width: 120 },
  ],
  exclusions: [
    { key: "name", header: "Resource" },
    { key: "kind", header: "Type", render: (row) => capitalise(row.kind) },
    { key: "reason", header: "Reason" },
    { key: "addedBy", header: "Added by" },
  ],
  tasks: [
    { key: "title", header: "Task" },
    { key: "assignee", header: "Assignee" },
    {
      key: "status",
      header: "Status",
      render: (row) => <Tag tone={STATUS_TONE[row.status]}>{capitalise(row.status)}</Tag>,
    },
    { key: "dueDate", header: "Due", width: 120 },
  ],
};

export const ROW_TAB_TITLES: Record<RowTab, { table: string; empty: string }> = {
  "previous-activities": { table: "Previous activities", empty: "No previous activities" },
  "affected-resources": { table: "Affected resources", empty: "No affected resources" },
  violations: { table: "Violations", empty: "No violations" },
  exclusions: { table: "Exclusions", empty: "No exclusions" },
  tasks: { table: "Tasks", empty: "No tasks" },
};
