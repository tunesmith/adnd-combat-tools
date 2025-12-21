# Treasure Registry Context Boilerplate (Duplication)

## What’s duplicated today

Multiple treasure manifests re-declare the same pattern:

- A local `TreasureRegistryContext` type with optional `kind/level/treasureRoll/rollIndex`.
- A `readTreasureContext(context)` helper that returns `{ level, treasureRoll, rollIndex }` only when `context.kind === 'treasureMagic'`.
- A `registry: ({ roll, context }) => …` implementation that:
  - calls `readTreasureContext(context)`
  - forwards `{ roll, level, treasureRoll, rollIndex }` to the resolver

Examples include:
- `src/dungeon/features/treasure/potion/manifest.ts`
- `src/dungeon/features/treasure/scroll/manifest.ts`
- `src/dungeon/features/treasure/ring/manifest.ts`
- `src/dungeon/features/treasure/miscMagicE1/manifest.ts`

## Why it’s a problem (even if small)

- It’s easy for the shape/semantics to drift across files (e.g., context kind name, field names, defaulting rules).
- It adds “ceremony per table” that makes feature migration feel heavier than it needs to be.

## Suggested cleanup (token/LOC win)

Create a single helper in `src/dungeon/features/treasure/shared.ts`:

- A narrow type guard for the registry context shape (at minimum `kind === 'treasureMagic'`).
- A shared `readTreasureMagicContext(context?: unknown)` returning:
  - `{ level?: number; treasureRoll?: number; rollIndex?: number }`

Then manifests can do:

- `const { level, treasureRoll, rollIndex } = readTreasureMagicContext(context);`
- `return resolveX({ roll, level, treasureRoll, rollIndex });`

## Optional follow-up (stronger convention)

- Add a small helper for common registry wiring, e.g.:
  - `withTreasureMagicRegistry(resolver)` that returns a `registry` function
  - or `buildTreasureMagicRegistry(resolver)` used across manifests

This keeps manifests focused on “table definition” rather than repetitive plumbing.

