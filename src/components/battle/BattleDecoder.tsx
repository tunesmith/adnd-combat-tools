import { useEffect, useState } from "react";
import { unzip } from "zlib";
import Battle from "./Battle";
import { expandedArmorTypes } from "../../tables/armorType";
import { WeaponInfo, weapons } from "../../tables/weapon";

/**
 * The creature data structure is a two-dimensional array.
 * Rows and Columns, like a basic spreadsheet matrix.
 * Each "Cell" can contain either a creature or an empty object.
 * The empty object *has* to be empty, so we define it as such here.
 */
type EmptyObject = Record<any, never>;

/**
 * The initial version of the Creature was inefficient. We were
 * storing the actual string version of the armor type number,
 * which was unclear since AT 7 refers to four different types
 * of armor.
 */
interface CreatureV1 {
  class: string;
  level: string;
  armorType: string;
  armorClass: number;
  weapon: string;
}
type StateV1 = (EmptyObject | CreatureV1)[][];

/**
 * For version 2, we transitioned to armor types with actual
 * numerical row ids, but it's still storing the actual string
 * value of the weapon name.
 */
interface CreatureV2 {
  class: string;
  level: string;
  armorType: number;
  armorClass: number;
  weapon: string;
}
type StateV2 = (EmptyObject | CreatureV2)[][];

/**
 * For version 3, we transitioned to a numerical row id for
 * each weapon.
 */
interface CreatureV3 {
  class: string;
  level: string;
  armorType: number;
  armorClass: number;
  weapon: number;
}
type StateV3 = (EmptyObject | CreatureV3)[][];

interface BattleDecoderProps {
  encodedState: string;
}

/**
 * When someone visits with a pre-existing state code, it could be
 * for any of the previously existing Creature versions.
 *
 * Technically, a StateWrapper cannot contain a *mix* of creature
 * versions...
 */
interface StateWrapper {
  version: number;
  state: StateV1 | StateV2 | StateV3;
}

const transformArmorType = (oldArmorType: string): number | null => {
  if (!oldArmorType.trim()) {
    return null;
  }
  return parseInt(oldArmorType, 10);
};

const transformState = (wrapper: StateWrapper): StateV3 => {
  switch (wrapper.version) {
    case 1:
      return (wrapper.state as StateV1).map((row) =>
        row.map((creature) => {
          if (Object.keys(creature).length) {
            const creatureV1 = creature as CreatureV1;
            const filteredArmor = expandedArmorTypes.filter(
              (armorProps) =>
                armorProps.armorType ===
                transformArmorType(creatureV1.armorType)
            )[0];
            const filteredWeapon = Array.from(weapons).filter(
              ([_, weaponInfo]: [number, WeaponInfo]) =>
                weaponInfo.name === creatureV1.weapon
            )[0];

            return {
              ...creatureV1,
              armorType: filteredArmor ? filteredArmor.key : 0,
              weapon: filteredWeapon ? filteredWeapon[0] : 0,
            };
          } else return creature as EmptyObject;
        })
      );
    case 2:
      return (wrapper.state as StateV2).map((row) =>
        row.map((creature) => {
          if (Object.keys(creature).length) {
            const creatureV2 = creature as CreatureV2;
            const filteredWeapon = Array.from(weapons).filter(
              ([_, weaponInfo]: [number, WeaponInfo]) =>
                weaponInfo.name === creatureV2.weapon
            )[0];
            return {
              ...creatureV2,
              weapon: filteredWeapon ? filteredWeapon[0] : 0,
            };
          } else return creature as EmptyObject;
        })
      );
    default: // version = 3
      return wrapper.state as StateV3;
  }
};

const BattleDecoder = ({ encodedState }: BattleDecoderProps) => {
  const [result, setResult] = useState<({} | CreatureV3)[][] | undefined>(
    undefined
  );

  useEffect(() => {
    let active = true;
    load();

    return () => {
      active = false;
    };

    async function load() {
      setResult(undefined); // this is optional

      const buffer = Buffer.from(decodeURI(encodedState), "base64");
      unzip(buffer, (err, buffer) => {
        if (err) {
          console.error("An error occurred:", err);
          // return emptyState;
          process.exitCode = 1;
        }
        const newState = JSON.parse(buffer.toString()) as StateWrapper;
        if (!active) {
          return;
        }
        setResult(transformState(newState));
      });
    }
  }, [encodedState]);

  return <>{result && <Battle rememberedState={result} />}</>;
};

export default BattleDecoder;
