import { useEffect, useState } from "react";
import { unzip } from "zlib";
import Battle from "./Battle";
import { expandedArmorTypes } from "../../tables/armorType";
import { weapons } from "../../tables/weapon";

interface CreatureV1 {
  class: string;
  level: string;
  armorType: string;
  armorClass: number;
  weapon: string;
}
interface CreatureV2 {
  class: string;
  level: string;
  armorType: number;
  armorClass: number;
  weapon: string;
}
interface CreatureV3 {
  class: string;
  level: string;
  armorType: number;
  armorClass: number;
  weapon: number;
}
interface BattleDecoderProps {
  encodedState: string;
}
interface StateWrapper {
  version: number;
  state: ({} | CreatureV1 | CreatureV2 | CreatureV3)[][];
}
const transformArmorType = (oldArmorType: string): number | null => {
  if (!oldArmorType.trim()) {
    return null;
  }
  return parseInt(oldArmorType, 10);
};
const transformState = (wrapper: StateWrapper): ({} | CreatureV3)[][] => {
  console.log(`wrapper version: ${wrapper.version}`);
  switch (wrapper.version) {
    case 1:
      return wrapper.state.map((row) =>
        row.map((creature) => {
          if (Object.keys(creature).length) {
            return {
              ...creature,
              armorType: expandedArmorTypes.filter(
                (prop) =>
                  prop.armorType ===
                  transformArmorType((creature as CreatureV1).armorType)
              )[0].key,
              weapon: Array.from(weapons).filter(
                ([weaponId, weaponInfo]) =>
                  weaponInfo.name === (creature as CreatureV1).weapon
              )[0][0],
            };
          } else return creature;
        })
      );
    case 2:
      return wrapper.state.map((row) =>
        row.map((creature) => {
          if (Object.keys(creature).length) {
            return {
              ...creature,
              weapon: Array.from(weapons).filter(
                ([weaponId, weaponInfo]) =>
                  weaponInfo.name === (creature as CreatureV2).weapon
              )[0][0],
            };
          } else return creature;
        })
      );
    default:
      return wrapper.state;
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
