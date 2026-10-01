import type {
  ActivityPoint,
  CloudUnit,
  Guardrail,
  GuardrailDefense,
  TabRowMap,
} from "../domain/guardrail.types.js";

/** The guardrail shown in the reference screenshot. */
export const SCREENSHOT_GUARDRAIL_ID = "gr-access-analyzer";

const blastStandards: Guardrail["securityRequirements"] = [
  { id: "blast", label: "Blast baseline" },
  { id: "cis", label: "CIS AWS Foundations" },
  { id: "nist", label: "NIST 800-53" },
  { id: "iso", label: "ISO 27001" },
];

export const guardrailsFixture: Guardrail[] = [
  {
    id: SCREENSHOT_GUARDRAIL_ID,
    name: "Prevent modification of Access Analyzer Settings",
    kind: "preventive",
    type: "Defense Hardening",
    cloudService: { id: "aws-access-analyzer", name: "AWS Access Analyzer" },
    risks: [
      { id: "defense-evasion", label: "Defense evasion" },
      { id: "data-exposure", label: "Data exposure" },
    ],
    severity: "low",
    securityRequirements: blastStandards,
    mitre: {
      id: "T1562",
      name: "Impair Defenses",
      url: "https://attack.mitre.org/techniques/T1562/",
    },
    containingPolicy: { id: "0590aeb", url: "https://console.aws.amazon.com/organizations/v2/home/policies" },
    counts: {
      "previous-activities": 15,
      "affected-resources": 34,
      violations: 4,
      exclusions: 2,
      tasks: 2,
    },
    status: "draft",
  },
  {
    id: "gr-cloudtrail-stop",
    name: "Prevent stopping CloudTrail logging",
    kind: "preventive",
    type: "Logging Integrity",
    cloudService: { id: "aws-cloudtrail", name: "AWS CloudTrail" },
    risks: [{ id: "defense-evasion", label: "Defense evasion" }],
    severity: "high",
    securityRequirements: blastStandards.slice(0, 3),
    mitre: {
      id: "T1562.008",
      name: "Disable Cloud Logs",
      url: "https://attack.mitre.org/techniques/T1562/008/",
    },
    containingPolicy: { id: "7c21f04", url: "https://console.aws.amazon.com/organizations/v2/home/policies" },
    counts: {
      "previous-activities": 8,
      "affected-resources": 12,
      violations: 1,
      exclusions: 0,
      tasks: 1,
    },
    status: "deployed",
  },
  {
    id: "gr-s3-public",
    name: "Block public access changes on S3 buckets",
    kind: "preventive",
    type: "Data Protection",
    cloudService: { id: "aws-s3", name: "Amazon S3" },
    risks: [{ id: "data-exposure", label: "Data exposure" }],
    severity: "critical",
    securityRequirements: blastStandards,
    mitre: {
      id: "T1530",
      name: "Data from Cloud Storage",
      url: "https://attack.mitre.org/techniques/T1530/",
    },
    containingPolicy: { id: "a91be33", url: "https://console.aws.amazon.com/organizations/v2/home/policies" },
    counts: {
      "previous-activities": 22,
      "affected-resources": 57,
      violations: 9,
      exclusions: 3,
      tasks: 4,
    },
    status: "deployed",
  },
  {
    id: "gr-guardduty-disable",
    name: "Prevent disabling GuardDuty detectors",
    kind: "preventive",
    type: "Defense Hardening",
    cloudService: { id: "aws-guardduty", name: "Amazon GuardDuty" },
    risks: [{ id: "defense-evasion", label: "Defense evasion" }],
    severity: "medium",
    securityRequirements: blastStandards.slice(1),
    mitre: {
      id: "T1562.001",
      name: "Disable or Modify Tools",
      url: "https://attack.mitre.org/techniques/T1562/001/",
    },
    containingPolicy: { id: "3fd0c7e", url: "https://console.aws.amazon.com/organizations/v2/home/policies" },
    counts: {
      "previous-activities": 5,
      "affected-resources": 9,
      violations: 0,
      exclusions: 1,
      tasks: 0,
    },
    status: "draft",
  },
  {
    id: "gr-iam-root-keys",
    name: "Deny creation of root access keys",
    kind: "preventive",
    type: "Identity Hardening",
    cloudService: { id: "aws-iam", name: "AWS IAM" },
    risks: [{ id: "privilege-escalation", label: "Privilege escalation" }],
    severity: "critical",
    securityRequirements: blastStandards,
    mitre: {
      id: "T1098",
      name: "Account Manipulation",
      url: "https://attack.mitre.org/techniques/T1098/",
    },
    containingPolicy: { id: "be4410a", url: "https://console.aws.amazon.com/organizations/v2/home/policies" },
    counts: {
      "previous-activities": 3,
      "affected-resources": 1,
      violations: 0,
      exclusions: 0,
      tasks: 1,
    },
    status: "deployed",
  },
  {
    id: "gr-kms-delete",
    name: "Prevent scheduling deletion of KMS keys",
    kind: "preventive",
    type: "Data Protection",
    cloudService: { id: "aws-kms", name: "AWS KMS" },
    risks: [{ id: "data-exposure", label: "Data exposure" }],
    severity: "high",
    securityRequirements: blastStandards.slice(0, 2),
    mitre: {
      id: "T1485",
      name: "Data Destruction",
      url: "https://attack.mitre.org/techniques/T1485/",
    },
    containingPolicy: { id: "d02c9b1", url: "https://console.aws.amazon.com/organizations/v2/home/policies" },
    counts: {
      "previous-activities": 11,
      "affected-resources": 18,
      violations: 2,
      exclusions: 1,
      tasks: 2,
    },
    status: "draft",
  },
  {
    id: "gr-config-recorder",
    name: "Prevent stopping AWS Config recorders",
    kind: "preventive",
    type: "Logging Integrity",
    cloudService: { id: "aws-config", name: "AWS Config" },
    risks: [{ id: "defense-evasion", label: "Defense evasion" }],
    severity: "medium",
    securityRequirements: blastStandards.slice(2),
    mitre: {
      id: "T1562.008",
      name: "Disable Cloud Logs",
      url: "https://attack.mitre.org/techniques/T1562/008/",
    },
    containingPolicy: { id: "51e8f2a", url: "https://console.aws.amazon.com/organizations/v2/home/policies" },
    counts: {
      "previous-activities": 0,
      "affected-resources": 6,
      violations: 0,
      exclusions: 0,
      tasks: 0,
    },
    status: "draft",
  },
];

