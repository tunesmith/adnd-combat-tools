# Dungeon Architecture Strategy (Features-First)

## Intent

Continue the migration toward a cohesive “final form” dungeon architecture where **feature bundles are the single source of truth** for table behavior (tables + resolvers + pending resolution + render adapters + previews), while shrinking and eventually deleting the monolithic/legacy integration points.

This plan explicitly targets **de-complexification and LOC reduction without losing existing behavior**.

## Goals

- **Features are authoritative**: table-specific logic lives in `src/dungeon/features/**`.
- **Engine stays small**: generic outcome-tree manipulation, pending-roll application, and registry dispatch are table-agnostic and stable.
- **Render becomes mostly declarative**: render adapters are provided by features; composition layers should not contain table-specific switches.
- **Predictable file layout**: a developer can jump into any table/feature and find the same set of concerns in consistent places.
- **Reduce churn**: avoid repeated edits to “central lists” (`render.ts`, `registry.ts`, `outcomeTree.ts`, etc.) for each new table migration.

## Non-goals

- Rewriting the UI or changing UX/wording as part of refactors (unless required for parity).
- Introducing elaborate plugin systems or meta-frameworks.
- Perfect naming/folder structure immediately; prioritize migration + deletion of legacy monoliths first.

## Current State (Key Tension)

There are currently **two architectures competing**:

1. **Features-first (new)**: `DungeonTableDefinition` + per-domain bundles (`navigation`, `hazards`, `treasure`).
2. **Monolithic (legacy)**: centralized “knows-everything” modules:
   - `src/dungeon/domain/resolvers.ts` (large table-specific resolver logic)
   - `src/dungeon/helpers/outcomeTree.ts` (pending resolution + context glue + special cases)
   - `src/dungeon/helpers/registry.ts` (registry dispatch + base table resolver maps)
   - `src/dungeon/adapters/render.ts` (large event-kind → render adapter map)

The migration work is valuable, but the “fits and starts” feeling comes from paying an integration tax: each new feature has to thread through remaining legacy switches/maps/lists.

## Target Architecture (“Final Form” Layers)

### 1) Domain contracts (stable, shared)

- `src/dungeon/domain/outcome.ts`: outcome tree shapes + event payload types.
- `src/types/dungeon.ts`: UI render-node/message types + table preview types + table context types.

Rule: these files define cross-layer “contracts” and should not depend on table-specific feature implementations beyond importing table enums/types when necessary.

### 2) Feature bundles (single source of truth per table)

- `src/dungeon/features/<domain>/<feature>/...`
- Each table is represented by a `DungeonTableDefinition` that provides:
  - `id`, `heading`
  - `resolver`
  - `renderers` (detail + compact)
  - `buildPreview` (or a raw `table` for default preview)
  - `resolvePending` (when needed)
  - `registry` (when needed)
  - `postProcessChildren` (rare; keep usage minimal)

Rule: **table-specific behavior belongs here** (including subtables).

### 3) Engine (table-agnostic)

Generic operations:

- Normalize outcome trees and assign stable ids.
- Apply resolved outcomes to pending nodes.
- Auto-resolve pending rolls (via feature-provided pending resolvers).
- Dispatch “roll this table” requests (via feature-provided registry outcome builders).

Rule: engine code should not grow table-specific `switch` statements over time; it should primarily consult feature maps.

### 4) Use-cases/services (orchestration)

Example: “run a dungeon step” (`passage`, `door`) that produces an outcome + render snapshot.

Rule: orchestration is allowed to compose multiple tables/features, but it should not re-implement table logic already captured in features.

## Conventions (Keep It Predictable)

- **One feature per table** unless a very small grouping is clearly justified.
- **Subtables live with their parent feature** (same folder) when they are primarily internal to that table’s behavior.
- **Cross-feature shared glue** goes in `src/dungeon/features/<domain>/shared.ts` (domain-scoped) or `src/dungeon/features/shared.ts` (global).
- Keep “stringifying” of UI messages (e.g., compact message → text) in a module whose name reflects that responsibility (avoid burying generic behavior under a misleading path like `monsters/partySummary.ts`).

## Strategy (Phased)

### Phase 0: Guardrails

- Keep unit/integration tests running after each migration chunk.
- Add/extend “parity tests” when moving logic out of legacy monoliths.
- Prefer refactors that delete legacy code in the same PR that introduces feature replacements.

### Phase 1: Reduce integration churn (unify dispatch)

