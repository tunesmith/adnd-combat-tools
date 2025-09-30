# Adding Dungeon Subtables

This project wires every dungeon table through several layers. When you add a new subtable, walk through the steps below so detail and compact modes stay in sync.

## 1. Define the data

- Create the table under `src/tables/...`. Follow the existing enum + `Table<T>` pattern.
- Export the new enum type through `src/tables/dungeon/dungeonTypes.ts` if other layers need it.

## 2. Return the pending roll from the parent resolver

- In `src/dungeon/domain/resolvers.ts`, locate the parent resolver and push a new `{ type: 'pending-roll', table: 'yourTableId', context?: ... }` into its `children` array when the outcome requires the subtable.
- Re-run or extend the associated `OutcomeEvent` type so it carries any context (e.g., dungeon level, treasure roll index) that descendants will need.

## 3. Register the resolver pipeline

- Make sure the resolver function exists (e.g., `resolveTreasurePotionDragonControl`).
- Add an entry to `TABLE_RESOLVERS` in `src/dungeon/helpers/registry.ts` so manual/detail rolls (overrides from the UI) work.
- Add a `case` to `resolvePendingNode` in `src/dungeon/helpers/outcomeTree.ts`. Compact autorolling depends on this switch; if the case is missing, compact mode will silently stop before your subtable.
- When the subtable needs metadata (level, treasureRoll, rollIndex, etc.), either supply it via the pending-roll `context` or use a helper like `readTreasureMagicContext` to infer it from ancestor events.

## 4. Wire render adapters

- Implement detail/compact renderers under `src/dungeon/adapters/render/` if the subtable produces summary text.
- Hook them into the dispatcher in `src/dungeon/adapters/render.ts` (`detailRenderers`, `compactRenderers`, `previewFactories`). Without this, the UI will show blank output even though the resolver fires.

## 5. Update preview metadata

- Ensure `build...Preview` exists and is referenced in `render.ts` so we can show the expandable table in detail mode before it resolves.
- If the table participates in roll trace UIs, add the friendly label under `TABLE_TITLES_MAP` in `src/dungeon/helpers/registry.ts`.

## 6. Tests

- Detail mode: extend or create an integration test under `src/tests/dungeon/integration/...` that drives the parent resolver and verifies the new table appears/resolves.
- Compact mode: use `simulateCompactRunWithSequence` with the directive `mode` you need (`DirectiveMode.Auto`, `DirectiveMode.Manual`, or `DirectiveMode.ManualThenAuto`). For child rolls, include targeted directives like `{ tableId: 'treasureBagOfTricks', roll: 9 }`; `DirectiveMode.ManualThenAuto` will fall back to autorolling once your scripted sequence stops.
- Unit/snapshot tests: add coverage for new render helpers if they have logic.

## 7. Checklist before closing the update

- Table definition committed and exported.
- Parent resolver returns the pending roll.
- Resolver exists in `registry.ts` and `outcomeTree.ts` handles compact autorolling.
- Render adapters + preview wiring updated.
- Tests (detail + compact) cover the new branch.
- `npm run tsc`, `npm test`, and `npm run lint` remain clean.

Keeping this checklist handy should prevent regressions like “works in detail view but not compact view” or missing UI output after adding tables.
