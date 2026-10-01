import {
  ExternalLink,
  IconStack,
  IconTile,
  MetadataItem,
  MetadataPanel,
  Radar,
  Stack,
  Tag,
} from "@blast/components";
import type { Guardrail } from "../../domain/guardrail.types.js";
import { FRAMEWORK_BADGES, RISK_ICONS } from "./guardrail-icons.js";
import { SEVERITY_TONE } from "./severity.js";

export function GuardrailMetadata({ guardrail }: { guardrail: Guardrail }) {
  return (
    <MetadataPanel ariaLabel="Guardrail metadata">
      <MetadataItem label="Guardrail Type">{guardrail.type}</MetadataItem>
      <MetadataItem label="Cloud service">
        <Stack direction="row" gap={2} align="center">
          <IconTile tone="red" variant="solid" size="sm" icon={<Radar />} />
          {guardrail.cloudService.name}
        </Stack>
      </MetadataItem>
      <MetadataItem label="Risks">
        <IconStack
          ariaLabel="Risks"
          shape="square"
          variant="soft"
          items={guardrail.risks.map((risk) => ({
            id: risk.id,
            label: risk.label,
            icon: RISK_ICONS[risk.id],
            tone: "red",
          }))}
        />
      </MetadataItem>
      <MetadataItem label="Severity">
        <Tag tone={SEVERITY_TONE[guardrail.severity]}>{guardrail.severity.toUpperCase()}</Tag>
      </MetadataItem>
      <MetadataItem label="Security Requirements">
        <IconStack
          ariaLabel="Security requirements"
          shape="circle"
          items={guardrail.securityRequirements.map((req) => ({
            id: req.id,
            label: req.label,
            ...FRAMEWORK_BADGES[req.id],
          }))}
        />
      </MetadataItem>
      <MetadataItem label="MITRE Technique">
        <ExternalLink href={guardrail.mitre.url}>
          {guardrail.mitre.name} ({guardrail.mitre.id})
        </ExternalLink>
      </MetadataItem>
      <MetadataItem label="Containing policy">
        <ExternalLink href={guardrail.containingPolicy.url}>{guardrail.containingPolicy.id}</ExternalLink>
      </MetadataItem>
    </MetadataPanel>
  );
}
