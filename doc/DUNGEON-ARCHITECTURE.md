# Dungeon Architecture

This document explains how the dungeon generator is wired, what lives in each layer, and how information flows from a dice roll to what a player sees. Read it when you need to change behaviour or to add a new table.

## High-Level Flow

```
Tables (src/tables) ──▶ Domain Resolvers ──▶ Outcome Tree ──▶ Render Adapters ──▶ Page UI
                               │                          │
                               │                          └──▶ Registry (staged preview resolution updates the tree)
                               └──▶ Render Cache (detail & compact reuse the same nodes)
```

1. **Tables** describe the raw AD&D data: every `entries: [{ range, command }]` pair lives under `src/tables/dungeon/**`.
2. **Domain resolvers** (`src/dungeon/domain/resolvers.ts`) consult those tables, roll as needed, and return a tree of `DungeonOutcomeNode`s.
3. The **outcome tree** is a lightweight AST that records each roll and any follow-up tables that still need to be resolved.
4. **Adapters** (`src/dungeon/adapters/render.ts`) translate outcome nodes into concrete UI messages for both detail and compact modes.
5. The **registry** ties detail-mode previews back to the resolvers so the page can resolve staged tables without bespoke wiring.
6. The **page UI** (`src/pages/dungeon/index.tsx`) is a thin orchestrator that renders previews, manages the feed, and delegates all logic to the layers above.

## Files and Their Responsibilities

### Tables (`src/tables/dungeon/**`)

- Enumerations for each table (e.g., `PeriodicCheck`, `Stairs`, `MonsterOne`).
- `Table<T>` definitions with `sides` and `entries` arrays.
- No logic lives here—only data.

### Domain (`src/dungeon/domain`)

- `outcome.ts` defines the types that flow through the system:
  - `DungeonOutcomeNode` is either an `event` (resolved roll) or a `pending-roll` (preview still awaiting a roll).
  - `OutcomeEvent` is a discriminated union capturing every table the generator understands. Events can carry extra structured data (e.g., exit count, wandering level).
- `resolvers.ts` is the only place randomness happens. A resolver:
  1. Chooses or accepts a roll.
  2. Looks up the command in the relevant table.
  3. Emits a `DungeonOutcomeNode` with optional `children` for additional rolls.
  4. Threads typed context when follow-up tables depend on prior results (door chains, exits, wandering monster level).
- Resolvers must stay pure: no DOM access, no logging, no global mutation.

### Adapters (`src/dungeon/adapters/render.ts`)

- `toDetailRender(outcome)` renders headings, “roll: n — label” bullets, paragraphs, and staged previews.
- `toCompactRender(outcome)` produces the compact prose that historically appeared in the tool.
- Both helpers work directly from the stored outcome tree; detail mode adds preview nodes while compact mode filters them out.
- Each helper is pure and composes sentences in TypeScript so there is one source of truth for dungeon prose.
- Shared helpers live alongside the render functions (door-chain formatting, exit text, wandering monster composition, and so on).

### Registry (`src/dungeon/helpers/registry.ts`)

- Maps preview ids (e.g., `monsterLevel`, `doorLocation:0`) to resolver functions.
- Supplies human-readable headings for each table.
- `resolveViaRegistry` updates the outcome tree inside the feed item, refreshes the render cache, and manages collapsed/resolved state when a preview is resolved.
- Both detail and compact modes consume the updated tree; detail mode shows staged previews while compact mode reflects the latest resolved prose.

### Services (`src/dungeon/services/**`)

- Thin wrappers that keep older call sites convenient.
- Build or reuse the render cache and delegate to the resolvers; no additional rolling happens here.
- Remain for historical reasons—new code can call resolvers/adapters directly when appropriate.

### Page (`src/pages/dungeon/index.tsx`)

- Houses the React state and layout (feed, controls, accessibility live region).
- Chooses the root action (Passage or Door), collects overrides, and hands them to `runDungeonStep` (which delegates directly to the services/adapters).
- Delegates preview resolution to the registry; when you add a new table you rarely need to touch the page.

