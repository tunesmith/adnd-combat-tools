# Swapview Plan

## Context

The current dungeon feed stores only rendered message arrays. When the UI switches between compact and detail modes it has no access to the original `DungeonOutcomeNode` trees, so re-rendering in the other mode requires re-rolling subtables. The compact adapter even re-rolls missing children as it renders, which breaks determinism and prevents a seamless toggle.

## Goals

- Persist a single authoritative outcome tree for every feed entry so detail and compact views derive from the same data.
- Allow switching modes at any time (including mid-resolution) without re-rolling dice or losing partial progress.
- Ensure registry-driven preview resolutions update the stored tree first, then refresh the currently visible view.
- Keep adapters pure: no stateful mutations or hidden rolls during render.

## Non-goals

- Rewriting table data or resolvers beyond what is required to persist outcome trees.
- Changes to unrelated dungeon flows (e.g., generators outside the dungeon page).
- Adding new UI affordances beyond the mode toggle behaviour.

## Constraints & Guardrails

- Preserve existing detail and compact prose where possible; any copy edits should be deliberate.
- Avoid introducing `any`. Expand discriminated unions and helpers instead.
- Update or add Jest coverage for new behaviour, especially cross-mode toggling and partial renders.
- Run `npm run tsc`, `npm test`, `npm run format`, and `npm run lint` before each commit.

## Milestones

### 1. Persist Outcome Trees in the Feed _(status: complete)_

- Extend the feed item type to store both the raw `DungeonOutcomeNode` tree and cached render arrays.
- Update `runDungeonStep` (and services it delegates to) to return the base outcome tree alongside rendered nodes.
- Adjust existing callers/tests to handle the richer return type.
- Suggested commit: `dungeon: store outcome trees on dungeon feed items`.

### 2. Refactor Adapters for Deterministic Rendering _(status: complete)_

- Introduce helper(s) that render compact/detail nodes from an existing outcome tree without generating new rolls.
- Remove the implicit re-roll logic inside `toCompactRender` (and any similar helpers), replacing it with logic that respects unresolved children.
- Ensure compact rendering can omit unresolved previews while still showing available prose.
- Suggested commit: `dungeon: render compact/detail views from stored outcomes`.

### 3. Registry Updates to Mutate Stored Trees _(status: complete)_

- Change registry resolution so it updates the outcome tree within the target feed item before regenerating render nodes.
- Ensure partial progress (resolved vs. pending children) is reflected in both views when switching modes.
- Add utilities to splice resolved children into the tree while keeping TypeScript strict.
- Suggested commit: `dungeon: sync registry previews into feed outcome trees`.

### 4. Toggle & UI Synchronisation _(status: complete)_

- Replace the current `filterForDetail` / `filterForCompact` rendering with a mode-aware renderer that rebuilds messages from the stored tree for each view.
- Guarantee that toggling the detail checkbox reuses the latest tree and cached renders (recompute lazily if necessary).
- Keep roll traces and preview controls functional in detail mode.
- Suggested commit: `dungeon: recompute dungeon feed renders on mode switch`.

### 5. Outcome-First Table Flows _(status: complete)_

- Eliminate preview-only services by ensuring every dungeon table produces a `DungeonOutcomeNode` via a resolver.
- Register the new resolvers in `TABLE_RESOLVERS` so detail/compact renders always pull from the authoritative tree.
- Update renderers to handle any newly surfaced event kinds (e.g., pool, magic pool, transporter).
- Suggested commit: `dungeon: convert legacy preview tables to outcome-driven resolvers`.

### 6. Outcome Update Mechanics _(status: complete)_

- Introduce stable pending identifiers (e.g., hierarchical keys or indices) so each unresolved node can be uniquely addressed.
- Refine `applyResolvedOutcome` (and related helpers) to splice results into the exact pending node using those identifiers and target paths.
- Backfill tests that cover reroll/override flows for multi-step tables to confirm updates replace, rather than append, results.
- Suggested commit: `dungeon: target pending nodes when applying resolved outcomes`.

### 7. Verification & Polish _(status: complete)_

- Added integration coverage that uses the UI preview harness to exercise cross-mode toggling with staged chasm and circular pool flows.
- Expanded compact/detail assertions to ensure follow-up prose appears exactly once after resolution.
- Manual smoke tests verified the UI; documentation and inline comments now reflect the outcome-tree workflow.
- Suggested commit: `dungeon: cover swapview flow and update docs`.

### 8. Render Override Harness _(status: complete)_

- Extracted a reusable helper that drives the same `render → preview → resolveViaRegistry` loop the UI uses, rebuilding feed items from the shared outcome tree each time.
- Documented usage inside the UI harness and migrated dungeon roll/feed tests to call the helper directly.
- Render-layer regressions (missing context/target ids) now surface immediately in UI-level specs.
- Suggested commit: `dungeon: add ui-level preview harness`.

### 9. Render Layer Purification _(status: complete)_

- Special-passage, unusual-size, and circular pool/magic pool chains now use pure "describe" helpers that aggregate child outcomes for both detail and compact renderers.
- Previews are keyed by `targetId`, and the UI harness verifies the same output the browser shows.
- Remaining work: apply the same treatment to the remaining table families (e.g., number-of-exits, transporter chains in non-chamber contexts, any lingering ad-hoc string builders) and continue replacing inline concatenation with helpers.
- Suggested commit: `dungeon: purify preview adapters`.

### 10. Outcome Pipeline Unification _(status: complete)_

- Introduced `applyOutcomeRoll` in the registry helper so feed updates, UI toggles, and the Jest harness all splice resolved outcomes through the same helper.
- Updated `simulateDetailRun` and `resolveSequenceWithRolls` to consume the shared helper, keeping test coverage aligned with in-app behaviour.
- Simplified door-chain state to a single `existing` array while preserving the `repeated` guard so lateral duplicates stop the continuation chain cleanly.
- Suggested commit: `dungeon: unify detail/compact outcome updates`.

### 11. Retire Legacy Preview Services _(status: complete)_

- Removed `doorLocationMessages`, `periodicDoorOnlyMessages`, `trickTrapMessages`, and other legacy services in favour of pipeline-driven rendering.
- Updated parity and UI harness tests to call `runDungeonStep` / adapters directly so they exercise the shared outcome pipeline.
- Shared append-preview type extracted to `render/shared.ts`.
- Suggested commit: `render: drop legacy preview services`.

### 12. Adapter Modularisation _(status: complete)_

- Table-specific detail/compact renderers (door beyond, periodic flows, side passages, passage widths/turns, rooms/chambers, stairs, special passages, monsters, trick/traps) now live in their own modules under `render/`.
- `render.ts` is reduced to orchestration, delegating preview and prose work to adapters while handling preview deduplication.
- Suggested commit: `render: finish adapter extraction`.

## Open Questions / Future Enhancements

- Should compact mode display an explicit marker when some children are still pending? (Answer: YES)
- Do we want to memoize render output per mode to avoid recomputation on every toggle? Evaluate after baseline implementation.
