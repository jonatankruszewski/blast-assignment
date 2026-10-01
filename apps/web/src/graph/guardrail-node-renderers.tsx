import {
  AlertTriangle,
  Ban,
  CountChip,
  Database,
  Eye,
  FolderLock,
  GraphCallout,
  GraphCaption,
  GraphContainer,
  GraphPill,
  IconTile,
  LockOpen,
  Pencil,
  Plus,
  Radar,
  Search,
  Trash2,
  User,
} from "@blast/components";
import type { NodeRenderProps } from "@blast/libraries";
import type { ComponentType, ReactNode } from "react";
import type { ActionEffect, ActionKind } from "../domain/guardrail.types.js";
import type { CountedResource, GuardrailGraphNode, GuardrailNodeType } from "./guardrail-graph.types.js";

type Props = NodeRenderProps<GuardrailGraphNode>;

const ACTION_ICONS: Record<ActionKind, ReactNode> = {
  delete: <Trash2 />,
  create: <Plus />,
  edit: <Pencil />,
  discover: <Search />,
  view: <Eye />,
};

const EFFECT_ICONS: Record<ActionEffect, ReactNode> = {
  deny: <Ban />,
  allow: <LockOpen />,
};

const RESOURCE_ICONS: Record<CountedResource, ReactNode> = {
  identities: <User />,
  buckets: <Database />,
};

function CaptionNode({ node }: Props) {
  if (node.type !== "caption") return null;
  return <GraphCaption tone={node.data.tone}>{node.data.label}</GraphCaption>;
}

function ResourceCountNode({ node }: Props) {
  if (node.type !== "resourceCount") return null;
  const { tone, count, resource, label } = node.data;
  return <CountChip tone={tone} count={count} icon={RESOURCE_ICONS[resource]} label={label} />;
}

function PermissionHubNode({ node, selected }: Props) {
  if (node.type !== "permissionHub") return null;
  return <GraphPill tone="neutral" variant="outline" label={node.data.label} selected={selected} />;
}

function ActionNode({ node, selected }: Props) {
  if (node.type !== "action") return null;
  const { tone, label, kind } = node.data;
  return <GraphPill tone={tone} variant="soft" icon={ACTION_ICONS[kind]} label={label} selected={selected} />;
}

function EffectNode({ node, selected }: Props) {
  if (node.type !== "effect") return null;
  const { tone, label, effect } = node.data;
  return <GraphPill tone={tone} variant="outline" icon={EFFECT_ICONS[effect]} label={label} selected={selected} />;
}

function PolicyNode({ node, selected }: Props) {
  if (node.type !== "policy") return null;
  return (
    <GraphPill tone={node.data.tone} variant="solid" icon={<FolderLock />} label={node.data.label} selected={selected} />
  );
}

/** Group frame; the library places the service pill inside it. */
function TargetNode({ node, size }: Props) {
  if (node.type !== "target") return null;
  return <GraphContainer width={size.width} height={size.height} />;
}

function ServiceNode({ node, selected }: Props) {
  if (node.type !== "service") return null;
  return (
    <GraphPill
      tone="neutral"
      variant="soft"
      icon={<IconTile tone={node.data.tone} variant="solid" size="sm" icon={<Radar />} />}
      label={node.data.label}
      selected={selected}
    />
  );
}

function ExclusionsNode({ node, selected }: Props) {
  if (node.type !== "exclusions") return null;
  return <GraphPill tone={node.data.tone} variant="soft" icon={<LockOpen />} label={node.data.label} selected={selected} />;
}

function ViolationsNode({ node }: Props) {
  if (node.type !== "violations") return null;
  const { tone, title, items } = node.data;
  return <GraphCallout tone={tone} icon={<AlertTriangle />} title={title} items={items} />;
}

export const guardrailNodeRenderers: Record<GuardrailNodeType, ComponentType<Props>> = {
  caption: CaptionNode,
  resourceCount: ResourceCountNode,
  permissionHub: PermissionHubNode,
  action: ActionNode,
  effect: EffectNode,
  policy: PolicyNode,
  target: TargetNode,
  service: ServiceNode,
  exclusions: ExclusionsNode,
  violations: ViolationsNode,
};
