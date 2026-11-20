# Profiles, membership and references

See the [desktop guide](desktop.md) for navigation and session creation.
**Session → + Character** adds or returns a roster identity with a session profile.
Click a character's name in Session or References to edit its profile. Save profile
accepts the draft; Cancel/Escape discards it. Blank numeric values mean unknown,
not zero, and display as a dash.

## Identity and session-specific values

Names, players and general character notes belong to the campaign roster. Classes,
trained levels, race, gender, age, alignment, attributes, maximum HP, reference
bonuses and save notes belong to the selected session's profile. Editing a later
profile does not change an earlier one. Exceptional strength has an integer score
and a separate percentile; the maximum percentile displays as 18/00.

Reference bonuses and XP bonuses are entered explicitly. They are not inferred
from attributes, equipment or notes. Name a temporary level adjustment in the
profile, then use its +1 toggle in the session table. Effective level affects
supported reference calculations; XP training caps use trained levels instead.
The compact Session XP table shows base level, cap, additions in that session and
ending balance from accepted awards.

**Remove from session** removes participation in that session without deleting the
roster identity, possessions, combatants or earned XP shares. **Retire from roster**
sets an inclusive last eligible session. Later awards automatically forfeit the
retired character's outstanding shares; confirmed XP and existing profiles remain.
Temporary absence is not retirement. See [recipient settlement](desktop-xp.md#recipient-settlement).

Profiles, combatants and inventory characters are independent. Copying a profile
into combat is a one-time supported name/class/effective-level copy, not an HP,
equipment or identity link. The picker omits names already in that round after
trimming whitespace and ignoring case. This is an availability heuristic;
manual creation still permits distinct same-name combatants.

## Multiclass and saving throws

A profile can have two or three class entries under one character identity. Each
class retains its own stable ID, trained level and XP bonus. Identity, attributes
and maximum HP are shared. Choose a combat basis explicitly; unequal class levels
also require a reviewed participation level for an XP event. Copying profiles to
another session retains class IDs while making the values independently editable.

Calculated saving throws use the lowest base target per category across classes.
A temporary effect selects one affected class. Manual targets and save notes can
represent house rules or unsupported cases; unknown targets stay blank. Situational,
ability, racial and equipment bonuses are not folded into these base targets.

Choose a character’s name and **Add reminder** to record a bonus, when it applies
and an optional source. Bonus text can include alternatives. Reference displays
each reminder and its source under the character’s base targets. For a resistance,
immunity or other check that happens first, choose **Before the roll**, then
**Add reminder**. Enter an instruction and an optional source. These appear
together beneath that character’s numeric modifiers. Existing
freeform notes remain visible and editable in the profile until you convert them.

Bards use their retained fighter/thief levels and current bard level's druid saves
where supported, choosing the best save per category. Combat uses the retained
fighter level. Retained levels are explicit; the temporary toggle does not invent
changes to them. Manual/creature profiles and **Copy name only** require reviewed
combat values rather than a guessed conversion.

Rules references: DMG printed p. 79, Saving Throw Matrix I; PHB printed pp. 21, 30
and 117–118 for druid, monk and bard bases, and pp. 16, 18, 32–33 for multiclass
rules. The [saving-throw tables](../src/tables/savingThrows.ts) and
[profile helpers](../src/helpers/campaignParty.ts) implement the supported cases.
Class-combination legality, racial level limits, training costs, spell accounting
and automatic HP advancement are not calculated.

## Character order and carry-forward

Drag character names in Session or Possessions to reorder them. Focused names also
accept Option-Shift-Up/Down; Possessions accepts Left/Right as well. The selected
session owns its order. References, current XP displays, Possessions and Banking
follow that order subject to membership/eligibility; earlier sessions and confirmed
records remain unchanged.

Possessions uses unique normalized-name matching to align holders with roster
identities. Ambiguous/unmatched holders remain in their own following group and
can be reordered there; storage follows characters. There is no saved profile link.

**+ Session** copies selected profiles and their order independently of inventory,
encounters and notes. New/returning profiles append to the destination's order.
Retired profiles are omitted according to their last eligible session. Restoring
membership through Session's **+ Character** does not restore gear; use the separate
[possessions workflow](desktop-possessions.md#inventory-membership).

## Encumbrance on Reference

Carried load and the four inclusive limits use the selected Act’s Gear holder
and Gear Strength, including exceptional Strength. The checkmark identifies the
weight band. Room at light load is measured against the 12″ limit, even when
armor sets a lower movement rate. Above the last limit, movement is 0″.

Click the character’s name and set **Worn armor** in the Act profile. Choose
**No worn armor** for an unarmored character, including one wearing bracers of
defense. For a custom suit, also choose its body armor type. An unrecorded
choice, a missing holder, or a suit that has moved into a pack or to another
holder leaves the armor limit and final movement unknown.

Ordinary body armor uses the base rates on DMG p. 27. This campaign uses the
PHB p. 36 and DMG p. 164 treatment of a worn magical suit: it contributes zero
load and permits an unarmored base move. Other gear still limits movement.
Campaign Gear and Reference apply this allowance to one suit from the selected
stack. Packed or spare armor uses its recorded Gear weight, including explicit
weight overrides. Magical shields retain their weight. DMG p. 28 gives an
alternative for magical armor (half weight and one faster movement band).
