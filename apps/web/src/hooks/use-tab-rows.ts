import { useQuery } from "@tanstack/react-query";
import { guardrailsApi } from "../api/guardrails-api.js";
import type { RowTab, TabRowMap } from "../domain/guardrail.types.js";
import { guardrailKeys } from "./query-keys.js";

export function useTabRows<K extends RowTab>(id: string, tab: K) {
  return useQuery<TabRowMap[K][]>({
    queryKey: guardrailKeys.tabRows(id, tab),
    queryFn: () => guardrailsApi.getTabRows(id, tab),
  });
}
