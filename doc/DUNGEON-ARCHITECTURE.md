# Dungeon Architecture Guide

This guide explains how the Dungeon feature is structured: what goes where, how data flows from random tables to UI, and how to add or change behavior safely. It assumes familiarity with AD&D Random Dungeon Generation but not with this codebase.

## Goals and Design Principles

- Single source of truth for rules: resolve domain outcomes once, render anywhere.
- Separation of concerns: domain resolution vs. presentation.
- Predictable preview flows: detail mode stages tables as previews; compact mode produces final prose.
- Typed-first: strict TypeScript, discriminated unions, no `any`, small type guards for dynamic contexts.
- Pure functions by default: no side effects in domain resolvers or adapters; randomness is explicit via `rollDice`.

## Key Directories and Modules

- Tables (data): `src/tables/dungeon/**`
  - Typed enums and table definitions (`sides`, `entries`, `range`, `command`).
- Types (render + plumbing): `src/types/dungeon.ts`
  - `DungeonRenderNode` (heading, bullet-list, paragraph, table-preview, roll-trace), `DungeonMessage` aliases, `TableContext` for threading state (door chains, exits, wandering level).
- Domain (logic): `src/dungeon/domain/**`
  - `outcome.ts`: `OutcomeEvent` + `DungeonOutcomeNode` model.
  - `resolvers.ts`: `resolveXxx` functions (roll table → outcome event) with optional `children` for staged subflows.
- Adapters (view mapping): `src/dungeon/adapters/render.ts`
  - `toDetailRender(outcome)`: outcome → render nodes; adds headings/bullets and previews for `pending-roll` children.
  - `toCompactRender(outcome)`: outcome → final compact text (no previews); composes directly in code (no service calls).
- Registry (preview resolution): `src/dungeon/helpers/registry.ts`
  - `TABLE_ID_LIST`, `TABLE_HEADINGS`, `TABLE_RESOLVERS` for preview ids.
  - `resolveViaRegistry(tp, feedItemId, usedRoll, setFeed, setCollapsed, setResolved)` updates the feed and toggles UI state.
- Services (message helpers): `src/dungeon/services/**`
  - Small typed wrappers that return `DungeonRenderNode[]`. In detail mode they emit previews; compact mode usage is being phased out in favor of adapters.
- Page (UI): `src/pages/dungeon/index.tsx`
  - Renders root previews for Passage/Door and delegates preview resolution to the registry. Manages feed, overrides, collapse/resolved flags.

## Core Data Model

- `DungeonOutcomeNode` (domain AST)
  - `{ type: 'event', event: OutcomeEvent, roll: number, children?: DungeonOutcomeNode[] }`
  - `{ type: 'pending-roll', table: string, context?: unknown }`
- `OutcomeEvent` kinds (not exhaustive):
  - `periodicCheck`, `doorBeyond`, `sidePassages`, `passageTurns`, `stairs`, `passageWidth`, `specialPassage`, `roomDimensions`, `chamberDimensions`, `egress`, `chute`, `numberOfExits`, `unusualShape`, `unusualSize`.
- `TableContext` threads state for chains:
  - `{ kind: 'doorChain', existing: ('Left'|'Right')[] }`
  - `{ kind: 'wandering', level: number }`
  - `{ kind: 'exits', length: number, width: number, isRoom: boolean }`

## Modes: Detail vs. Compact

- Detail mode
  - Show headings + “roll: n — Label” bullets + paragraphs.
  - Stage child tables as previews (`pending-roll`) without auto-rolling; user submits or auto-rolls.
  - Registry resolves previews and updates collapse/resolved flags.
- Compact mode
  - No previews or roll traces; root headings hidden.
  - One or more paragraphs mirror the historical prose exactly.
  - All composition lives in `toCompactRender()` for consistency (no service calls). This is the “compact normalization” we adopted.

### Why Compact Normalization?

- Single responsibility: Domain resolvers produce values; compact text is a pure view concern — keep it in one place.
- Remove duplication: Avoid parallel compact strings in services and adapters drifting out of sync.
- Testability: Unit tests target one function for compact text; easier to assert exact prose.
- Decoupling: Services remain focused on detail-mode preview staging where they add value; compact mode stays service‑free.

## How Flows Are Structured

- Periodic Check (`resolvePeriodicCheck`)
  - Event includes `level` and optional `avoidMonster`.
  - Children: side passages, passage turns, chamber/room, stairs, trick/trap (stub), or wandering monster previews.
  - Compact: composes final sentence or delegates to compact helpers (e.g., door chain).
- Door Chain (Closed doors while checking passage)
  - Preview id sequence: `doorLocation:0` → `periodicCheckDoorOnly:0` → `doorLocation:1` …
  - Context: `{ kind: 'doorChain', existing: ('Left'|'Right')[] }` to avoid repeating the same lateral.
  - Compact: `compactDoorText()` implements chain recursion and termination rules.
- Door Beyond (`resolveDoorBeyond`)
  - Compact: composes final text, appends passage width when needed; rooms/chambers embed their own descriptions.
- Stairs/Egress/Chute
  - `resolveStairs()` sets `pending-roll` children for egress/chute.
  - Compact: egress/chute suffix sentences are built directly in adapters.
- Passage Width / Special Passage
  - `resolvePassageWidth()` adds `specialPassage` pending preview when indicated.
  - Special passage may add further previews (galleries, streams/rivers/chasm); compact strings composed in adapters.
- Rooms/Chambers
  - `resolveRoomDimensions` / `resolveChamberDimensions` add `pending-roll` for `numberOfExits` or for `unusualShape`/`unusualSize`.
  - Compact: base description + exits (or unusual shape/size summary). Contents/treasure are placeholders.
