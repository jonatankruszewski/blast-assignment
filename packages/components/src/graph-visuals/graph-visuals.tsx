import { clsx } from "clsx";
import { Lock } from "lucide-react";
import type { Tone } from "../tokens/tokens.types.js";
import { VisuallyHidden } from "../visually-hidden/visually-hidden.js";
import styles from "./graph-visuals.module.css";
import type {
  CountChipProps,
  EdgeToneOptions,
  GraphCalloutProps,
  GraphCaptionProps,
  GraphContainerProps,
  GraphPillProps,
  PortDotProps,
} from "./graph-visuals.types.js";

export function GraphPill({
  tone,
  icon,
  label,
  variant = "soft",
  size,
  interactive = false,
  selected = false,
}: GraphPillProps) {
  const resolvedSize = size ?? (variant === "solid" ? "sm" : "md");
  return (
    <span
      data-tone={tone}
      className={clsx(
        styles.pill,
        variant === "outline" && styles.outline,
        variant === "solid" && styles.solid,
        resolvedSize === "sm" && styles.sm,
        interactive && styles.interactive,
        selected && styles.selected,
      )}
    >
      {icon && (
        <span className={styles.glyph} aria-hidden="true">
          {icon}
        </span>
      )}
      {label}
    </span>
  );
}

export function CountChip({ tone, count, icon, label }: CountChipProps) {
  return (
    <span data-tone={tone} className={styles.chip}>
      <span aria-hidden={label ? true : undefined}>{count}</span>
      <span className={styles.glyph} aria-hidden="true">
        {icon}
      </span>
      {label && <VisuallyHidden>{label}</VisuallyHidden>}
    </span>
  );
}

const size = (v: number | string | undefined) =>
  v === undefined ? "100%" : typeof v === "number" ? `${String(v)}px` : v;

export function GraphContainer({ width, height, children }: GraphContainerProps) {
  return (
    <div className={styles.container} style={{ width: size(width), height: size(height) }}>
      {children}
    </div>
  );
}

export function GraphCallout({ tone, icon, title, items }: GraphCalloutProps) {
  return (
    <div data-tone={tone} className={styles.callout}>
      <p className={styles.calloutTitle}>
        {icon && (
          <span className={styles.glyph} aria-hidden="true">
            {icon}
          </span>
        )}
        {title}
      </p>
      <ul className={styles.calloutList}>
        {items.map((item) => (
          <li key={item} className={styles.calloutItem}>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function GraphCaption({ tone, children }: GraphCaptionProps) {
  return (
    <span data-tone={tone} className={styles.caption}>
      {children}
    </span>
  );
}

export function LockBadge({ label = "Protected" }: { label?: string }) {
  return (
    <span className={styles.lock} role="img" aria-label={label}>
      <Lock aria-hidden="true" strokeWidth={2.25} />
    </span>
  );
}

export function PortDot({ tone }: PortDotProps) {
  return <span data-tone={tone} className={styles.port} aria-hidden="true" />;
}

export function DotGrid() {
  return <span className={styles.dotGrid} aria-hidden="true" />;
}

/** Class for an SVG edge path: sets stroke and color (for currentColor markers) from tokens. */
export function edgeTone(tone: Tone, options: EdgeToneOptions = {}): { className: string } {
  return {
    className: clsx(
      styles.edge,
      styles[`edge-${tone}`],
      options.dashed && styles.edgeDashed,
      options.emphasis && styles.edgeEmphasis,
    ),
  };
}
