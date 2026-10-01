import type { Tone } from "@blast/components";
import type { Severity } from "../../domain/guardrail.types.js";

export const SEVERITY_TONE: Record<Severity, Tone> = {
  low: "neutral",
  medium: "orange",
  high: "red",
  critical: "magenta",
};
