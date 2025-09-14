# Dungeon Refactor Plan

This document proposes a focused refactor of the dungeon feature to reduce duplication, clarify responsibilities, and make future changes easier and safer. It keeps current UI output and behavior intact while tightening the underlying model.

## Goals
- Remove logic duplication between legacy string services and typed message services.
- Separate domain resolution (what happened) from presentation (how it renders).
- Make index.tsx shorter and more declarative via a table‑resolver registry.
- Keep strict typing; no `any`. Preserve current UI output during migration.

## Pain Points Observed
- Redundant logic in services:
  - `src/dungeon/services/passage.ts` contains both `getPassageResult()` (legacy string) and `passageMessages()` (typed). They implement parallel switch logic; the latter even falls back to the former for text in non‑detail mode.
  - Similar string vs. typed duplicates exist across side passage, passage width, special passage, etc.
- Presentation leakage into services:
  - Many services return `DungeonMessage`/`DungeonTablePreview` (view models) and assemble sentences directly.
  - Compact vs. detail branching is embedded in services, causing them to care about UI flow and staging.
- `src/pages/dungeon/index.tsx` is long and imperative:
  - Large `if/else` chain dispatching by `tp.id`, with repeated patterns: resolve → replace block → auto‑collapse → mark resolved.
  - Several custom branches differ only in heading strings and the resolver to call.

## Core Recommendations

1) Introduce a small Domain Outcome model (AST)
- Add a new domain‑level result type separate from render nodes:
  - `DungeonOutcomeNode` (discriminated union) describing resolved events and pending rolls as values, not strings.
  - Examples:
    - `{ type: "event", event: { kind: "periodicCheck", result: PeriodicCheck.ContinueStraight }, roll: 9 }`
    - `{ type: "pending-roll", table: "doorLocation", context?: TableContext }`
    - Nested children for sub‑flows (e.g., Special Passage → Stream Construction → Boat Bank).
- Keep using existing enums (e.g., `PeriodicCheck`, `DoorLocation`, etc.) for `result` payloads.

2) Add adapters from Domain → Render
- Implement two pure adapters:
  - `toDetailRender(outcome): DungeonRenderNode[]` (inserts table previews for pending rolls, shows roll bullets and traces).
  - `toCompactRender(outcome): DungeonRenderNode[]` (omits previews and traces, renders the same sentences we have today).
- During migration, ensure generated text matches current output exactly (snapshot tests recommended where feasible).

3) Collapse legacy and typed services into single resolvers
- For each service, expose one resolver that returns `DungeonOutcomeNode`. Remove (or deprecate) string functions like `getPassageResult()`/`...Result()`.
- Example (`passage.ts`):
  - Replace parallel logic with `resolvePeriodicCheck({ roll?, level, avoidMonster? }): DungeonOutcomeNode`.
  - Subtables (side passages, turns, stairs, etc.) also return outcomes.
  - Only adapters determine compact/detail rendering.
- Update `wanderingMonsterResult` to consume outcomes instead of gluing strings.

4) Introduce a Table Resolver Registry for index.tsx
- Define a `TableIdBase` union for common tables (e.g., `"periodicCheck" | "sidePassages" | "passageTurns" | "stairs" | "doorLocation" | ...`).
- Normalize preview ids to `base[:param[:param...]]`; use `base = id.split(":")[0]` for lookup.
- Create:
  - `TABLE_RESOLVERS: Record<TableIdBase, (opts: { roll: number; id: string; context?: TableContext }) => DungeonOutcomeNode>`
  - `TABLE_HEADINGS: Record<TableIdBase, string>` used by the generic block‑replacement helper.
- Add `resolveViaRegistry(tp, feedItemId, usedRoll, setFeed, setCollapsed, setResolved)`:
  - Parses `base` from `tp.id`.
  - Looks up resolver and heading. If found, resolves, converts outcome → render nodes (detail adapter), calls the existing `updateResolvedBlock`, and toggles collapse/resolved. Returns `true` if handled.
