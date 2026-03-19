import { createPortal } from "react-dom";
import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FocusEvent } from "react";
import type { SingleValue } from "react-select";
import Select from "react-select";
import customStyles from "../../helpers/selectCustomStyles";
import { attackerClassOptions, getGeneralClass, MONSTER } from "../../tables/attackerClass";
import {
  expandedArmorTypes,
  getExpandedArmorOptionsByClass,
} from "../../tables/armorType";
import { getLevelOptionsByCombatClass } from "../../tables/combatLevel";
import { getWeaponOptions } from "../../tables/weapon";
import type {
  ArmorClassOption,
  CreatureOption,
  ExpandedArmorTypeOption,
  LevelOption,
  WeaponOption,
} from "../../types/option";
import type { TrackerCombatant } from "../../types/tracker";
import styles from "./tracker.module.css";

interface TrackerCombatantInputProps {
  combatant: TrackerCombatant;
  side: "party" | "enemy";
  canRemove: boolean;
  onRemove: () => void;
  onUpdate: (combatant: TrackerCombatant) => void;
}

const getDerivedArmorClass = (armorTypeId: number): number =>
  expandedArmorTypes.find((armorProps) => armorProps.key === armorTypeId)
    ?.armorType || 10;

const TrackerCombatantInput = ({
  combatant,
  side,
  canRemove,
  onRemove,
  onUpdate,
}: TrackerCombatantInputProps) => {
  const [open, setOpen] = useState<boolean>(false);
  const [draft, setDraft] = useState<TrackerCombatant>(combatant);

  useEffect(() => {
    setDraft(combatant);
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

  const commit = (nextCombatant: TrackerCombatant) => {
    setDraft(nextCombatant);
    onUpdate(nextCombatant);
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

  const handleCreatureClass = (option: SingleValue<CreatureOption>) => {
    const newCreatureClass = option?.value;
    if (!newCreatureClass) {
      return;
    }

    const nextArmorTypeOptions = getExpandedArmorOptionsByClass(newCreatureClass);
    const nextWeaponOptions = getWeaponOptions(newCreatureClass);
    const nextArmorType = nextArmorTypeOptions[0]?.value || draft.armorType;
    const nextWeapon = nextWeaponOptions[0]?.value || draft.weapon;

    commit({
      ...draft,
      class: newCreatureClass,
      level: newCreatureClass === MONSTER ? 3 : 1,
      armorType: nextArmorType,
      armorClass: getDerivedArmorClass(nextArmorType),
      weapon: nextWeapon,
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

  const modalRoot =
    typeof document !== "undefined"
      ? document.getElementById("app-modal")
      : null;

  return (
    <div className={styles["combatantShell"]}>
      <button
        type={"button"}
        className={
          side === "party"
            ? styles["combatantButtonParty"]
            : styles["combatantButtonEnemy"]
        }
        onClick={() => setOpen(true)}
      >
        <span className={styles["combatantName"]}>
          {draft.name || (side === "party" ? "Party Member" : "Enemy")}
        </span>
      </button>
      <button
        type={"button"}
        className={styles["removeCombatant"]}
        disabled={!canRemove}
        onClick={onRemove}
      >
        x
      </button>
      {open &&
        modalRoot &&
        createPortal(
          <>
            <div
              className={styles["modalShadow"]}
              onClick={() => setOpen(false)}
            />
            <div className={styles["modal"]}>
              <div className={styles["modalTitle"]}>
                {side === "party" ? "Edit Party Member" : "Edit Enemy"}
              </div>
              <label className={styles["modalLabel"]} htmlFor={`name-${draft.key}`}>
                Name
              </label>
              <input
                id={`name-${draft.key}`}
                className={styles["textInput"]}
                type={"text"}
                value={draft.name || ""}
                onChange={handleNameChange}
                onBlur={handleNameBlur}
                placeholder={"Name or label"}
              />
              <label
                className={styles["modalLabel"]}
                htmlFor={`max-hp-${draft.key}`}
              >
                Max HP
              </label>
              <input
                id={`max-hp-${draft.key}`}
                className={styles["textInput"]}
                type={"text"}
                value={draft.maxHp || ""}
                onChange={handleMaxHpChange}
                onBlur={handleMaxHpBlur}
                placeholder={"Optional default maximum HP"}
              />
              <label className={styles["modalLabel"]}>Class</label>
              <Select
                isSearchable={false}
                instanceId={`creatureClass-${draft.key}`}
                styles={customStyles}
                value={attackerClassOptions.filter(
                  (option) => option.value === draft.class
                )}
                options={attackerClassOptions}
                onChange={handleCreatureClass}
              />
              <label className={styles["modalLabel"]}>Level</label>
              <Select
                isSearchable={false}
                instanceId={`level-${draft.key}`}
                styles={customStyles}
                value={levelOptions.filter((option) => option.value === draft.level)}
                options={levelOptions}
                onChange={handleLevel}
              />
              <label className={styles["modalLabel"]}>Armor Type</label>
              <Select
                isSearchable={false}
                instanceId={`armorType-${draft.key}`}
                styles={customStyles}
                value={armorTypeOptions.filter(
                  (option) => option.value === draft.armorType
                )}
                options={armorTypeOptions}
                onChange={handleArmorType}
              />
              <label className={styles["modalLabel"]}>Armor Class</label>
              <Select
                isSearchable={false}
                instanceId={`armorClass-${draft.key}`}
                styles={customStyles}
                value={armorClassOptions.filter(
                  (option) => option.value === draft.armorClass
                )}
                options={armorClassOptions}
                onChange={handleArmorClass}
              />
              <label className={styles["modalLabel"]}>Weapon</label>
              <Select
                isSearchable={false}
                instanceId={`weapon-${draft.key}`}
                styles={customStyles}
                value={weaponOptions.filter((option) => option.value === draft.weapon)}
                options={weaponOptions}
                onChange={handleWeapon}
              />
            </div>
          </>,
          modalRoot
        )}
    </div>
  );
};

export default TrackerCombatantInput;
