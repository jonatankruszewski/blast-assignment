import { Folder } from "lucide-react";
import { Avatar } from "../avatar/avatar.js";
import { BlastLogo } from "../blast-logo/blast-logo.js";
import { MenuSelect } from "../menu-select/menu-select.js";
import styles from "./top-nav.module.css";
import type { TopNavProps } from "./top-nav.types.js";

export function TopNav({
  projectOptions,
  projectValue,
  onProjectChange,
  userInitials,
  userName,
  actions,
}: TopNavProps) {
  return (
    <nav className={styles.nav} aria-label="Main">
      <BlastLogo />
      <div className={styles.project}>
        <MenuSelect
          variant="nav"
          icon={<Folder />}
          ariaLabel="Select Project"
          placeholder="Select Project"
          value={projectValue}
          options={projectOptions}
          onChange={onProjectChange}
        />
      </div>
      <div className={styles.end}>
        {actions}
        <Avatar initials={userInitials} label={userName ?? `Signed in as ${userInitials}`} />
      </div>
    </nav>
  );
}
