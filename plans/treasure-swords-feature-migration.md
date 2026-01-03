# Treasure Swords Feature Migration Plan

## Goal

Migrate **Swords (Table G)** and its subtables into the **features-first** architecture so that:

- `src/dungeon/features/treasure/**` becomes the single source of truth for swords behavior (resolver + pending + registry + render + previews).
- Legacy integration points (`baseTables`, `domain/resolvers.ts`, large render/registry/outcomeTree switches) can shrink and eventually delete sword-specific code.
- Table ids, outcome kinds, and UI preview behavior remain stable (parity).

This plan is written to align with `plans/dungeon-architecture-strategy.md`.

## Scope (what “Swords” includes)

Primary table + subtables currently represented by these **table ids**:

- `treasureSwords`
- `treasureSwordKind`
- `treasureSwordUnusual`
- `treasureSwordPrimaryAbility`
- `treasureSwordPrimaryAbilityRestricted`
- `treasureSwordExtraordinaryPower`
- `treasureSwordExtraordinaryPowerRestricted`
- `treasureSwordDragonSlayerColor`
- `treasureSwordSpecialPurpose`
- `treasureSwordSpecialPurposePower`
- `treasureSwordAlignment`
- `treasureSwordAlignmentChaotic`
- `treasureSwordAlignmentLawful`

Non-goal: change copy/wording or UI behavior (unless needed for parity).

## Current System Inventory (where swords lives today)

### Lookup data (keep as-is)

- `src/tables/dungeon/treasureSwords.ts`
  - Table data + enums + shared description helpers:
    - `treasureSwords`, `treasureSwordKind`, `treasureSwordUnusual`, `treasureSwordPrimaryAbility*`, `treasureSwordExtraordinaryPower*`,
      `treasureSwordSpecialPurpose`, `treasureSwordSpecialPurposePower`, etc.
    - description/detail maps and helpers (e.g. `describeSwordPrimaryAbility`, `describeSwordExtraordinaryPower`, `describeSwordSpecialPurpose`, `dragonSlayerColorTableForAlignment`, etc.)
- `src/tables/dungeon/treasureSwordAlignment.ts`
  - `treasureSwordAlignment*` tables + `SWORD_ALIGNMENT_DETAILS`.

### Domain contracts (stable)

- `src/dungeon/domain/outcome.ts`
  - Sword outcome kinds and result shapes:
    - `treasureSwords`, `treasureSwordKind`, `treasureSwordUnusual`, `treasureSwordPrimaryAbility`, `treasureSwordExtraordinaryPower`,
      `treasureSwordSpecialPurpose`, `treasureSwordSpecialPurposePower`, `treasureSwordDragonSlayerColor`, `treasureSwordAlignment`.
- `src/types/dungeon.ts`
  - Sword-related `TableContext` variants:
    - `treasureSword*` contexts (slotKey/rollIndex/tableVariant/alignment fields).

### Legacy resolver logic (to migrate out)

- `src/dungeon/domain/resolvers.ts`
  - Functions (currently exported) implementing all sword resolution + nested pending-roll creation:
    - `resolveTreasureSwords`
    - `resolveTreasureSwordKind`
    - `resolveTreasureSwordUnusual`
    - `resolveTreasureSwordPrimaryAbility` (+ restricted via options)
    - `resolveTreasureSwordExtraordinaryPower` (+ restricted via options)
    - `resolveTreasureSwordSpecialPurpose`
    - `resolveTreasureSwordSpecialPurposePower`
    - `resolveTreasureSwordDragonSlayerColor`
    - `resolveTreasureSwordAlignment` (+ chaotic/lawful via options)
  - Plus a collection of helpers that must move with them to preserve ids/context:
    - pending builders (`buildSwordPrimaryAbilityPending`, `buildSwordExtraordinaryPowerPending`, `buildSwordSpecialPurposePending`, etc.)
    - node id helpers (`primaryAbilityNodeId`, `extraordinaryPowerNodeId`, `specialPurposeNodeId`, etc.)
    - alignment instruction helpers (`determineSwordAlignmentInstruction`, `applySwordAlignmentInstruction`, `buildPendingSwordAlignmentNode`, etc.)

### Legacy table registration (to delete/migrate)

- `src/dungeon/features/baseTables/index.ts`
  - Currently defines *all* sword tables (ids listed above) as “base tables” backed by:
    - domain resolvers from `src/dungeon/domain/resolvers.ts`
    - render + preview helpers from `src/dungeon/adapters/render/treasureSwords.ts`
    - bespoke registry/pending context parsing helpers (`readTreasureSwordContext`, `readSwordPrimaryAbilityContext`, etc.)
  - This is the key “indirection” we want to remove by moving swords into treasure features.

### Rendering + previews (to migrate out)

- `src/dungeon/adapters/render/treasureSwords.ts`
  - Renderers (detail + compact) for all sword event kinds.
  - Preview factories for all sword table ids (including restricted variants).
  - Shared summarizers used by treasure rendering (e.g. “primary ability summaries” that feed top-level treasure compact text).
- `src/dungeon/adapters/render/treasure.ts`
  - Uses sword rendering/summarization for inclusion in top-level treasure messages.

### Engine glue (sword-specific, ideally removable later)

- `src/dungeon/helpers/outcomeTree.ts`
  - `propagateSwordAlignmentInfo`: updates pending-roll contexts and some event payloads so alignment-dependent subtables behave correctly.
- `src/dungeon/helpers/registry.ts`
  - `resolvePendingTargetId` special-cases slot-key matching for:
    - `treasureSwordSpecialPurpose`, `treasureSwordSpecialPurposePower`, `treasureSwordDragonSlayerColor`
