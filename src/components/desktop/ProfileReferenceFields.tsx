import {
  emptyProfileReference,
  type ProfileReference,
} from '../../helpers/campaignPartyModel';
import styles from './campaignWorkspace.module.css';

function NumberField({
  label,
  value,
  onChange,
  min = 0,
  max = 1_000_000,
}: {
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
  min?: number;
  max?: number;
}) {
  return (
    <label>
      {label}
      <input
        type="number"
        min={min}
        max={max}
        step={1}
        value={value === null || Number.isNaN(value) ? '' : value}
        onChange={(e) =>
          onChange(e.target.value === '' ? null : e.target.valueAsNumber)
        }
      />
    </label>
  );
}

const formatSignedBonus = (bonus: number | null) =>
  bonus === null || !Number.isFinite(bonus)
    ? ''
    : bonus > 0
    ? `+${bonus}`
    : String(bonus);

function BonusField({
  label,
  value,
  percent,
  onChange,
}: {
  label: string;
  value: number | null;
  percent: boolean;
  onChange: (value: number | null) => void;
}) {
  const [text, setText] = useState(formatSignedBonus(value));
  const editing = useRef(false);
  useEffect(() => {
    if (!editing.current) setText(formatSignedBonus(value));
  }, [value]);
  return (
    <label>
      {label}
      <span className={styles['bonusControl']}>
        <input
          type="text"
          aria-label={label}
          inputMode="text"
          pattern="([+]|-)?[0-9]+"
          maxLength={6}
          value={text}
          onFocus={() => {
            editing.current = true;
          }}
          onChange={(event) => {
            const raw = event.target.value;
            setText(raw);
            onChange(
              raw === '' ? null : /^[+-]?[0-9]+$/.test(raw) ? Number(raw) : NaN
            );
          }}
          onBlur={() => {
            editing.current = false;
            if (text === '' || /^[+-]?[0-9]+$/.test(text))
              setText(formatSignedBonus(value));
          }}
        />
        {percent && <span aria-hidden="true">%</span>}
      </span>
    </label>
  );
}

export default function ProfileReferenceFields({
  value,
  onChange,
}: {
  value: ProfileReference | undefined;
  onChange: (value: ProfileReference) => void;
}) {
  const reference = value ?? emptyProfileReference();
  const attributes = reference.attributes;
  return (
    <>
      <div className={styles['profileFields']}>
        {(['race', 'gender', 'alignment'] as const).map((key) => (
          <label key={key}>
            {key.charAt(0).toUpperCase() + key.slice(1)}
            <input
              maxLength={200}
              value={reference[key]}
              onChange={(e) =>
                onChange({ ...reference, [key]: e.target.value })
              }
            />
          </label>
        ))}
        <NumberField
          label="Age"
          value={reference.age}
          onChange={(age) => onChange({ ...reference, age })}
        />
        <NumberField
          label="Max HP"
          value={reference.maxHp}
          onChange={(maxHp) => onChange({ ...reference, maxHp })}
        />
      </div>
      <fieldset className={styles['profileGroup']}>
        <legend>Attributes</legend>
        <div className={styles['attributeFields']}>
          <NumberField
            label="STR"
            value={attributes.strength.score}
            max={25}
            onChange={(score) =>
              onChange({
                ...reference,
                attributes: {
                  ...attributes,
                  strength: {
                    score,
                    exceptional:
                      score === 18 ? attributes.strength.exceptional : null,
                  },
                },
              })
            }
          />
          {(
            [
              ['intelligence', 'INT'],
              ['wisdom', 'WIS'],
              ['dexterity', 'DEX'],
              ['constitution', 'CON'],
              ['charisma', 'CHA'],
            ] as const
          ).map(([key, label]) => (
            <NumberField
              key={key}
              label={label}
              value={attributes[key]}
              max={25}
              onChange={(score) =>
                onChange({
                  ...reference,
                  attributes: { ...attributes, [key]: score },
                })
              }
            />
          ))}
        </div>
        {attributes.strength.score === 18 && (
          <label className={styles['exceptionalField']}>
            Exceptional STR (01–00)
            <input
              type="text"
              inputMode="numeric"
              maxLength={3}
              pattern="[0-9]{1,3}"
              value={
                attributes.strength.exceptional === 100
                  ? '00'
                  : attributes.strength.exceptional ?? ''
              }
              onChange={(e) =>
                onChange({
                  ...reference,
                  attributes: {
                    ...attributes,
                    strength: {
                      score: 18,
                      exceptional:
                        e.target.value === ''
                          ? null
                          : e.target.value === '00'
                          ? 100
                          : Number(e.target.value),
                    },
                  },
                })
              }
            />
          </label>
        )}
      </fieldset>
      <fieldset className={styles['profileGroup']}>
        <legend>Reference bonuses</legend>
        <div className={styles['bonusFields']}>
          {(
            [
              ['meleeHit', 'Melee hit'],
              ['meleeDamage', 'Melee damage'],
              ['missileHit', 'Missile hit'],
              ['reactionPercent', 'Reaction %'],
            ] as const
          ).map(([key, label]) => (
            <BonusField
              key={key}
              label={label}
              value={reference.bonuses[key]}
              percent={key === 'reactionPercent'}
              onChange={(bonus) =>
                onChange({
                  ...reference,
                  bonuses: { ...reference.bonuses, [key]: bonus },
                })
              }
            />
          ))}
          <div className={styles['xpBonusField']}>
            <span>XP bonus</span>
            <label
              title={
                reference.bonuses.xpPercent === null
                  ? 'XP bonus not recorded'
                  : 'Record whether the +10% XP bonus applies'
              }
            >
              <input
                type="checkbox"
                aria-label="+10% XP bonus"
                ref={(input) => {
                  if (input)
                    input.indeterminate =
                      reference.bonuses.xpPercent === null ||
                      (reference.bonuses.xpPercent !== 0 &&
                        reference.bonuses.xpPercent !== 10);
                }}
                checked={reference.bonuses.xpPercent === 10}
                onChange={(event) =>
                  onChange({
                    ...reference,
                    bonuses: {
                      ...reference.bonuses,
                      xpPercent: event.target.checked ? 10 : 0,
                    },
                  })
                }
              />
              +10%
            </label>
            {reference.bonuses.xpPercent !== null && (
              <button
                type="button"
                aria-label="Clear XP bonus"
                title="Mark the XP bonus as not recorded"
                onClick={() =>
                  onChange({
                    ...reference,
                    bonuses: { ...reference.bonuses, xpPercent: null },
                  })
                }
              >
                Clear
              </button>
            )}
            {reference.bonuses.xpPercent !== null &&
              reference.bonuses.xpPercent !== 0 &&
              reference.bonuses.xpPercent !== 10 && (
                <small>
                  Recorded {formatSignedBonus(reference.bonuses.xpPercent)}%
                </small>
              )}
          </div>
        </div>
      </fieldset>
    </>
  );
}
import { useEffect, useRef, useState } from 'react';
