import { useMutation, useQueryClient } from "@tanstack/react-query";
import { guardrailsApi } from "../api/guardrails-api.js";
import { guardrailKeys } from "./query-keys.js";

export function useDeployGuardrail(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["deploy", id],
    mutationFn: () => guardrailsApi.deployGuardrail(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: guardrailKeys.all }),
  });
}