export const cloudUnitsFixture: CloudUnit[] = [
  { id: "org-root", name: "Organization root" },
  { id: "ou-production", name: "Production OU" },
  { id: "ou-development", name: "Development OU" },
  { id: "ou-sandbox", name: "Sandbox OU" },
];

const screenshotDefense: GuardrailDefense = {
  guardrailId: SCREENSHOT_GUARDRAIL_ID,
  affectedResources: { identities: 15, buckets: 2 },
  actions: [
    { kind: "delete", effect: "deny" },
    { kind: "create", effect: "deny" },
    { kind: "edit", effect: "deny" },
    { kind: "discover", effect: "deny" },
    { kind: "view", effect: "deny" },
  ],
  policy: { kind: "scp", label: "Service control policy" },
  target: { service: "Access Analyzer", locked: true },
  exclusions: { identities: 2, buckets: 1 },
  violations: { findings: 429, issues: 19, threats: 8 },
  layers: ["all", "permissions", "exclusions", "violations"],
};

/** Defense for any guardrail; non-screenshot guardrails get a scaled-down variant. */
export function defenseFixture(guardrail: Guardrail): GuardrailDefense {
  if (guardrail.id === SCREENSHOT_GUARDRAIL_ID) return screenshotDefense;
  const { counts } = guardrail;
  return {
    ...screenshotDefense,
    guardrailId: guardrail.id,
    affectedResources: {
      identities: Math.ceil(counts["affected-resources"] * 0.7),
      buckets: Math.floor(counts["affected-resources"] * 0.3),
    },
    actions: screenshotDefense.actions.map((action) =>
      action.kind === "view" ? { ...action, effect: "allow" } : action,
    ),
    target: { service: guardrail.cloudService.name.replace(/^(AWS|Amazon) /, ""), locked: true },
    exclusions: { identities: counts.exclusions, buckets: 0 },
    violations: {
      findings: counts.violations * 31,
      issues: counts.violations * 3,
      threats: counts.violations,
    },
  };
}

