import { QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { GuardrailsScreen } from "../screens/guardrails-screen.js";
import { DevView, readDevView } from "./dev-views.js";
import { createQueryClient } from "./query-client.js";

export function App() {
  const [queryClient] = useState(createQueryClient);
  // Dev views are picked once at load; switching between them reloads the page.
  const [devView] = useState(() => readDevView(window.location.search));
  if (devView) return <DevView id={devView} />;
  return (
    <QueryClientProvider client={queryClient}>
      <GuardrailsScreen />
    </QueryClientProvider>
  );
}
