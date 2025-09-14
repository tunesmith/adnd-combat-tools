import { createPortal } from "react-dom";
import styles from "./battleModal.module.css";
import type { SingleValue } from "react-select";
import Select from "react-select";
import customStyles from "../../helpers/selectCustomStyles";
import { attackerClassOptions } from "../../tables/attackerClass";
import type {
  Dispatch,
  FocusEvent,
  SetStateAction,
  MutableRefObject,
} from "react";
import type {
  ArmorClassOption,
  ExpandedArmorTypeOption,
  CreatureOption,
  LevelOption,
  WeaponOption,
} from "../../types/option";

const BattleModal = ({
  setOpen,
  creatureName,
  handleCreatureName,
  creatureClass,
  handleCreatureClass,
  levelOptions,
  level,
  handleLevel,
  armorTypeOptions,
  armorType,
  handleArmorType,
  armorClassOptions,
  armorClass,
  handleArmorClass,
  weaponOptions,
  weapon,
  handleWeapon,
  row,
}: {
  setOpen: Dispatch<SetStateAction<boolean>>;
  creatureName: string | undefined;
  handleCreatureName: (e: FocusEvent<HTMLInputElement>) => void;
  creatureClass: number;
  handleCreatureClass: (option: SingleValue<CreatureOption>) => void;
  levelOptions: LevelOption[];
  level: number;
  handleLevel: (option: SingleValue<LevelOption>) => void;
  armorTypeOptions: ExpandedArmorTypeOption[];
  armorType: number;
  handleArmorType: (option: SingleValue<ExpandedArmorTypeOption>) => void;
  armorClassOptions: MutableRefObject<ArmorClassOption[]>;
  armorClass: number;
  handleArmorClass: (option: SingleValue<ArmorClassOption>) => void;
  weaponOptions: WeaponOption[];
  weapon: number;
  handleWeapon: (option: SingleValue<WeaponOption>) => void;
  row: number;
}) => {
  function close() {
    setOpen(false);
  }
  const modal = document.getElementById("app-modal");
  return modal ? (
    createPortal(
      <>
        <div className={styles["modalShadow"]} onClick={close} />
        <div
          className={styles["modal"]}
          style={{
            backgroundColor: row
              ? "var(--caput-martuum)"
              : "var(--dark-olive-green)",
          }}
        >
          <input
            className={styles["nameInput"]}
            type={"text"}
            defaultValue={creatureName}
            onBlur={handleCreatureName}
            placeholder={"(Name or label)"}
          />
          <br />
          <Select
            isSearchable={false}
            instanceId={"creatureClass"}
            styles={customStyles}
            value={attackerClassOptions.filter(
              (option) => option.value === creatureClass
            )}
            options={attackerClassOptions}
            onChange={handleCreatureClass}
          />
          <br />
          <Select
            isSearchable={false}
            instanceId={"level"}
            styles={customStyles}
            value={levelOptions.filter((option) => option.value === level)}
            options={levelOptions}
            onChange={handleLevel}
          />
          <br />
          <Select
            isSearchable={false}
            instanceId={"armorType"}
            styles={customStyles}
            value={armorTypeOptions.filter(
              (option) => option.value === armorType
            )}
            options={armorTypeOptions}
            onChange={handleArmorType}
          />
          <br />
          <Select
            isSearchable={false}
            instanceId={"armorClass"}
            styles={customStyles}
            value={armorClassOptions.current.filter(
              (option) => option.value === armorClass
            )}
            options={armorClassOptions.current}
            onChange={handleArmorClass}
          />
          <br />
          <Select
            isSearchable={false}
            instanceId={"weapon"}
            styles={customStyles}
            value={weaponOptions.filter((option) => option.value === weapon)}
            options={weaponOptions}
            onChange={handleWeapon}
          />
        </div>
      </>,
      modal
    )
  ) : (
    <></>
  );
};

export default BattleModal;