- Keep bespoke branches only where flow truly differs:
  - `passageWidth` (Special Passage staging)
  - `periodicCheckDoorOnly:*` and `doorLocation:*` (chain context and insertion logic)
  - `numberOfExits` (needs dimension context)

5) Extract small UI utilities
- `parseTableId(id: string): { base: string; params: string[] }`.
- `makeTablePreview(tableSpec): DungeonTablePreview` to cut preview boilerplate.
- `markResolved(feedItemId, tp.id, messages, headingText)` wrapper consolidating `updateResolvedBlock + collapse/resolved` toggles.

## Proposed Domain Types (sketch)

```ts
// src/dungeon/domain/outcome.ts
export type OutcomeEvent =
  | { kind: "periodicCheck"; result: PeriodicCheck }
  | { kind: "sidePassages"; result: SidePassages }
  | { kind: "passageTurns"; result: PassageTurns }
  | { kind: "stairs"; result: Stairs }
  | { kind: "roomDimensions"; /* payload */ }
  | { kind: "chamberDimensions"; /* payload */ }
  | { kind: "trickTrap"; /* payload */ }
  | { kind: "doorLocation"; result: DoorLocation }
  | { kind: "specialPassage"; result: SpecialPassage }
  | { kind: "riverConstruction"; result: RiverConstruction }
  | { kind: "riverBoatBank"; result: RiverBoatBank }
  | { kind: "chasmDepth"; result: ChasmDepth }
  | { kind: "chasmConstruction"; result: ChasmConstruction }
  // etc.

export type PendingRoll = { type: "pending-roll"; table: string; context?: TableContext };

export type OutcomeEventNode = {
  type: "event";
  event: OutcomeEvent;
  roll?: number;
  children?: DungeonOutcomeNode[];
};

export type DungeonOutcomeNode = OutcomeEventNode | PendingRoll;
```

Adapters live under `src/dungeon/adapters/render.ts`:
- `toDetailRender(node: DungeonOutcomeNode): DungeonRenderNode[]`
- `toCompactRender(node: DungeonOutcomeNode): DungeonRenderNode[]`

## Migration Plan

Phase 0 — Baseline and tests
- Add unit tests around current UI message strings for key flows (passage → chamber, door chains, special passage subtables, exits). Snapshot tests for render nodes are ok.

Status: In progress. TypeScript checks and existing test suite pass. Parity snapshot tests will be added before Phase 2 to guard against drift as we convert more services.

Phase 1 — Domain outcome and adapters (no UI change)
- Introduce `DungeonOutcomeNode` (as above) and render adapters.
- Implement a single POC resolver: Periodic Check → outcomes, and adapt `passageMessages()` to use it via adapter for both modes. Keep `getPassageResult()` temporarily for `wanderingMonsterResult`.

Status: Completed. Implemented outcome + adapters for Passage (Periodic Check) and Door Beyond. Parity confirmed via tests.

Phase 2 — Replace string services incrementally
- Convert `sidePassage`, `passageTurn`, `stairs`, `specialPassage` chains to return outcomes. Wire their typed `...Messages()` through the adapters. Remove corresponding `...Result()` string functions after consumers migrate.
- Update `wanderingMonsterResult` to compose outcomes (location + monster) instead of strings; then remove `getPassageResult`.

Status: Completed. Migrated Side Passages, Passage Turns, Stairs, and the Special Passage chain to the outcome model and routed their typed `...Messages()` through the render adapters. Legacy string functions retained only where still referenced (e.g., compact composition helpers for special passage) to preserve text parity.

Phase 3 — Registry refactor for index.tsx
- Add `TableIdBase`, `TABLE_RESOLVERS`, `TABLE_HEADINGS` and `resolveViaRegistry`.
- Route generic `tp.id` cases through the registry early in `renderNode`’s resolver branch (or a dedicated handler). Preserve bespoke flows for door chains, `numberOfExits`, and `passageWidth`.
- Extract helpers: `parseTableId`, `markResolved`, and `makeTablePreview`.
- Result: most of the long `if/else` chain disappears; index.tsx shrinks meaningfully.