/** Scales resource counts for a cloud unit (organization root = everything). */
export function scaleDefenseForCloudUnit(
  defense: GuardrailDefense,
  cloudUnit: string | null,
): GuardrailDefense {
  const factor = cloudUnitFactor(cloudUnit);
  if (factor === 1) return defense;
  const scale = (n: number) => Math.round(n * factor);
  return {
    ...defense,
    affectedResources: {
      identities: scale(defense.affectedResources.identities),
      buckets: scale(defense.affectedResources.buckets),
    },
    exclusions: {
      identities: scale(defense.exclusions.identities),
      buckets: scale(defense.exclusions.buckets),
    },
    violations: {
      findings: scale(defense.violations.findings),
      issues: scale(defense.violations.issues),
      threats: scale(defense.violations.threats),
    },
  };
}

function cloudUnitFactor(cloudUnit: string | null): number {
  switch (cloudUnit) {
    case "ou-production":
      return 0.6;
    case "ou-development":
      return 0.3;
    case "ou-sandbox":
      return 0;
    default:
      return 1;
  }
}

// ---- Activities ----------------------------------------------------------------------------

/** Last day of the activity series (matches the screenshot's Sep 15 → Oct 14 window). */
export const ACTIVITY_END_DATE = "2026-10-14";
const SERIES_DAYS = 90;

/** [dayOffsetFromSep15, passed, blocked, excluded] traced from the screenshot. */
const SCREENSHOT_ANCHORS: readonly (readonly [number, number, number, number])[] = [
  [0, 10, 40, 87],
  [4, 90, 73, 60],
  [8, 65, 85, 18],
  [12, 42, 12, 26],
  [16, 65, 55, 36],
  [20, 55, 85, 71],
  [24, 31, 22, 48],
  [28, 8, 0, 25],
  [29, 50, 14, 70],
];

function interpolate(offset: number, column: 1 | 2 | 3): number {
  for (let i = 1; i < SCREENSHOT_ANCHORS.length; i++) {
    const prev = SCREENSHOT_ANCHORS[i - 1];
    const next = SCREENSHOT_ANCHORS[i];
    if (!prev || !next) continue;
    if (offset <= next[0]) {
      const t = (offset - prev[0]) / (next[0] - prev[0]);
      return Math.round(prev[column] + (next[column] - prev[column]) * t);
    }
  }
  return 0;
}