The engine should depend on **one combined map** of definitions and derived helpers.

Concrete direction:

- Maintain per-domain indexes (`navigation/index.ts`, `hazards/index.ts`, `treasure/index.ts`, etc.) that produce `*_TABLE_DEFINITIONS`.
- Add a single “all features” bundle that combines definitions and exports:
  - `ALL_TABLE_DEFINITIONS`
  - `ALL_REGISTRY_OUTCOMES`
  - `ALL_PENDING_RESOLVERS`
  - `ALL_RENDER_ADAPTERS`
  - `ALL_PREVIEW_FACTORIES`
  - `ALL_TABLE_HEADINGS` / `ALL_TABLE_ID_LIST`

Then gradually update:

- `src/dungeon/helpers/registry.ts` to consult `ALL_*` maps instead of maintaining large base resolver maps.
- `src/dungeon/helpers/outcomeTree.ts` pending resolution to consult `ALL_PENDING_RESOLVERS` and delete the fallback `switch` as coverage rises.
- `src/dungeon/adapters/render.ts` to consult `ALL_RENDER_ADAPTERS` and delete large event-kind routing tables.

This phase is primarily about **stopping central files from being edited for every migration**.

### Phase 2: Migrate clusters end-to-end (then delete legacy code)

Pick a coherent cluster, move it fully into features (resolver + render + preview + pending), then delete the legacy implementations and remove it from any “base tables” remnants.

Repeat until the monoliths are small enough to delete or become thin shims.

### Phase 3: Final cleanup (optional renames)

Once the architecture is stable:

- Consider renaming directories to reflect responsibilities more clearly (e.g. `helpers/` → `engine/`, `adapters/render/` → `render/`), but do this late to avoid churn.

## Next Cluster Recommendation: Monsters (Pilot)

Monsters are a good next candidate because they’re relatively self-contained and don’t have the same deep DAG as rooms/chambers.

### Current monster-related code is split across layers

- Domain resolution: `src/dungeon/domain/resolvers.ts` contains `resolveMonster*`, `resolveDragon*`, `resolveHuman`, etc.
- Text generation helpers live under `src/dungeon/services/monster/*` (these are effectively domain/render helpers, not “services”).
- Rendering adapters live under `src/dungeon/adapters/render/monsters/*` (plus a generic message-to-text helper is currently colocated there).
- Table data lives under `src/tables/dungeon/monster/*` (this is good; keep it as pure data).

### Proposed “final form” for monsters

Create `src/dungeon/features/monsters/` with feature definitions for:

- `monsterLevel`
- `monsterOne` … `monsterTen`
- `dragonThree`, `dragonFourYounger`, `dragonFourOlder`, … `dragonTen`
- `human`

Each table gets a `DungeonTableDefinition` in a `manifest.ts` (or per-feature `manifest.ts` aggregated by `features/monsters/index.ts`).

Move/own these responsibilities inside the monsters feature bundle:

- Resolver logic currently in `domain/resolvers.ts` for monster tables.
- Monster text-generation helpers currently under `services/monster/*`.
- Render adapters currently under `adapters/render/monsters/*`.
- Preview factories (if any special preview rules exist).
- Pending resolution rules (as `resolvePending` functions).

Keep these outside monsters:

- Outcome/event type definitions remain in `src/dungeon/domain/outcome.ts`.
- UI message types remain in `src/types/dungeon.ts`.
- Monster table data remains in `src/tables/dungeon/monster/*`.

### Expected payoffs

- Large LOC reduction in `src/dungeon/domain/resolvers.ts` once monster resolvers move out.
- Shrink `src/dungeon/adapters/render.ts` and `src/dungeon/helpers/outcomeTree.ts` because monsters stop requiring special-case routing.
- A clear precedent for later room/chamber migration.

## Success Criteria

We’re “done” when:

- Adding/migrating a table typically touches:
  - the feature folder for that table
  - (optionally) the combined “all features” index
  - and not the legacy monoliths
- The legacy files are either deleted or reduced to thin compatibility shims.
- Table-specific switches in engine/composition layers are rare and justified.

## Notes / Known Smells to Fix Opportunistically

- Generic message-to-text utilities should live in a generic module (not under a misleading path like `render/monsters/partySummary.ts`).
- Avoid duplication of small helpers like `formatRange`; centralize once the migration settles to reduce churn.
- Treat “services that format/render domain results” as features/render helpers, not as orchestration services.
