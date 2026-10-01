# Blast: Guardrail Drawer MVP plan

Source: `References/Screenshot 2026-10-01 at 17.27.23.png` (Figma frame "guardrail drawer").

## 1. What the screen is

A full-screen **drawer** that opens when a guardrail row in a table is clicked.

```
┌──────────────────────────── TopNav (logo · project select · avatar) ────────────────────────────┐
│ DrawerHeader: icon · eyebrow "Preventive Guardrail" · title · info      [Hide Metadata] [🔗] [✕] │
│ Tabs: Overview · Previous Activities (15) · Affected Resources (34) · Violations (4) · …        │
├──────────────────────────────────────────────────────────────┬──────────────────────────────────┤
│ Main (tab content)                                            │ Aside: MetadataPanel (toggleable)│
│  ├ Section "Defense Visualization"  [Layers ▾] [Cloud Unit ▾] │  Guardrail Type, Cloud service,  │
│  │   <DependencyGraph/>                                       │  Risks, Severity, Security reqs, │
│  └ Card "Activities" [Last 30 days ▾]  line chart + legend    │  MITRE technique, Containing pol.│
├──────────────────────────────────────────────────────────────┴──────────────────────────────────┤
│ DrawerFooter:                                                         [Cancel] [Deploy Guardrail]│
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
```

## 2. Repository shape (based on `template-oss`)

pnpm + Turborepo, TypeScript, ESM, same lint/commit/test presets and feature-folder rule as the
template (`src/<feature>/<feature>.tsx`, `.types.ts`, `.test.tsx`, `.fixtures.ts`).

| Package               | Name                                                            | Owns                                                                                                                                                    | Must NOT contain                                                                      |
| --------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `packages/components` | `@blast/components`                                             | Design tokens (CSS variables), primitives, layout shell, graph node/edge _visuals_, chart wrapper. All styling lives here (CSS Modules + `tokens.css`). | Data fetching, domain logic, knowledge of guardrails.                                 |
| `packages/libraries`  | `@blast/libraries` (export `@blast/libraries/dependency-graph`) | `<DependencyGraph>`: data model, layout, edge routing, rendering, interaction, a11y. 100% generic.                                                      | Colors, fonts, icons, any Blast/guardrail concept. Only structural CSS (positioning). |
| `apps/web`            | `@blast/web` (Vite + React 19)                                  | Screens, routing, data (TanStack Query + MSW mocks), `hooks/`, domain → view-model mappers. Composes components + libraries.                            | Any CSS / `className` styling. Only layout via component props.                       |

Dependency direction: `web → components`, `web → libraries`. `components` and `libraries` never
import each other — the app wires a visual node component into the graph's renderer slots.

## 3. `<DependencyGraph>` design (the core of the work)

### 3.1 Reading the graph in the frame

Everything in the picture reduces to four generic primitives:

| In the picture                                                                                                                                                            | Generic primitive                                                             |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Pills (Deleting, Creating, Permissions, Deny, Exclusions, SCP), count chips (`15 👤`), the Access Analyzer card, the Violations callout, the "Affected Resources" caption | **Node** with a `type` + arbitrary `data`; the app renders it                 |
| Lines between them; Permissions fanning out to 5 actions that merge back into Deny                                                                                        | **Edge**, with optional **bundling** (shared trunk at source or target)       |
| Red dot on Access Analyzer's bottom-right where the violation line starts; edges entering a specific side                                                                 | **Port** — a named anchor on a node side + offset                             |
| Lock badge on top of the Access Analyzer card                                                                                                                             | **Decoration** — content pinned to a node anchor, not part of layout or edges |
| Access Analyzer card containing an inner pill; "Affected Resources" stacking two chips                                                                                    | **Group** (compound node) — children laid out inside a parent                 |

The Violations box is _not_ a special overlay type: it is a node connected to a port. That keeps the
library generic and lets the app add any future overlay (e.g. "Remediation", "Drift") with no
library change.

