# Primary Sword Abilities (Primary Powers) – Implementation Notes

These notes capture the key steps from changeset `5501236` so we can reproduce the same workflow for **Extraordinary Powers** (or any other nested treasure feature) without the earlier back‑and‑forth. Treat this as a companion to [ADDING_SUBTABLES.md](./ADDING_SUBTABLES.md) and [STRUCTURED_TREASURE_OUTPUTS.md](./STRUCTURED_TREASURE_OUTPUTS.md); the sections below call out the project-specific wrinkles those guides don’t cover.

---

## 1. Table Layer

- Added new enums and tables in `src/tables/dungeon/treasureSwords.ts`:
  - `TreasureSwordPrimaryAbility` and `TreasureSwordPrimaryAbilityCommand`.
  - Two table definitions (`treasureSwordPrimaryAbility` and the restricted `...Restricted` variant used after “roll twice”).
  - `SWORD_PRIMARY_ABILITY_DETAILS` plus `describeSwordPrimaryAbility` so renderers and tests share a single description source.
  - `TreasureSwordPrimaryAbilityResult` tracks `kind`, `rolls`, `multiplier`, `description`, and importantly a `tableVariant` flag (`'standard' | 'restricted'`). The variant is what lets our renderers keep previews aligned with the table that spawned a result.

**Callout:** Whenever the source table has non-uniform ranges (here, 01‑92 vs. 93‑00) peel off a restricted table. This made the roll-twice instruction deterministic and kept previews tidy.

---

## 2. Resolver Logic

File: `src/dungeon/domain/resolvers.ts`

- `resolveTreasureSwordUnusual` queues pending ability rolls by building `PendingRoll` nodes with a `context` payload (`slotKey`, `rollIndex`, `tableVariant`).
- `resolveTreasureSwordPrimaryAbility`:
  - Interprets optional forced rolls (used by tests and by autoroll reruns).
  - Emits an **instruction** node for 93–98 on the standard table, pushes two restricted pending-roll children, and sets `tableVariant: 'standard'`.
  - For normal results, creates an ability event with `tableVariant` mirroring the table variant passed in.
- `buildSwordPrimaryAbilityPending` is the single place that chooses the table ID (`treasureSwordPrimaryAbility` vs. `...Restricted`). This kept all slot/id naming consistent with the rest of the tree.

When extending this for extraordinary powers, follow the same pattern: let the primary resolver push a `PendingRoll` with the right context, and let the resolver inspect `tableVariant` before deciding which sub-table to use.

---

## 3. Outcome Tree / Autoroll Support

File: `src/dungeon/helpers/outcomeTree.ts`

- Capture the new tables in `resolvePendingNode` so compact autorolling works:
  ```ts
  case 'treasureSwordPrimaryAbility':
  case 'treasureSwordPrimaryAbilityRestricted':
  ```
  Both cases call `resolveTreasureSwordPrimaryAbility`, passing through `slotKey`, `rollIndex`, and `tableVariant` parsed from `pending.context`.
- `readSwordPrimaryAbilityContext` is a tiny helper mirroring the resolver’s expectations (`slotKey`, `rollIndex`, `tableVariant`, `ignoreHigh` fallback).
- `readTreasureSwordContext` now copies any `primaryAbilityRolls` so forced rerolls survive round-tripping through pending nodes.

Without these additions autoroll stopped at the first pending ability, so this is the minimal checklist for future subtables.

---

## 4. Registry Integration

File: `src/dungeon/helpers/registry.ts`

- Added both table IDs (`treasureSwordPrimaryAbility`, `...Restricted`) to:
  - `TABLE_ID_LIST`, `TABLE_HEADINGS`, and `TABLE_RESOLVERS`.
  - Each resolver forwards the parsed slot/tableVariant context to `resolveTreasureSwordPrimaryAbility`.
- This ensures both tables are selectable in the UI and reroll dialogs while reusing the same resolver implementation.

Remember that every new table needs explicit entries here; otherwise rerolls and previews break, even if autorolling works.

---

## 5. Rendering (Detail + Compact)

File: `src/dungeon/adapters/render/treasureSwords.ts` (plus `render.ts` and `treasure.ts`)

- **Helper exposure:** `summarizePrimaryAbilities` now exports a canonical summary structure (`ability`, `count`, `description`). Detail/compact renderers reuse it to keep sentences consistent.
- **Detail nodes:** `renderTreasureSwordPrimaryAbilityDetail` and `...Compact` render single ability rolls or the “roll twice” instruction.
- **Sword sentences:** `swordSentence` now appends `The sword can ...` lines for each summarized ability, re-used in both detail and compact contexts.
- **Treasure summary:** `renderTreasure` pulls ability summaries into the top-level treasure compact sentence so players see powers immediately.
- **Previews:** `previewForEventNode` only shows the table preview while the instruction’s pending children still exist; once the restricted rolls are resolved the preview disappears, matching other tables’ behaviour. Pending previews for both table IDs are registered in `PENDING_PREVIEW_FACTORIES`.

For extraordinary powers, reuse `summarizePrimaryAbilities` or create a sister helper that formats descriptions; the key is keeping the text logic centralized so sentences don’t drift.

---

## 6. Tests

File: `src/tests/dungeon/unit/domain/treasureSwords.test.ts` (+ new `src/tests/dungeon/unit/adapters/treasureCompact.test.ts`)

Coverage includes:

- Compact text contains ability descriptions after resolving pending rolls.
- Roll-twice instructions remain collapsed until both restricted rolls resolve.
- Table previews behave: one standard preview stays visible during instructions, restricted previews appear only while pending, and they disappear once resolved.
- Extraordinary power path verifies aggregations still work (makes sure we didn’t lose the multiplier logic).
- Compact treasure rendering test ensures top-level sentences include ability text.

When cloning this for extraordinary powers, mirror the testing layout: one test per behaviour (pending roll, instruction, preview lifecycle, compact sentence) to avoid multi-purpose assertions that mask regressions.

---

## 7. Rendering Helpers & Shared Types

- `TreasureSwordPrimaryAbilityResult` lives in the tables module so every layer imports the same shape—no duplicate type literals in resolvers, renderers, or outcome tree helpers.
- `PrimaryAbilitySummary` exported from the renderer is intentionally generic (`ability`, `count`, `description`). That made it trivial to reuse in treasure rendering without importing render-only code into domain logic.

---

## 8. Tips for “Extraordinary Powers”

1. **Decide the table shape up front.** If you need restricted variants (e.g., “re-roll ignoring high values”), build them now; copying the primary ability pattern prevents headaches later.
2. **Follow the checklists** in:
   - [ADDING_SUBTABLES.md](./ADDING_SUBTABLES.md) for resolver/registry/outcome-tree plumbing.
   - [STRUCTURED_TREASURE_OUTPUTS.md](./STRUCTURED_TREASURE_OUTPUTS.md) for preview coordination.
3. **Keep descriptions centralized.** Add a `describe...` helper with template strings and multiplier handling; renderers and tests should never hard-code phrasing.
4. **Mind preview lifecycle.** Restricted tables should only surface while rolls are pending; once resolved, ensure `previewForEventNode` returns `undefined`.
5. **Test the full flow.** Unit tests should:
   - Force deterministic rolls (standard + restricted).
   - Assert pending roll queues.
   - Check compact/detail copy.
   - Verify preview deduping.

Following this playbook should let us wire Extraordinary Powers with far less churn than the primary ability pass.
