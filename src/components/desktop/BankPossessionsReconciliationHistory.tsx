import type { CampaignDocument } from '../../helpers/campaignDocument';
import type { BankPossessionsReconciliation } from '../../helpers/campaignBankingModel';
import { bankHolderName, bankLedger } from '../../helpers/campaignBanking';
import styles from './xpWorkspace.module.css';
export default function BankPossessionsReconciliationHistory({
  document,
  record,
  onClose,
}: {
  document: CampaignDocument;
  record: BankPossessionsReconciliation;
  onClose: () => void;
}) {
  const source = bankLedger(document).entries.find(
    (e) => e.id === record.sourceEntryId
  );
  return (
    <div
      className={styles['backdrop']}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        className={styles['modal']}
        role="dialog"
        aria-modal="true"
        aria-label="Historical possessions reconciliation"
        onKeyDown={(e) => {
          if (e.key === 'Escape') onClose();
        }}
      >
        <h2>Possessions reconciliation</h2>
        <p>
          {new Date(record.at).toLocaleString()} · {source?.description}
        </p>
        <div className={styles['tableScroll']}>
          <table>
            <thead>
              <tr>
                <th>Holder / stack</th>
                <th>Currency</th>
                <th>Before</th>
                <th>Removed</th>
                <th>After</th>
                <th>Recorded ledger balance</th>
              </tr>
            </thead>
            <tbody>
              {record.changes.map((c) => (
                <tr key={JSON.stringify([c.holderId, c.item.id])}>
                  <th>
                    {bankHolderName(document, c.holderId)}
                    <small>{c.item.name}</small>
                  </th>
                  <td>{c.denomination}</td>
                  <td>{c.item.quantity.toLocaleString()}</td>
                  <td>{(-c.quantity).toLocaleString()}</td>
                  <td>{(c.item.quantity + c.quantity).toLocaleString()}</td>
                  <td>
                    {record.balances
                      .find((b) => b.holderId === c.holderId)
                      ?.ledger[c.denomination]?.toLocaleString() ?? 'Unknown'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className={styles['footer']}>
          <button autoFocus onClick={onClose}>
            Close
          </button>
        </div>
      </section>
    </div>
  );
}
