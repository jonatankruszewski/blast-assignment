import { QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { GuardrailsScreen } from "../screens/guardrails-screen.js";
import { createQueryClient } from "./query-client.js";

export function App() {
  const [queryClient] = useState(createQueryClient);
  return (
    <QueryClientProvider client={queryClient}>
      <GuardrailsScreen />
    </QueryClientProvider>
  );
}
