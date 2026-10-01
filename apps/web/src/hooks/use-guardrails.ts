import { useQuery } from "@tanstack/react-query";
import { guardrailsApi } from "../api/guardrails-api.js";
import { guardrailKeys } from "./query-keys.js";

export function useGuardrails() {
  return useQuery({ queryKey: guardrailKeys.list(), queryFn: guardrailsApi.listGuardrails });
}