### Types (`src/types/dungeon.ts`)

- Shared view types such as `DungeonRenderNode`, `DungeonMessage`, and `DungeonTablePreview`.
- `TableContext` union for stateful preview chains (`doorChain`, `wandering`, `exits`).

### Tests (`src/tests/dungeon/**`)

- Focused Jest tests pin key behaviours: compact text, preview staging, helper utilities.
- Use `jest.spyOn(dungeonLookup, 'rollDice')` to make random output deterministic.

## Detail vs. Compact Mode

| Concern            | Detail Mode                                            | Compact Mode                                              |
| ------------------ | ------------------------------------------------------ | --------------------------------------------------------- |
| Audience           | Ref + manual flow control (DM stepping through tables) | Quick prose output akin to the original booklet           |
| Output             | Headings, bullet lists, paragraphs, table previews     | Paragraphs only                                           |
| Interaction        | User resolves each `pending-roll` via the registry     | Shares the same tree; prose updates after each resolution |
| Data source        | Outcome tree + render cache (previews included)        | Outcome tree + render cache (previews filtered)           |
| Where to change it | `toDetailRender` + registry                            | `toCompactRender` helpers                                 |

## How to Add a New Table

1. **Model the table data**: create `src/tables/dungeon/yourTable.ts` with the enum and `Table` definition.
2. **Add a resolver**: in `resolvers.ts`, implement `resolveYourThing(opts)` that returns a `DungeonOutcomeNode` and stages child previews when necessary.
3. **Extend the outcome union**: update `OutcomeEvent` to include the new `kind` if needed.
4. **Render it**:
   - Update `toDetailRender` and `toCompactRender` to handle `event.kind === 'yourThing'`.
   - Write any helper functions required to compose the final sentences.
5. **Wire previews (detail mode)**: add an entry to `TABLE_ID_LIST`, `TABLE_HEADINGS`, and `TABLE_RESOLVERS` in `registry.ts`.
6. **Expose via service (optional)**: if existing code expects a service wrapper, create one that simply calls the resolver and adapters.
7. **Test**: add Jest tests to lock compact text and detail preview behaviour.

## Pattern Notes

- **Door Chains**: The door chain flow keeps track of previously-seen lateral directions via `TableContext`. Resolvers use this to terminate properly; adapters read the same context for compact prose.
- **Exit Counts**: `resolveNumberOfExits` now records the resolved count (including the 1d4 roll). Compact/detail renderers reuse the stored value so we do not re-roll.
- **Wandering Monsters**: The wandering monster flow stages both the “where from” check and the monster level table. Compact mode reads the resolved outcome tree, so it never re-rolls level or monster subtables.
- **Unusual Rooms/Chambers**: When `unusualShape`/`unusualSize` resolve, the adapters append explanatory text and remind the DM to determine exits/contents/treasure.

## Conventions and Guardrails

- Keep resolvers free of presentation logic. They should produce structured data that can be rendered in multiple formats.
- Compact mode must not pull in `services/**`. If you find yourself reaching for one, add a helper in the adapter instead.
- When adding `pending-roll` children, include just enough context for the next resolver to do its job.
- Prefer discriminated unions to `any`. If you need to inspect `context`, add a small type guard rather than casting blindly.
- Avoid console logging inside core code; use tests to assert behaviour.

## Debugging the Flow

1. Run the app in detail mode. Each staged preview corresponds to a `pending-roll` node.
2. Inspect the feed item in React dev tools to see the generated `DungeonRenderNode[]`.
3. If the wrong preview appears, check the resolver’s children first, then the registry wiring.
4. If compact text looks off, set a deterministic sequence in a Jest test and debug the helper in `render.ts`.

With these abstractions you can change one layer without surprising the others: tables stay pure data, resolvers stay pure functions, adapters own presentation, and the UI keeps its job of showing and resolving previews. Follow that layering and the dungeon generator remains easy to extend.
