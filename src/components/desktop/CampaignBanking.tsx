import { useState } from 'react';
import type { CampaignDocument } from '../../helpers/campaignDocument';
import {
  bankKindLabel,
  bankDenominations,
} from '../../helpers/campaignBankingModel';
import type { BankEntry } from '../../helpers/campaignBankingModel';
import {
  bankLedger,
  bankHolderName,
  bankBalanceHolders,
  bankBalance,
  activeBankEntries,
  bankBoundaryDifference,
  bankReconciliationFingerprint,
  commitBankReconciliation,
  bankChangesAmounts,
  bankGp,
} from '../../helpers/campaignBanking';
import BankBalances from './BankBalances';
import BankOpeningDialog from './BankOpeningDialog';
import BankTransactionDialog from './BankTransactionDialog';
import styles from './xpWorkspace.module.css';

export default function CampaignBanking({
  document,
  sessionId,
  onChange,
}: {
  document: CampaignDocument;
  sessionId: string;
  onChange: (change: (doc: CampaignDocument) => CampaignDocument) => boolean;
}) {
  const [openings, setOpenings] = useState(false);
  const [editing, setEditing] = useState<{ entry?: BankEntry }>();
  const [error, setError] = useState('');
  const ledger = bankLedger(document);
  const working = document.workingInventories.find(
    (w) => w.sessionId === sessionId
  );
  const holders = working ? bankBalanceHolders(document, sessionId) : [];
  const label = (id: string) => bankHolderName(document, id);
  const entries = activeBankEntries(ledger.entries)
    .filter((e) => e.sessionId === sessionId && e.status !== 'void')
    .sort((a, b) => a.order - b.order);
  const differences = bankBoundaryDifference(document, sessionId);
  const hasExcess = differences.some((d) =>
    bankDenominations.some((code) => (d.difference[code] ?? 0) < 0)
  );
  const differenceTitle = hasExcess
    ? 'Balances to reconcile'
    : 'Still to record';
  return (
    <div className={styles['workspace']}>
      <div className={styles['heading']}>
        <h2>Banking</h2>
        <div className={styles['actions']}>
          <button disabled={!holders.length} onClick={() => setOpenings(true)}>
            Opening balances
          </button>
          <button disabled={!holders.length} onClick={() => setEditing({})}>
            + Transaction
          </button>
        </div>
      </div>
      {!working ? (
        <p>Create or import this session’s possessions to use Banking.</p>
      ) : (
        <>
          <BankBalances
            showTotals
            caption="Ledger balances"
            label="Ledger balances"
            rows={holders.map((h) => ({
              id: h.id,
              label: h.name,
              amounts: bankBalance(document, h.id, sessionId),
            }))}
          />
          {differences.length > 0 && (
            <section
              aria-label={differenceTitle}
              className={styles['bankDifference']}
            >
              <BankBalances
                showTotals
                signed
                caption={differenceTitle}
                label="Possessions minus ledger"
                rows={differences.map((difference) => ({
                  id: difference.holderId,
                  label: label(difference.holderId),
                  amounts: difference.difference,
                }))}
              />
              {hasExcess && (
                <small>
                  Negative quantities are recorded in excess of possessions.
                </small>
              )}
              <div className={styles['actions']}>
                <button
                  onClick={() => {
                    const id = crypto.randomUUID(),
                      at = new Date().toISOString(),
                      expected = bankReconciliationFingerprint(
                        document,
                        sessionId
                      );
                    try {
                      if (
                        onChange((doc) =>
                          commitBankReconciliation(
                            doc,
                            sessionId,
                            expected,
                            id,
                            at
                          )
                        )
                      )
                        setError('');
                    } catch (e) {
                      setError(e instanceof Error ? e.message : String(e));
                    }
                  }}
                >
                  Record remaining difference as adjustment
                </button>
              </div>
            </section>
          )}
        </>
      )}
      <table aria-label="Banking transactions">
        <thead>
          <tr>
            <th>Transaction</th>
            <th>Holders</th>
            <th>GP change</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => (
            <tr key={e.id}>
              <th scope="row">
                <button
                  className={styles['textButton']}
                  onClick={() => setEditing({ entry: e })}
                >
                  {e.description}
                </button>
                <small>
                  {bankKindLabel(e.kind)}
                  {e.receiptMode === 'existing' &&
                    ' · Already recorded in possessions'}
                  {e.status === 'draft' ? ' · Historical draft' : ''}
                </small>
              </th>
              <td>
                {Array.from(
                  new Set(e.changes.map((c) => label(c.holderId)))
                ).join(', ')}
              </td>
              <td>{bankGp(bankChangesAmounts(e.changes))}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {!entries.length && <p>No transactions in this session.</p>}
      {error && <p role="alert">{error}</p>}
      {openings && (
        <BankOpeningDialog
          document={document}
          sessionId={sessionId}
          onChange={onChange}
          onClose={() => setOpenings(false)}
        />
      )}
      {editing && (
        <BankTransactionDialog
          key={editing.entry?.id ?? 'new'}
          document={document}
          sessionId={sessionId}
          entry={editing.entry}
          onChange={onChange}
          onClose={() => setEditing(undefined)}
        />
      )}
    </div>
  );
}
