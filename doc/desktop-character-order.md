# Session character order

Session stores its own optional `partyOrder` array of roster identities. Opening
an older campaign materializes each session's existing roster-based order.
The roster itself stays unchanged. This cannot recover session orders that an
older app never recorded.

Session and Possessions support dragging names and Alt+Shift+Arrow keys.
Session uses Up/Down; Possessions also accepts Left/Right. Clicking a name still
edits the Session profile or selects the Possessions tab. References, current XP
views, Possessions (including All possessions), and Banking use the selected
session's order, subject to existing membership and eligibility rules.

Possessions matches inventory IDs to roster IDs only through the existing
unique normalized-name matching. Ambiguous and unmatched holders follow matched
characters, retaining their local inventory order; they can be reordered within
that group. Storage follows characters and retains its own order. Standalone DM
tabs persist order in the character array through the normal accepted-edit path.

New sessions copy their selected source profiles' order into a separate array.
New or returning profiles append to their destination's order. Sorting current
views does not rewrite imports, checkpoints, confirmed XP, or financial history.

## Walkthrough

1. Open the disposable `/tmp/SOCK-session-order-review.adnd` copy. Day3 is arranged
   Reatha, Dengue Dan, Kramrak, Chocolato, Imunoanne, with Invisible Chest after
   the characters.
2. Compare Session, References, XP, Possessions, All possessions, and Banking.
   Move a name in Session, then in Possessions, and switch views.
3. Check Day1 and Day2; their orders remain independent. Create Day4 from Day3,
   then reorder Day3 and verify Day4 stays as created. Save and reopen the copy.
4. In standalone DM encumbrance, drag a character tab or focus it and press
   Alt+Shift+Left/Right. Export and import to check the retained order.

The automated disposable SOCK check covers both reorder entry points, Day1/Day2
isolation, Day4 profile/inventory carry-forward, later source edits, and
save/reopen. It compares inventory, XP, banking, reconciliation state and the
original file bytes. Jest covers UI drag/keyboard behavior, retained selection,
codec round trips, empty/single-character inventories, duplicate-name matching,
legacy migration, and returning profiles. The original reviewed SOCK is untouched.

Build with `npm run desktop:build`. The bundle is
`src-tauri/target/release/bundle/macos/AD&D Campaign.app`.
