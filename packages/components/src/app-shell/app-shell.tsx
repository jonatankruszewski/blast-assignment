import styles from "./app-shell.module.css";
import type { AppShellProps } from "./app-shell.types.js";

export function AppShell({ topNav, children }: AppShellProps) {
  return (
    <div className={styles.shell}>
      <header className={styles.header}>{topNav}</header>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
