import { useQuery } from "@tanstack/react-query";
import { guardrailsApi } from "../api/guardrails-api.js";
import { guardrailKeys } from "./query-keys.js";

export function useCloudUnits() {
  return useQuery({
    queryKey: guardrailKeys.cloudUnits(),
    queryFn: guardrailsApi.listCloudUnits,
    staleTime: Infinity,
  });
}
