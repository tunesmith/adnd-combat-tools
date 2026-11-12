import { inSessionInventoryOrder } from '../../helpers/campaignInventoryOrder';
import { useRef, useState } from 'react';
import type { CampaignDocument } from '../../helpers/campaignDocument';
import {
  activeBankEntries,
  bankHolders,
  bankLedger,
  holderMoney,
  saveBankOpenings,
  previewBankExtension,
  confirmBankExtension,
} from '../../helpers/campaignBanking';
import {
  bankDenominations,
  zeroBankAmounts,
} from '../../helpers/campaignBankingModel';
import type { BankOpening } from '../../helpers/campaignBankingModel';
import BankBalances from './BankBalances';
import styles from './xpWorkspace.module.css';
const uid = () => crypto.randomUUID();
export default function BankOpeningDialog({
  document,
  sessionId,
  onChange,
  onClose,
}: {
  document: CampaignDocument;
  sessionId: string;
  onChange: (change: (doc: CampaignDocument) => CampaignDocument) => boolean;
  onClose: () => void;
}) {
  const ledger = bankLedger(document);
  const working = document.workingInventories.find(
    (w) => w.sessionId === sessionId
  );
  const holders = inSessionInventoryOrder(
    document,
    sessionId,
    Array.from(
      new Map(
        [...document.workingInventories, ...document.inventoryCheckpoints]
          .flatMap((w) => bankHolders(w.document))
          .map((h) => [h.id, h])
      ).values()
    ),
    (h) => h.id
  );
  const [extending, setExtending] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [pointIds, setPointIds] = useState<string[]>([]);
  const [entries, setEntries] = useState<BankOpening[]>(() =>
    holders.map(
      (h) =>
        ledger.openings.find((o) => o.holderId === h.id) ?? {
          id: uid(),
          holderId: h.id,
          sessionId,
          phase: 'before',
          amounts: {
            cp: null,
            sp: null,
            ep: null,
            gp: null,
            pp: null,
            diamond: null,
            emerald: null,
          },
          note: 'Reviewed opening balance',
        }
    )
  );
  const [error, setError] = useState('');
  const [preview, setPreview] =
    useState<ReturnType<typeof previewBankExtension>>();
  const operation = useRef<{ fingerprint: string; id: string; at: string }>();
  const drafts = activeBankEntries(ledger.entries).filter(
    (e) => e.status === 'draft'
  );
  const inputs = entries.filter((o) => selected.includes(o.holderId));
  const locked = (holderId: string) =>
    ledger.openings.some((o) => o.holderId === holderId) &&
    (ledger.entries.some(
      (e) =>
        e.status === 'posted' && e.changes.some((c) => c.holderId === holderId)
    ) ||
      ledger.extensions.some((e) =>
        e.openings.some((o) => o.previous.holderId === holderId)
      ));
  function update(id: string, change: Partial<BankOpening>) {
    setEntries(
      entries.map((o) => (o.holderId === id ? { ...o, ...change } : o))
    );
    setPreview(undefined);
    setError('');
  }
  function attempt(action: () => void) {
    try {
      action();
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }
  return (
    <div className={styles['backdrop']}>
      <section
        className={styles['modal']}
        role="dialog"
        aria-modal="true"
        aria-label="Banking openings"
        onKeyDown={(e) => {
          if (e.key === 'Escape') onClose();
        }}
      >
        <h2>
          {extending
            ? 'Extend banking history backward'
            : 'Banking opening balances'}
        </h2>
        <p>
          Choose what point in the session these physical quantities describe.
          Blank quantities remain unknown.
        </p>
        {extending && (
          <fieldset>
            <legend>Historical transaction drafts</legend>
            {drafts.map((entry) => (
              <label className={styles['check']} key={entry.id}>
                <input
                  type="checkbox"
                  checked={pointIds.includes(entry.transactionId)}
                  onChange={(e) => {
                    setPointIds(
                      e.target.checked
                        ? [...pointIds, entry.transactionId]
                        : pointIds.filter((id) => id !== entry.transactionId)
                    );
                    setPreview(undefined);
                  }}
                />
                {document.sessions.find((s) => s.id === entry.sessionId)?.label}{' '}
                · {entry.description}
              </label>
            ))}
          </fieldset>
        )}
        <div className={styles['tableScroll']}>
          <table aria-label="Opening denomination quantities">
            <thead>
              <tr>
                <th>Use</th>
                <th>Holder</th>
                <th>Balance point</th>
                {bankDenominations.map((c) => (
                  <th key={c}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => {
                const holder = holders.find((h) => h.id === entry.holderId);
                const disabled = !extending && locked(entry.holderId);
                const original = ledger.openings.find(
                  (o) => o.holderId === entry.holderId
                );
                return (
                  <tr key={entry.holderId}>
                    <td>
                      <input
                        type="checkbox"
                        aria-label={`Use ${holder?.name} opening`}
                        disabled={
                          disabled &&
                          bankDenominations.every(
                            (c) => original?.amounts[c] !== null
                          )
                        }
                        checked={selected.includes(entry.holderId)}
                        onChange={(e) => {
                          setSelected(
                            e.target.checked
                              ? [...selected, entry.holderId]
                              : selected.filter((id) => id !== entry.holderId)
                          );
                          setPreview(undefined);
                        }}
                      />
                    </td>
                    <th scope="row">{holder?.name}</th>
                    <td>
                      <select
                        aria-label={`${holder?.name} opening phase`}
                        value={entry.phase}
                        disabled={disabled}
                        onChange={(e) =>
                          update(entry.holderId, {
                            phase:
                              e.target.value === 'before' ? 'before' : 'after',
                          })
                        }
                      >
                        <option value="before">Before</option>
                        <option value="after">After</option>
                      </select>
                      <select
                        aria-label={`${holder?.name} opening session`}
                        value={entry.sessionId}
                        disabled={disabled}
                        onChange={(e) =>
                          update(entry.holderId, { sessionId: e.target.value })
                        }
                      >
                        {document.sessions.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    {bankDenominations.map((code) => (
                      <td key={code}>
                        <input
                          type="number"
                          min={0}
                          step={1}
                          disabled={
                            disabled && original?.amounts[code] !== null
                          }
                          aria-label={`${holder?.name} opening ${code}`}
                          value={entry.amounts[code] ?? ''}
                          onChange={(e) =>
                            update(entry.holderId, {
                              amounts: {
                                ...entry.amounts,
                                [code]:
                                  e.target.value === ''
                                    ? null
                                    : e.target.valueAsNumber,
                              },
                            })
                          }
                        />
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!extending && working && (
          <button
            onClick={() => {
              setEntries(
                entries.map((o) =>
                  selected.includes(o.holderId) && !locked(o.holderId)
                    ? {
                        ...o,
                        amounts: holderMoney(working.document, o.holderId),
                        sessionId,
                        phase: 'after',
                        note: 'Reviewed closing possessions quantities',
                      }
                    : o
                )
              );
            }}
          >
            Use selected holders’ closing possessions
          </button>
        )}
        {extending && preview && (
          <>
            <BankBalances
              label="Reconstructed cutoff"
              rows={preview.rows.map((r) => ({
                id: r.holderId,
                label:
                  holders.find((h) => h.id === r.holderId)?.name ?? r.holderId,
                amounts: r.reconstructed ?? {
                  ...zeroBankAmounts(),
                  cp: null,
                  sp: null,
                  ep: null,
                  gp: null,
                  pp: null,
                  diamond: null,
                  emerald: null,
                },
              }))}
            />
            <BankBalances
              label="Cutoff differences"
              signed
              rows={preview.rows.map((r) => ({
                id: r.holderId,
                label:
                  holders.find((h) => h.id === r.holderId)?.name ?? r.holderId,
                amounts: r.difference ?? {
                  cp: null,
                  sp: null,
                  ep: null,
                  gp: null,
                  pp: null,
                  diamond: null,
                  emerald: null,
                },
              }))}
            />
          </>
        )}
        {ledger.extensions.length > 0 && (
          <details>
            <summary>Previous banking openings</summary>
            {ledger.extensions.map((e) => (
              <div key={e.id}>
                <p>{new Date(e.at).toLocaleString()}</p>
                <BankBalances
                  rows={e.openings.map((o) => ({
                    id: o.previous.id,
                    label:
                      (holders.find((h) => h.id === o.previous.holderId)
                        ?.name ?? o.previous.holderId) +
                      ' · ' +
                      o.previous.phase +
                      ' ' +
                      document.sessions.find(
                        (s) => s.id === o.previous.sessionId
                      )?.label,
                    amounts: o.previous.amounts,
                  }))}
                />
              </div>
            ))}
          </details>
        )}
        {error && <p role="alert">{error}</p>}
        <div className={styles['footer']}>
          {!extending && ledger.openings.length > 0 && (
            <button
              onClick={() => {
                setExtending(true);
                setPreview(undefined);
                setSelected([]);
                setEntries(
                  entries.map((o) => ({
                    ...o,
                    phase: 'before',
                    amounts: {
                      cp: null,
                      sp: null,
                      ep: null,
                      gp: null,
                      pp: null,
                      diamond: null,
                      emerald: null,
                    },
                  }))
                );
              }}
            >
              Extend history backward…
            </button>
          )}
          <button onClick={onClose}>Cancel</button>
          {!extending ? (
            <button
              disabled={!inputs.length}
              className={styles['primary']}
              onClick={() =>
                attempt(() => {
                  if (onChange((doc) => saveBankOpenings(doc, inputs)))
                    onClose();
                })
              }
            >
              Save openings
            </button>
          ) : (
            <>
              <button
                disabled={!inputs.length || !pointIds.length}
                onClick={() =>
                  attempt(() =>
                    setPreview(
                      previewBankExtension(document, {
                        openings: inputs,
                        transactionIds: pointIds,
                      })
                    )
                  )
                }
              >
                Preview reconciliation
              </button>
              {preview && (
                <button
                  className={styles['primary']}
                  disabled={preview.rows.some(
                    (r) =>
                      !r.difference ||
                      bankDenominations.some((c) => r.difference?.[c] !== 0)
                  )}
                  onClick={() =>
                    attempt(() => {
                      if (
                        operation.current?.fingerprint !== preview.fingerprint
                      )
                        operation.current = {
                          fingerprint: preview.fingerprint,
                          id: uid(),
                          at: new Date().toISOString(),
                        };
                      const { id, at } = operation.current;
                      if (
                        onChange((doc) =>
                          confirmBankExtension(
                            doc,
                            { openings: inputs, transactionIds: pointIds },
                            preview.fingerprint,
                            id,
                            at
                          )
                        )
                      )
                        onClose();
                    })
                  }
                >
                  Confirm extension
                </button>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
