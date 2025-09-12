# Dungeon Page – Delivery Plan

This plan outlines a commit-by-commit approach to add a third user-facing tool: the “Dungeon” page at `/dungeon`, matching the existing look & feel (maroon theme, CSS Modules). We will keep this file updated as we work.

## Milestones and Commit Steps

1) Scaffold page and navigation
- Add `src/pages/dungeon/index.tsx` with shared layout/style; link from home labeled “AD&D Random Dungeon Generator”.

2) Basic UI shell
- Action switcher ("passage" | "door"), number input (1–20), Roll button, Submit button; client-side validation; disabled-submit until valid. Output shows a running feed of steps (clear on refresh, no persistence). Note future option: allow manual rolls for recursive sub-steps.

3) Dice utilities review + tests
- Reuse existing `rollDice` in `src/dungeon/helpers/dungeonLookup.ts`. Add light wrappers/guards only if needed (e.g., clamp 1–20 for UI). Added unit tests under `src/tests/dungeon/helpers/dungeonLookup.test.ts` for single and multiple rolls.

4) Service adapter layer
- Create `src/dungeon/services/adapters.ts` to call `passageResults` and `doorBeyondResult`. Capture outputs into a minimal, typed structure (`DungeonStep` with `messages`) for rendering. Unit tests for adapters included.

5) Render results
- Map adapter output to formatted UI (split into readable sentences/paragraphs); present as styled cards with action chips and prominent roll; include Clear Feed; newest first.

6) Types and return-shape convergence
- Introduce shared types in `src/types/dungeon.ts` (`DungeonMessage` union with paragraph/heading/bullet-list; `DungeonStep`). Update adapters and page to use these types and render nodes directly (no string parsing). This enables migrating services from string logs to typed results incrementally.

7) Refactor services (non-breaking)
- 7a: Door path — add typed variant that accepts an optional roll override and returns `DungeonMessage[]`; adapter uses it; keep legacy string export.
- 7b: Passage path — same approach for `passageResults`; then progressively type subtables.

8) Polish, a11y, and docs
- Keyboard navigation, aria-labels, focus management, empty states; README section + doc note; light CSS tune to match existing tools.

9) Final test pass and deploy prep
- Add/adjust tests; verify `basePath` links; manual test via `npm run dev:static`.

## Implementation Notes
- Files: `components/dungeon/*` for UI pieces; CSS with `*.module.css` alongside components.
- Keep logic pure in adapters; page handles only events/state.
- Do not introduce new deps unless agreed.

## Open Questions (Resolved)
- Navigation: Add a third link on the landing page labeled “AD&D Random Dungeon Generator”.
- Result display: Start with a single running feed of steps. Later, allow optional manual die rolls for recursive sub-steps.
- State persistence: No persistence; clear on refresh.
- Service entrypoints: Use `passageResults` and `doorBeyondResult` (note: singular) as confirmed.
- Output shape: Inspect service code to derive exact structures; avoid speculative shapes.

## How We’ll Use This File
- Each approved step becomes a PR commit; we’ll update this checklist with status and any adjustments before moving on.

## Status
- Completed: Step 1 — Scaffold page and navigation
- Completed: Step 2 — Basic UI shell (action selector, 1–20 input, Roll + Submit, validation, running feed)
- Completed: Step 3 — Dice utilities review + tests
- Completed: Step 4 — Service adapter layer (adapters created, wired into page, tests added)
- Completed: Step 5 — Render results (formatting/polish)
- Completed: Step 6 — Types and return-shape convergence (types added, adapters/page updated, tests adjusted)
- Completed: Step 7a — Door path typed wrapper; adapter uses typed messages
- Next: Step 7b — Passage path typed wrapper and gradual subtable typing

## Future Enhancement
- Add a structured Roll Trace (per-step and nested sub-rolls) so each parent action displays its own roll and any recursive rolls from subtables. Represent as a dedicated node (e.g., `kind: 'roll-trace'`) and render as an expandable list.
