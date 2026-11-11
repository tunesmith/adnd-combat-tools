import {
  partyClasses,
  type PartyProfile,
  type ProfileClass,
} from '../../helpers/campaignPartyModel';
import { profileClassLabel } from '../../helpers/campaignParty';
import styles from './campaignWorkspace.module.css';

export default function ProfileClassesFields({
  value,
  onChange,
}: {
  value: PartyProfile;
  onChange: (change: Partial<PartyProfile>) => void;
}) {
  const classes = value.classes;
  const update = (entries: ProfileClass[]) => {
    const first = entries[0];
    if (!first) return;
    onChange({
      classes: entries.length > 1 ? entries : undefined,
      characterClass: first.characterClass,
      baseLevel: first.baseLevel,
      combatClassId:
        entries.length > 1
          ? entries.some((c) => c.id === value.combatClassId)
            ? value.combatClassId
            : first.id
          : undefined,
      ...(entries.length === 1 && value.reference
        ? {
            reference: {
              ...value.reference,
              bonuses: {
                ...value.reference.bonuses,
                xpPercent: first.xpPercent,
              },
            },
          }
        : {}),
      adjustment: value.adjustment
        ? entries.length === 1
          ? { ...value.adjustment, classId: undefined }
          : {
              ...value.adjustment,
              classId: entries.some((c) => c.id === value.adjustment?.classId)
                ? value.adjustment.classId
                : first.id,
            }
        : null,
    });
  };
  const select = (entry: ProfileClass, index: number) => (
    <select
      aria-label={classes ? `Class ${index + 1}` : 'Class'}
      value={entry.characterClass}
      onChange={(e) => {
        const chosen = partyClasses.find((c) => c === e.target.value);
        if (chosen)
          classes
            ? update(
                classes.map((c, i) =>
                  i === index ? { ...c, characterClass: chosen } : c
                )
              )
            : onChange({ characterClass: chosen });
      }}
    >
      {partyClasses
        .filter((c) => !classes || (c !== 'manual' && c !== 'bard'))
        .map((c) => (
          <option key={c} value={c}>
            {profileClassLabel(c)}
          </option>
        ))}
    </select>
  );
  const level = (entry: ProfileClass, index: number) => (
    <input
      aria-label={
        classes
          ? `${profileClassLabel(entry.characterClass)} trained level`
          : 'Base level'
      }
      type="number"
      required
      min={0}
      max={99}
      value={Number.isNaN(entry.baseLevel) ? '' : entry.baseLevel}
      onChange={(e) =>
        classes
          ? update(
              classes.map((c, i) =>
                i === index ? { ...c, baseLevel: e.target.valueAsNumber } : c
              )
            )
          : onChange({ baseLevel: e.target.valueAsNumber })
      }
    />
  );
  return (
    <>
      {classes ? (
        <div className={styles['tableScroll']}>
          <table aria-label="Character classes">
            <thead>
              <tr>
                <th>Class</th>
                <th>Trained level</th>
                <th>XP bonus</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {classes.map((c, i) => (
                <tr key={c.id}>
                  <td>{select(c, i)}</td>
                  <td>{level(c, i)}</td>
                  <td>
                    <select
                      aria-label={`${profileClassLabel(
                        c.characterClass
                      )} XP bonus`}
                      value={c.xpPercent ?? ''}
                      onChange={(e) =>
                        update(
                          classes.map((v, j) =>
                            j === i
                              ? {
                                  ...v,
                                  xpPercent:
                                    e.target.value === ''
                                      ? null
                                      : Number(e.target.value),
                                }
                              : v
                          )
                        )
                      }
                    >
                      <option value="">Unknown</option>
                      <option value={0}>0%</option>
                      <option value={10}>+10%</option>
                      {c.xpPercent !== null &&
                        c.xpPercent !== 0 &&
                        c.xpPercent !== 10 && (
                          <option value={c.xpPercent}>{c.xpPercent}%</option>
                        )}
                    </select>
                  </td>
                  <td>
                    <button
                      type="button"
                      aria-label={`Remove ${profileClassLabel(
                        c.characterClass
                      )} class`}
                      onClick={() => update(classes.filter((_, j) => j !== i))}
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className={styles['profileFields']}>
          <label>
            Class
            {select(
              {
                id: '',
                characterClass: value.characterClass,
                baseLevel: value.baseLevel,
                xpPercent: null,
              },
              0
            )}
          </label>
          <label>
            Base level
            {level(
              {
                id: '',
                characterClass: value.characterClass,
                baseLevel: value.baseLevel,
                xpPercent: null,
              },
              0
            )}
          </label>
        </div>
      )}
      {(!classes || classes.length < 3) &&
        value.characterClass !== 'manual' &&
        value.characterClass !== 'bard' && (
          <button
            type="button"
            className={styles['textButton']}
            onClick={() => {
              const existing = classes ?? [
                {
                  id: crypto.randomUUID(),
                  characterClass: value.characterClass,
                  baseLevel: value.baseLevel,
                  xpPercent: value.reference?.bonuses.xpPercent ?? null,
                },
              ];
              const chosen = partyClasses.find(
                (c) =>
                  c !== 'manual' &&
                  c !== 'bard' &&
                  !existing.some((v) => v.characterClass === c)
              );
              if (chosen)
                update([
                  ...existing,
                  {
                    id: crypto.randomUUID(),
                    characterClass: chosen,
                    baseLevel: 1,
                    xpPercent: null,
                  },
                ]);
            }}
          >
            + Class
          </button>
        )}
      {classes && (
        <label className={styles['sessionNameField']}>
          Combat basis
          <select
            value={value.combatClassId ?? classes[0]?.id}
            onChange={(e) => onChange({ combatClassId: e.target.value })}
          >
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {profileClassLabel(c.characterClass)} {c.baseLevel}
              </option>
            ))}
          </select>
        </label>
      )}
    </>
  );
}
