/* Dev-only visual gallery. Mounted by the app at /?view=gallery. */
import { useState, type ReactNode } from "react";
import {
  AlertTriangle,
  Avatar,
  Ban,
  BlastLogo,
  Button,
  Cloud,
  CloudUpload,
  Construction,
  CountChip,
  DataTable,
  Database,
  DotGrid,
  Drawer,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  EmptyState,
  ErrorState,
  ExternalLink,
  Eye,
  EyeOff,
  FolderLock,
  GraphCallout,
  GraphCaption,
  GraphContainer,
  GraphPill,
  IconButton,
  IconStack,
  IconTile,
  Layers,
  LineChart,
  Link,
  LockBadge,
  LockOpen,
  MenuSelect,
  MetadataItem,
  MetadataPanel,
  Pencil,
  Plus,
  PortDot,
  Radar,
  Search,
  Section,
  ShieldAlert,
  ShieldCheck,
  Skeleton,
  Spinner,
  Stack,
  TabPanel,
  Tabs,
  Tag,
  TopNav,
  Trash2,
  TrendingDown,
  User,
  X,
  edgeTone,
  tones,
} from "../src/index.js";
import styles from "./gallery.module.css";

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className={styles.block}>
      <h2 className={styles.blockTitle}>{title}</h2>
      {children}
    </section>
  );
}

const chartData = [
  { date: "2026-09-15", passed: 10, blocked: 40, excluded: 85 },
  { date: "2026-09-19", passed: 88, blocked: 72, excluded: 60 },
  { date: "2026-09-23", passed: 65, blocked: 84, excluded: 18 },
  { date: "2026-09-27", passed: 43, blocked: 12, excluded: 26 },
  { date: "2026-10-01", passed: 65, blocked: 54, excluded: 35 },
  { date: "2026-10-05", passed: 54, blocked: 82, excluded: 72 },
  { date: "2026-10-09", passed: 30, blocked: 22, excluded: 48 },
  { date: "2026-10-13", passed: 10, blocked: 0, excluded: 24 },
  { date: "2026-10-14", passed: 50, blocked: 14, excluded: 70 },
];
const formatDate = (iso: string) =>
  new Date(`${iso}T00:00:00`)
    .toLocaleDateString("en-US", { month: "short", day: "numeric" })
    .toUpperCase()
    .replace(" ", ". ");

interface Row {
  id: string;
  name: string;
  severity: string;
}
const rows: Row[] = [
  { id: "1", name: "Prevent modification of Access Analyzer Settings", severity: "LOW" },
  { id: "2", name: "Block public S3 buckets", severity: "HIGH" },
];

