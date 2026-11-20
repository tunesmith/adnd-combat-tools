import type { ReactNode } from 'react';
import type { CampaignDocument } from '../../helpers/campaignDocument';
import type { PartyProfile } from '../../helpers/campaignPartyModel';
import { partyGear, characterLoad } from '../../helpers/partyEncumbrance';
import { loadBands } from '../../helpers/encumbranceRules';
import styles from './partyReference.module.css';

const number = new Intl.NumberFormat('en-US', { maximumFractionDigits: 6 });
type Load = NonNullable<ReturnType<typeof characterLoad>>;
export default function PartyEncumbrance({
  document,
  sessionId,
  profiles,
}: {
  document: CampaignDocument;
  sessionId: string;
  profiles: PartyProfile[];
}) {
  const { holders, catalog } = partyGear(document, sessionId);
  const matrixWidth = `${9.5 + profiles.length * 6.65}em`;
  const columns = profiles.map((profile) => ({
    id: profile.characterId,
    name: document.party?.roster.find((c) => c.id === profile.characterId)
      ?.name,
    data: characterLoad(profile, holders.get(profile.characterId), catalog),
  }));
  function row(
    label: string,
    value: (data: Load) => ReactNode,
    className?: string,
    bandId?: Load['band']['id']
  ) {
    return (
      <tr key={label} className={className}>
        <th scope="row">{label}</th>
        {columns.map(({ id, data }) => {
          const active = !!bandId && data?.band.id === bandId;
          return (
            <td key={id} className={active ? styles['active'] : undefined}>
              {active && <span aria-label="Current load band">✓ </span>}
              {data
                ? value(data)
                : label === 'Carried load' || label === 'Worn armor'
                ? 'Unknown'
                : '—'}
            </td>
          );
        })}
      </tr>
    );
  }
  return (
    <section
      className={styles['matrixSection']}
      style={{ flexBasis: matrixWidth }}
    >
      <header>
        <h2>Party encumbrance</h2>
        <small>gp-weight</small>
      </header>
      <div
        className={styles['scroll']}
        role="region"
        aria-label="Party encumbrance table"
        tabIndex={0}
      >
        <table
          aria-label="Party encumbrance"
          className={styles['matrix']}
          style={{ minWidth: matrixWidth }}
        >
          <thead>
            <tr>
              <th scope="col">Movement</th>
              {columns.map((c) => (
                <th key={c.id} scope="col">
                  {c.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {row('Carried load', (d) => number.format(d.load), styles['total'])}
            {loadBands.map((b) =>
              row(
                b.id === 'immobile'
                  ? 'Immobile'
                  : b.movement.replace('"-', '–').replace('"', '″'),
                (d) =>
                  b.id === 'immobile'
                    ? '> ' + number.format(loadBands[3].limit + d.allowance)
                    : number.format(b.limit + d.allowance),
                undefined,
                b.id
              )
            )}
            {row(
              'Room at light load',
              (d) =>
                d.room === 0
                  ? 'At limit'
                  : number.format(Math.abs(d.room)) +
                    (d.room < 0 ? ' over' : ' free'),
              styles['room']
            )}
            {row('Worn armor', (d) => d.armorName)}
            {row('Armor move limit', (d) =>
              d.armorMove === undefined ? '—' : d.armorMove + '″'
            )}
            {row('Final move', (d) => d.finalMove ?? '—', styles['total'])}
          </tbody>
        </table>
      </div>
      {columns.some((c) => c.data?.armorName === 'Unknown') && (
        <p className={styles['hint']}>
          Set worn armor in the character’s profile.
        </p>
      )}
    </section>
  );
}
