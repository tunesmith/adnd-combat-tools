import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import CombatTracker from '../../components/tracker/CombatTracker';
import TrackerDecoder from '../../components/tracker/TrackerDecoder';

const getEncodedStateFromLocation = (): string | undefined => {
  if (typeof window === 'undefined') {
    return undefined;
  }

  const encodedState = new URLSearchParams(window.location.search).get('s');
  return encodedState || undefined;
};

const TrackerIndexPage = () => {
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
      <TrackerDecoder encodedState={encodedState} />
    ) : (
      <CombatTracker />
    )
  ) : (
    <></>
  );
};

export default TrackerIndexPage;
