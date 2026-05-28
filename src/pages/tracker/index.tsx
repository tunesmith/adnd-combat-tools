import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import CombatTracker from '../../components/tracker/CombatTracker';
import TrackerDecoder from '../../components/tracker/TrackerDecoder';
import { getTrackerEncodedStateFromLocationParts } from '../../helpers/trackerUrl';

const getEncodedStateFromLocation = (): string | undefined => {
  if (typeof window === 'undefined') {
    return undefined;
  }

  const encodedState = getTrackerEncodedStateFromLocationParts(window.location);
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
    window.addEventListener('hashchange', syncFromLocation);
    window.addEventListener('popstate', syncFromLocation);

    return () => {
      window.removeEventListener('hashchange', syncFromLocation);
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
