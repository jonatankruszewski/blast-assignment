import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { guardrailsApi } from "../api/guardrails-api.js";
import type { ActivityRange } from "../domain/guardrail.types.js";
import { guardrailKeys } from "./query-keys.js";

export function useActivities(id: string, range: ActivityRange) {
  return useQuery({
    queryKey: guardrailKeys.activities(id, range),
    queryFn: () => guardrailsApi.getActivities(id, range),
    placeholderData: keepPreviousData,
  });
}
