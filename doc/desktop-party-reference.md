# C2: Party Reference and encounter recovery

Choose a session and open **Party Reference**. Use **+ Character** to add a
campaign identity and its first session profile. Edit a row to change its
profile, see character details, or explicitly link a character in Possessions
or a combatant from the latest round of an encounter. The link chooser shows
position as well as name, and a name match is only a hint. An existing roster
identity can be added to another session without creating another character.

The five numeric columns show base saving throws at effective level. The three
notes columns are editable text and expand to fit their contents. Profiles
without calculated saves have a **Manual saving throws** section. Leave a
target blank if you don't know it. Choose **Manual targets** under **Rules
basis** to use a manual row for a house rule.

Give a level adjustment a name in the profile, then use its +1 toggle on the
row. The displayed effective level and base saving throws change immediately.
The base character level and entered notes are retained. In
**Combats**, a supported linked combatant uses the new level on the next round.
To change the latest round sooner, choose **Apply to latest round…**, review the
listed combatants, and confirm. A checkpoint preserves the previous values.
Earlier rounds, earlier sessions, and imported tracker payloads keep their
captured values. The tracker still owns HP, equipment, and effects. C2 never
changes HP, spell slots, prepared or spent spells, inventory bonuses, or XP
because a level changed.

**+ Session** can carry selected party profiles separately from inventory,
encounters, and notes. All transfer boxes start unchecked. A mapping carries
only when both the profile and the mapped working inventory or encounter are
selected. **+ Encounter** still opens an empty encounter and starts inline
renaming, without seeding a party.

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

The adapter projects reviewed actual levels into existing tracker categories
only for supported matching classes. A mismatch, unknown class, or monster
HD category remains manual. The monk can calculate thief saves, while its
attack basis remains manual because the standalone tracker uses a different
monk attack basis. Nonstandard multiclass and dual-class rules can use explicit
manual values. The standalone tracker remains usable and stores concrete
levels/categories without needing a campaign lookup.

## Document and verification

Campaign V6 adds an optional party section: campaign identity, a profile per
session and character, plus inventory and combat links. Inventory links scope
the stable inventory character ID to its working inventory and session. Combat
links scope the actor key and side to the session, encounter instance, and
editor generation. Explicit continuation creates independent profiles and
copies reviewed links to new instances only when requested. V1–V5 migrations
preserve sources, snapshots, and prior IDs, and initialize without inferred
characters or links. Opening does not rewrite the file. Saving retains the
previous bytes in the ordinary backup. Earlier C2 builds stored custom
values under the V6 `overrides` key. Those values remain in the file for manual
use. A calculated row always displays its calculated targets.

Removal retains the complete working instance with a timestamp, including
its logical encounter ID, continuation provenance, and history. Removal and
recovery advance the editor generation, so late editor changes cannot modify
the archived instance. The native mutation boundary validates its frozen
state and links. No permanent purge is exposed.

The isolated packaged walkthrough used a synthetic V5 campaign with two
sessions. It verified native migration with an exact V5 backup, a cleric
crossing the level 6 to 7 save band, explicit links, checkpointed level
application, a new round taking the changed level, preservation of HP,
effects and notes, and removing and recovering an empty and continued
encounter after a full quit and reopen. It also confirmed that all session
transfer choices start unchecked, selectively carried a profile and both
links into a third session, saved an independent effect setting and note
there, and saved a manual creature with one Spell target. Automated tests
cover manual values, printed bands, independent profile transfer, stale
callbacks, and rejection of edits to archived encounters.

The public static build was served locally at the GitHub Pages base path.
In Chrome, tracker round advancement, share URL reload, and browser drafts
worked independently. The standalone inventory imported a synthetic DM
file, edited an item quantity, then exported and reimported the changed file.
Type checking, formatting, lint, 825 Jest tests, 14 Rust tests, and both
builds passed. ESLint retains the existing warning in `src/types/util.ts`.

Build with `npm run desktop:build` and launch with `npm run desktop:run`, or
double-click `src-tauri/target/release/bundle/macos/AD&D Tools.app`. The public
build still uses `npm run build`. Save your campaign explicitly with
Command-S or File → Save.