Status: Completed. Added a typed registry in `index.tsx` with:
- `TableId` union derived from `TABLE_ID_LIST` and `isTableId` type guard
- `TABLE_RESOLVERS` and `TABLE_HEADINGS` as `Record<TableId, ...>`
- `resolveViaRegistry(...)` that safely narrows ids and rewrites the preview block via `updateResolvedBlock`

Also removed now-unreachable branches from `resolvePreview` for ids handled by the registry and replaced dynamic `require(...)` calls with static imports.

Phase 4 — Cleanup and parity checks
- Remove legacy string paths and eliminate duplicated sentences living in services.
- Ensure compact/detail adapters match previous output. Keep minor deltas documented if any are intended.

Status: In progress/partial. Most legacy string paths remain only as helpers for compact text composition or for external references (e.g., `getPassageResult` for compact parity). Removing them is optional and can be done table-by-table after adding coverage.

## Current Status Summary
- Build: `tsc` passes.
- Tests: 86/86 passing (parity + WM coverage added).
- Outcomes/adapters: Periodic Check, Side Passages, Passage Turns, Stairs, Special Passage, Door Beyond are outcome-driven with detail/compact adapters.
- Door chain: Now fully service/adapter-driven in detail mode (doorLocation <-> periodicCheckDoorOnly chain) and compact mode (composed text). Page-level bespoke logic removed; routed via registry.
- Wandering Monster:
  - Compact: Adapter composes where-from + monster text; no legacy dependency.
  - Detail: Stages Where-From (with recursion: Door/Side/Turn/Chamber/Stairs) and Monster Level preview; Level 1 Human subtable; Levels 2–6 monster tables with dragon subtables (3, 4-younger/older, 5-younger/older, 6) and detailed dragon paragraphs.
  - Deterministic: Detail resolvers render text for the exact rolled entry; no hidden re-rolls.
- Dungeon Level UI: Level 1–16 selector; previews and WM flows derive monster level tables from current selection; context threads level to subtables.
- Legacy removal:
  - `closedDoorResult` removed.
  - Adapters no longer call `getPassageResult`.
  - `getPassageResult` retained only for legacy parity tests and legacy `wanderingMonsterResult` (test usage only); not used by UI/adapters.
- Preview rows: Derived from table definitions for Periodic Check (minus WM), DoorWhereFrom chain, Monster Level 1–6, and dragon subtables.

### Periodic Check Modernization Status

Detail mode (adapters + previews)
- ContinueStraight (1–2): Modernized. Paragraph only; no preview needed.
- Door (3–5): Modernized. Paragraph + Door Location preview (with door-chain context).
- SidePassage (6–10): Modernized. Paragraph + Side Passages preview.
- PassageTurn (11–13): Modernized. Paragraph + Passage Width preview staged.
- Chamber (14–16): Modernized. Paragraph + Chamber Dimensions preview.
- Stairs (17): Modernized. Paragraph + staged subtables (Egress/Chute/Chamber) as previews.
- DeadEnd (18): Modernized. Paragraph only; no preview needed.
- TrickTrap (19): Partially modernized. Shows a Trick/Trap preview stub; underlying table not implemented yet.
- WanderingMonster (20): Not modernized. Delegates to legacy string path; no previews yet for its chain.
Updated: Compact path is adapter-only; detail stages Where-From and Monster Level previews with subtables as above. Remaining: convert to outcome node if desired.

