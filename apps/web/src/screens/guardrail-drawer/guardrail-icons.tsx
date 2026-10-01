import { Activity, Home, Layers, Lock, ShieldAlert, TrendingDown } from "@blast/components";
import type { Tone } from "@blast/components";
import type { ReactNode } from "react";
import type { ComplianceFramework, RiskKind } from "../../domain/guardrail.types.js";

export const RISK_ICONS: Record<RiskKind, ReactNode> = {
  "defense-evasion": <TrendingDown />,
  "data-exposure": <Home />,
  "privilege-escalation": <Activity />,
};

export const FRAMEWORK_BADGES: Record<ComplianceFramework, { icon: ReactNode; tone: Tone }> = {
  blast: { icon: <ShieldAlert />, tone: "orange" },
  cis: { icon: <Layers />, tone: "sky" },
  nist: { icon: <Lock />, tone: "purple" },
  iso: { icon: <Activity />, tone: "teal" },
};
