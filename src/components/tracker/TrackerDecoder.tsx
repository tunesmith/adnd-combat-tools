import { useEffect, useState } from "react";
import type { TrackerState } from "../../types/tracker";
import { decodeTrackerState } from "../../helpers/trackerCodec";
import CombatTracker from "./CombatTracker";

interface TrackerDecoderProps {
  encodedState: string;
}

const TrackerDecoder = ({ encodedState }: TrackerDecoderProps) => {
  const [result, setResult] = useState<TrackerState | undefined>(undefined);

  useEffect(() => {
    let active = true;

    decodeTrackerState(encodedState)
      .then((decodedState) => {
        if (!active) {
          return;
        }

        setResult(decodedState);
      })
      .catch((error) => {
        console.error("An error occurred:", error);
        process.exitCode = 1;
      });

    return () => {
      active = false;
    };
  }, [encodedState]);

  return (
    <>{result && <CombatTracker rememberedState={result} loadedFromEncodedState />}</>
  );
};

export default TrackerDecoder;
