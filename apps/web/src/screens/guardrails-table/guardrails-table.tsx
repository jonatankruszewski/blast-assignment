import { Button, EmptyState, ErrorState, Section, Skeleton, Stack } from "@blast/components";
import { useDrawerRoute } from "../../hooks/use-drawer-route.js";
import { useGuardrails } from "../../hooks/use-guardrails.js";

/** Interim list (Buttons) until DataTable lands. */
export function GuardrailsTable() {
  const guardrails = useGuardrails();
  const { open } = useDrawerRoute();

  return (
    <Stack direction="column" gap={4} padding={6}>
      <Section title="Guardrails" headingLevel={2}>
        {guardrails.isPending ? (
          <Skeleton height={240} />
        ) : guardrails.isError ? (
          <ErrorState
            title="Could not load guardrails"
            onRetry={() => {
              void guardrails.refetch();
            }}
          />
        ) : guardrails.data.length === 0 ? (
          <EmptyState title="No guardrails yet" />
        ) : (
          <Stack direction="column" gap={2} align="start">
            {guardrails.data.map((g) => (
              <Button
                key={g.id}
                variant="link"
                onClick={() => {
                  open(g.id);
                }}
              >
                {g.name}
              </Button>
            ))}
          </Stack>
        )}
      </Section>
    </Stack>
  );
}