- Unusual Shape/Size
  - Modeled as outcome events; compact strings composed in adapters. Detail preview for `unusualSize` may chain `RollAgain` using the preview id parameters.
  - `unusualSize` preview id carries parameters (`unusualSize:seq:extra`) to support roll-again chaining in detail mode.
- Exits (`numberOfExits`)
  - Outcome includes contextual dimensions; compact text uses area thresholds and room/chamber differences.
- Wandering Monster
  - Detail: where-from (periodic check sans WM) + monster level + monster specifics + dragons/humans subtables staged via previews.
  - Compact: adapter composes: where-from compact text + “Wandering Monster: …” + monster description from level-specific helpers.

## The Registry: Table Resolution in Detail Mode

- Preview ids take the form `base[:param[:param...]]`, e.g., `doorLocation:1`, `unusualSize:2:2000`.
- `TABLE_RESOLVERS[base]` returns `DungeonRenderNode[]` for the resolved result (usually via outcomes + `toDetailRender`).
- After resolution, the registry:
  - Replaces the preview with the resolved block in the feed.
  - Auto-collapses the preview and marks it as resolved.

Think of the registry as a small “view controller” for preview resolution in detail mode. It does not compute rules; it only:

- Parses preview ids and optional params.
- Calls the appropriate resolver/renderer.
- Patches the rendered feed and toggles UI state.

## Adding or Modifying a Table

1. Add the table

- Create `src/tables/dungeon/<table>.ts` with enum and `Table<T>`.

2. Add a resolver (domain)

- Implement `resolveXxx({ roll? }) => DungeonOutcomeNode`.
- If the table implies subtables, push `children` with `pending-roll` nodes and/or carry `context`.

3. Map to render (adapters)

- toDetailRender: add a branch for the event to create heading + bullet + preview mapping.
- toCompactRender: compose final text for compact mode (no references to services).

4. Register for detail-mode previews

- Add to `TABLE_ID_LIST` and `TABLE_HEADINGS`.
- Add a resolver entry to `TABLE_RESOLVERS` that returns messages via `toDetailRender(resolveXxx({ roll }))`.
- For parameterized preview ids (e.g., `unusualSize:seq:extra`), parse params inside the registry entry.

5. Tests

- Add focused tests under `src/tests/dungeon/**`:
  - Deterministic `rollDice` via `jest.spyOn(dungeonLookup, 'rollDice')`.
  - Assert exact compact strings for adapter outputs.
  - Assert that detail mode inserts expected previews and roll bullets.

## Conventions and Dos/Don’ts

- Do: Keep domain resolvers pure and table-driven; they return outcomes only.
- Do: Use adapters for composing text; compact mode must not call message services.
- Do: Use `TableContext` for chains (door, exits, wandering level); provide minimal, typed context only.
- Do: Give previews stable, descriptive ids; use `base[:param...]`.
- Don’t: Mix UI concerns into domain or services.
- Don’t: Introduce `any`; prefer discriminated unions and small guards.
- Don’t: Duplicate logic across resolvers and messages; prefer one authoritative path.

## Service vs. View Responsibilities

- Services (`src/dungeon/services/**`)
  - Provide typed message wrappers for preview flows (detail mode) and some specialized chains.
  - Accept `detailMode?: true` to return table previews when `roll` is undefined.
  - May compose paragraphs for detail mode where that simplifies staging. They should not be used by compact mode.
- Adapters (`src/dungeon/adapters/render.ts`)
  - Own all compact text composition and detail-mode rendering of outcomes.
  - Insert previews from `pending-roll` children uniformly.
  - Treat services as detail-only helpers; never call them in compact paths.

## FAQ / Subtleties

- What exactly is a “message service” and who should call it?

  - A message service is a small function in `src/dungeon/services/**` that returns `DungeonRenderNode[]`. In detail mode and when no `roll` is provided, it emits a `table-preview`. Some services also help stage nested previews (e.g., unusual size roll‑again sequencing). They exist to keep preview assembly concise. Adapters may call them in detail mode only. Compact paths should not call them.

- Why are some detail flows still using services?
  - Detail mode benefits from helpers that stage nested previews and domain-specific sequences (e.g., unusual size roll‑again chaining). Adapters render the results; compact mode stays service‑free.
- Why context on previews?
  - Some chains depend on prior results (door chain left/right repeats, exits need dimensions). `TableContext` keeps this minimal and typed.
- Can outcomes carry richer structured data?
  - Yes; currently outcomes carry enum results and context. We can extend events with structured payloads over time to support alternate renderers (narration, VTT, mapping).

## Alternative: Per-Outcome Renderers

We currently centralize rendering in a single adapter file for both modes. An alternative is one renderer module per outcome (e.g., `render/periodicCheck.ts`, `render/doorBeyond.ts`) that exports two pure functions:

- `renderDetail(event, roll, children) => DungeonRenderNode[]`
- `renderCompact(event, roll) => DungeonRenderNode[]`

Pros:

- Higher cohesion; each outcome’s view logic is colocated and easier to navigate.
- Simpler unit tests per outcome.

Cons:

- Shared preview-insertion utilities must be reused to avoid duplication.
- Detail rendering sometimes depends on child previews; careful to accept `children` and reuse the shared preview mapper (`previewForPending`).

If we choose this path later, the main adapter becomes a thin delegator switching on `event.kind` and calling the appropriate outcome renderer, and the registry remains the detail-mode view controller.

## Quick Checklist (PRs touching dungeon)

- Resolvers pure; no UI state.
- Adapters compose compact strings; detail renders bullets + previews; no service calls in compact.
- Registry handles preview resolution for new tables with proper id/heading.
- Tests assert compact text and detail preview staging.
- Types strict; no `any`; follow folder/file naming conventions.
