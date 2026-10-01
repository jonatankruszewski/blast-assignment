import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { guardrailsApi } from "../api/guardrails-api.js";
import type { DefenseFilters } from "../domain/guardrail.types.js";
import { guardrailKeys } from "./query-keys.js";

export function useGuardrailDefense(id: string, filters: DefenseFilters) {
  return useQuery({
    queryKey: guardrailKeys.defense(id, filters),
    queryFn: () => guardrailsApi.getDefense(id, filters),
    // Keep the current graph on screen while another cloud unit loads.
    placeholderData: keepPreviousData,
  });
}
