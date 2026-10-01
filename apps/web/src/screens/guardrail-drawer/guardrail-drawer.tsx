import {
  Button,
  DrawerBody,
  DrawerHeader,
  ErrorState,
  Eye,
  EyeOff,
  IconButton,
  Link,
  ShieldAlert,
  Skeleton,
  Stack,
  TabPanel,
  Tabs,
  X,
} from "@blast/components";
import type { Guardrail } from "../../domain/guardrail.types.js";
import { useCopyLink } from "../../hooks/use-copy-link.js";
import { useDrawerRoute } from "../../hooks/use-drawer-route.js";
import { useGuardrail } from "../../hooks/use-guardrail.js";
import { useMetadataVisibility } from "../../hooks/use-metadata-visibility.js";
import { DeployFooter } from "./deploy-footer.js";
import { guardrailTabItems, toGuardrailTab } from "./guardrail-tabs.js";
import { GuardrailMetadata } from "./guardrail-metadata.js";
import { TabContent } from "./tab-content.js";

interface GuardrailDrawerContentProps {
  guardrailId: string;
}

/** Everything inside the open drawer for one guardrail. */
export function GuardrailDrawerContent({ guardrailId }: GuardrailDrawerContentProps) {
  const guardrail = useGuardrail(guardrailId);
  const { close } = useDrawerRoute();

  if (guardrail.isPending) {
    return (
      <Stack direction="column" gap={4} padding={6}>
        <Skeleton width={320} height={28} />
        <Skeleton height={36} />
        <Skeleton height={360} />
      </Stack>
    );
  }
  if (guardrail.isError) {
    return (
      <Stack direction="column" gap={4} padding={6}>
        <ErrorState
          title="Could not load this guardrail"
          description={guardrail.error.message}
          onRetry={() => {
            void guardrail.refetch();
          }}
        />
        <Button variant="secondary" onClick={close}>
          Back to guardrails
        </Button>
      </Stack>
    );
  }
  return <LoadedDrawer guardrail={guardrail.data} />;
}

function LoadedDrawer({ guardrail }: { guardrail: Guardrail }) {
  const { route, close, setTab } = useDrawerRoute();
  const metadata = useMetadataVisibility();
  const copyLink = useCopyLink();

  const copyLabel =
    copyLink.status === "copied" ? "Link copied" : copyLink.status === "error" ? "Could not copy link" : "Copy link";

  return (
    <>
      <DrawerHeader
        icon={<ShieldAlert />}
        eyebrow="Preventive Guardrail"
        title={guardrail.name}
        info={`${guardrail.type} guardrail for ${guardrail.cloudService.name}`}
        actions={
          <>
            <Button
              variant="link"
              icon={metadata.visible ? <EyeOff /> : <Eye />}
              aria-pressed={!metadata.visible}
              onClick={metadata.toggle}
            >
              {metadata.visible ? "Hide Metadata" : "Show Metadata"}
            </Button>
            <IconButton
              label={copyLabel}
              icon={<Link />}
              onClick={() => {
                void copyLink.copy();
              }}
            />
            <IconButton label="Close" icon={<X />} onClick={close} />
          </>
        }
        tabs={
          <Tabs
            ariaLabel="Guardrail sections"
            items={guardrailTabItems(guardrail)}
            value={route.tab}
            onChange={(id) => {
              const tab = toGuardrailTab(id);
              if (tab) setTab(tab);
            }}
          />
        }
      />
      <DrawerBody
        main={
          <TabPanel id={route.tab}>
            <TabContent guardrail={guardrail} tab={route.tab} />
          </TabPanel>
        }
        {...(metadata.visible ? { aside: <GuardrailMetadata guardrail={guardrail} /> } : {})}
      />
      <DeployFooter guardrailId={guardrail.id} onCancel={close} />
    </>
  );
}
