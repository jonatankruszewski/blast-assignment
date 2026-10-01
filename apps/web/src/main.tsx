import "@blast/components";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/app.js";
import { ensureDefaultDrawerRoute } from "./hooks/use-drawer-route.js";
import { SCREENSHOT_GUARDRAIL_ID } from "./mocks/guardrails.fixtures.js";

// Demo: open the screenshot guardrail when the app starts without URL params.
ensureDefaultDrawerRoute(SCREENSHOT_GUARDRAIL_ID);

const root = document.getElementById("root");
if (!root) throw new Error("#root missing");
createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
