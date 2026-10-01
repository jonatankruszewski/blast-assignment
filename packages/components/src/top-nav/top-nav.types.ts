import type { ReactNode } from "react";
import type { MenuSelectOption } from "../menu-select/menu-select.types.js";

export interface TopNavProps {
  projectOptions: MenuSelectOption[];
  projectValue?: string | undefined;
  onProjectChange: (value: string) => void;
  userInitials: string;
  /** Accessible name for the avatar (e.g. full user name). */
  userName?: string;
  /** Extra controls rendered before the avatar. */
  actions?: ReactNode;
}
