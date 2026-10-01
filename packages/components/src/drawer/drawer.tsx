import { Info } from "lucide-react";
import { useEffect, useRef, type KeyboardEvent } from "react";
import { Tooltip } from "../tooltip/tooltip.js";
import styles from "./drawer.module.css";
import type {
  DrawerBodyProps,
  DrawerFooterProps,
  DrawerHeaderProps,
  DrawerProps,
} from "./drawer.types.js";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Full-screen modal panel under the top nav. Moves focus in on open, traps Tab,
 * closes on Escape and gives focus back to the opener on close.
 */
export function Drawer({ open, onClose, ariaLabel, children }: DrawerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    ref.current?.focus();
    return () => {
      opener?.focus();
    };
  }, [open]);

  if (!open) return null;

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.stopPropagation();
      onCloseRef.current();
      return;
    }
    if (event.key !== "Tab" || !ref.current) return;
    const focusable = [...ref.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (!first || !last) {
      event.preventDefault();
      return;
    }
    if (event.shiftKey && (document.activeElement === first || document.activeElement === ref.current)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      tabIndex={-1}
      className={styles.drawer}
      onKeyDown={onKeyDown}
    >
      {children}
    </div>
  );
}

export function DrawerHeader({ icon, eyebrow, title, info, actions, tabs }: DrawerHeaderProps) {
  return (
    <div className={styles.contents}>
      <div className={styles.titleArea}>
        {icon}
        <div className={styles.titleText}>
          <p className={styles.eyebrow}>{eyebrow}</p>
          <div className={styles.titleRow}>
            <h2 className={styles.title}>{title}</h2>
            {info && (
              <InfoButton info={info} />
            )}
          </div>
        </div>
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
      {tabs && <div className={styles.tabs}>{tabs}</div>}
    </div>
  );
}

function InfoButton({ info }: { info: string }) {
  return (
    <Tooltip content={info} placement="bottom">
      <button type="button" className={styles.info} aria-label="About this guardrail">
        <Info aria-hidden="true" />
      </button>
    </Tooltip>
  );
}

export function DrawerBody({ main, aside }: DrawerBodyProps) {
  return (
    <div className={styles.contents}>
      <div className={styles.main}>{main}</div>
      {aside !== undefined && <aside className={styles.aside}>{aside}</aside>}
    </div>
  );
}

export function DrawerFooter({ children }: DrawerFooterProps) {
  return <div className={styles.footer}>{children}</div>;
}
