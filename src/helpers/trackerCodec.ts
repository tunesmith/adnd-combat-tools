import { deflate, unzip } from "zlib";
import type {
  TrackerCellState,
  TrackerCombatantRoundState,
  TrackerCombatantRoundStateV1,
  TrackerCombatantRoundStateV2,
  TrackerRound,
  TrackerRoundV1,
  TrackerRoundV2,
  TrackerState,
  TrackerStateAnyVersion,
  TrackerStateV1,
} from "../types/tracker";

const migrateRoundState = (
  oldState: TrackerCombatantRoundStateV1,
  combatantMaxHp?: string
): TrackerCombatantRoundState => ({
  hp: oldState.hp || combatantMaxHp || "",
  effect: oldState.effect,
  action: oldState.action,
  result: oldState.result,
  notes: oldState.notes,
});

const migrateRoundStateV2 = (
  oldState: TrackerCombatantRoundStateV2,
  combatantMaxHp?: string
): TrackerCombatantRoundState => ({
  hp: oldState.hp || combatantMaxHp || oldState.maxHp || "",
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

const resolveCombatantMaxHpFromV2 = (
  currentMaxHp: string | undefined,
  rounds: TrackerRoundV2[],
  side: "party" | "enemy",
  index: number
): string => {
  if (currentMaxHp) {
    return currentMaxHp;
  }

  for (const round of rounds) {
    const roundState =
      side === "party" ? round.partyStates[index] : round.enemyStates[index];
    if (roundState?.maxHp) {
      return roundState.maxHp;
    }
  }

  return "";
};

const migrateRoundV2 = (
  round: TrackerRoundV2,
  partyMaxHp: string[],
  enemyMaxHp: string[]
): TrackerRound => ({
  partyInitiative: round.partyInitiative,
  enemyInitiative: round.enemyInitiative,
  summary: round.summary,
  cells: round.cells.map((row) =>
    row.map((cell) => ({
      enemyToParty: cell.enemyToParty,
      partyToEnemy: cell.partyToEnemy,
    }))
  ),
  partyStates: round.partyStates.map((state, index) =>
    migrateRoundStateV2(state, partyMaxHp[index])
  ),
  enemyStates: round.enemyStates.map((state, index) =>
    migrateRoundStateV2(state, enemyMaxHp[index])
  ),
});

export const transformTrackerState = (
  state: TrackerStateAnyVersion
): TrackerState => {
  if (state.version === 3) {
    return state;
  }

  if (state.version === 2) {
    const partyMaxHp = state.party.map((combatant, index) =>
      resolveCombatantMaxHpFromV2(combatant.maxHp, state.rounds, "party", index)
    );
    const enemyMaxHp = state.enemies.map((combatant, index) =>
      resolveCombatantMaxHpFromV2(
        combatant.maxHp,
        state.rounds,
        "enemy",
        index
      )
    );

    return {
      version: 3,
      party: state.party.map((combatant, index) => ({
        ...combatant,
        maxHp: partyMaxHp[index],
      })),
      enemies: state.enemies.map((combatant, index) => ({
        ...combatant,
        maxHp: enemyMaxHp[index],
      })),
      rounds: state.rounds.map((round) =>
        migrateRoundV2(round, partyMaxHp, enemyMaxHp)
      ),
      activeRound: state.activeRound,
    };
  }

  return {
    version: 3,
    party: state.party,
    enemies: state.enemies,
    rounds: state.rounds.map((round) => migrateRound(round, state)),
    activeRound: state.activeRound,
  };
};

export const encodeTrackerState = (state: TrackerState): Promise<string> =>
  new Promise((resolve, reject) => {
    deflate(JSON.stringify(state), (err, buffer) => {
      if (err) {
        reject(err);
        return;
      }

      resolve(encodeURIComponent(buffer.toString("base64")));
    });
  });

export const decodeTrackerState = (
  encodedState: string
): Promise<TrackerState> =>
  new Promise((resolve, reject) => {
    let buffer: Buffer;

    try {
      buffer = Buffer.from(decodeURIComponent(encodedState), "base64");
    } catch (error) {
      reject(error);
      return;
    }

    unzip(buffer, (err, inflated) => {
      if (err) {
        reject(err);
        return;
      }

      try {
        resolve(
          transformTrackerState(
            JSON.parse(inflated.toString()) as TrackerStateAnyVersion
          )
        );
      } catch (error) {
        reject(error);
      }
    });
  });
