# Treasure Pending-Roll Resolution (Feature Bundle Gap)

## Current behavior

- `src/dungeon/helpers/outcomeTree.ts` owns most pending-roll resolution via a large `switch` on `pending.table`.
- `navigation/` and `hazards/` features participate in this:
  - Their table definitions include `resolvePending` (and sometimes `postProcessChildren`).
  - Their bundles export `*_PENDING_RESOLVERS`.
  - `outcomeTree.ts` delegates to `NAVIGATION_PENDING_RESOLVERS` / `HAZARD_PENDING_RESOLVERS` before falling back to the `switch`.
- `treasure/` features do **not** participate yet:
  - Treasure’s bundle exports `TREASURE_TABLE_DEFINITIONS`, `TREASURE_RENDER_ADAPTERS`, `TREASURE_PREVIEW_FACTORIES`, `TREASURE_REGISTRY_OUTCOMES`.
  - There is no `TREASURE_PENDING_RESOLVERS` (and no treasure `resolvePending` usage).
  - As a result, treasure pending-roll resolution still lives in `outcomeTree.ts`.

## Why this matters (given “feature bundles are source of truth”)

- The same table ends up having **two separate integration touchpoints**:
  - “Feature bundle wiring” (`index.ts`/`bundle.ts`) for registry/render/preview.
  - “Pending resolution wiring” in the monolithic `outcomeTree.ts` switch.
- That’s exactly the kind of split-brain maintenance burden the features convention is supposed to eliminate.

## Concrete example: `treasureMiscMagicE1`

- `treasureMiscMagicE1` produces pending children (`treasureBagOfHolding`, `treasureBagOfTricks`, `treasureBracersOfDefense`, `treasureBucknardsEverfullPurse`, `treasureArtifactOrRelic`).
- But resolving those pending children is still handled by `outcomeTree.ts` (and the child tables themselves are still “base tables”).
- So E1 is “feature-owned” for **definition/registry/render/preview**, but **not** for “how its pending rolls get resolved”.

## Possible next step (incremental, low risk)

1. Extend treasure features to mirror navigation/hazards:
   - Add `createPendingResolverMap` usage in `src/dungeon/features/treasure/index.ts`.
   - Export `TREASURE_PENDING_RESOLVERS` from `src/dungeon/features/treasure/bundle.ts`.
2. For each treasure table definition that should be resolvable from a pending roll, add `resolvePending` in its manifest.
3. Update `src/dungeon/helpers/outcomeTree.ts` to delegate to `TREASURE_PENDING_RESOLVERS` the same way it does for navigation/hazards.

This allows deleting treasure cases from the `switch` **one at a time** without changing runtime behavior.

## Open design questions

- Do we want “pending resolution” to *always* be feature-owned for treasure (like navigation/hazards), or is treasure intentionally different?
- Do we eventually want the E1 subtables (`bag/bracers/purse/artifact`) to migrate into treasure features too, so E1 becomes fully feature-contained?

