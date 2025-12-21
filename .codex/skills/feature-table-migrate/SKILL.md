---
name: feature-table-migrate
description: Migrate dungeon tables from monolithic render/resolver/registry files into src/dungeon/features in adnd-combat-tools. Use for requests like "migrate treasureMiscMagicE1 into features", "move a table into treasure/hazards/navigation features", or "extract a table into a feature folder and clean duplicate registrations".
---

# Feature Table Migrate

## Overview

Migrate a dungeon table and its resolver/render/preview into the feature convention while keeping behavior unchanged and removing old wiring.

## Typical Prompts

- "migrate treasureMiscMagicE1 into features"
- "let's proceed with migrating swords next"
- "move gas trap into hazards features"
- "extract ring tables into features"

## Workflow

1. Identify scope and context.
   - Use `rg "<tableId>" src` to find the table data, resolver, render, preview, registry, and tests.
   - Confirm the event kind and heading; keep ids/headings stable.

2. Inventory files and choose placement.
   - Prefer `src/dungeon/features/<area>/<featureName>/` with a `manifest.ts`.
   - Move table data into the feature folder when owned by the feature; keep it in `src/tables/dungeon` only if it is shared.

3. Create feature files and move code.
   - Create `<featureName>Table.ts` or `<featureName>Tables.ts` for table data.
   - Create `<featureName>Resolvers.ts` for resolver logic.
   - Create `<featureName>Render.ts` for detail/compact renderers and preview builder.
   - Update imports for moved tables and helpers.

4. Add the manifest entry.
   - Add a `DungeonTableDefinition` entry with `id`, `heading`, `resolver`, `renderers`, `buildPreview`.
   - Add `resolvePending` for any table that can appear as a pending-roll (including subtables).
     - If pending resolution needs context, compute it from `pending.context` and/or `ancestors`.
     - For treasure tables, prefer `readTreasureMagicContext(pending.context, ancestors)` from `src/dungeon/features/treasure/shared.ts` instead of duplicating logic in `outcomeTree.ts`.
   - Add `registry` when the resolver needs context (treasureMagic level/treasureRoll/rollIndex, doorChain, etc).
   - Use `wrapResolver` or a typed resolver to avoid `unknown` options.

5. Wire into the feature bundle.
   - Export the table list from the feature `manifest.ts`.
   - Add the new list to the category index:
     - `src/dungeon/features/treasure/index.ts`
     - `src/dungeon/features/hazards/index.ts`
     - `src/dungeon/features/navigation/index.ts`
   - Ensure the category exports `*_PENDING_RESOLVERS` via `createPendingResolverMap(...)` and re-export it from the category `bundle.ts`.

6. Remove old wiring and duplicates.
   - Delete base resolver entries in `src/dungeon/helpers/registry.ts` for migrated ids.
   - Remove ids/headings from `src/dungeon/features/baseTables/bundle.ts` if the table is now a feature.
   - Remove manual adapters/previews in `src/dungeon/adapters/render.ts` if they still exist for that id.
   - Re-export the moved resolver from `src/dungeon/domain/resolvers.ts` if other imports rely on it, or update those imports directly.
   - Remove redundant cases from `src/dungeon/helpers/outcomeTree.ts` once `resolvePending` is feature-owned (remember `pending.table` may include suffixes like `:<rollIndex>`, so use the base id).

7. Update imports and tests.
   - Update `src/dungeon/helpers/outcomeTree.ts` and tests that import the old resolver path.
   - Keep behavior identical; avoid refactors during the move.

8. Validate.
   - Run `npm test` for affected suites.
   - Run `npm run lint` if you touched many files.

## Common Files Touched

- Update `src/dungeon/features/<area>/<featureName>/manifest.ts`
- Update `src/dungeon/features/<area>/index.ts`
- Update `src/dungeon/domain/resolvers.ts` (re-export or removal)
- Update `src/dungeon/helpers/registry.ts`
- Update `src/dungeon/features/baseTables/bundle.ts`
- Update `src/dungeon/helpers/outcomeTree.ts`
- Update `src/dungeon/adapters/render.ts`

## Notes

- Prefer re-exporting from `src/dungeon/domain/resolvers.ts` to avoid widespread import churn.
- Keep `any` out; add explicit option types or small type guards as needed.
- Preserve existing render copy unless the user requests wording changes.
