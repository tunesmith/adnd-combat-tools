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
- Create `src/dungeon/services/adapters.ts` to call `passageResults` and `doorBeyondResult`. Inspect each sub-service’s actual outputs and capture them into a minimal, typed structure for rendering. Do not guess shapes; reflect what the services currently emit and iterate.

5) Render results
- Map adapter output to formatted UI (paragraphs/bullets); preserve a session list of steps with newest first; clear button.

6) Types and return-shape convergence
- After inspecting outputs, introduce minimal `DungeonStep`/`DungeonMessage` in `src/types/` that match reality; update adapters + page accordingly.

7) Refactor services (non-breaking)
- Update `passageResults`/`doorBeyondResults` (or wrappers) to return typed collections instead of console logging; keep logs via a thin wrapper to avoid breaking any existing usage; update tests.

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
- Next: Step 4 — Service adapter layer
