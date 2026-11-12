# Independent possessions and deliberate banking

Manual edits in campaign Possessions update the physical inventory only. Adding,
removing, spending, merging, moving or changing money never automatically posts a
financial adjustment or transfer. Banking shows the difference between physical
quantities and the recorded ledger until the DM resolves it. Changes that offset
each other can cancel the net difference; matching balances do not guarantee that
every intermediate financial event has been recorded.

The Banking editor offers two modes for Income, Payment, Transfer and Exchange:

- The ordinary mode updates both the ledger and the corresponding possessions.
- **Already recorded in possessions** updates only the ledger. Use it after
  making the physical change yourself. Outgoing amounts use recorded balances;
  incoming quantities use existing stacks. Signed quantities, transfers,
  exchange value, explicit fees, known openings, retries and corrections retain
  their validations. Editing/deleting a ledger-only transaction never reverses
  its physical changes.

The editor previews ledger balances and the remaining discrepancy. It accepts
partial reconciliation, rejects over-allocation, and keeps the mode fixed on
recorded transactions. Exchange previews retain entered progress before both
sides are complete. Transactions still commit atomically and wait for accepted
editor changes before Save, Quit or Finder Open.

Full imports and historical inventory restores keep their explicit money
comparison, preserve the displaced checkpoint and leave the ledger unchanged.
They may therefore leave a discrepancy for deliberate Banking review. Earlier
transaction corrections still affect derived later balances, while existing
later inventory snapshots remain independent.

## Existing history and migration

V20 identifies this ownership policy and the new ledger-only Payment/Exchange
support. V1–V19 documents retain openings, transactions (including old automatic
adjustments), corrections, inventory evidence and physical quantities exactly.
No old entry is removed or reinterpreted. Ordinary routine saves remain quiet;
a real schema upgrade uses the existing original-recovery-copy policy.

The dedicated stale-stack creation action has been removed. Any previously
saved V19 possessions-reconciliation records remain immutable and inspectable
under their existing history section; new ones cannot be appended. They have
no financial effect. The old automatic-adjustment creator is also removed.

For the Vitameno case, Day2's recorded 50 ep loss already makes the Day3 ledger
zero. Deleting the stale 50 ep stack directly in Day3 Possessions now leaves
both quantities at zero and creates no transaction. A disposable SOCK copy and
synthetic regression fixtures exercise this case without changing live files.