Compact mode (current behavior and dependency)
- All Periodic Check outcomes currently route through the legacy `getPassageResult(...)` for exact text parity. This includes Door (which uses the legacy door-chain logic), Trick/Trap, and Wandering Monster.
- Many cases are “ready to switch” to fully modern compact text (ContinueStraight, SidePassage, PassageTurn, Chamber, Stairs, DeadEnd) once we stop depending on `getPassageResult` globally. Door and Wandering Monster require outcome work to match legacy chains.

What remains to remove legacy strings from Periodic Check
- Door chain outcome: Model the closed-door chain as a structured outcome (first door location, possible repeats, recheck branch). Use compact adapter to compose the same single-paragraph text; keep detail adapter in preview mode (already done).
- Wandering Monster outcome: Compose the “where-from” (Periodic Check sans WM), monster level/type, and counts as outcomes; detail adapter can stage previews, compact composes text. Replace `wanderingMonsterResult` usage.
- Trick/Trap table: Replace the stub with a real table; both detail and compact then become purely adapter-driven.

Test strategy for the switch
- Keep existing parity tests; switch compact adapters to generate text directly (no calls to legacy). Tests continue to assert exact strings, so they guard against drift while enabling deletion of legacy helpers.
- After Door chain + Wandering Monster outcomes land, delete `getPassageResult` and associated legacy result functions (or move to a `legacy/` module during a short transition).

## What Could Still Be Done (Optional)
- Door chain structure: Avoid parsing bullet text in `doorLocation:*` by carrying a structured outcome for door location results alongside messages. This would simplify the chain logic and remove incidental string parsing.
- Extract registry to a module: Move `TableId`, `TABLE_RESOLVERS`, `TABLE_HEADINGS`, and `resolveViaRegistry` to a small helper file to further reduce `index.tsx` size.
- Normalize return types: Ensure all `...Messages()` consistently return `DungeonRenderNode[]` (most already do) and eliminate legacy union return type hints.
- Tighten test helpers: Remove the small `any` usage in parity test type guards by adding local predicates.
- Consider outcome model for Exits: `numberOfExits` could become an outcome node using the current context (length/width/isRoom) to further unify flows; keep behavior identical.
- (Longer term) Room/Chamber previews via registry: With careful handling of bespoke replacement rules, these could be partially routed through the registry for consistency.

## Notes on Behavior Parity
- Compact vs detail: Compact text remains exactly as before; detail mode stages previews and respects prior UI/UX.
- Special Passage subtables: `detailMode: true` is used consistently; when a roll is supplied, output is the same, and when no roll is provided, the table renders as a preview.
- Bespoke flows retained: Door chain (`doorLocation:*`, `periodicCheckDoorOnly:*`), `passageWidth` special handling, `numberOfExits` with dimension context, and the `periodicCheck` root remain explicitly handled.

## Suggested Next Steps
- Remove remaining legacy string functions once their callers are fully outcome-based and parity-tested.
- Add targeted parity tests around door chain structured handling if we move away from label parsing.
- Begin new feature work on top of the now-simplified adapters/registry foundation.

## Updated Remaining Work (as of now)
- `getPassageResult` has been removed and tests now assert adapter outputs directly. `wanderingMonsterResult` composes its where-from prefix via `services/compactWhereFrom`.
- Phase 1 progress: `compactPeriodicText` no longer calls `sidePassageResults`, `passageTurnResults`, or `stairsResult`; compact strings for these are composed directly. Width special-cases still rely on `specialPassageResult`, and `UpOneDownTwo` still appends `chamberResult` (to be migrated in later phases).
- Trick/Trap: Replace stub with a real table and messages, derive preview rows, and add any required subtables.
- Door chain outcome (optional): Model door chain as a structured outcome (doorLocation sequence + rechecks) to avoid string-based label parsing in UI.
- Registry extraction (optional): Move TABLE_ID_LIST/HEADINGS/RESOLVERS + `resolveViaRegistry` to a helper module.
- Normalize compact composition: `compactPeriodicText` currently reuses a few legacy service strings for exact parity; migrate to pure adapter strings once parity coverage is locked.
- Minor typings: Remove leftover `any` in tests by adding small type guards where convenient.

