import { deflate, unzip } from "zlib";
import type {
  TrackerCellState,
  TrackerCombatant,
  TrackerCombatantRoundState,
  TrackerCombatantRoundStateV1,
  TrackerCombatantRoundStateV2,
  TrackerRound,
  TrackerRoundV1,
  TrackerRoundV2,
  TrackerState,
  TrackerStateAnyVersion,
  TrackerStateV4,
  TrackerStateV1,
} from "../types/tracker";

const cloneCombatants = (combatants: TrackerCombatant[]): TrackerCombatant[] =>
  combatants.map((combatant) => ({
    ...combatant,
  }));

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
  isVisible: true,
});

const migrateRound = (
  round: TrackerRoundV1,
  oldState: TrackerStateV1
): TrackerRound => ({
  party: cloneCombatants(oldState.party),
  enemies: cloneCombatants(oldState.enemies),
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
  party: TrackerCombatant[],
  enemies: TrackerCombatant[],
  partyMaxHp: string[],
  enemyMaxHp: string[]
): TrackerRound => ({
  party: cloneCombatants(
    party.map((combatant, index) => ({
      ...combatant,
      maxHp: partyMaxHp[index],
    }))
  ),
  enemies: cloneCombatants(
    enemies.map((combatant, index) => ({
      ...combatant,
      maxHp: enemyMaxHp[index],
    }))
  ),
  partyInitiative: round.partyInitiative,
  enemyInitiative: round.enemyInitiative,
  summary: round.summary,
  cells: round.cells.map((row) =>
    row.map((cell) => ({
      enemyToParty: cell.enemyToParty,
      partyToEnemy: cell.partyToEnemy,
      isVisible: true,
    }))
  ),
  partyStates: round.partyStates.map((state, index) =>
    migrateRoundStateV2(state, partyMaxHp[index])
  ),
  enemyStates: round.enemyStates.map((state, index) =>
    migrateRoundStateV2(state, enemyMaxHp[index])
  ),
});

const attachRoundRoster = (
  state: TrackerStateV4,
  round: TrackerStateV4["rounds"][number]
): TrackerRound => ({
  party: cloneCombatants(state.party),
  enemies: cloneCombatants(state.enemies),
  partyInitiative: round.partyInitiative,
  enemyInitiative: round.enemyInitiative,
  summary: round.summary,
  cells: round.cells.map((row) =>
    row.map((cell) => ({
      enemyToParty: cell.enemyToParty,
      partyToEnemy: cell.partyToEnemy,
      isVisible: cell.isVisible,
    }))
  ),
  partyStates: round.partyStates.map((partyState) => ({
    ...partyState,
  })),
  enemyStates: round.enemyStates.map((enemyState) => ({
    ...enemyState,
  })),
});

export const transformTrackerState = (
  state: TrackerStateAnyVersion
): TrackerState => {
  if (state.version === 5) {
    return state;
  }

  if (state.version === 4) {
    return {
      version: 5,
      rounds: state.rounds.map((round) => attachRoundRoster(state, round)),
      activeRound: state.activeRound,
    };
  }

  if (state.version === 3) {
    return {
      version: 5,
      rounds: state.rounds.map((round) => ({
        party: cloneCombatants(state.party),
        enemies: cloneCombatants(state.enemies),
        ...round,
        cells: round.cells.map((row) =>
          row.map((cell) => ({
            enemyToParty: cell.enemyToParty,
            partyToEnemy: cell.partyToEnemy,
            isVisible: true,
          }))
        ),
      })),
      activeRound: state.activeRound,
    };
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
      version: 5,
      rounds: state.rounds.map((round) =>
        migrateRoundV2(round, state.party, state.enemies, partyMaxHp, enemyMaxHp)
      ),
      activeRound: state.activeRound,
    };
  }

  return {
    version: 5,
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
