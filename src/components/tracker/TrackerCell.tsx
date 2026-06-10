import type { CSSProperties, KeyboardEvent as ReactKeyboardEvent } from 'react';
import getToHit from '../../helpers/getToHit';
import { expandedArmorTypes } from '../../tables/armorType';
import type { TrackerAttackHand, TrackerCombatant } from '../../types/tracker';
import styles from './tracker.module.css';

interface TrackerCellProps {
  rowCombatant: TrackerCombatant;
  columnCombatant: TrackerCombatant;
  enemyToPartyValue: string;
  partyToEnemyValue: string;
  enemyToPartyVisible: boolean;
  partyToEnemyVisible: boolean;
  onEnemyToPartyVisibilityChange: (value: boolean) => void;
  onPartyToEnemyVisibilityChange: (value: boolean) => void;
  onEnemyToPartyChange: (value: string) => void;
  onPartyToEnemyChange: (value: string) => void;
  onAttackDetailOpen?: (
    direction: 'enemyToParty' | 'partyToEnemy',
    hand: TrackerAttackHand
  ) => void;
  allowVisibilityToggle?: boolean;
  displayMode?: 'both' | 'enemyOnly' | 'partyOnly';
  style?: CSSProperties;
}

const TrackerCell = ({
  rowCombatant,
  columnCombatant,
  enemyToPartyValue,
  partyToEnemyValue,
  enemyToPartyVisible,
  partyToEnemyVisible,
  onEnemyToPartyVisibilityChange,
  onPartyToEnemyVisibilityChange,
  onEnemyToPartyChange,
  onPartyToEnemyChange,
  onAttackDetailOpen,
  allowVisibilityToggle = true,
  displayMode = 'both',
  style,
}: TrackerCellProps) => {
  const rowTargetArmor = expandedArmorTypes.find(
    (armorProps) => armorProps.key === columnCombatant.armorType
  );
  const columnTargetArmor = expandedArmorTypes.find(
    (armorProps) => armorProps.key === rowCombatant.armorType
  );

  const getCombatantToHit = (
    attacker: TrackerCombatant,
    targetArmorType: number | null,
    targetArmorClass: number,
    weapon: number
  ): number =>
    getToHit(
      attacker.class,
      attacker.level,
      targetArmorType,
      targetArmorClass,
      weapon
    );
  const rowTargetArmorType = rowTargetArmor?.armorType || null;
  const columnTargetArmorType = columnTargetArmor?.armorType || null;
  const rowToHit = getCombatantToHit(
    rowCombatant,
    rowTargetArmorType,
    columnCombatant.armorClass,
    rowCombatant.weapon
  );
  const rowOffHandToHit = rowCombatant.offHandWeapon
    ? getCombatantToHit(
        rowCombatant,
        rowTargetArmorType,
        columnCombatant.armorClass,
        rowCombatant.offHandWeapon
      )
    : undefined;
  const columnToHit = getCombatantToHit(
    columnCombatant,
    columnTargetArmorType,
    rowCombatant.armorClass,
    columnCombatant.weapon
  );
  const columnOffHandToHit = columnCombatant.offHandWeapon
    ? getCombatantToHit(
        columnCombatant,
        columnTargetArmorType,
        rowCombatant.armorClass,
        columnCombatant.offHandWeapon
      )
    : undefined;
  const enemyHasContent = Boolean(enemyToPartyValue.trim());
  const partyHasContent = Boolean(partyToEnemyValue.trim());
  const showEnemyHalf = displayMode !== 'partyOnly';
  const showPartyHalf = displayMode !== 'enemyOnly';
  const enemyToggleEnabled =
    allowVisibilityToggle && (!enemyToPartyVisible || !enemyHasContent);
  const partyToggleEnabled =
    allowVisibilityToggle && (!partyToEnemyVisible || !partyHasContent);

  const handleHalfKeyDown = (
    event: ReactKeyboardEvent<HTMLDivElement>,
    onToggle: () => void,
    isToggleEnabled: boolean
  ) => {
    if (!isToggleEnabled) {
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onToggle();
    }
  };

  const renderToHitLabel = (
    toHit: number,
    direction: 'enemyToParty' | 'partyToEnemy',
    hand: TrackerAttackHand,
    label: string
  ) =>
    onAttackDetailOpen ? (
      <button
        type={'button'}
        className={styles['cellEntryLabelButton']}
        aria-label={label}
        title={label}
        onClick={(event) => {
          event.stopPropagation();
          onAttackDetailOpen(direction, hand);
        }}
      >
        {toHit}
      </button>
    ) : (
      <span className={styles['cellEntryLabel']}>{toHit}</span>
    );

  const renderToHitLabels = (
    direction: 'enemyToParty' | 'partyToEnemy',
    sideLabel: 'enemy' | 'party',
    mainToHit: number,
    offHandToHit?: number
  ) => (
    <span className={styles['cellEntryLabels']}>
      {renderToHitLabel(
        mainToHit,
        direction,
        'main',
        `Show ${sideLabel} main-hand attack details`
      )}
      {offHandToHit !== undefined ? (
        <>
          <span className={styles['cellEntryLabelSeparator']}>/</span>
          {renderToHitLabel(
            offHandToHit,
            direction,
            'offHand',
            `Show ${sideLabel} off-hand attack details`
          )}
        </>
      ) : null}
    </span>
  );

  return (
    <td className={styles['interactionCell']} style={style}>
      <div
        className={[
          styles['cellShell'],
          displayMode !== 'both' ? styles['cellShellSingle'] : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {showEnemyHalf ? (
          <div
            className={[
              styles['cellHalfEnemyInline'],
              displayMode !== 'both' ? styles['cellHalfSingle'] : '',
              enemyToggleEnabled ? styles['cellHalfToggleable'] : '',
              !enemyToPartyVisible ? styles['cellHalfCollapsed'] : '',
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={
              enemyToggleEnabled
                ? () => onEnemyToPartyVisibilityChange(!enemyToPartyVisible)
                : undefined
            }
            onKeyDown={(event) =>
              handleHalfKeyDown(
                event,
                () => onEnemyToPartyVisibilityChange(!enemyToPartyVisible),
                enemyToggleEnabled
              )
            }
            tabIndex={enemyToggleEnabled ? 0 : undefined}
            role={enemyToggleEnabled ? 'button' : undefined}
            aria-label={
              enemyToggleEnabled
                ? enemyToPartyVisible
                  ? 'Hide empty enemy attack input'
                  : 'Show enemy attack input'
                : undefined
            }
          >
            {enemyToPartyVisible ? (
              <>
                {renderToHitLabels(
                  'enemyToParty',
                  'enemy',
                  rowToHit,
                  rowOffHandToHit
                )}
                <input
                  className={styles['cellEntryInputInline']}
                  type={'text'}
                  value={enemyToPartyValue}
                  onClick={(event) => event.stopPropagation()}
                  onKeyDown={(event) => event.stopPropagation()}
                  onChange={(event) => onEnemyToPartyChange(event.target.value)}
                />
              </>
            ) : null}
          </div>
        ) : null}
        {showPartyHalf ? (
          <div
            className={[
              styles['cellHalfPartyInline'],
              displayMode !== 'both' ? styles['cellHalfSingle'] : '',
              partyToggleEnabled ? styles['cellHalfToggleable'] : '',
              !partyToEnemyVisible ? styles['cellHalfCollapsed'] : '',
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={
              partyToggleEnabled
                ? () => onPartyToEnemyVisibilityChange(!partyToEnemyVisible)
                : undefined
            }
            onKeyDown={(event) =>
              handleHalfKeyDown(
                event,
                () => onPartyToEnemyVisibilityChange(!partyToEnemyVisible),
                partyToggleEnabled
              )
            }
            tabIndex={partyToggleEnabled ? 0 : undefined}
            role={partyToggleEnabled ? 'button' : undefined}
            aria-label={
              partyToggleEnabled
                ? partyToEnemyVisible
                  ? 'Hide empty party attack input'
                  : 'Show party attack input'
                : undefined
            }
          >
            {partyToEnemyVisible ? (
              <>
                {renderToHitLabels(
                  'partyToEnemy',
                  'party',
                  columnToHit,
                  columnOffHandToHit
                )}
                <input
                  className={styles['cellEntryInputInline']}
                  type={'text'}
                  value={partyToEnemyValue}
                  onClick={(event) => event.stopPropagation()}
                  onKeyDown={(event) => event.stopPropagation()}
                  onChange={(event) => onPartyToEnemyChange(event.target.value)}
                />
              </>
            ) : null}
          </div>
        ) : null}
      </div>
    </td>
  );
};

export default TrackerCell;
