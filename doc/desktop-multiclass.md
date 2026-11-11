# Multiclass profiles and XP

The campaign profile can have two or three class entries under one character
identity. Shared identity details, attributes, max HP, notes and membership remain
on the character/profile. Each class has a stable ID, trained level and explicit
XP bonus. Carrying a profile copies the class IDs and independently editable
session values. The selected combat basis copies one supported class/level into
the existing tracker; it creates no link or synchronization.

Saving throws take the lowest base target in each category across the classes.
Manual targets and save notes retain their existing behavior. A temporary level
effect selects one affected class. Training caps use trained levels, never that
temporary effect. Bard progression and manual/creature profiles retain their
single-profile paths. Class combinations, racial level limits, training costs,
HP and spell accounting are not automated.

Rules checked against the first-edition PHB, printed pp. 16, 18, 32–33, and DMG,
printed p. 79. The PHB's equal XP split applies even when advancement in one class
has stopped. The per-class training cap applies the campaign's existing rule.

## XP calculation and persistence

1. Divide the event among eligible characters using the existing ratio, shares
   and accepted allocation rules. A multiclass character is one recipient.
2. Divide that character's accepted base equally between its classes using the
   existing exact rational arithmetic.
3. Apply each class's explicit bonus and round its full award using the existing
   nearest-whole, halves-up policy.
4. Independently cap each class's addition. Discard excess without redistributing
   it. Character/session totals sum the actual additions.

V18 adds optional profile classes, per-class openings and nested award-class
snapshots. Old single-class documents and calculator versions 1/2 retain their
recorded values. New multiclass awards use calculator version 3 and freeze each
class's allocations, trained level, bonus, cap, full award, addition and balance.
The outer character row retains one character share and aggregate accounting.

An opening can contain explicit class balances; a blank is unknown, not zero.
Converting confirmed single-class XP requires an explicit mapping in the award's
class review. The entered class balances must sum to the existing character
balance immediately before that award. Earlier awards are never silently split.
Class identities already used by XP cannot be removed from an existing profile.

Linked corrections recalculate class additions against revised balances using
the recorded full awards and caps, and retain the existing later-award review.
Backward extensions require exact reconciliation for every class, even if class
differences would cancel in the character total. Superseded class openings remain
in the existing extension audit. The shared native boundary validates the same
calculations. Atomic saves, conflicts, failed-save recovery and quiet routine
saves retain their existing behavior; a genuine older-schema upgrade keeps its
original recovery copy.

## Walkthrough

On Session, click a character's name (or + Character). Choose its first class and
level, then + Class. Set each class's level and XP bonus, select a combat basis,
and enter shared HP once. Save the profile. References uses the same profile.
For unequal class levels, explicitly choose the participant's encounter level in
an XP event; it is independent of the XP split and combat basis.

In XP → Opening balances, enter each class's starting XP or explicitly set zeros.

- Award point shows live per-class results. Bonuses/caps remain reviewable. Try
  Keep/Sell/Defer scenarios; Cancel/Escape discards hypothetical changes. Confirm
  award accepts the included choices and class results together, then Campaign
  Save persists them. To train, edit only that session profile's trained class
  level. Confirmed historical awards keep their recorded basis.

Synthetic fixtures cover Kramrak's shared 6 HP, Fighter 1/Thief 1, separate bonuses,
exact fractions, one capped class, manual training, session copies, live treasure,
legacy balance mapping, corrections, repeated backward extensions and native
save/reopen/failure/conflict handling. No campaign sources are bundled.
