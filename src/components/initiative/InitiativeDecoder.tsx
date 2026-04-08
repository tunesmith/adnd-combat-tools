import { useEffect, useState } from 'react';
import {
  decodeInitiativePlaytestState,
  type InitiativePlaytestState,
} from '../../helpers/initiativeCodec';
import InitiativePlayground from './InitiativePlayground';

interface InitiativeDecoderProps {
  encodedState: string;
}

const InitiativeDecoder = ({ encodedState }: InitiativeDecoderProps) => {
  const [result, setResult] = useState<InitiativePlaytestState | undefined>(
    undefined
  );
  const [decodeFailed, setDecodeFailed] = useState<boolean>(false);

  useEffect(() => {
    let active = true;
    setDecodeFailed(false);

    decodeInitiativePlaytestState(encodedState)
      .then((decodedState) => {
        if (!active) {
          return;
        }

        setResult(decodedState);
      })
      .catch((error) => {
        if (!active) {
          return;
        }

        console.error('An error occurred:', error);
        setDecodeFailed(true);
      });

    return () => {
      active = false;
    };
  }, [encodedState]);

  return (
    <>
      {result ? (
        <InitiativePlayground rememberedState={result} />
      ) : decodeFailed ? (
        <InitiativePlayground />
      ) : null}
    </>
  );
};

export default InitiativeDecoder;
