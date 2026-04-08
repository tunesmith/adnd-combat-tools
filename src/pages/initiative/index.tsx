import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import InitiativeDecoder from '../../components/initiative/InitiativeDecoder';
import InitiativePlayground from '../../components/initiative/InitiativePlayground';

const getEncodedStateFromLocation = (): string | undefined => {
  if (typeof window === 'undefined') {
    return undefined;
  }

  const encodedState = new URLSearchParams(window.location.search).get('s');
  return encodedState || undefined;
};

const InitiativeIndexPage = () => {
  const router = useRouter();
  const [loaded, setLoaded] = useState<boolean>(false);
  const [encodedState, setEncodedState] = useState<string | undefined>(
    undefined
  );

  useEffect(() => {
    if (!router.isReady) {
      return;
    }

    const syncFromLocation = () => {
      setEncodedState(getEncodedStateFromLocation());
      setLoaded(true);
    };

    syncFromLocation();
    window.addEventListener('popstate', syncFromLocation);

    return () => {
      window.removeEventListener('popstate', syncFromLocation);
    };
  }, [router.isReady]);

  return loaded ? (
    encodedState ? (
      <InitiativeDecoder encodedState={encodedState} />
    ) : (
      <InitiativePlayground />
    )
  ) : (
    <></>
  );
};

export default InitiativeIndexPage;
