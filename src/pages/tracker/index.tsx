import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import CombatTracker from "../../components/tracker/CombatTracker";
import TrackerDecoder from "../../components/tracker/TrackerDecoder";

const TrackerIndexPage = () => {
  const router = useRouter();
  const [loaded, setLoaded] = useState<boolean>(false);
  const { s: state } = router.query;

  useEffect(() => {
    if (!router.isReady) {
      return;
    }
    setLoaded(true);
  }, [router.isReady]);

  return loaded ? (
    state ? (
      <TrackerDecoder encodedState={state as string} />
    ) : (
      <CombatTracker />
    )
  ) : (
    <></>
  );
};

export default TrackerIndexPage;
