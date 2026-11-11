import { profileClassLabel } from '../../helpers/campaignParty';
import type { XpClassOpening } from '../../helpers/campaignXpModel';
import { classOpeningTotal } from '../../helpers/campaignXpClasses';
import styles from './xpWorkspace.module.css';
export default function ClassXpBalancesFields({
  name,
  classes,
  disabled = false,
  onChange,
}: {
  name: string;
  classes: XpClassOpening[];
  disabled?: boolean;
  onChange: (classes: XpClassOpening[], total: number | null) => void;
}) {
  return (
    <div className={styles['classBalances']}>
      {classes.map((c, i) => (
        <label key={c.classId}>
          <span>{profileClassLabel(c.characterClass)}:</span>
          <input
            aria-label={`${name} ${profileClassLabel(
              c.characterClass
            )} opening XP`}
            type="number"
            min={0}
            disabled={disabled}
            placeholder="Unknown"
            value={c.balance ?? ''}
            onChange={(e) => {
              const next = classes.map((v, j) =>
                i === j
                  ? {
                      ...v,
                      balance:
                        e.target.value === '' ? null : e.target.valueAsNumber,
                    }
                  : v
              );
              onChange(next, classOpeningTotal(next));
            }}
          />
        </label>
      ))}
    </div>
  );
}
