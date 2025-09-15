# Dungeon Refactor — Objectives, Status, and Next Steps

This guide tracks the dungeon refactor. It focuses on why we’re doing it (objectives), what’s done (status), and the next step to pick up. Historical details are trimmed for clarity.

## Objectives & Motivation

- Eliminate duplicated logic between legacy string services and typed paths so there is a single source of truth for dungeon rules.
- Separate domain resolution (what happens) from presentation (how it renders) via a small outcome model and pure adapters.
- Make the Dungeon page code more declarative by routing table previews and resolutions through a small registry rather than ad‑hoc branches.
- Keep TypeScript strict and avoid `any`, enabling safer iteration and easier testing.

## Current Status (high‑level)

- Outcome model in place: domain resolvers under `src/dungeon/domain/resolvers.ts` return `DungeonOutcomeNode` with staged child previews.
- Adapters in place: `toDetailRender` and `toCompactRender` map outcomes to `DungeonRenderNode[]`; compact text is composed locally (no global legacy string path).
- Registry extracted: `src/dungeon/helpers/registry.ts` resolves most previews (door chain, where‑from, monster tables, egress/chute, exits) and updates blocks generically.
- Page simplified: `src/pages/dungeon/index.tsx` routes most tables through the registry; it keeps explicit branches only where flow truly differs (passage width, special passage, periodicCheck root, trick/trap, unusual shape/size, door beyond).
- Door chain: Detail flow is preview‑driven (`doorLocation:*` <-> `periodicCheckDoorOnly:*`) with correct stop conditions; compact door text composes in the adapter (no legacy dependency).
- Wandering Monster: Detail stages both where‑from and monster level; compact text composes in the adapter using the monster tables and per‑level result helpers.
- Tests/typing: Jest passes locally; `tsc` passes; ESLint + Prettier configured.

## Phase Status

- Phase 0 — Lint & Type Checks: Complete.
  - ESLint (`next/core-web-vitals` + Prettier) configured; `tsc` clean.
- Phase 1 — Replace easy compact strings in adapters: Complete.
  - Side Passages, Passage Turns, Stairs compact strings are composed in the adapter (no legacy string helpers).
- Phase 2 — Encode staging as outcome children: Complete.
  - Resolvers return child `pending-roll` nodes for width, special passage, egress/chute, room/chamber exits, unusual subtables, etc.
- Phase 3 — Model exits and unusual tables as outcomes: Complete.
  - Exits (`numberOfExits`) are outcome‑based and adapted in detail/compact.
  - Unusual Shape/Size are outcome events; adapters map them; `unusualSize` preview chaining semantics preserved.
- Phase 4 — Remove remaining legacy string functions: Largely complete for flows the UI uses.
  - Legacy string aggregators like `getPassageResult` and `wanderingMonsterResult` are no longer used by the UI.
  - Message helpers (door location, periodic door‑only, unusual tables, exits, egress/chute, room/chamber) remain by design and are used in detail adapters/registry; compact composition has been moved into the adapter.

## What’s Next (single, actionable step)

Refactor is effectively complete. Optional next: normalize compact composition for a few message-backed flows.

- Option A: Move compact composition for `egress/chute/exits/unusual` fully into adapters to remove message-service dependencies in compact mode.
- Option B: Keep as-is (acceptable), since current approach is consistent and well‑typed.

## Shortlist After That (optional, in order)

1. Normalize compact adapters away from service helpers

- For `egress/chute` and `exits`, either keep current message helpers (acceptable) or move compact composition fully into adapters for consistency. If we choose the latter, add small adapter helpers and then remove the string‑composition paths from those services.

## Notes on Behavior Parity

- Compact vs. detail: Compact text matches historical output; detail stages previews, collapses after resolve, and hides the root heading.
- Bespoke flows retained: Door chain (`doorLocation:*`, `periodicCheckDoorOnly:*`), `passageWidth` special handling, `periodicCheck` root, `unusual` subtables, and `trickTrap` explicit handling in the page.

## How To Add/Route a Table (reference)

- Tables live in `src/tables/dungeon/**`.
- Expose `...Messages({ roll?, detailMode?, context? }): DungeonRenderNode[]` from `src/dungeon/services/**`.
- For outcome‑based flows, implement a `resolveXxx()` in `src/dungeon/domain/resolvers.ts` and map via adapters.
- Register in `src/dungeon/helpers/registry.ts` so previews resolve generically in detail mode.
