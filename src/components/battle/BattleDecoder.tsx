import { useEffect, useState } from "react";
import { unzip } from "zlib";
import Battle from "./Battle";

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
        setResult(newState.state);
      });
    }
  }, [encodedState]);

  return <>{result && <Battle rememberedState={result} />}</>;
};

export default BattleDecoder;
