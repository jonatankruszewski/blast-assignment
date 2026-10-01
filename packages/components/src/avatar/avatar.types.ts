export interface AvatarProps {
  initials: string;
  /** Accessible name, e.g. the user's full name. Defaults to the initials. */
  label?: string;
  size?: "sm" | "md";
}