### 3.2 Public API (draft — frozen in M0 so lanes can work in parallel)

```ts
type NodeId = string;
type Side = "top" | "right" | "bottom" | "left";

interface GraphPort {
  id: string;
  side: Side;
  offset?: number; /* 0..1 along side, default .5 */
}

interface GraphNode<TData = unknown, TType extends string = string> {
  id: NodeId;
  type: TType; // picks the renderer
  data: TData; // opaque to the library
  parentId?: NodeId; // compound / group membership
  ports?: GraphPort[];
  layout?: {
    // hints, all optional
    rank?: number; // column (layered layout)
    order?: number; // position inside the column
    attach?: { to: NodeId; side: Side; gap?: number }; // satellites: SCP above, Exclusions below
    position?: { x: number; y: number }; // manual layout wins
  };
}

interface GraphEdge<TData = unknown, TType extends string = string> {
  id: string;
  source: NodeId;
  target: NodeId;
  sourcePort?: string;
  targetPort?: string;
  type?: TType; // picks edge style/renderer
  data?: TData;
  bundle?: string; // edges sharing a key share a trunk (Permissions → actions → Deny)
  marker?: "none" | "arrow" | "dot";
}

interface DependencyGraphProps<N extends GraphNode, E extends GraphEdge> {
  nodes: N[];
  edges: E[];
  nodeRenderers: { [K in N["type"]]: ComponentType<NodeRenderProps<Extract<N, { type: K }>>> };
  edgeRenderer?: ComponentType<EdgeRenderProps<E>>; // default: plain <path>, styled via getEdgeProps
  getEdgeProps?: (edge: E) => SVGProps<SVGPathElement>; // app passes stroke via CSS vars/classes from components
  renderDecorations?: (node: N) => Decoration[]; // { anchor: Side | `${Side}-${Side}`, content: ReactNode }
  layout?: LayoutEngine; // default: layeredLayout(); also manualLayout()
  routing?: "orthogonal" | "straight"; // default orthogonal, rounded corners
  background?: ReactNode; // app passes the dotted grid from components
  viewport?: { fit?: boolean; pan?: boolean; zoom?: boolean | [min: number, max: number] };
  selectedId?: NodeId;
  onSelect?: (id: NodeId | null) => void; // controlled
  onNodeActivate?: (node: N) => void; // click / Enter
  ariaLabel: string;
  emptyState?: ReactNode;
  loadingState?: ReactNode;
}

interface LayoutEngine {
  (input: { nodes: MeasuredNode[]; edges: GraphEdge[] }): LayoutResult | Promise<LayoutResult>;
}
```

### 3.3 Internals (pipeline)

