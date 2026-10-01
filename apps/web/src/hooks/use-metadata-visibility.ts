import { useState } from "react";

/** Whether the drawer's metadata aside is shown. Local UI state (could be persisted per user later). */
export function useMetadataVisibility(initial = true) {
  const [visible, setVisible] = useState(initial);
  return {
    visible,
    toggle: () => {
      setVisible((v) => !v);
    },
  };
}