### Remaining Legacy String Producers To Migrate
These services still return legacy strings or mix composition logic and must be migrated to outcome resolvers + adapters (then removed):

- `src/dungeon/services/chamberResult.ts`
  - `chamberResult()`
- `src/dungeon/services/doorBeyondResult.ts`
  - `doorBeyondResult()`
- `src/dungeon/services/exitResult.ts`
  - `exitResult()`
- `src/dungeon/services/passageTurn.ts`
  - `passageTurnResults()`
- `src/dungeon/services/passageWidth.ts`
  - `passageWidthResults()`
- `src/dungeon/services/roomResult.ts`
  - `roomResult()`
- `src/dungeon/services/sidePassage.ts`
  - `sidePassageResults()`
- `src/dungeon/services/specialPassage.ts`
  - `specialPassageResult()`
- `src/dungeon/services/stairsResult.ts`
  - `stairsResult()`
  - `egressResult()` (indirect via `egressMessages` exists; add resolver version)
  - `chuteResult()` (indirect via `chuteMessages` exists; add resolver version)
- `src/dungeon/services/unusualShapeResult.ts`
  - all `...Result()` methods (e.g., `unusualShapeResult()`, circular/hex/etc. buckets)
- `src/dungeon/services/unusualSizeResult.ts`
  - `unusualSizeResult()`
- `src/dungeon/services/wanderingMonsterResult.ts`
  - `wanderingMonsterResult()` (aggregator; UI no longer calls it — replace fully with outcome/adapters or remove)

Notes:
- Some message-oriented helpers (e.g., `...Messages`) already exist and route through adapters; the goal is to have matching `resolve...()` outcome functions and eliminate `...Result()` string functions entirely.
- We introduced `services/compactWhereFrom.ts` to consolidate compact-mode composition for “where-from” and door-chain text; this should be subsumed by outcome traversal once compact adapters stop reusing legacy service strings.

### Migration Outline (per service)
- Create `resolveXxx(...) => DungeonOutcomeNode` that encodes the event and any child pending rolls.
- Update `toDetailRender` and `toCompactRender` to map the new outcome (drop any special-casing and legacy string calls).
- Switch `...Messages` to resolve -> adapt and remove `...Result()`.
- Add/adjust tests to assert adapter text and preview staging; then delete the legacy function.

## Notes on Behavior Parity
- Compact mode keeps today’s sentences (no roll bullets or traces, no previews).
- Detail mode keeps staged previews, bullet list of rolls, auto‑collapse after resolve, and caret behavior.
- Root “Passage/Door” heading remains suppressed in detail mode.
- Door chain rules remain unchanged (ahead ends chain; repeated lateral ends chain with explanatory text).

## What This Buys Us
- One source of truth for dungeon logic (outcomes), with adapters for any view (compact/detail now, or future LLM narration or export formats).
- Less imperative branching in `index.tsx` via registry dispatch.
- Services stop caring about presentation concerns and become easier to test.
- Adding new tables becomes: define table + outcome resolver + register. UI wiring becomes mechanical.

## Risks and Mitigations
- Risk: Subtle text drift in compact mode. Mitigation: snapshot tests on adapters before removing legacy strings.
- Risk: Registry mismatch on dynamic ids (e.g., `unusualSize:N`). Mitigation: `parseTableId()` helper and resolver‑specific param parsing.
- Risk: Over‑abstraction. Mitigation: migrate incrementally; prioritize high‑duplication areas first (passage, special passage chain) and keep exceptions explicit.

