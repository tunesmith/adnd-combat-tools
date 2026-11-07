# Session and References

The session tabs are **Session, References, Possessions, Combats**.
**Session** shows a compact character comparison table above the session notes.
At window widths of 1,440px and up, notes appear to the right of the table.
Session notes grow and shrink with their contents. General character notes
use a full-width autosizing field, capped below the modal height with internal
scrolling for longer text.
Choose **+ Character** to add a roster identity and a session profile. Click a
character name to edit it. Both Session and References open the same modal and
use the same profiles. Save profile accepts the draft through the campaign's
queued persistence. Cancel and Escape discard it and return focus to the
trigger. References shows the saving-throw table.

Names, players, and general character notes belong to the campaign roster.
Race, gender, age, alignment, six attributes, profile maximum HP, and reference
bonuses belong to the selected session. Changing them in a later session
preserves the earlier session's values. Zero is a recorded value. Blank is
unknown, displayed as a dash. Exceptional strength has an integer score and
a separate percentile, displayed as 18/64 or 18/00. The maximum percentile is
stored as 100. The Session level cell shows effective level. Its compact +1
button has the named adjustment and base level in its tooltip and accessible
label.

Reference bonuses are manual inputs for melee hit/damage, missile hit,
and reaction percentage. The +10% XP bonus is a manually set checkbox, following
the PHB's high-ability-score bonus. Clear marks it as unrecorded. The display adds a plus sign
for positive values, including in the editing fields, and preserves zero
and negative values. The saved values are numeric. Older nonstandard XP
percentages retain their recorded values until explicitly changed. Attributes accept
integers from 0 to 25. Age and maximum HP accept nonnegative integers up to
1,000,000. Reference bonuses accept signed integers from -1,000 to 1,000.
These are input bounds. The bonuses do not automatically recalculate from
attributes, race, or class.

The five numeric columns show base saving throws at effective level. The three
notes columns are editable text and expand to fit their contents. Profiles
without calculated saves have a **Manual saving throws** section. Leave a
target blank if you don't know it. Choose **Manual targets** under **Rules
basis** to use a manual row for a house rule.

Give a level adjustment a name in the profile, then use its +1 toggle on the
row. The displayed effective level and base saving throws change immediately.
The base character level and entered notes are retained. References
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
References.

## Document and verification

Campaign V8 adds an optional typed `reference` object on each session
profile. V1–V7 documents open with those values unknown. Existing IDs,
profiles, notes, rules, manual targets, effects, imports, working data,
checkpoints, and continuation provenance retain their recorded values.
V6 empty mapping lists are accepted. V6 files with nonempty mapping lists
remain unsupported following the removal of profile linking.

Explicitly carried profiles receive deep copies of the reference object,
attributes, strength percentile, and bonuses. The one-time combat copy still
copies only the existing supported name/class/level fields. Opening leaves
disk bytes intact. Save upgrades the document and keeps the previous file
bytes in the normal backup. The shared native validator checks the expanded
types and ranges.

Removal retains the complete working instance with a timestamp, including
its logical encounter ID, continuation provenance, and history. Removal and
recovery advance the editor generation, so late editor changes cannot modify
the archived instance. The native mutation boundary validates its frozen
state. **Removed encounters** restores an instance with its existing data and
logical identity.

Synthetic tests cover migration of older profiles, exact original
backup bytes, independent profile transfer, stale callbacks, and encounter
removal and recovery. The tracker tests cover draft cancellation, duplicate
copies with fresh keys, and round inheritance after a profile changes.

The dense Session checks passed 829 Jest tests and 16 native Rust tests.
The isolated packaged walkthrough used five invented characters at the
normal 1,180px window width and at about 790px. It checked table-only
horizontal scrolling, modal keyboard wrapping, Escape and focus return,
zero maximum HP, 18/00 strength, a negative reaction percentage, and
independent profile carry-forward. Saved profiles and multiline notes
survived a complete quit and reopen. A denied save retained edits and left
disk bytes intact. External-change cancellation preserved the external
file. The first V7 upgrade saved an exact original backup. The public static
export also passed standalone tracker share/reload and inventory
edit/export/reimport checks in Chrome.

Build with `npm run desktop:build` and launch with `npm run desktop:run`, or
double-click `src-tauri/target/release/bundle/macos/AD&D Tools.app`. The public
build still uses `npm run build`. Save your campaign explicitly with
Command-S or File → Save.
