# Agent guide

pnpm + Turborepo monorepo. Node >= 22.13. TypeScript, ESM, React 19. Plan: `PLAN.md`.

## Layout and boundaries (enforced in review)

- `packages/components` (`@blast/components`) — ALL styling: tokens (`src/tokens/tokens.css`),
  primitives, layout shell, graph node visuals, chart. CSS Modules + CSS variables. No data, no domain.
- `packages/libraries` (`@blast/libraries`) — `<DependencyGraph>`. 100% generic: no colors, fonts,
  icons or guardrail concepts. Contract: `src/dependency-graph/dependency-graph.types.ts` (frozen;
  additive optional changes only).
- `apps/web` (`@blast/web`, Vite) — screens, `src/hooks`, data, mappers. NO CSS files, NO `className`,
  NO inline `style` for looks. Compose components; layout via component props.
- `components` and `libraries` never import each other.
- Internal packages are source-only (`exports` → `src/index.ts`), so Vite HMR picks up edits live.

## Commands

- `pnpm dev` — app at http://localhost:5173
- `pnpm typecheck` / `pnpm test` / `pnpm lint` / `pnpm format`
- `pnpm --filter <package> test` — one package.

## Rules

- One folder per feature: `src/<feature>/<feature>.tsx`, `<feature>.types.ts`, `<feature>.test.tsx`,
  `<feature>.module.css`, `<feature>.fixtures.ts`. `src/index.ts` re-exports only.
- ESLint runs `strictTypeChecked` + React/hooks/a11y. Fix findings; don't disable rules.
- Conventional Commits; subject line only. Never `--no-verify`.

<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": false` in the root `turbo.json` or `turbo.jsonc` to opt out; this does not remove an existing block. Keep the block committed with your work to avoid an uncommitted change on the next agent invocation.
<!-- END:turborepo-agent-rules -->
