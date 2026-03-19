import { useEffect, useState } from "react";
import { unzip } from "zlib";
import type { TrackerState } from "../../types/tracker";
import CombatTracker from "./CombatTracker";

interface TrackerDecoderProps {
  encodedState: string;
}

const TrackerDecoder = ({ encodedState }: TrackerDecoderProps) => {
  const [result, setResult] = useState<TrackerState | undefined>(undefined);

  useEffect(() => {
    let active = true;

    const buffer = Buffer.from(decodeURIComponent(encodedState), "base64");
    unzip(buffer, (err, inflated) => {
      if (err) {
        console.error("An error occurred:", err);
        process.exitCode = 1;
        return;
      }

      if (!active) {
        return;
      }

      setResult(JSON.parse(inflated.toString()) as TrackerState);
    });

    return () => {
      active = false;
    };
  }, [encodedState]);

  return <>{result && <CombatTracker rememberedState={result} />}</>;
};

export default TrackerDecoder;
