# C2: Party Reference and encounter recovery

Choose a session and open **Party Reference**. Use **+ Character** to add a
campaign identity and its first session profile. Edit a row to change its
profile or see character details. An existing roster identity can be added to
another session without creating another character.

The five numeric columns show base saving throws at effective level. The three
notes columns are editable text and expand to fit their contents. Profiles
without calculated saves have a **Manual saving throws** section. Leave a
target blank if you don't know it. Choose **Manual targets** under **Rules
basis** to use a manual row for a house rule.

Give a level adjustment a name in the profile, then use its +1 toggle on the
row. The displayed effective level and base saving throws change immediately.
The base character level and entered notes are retained. Party Reference
uses the profile to calculate saves. Each encounter owns its class, level,
HP, and equipment values. **Advance Round** inherits those values from the
combat round. Possessions stores its own characters, strength, and equipment.

In **Combats**, use **Add from party/profile…** to pick a profile from the
current session. The editor copies its name and, where supported, its class and
effective level. Review armor, weapon, movement, and HP in the draft and choose
**Add party member**. Each copy becomes a separate combatant, even when names
match. Later combat edits and profile edits are independent.

**+ Session** can carry selected party profiles separately from inventory,
encounters, and notes. All transfer boxes start unchecked. **+ Encounter**
opens an empty encounter and starts inline renaming.

In **Combats**, open **…** beside **Version** below the editor and choose
**Remove encounter from this session**. An empty encounter offers immediate
Undo. A populated encounter names the encounter and session and asks for
confirmation. **Removed encounters** can recover either one after reopening.
Removing an instance does not remove the fight from any other session.

## Printed rules and manual cases

Saving throws use AD&D 1e _Dungeon Masters Guide_, printed p. 79,
**Saving Throw Matrix I**, verified against the Orange Spine printing.
The table tests check both ends of each printed level band for Cleric/Druid,
Fighter/Paladin/Ranger (including the zero-level row), Magic-user/Illusionist,
and Thief/Assassin/Monk. The category help names the full groups and notes the
printed exclusions. A natural 1 fails. These targets exclude situational,
ability, racial, equipment, and other bonuses.

The Orange Spine _Players Handbook_, printed pp. 21 and 30, gives the druid and
monk saving bases. Printed pp. 117–118 give the original bard progression and
save/attack rules: use the best save in each category from retained fighter
and thief levels and current bard level as a druid. Combat uses retained
fighter level. The toggle adjusts the current bard level only. If a campaign
rules that the adjustment affects a retained class as well, use explicit
manual targets or select a single matrix and use its reviewed basis.
No retained level is inferred. A missing bard save basis gives a manual row.

The copy action converts supported profile levels to tracker categories.
For bards it uses the retained fighter level for combat. For creatures,
unsupported classes, or **Copy name only** under **Rules basis**, set class
and level in the combatant editor. The editor supplies its usual defaults and
leaves maximum HP blank. Nonstandard saving rules can use manual targets in
Party Reference.

## Document and verification

Campaign V7 retains the roster and session profiles when upgrading an
unlinked V6 campaign. It accepts the empty mapping lists that V6 wrote.
V6 files with nonempty mapping lists are unsupported. Combat values, inventory,
original imports, checkpoints, and continuation provenance (including
historical fingerprints and selected profile IDs) are carried through as
recorded. Current continuation validation uses independently selected
profiles. Opening a campaign leaves its file bytes intact. Saving upgrades
the file and retains the original bytes in the ordinary backup. Custom
targets stored under the existing `overrides` key apply to manual rows.

Removal retains the complete working instance with a timestamp, including
its logical encounter ID, continuation provenance, and history. Removal and
recovery advance the editor generation, so late editor changes cannot modify
the archived instance. The native mutation boundary validates its frozen
state. **Removed encounters** restores an instance with its existing data and
logical identity.

Synthetic tests cover migration of unlinked V6 campaigns, exact original
backup bytes, independent profile transfer, stale callbacks, and encounter
removal and recovery. The tracker tests cover draft cancellation, duplicate
copies with fresh keys, and round inheritance after a profile changes.

Build with `npm run desktop:build` and launch with `npm run desktop:run`, or
double-click `src-tauri/target/release/bundle/macos/AD&D Tools.app`. The public
build still uses `npm run build`. Save your campaign explicitly with
Command-S or File → Save.
