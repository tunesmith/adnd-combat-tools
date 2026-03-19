import { FIGHTER, MONSTER } from "../tables/attackerClass";
import type {
  TrackerCombatant,
  TrackerCellState,
  TrackerCombatantRoundState,
  TrackerRound,
  TrackerState,
} from "../types/tracker";

type TrackerSide = "party" | "enemy";

const DEFAULT_PARTY_COUNT = 3;
const DEFAULT_ENEMY_COUNT = 3;

const createBaseCombatant = (
  key: number,
  side: TrackerSide,
  name: string
): TrackerCombatant => ({
  key,
  name,
  class: side === "party" ? FIGHTER : MONSTER,
  level: side === "party" ? 1 : 3,
  armorType: side === "party" ? 2 : 1,
  armorClass: side === "party" ? 10 : 5,
  weapon: 1,
  maxHp: "",
});

export const createTrackerCombatant = (
  key: number,
  side: TrackerSide,
  count: number
): TrackerCombatant =>
  createBaseCombatant(
    key,
    side,
    `${side === "party" ? "Party" : "Enemy"} ${count + 1}`
  );

export const createCombatantRoundState = (
  maxHp: string = ""
): TrackerCombatantRoundState => ({
  hp: maxHp,
  effect: "",
  action: "",
  result: "",
  notes: "",
});

const createEmptyCell = (): TrackerCellState => ({
  enemyToParty: "",
  partyToEnemy: "",
});

const createEmptyCells = (
  enemyCount: number,
  partyCount: number
): TrackerCellState[][] =>
  Array.from({ length: enemyCount }, () =>
    Array.from({ length: partyCount }, () => createEmptyCell())
  );

export const createTrackerRound = (
  party: TrackerCombatant[],
  enemies: TrackerCombatant[],
  previousRound?: TrackerRound
): TrackerRound => ({
  partyInitiative: "",
  enemyInitiative: "",
  summary: "",
  cells: createEmptyCells(enemies.length, party.length),
  partyStates: previousRound
    ? previousRound.partyStates.map((state) => ({
        hp: state.hp,
        effect: state.effect,
        action: "",
        result: "",
        notes: state.notes,
      }))
    : party.map((combatant) => createCombatantRoundState(combatant.maxHp)),
  enemyStates: previousRound
    ? previousRound.enemyStates.map((state) => ({
        hp: state.hp,
        effect: state.effect,
        action: "",
        result: "",
        notes: state.notes,
      }))
    : enemies.map((combatant) => createCombatantRoundState(combatant.maxHp)),
});

const createDefaultParty = () =>
  Array.from({ length: DEFAULT_PARTY_COUNT }, (_, index) =>
    createTrackerCombatant(index + 1, "party", index)
  );

const createDefaultEnemies = () =>
  Array.from({ length: DEFAULT_ENEMY_COUNT }, (_, index) =>
    createTrackerCombatant(index + DEFAULT_PARTY_COUNT + 1, "enemy", index)
  );

export const createInitialTrackerState = (): TrackerState => {
  const party = createDefaultParty();
  const enemies = createDefaultEnemies();

  return {
    version: 3,
    party,
    enemies,
    rounds: [createTrackerRound(party, enemies)],
    activeRound: 0,
  };
};

export const insertRoundAfterActive = (state: TrackerState): TrackerState => {
  const currentRound = state.rounds[state.activeRound];
  const newRound = createTrackerRound(state.party, state.enemies, currentRound);
  const rounds = state.rounds.slice();
  rounds.splice(state.activeRound + 1, 0, newRound);

  return {
    ...state,
    rounds,
    activeRound: state.activeRound + 1,
  };
};

export const removeActiveRound = (state: TrackerState): TrackerState => {
  if (state.rounds.length <= 1) {
    return state;
  }

  const rounds = state.rounds.filter((_, index) => index !== state.activeRound);

  return {
    ...state,
    rounds,
    activeRound: Math.max(0, state.activeRound - 1),
  };
};

export const addCombatant = (
  state: TrackerState,
  side: TrackerSide,
  nextKey: number
): TrackerState => {
  const combatant = createTrackerCombatant(
    nextKey,
    side,
    side === "party" ? state.party.length : state.enemies.length
  );

  if (side === "party") {
    return {
      ...state,
      party: state.party.concat(combatant),
      rounds: state.rounds.map((round) => ({
        ...round,
        cells: round.cells.map((row) => row.concat(createEmptyCell())),
        partyStates: round.partyStates.concat(
          createCombatantRoundState(combatant.maxHp)
        ),
      })),
    };
  }

  return {
    ...state,
    enemies: state.enemies.concat(combatant),
    rounds: state.rounds.map((round) => ({
      ...round,
      cells: round.cells.concat([
        Array.from({ length: state.party.length }, () => createEmptyCell()),
      ]),
      enemyStates: round.enemyStates.concat(
        createCombatantRoundState(combatant.maxHp)
      ),
    })),
  };
};

export const removeCombatant = (
  state: TrackerState,
  side: TrackerSide,
  index: number
): TrackerState => {
  if (side === "party") {
    return {
      ...state,
      party: state.party.filter((_, partyIndex) => partyIndex !== index),
      rounds: state.rounds.map((round) => ({
        ...round,
        cells: round.cells.map((row) =>
          row.filter((_, partyIndex) => partyIndex !== index)
        ),
        partyStates: round.partyStates.filter(
          (_, partyIndex) => partyIndex !== index
        ),
      })),
    };
  }

  return {
    ...state,
    enemies: state.enemies.filter((_, enemyIndex) => enemyIndex !== index),
    rounds: state.rounds.map((round) => ({
      ...round,
      cells: round.cells.filter((_, enemyIndex) => enemyIndex !== index),
      enemyStates: round.enemyStates.filter(
        (_, enemyIndex) => enemyIndex !== index
      ),
    })),
  };
};

export const updateCombatant = (
  state: TrackerState,
  side: TrackerSide,
  index: number,
  combatant: TrackerCombatant
): TrackerState => {
  const previousCombatant =
    side === "party" ? state.party[index] : state.enemies[index];
  const previousMaxHp = previousCombatant?.maxHp || "";
  const nextMaxHp = combatant.maxHp || "";

  const applyRoundDefaults = (
    roundState: TrackerCombatantRoundState
  ): TrackerCombatantRoundState => {
    if (nextMaxHp === previousMaxHp) {
      return roundState;
    }

    const shouldUpdateHp =
      !roundState.hp || roundState.hp === previousMaxHp;

    return {
      ...roundState,
      hp: shouldUpdateHp ? nextMaxHp : roundState.hp,
    };
  };

  if (side === "party") {
    return {
      ...state,
      party: state.party.map((member, partyIndex) =>
        partyIndex === index ? combatant : member
      ),
      rounds: state.rounds.map((round) => ({
        ...round,
        partyStates: round.partyStates.map((partyState, partyIndex) =>
          partyIndex === index ? applyRoundDefaults(partyState) : partyState
        ),
      })),
    };
  }

  return {
    ...state,
    enemies: state.enemies.map((member, enemyIndex) =>
      enemyIndex === index ? combatant : member
    ),
    rounds: state.rounds.map((round) => ({
      ...round,
      enemyStates: round.enemyStates.map((enemyState, enemyIndex) =>
        enemyIndex === index ? applyRoundDefaults(enemyState) : enemyState
      ),
    })),
  };
};
