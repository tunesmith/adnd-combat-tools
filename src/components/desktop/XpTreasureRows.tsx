import { useState } from 'react';
import type { XpTreasureRow } from '../../helpers/campaignXpModel';
import {
  newTreasureRow,
  treasureAmount,
  treasureSubtotal,
} from '../../helpers/campaignXpTreasure';
import {
  captureTreasurePossession,
  type possessionXpCandidates,
} from '../../helpers/campaignXpSources';
import { xpDisplay } from '../../helpers/xpArithmetic';
import styles from './xpWorkspace.module.css';

type Possession = ReturnType<typeof possessionXpCandidates>[number];

export function TreasureSubtotal({ rows }: { rows: XpTreasureRow[] }) {
  const { subtotal, deferred, missing } = treasureSubtotal(rows);
  return (
    <p>
      <strong>{xpDisplay(subtotal)} raw XP decided</strong>
      {deferred > 0 && ` · ${deferred} deferred`}
      {missing > 0 && ` · ${missing} missing an amount`}
    </p>
  );
}
function contribution(row: XpTreasureRow) {
  if (row.disposition === 'defer') return 'Awaiting decision';
  const amount = treasureAmount(row);
  if (amount === null)
    return row.disposition === 'keep' ? 'Enter retained XP' : 'Enter proceeds';
  try {
    return xpDisplay(amount) + ' XP';
  } catch {
    return 'Check amount';
  }
}
export function TreasureReview({
  rows,
  selected,
  onSelect,
}: {
  rows: XpTreasureRow[];
  selected?: string;
  onSelect?: (id: string) => void;
}) {
  return (
    <>
      <table aria-label="Treasure items">
        <thead>
          <tr>
            <th>Item or lot</th>
            <th>Decision</th>
            {!onSelect && (
              <>
                <th>Market (gp)</th>
                <th>Retained XP</th>
                <th>Proceeds (gp)</th>
              </>
            )}
            <th>Contribution</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.id} data-selected={row.id === selected}>
              <th scope="row">
                {onSelect ? (
                  <button
                    type="button"
                    aria-pressed={selected === row.id}
                    className={styles['textButton']}
                    onClick={() => onSelect(row.id)}
                  >
                    {row.label || `Item ${i + 1}`}
                  </button>
                ) : (
                  row.label || `Item ${i + 1}`
                )}
                {!onSelect && row.evidence && (
                  <small>
                    {row.evidence.label} · {frozenLot(row.evidence.snapshot)}
                  </small>
                )}
              </th>
              <td>
                {
                  { keep: 'Keep', sell: 'Sell', defer: 'Defer' }[
                    row.disposition
                  ]
                }
              </td>
              {!onSelect && (
                <>
                  {[row.marketGp, row.retainedXp, row.proceeds].map(
                    (amount, index) => (
                      <td key={index}>
                        {amount === null ? '—' : xpDisplay(amount)}
                      </td>
                    )
                  )}
                </>
              )}
              <td>{contribution(row)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <TreasureSubtotal rows={rows} />
    </>
  );
}
function frozenLot(snapshot: unknown) {
  const record = (v: unknown): v is Record<string, unknown> =>
    v !== null && typeof v === 'object';
  if (
    !record(snapshot) ||
    !record(snapshot['item']) ||
    typeof snapshot['item']['quantity'] !== 'number' ||
    typeof snapshot['gp'] !== 'string'
  )
    return '';
  try {
    return `Quantity ${snapshot['item']['quantity']} · lot total ${xpDisplay(
      snapshot['gp']
    )} gp`;
  } catch {
    return '';
  }
}
export default function XpTreasureRows({
  rows,
  items,
  sessionId,
  onChange,
  initialRowId,
}: {
  rows: XpTreasureRow[];
  items: Possession[];
  sessionId: string;
  initialRowId?: string;
  onChange: (rows: XpTreasureRow[]) => void;
}) {
  const [selected, setSelected] = useState(initialRowId ?? rows[0]?.id);
  const row = rows.find((r) => r.id === selected) ?? rows[0];
  if (!row) return null;
  const update = (fields: Partial<XpTreasureRow>) =>
    onChange(rows.map((r) => (r.id === row.id ? { ...r, ...fields } : r)));
  const link = row.evidence?.keys[0] ?? '';
  const source = items.find((item) => item.key === link);
  const copy = (item: Possession) =>
    update(captureTreasurePossession(row, item, sessionId));
  const lot = frozenLot(row.evidence?.snapshot);
  return (
    <div className={styles['treasureRows']}>
      <TreasureReview rows={rows} selected={row.id} onSelect={setSelected} />
      <div className={styles['actions']}>
        <button
          onClick={() => {
            const next = newTreasureRow(crypto.randomUUID());
            onChange([...rows, next]);
            setSelected(next.id);
          }}
        >
          + Treasure row
        </button>
        {rows.length > 1 && (
          <button
            onClick={() => {
              const next = rows.filter((r) => r.id !== row.id);
              onChange(next);
              setSelected(next[Math.max(0, rows.indexOf(row) - 1)]?.id);
            }}
          >
            Remove selected row
          </button>
        )}
      </div>
      <fieldset>
        <legend>{row.label || `Item ${rows.indexOf(row) + 1}`}</legend>
        <div className={styles['fields']}>
          <label>
            Item label
            <input
              maxLength={1000}
              value={row.label}
              onChange={(e) => update({ label: e.target.value })}
            />
          </label>
          <label>
            Gear item or lot
            <select
              value={link}
              onChange={(e) => {
                const item = items.find((c) => c.key === e.target.value);
                if (item) copy(item);
                else update({ evidence: null });
              }}
            >
              <option value="">Manual entry</option>
              {link && !source && (
                <option value={link}>
                  {row.evidence?.label} (saved source)
                </option>
              )}
              {items.map((item) => (
                <option
                  key={item.key}
                  value={item.key}
                  disabled={rows.some(
                    (r) =>
                      r.id !== row.id && r.evidence?.keys.includes(item.key)
                  )}
                >
                  {item.name} · {item.holderName} · qty {item.item.quantity}
                  {item.captured
                    ? ' · captured'
                    : item.possibleRepeat
                    ? ' · possible repeat'
                    : ''}
                </option>
              ))}
            </select>
          </label>
        </div>
        {row.evidence && (
          <div className={styles['actions']}>
            <small>
              {row.evidence.label} · {lot}
            </small>
            {source && (
              <button onClick={() => copy(source)}>Refresh from Gear</button>
            )}
          </div>
        )}
        <div className={styles['fields']}>
          <label>
            Disposition
            <select
              value={row.disposition}
              onChange={(e) =>
                update({
                  disposition: e.target.value as XpTreasureRow['disposition'],
                })
              }
            >
              <option value="defer">Defer</option>
              <option value="keep">Keep</option>
              <option value="sell">Sell</option>
            </select>
          </label>
          {(
            [
              ['marketGp', 'Market value (gp)'],
              ['retainedXp', 'Retained-item XP'],
              ['proceeds', 'Sale proceeds (gp)'],
            ] as const
          ).map(([key, label]) => (
            <label key={key}>
              {label}
              <input
                value={row[key] ?? ''}
                onChange={(e) =>
                  update({ [key]: e.target.value.trim() || null })
                }
              />
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  );
}
