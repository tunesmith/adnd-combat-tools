import { createPortal } from 'react-dom';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, FocusEvent } from 'react';
import type { CSSObjectWithLabel, MultiValue, SingleValue } from 'react-select';
import Select from 'react-select';
import { getTrackerCombatantHeaderDisplay } from '../../helpers/trackerCombatantDisplay';
import customStyles from '../../helpers/selectCustomStyles';
import {
  DEFAULT_MISSILE_INITIATIVE_ADJUSTMENT,
  DEFAULT_MOVEMENT_RATE,
  MISSILE_INITIATIVE_ADJUSTMENT_OPTIONS,
  formatMissileInitiativeAdjustment,
  movementSuppressesPositiveReactionInitiativeBonuses,
  parseMissileInitiativeAdjustment,
  parseMovementRate,
} from '../../helpers/initiative/initiativeTiming';
import {
  attackerClassOptions,
  getGeneralClass,
  MONSTER,
} from '../../tables/attackerClass';
import {
  expandedArmorTypes,
  getExpandedArmorOptionsByClass,
} from '../../tables/armorType';
import { getLevelOptionsByCombatClass } from '../../tables/combatLevel';
import { getOffHandWeaponOptions, getWeaponOptions } from '../../tables/weapon';
import type {
  ArmorClassOption,
  CreatureOption,
  ExpandedArmorTypeOption,
  LevelOption,
  WeaponOption,
} from '../../types/option';
import type { TrackerCombatant } from '../../types/tracker';
import styles from './tracker.module.css';

const NO_OFF_HAND_WEAPON_OPTION: WeaponOption = {
  value: 0,
  label: 'No off-hand weapon',
};

interface TrackerSelectControlState {
  isFocused: boolean;
}

const combatantSelectStyles = {
  ...customStyles,
  container: (provided: CSSObjectWithLabel): CSSObjectWithLabel => ({
    ...provided,
    width: '100%',
  }),
  control: (
    provided: CSSObjectWithLabel,
    state: TrackerSelectControlState
  ): CSSObjectWithLabel => ({
    ...provided,
    minHeight: '2.45rem',
    borderColor: state.isFocused ? 'var(--goldenrod)' : 'var(--copper)',
    borderRadius: 0,
    borderWidth: 1,
    backgroundColor: 'var(--eggshell)',
    boxShadow: 'none',
    color: '#111',
    fontFamily: "'Sura', serif",
    '&:hover': {
      borderColor: 'var(--goldenrod)',
    },
  }),
  valueContainer: (provided: CSSObjectWithLabel): CSSObjectWithLabel => ({
    ...provided,
    padding: '0.32rem 0.55rem',
  }),
  input: (provided: CSSObjectWithLabel): CSSObjectWithLabel => ({
    ...provided,
    margin: 0,
    padding: 0,
    color: '#111',
    fontFamily: "'Sura', serif",
    fontSize: '1rem',
  }),
  singleValue: (provided: CSSObjectWithLabel): CSSObjectWithLabel => ({
    ...provided,
    color: '#111',
    fontFamily: "'Sura', serif",
    fontSize: '1rem',
  }),
  placeholder: (provided: CSSObjectWithLabel): CSSObjectWithLabel => ({
    ...provided,
    color: 'rgba(17, 17, 17, 0.58)',
    fontFamily: "'Sura', serif",
    fontSize: '1rem',
  }),
  dropdownIndicator: (provided: CSSObjectWithLabel): CSSObjectWithLabel => ({
    ...provided,
    color: 'rgba(17, 17, 17, 0.65)',
    padding: '0 0.62rem 0 0.35rem',
    '&:hover': {
      color: '#111',
    },
  }),
  indicatorSeparator: (): CSSObjectWithLabel => ({
    display: 'none',
  }),
};

