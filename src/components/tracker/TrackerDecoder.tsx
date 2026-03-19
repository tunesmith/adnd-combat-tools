import { useEffect, useState } from "react";
import { unzip } from "zlib";
import type {
  TrackerCellState,
  TrackerCombatantRoundState,
  TrackerCombatantRoundStateV1,
  TrackerRound,
  TrackerRoundV1,
  TrackerState,
  TrackerStateAnyVersion,
  TrackerStateV1,
} from "../../types/tracker";
import CombatTracker from "./CombatTracker";

interface TrackerDecoderProps {
  encodedState: string;
}

const migrateRoundState = (
  oldState: TrackerCombatantRoundStateV1,
  combatantMaxHp?: string
): TrackerCombatantRoundState => ({
  maxHp: combatantMaxHp || oldState.hp || "",
  hp: oldState.hp || combatantMaxHp || "",
  effect: oldState.effect,
  action: oldState.action,
  result: oldState.result,
  notes: oldState.notes,
});

const migrateCell = (value: string): TrackerCellState => ({
  enemyToParty: value,
  partyToEnemy: "",
});

const migrateRound = (
  round: TrackerRoundV1,
  oldState: TrackerStateV1
): TrackerRound => ({
  partyInitiative: round.partyInitiative,
  enemyInitiative: round.enemyInitiative,
  summary: round.summary,
  cells: round.cells.map((row) => row.map((value) => migrateCell(value))),
  partyStates: round.partyStates.map((state, index) =>
    migrateRoundState(state, oldState.party[index]?.maxHp)
  ),
  enemyStates: round.enemyStates.map((state, index) =>
    migrateRoundState(state, oldState.enemies[index]?.maxHp)
  ),
});

const transformState = (state: TrackerStateAnyVersion): TrackerState => {
  if (state.version === 2) {
    return state;
  }

  return {
    version: 2,
    party: state.party,
    enemies: state.enemies,
    rounds: state.rounds.map((round) => migrateRound(round, state)),
    activeRound: state.activeRound,
  };
};

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

      setResult(
        transformState(JSON.parse(inflated.toString()) as TrackerStateAnyVersion)
      );
    });

    return () => {
      active = false;
    };
  }, [encodedState]);

  return <>{result && <CombatTracker rememberedState={result} />}</>;
};

export default TrackerDecoder;
