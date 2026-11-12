# Campaign XP

An XP event records **where XP was earned**. An award point records **where it was
settled**. Session balances include accepted awards at or before that session's end,
not pending events earned there. Campaign Save persists XP drafts and history but
never confirms an award implicitly. See [profiles](desktop-party-reference.md) for
trained levels, class identities and bonuses.

## Record and award XP

1. Establish **Opening balances**, including each character's starting session.
   Blank is unknown, not zero. **Set listed unlocked balances to 0** is an explicit
   choice for known zeros; multiclass openings can hold separate class balances.
2. Use **+ XP Event** for Monsters, Money or Treasure. Enter facts manually or copy
   encounter/possession evidence for review. Recording an event establishes that it
   was obtained; saving it creates a pending draft, not an award.
3. Review participation and XP-recipient flags independently. Monster inputs use
   literal HD/levels, actual total starting HP and ability counts. Remaining combat
   HP and attack categories are not substitutes. Profiles/participants are mapped
   explicitly. **Override…** edits the ratio; **Adjust XP…** edits raw totals, shares
   or allocations with a reason. Calculated values remain inspectable.
4. For Treasure, enter Retained-item XP and/or Sale value (GP), then choose Keep,
   Sell or Defer. Keep uses retained XP; Sell uses sale value; Defer stays pending.
   None of these choices changes possessions or Banking.
5. Use **+ Award point** in the settlement session. Name it and place it in the
   timeline after the relevant earned events. Select intended event rows in the
   award matrix. Future and deferred events cannot be included. Review each
   recipient's bonus, cap and settlement choice.
6. **Preview award** shows full awards, additions, discards and before/after balances
   in the same matrix. Bonus/final-award adjustments invalidate the preview. Unknown
   balances or unresolved caps require review. **Confirm award** accepts the result;
   closing the modal or saving a draft does not.

XP opens on the timeline. Click an event or award to inspect/edit it. Pending rows
can move earlier/later; confirmed points and events used in accepted history are
fixed. Session-tab order is the chronology, not dates parsed from labels. Award
rows display event chronology even when their stored selection order differs.
An unawarded mistaken event can be deleted only if no accepted version uses it.

## Recipient settlement

For each unresolved original share, choose **Award now**, **Later**, or **Forfeit**.
Only Award now enters bonus, rounding, class and cap calculations. Forfeit can record
a reason; Later stays pending. Save draft retains provisional choices; Cancel drops
them. Confirmation records payments and forfeitures together, with duplicate protection.

Retirement automatically forfeits unresolved shares after the inclusive last
eligible session. Temporary absence or removal from a session does not forfeit earned
XP. An absent recipient uses the latest known profile at or before the award session,
never a future profile; review its bonus/cap basis as needed. No share is redistributed
because another recipient forfeits or reaches a cap.

The first confirmation freezes participation, ratio, allocations and treasure choice.
Later settlements retain that basis. Allocation changes are blocked while another
active settlement uses the event; correct those settlements first. Use **Edit award**
for corrections rather than silently editing accepted calculations.

## Calculation and training caps

Monster XP uses base value + cumulative ability additions + starting HP × XP/HP.
The proposed ratio is `min(1, adjusted difficulty / participating levels)`. Money and
Treasure default to ratio 1, with reviewed reductions available. Missing facts remain
unknown. Explained overrides retain their calculated/underlying values for inspection.

Arithmetic uses exact reduced rational values. Aggregate a character's accepted
shares, apply its bonus, then round to nearest whole XP with halves upward. For a
multiclass recipient, divide its base equally among classes, apply each class's
bonus and rounding, then apply each class's cap independently. Character totals sum
the actual class additions; a multiclass character still receives one character share.

The campaign's cap policy applies **after** calculating the full award:

- Added XP = `min(full award, max(0, cap − existing balance))`.
- Discarded XP = `full award − added XP`.
- New balance = `existing balance + added XP`.

The standard cap is the first XP point of the next trained class level. Temporary
effective-level effects do not increase it. Training is a manual session-profile
change; discarded XP is neither banked nor restored by later training. Balances
already at/above a cap are not reduced. Unknown, custom or terminal caps require an
explicit reviewed basis; absolute-cap and uncapped exceptions require a reason.

For example, Fighter 5 at 34,800 with a 500 share and 10% bonus has full XP 550,
adds 201 to reach 35,001, and discards 349. Training a later profile to Fighter 6
changes its next cap, not the old receipt. Mapping accepted single-class history
into classes requires explicit class balances that sum to the prior total; class
identities already used by XP cannot simply be removed.

Rules references and data: DMG printed pp. 84–85 and
[monster XP coefficients](../src/tables/monsterExperience.ts); PHB printed
pp. 20–27, 30–31 and 117–118 and [class thresholds](../src/tables/classExperience.ts).
The monster table distinguishes below 1−1 from exactly 1−1; positive HP additions
also affect difficulty separately from coefficient-band selection. Ability
classification and unusual circumstances remain DM judgments. No automatic monster
database, training, racial-level-limit, spell or HP accounting is implied.

## History and corrections

Accepted awards freeze source versions/evidence, recipients, levels, allocations,
bonuses, rounding, cap bases and balances. Later profile/source/custody changes do
not recalculate them. Draft evidence can be explicitly refreshed and reviewed;
source identity and continuation lineage prevent accidental duplicate rewards.

**Edit award…** creates a linked correction while retaining the original. If later
accepted balances change, preview and acknowledge them; confirmation appends the
correction and dependent reviewed versions atomically. Later full amounts and cap
bases remain recorded, with additions/discards recalculated against the corrected
balances. Legacy calculator versions retain their original rules; unrecorded cap
history is not fabricated from today's profile.

**Extend history backward** reconciles earlier award drafts and earlier openings
against established history. Differences must reconcile exactly, including each
class rather than only the character total. Previously accepted openings and audit
records remain inspectable. This is the explicit route for historical reconstruction,
not permission to reorder confirmed history or overwrite accepted receipts.

The [XP helpers](../src/helpers/campaignXp.ts), [class calculations](../src/helpers/campaignXpClasses.ts)
and [cap logic](../src/helpers/campaignXpCap.ts) share their validation with the native
boundary. Source snapshots and historical amounts remain protected through save,
reopen, correction and retry.