export function Gallery() {
  const [tab, setTab] = useState("overview");
  const [layer, setLayer] = useState("all");
  const [project, setProject] = useState<string | undefined>(undefined);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [clicked, setClicked] = useState("none");

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>@blast/components gallery</h1>

      <Block title="Top nav">
        <div className={styles.navFrame}>
          <TopNav
            projectOptions={[
              { value: "prod", label: "Production" },
              { value: "stage", label: "Staging" },
            ]}
            projectValue={project}
            onProjectChange={setProject}
            userInitials="G"
          />
        </div>
        <div className={styles.row}>
          <BlastLogo />
          <Avatar initials="G" />
          <Avatar initials="JK" size="sm" />
        </div>
      </Block>

      <Block title="Buttons">
        <div className={styles.row}>
          <Button icon={<CloudUpload />}>Deploy Guardrail</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Cancel</Button>
          <Button variant="link" icon={<EyeOff />}>
            Hide Metadata
          </Button>
          <Button loading>Deploying</Button>
          <Button disabled>Disabled</Button>
          <IconButton label="Copy link" icon={<Link />} />
          <IconButton label="Close" icon={<X />} />
        </div>
      </Block>

      <Block title="Tabs">
        <Tabs
          ariaLabel="Guardrail sections"
          value={tab}
          onChange={setTab}
          items={[
            { id: "overview", label: "Overview" },
            { id: "activities", label: "Previous Activities", count: 15 },
            { id: "resources", label: "Affected Resources", count: 34 },
            { id: "violations", label: "Violations", count: 4 },
            { id: "analysis", label: "Enforcement Analysis" },
          ]}
        />
        <TabPanel id={tab}>Selected tab: {tab}</TabPanel>
      </Block>

      <Block title="Menu selects">
        <div className={styles.row}>
          <MenuSelect
            label="Layers"
            icon={<Layers />}
            ariaLabel="Layers"
            value={layer}
            onChange={setLayer}
            options={[
              { value: "all", label: "All" },
              { value: "permissions", label: "Permissions" },
              { value: "violations", label: "Violations" },
            ]}
          />
          <MenuSelect
            icon={<Cloud />}
            ariaLabel="Select Cloud Unit"
            placeholder="Select Cloud Unit"
            onChange={() => undefined}
            options={[{ value: "a", label: "Account A" }]}
          />
          <MenuSelect
            size="sm"
            menuAlign="end"
            ariaLabel="Date range"
            value="30d"
            onChange={() => undefined}
            options={[
              { value: "7d", label: "Last 7 days" },
              { value: "30d", label: "Last 30 days" },
            ]}
          />
          <div className={styles.aside}>
            <MenuSelect
              variant="field"
              ariaLabel="Field variant"
              placeholder="Field variant"
              onChange={() => undefined}
              options={[{ value: "x", label: "Option" }]}
            />
          </div>
        </div>
      </Block>

      <Block title="Tags, tiles, icon stacks, links">
        <div className={styles.row}>
          <Tag>Low</Tag>
          {tones.map((tone) => (
            <Tag key={tone} tone={tone}>
              {tone}
            </Tag>
          ))}
        </div>
        <div className={styles.row}>
          <IconTile tone="orange" size="lg" icon={<Construction />} />
          <IconTile
            tone="red"
            size="sm"
            variant="solid"
            icon={<Radar />}
            label="AWS Access Analyzer"
          />
          {tones.map((tone) => (
            <IconTile key={tone} tone={tone} icon={<ShieldCheck />} />
          ))}
        </div>
        <div className={styles.row}>
          <IconStack
            shape="square"
            variant="soft"
            ariaLabel="Risks"
            items={[
              { id: "r1", label: "Defense evasion", icon: <TrendingDown />, tone: "red" },
              { id: "r2", label: "Privilege escalation", icon: <ShieldAlert />, tone: "red" },
            ]}
          />
          <IconStack
            ariaLabel="Security requirements"
            items={[
              { id: "blast", label: "Blast", icon: <ShieldCheck />, tone: "orange" },
              { id: "cis", label: "CIS", icon: <ShieldCheck />, tone: "sky" },
              { id: "nist", label: "NIST", icon: <ShieldCheck />, tone: "purple" },
              { id: "iso", label: "ISO", icon: <ShieldCheck />, tone: "teal" },
            ]}
          />
          <ExternalLink href="https://attack.mitre.org/techniques/T1562/">
            Impair Defenses (T1562)
          </ExternalLink>
        </div>
      </Block>

      <Block title="Graph pills (soft / outline / solid, every tone)">
        <div className={styles.row}>
          <GraphPill tone="orange" icon={<Trash2 />} label="Deleting" />
          <GraphPill tone="magenta" icon={<Plus />} label="Creating" />
          <GraphPill tone="purple" icon={<Pencil />} label="Editing" />
          <GraphPill tone="teal" icon={<Search />} label="Discovery" />
          <GraphPill tone="indigo" icon={<Eye />} label="View" />
          <GraphPill tone="red" variant="outline" icon={<Ban />} label="Deny" />
          <GraphPill tone="neutral" variant="outline" label="Permissions" />
          <GraphPill tone="sky" icon={<LockOpen />} label="Exclusions" />
          <GraphPill
            tone="purple"
            variant="solid"
            icon={<FolderLock />}
            label="Service control policy"
          />
          <GraphPill tone="indigo" icon={<Eye />} label="Interactive" interactive />
          <GraphPill tone="teal" icon={<Search />} label="Selected" selected />
        </div>
        <div className={styles.row}>
          {tones.map((tone) => (
            <GraphPill key={tone} tone={tone} label={tone} />
          ))}
        </div>
        <div className={styles.row}>
          {tones.map((tone) => (
            <GraphPill key={tone} tone={tone} variant="solid" label={tone} />
          ))}
        </div>
      </Block>

      <Block title="Chips, captions, callout, badges, ports">
        <div className={styles.row}>
          <GraphCaption tone="lime">Affected Resources</GraphCaption>
          <CountChip tone="lime" count={15} icon={<User />} label="15 identities" />
          <CountChip tone="lime" count={2} icon={<Database />} label="2 buckets" />
          <CountChip tone="sky" count={2} icon={<User />} />
          <CountChip tone="sky" count={1} icon={<Database />} />
          <GraphCallout
            tone="red"
            icon={<AlertTriangle />}
            title="Violations:"
            items={["429 Findings", "19 Issues", "08 Threats"]}
          />
          <LockBadge />
          <PortDot tone="red" />
        </div>
      </Block>

      <Block title="Canvas: DotGrid + GraphContainer + edges">
        <div className={styles.canvas}>
          <div className={styles.canvasLayer}>
            <DotGrid />
          </div>
          <div className={styles.canvasContent}>
            <GraphContainer width={260} height={110}>
              <GraphPill
                tone="neutral"
                variant="soft"
                icon={<IconTile tone="red" size="sm" variant="solid" icon={<Radar />} />}
                label="Access Analyzer"
              />
            </GraphContainer>
            <svg width="200" height="80" className={styles.svg} aria-hidden="true">
              <path d="M0 10 H120 Q130 10 130 20 V70" {...edgeTone("red")} />
              <path d="M0 40 H190" {...edgeTone("neutral")} />
              <path d="M0 70 H100" {...edgeTone("sky", { dashed: true })} />
            </svg>
          </div>
        </div>
      </Block>

      <Block title="Section + LineChart">
        <Section
          title="Activities"
          variant="card"
          actions={
            <MenuSelect
              size="sm"
              menuAlign="end"
              ariaLabel="Date range"
              value="30d"
              onChange={() => undefined}
              options={[{ value: "30d", label: "Last 30 days" }]}
            />
          }
        >
          <LineChart
            ariaLabel="Activities over the last 30 days"
            data={chartData}
            xKey="date"
            xTickFormatter={formatDate}
            series={[
              { key: "passed", label: "Passed", tone: "orange" },
              { key: "blocked", label: "Blocked", tone: "red" },
              { key: "excluded", label: "Excluded", tone: "purple" },
            ]}
          />
        </Section>
      </Block>

      <Block title="Metadata panel">
        <div className={styles.aside}>
          <MetadataPanel
            header={
              <Button variant="link" icon={<EyeOff />}>
                Hide Metadata
              </Button>
            }
          >
            <MetadataItem label="Guardrail Type">Defense Hardening</MetadataItem>
            <MetadataItem label="Cloud service">
              <IconTile tone="red" size="sm" variant="solid" icon={<Radar />} />
              AWS Access Analyzer
            </MetadataItem>
            <MetadataItem label="Severity">
              <Tag>Low</Tag>
            </MetadataItem>
            <MetadataItem label="Containing policy">
              <ExternalLink href="https://example.com">0590aeb</ExternalLink>
            </MetadataItem>
          </MetadataPanel>
        </div>
      </Block>

      <Block title="Data table + states">
        <p>Last row clicked: {clicked}</p>
        <DataTable
          ariaLabel="Guardrails"
          rows={rows}
          getRowId={(row) => row.id}
          onRowClick={(row) => {
            setClicked(row.name);
          }}
          columns={[
            { key: "name", header: "Name" },
            {
              key: "severity",
              header: "Severity",
              width: 120,
              render: (row) => <Tag>{row.severity}</Tag>,
            },
          ]}
        />
        <DataTable
          ariaLabel="Empty"
          rows={[]}
          getRowId={(row: Row) => row.id}
          columns={[{ key: "name", header: "Name" }]}
        />
        <Stack direction="row" gap={6} wrap align="center">
          <Spinner />
          <Stack gap={2}>
            <Skeleton width={200} />
            <Skeleton width={140} />
          </Stack>
          <EmptyState
            title="No violations"
            description="Nothing has violated this guardrail yet."
          />
          <ErrorState
            title="Couldn't load activities"
            description="Check your connection and try again."
            onRetry={() => undefined}
          />
        </Stack>
      </Block>

      <Block title="Drawer">
        <div className={styles.row}>
          <Button
            variant="secondary"
            onClick={() => {
              setDrawerOpen(true);
            }}
          >
            Open drawer
          </Button>
        </div>
        <Drawer
          open={drawerOpen}
          ariaLabel="Guardrail details"
          onClose={() => {
            setDrawerOpen(false);
          }}
        >
          <DrawerHeader
            icon={<IconTile tone="orange" size="lg" icon={<Construction />} />}
            eyebrow="Preventive Guardrail"
            title="Prevent modification of Access Analyzer Settings"
            info="Blocks changes to IAM Access Analyzer configuration."
            actions={
              <>
                <Button variant="link" icon={<EyeOff />}>
                  Hide Metadata
                </Button>
                <IconButton label="Copy link" icon={<Link />} />
                <IconButton
                  label="Close"
                  icon={<X />}
                  onClick={() => {
                    setDrawerOpen(false);
                  }}
                />
              </>
            }
            tabs={
              <Tabs
                ariaLabel="Guardrail sections"
                value={tab}
                onChange={setTab}
                items={[
                  { id: "overview", label: "Overview" },
                  { id: "activities", label: "Previous Activities", count: 15 },
                ]}
              />
            }
          />
          <DrawerBody
            main={
              <TabPanel id={tab}>
                <Section title="Defense Visualization">Graph goes here</Section>
              </TabPanel>
            }
            aside={
              <MetadataPanel>
                <MetadataItem label="Guardrail Type">Defense Hardening</MetadataItem>
              </MetadataPanel>
            }
          />
          <DrawerFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setDrawerOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button icon={<CloudUpload />}>Deploy Guardrail</Button>
          </DrawerFooter>
        </Drawer>
      </Block>
    </div>
  );
}
