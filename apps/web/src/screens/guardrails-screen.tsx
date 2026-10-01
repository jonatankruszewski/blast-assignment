import { AppShell, Drawer, TopNav } from "@blast/components";
import { useState } from "react";
import { DevNav } from "../app/dev-views.js";
import { useDrawerRoute } from "../hooks/use-drawer-route.js";
import { currentUser, projectsFixture } from "../mocks/projects.fixtures.js";
import { GuardrailDrawerContent } from "./guardrail-drawer/guardrail-drawer.js";
import { GuardrailsTable } from "./guardrails-table/guardrails-table.js";

export function GuardrailsScreen() {
  const { route, close } = useDrawerRoute();
  const [project, setProject] = useState<string | undefined>(undefined);

  return (
    <AppShell
      topNav={
        <TopNav
          projectOptions={projectsFixture}
          projectValue={project}
          onProjectChange={setProject}
          userInitials={currentUser.initials}
          userName={currentUser.name}
          {...(import.meta.env.DEV ? { actions: <DevNav /> } : {})}
        />
      }
    >
      <GuardrailsTable />
      <Drawer open={route.guardrailId !== null} onClose={close} ariaLabel="Guardrail details">
        {route.guardrailId && (
          <GuardrailDrawerContent key={route.guardrailId} guardrailId={route.guardrailId} />
        )}
      </Drawer>
    </AppShell>
  );
}
