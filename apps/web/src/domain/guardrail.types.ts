/** Domain model for guardrails. No UI concepts (tones, icons) live here. */

export type GuardrailKind = "preventive";
export type Severity = "low" | "medium" | "high" | "critical";

export const GUARDRAIL_TABS = [
  "overview",
  "previous-activities",
  "affected-resources",
  "violations",
  "exclusions",
  "tasks",
  "enforcement-analysis",
] as const;
export type GuardrailTab = (typeof GUARDRAIL_TABS)[number];

/** Tabs that list rows and show a count in the tab label. */
export type RowTab = Exclude<GuardrailTab, "overview" | "enforcement-analysis">;
export type GuardrailCounts = Record<RowTab, number>;

export type RiskKind = "defense-evasion" | "data-exposure" | "privilege-escalation";
export interface Risk {
  id: RiskKind;
  label: string;
}

export type ComplianceFramework = "blast" | "cis" | "nist" | "iso";
export interface SecurityRequirement {
  id: ComplianceFramework;
  label: string;
}

export interface ExternalRef {
  id: string;
  url: string;
}

export interface MitreTechnique extends ExternalRef {
  name: string;
}

export interface CloudService {
  id: string;
  name: string;
}

export type DeploymentStatus = "deployed" | "draft";

export interface Guardrail {
  id: string;
  name: string;
  kind: GuardrailKind;
  /** e.g. "Defense Hardening". */
  type: string;
  cloudService: CloudService;
  risks: Risk[];
  severity: Severity;
  securityRequirements: SecurityRequirement[];
  mitre: MitreTechnique;
  containingPolicy: ExternalRef;
  counts: GuardrailCounts;
  status: DeploymentStatus;
}

export type ActionKind = "delete" | "create" | "edit" | "discover" | "view";
export type ActionEffect = "deny" | "allow";
export interface GuardrailAction {
  kind: ActionKind;
  effect: ActionEffect;
}

export interface ResourceCounts {
  identities: number;
  buckets: number;
}

export interface ViolationCounts {
  findings: number;
  issues: number;
  threats: number;
}

export type DefenseLayer = "all" | "permissions" | "exclusions" | "violations";

export interface GuardrailDefense {
  guardrailId: string;
  affectedResources: ResourceCounts;
  actions: GuardrailAction[];
  policy: { kind: "scp"; label: string };
  target: { service: string; locked: boolean };
  exclusions: ResourceCounts;
  violations: ViolationCounts;
  /** Layers this defense can be filtered by (filtering itself is not implemented yet). */
  layers: DefenseLayer[];
}

export interface DefenseFilters {
  cloudUnit: string | null;
}

export interface CloudUnit {
  id: string;
  name: string;
}

export type ActivityRange = "7d" | "30d" | "90d";
export interface ActivityPoint {
  /** ISO date, YYYY-MM-DD. */
  date: string;
  /** Percentages 0..100. */
  passed: number;
  blocked: number;
  excluded: number;
}

export type ActivityOutcome = "passed" | "blocked" | "excluded";
export interface PreviousActivityRow {
  id: string;
  date: string;
  actor: string;
  action: ActionKind;
  resource: string;
  outcome: ActivityOutcome;
}

export type ResourceKind = "identity" | "bucket";
export interface AffectedResourceRow {
  id: string;
  name: string;
  kind: ResourceKind;
  account: string;
  region: string;
}

export interface ViolationRow {
  id: string;
  title: string;
  severity: Severity;
  resource: string;
  detectedAt: string;
}

export interface ExclusionRow {
  id: string;
  name: string;
  kind: ResourceKind;
  reason: string;
  addedBy: string;
}

export type TaskStatus = "open" | "in-progress" | "done";
export interface TaskRow {
  id: string;
  title: string;
  assignee: string;
  status: TaskStatus;
  dueDate: string;
}

export interface TabRowMap {
  "previous-activities": PreviousActivityRow;
  "affected-resources": AffectedResourceRow;
  violations: ViolationRow;
  exclusions: ExclusionRow;
  tasks: TaskRow;
}

export interface DeployResult {
  guardrailId: string;
  deployedAt: string;
}
