import { useRouter } from "next/router";
import BattleDecoder from "../../components/battle/BattleDecoder";

const BattlePage = () => {
  const router = useRouter();
  const { state } = router.query;

  /**
   * Since this relies on automatic static optimization, it renders twice,
   * and only the second render finds the state from the query. Future
   * experiment: maybe use getStaticProps or getStaticPaths?
   */
  return <>{state && <BattleDecoder encodedState={state as string} />}</>;
};

export default BattlePage;
