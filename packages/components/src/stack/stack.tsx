import { clsx } from "clsx";
import styles from "./stack.module.css";
import type { StackProps } from "./stack.types.js";

/** Flexbox layout primitive. The only way the app arranges things. */
export function Stack({
  direction = "column",
  gap = 0,
  align,
  justify,
  wrap = false,
  grow = false,
  padding,
  fullHeight = false,
  as: Element = "div",
  responsive = false,
  children,
}: StackProps) {
  return (
    <Element
      className={clsx(
        styles.stack,
        styles[direction],
        styles[`gap-${String(gap)}`],
        padding !== undefined && styles[`pad-${String(padding)}`],
        align && styles[`align-${align}`],
        justify && styles[`justify-${justify}`],
        wrap && styles.wrap,
        grow && styles.grow,
        fullHeight && styles.fullHeight,
        responsive && styles.responsive,
      )}
    >
      {children}
    </Element>
  );
}
