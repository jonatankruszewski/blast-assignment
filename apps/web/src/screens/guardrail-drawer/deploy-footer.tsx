import { Button, CloudUpload, DrawerFooter, Stack } from "@blast/components";
import { useDeployGuardrail } from "../../hooks/use-deploy-guardrail.js";

interface DeployFooterProps {
  guardrailId: string;
  onCancel: () => void;
}

export function DeployFooter({ guardrailId, onCancel }: DeployFooterProps) {
  const deploy = useDeployGuardrail(guardrailId);
  return (
    <DrawerFooter>
      <Stack direction="row" gap={4} align="center" justify="end">
        <div role="status" aria-live="polite">
          {deploy.isSuccess && "Guardrail deployed."}
          {deploy.isError && deploy.error.message}
        </div>
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          variant="primary"
          icon={<CloudUpload />}
          loading={deploy.isPending}
          onClick={() => {
            deploy.mutate();
          }}
        >
          {deploy.isError ? "Retry Deploy" : "Deploy Guardrail"}
        </Button>
      </Stack>
    </DrawerFooter>
  );
}
