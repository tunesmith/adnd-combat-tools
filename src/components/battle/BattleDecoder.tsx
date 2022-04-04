import { useEffect, useState } from "react";
import { unzip } from "zlib";
import Battle from "./Battle";
import { expandedArmorTypes } from "../../tables/armorType";

interface Creature {
  class: string;
  level: string;
  armorType: string;
  armorClass: number;
  weapon: string;
}
interface BattleDecoderProps {
  encodedState: string;
}
interface StateWrapper {
  version: number;
  state: ({} | Creature)[][];
}
const transformArmorType = (oldArmorType: string): number | null => {
  if (!oldArmorType.trim()) {
    return null;
  }
  return parseInt(oldArmorType, 10);
};
const transformState = (wrapper: StateWrapper): ({} | Creature)[][] => {
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
                  transformArmorType((creature as Creature).armorType)
              )[0].key,
            };
          } else return creature;
        })
      );
    default:
      return wrapper.state;
  }
};

const BattleDecoder = ({ encodedState }: BattleDecoderProps) => {
  const [result, setResult] = useState<({} | Creature)[][] | undefined>(
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
