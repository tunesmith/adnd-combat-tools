import { bankDenominations } from '../../helpers/campaignBankingModel';
import type {
  BankAmounts,
  BankDenomination,
} from '../../helpers/campaignBankingModel';
import { bankGp } from '../../helpers/campaignBanking';
import styles from './xpWorkspace.module.css';
const bankQuantity = (quantity: number | bigint | null) =>
  quantity === null ? 'Unknown' : quantity.toLocaleString();
export default function BankBalances({
  rows,
  label = 'Banking balances',
  signed = false,
  caption,
  showTotals = false,
}: {
  rows: { id: string; label: string; amounts: BankAmounts }[];
  label?: string;
  signed?: boolean;
  caption?: string;
  showTotals?: boolean;
}) {
  const totals: Record<BankDenomination, bigint | null> = {
    cp: BigInt(0),
    sp: BigInt(0),
    ep: BigInt(0),
    gp: BigInt(0),
    pp: BigInt(0),
    diamond: BigInt(0),
    emerald: BigInt(0),
  };
  if (showTotals)
    for (const code of bankDenominations)
      totals[code] = rows.some((row) => row.amounts[code] === null)
        ? null
        : rows.reduce(
            (sum, row) => sum + BigInt(row.amounts[code] ?? 0),
            BigInt(0)
          );
  return (
    <div className={styles['tableScroll']}>
      <table aria-label={label} className={styles['bankBalances']}>
        {caption && (
          <caption className={styles['bankCaption']}>{caption}</caption>
        )}
        <colgroup>
          <col className={styles['bankHolderColumn']} />
          {bankDenominations.map((code) => (
            <col key={code} />
          ))}
          <col className={styles['bankTotalColumn']} />
        </colgroup>
        <thead>
          <tr>
            <th>Holder</th>
            {bankDenominations.map((c) => (
              <th key={c}>{c}</th>
            ))}
            <th className={styles['bankTotalCell']}>Total (GP)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <th scope="row">{r.label}</th>
              {bankDenominations.map((c) => (
                <td key={c}>
                  {signed && (r.amounts[c] ?? 0) > 0 ? '+' : ''}
                  {bankQuantity(r.amounts[c])}
                </td>
              ))}
              <td className={styles['bankTotalCell']}>{bankGp(r.amounts)}</td>
            </tr>
          ))}
        </tbody>
        {showTotals && (
          <tfoot>
            <tr>
              <th scope="row">Total</th>
              {bankDenominations.map((code) => (
                <td key={code}>
                  {signed && (totals[code] ?? BigInt(0)) > BigInt(0) ? '+' : ''}
                  {bankQuantity(totals[code])}
                </td>
              ))}
              <td className={styles['bankTotalCell']}>{bankGp(totals)}</td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}
