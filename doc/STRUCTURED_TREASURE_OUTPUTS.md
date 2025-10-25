# Structured Treasure Outputs

Some treasure results need more than a single sentence. Instead of handing the
user a paragraph, we pre-roll everything and render a structured summary
component. Recent examples are:

- **Ioun Stones** — show each stone, duplicates, and burnout status.
- **Necklace of Prayer Beads** — list base beads plus specials.
- **Robe of Useful Items** — enumerate the base patches and the additional rolls.
- **Character Parties** — render a roster with followers, HP, and gear.

This checklist mirrors `ADDING_SUBTABLES.md`, but focuses on items that
materialize as their own render message kind.

## 1. Model the domain result

1. Define the raw table(s) under `src/tables/...`.
2. Add explicit result types in `src/dungeon/domain/outcome.ts` that capture
   every piece of data the UI needs (e.g., individual patch rolls, bead counts,
   or party membership details).
3. If the result includes fixed entries (such as the robe’s six base patches),
   keep the definitions in a helper (`src/dungeon/helpers/...`) so both the
   resolver and the render summary can re-use them.

## 2. Resolve everything up front

1. Implement the resolver in `src/dungeon/domain/resolvers.ts`. Roll every
   required subresult immediately so the UI receives the full payload in one
   event. For “roll again” instructions, loop until the requested count is
   satisfied instead of deferring additional pending rolls.
2. Push a child event with `kind` that matches your new result type, and make
   sure the parent treasure resolver attaches it so renderers can find it.
3. Register the resolver with `TABLE_RESOLVERS` and
   `resolvePendingNode` (see `ADDING_SUBTABLES.md`) if manual rerolls are
   allowed from the UI.

## 3. Build a summary facade

1. Create a converter (`toXSummary`) under `src/dungeon/adapters/render/...`.
   This should collapse the raw result into an easy-to-render structure
   (grouped counts, status flags, etc.).
2. Add any helper functions needed to present human-readable labels. Avoid
   duplicating text literals between the table definition and the summary.

## 4. Define a message kind

1. Extend `src/types/dungeon.ts` with a `DungeonXMessage` type, the shared
   summary shape, and add the new union member to `DungeonMessage`.
2. Update `src/tests/support/dungeon/dungeonRollHarness.ts` to clone and freeze
   the new message type so snapshot + integration tests can work with it.

## 5. Implement render adapters

1. Add `renderTreasureXDetail` and `renderTreasureXCompact` functions under
   `src/dungeon/adapters/render/`.
2. In `renderTreasureDetail`, `renderTreasureCompactNodes`, and
   `collectTreasureCompactMessages`, locate the child event and push a message
   with `kind: 'x'`, the summary, and the appropriate `display` flag.
3. Register the adapters in `src/dungeon/adapters/render.ts` so the dispatcher
   knows which function to call in each mode. Without this, detail view will
   fall back to generic paragraphs.

## 6. Add React components

1. Create detail/compact components in `src/components/dungeon/` that consume
   the summary. Keep compact output concise (bullet lists, inline counts) and
   let detail mode include grouped explanations.
2. Wire the components into the switch in `src/pages/dungeon/index.tsx`.

## 7. Tune supporting copy

1. When you introduce a specialized renderer, scrub the surrounding generic
   text so we do not display both “There is magical treasure.” and a richer
   summary. For treasure, adjust `describeResolvedMagic` or the compact
   sentence builder so the new message has clean lead-in text.
2. If compact treasure aggregation should always surface the component (e.g.,
   in periodic chamber summaries), ensure the message is included in
   `collectTreasureCompactMessages`.

## 8. Testing

1. **Domain/unit tests:** cover any resolver logic that has loops or special
   cases (e.g., “roll twice more” for robes).
2. **Component tests:** render both detail and compact components with a fixed
   summary to lock in formatting.
3. **Integration tests:** extend the passage/treasure integration suite to:
   - ensure the event is created,
   - verify detail mode includes exactly one message of your kind,
   - check compact mode emits the same summary,
   - assert aggregated compact messages are added when periodic summaries roll
     treasure.

Keeping this playbook handy should make future structured items (new treasure
variations, patrons, retainer rosters, etc.) faster to implement without going
through the trial-and-error we hit with robes, ioun stones, necklaces of prayer
beads, or character parties.
