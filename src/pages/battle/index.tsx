import Battle from "../../components/battle/Battle";
import { useRouter } from "next/router";
import BattleDecoder from "../../components/battle/BattleDecoder";
import { useEffect, useState } from "react";

const BattleIndexPage = () => {
  const router = useRouter();
  const [loaded, setLoaded] = useState<boolean>(false);
  const { s: state } = router.query;

  useEffect(() => {
    if (!router.isReady) return;
    setLoaded(true);
  }, [router.isReady]);

  return loaded ? (
    state ? (
      <BattleDecoder encodedState={state as string} />
    ) : (
      <Battle />
    )
  ) : (
    <></>
  );
};

export default BattleIndexPage;