- `src/dungeon/adapters/render.ts`
  - Sword-specific preview lifecycle handling:
    - suppressing duplicate previews in nested ability tables
    - deriving preview contexts from node ids for primary/extraordinary ability variants

### Feature callers / dependencies

- `src/dungeon/features/treasure/magicCategory/magicCategoryResolvers.ts`
  - Can enqueue `treasureSwords` as a pending roll (so `treasureSwords` must remain a first-class feature table id).
- Tests with strong parity expectations:
  - `src/tests/dungeon/unit/domain/treasureSwords.test.ts`
  - `src/tests/dungeon/unit/adapters/treasureCompact.test.ts`
  - `src/tests/dungeon/integration/**` (multiple passage/door flows reference `treasureSwords` previews and outcomes).

## Proposed Feature Layout (target state)

Create a new folder:

- `src/dungeon/features/treasure/swords/`
  - `manifest.ts` — exports `swordsTables: ReadonlyArray<DungeonTableDefinition<...>>`
  - `swordsResolvers.ts` — all sword resolver functions (and their helper builders/id helpers)
  - `swordsRender.ts` — renderers and any shared sword summary helpers needed by `treasure.ts`
  - `swordsPreview.ts` (optional) — preview factories; can also live in `swordsRender.ts` if preferred
  - `swordsContext.ts` (optional) — slotKey/context parsing helpers used by `registry` / `resolvePending`

Then include `...swordsTables` in `src/dungeon/features/treasure/index.ts` (like other treasure features).

## Migration Phases (recommended)

Swords is big enough that doing this in one commit is risky; this is a “multi-commit, parity-first” sequence.

### Phase 0 — Baseline + guardrails

- Record current behavior via tests:
  - Run `npm run tsc`
  - Run `npm test` (at least the sword-related suites above)
- Capture the current table id list and ensure we keep them unchanged.

### Phase 1 — Introduce swords feature definitions (no behavior change)

Goal: swords appears under `src/dungeon/features/treasure/` as a feature bundle *while still delegating to existing implementations*.

- Add `src/dungeon/features/treasure/swords/manifest.ts` defining all sword table ids listed above.
- Wire `manifest.ts` into `src/dungeon/features/treasure/index.ts`.
- Initially, the feature can call through to existing resolver/render functions to keep diff small.
  - Follow-up phases will move the actual code so we can delete legacy modules.

Checkpoint: `npm run tsc` and `npm test` remain green.

### Phase 2 — Move resolver logic out of `domain/resolvers.ts`

Goal: `src/dungeon/domain/resolvers.ts` no longer owns sword-specific logic.

- Move the resolver functions + helper builders/id helpers into `src/dungeon/features/treasure/swords/swordsResolvers.ts`.
- Update the swords feature definitions to point at the new resolver functions.
- Delete the moved exports from `src/dungeon/domain/resolvers.ts` and clean up imports.

Checkpoint: `npm run tsc` and sword tests pass; table ids and node ids remain stable.

### Phase 3 — Move render + preview logic out of `adapters/render/treasureSwords.ts`

Goal: swords render logic becomes a treasure feature concern.

- Move sword renderers + preview factories into `src/dungeon/features/treasure/swords/swordsRender.ts` (and `swordsPreview.ts` if split).
- Update `src/dungeon/features/treasure/swords/manifest.ts` to use the new renderers.
- Update any non-feature callers (likely `src/dungeon/adapters/render/treasure.ts`) to import summaries from the new feature location.
- Delete (or drastically shrink) `src/dungeon/adapters/render/treasureSwords.ts` once unused.

Checkpoint: `npm run tsc`, `npm run lint`, and tests pass.

### Phase 4 — Remove swords from `baseTables` (delete indirection)

Goal: `src/dungeon/features/baseTables/index.ts` no longer defines swords tables.

- Remove the sword `DungeonTableDefinition`s from `BASE_TABLE_DEFINITIONS`.
- Remove now-dead sword-only helper functions from `baseTables/index.ts` (context readers, restricted wrappers, etc.).
- Ensure `src/dungeon/features/bundle.ts` still exposes all sword tables via the treasure bundle.

Checkpoint: `npm run tsc` and tests pass.

### Phase 5 (optional but desirable) — Reduce engine sword special-casing

This phase targets the remaining sword-specific logic outside the feature folder.

Candidates:

- `src/dungeon/helpers/outcomeTree.ts`:
  - Try to eliminate `propagateSwordAlignmentInfo` by ensuring alignment is discoverable via ancestors during pending resolution,
    or by setting alignment on pending contexts at creation time where possible.
- `src/dungeon/helpers/registry.ts`:
  - If feasible, move slotKey matching for special purpose/dragon slayer into feature-specific registry behavior or normalize id conventions
    so generic `targetId` matching works without special-case code.
- `src/dungeon/adapters/render.ts`:
  - Move preview suppression/context-derivation behavior behind feature preview factories where possible.

This may be deferred if it’s too risky; the “big win” is Phases 1–4.

## Parity / Acceptance Criteria

We consider the migration successful when:

- All sword table ids remain the same and resolve correctly from:
  - pending rolls
  - reroll dialogs (registry)
  - preview rendering (detail/compact)
- The sword behavior (including roll-twice instructions and restricted subtables) matches existing tests.
- Swords are removed from `baseTables`, and sword resolvers/renderers are no longer located in the legacy monolith files.

## Notes

- `doc/PrimaryPowers.md` contains helpful implementation notes for primary abilities and is worth keeping during this migration.
- Keep changes “parity-first”: avoid rewording output strings unless tests force it.

