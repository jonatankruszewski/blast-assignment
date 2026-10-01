import { useEffect, useRef, useState } from "react";

export type CopyStatus = "idle" | "copied" | "error";

/** Copies a link (default: the current URL) and reports the result for a short while. */
export function useCopyLink(resetAfterMs = 2000) {
  const [status, setStatus] = useState<CopyStatus>("idle");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => {
    clearTimeout(timer.current);
  }, []);

  const report = (next: CopyStatus) => {
    setStatus(next);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setStatus("idle");
    }, resetAfterMs);
  };

  const copy = async (url: string = window.location.href) => {
    try {
      await navigator.clipboard.writeText(url);
      report("copied");
    } catch {
      report("error");
    }
  };

  return { status, copy };
}
