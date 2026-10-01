import { ExternalLink as ExternalIcon } from "lucide-react";
import { VisuallyHidden } from "../visually-hidden/visually-hidden.js";
import styles from "./external-link.module.css";
import type { ExternalLinkProps } from "./external-link.types.js";

export function ExternalLink({ href, children }: ExternalLinkProps) {
  return (
    <a className={styles.link} href={href} target="_blank" rel="noopener noreferrer">
      <span>{children}</span>
      <span className={styles.icon} aria-hidden="true">
        <ExternalIcon />
      </span>
      <VisuallyHidden>(opens in a new tab)</VisuallyHidden>
    </a>
  );
}
