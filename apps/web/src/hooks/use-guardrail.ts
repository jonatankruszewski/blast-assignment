import { useQuery } from "@tanstack/react-query";
import { guardrailsApi } from "../api/guardrails-api.js";
import { guardrailKeys } from "./query-keys.js";

export function useGuardrail(id: string) {
  return useQuery({
    queryKey: guardrailKeys.detail(id),
    queryFn: () => guardrailsApi.getGuardrail(id),
  });
}
