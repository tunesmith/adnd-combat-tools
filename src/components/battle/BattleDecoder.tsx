import { useEffect, useState } from "react";
import { unzip } from "zlib";
import Battle from "./Battle";
import { expandedArmorTypes } from "../../tables/armorType";
import { WeaponInfo, weapons } from "../../tables/weapon";
import {
  CreatureV1,
  CreatureV2,
  CreatureV3,
  EmptyObject,
  StateV1,
  StateV2,
  StateV3,
  StateV4,
} from "../../types/creature";
import {
  ASSASSIN,
  BARD,
  CLERIC,
  DRUID,
  FIGHTER,
  ILLUSIONIST,
  MAGIC_USER,
  MONK,
  MONSTER,
  PALADIN,
  RANGER,
  THIEF,
} from "../../tables/attackerClass";
import { monsterLevels } from "../../tables/combatLevel";

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
  state: StateV1 | StateV2 | StateV3 | StateV4;
}

const transformArmorType = (oldArmorType: string): number | null => {
  if (!oldArmorType.trim()) {
    return null;
  }
  return parseInt(oldArmorType, 10);
};

const transformClass = (creatureClass: string): number => {
  switch (creatureClass) {
    case "monster":
      return MONSTER;
    case "cleric":
      return CLERIC;
    case "druid":
      return DRUID;
    case "fighter":
      return FIGHTER;
    case "ranger":
      return RANGER;
    case "paladin":
      return PALADIN;
    case "magicuser":
      return MAGIC_USER;
    case "illusionist":
      return ILLUSIONIST;
    case "thief":
      return THIEF;
    case "assassin":
      return ASSASSIN;
    case "monk":
      return MONK;
    case "bard":
      return BARD;
    default:
      console.error(`Unrecognized class ${creatureClass}, returning MONSTER`);
      return MONSTER;
  }
};
const transformLevel = (level: string, creatureClass: number): number => {
  if (creatureClass === MONSTER) {
    const monsterLevel = Array.from(monsterLevels).filter(
      ([_, props]) => props.label === level
    )[0];
    if (monsterLevel) {
      return monsterLevel[0];
    } else {
      console.error(
        `Could not get level for monster level ${level}, returning 3 (1HD)`
      );
      return 3;
    }
  } else {
    const numberLevel = parseInt(level, 10);
    if (isNaN(numberLevel)) {
      console.error("Could not parse level for ${level}, returning 1");
      return 1;
    } else {
      return numberLevel;
    }
  }
};
const transformState = (wrapper: StateWrapper): StateV4 => {
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
            const creatureClass = transformClass(creatureV1.class);
            return {
              ...creatureV1,
              armorType: filteredArmor ? filteredArmor.key : 0,
              weapon: filteredWeapon ? filteredWeapon[0] : 0,
              class: creatureClass,
              level: transformLevel(creatureV1.level, creatureClass),
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
            const creatureClass = transformClass(creatureV2.class);
            return {
              ...creatureV2,
              weapon: filteredWeapon ? filteredWeapon[0] : 0,
              class: creatureClass,
              level: transformLevel(creatureV2.level, creatureClass),
            };
          } else return creature as EmptyObject;
        })
      );
    case 3:
      return (wrapper.state as StateV3).map((row) =>
        row.map((creature) => {
          if (Object.keys(creature).length) {
            const creatureV3 = creature as CreatureV3;
            const creatureClass = transformClass(creatureV3.class);
            return {
              ...creatureV3,
              class: creatureClass,
              level: transformLevel(creatureV3.level, creatureClass),
            };
          } else return creature as EmptyObject;
        })
      );
    default: // version = 4
      return wrapper.state as StateV4;
  }
};

const BattleDecoder = ({ encodedState }: BattleDecoderProps) => {
  const [result, setResult] = useState<StateV4 | undefined>(undefined);

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