interface TrackerCombatantInputProps {
  combatant: TrackerCombatant;
  side: 'party' | 'enemy';
  canRemove: boolean;
  onRemove: () => void;
  onUpdate: (combatant: TrackerCombatant) => void;
}

const getDerivedArmorClass = (armorTypeId: number): number =>
  expandedArmorTypes.find((armorProps) => armorProps.key === armorTypeId)
    ?.armorType || 10;

const formatMovementRateInput = (movementRate: number | undefined): string =>
  (movementRate ?? DEFAULT_MOVEMENT_RATE).toString();

const TrackerCombatantInput = ({
  combatant,
  side,
  canRemove,
  onRemove,
  onUpdate,
}: TrackerCombatantInputProps) => {
  const [open, setOpen] = useState<boolean>(false);
  const [isEditingWeaponShortlist, setIsEditingWeaponShortlist] =
    useState<boolean>(false);
  const [draft, setDraft] = useState<TrackerCombatant>(combatant);
  const [movementRateInput, setMovementRateInput] = useState<string>(
    formatMovementRateInput(combatant.movementRate)
  );
  const movementRateInputRef = useRef<string>(
    formatMovementRateInput(combatant.movementRate)
  );

  useEffect(() => {
    setDraft(combatant);
    const nextMovementRateInput = formatMovementRateInput(
      combatant.movementRate
    );
    setMovementRateInput(nextMovementRateInput);
    movementRateInputRef.current = nextMovementRateInput;
  }, [combatant]);

  const levelOptions = useMemo<LevelOption[]>(
    () =>
      getLevelOptionsByCombatClass(
        draft.class === MONSTER ? MONSTER : getGeneralClass(draft.class)
      ),
    [draft.class]
  );
  const weaponOptions = useMemo<WeaponOption[]>(
    () => getWeaponOptions(draft.class),
    [draft.class]
  );
  const weaponOptionsById = useMemo<Map<number, WeaponOption>>(
    () =>
      new Map(
        weaponOptions.map((weaponOption) => [weaponOption.value, weaponOption])
      ),
    [weaponOptions]
  );
  const weaponShortlistOptions = useMemo<WeaponOption[]>(
    () =>
      (draft.weaponShortlist || []).reduce<WeaponOption[]>(
        (options, weaponId) => {
          const weaponOption = weaponOptionsById.get(weaponId);
          return weaponOption ? options.concat(weaponOption) : options;
        },
        []
      ),
    [draft.weaponShortlist, weaponOptionsById]
  );
  const offHandWeaponOptions = useMemo<WeaponOption[]>(
    () => [NO_OFF_HAND_WEAPON_OPTION, ...getOffHandWeaponOptions(draft.class)],
    [draft.class]
  );
  const armorTypeOptions = useMemo<ExpandedArmorTypeOption[]>(
    () => getExpandedArmorOptionsByClass(draft.class),
    [draft.class]
  );
  const armorClassOptions = useMemo<ArmorClassOption[]>(
    () =>
      [...Array(21)].map((_, index) => ({
        value: 10 - index,
        label: `AC ${10 - index}`,
      })),
    []
  );
  const headerDisplay = useMemo(
    () => getTrackerCombatantHeaderDisplay(draft, side),
    [draft, side]
  );

  const commit = (nextCombatant: TrackerCombatant) => {
    setDraft(nextCombatant);
    onUpdate(nextCombatant);
  };

  const openModal = () => {
    setIsEditingWeaponShortlist(false);
    setOpen(true);
  };

  const closeModal = () => {
    setIsEditingWeaponShortlist(false);
    setOpen(false);
  };

  const handleNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setDraft((previous) => ({
      ...previous,
      name: event.target.value || undefined,
    }));
  };

  const handleNameBlur = (event: FocusEvent<HTMLInputElement>) => {
    commit({
      ...draft,
      name: event.target.value || undefined,
    });
  };

  const handleMaxHpChange = (event: ChangeEvent<HTMLInputElement>) => {
    setDraft((previous) => ({
      ...previous,
      maxHp: event.target.value,
    }));
  };

  const handleMaxHpBlur = (event: FocusEvent<HTMLInputElement>) => {
    commit({
      ...draft,
      maxHp: event.target.value,
    });
  };

  const handleMovementRateChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value;
    const movementRate = parseMovementRate(nextValue);

    movementRateInputRef.current = nextValue;
    setMovementRateInput(nextValue);

    if (movementRate !== undefined) {
      commit({
        ...draft,
        movementRate,
      });
    }
  };

  const handleMovementRateBlur = (event: FocusEvent<HTMLInputElement>) => {
    const movementRate =
      parseMovementRate(event.target.value) ?? DEFAULT_MOVEMENT_RATE;
    const nextValue = formatMovementRateInput(movementRate);

    movementRateInputRef.current = nextValue;
    setMovementRateInput(nextValue);
    commit({
      ...draft,
      movementRate,
    });
  };

  const handleMissileInitiativeAdjustment = (
    event: ChangeEvent<HTMLSelectElement>
  ) => {
    const movementRate =
      parseMovementRate(movementRateInputRef.current) ??
      draft.movementRate ??
      DEFAULT_MOVEMENT_RATE;

    commit({
      ...draft,
      movementRate,
      missileInitiativeAdjustment: parseMissileInitiativeAdjustment(
        event.target.value
      ),
    });
  };

  const handleCreatureClass = (option: SingleValue<CreatureOption>) => {
    const newCreatureClass = option?.value;
    if (!newCreatureClass) {
      return;
    }

    const nextArmorTypeOptions =
      getExpandedArmorOptionsByClass(newCreatureClass);
    const nextWeaponOptions = getWeaponOptions(newCreatureClass);
    const nextWeaponIds = new Set(
      nextWeaponOptions.map((weaponOption) => weaponOption.value)
    );
    const nextOffHandWeaponOptions = getOffHandWeaponOptions(newCreatureClass);
    const nextArmorType = nextArmorTypeOptions[0]?.value || draft.armorType;
    const nextWeapon = nextWeaponOptions[0]?.value || draft.weapon;
    const nextOffHandWeapon = nextOffHandWeaponOptions.some(
      (option) => option.value === draft.offHandWeapon
    )
      ? draft.offHandWeapon
      : undefined;
    const nextWeaponShortlist = (draft.weaponShortlist || []).filter(
      (weaponId) => nextWeaponIds.has(weaponId)
    );

    commit({
      ...draft,
      class: newCreatureClass,
      level: newCreatureClass === MONSTER ? 3 : 1,
      armorType: nextArmorType,
      armorClass: getDerivedArmorClass(nextArmorType),
      weapon: nextWeapon,
      offHandWeapon: nextOffHandWeapon,
      weaponShortlist: nextWeaponShortlist.length
        ? nextWeaponShortlist
        : undefined,
    });
  };

  const handleLevel = (option: SingleValue<LevelOption>) => {
    const nextLevel = option?.value;
    if (nextLevel || nextLevel === 0) {
      commit({
        ...draft,
        level: nextLevel,
      });
    }
  };

  const handleArmorType = (option: SingleValue<ExpandedArmorTypeOption>) => {
    const nextArmorType = option?.value;
    if (nextArmorType) {
      commit({
        ...draft,
        armorType: nextArmorType,
        armorClass: getDerivedArmorClass(nextArmorType),
      });
    }
  };

  const handleArmorClass = (option: SingleValue<ArmorClassOption>) => {
    const nextArmorClass = option?.value;
    if (nextArmorClass || nextArmorClass === 0) {
      commit({
        ...draft,
        armorClass: nextArmorClass,
      });
    }
  };

  const handleWeapon = (option: SingleValue<WeaponOption>) => {
    const nextWeapon = option?.value;
    if (nextWeapon) {
      commit({
        ...draft,
        weapon: nextWeapon,
      });
    }
  };

  const handleQuickWeapon = (weapon: number) => {
    commit({
      ...draft,
      weapon,
    });
  };

  const handleRemoveQuickWeapon = (weapon: number) => {
    const weaponShortlist = (draft.weaponShortlist || []).filter(
      (weaponId) => weaponId !== weapon
    );

    commit({
      ...draft,
      weaponShortlist: weaponShortlist.length ? weaponShortlist : undefined,
    });
  };

  const handleWeaponShortlist = (options: MultiValue<WeaponOption>) => {
    const weaponShortlist = options.map((option) => option.value);

    commit({
      ...draft,
      weaponShortlist: weaponShortlist.length ? weaponShortlist : undefined,
    });
  };

  const handleOffHandWeapon = (option: SingleValue<WeaponOption>) => {
    const nextWeapon = option?.value;

    commit({
      ...draft,
      offHandWeapon: nextWeapon ? nextWeapon : undefined,
    });
  };

  const modalRoot =
    typeof document !== 'undefined'
      ? document.getElementById('app-modal')
      : null;
  const selectMenuPortalTarget =
    typeof document !== 'undefined' ? document.body : null;
  const movementRateForDisplay =
    parseMovementRate(movementRateInput) ??
    draft.movementRate ??
    DEFAULT_MOVEMENT_RATE;
  const missileInitiativeAdjustment =
    draft.missileInitiativeAdjustment ?? DEFAULT_MISSILE_INITIATIVE_ADJUSTMENT;
  const sizerClassName =
    side === 'party'
      ? `${styles['combatantSizer']} ${styles['combatantSizerParty']}`
      : `${styles['combatantSizer']} ${styles['combatantSizerEnemy']}`;

  const renderHeaderContent = (hidden = false) => (
    <span
      className={
        hidden
          ? `${styles['combatantContent']} ${styles['combatantContentHidden']}`
          : styles['combatantContent']
      }
    >
      <span className={styles['combatantName']}>{headerDisplay.name}</span>
      {headerDisplay.detailLines.map((line, index) => (
        <span
          key={`${draft.key}-${index}-${line}`}
          className={styles['combatantDetail']}
        >
          {line}
        </span>
      ))}
    </span>
  );

  return (
    <div className={styles['combatantShell']}>
      <div className={sizerClassName} aria-hidden={'true'}>
        {renderHeaderContent(true)}
      </div>
      <button
        type={'button'}
        className={
          side === 'party'
            ? styles['combatantButtonParty']
            : styles['combatantButtonEnemy']
        }
        aria-label={`Edit ${
          draft.name || (side === 'party' ? 'party member' : 'enemy')
        }`}
        onClick={openModal}
      >
        {renderHeaderContent()}
      </button>
      <button
        type={'button'}
        className={styles['removeCombatant']}
        disabled={!canRemove}
        aria-label={`Remove ${
          draft.name || (side === 'party' ? 'party member' : 'enemy')
        }`}
        onClick={(event) => {
          event.stopPropagation();
          onRemove();
        }}
      >
        x
      </button>
      {open &&
        modalRoot &&
        createPortal(
          <>
            <div className={styles['modalShadow']} onClick={closeModal} />
            <div className={styles['modal']}>
              <div className={styles['modalTitle']}>
                {side === 'party' ? 'Edit Party Member' : 'Edit Enemy'}
              </div>
              <div className={styles['combatantModalForm']}>
                <div className={styles['combatantFieldWide']}>
                  <label
                    className={styles['combatantFieldLabel']}
                    htmlFor={`name-${draft.key}`}
                  >
                    Name
                  </label>
                  <input
                    id={`name-${draft.key}`}
                    className={styles['combatantTextInput']}
                    type={'text'}
                    value={draft.name || ''}
                    onChange={handleNameChange}
                    onBlur={handleNameBlur}
                    placeholder={'Name or label'}
                  />
                </div>
                <div className={styles['combatantField']}>
                  <label
                    className={styles['combatantFieldLabel']}
                    htmlFor={`max-hp-${draft.key}`}
                  >
                    Max HP
                  </label>
                  <input
                    id={`max-hp-${draft.key}`}
                    className={styles['combatantTextInput']}
                    type={'text'}
                    value={draft.maxHp || ''}
                    onChange={handleMaxHpChange}
                    onBlur={handleMaxHpBlur}
                    placeholder={'Optional maximum'}
                  />
                </div>
                <div className={styles['combatantField']}>
                  <label
                    className={styles['combatantFieldLabel']}
                    htmlFor={`movement-rate-${draft.key}`}
                  >
                    Movement rate
                  </label>
                  <input
                    id={`movement-rate-${draft.key}`}
                    className={styles['combatantTextInput']}
                    inputMode={'decimal'}
                    type={'text'}
                    value={movementRateInput}
                    onChange={handleMovementRateChange}
                    onBlur={handleMovementRateBlur}
                    placeholder={`${DEFAULT_MOVEMENT_RATE}`}
                  />
                </div>
                <div className={styles['combatantField']}>
                  <span className={styles['combatantFieldLabel']}>Class</span>
                  <Select
                    isSearchable={false}
                    instanceId={`creatureClass-${draft.key}`}
                    styles={combatantSelectStyles}
                    menuPortalTarget={selectMenuPortalTarget}
                    menuPosition={'fixed'}
                    value={attackerClassOptions.filter(
                      (option) => option.value === draft.class
                    )}
                    options={attackerClassOptions}
                    onChange={handleCreatureClass}
                  />
                </div>
                <div className={styles['combatantField']}>
                  <span className={styles['combatantFieldLabel']}>Level</span>
                  <Select
                    isSearchable={false}
                    instanceId={`level-${draft.key}`}
                    styles={combatantSelectStyles}
                    menuPortalTarget={selectMenuPortalTarget}
                    menuPosition={'fixed'}
                    value={levelOptions.filter(
                      (option) => option.value === draft.level
                    )}
                    options={levelOptions}
                    onChange={handleLevel}
                  />
                </div>
                <div className={styles['combatantField']}>
                  <span className={styles['combatantFieldLabel']}>
                    Armor Type
                  </span>
                  <Select
                    isSearchable={false}
                    instanceId={`armorType-${draft.key}`}
                    styles={combatantSelectStyles}
                    menuPortalTarget={selectMenuPortalTarget}
                    menuPosition={'fixed'}
                    value={armorTypeOptions.filter(
                      (option) => option.value === draft.armorType
                    )}
                    options={armorTypeOptions}
                    onChange={handleArmorType}
                  />
                </div>
                <div className={styles['combatantField']}>
                  <span className={styles['combatantFieldLabel']}>
                    Armor Class
                  </span>
                  <Select
                    isSearchable={false}
                    instanceId={`armorClass-${draft.key}`}
                    styles={combatantSelectStyles}
                    menuPortalTarget={selectMenuPortalTarget}
                    menuPosition={'fixed'}
                    value={armorClassOptions.filter(
                      (option) => option.value === draft.armorClass
                    )}
                    options={armorClassOptions}
                    onChange={handleArmorClass}
                  />
                </div>
                <div className={styles['combatantFieldWide']}>
                  <span className={styles['combatantFieldLabel']}>Weapon</span>
                  <div className={styles['quickWeaponList']}>
                    {weaponShortlistOptions.map((weaponOption) => (
                      <button
                        key={weaponOption.value}
                        type={'button'}
                        aria-label={
                          isEditingWeaponShortlist
                            ? `Remove ${weaponOption.label} from shortlist`
                            : undefined
                        }
                        className={
                          isEditingWeaponShortlist
                            ? styles['quickWeaponRemoveButton']
                            : weaponOption.value === draft.weapon
                            ? styles['quickWeaponButtonActive']
                            : styles['quickWeaponButton']
                        }
                        onClick={() =>
                          isEditingWeaponShortlist
                            ? handleRemoveQuickWeapon(weaponOption.value)
                            : handleQuickWeapon(weaponOption.value)
                        }
                      >
                        {isEditingWeaponShortlist ? (
                          <span
                            className={styles['quickWeaponRemoveMark']}
                            aria-hidden={'true'}
                          >
                            x
                          </span>
                        ) : null}
                        {weaponOption.label}
                      </button>
                    ))}
                    <button
                      type={'button'}
                      className={styles['quickWeaponEditButton']}
                      aria-expanded={isEditingWeaponShortlist}
                      onClick={() =>
                        setIsEditingWeaponShortlist((previous) => !previous)
                      }
                    >
                      {isEditingWeaponShortlist
                        ? 'Done'
                        : weaponShortlistOptions.length
                        ? 'Edit shortlist'
                        : 'Add shortlist'}
                    </button>
                  </div>
                  {isEditingWeaponShortlist ? (
                    <div className={styles['weaponShortlistEditor']}>
                      <Select
                        isMulti
                        isSearchable
                        autoFocus
                        closeMenuOnSelect={false}
                        blurInputOnSelect={false}
                        controlShouldRenderValue={false}
                        defaultMenuIsOpen
                        hideSelectedOptions={false}
                        instanceId={`weaponShortlist-${draft.key}`}
                        styles={combatantSelectStyles}
                        menuPortalTarget={selectMenuPortalTarget}
                        menuPosition={'fixed'}
                        value={weaponShortlistOptions}
                        options={weaponOptions}
                        onChange={handleWeaponShortlist}
                        placeholder={'Choose quick weapons'}
                      />
                    </div>
                  ) : null}
                  <Select
                    isSearchable={false}
                    instanceId={`weapon-${draft.key}`}
                    styles={combatantSelectStyles}
                    menuPortalTarget={selectMenuPortalTarget}
                    menuPosition={'fixed'}
                    value={weaponOptions.filter(
                      (option) => option.value === draft.weapon
                    )}
                    options={weaponOptions}
                    onChange={handleWeapon}
                  />
                </div>
                <div className={styles['combatantField']}>
                  <label
                    className={styles['combatantFieldLabel']}
                    htmlFor={`missile-initiative-${draft.key}`}
                  >
                    Missile init adj
                  </label>
                  <select
                    id={`missile-initiative-${draft.key}`}
                    className={styles['combatantNativeSelect']}
                    value={formatMissileInitiativeAdjustment(
                      missileInitiativeAdjustment
                    )}
                    onChange={handleMissileInitiativeAdjustment}
                  >
                    {MISSILE_INITIATIVE_ADJUSTMENT_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles['combatantField']}>
                  <span className={styles['combatantFieldLabel']}>
                    Off-hand Weapon
                  </span>
                  <Select
                    isSearchable={false}
                    instanceId={`offHandWeapon-${draft.key}`}
                    styles={combatantSelectStyles}
                    menuPortalTarget={selectMenuPortalTarget}
                    menuPosition={'fixed'}
                    value={offHandWeaponOptions.filter(
                      (option) => option.value === (draft.offHandWeapon || 0)
                    )}
                    options={offHandWeaponOptions}
                    onChange={handleOffHandWeapon}
                  />
                </div>
                {movementSuppressesPositiveReactionInitiativeBonuses(
                  movementRateForDisplay
                ) && missileInitiativeAdjustment > 0 ? (
                  <p
                    className={`${styles['modalHint']} ${styles['combatantFormHint']}`}
                  >
                    Positive missile-initiative bonuses are ignored below MV
                    12&quot;.
                  </p>
                ) : null}
              </div>
            </div>
          </>,
          modalRoot
        )}
    </div>
  );
};

export default TrackerCombatantInput;
