import type { Tone } from "../tokens/tokens.types.js";

export interface LineChartSeries {
  key: string;
  label: string;
  tone: Tone;
}

export interface LineChartProps {
  ariaLabel: string;
  data: Record<string, string | number>[];
  xKey: string;
  series: LineChartSeries[];
  yTickFormatter?: (value: number) => string;
  xTickFormatter?: (value: string) => string;
  /** Plot height in px (legend excluded). Default 160. */
  height?: number;
  /** Y domain; default [0, 100]. */
  yDomain?: [number, number];
  /** Y ticks; default 0, 20 ... 100. */
  yTicks?: number[];
}