## Concrete First Changes (suggested order)
- Add `src/dungeon/domain/outcome.ts` with the union sketches and small helpers.
- Add `src/dungeon/adapters/render.ts` with compact/detail adapters mapping outcomes to the existing `DungeonRenderNode` shapes and exact strings.
- Refactor `passageMessages()` to use the outcome resolver + adapters; keep `getPassageResult()` only for `wanderingMonsterResult` initially.
- Add registry scaffolding (`TABLE_RESOLVERS`, `TABLE_HEADINGS`, `resolveViaRegistry`) and route 3–4 straightforward tables through it (e.g., `sidePassages`, `passageTurns`, `stairs`).
- Extract and reuse `updateResolvedBlock` + collapse/resolved toggles via `markResolved()`.

## Longer‑Term (optional)
- Compose a richer Outcome graph to encode distances, lengths, and numeric data rather than embedding text in adapters, enabling alternate renderers (e.g., dramatic narration via LLM, export to VTT, or stateful map generation).

## Phased Migration Plan

We will track progress and keep this guide updated as code lands. When a phase completes or scope changes, update this section accordingly.

- Phase 0 — Lint & Type Checks
  - Goal: tighten quality gates to catch issues early.
  - Actions: run `next lint` and TypeScript checks regularly; add CI steps. Prefer adding ESLint plugins for TypeScript rules (see notes below) and a `lint:all` script that runs both ESLint and `tsc`.

### Linting Improvements (Phase 0 details)
- Scripts added:
  - `npm run lint:types` → `tsc -p tsconfig.json` to enforce TS rules in tests/build (ts-jest transpiles without type checking).
  - `npm run lint:all` → runs ESLint + TypeScript checks.
- Recommended ESLint setup for stronger TypeScript linting (requires network to install devDeps):
  - Install dev dependencies:
    - `@typescript-eslint/eslint-plugin`
    - `@typescript-eslint/parser`
    - `eslint-plugin-import`
    - `eslint-plugin-unused-imports`
  - Example `.eslintrc.json`:
    {
      "extends": ["next/core-web-vitals", "plugin:@typescript-eslint/recommended", "prettier"],
      "parser": "@typescript-eslint/parser",
      "plugins": ["@typescript-eslint", "import", "unused-imports"],
      "rules": {
        "@typescript-eslint/no-explicit-any": "error",
        "@typescript-eslint/no-unnecessary-type-assertion": "warn",
        "@typescript-eslint/consistent-type-imports": ["warn", { "fixStyle": "separate-type-imports" }],
        "unused-imports/no-unused-imports": "warn",
        "import/no-extraneous-dependencies": ["error", { "devDependencies": ["**/src/tests/**"] }]
      }
    }
  - For type-aware rules (e.g., no-unnecessary-type-assertion), add:
    - `parserOptions.project: ["./tsconfig.json"]`
  - Run `npm run lint:all` locally and in CI.

- Phase 1 — Replace easy compact strings in adapters
  - Goal: stop reusing legacy string functions for simple flows (side passages, turns, stairs) in compact mode.
  - Actions: compose compact text directly in adapters for these cases; keep behavior identical with tests.

- Phase 2 — Encode staging as outcome children
  - Goal: move preview staging logic from adapters into resolvers by adding `children` pending-roll nodes.
  - Actions: enrich resolvers (periodic check, stairs, special passage, rooms/chambers) to return `DungeonOutcomeNode` with `children` for subtables.

- Phase 3 — Model exits and unusual tables as outcomes
  - Goal: migrate `exitResult`, `unusualShapeResult`, and `unusualSizeResult` to resolvers; adapters map outcomes to render nodes.
  - Actions: add `resolveNumberOfExits`, `resolveUnusualShape`, and `resolveUnusualSize`, thread required context through outcomes.

- Phase 4 — Remove remaining legacy string functions
  - Goal: delete all `...Result()` functions once callers are on outcome/adapters and tests cover parity.
  - Actions: remove string helpers, update refs, and keep this guide synchronized with the actual code state.

Notes on keeping this guide current
- As part of each PR that changes refactor scope or completes a migration step, update this document (sections: Remaining Legacy String Producers, Updated Remaining Work, and Phased Migration Plan) so it remains the source of truth.
