# Dungeon Architecture

This is the current map of the dungeon generator after the simplification pass. The goal is not “generic rules engine”; the goal is “readable AD&D table flow with a small reusable kernel.”

If you are a DM or a developer trying to understand what a table can lead to next, start in the relevant feature folder and only drop into the kernel if you need to understand how pending rolls are normalized or rendered.

## Design Rules

- Keep the engine small and pure.
- Keep table flow local to the feature that owns it.
- Prefer explicit TypeScript tables and resolver code over framework-style indirection.
- Prefer direct imports from the module that owns a type or helper; do not add barrel-only files.
- Treat compact mode and detail mode as two renderings of the same outcome tree.
- Keep preview resolution deterministic and replayable by threading the same outcome tree forward.

## High-Level Flow

```text
feature table data/resolvers
  -> outcome tree with pending rolls
  -> pure pending resolution + normalization
  -> detail/compact render snapshot
  -> page/feed controller applies UI state
```

The important boundary is:

- `src/dungeon/**` owns pure dungeon behavior.
- `src/components/dungeon/**` owns feed mutation, collapse state, and React wiring.

That means preview resolution now happens in two steps:

1. The pure engine resolves one pending node and returns `{ outcome, snapshot, resolvedIds }`.
2. The UI/controller decides how to merge that result into the feed.

## Read This First

If you want to understand a feature, read files in this order:

1. `table.ts` or `*Table.ts`: the raw DMG/appendix table data.
2. `*Resolvers.ts`: the actual roll flow and the pending children it stages next.
3. `manifest.ts`: how the table plugs into preview/detail/compact behavior.
4. `*Render.ts`: how the resolved event becomes DM-facing text.
5. `*Flow.ts`: only when the feature needs special post-processing that should stay local to that feature.

For most work, that is enough.

## Kernel

These files are the reusable core and should stay generic:

- `src/dungeon/domain/outcome.ts`
- `src/dungeon/domain/*Outcome.ts`
- `src/dungeon/domain/treasureValueTypes.ts`
- `src/dungeon/domain/pendingRoll.ts`
- `src/dungeon/helpers/outcomeTree.ts`
- `src/dungeon/helpers/outcomePipeline.ts`
- `src/dungeon/helpers/registry.ts`
- `src/dungeon/helpers/dungeonRandom.ts`

The kernel is responsible for:

- node ids
- pending-roll normalization
- tree traversal
- replacing one pending node with one resolved subtree
- building detail/compact snapshots
- seeded random-session support

The kernel should not know dungeon content rules like “rooms/chambers need exit injection” or “swords need special preview suppression.”

## UI Boundary

These files are the React-side orchestration layer:

- `src/components/dungeon/dungeonFeedController.ts`
- `src/components/dungeon/useDungeonPageState.ts`
- `src/pages/dungeon/index.tsx`

They are responsible for:

- feed item replacement
- resolved preview bookkeeping
- collapsed/expanded state
- user interactions
- replay/session wiring

They should not contain dungeon table logic.

## Feature Map

### Navigation

- Entry and periodic checks: `src/dungeon/features/navigation/entry`
- Door chains: `src/dungeon/features/navigation/doorChain`
- Side passages: `src/dungeon/features/navigation/sidePassage`
- Passage turns and width: `src/dungeon/features/navigation/passageTurn`, `src/dungeon/features/navigation/passageWidth`
- Special passages, streams, rivers, galleries: `src/dungeon/features/navigation/specialPassage`
- Exits, stairs, egress, chute: `src/dungeon/features/navigation/exit`
- Chasms: `src/dungeon/features/navigation/chasm`

### Environment

- Rooms, chambers, contents, stairs: `src/dungeon/features/environment/roomsChambers`
- Unusual shape/size: `src/dungeon/features/environment/unusualSpace`
- Circular pools: `src/dungeon/features/environment/circularPools`

### Hazards

- Trick/trap: `src/dungeon/features/hazards/trickTrap`
- Gas traps: `src/dungeon/features/hazards/gasTrap`
- Illusionary walls: `src/dungeon/features/hazards/illusionaryWall`

### Monsters

- Monster level selection: `src/dungeon/features/monsters/monsterLevel`
- Human subtable: `src/dungeon/features/monsters/human`
- Monster I-X tables and dragon follow-ups: `src/dungeon/features/monsters/monster*`

### Treasure

- Core treasure roll: `src/dungeon/features/treasure/treasure`
- Containers and protection: `src/dungeon/features/treasure/container`, `src/dungeon/features/treasure/protection`
- Magic category fan-out: `src/dungeon/features/treasure/magicCategory`
- Item families: potion, scroll, ring, rod/staff/wand, misc magic E1-E5, armor/shields, misc weapons, swords

## What a Pending Roll Means

Pending rolls are explicit nodes in the tree:

- old compatibility shape: `table` + `context`
- new preferred shape: `kind` + `args` + stable `id`

`src/dungeon/domain/pendingRoll.ts` is the compatibility boundary. Shared code should use the helpers there instead of parsing `table` strings or reaching into `context` directly.

That gives us two benefits:

- features can become more explicit without breaking replay/preview behavior
- the remaining legacy parsing is isolated to one place

## How to Follow a Table Chain

Example: room/chamber flow

1. `roomsChambersTable.ts` defines the raw dimensions/content tables.
2. `roomsChambersResolvers.ts` stages `numberOfExits`, `unusualShape`, `unusualSize`, and `chamberRoomContents`.
3. `roomsChambersFlow.ts` owns the feature-specific “unusual size may need exit follow-up” behavior.
4. `manifest.ts` wires previews/renderers without pushing those special cases back into the kernel.

Example: periodic check flow

1. `entryTable.ts` defines the periodic check and door-beyond tables.
2. `entryResolvers.ts` stages the next table explicitly.
3. Navigation manifests wire the previews.
4. The controller resolves previews one node at a time through the pure engine.

## Registration Rules

Feature registration is intentionally plain:

- `id`
- `heading`
- `resolver`
- `renderers`
- optional `registry`
- optional `resolvePending`
- optional preview builders
- optional feature-local post-processing hooks

There is no extra contextual metadata layer. A table either uses the default resolver path or supplies an explicit `registry` + `resolvePending` pair when it truly needs one. Bundle construction fails if only one of those two handlers is present.

## Guardrails

- No React imports under `src/dungeon`.
- No scoped table-id parsing outside `src/dungeon/domain/pendingRoll.ts`.
- Keep feature-specific behavior out of `src/dungeon/helpers/outcomeTree.ts`.
- Prefer adding a small feature-local helper over expanding the kernel.
- Do not introduce a DSL or more generic rule engine.

## When to Add a New Helper

Add a shared helper only if the pattern is genuinely generic and reused across multiple feature families.

Good shared helpers:

- normalize a pending node
- derive a render snapshot
- build a plain preview from a table

Bad shared helpers:

- feature-specific table sequencing
- exception handling for one table family
- abstractions that obscure how the DMG table flows

## Maintenance Heuristic

If a DM asks “what can this table roll into next?”, they should be able to answer it by reading one feature folder and this document, without opening the kernel.

If that stops being true, the code is drifting back toward over-abstraction.
