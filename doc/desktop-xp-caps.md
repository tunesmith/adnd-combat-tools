# XP caps before training

This implements the DM's campaign policy, not an automatic training system.
Calculate the full share, percentage bonus, final rounding and any explained
full-award override first. Then:

- Added XP = min(full award, max(0, cap − existing balance)).
- Discarded XP = full award − added XP.
- New balance = existing balance + added XP.

The cap is the first XP point of the next level for the session profile's
**trained class and base level**. Temporary effective-level effects, combat
categories, save-as choices and retained bard-training levels do not select
another XP table. Training is a manual profile update. Discarded XP is not
banked, redistributed or restored by later training. Existing balances at or
above the cap are retained and add zero; no balance is repaired downward.

## PHB data

The numeric minimums and continuation increments were checked against the
first-edition Players Handbook (Orange Spine), read in place. Printed pages:

| Class       | Page    | Continuation / terminal coverage            |
| ----------- | ------- | ------------------------------------------- |
| Cleric      | 20      | +225,000 per level beyond the printed table |
| Druid       | 21      | Through level 14; no inferred next level    |
| Fighter     | 22      | +250,000 beyond the printed table           |
| Paladin     | 24      | +350,000 beyond the printed table           |
| Ranger      | 25      | +325,000 beyond the printed table           |
| Magic-user  | 25–26   | +375,000 beyond the printed table           |
| Illusionist | 26      | +220,000 beyond the printed table           |
| Thief       | 27      | +220,000 beyond the printed table           |
| Assassin    | 30      | Through level 15; no inferred next level    |
| Monk        | 31      | Through level 17; no inferred next level    |
| Bard        | 117–118 | Through level 23; no inferred next level    |

Minimums are stored exactly, including their final 1. Fighter 5 caps at
35,001 and Fighter 6 at 70,001. Ranger and druid use their own tables.
Only an actual bard-class profile uses the bard table. Manual/custom profiles,
level zero and absent/terminal thresholds are unknown, never implicitly zero
or unlimited. No source scans, extracted book text or private campaign data
are included in the repository/builds.

## Workflow

Session's compact XP reference shows **XP cap** immediately after Base level,
even when the opening balance is unknown. XP added this session sums applied
increments from current accepted versions, not full awards or superseded versions.

In an award, Preview shows Full award, XP cap, XP added, Discarded and balances
in the same matrix. A known class/level needs no extra setup. Click the cap
value to review a contextual exception. An explicit absolute cap or uncapped
exception requires a reason. Unknown caps block confirmation until reviewed;
unknown opening balances retain their existing confirmation safeguard.

For a synthetic Fighter 5 starting at 34,800, a 500 share with 10% bonus gives
550 full XP, 201 added, 349 discarded, and balance 35,001. After manually
training the next session's profile to Fighter 6, a new full award of 100 adds
100; the old discard and old session profile remain unchanged.

## Persistence, migration and corrections

Campaign V12 accepts V1–V11 and keeps the existing XP timeline representation.
New awards use calculator version 2. The existing `award` field remains the
actual applied increment. New rows freeze `fullAward`, `discarded` and a `cap`
basis containing trained class/base level, mode, absolute limit and reason.
The old `rounded` and `finalOverride` fields retain their full-award meaning.

Legacy calculator-version-1 records remain exactly unchanged as JSON values.
They are validated with the original uncapped calculation; the UI shows cap
history as Not recorded, not a fabricated standard cap or discarded amount.
An old above-cap balance stays intact. No migration changes accepted amounts,
original source evidence or historical corrections. The first actual disk-schema
upgrade retains exact original bytes once without overwriting older backups;
routine saves remain quiet and atomic.

Edit award starts capped revisions with their recorded basis, even after the
current profile has trained. A deliberate historical basis change requires a
reason. Editing a legacy award with no recorded cap requires explicit historical
basis/cap review rather than guessing today's level. Profile class/base changes
and cap edits invalidate a preview; effective-level toggles do not raise caps.

An earlier correction previews later balances using each later award's frozen
full amount and cap. Changed applied/discarded XP is shown for explicit review.
Confirmation atomically appends the correction and linked later revisions;
original records remain immutable. Legacy later awards retain their original
calculation version. Retry confirmation is idempotent. This does not implement
backward-history extension, automatic training, class changes, banking,
redistribution, inventory mutation or combat synchronization.

## Verification

942 Jest tests and 20 native Rust/QuickJS tests pass, along with type checking,
formatting, lint (one pre-existing warning), the Mac bundle and public static
build. Tests include class boundaries/continuations, full overrides before caps,
non-redistribution, unknown/explicit/uncapped decisions, stale previews,
cap-aware later revisions (including revising a balance-review version),
unchanged legacy JSON records, migration recovery bytes, atomic write failure
and external conflicts.

In the packaged app, a disposable Fighter 5 preview/confirmation preserved full
550, added 201, discarded 349 and balance 35,001. Manually training only the
second session profile to Fighter 6 raised its reference to 70,001. A new full
award of 100 added 100, reaching 35,101; the original F5 receipt and its 349
discard remained unchanged. Full quit/Reopen last retained the values, and
Session showed actual additions of 201 then 100. A separate V11 legacy fixture
saved/reopened as V12 with identical accepted event JSON values, unchanged
507/507/507/461/507 balances and cap history marked Not recorded. Its first
upgrade retained the exact original bytes; the next save created no additional
backup. The native collision test also preserves a pre-existing backup.

All fixtures/interaction files are synthetic. The temporary playtest app was
quit, unregistered and archived after checking. No live campaign, private source,
existing live backup, Dropbox or TOOFRepo content was modified. Nothing was
pushed, deployed or released.
