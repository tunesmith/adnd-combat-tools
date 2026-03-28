# Adding Dungeon Subtables

This project wires every dungeon table through several layers. When you add a new subtable, walk through the steps below so detail and compact modes stay in sync.

Before you start wiring anything, pick the narrowest table-definition helper that fits:

- `defineRollOnlyTable(...)` for simple roll-only subtables
- `defineTreasureFollowupTable(...)` for treasure follow-up leaves
- `defineTreasureMagicTable(...)` for treasure tables that need treasure context
- `defineMonsterTable(...)` for monster tables
- `defineEnvironmentLevelTable(...)` for environment tables that mainly derive dungeon level
- raw `DungeonTableDefinition` only for true outliers

## 1. Define the data

- Create the table under `src/tables/...`. Follow the existing enum + `Table<T>` pattern. For single-value entries, use a single-element range like `[29]` instead of `[29, 29]` so the intent stays clear.
- Export the new enum type through `src/tables/dungeon/dungeonTypes.ts` if other layers need it.

## 2. Return the pending roll from the parent resolver

- In `src/dungeon/domain/resolvers.ts`, locate the parent resolver and push a new `{ type: 'pending-roll', table: 'yourTableId', context?: ... }` into its `children` array when the outcome requires the subtable.
- Re-run or extend the associated `OutcomeEvent` type so it carries any context (e.g., dungeon level, treasure roll index) that descendants will need.

## 3. Register the resolver pipeline

- Make sure the resolver function exists (e.g., `resolveTreasurePotionDragonControl`).
- Make sure the feature manifest that exports the table is already pulled into `src/dungeon/features/bundle.ts`. That bundle generates the registry, preview, and pending-resolution maps automatically.
- Add a `case` to `resolvePendingNode` in `src/dungeon/helpers/outcomeTree.ts` if the subtable depends on compact autorolling and the helper layer does not already cover it.
- When the subtable needs metadata (level, treasureRoll, rollIndex, etc.), either supply it via the pending-roll `context` or use a helper like `readTreasureMagicContext` to infer it from ancestor events.

## 4. Wire render adapters

- Implement detail/compact renderers under `src/dungeon/adapters/render/` if the subtable produces summary text.
- The feature bundle now feeds most render adapters and preview factories into `src/dungeon/adapters/render.ts` automatically. Only touch the adapter layer directly if the table really falls outside the feature-definition path.

## 5. Update preview metadata

- Ensure `build...Preview` exists and is referenced from the feature manifest so we can show the expandable table in detail mode before it resolves.
- If the table participates in roll trace UIs, make sure the manifest heading is accurate; the registry reads it from the bundled feature definitions.

## 6. Tests

- Detail mode: extend or create an integration test under `src/tests/dungeon/integration/...` that drives the parent resolver and verifies the new table appears/resolves.
- Compact mode: use `simulateCompactRunWithSequence` with the directive `mode` you need (`DirectiveMode.Auto`, `DirectiveMode.Manual`, or `DirectiveMode.ManualThenAuto`). For child rolls, include targeted directives like `{ tableId: 'treasureBagOfTricks', roll: 9 }`; `DirectiveMode.ManualThenAuto` will fall back to autorolling once your scripted sequence stops.
- Unit/snapshot tests: add coverage for new render helpers if they have logic.

## 7. Checklist before closing the update

- Table definition committed and exported.
- Parent resolver returns the pending roll.
- Manifest uses the narrowest fitting helper.
- Feature bundle includes the manifest and `outcomeTree.ts` handles compact autorolling where needed.
- Render adapters + preview wiring updated through the feature layer.
- Tests (detail + compact) cover the new branch.
- `npm run tsc`, `npm test`, and `npm run lint` remain clean.

Keeping this checklist handy should prevent regressions like “works in detail view but not compact view” or missing UI output after adding tables.