1. **Measure** — render nodes off-layout once, read sizes with `ResizeObserver` (nodes are real
   HTML so the app's components keep their own typography/padding).
2. **Layout** — `LayoutEngine` returns node positions. Default `layeredLayout()`:
   longest-path ranking → `rank` overrides → order within column (`order` or barycenter) →
   `attach` satellites placed relative to their anchor → groups sized around children.
   Pure function, no DOM → unit-tested with fixtures. `manualLayout()` for fixed designs.
3. **Route** — orthogonal router: port resolution → elbow paths with rounded corners →
   bundling (edges with the same `bundle` key share the trunk segment, which produces the
   Permissions "bracket" and the merge into Deny). Pure, tested on coordinates.
4. **Render** — one positioned `<div>` layer for nodes + decorations, one `<svg>` layer for edges
   (edges under nodes). Library ships only structural CSS.
5. **Interact** — optional pan/zoom (pointer + wheel, `transform` on a single wrapper),
   fit-to-view on data change, roving-tabindex keyboard navigation over nodes, `role="group"`
   with `aria-label`, each node `role="button"` when activatable.

**Build vs buy (decided 2026-10-01).** `@xyflow/react` is used _internally_ for node hosting,
measurement, viewport (fit/pan/zoom), selection and keyboard foundations, for a shorter feedback
loop. It is read-only (no drag/connect/delete) and only its structural `base.css` is loaded. Its types
never appear in the public API. Our own pure `layeredLayout` (satellites, groups) and orthogonal,
bundled `routeEdges` still compute positions and paths, drawn by one custom xyflow edge. The
`LayoutEngine` stays pluggable (an `elkjs` adapter later if graphs grow).

**Riskiest assumption:** the router can reproduce the Figma edges (bracket fan-out, merge into
Deny, port-originating violation line) cleanly. It is spiked first (M0) before anything depends on it.

### 3.4 How the app composes it

```tsx
// apps/web/src/screens/guardrail-drawer/overview/DefenseVisualization.tsx
const { nodes, edges } = useGuardrailGraph(guardrailId, { layers, cloudUnit }); // hook → mapper
<DependencyGraph
  ariaLabel="Defense visualization"
  nodes={nodes}
  edges={edges}
  nodeRenderers={guardrailNodeRenderers} // map of type → @blast/components visuals
  getEdgeProps={guardrailEdgeProps} // tone → token-based class from components
  renderDecorations={guardrailDecorations} // lock badge on protected targets
  background={<DotGrid />}
/>;
```

`toGuardrailGraph(guardrail, filters)` is a pure mapper in `apps/web` and the place where domain
knowledge lives (which actions exist, which are denied, violations, exclusions, layers filter).

Node types the app maps to visuals from `@blast/components`:
`resourceCount` (CountChip), `caption` (GraphCaption), `permissionHub` / `action` / `effect`
(GraphPill with tone + icon), `policy` (GraphPill, filled), `target` (GraphContainer),
`service` (GraphPill with service icon), `exclusions`, `violations` (GraphCallout with list).

## 4. `@blast/components` inventory

- **Tokens**: color (neutral, brand blue, per-tone: orange/magenta/purple/teal/indigo/red/lime/sky),
  spacing, radius, typography, shadow, z-index — CSS variables in `tokens.css`, typed in TS.
- **Primitives**: `Button` (primary/ghost, icon slot), `IconButton`, `Icon` (lucide-react),
  `Tabs` (with count), `Select` / `MenuButton` (Layers, Cloud Unit, Last 30 days, Select Project),
  `Avatar`, `Tag` (severity LOW), `Tooltip`, `Card`, `SectionHeader`, `Link` (external).
- **Layout shell**: `AppShell`, `TopNav`, `Drawer` (full-screen, focus-trap, Esc, portal),
  `DrawerHeader`, `DrawerBody` (split `main` / `aside` slots, aside collapsible), `DrawerFooter`.
- **Metadata**: `MetadataPanel`, `MetadataItem` (label + value | icon list | link).
- **Graph visuals** (stateless, know nothing about the graph lib): `GraphPill`, `CountChip`,
  `GraphContainer`, `GraphCallout`, `GraphCaption`, `PortDot`, `LockBadge`, `DotGrid`,
  edge tone classes.
- **Data viz**: `LineChart` + `ChartLegend` wrapping Recharts (themed with tokens).
- Storybook for every component (lets the swarm build visuals without the app).

## 5. `apps/web`

- **Routing / state** (rx-fe-state): drawer open + guardrail id + active tab + graph filters +
  activities range live in the **URL** (`/guardrails?id=…&tab=overview&layers=all&range=30d`), so
  the 🔗 button copies a shareable link and back/forward works. Metadata visibility: local state
  (persisted per user later). Server data: TanStack Query; no global client store needed.
- **Data**: MSW handlers + fixtures for `GET /guardrails`, `GET /guardrails/:id`,
  `GET /guardrails/:id/graph?layers&cloudUnit`, `GET /guardrails/:id/activities?range`,
  `POST /guardrails/:id/deploy`.
- **hooks/**: `useGuardrail`, `useGuardrailGraph`, `useActivities`, `useDeployGuardrail`
  (mutation, pending state on button, toast on result), `useDrawerRoute`, `useMetadataVisibility`.
- **Screens**: `GuardrailsTable` (minimal list to open the drawer), `GuardrailDrawer` with tab
  routes; each tab handles loading / empty / error states.

## 6. Milestones

Each milestone ends green on `pnpm run verify` and is demoable.

| #      | Milestone                           | Done when                                                                                                                                                                                                                   | Scope ref |
| ------ | ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| **M0** | Scaffold + contracts + router spike | Monorepo from template with the 3 packages, Vite app, React lint layer, Vitest jsdom, Storybook. `DependencyGraph` types frozen. Spike renders the Figma graph with hard-coded positions and real orthogonal/bundled edges. | —         |
| **M1** | Layout shell                        | Drawer opens from table row; TopNav, header, tabs, main/aside split, collapsible metadata, footer — all with placeholder slots and tokens. Esc / ✕ / Cancel close.                                                          | 2a        |
| **M2** | DependencyGraph core                | Layered layout, ports, bundling, decorations, groups, satellites, fit-to-view, keyboard nav, a11y; unit tests on layout + routing; Storybook with generic (non-Blast) examples.                                             | 2b        |
| **M3** | Guardrail graph                     | Graph visuals in components; `toGuardrailGraph` mapper + `useGuardrailGraph`; Overview graph matches Figma; Layers / Cloud Unit filters change the graph.                                                                   | 2b        |
| **M4** | Metadata panel                      | All metadata rows from data, external links, Hide/Show metadata.                                                                                                                                                            | 2c        |
| **M5** | Activities chart                    | Line chart + legend + range selector, loading/empty states.                                                                                                                                                                 | 2c        |
| **M6** | Tabs + actions                      | Tab routing with counts; other tabs as simple tables (Previous Activities, Affected Resources, Violations, Exclusions, Tasks) and Enforcement Analysis placeholder; copy link; Deploy mutation with pending/success/error.  | 2c        |
| **M7** | Hardening                           | a11y pass (axe + keyboard), perf check on a 200-node graph, Playwright smoke of the golden path.                                                                                                                            | —         |

M1 and M2 can start in parallel right after M0.

## 7. Swarm plan

One owner per package, each in its own git worktree (rx-parallel); contracts from M0 are the
only shared surface.

| Lane           | Agent            | Owns                           | Milestones                              |
| -------------- | ---------------- | ------------------------------ | --------------------------------------- |
| A — Graph lib  | `rx-fe-builder`  | `packages/libraries`           | M0 spike → M2                           |
| B — Components | `rx-ui`          | `packages/components`          | M1 visuals → M3 visuals → M4/M5 visuals |
| C — App        | `rx-fe-builder`  | `apps/web`                     | M1 wiring → M3 mapper → M4–M6 logic     |
| Review         | `rx-fe-reviewer` | read-only                      | after each milestone                    |
| Tests          | `rx-test-writer` | tests in the lane under review | M2, M3, M6                              |
| QA             | `rx-qa-tester`   | read-only, browser             | M3, M7                                  |

Integration order per milestone: B and A merge first (no cross-deps), C merges last and composes.

## 8. Open questions

1. Can we get Figma access (MCP) for exact tokens, icons, and the other tab designs?
2. Icon set: lucide is a good match for the UI icons — are service icons (AWS Access Analyzer)
   and compliance logos (CIS, NIST, ISO) provided as assets?
3. What do "Layers" mean in the graph (e.g. show/hide permissions, exclusions, violations)?
4. Is the graph read-only, or should clicking a node do something (filter, open a tab)?
5. Real API contract, or MSW mocks for the MVP?
6. Package scope/name: `@blast/*` assumed.
