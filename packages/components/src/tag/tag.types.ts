import type { ReactNode } from "react";
import type { Tone } from "../tokens/tokens.types.js";

export interface TagProps {
  tone?: Tone;
  children: ReactNode;
}