function isoDay(end: string, daysBefore: number): string {
  const date = new Date(`${end}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() - daysBefore);
  return date.toISOString().slice(0, 10);
}

/** Deterministic wave for days before the screenshot window. */
function wave(day: number, phase: number): number {
  return Math.round(50 + 35 * Math.sin((day + phase) / 4) * Math.cos((day + phase) / 11));
}

function buildActivitySeries(seed: number): ActivityPoint[] {
  const points: ActivityPoint[] = [];
  for (let daysBefore = SERIES_DAYS - 1; daysBefore >= 0; daysBefore--) {
    const offset = 29 - daysBefore; // 0 = Sep 15
    const date = isoDay(ACTIVITY_END_DATE, daysBefore);
    if (seed === 0 && offset >= 0) {
      points.push({
        date,
        passed: interpolate(offset, 1),
        blocked: interpolate(offset, 2),
        excluded: interpolate(offset, 3),
      });
    } else {
      points.push({
        date,
        passed: wave(offset, seed),
        blocked: wave(offset, seed + 7),
        excluded: wave(offset, seed + 13),
      });
    }
  }
  return points;
}

export function activitiesFixture(guardrail: Guardrail): ActivityPoint[] {
  if (guardrail.counts["previous-activities"] === 0) return [];
  const index = guardrailsFixture.findIndex((g) => g.id === guardrail.id);
  return buildActivitySeries(Math.max(0, index) * 5);
}

// ---- Tab rows ------------------------------------------------------------------------------

const ACTORS = ["alice@acme.io", "ci-deployer", "bob@acme.io", "terraform-runner", "carol@acme.io"];
const REGIONS = ["us-east-1", "eu-west-1", "us-west-2"];
const ACCOUNTS = ["prod-core (4821)", "prod-data (7730)", "staging (1194)"];
const ACTION_CYCLE = ["edit", "delete", "create", "discover", "view"] as const;
const OUTCOME_CYCLE = ["blocked", "passed", "blocked", "excluded"] as const;
const SEVERITY_CYCLE = ["high", "medium", "low", "critical"] as const;
const TASK_STATUS_CYCLE = ["open", "in-progress", "done"] as const;

function pick<T>(list: readonly T[], i: number): T {
  const value = list[i % list.length];
  if (value === undefined) throw new Error("pick() on empty list");
  return value;
}

function range(n: number): number[] {
  return Array.from({ length: n }, (_, i) => i);
}

export function tabRowsFixture<K extends keyof TabRowMap>(
  guardrail: Guardrail,
  tab: K,
): TabRowMap[K][] {
  const count = guardrail.counts[tab];
  const rows: { [P in keyof TabRowMap]: () => TabRowMap[P][] } = {
    "previous-activities": () =>
      range(count).map((i) => ({
        id: `${guardrail.id}-act-${String(i)}`,
        date: isoDay(ACTIVITY_END_DATE, i * 2),
        actor: pick(ACTORS, i),
        action: pick(ACTION_CYCLE, i),
        resource: `analyzer/${pick(["org-analyzer", "account-analyzer"], i)}`,
        outcome: pick(OUTCOME_CYCLE, i),
      })),
    "affected-resources": () =>
      range(count).map((i) => {
        const isBucket = i % 17 === 16;
        return {
          id: `${guardrail.id}-res-${String(i)}`,
          name: isBucket ? `audit-logs-${String(i)}` : `role/ops-${String(i + 1).padStart(2, "0")}`,
          kind: isBucket ? "bucket" : "identity",
          account: pick(ACCOUNTS, i),
          region: pick(REGIONS, i),
        };
      }),
    violations: () =>
      range(count).map((i) => ({
        id: `${guardrail.id}-vio-${String(i)}`,
        title: pick(
          [
            "Analyzer archive rule modified",
            "Analyzer deleted outside change window",
            "Findings suppressed by wildcard rule",
            "Analyzer scope reduced",
          ],
          i,
        ),
        severity: pick(SEVERITY_CYCLE, i),
        resource: `role/ops-${String(i + 1).padStart(2, "0")}`,
        detectedAt: isoDay(ACTIVITY_END_DATE, i * 3 + 1),
      })),
    exclusions: () =>
      range(count).map((i) => ({
        id: `${guardrail.id}-exc-${String(i)}`,
        name: pick(["role/break-glass", "role/security-automation", "audit-logs-archive"], i),
        kind: i === 2 ? "bucket" : "identity",
        reason: pick(["Emergency access", "Security tooling", "Compliance archive"], i),
        addedBy: pick(ACTORS, i + 2),
      })),
    tasks: () =>
      range(count).map((i) => ({
        id: `${guardrail.id}-task-${String(i)}`,
        title: pick(
          ["Review break-glass exclusion", "Notify owners of affected roles", "Rotate analyzer admins"],
          i,
        ),
        assignee: pick(ACTORS, i + 1),
        status: pick(TASK_STATUS_CYCLE, i),
        dueDate: isoDay("2026-10-31", i * 5),
      })),
  };
  return rows[tab]() as TabRowMap[K][];
}
