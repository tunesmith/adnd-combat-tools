import { FIGHTER, MONSTER } from '../tables/attackerClass';
import type {
  TrackerCombatant,
  TrackerCellState,
  TrackerCombatantRoundState,
  TrackerRound,
  TrackerState,
} from '../types/tracker';

type TrackerSide = 'party' | 'enemy';

const DEFAULT_PARTY_COUNT = 3;
const DEFAULT_ENEMY_COUNT = 3;
const DEFAULT_ROUND_PREFIX = 'Round';

const createBaseCombatant = (
  key: number,
  side: TrackerSide,
  name: string
): TrackerCombatant => ({
  key,
  name,
  class: side === 'party' ? FIGHTER : MONSTER,
  level: side === 'party' ? 1 : 3,
  armorType: side === 'party' ? 2 : 1,
  armorClass: side === 'party' ? 10 : 5,
  weapon: 1,
  maxHp: '',
});

export const createTrackerCombatant = (
  key: number,
  side: TrackerSide,
  count: number
): TrackerCombatant =>
  createBaseCombatant(
    key,
    side,
    `${side === 'party' ? 'Party' : 'Enemy'} ${count + 1}`
  );

export const createCombatantRoundState = (
  maxHp: string = ''
): TrackerCombatantRoundState => ({
  hp: maxHp,
  effect: '',
  action: '',
  result: '',
  notes: '',
});

export const getDefaultRoundLabel = (roundNumber: number): string =>
  `${DEFAULT_ROUND_PREFIX} ${roundNumber}`;

export const incrementRoundLabel = (label: string): string => {
  const trimmedLabel = label.trim();

  if (!trimmedLabel) {
    return getDefaultRoundLabel(2);
  }

  const trailingNumberMatch = trimmedLabel.match(/^(.*?)(\d+)$/);

  if (!trailingNumberMatch) {
    return `${trimmedLabel} 2`;
  }

  const prefix = trailingNumberMatch[1] || '';
  const currentNumber = trailingNumberMatch[2] || '';
  const nextNumber = (parseInt(currentNumber, 10) + 1)
    .toString()
    .padStart(currentNumber.length, '0');

  return `${prefix}${nextNumber}`;
};

const createEmptyCell = (): TrackerCellState => ({
  enemyToParty: '',
  partyToEnemy: '',
  enemyToPartyVisible: false,
  partyToEnemyVisible: false,
});

const cloneCombatant = (combatant: TrackerCombatant): TrackerCombatant => ({
  ...combatant,
});

const cloneCombatants = (combatants: TrackerCombatant[]): TrackerCombatant[] =>
  combatants.map((combatant) => cloneCombatant(combatant));

const hasEnemyToPartyContent = (cell: TrackerCellState): boolean =>
  Boolean(cell.enemyToParty.trim());

const hasPartyToEnemyContent = (cell: TrackerCellState): boolean =>
  Boolean(cell.partyToEnemy.trim());

const createEmptyCells = (
  enemyCount: number,
  partyCount: number
): TrackerCellState[][] =>
  Array.from({ length: enemyCount }, () =>
    Array.from({ length: partyCount }, () => createEmptyCell())
  );

const createNextRoundCells = (
  party: TrackerCombatant[],
  enemies: TrackerCombatant[],
  previousRound?: TrackerRound
): TrackerCellState[][] => {
  if (!previousRound) {
    return createEmptyCells(enemies.length, party.length);
  }

  return Array.from({ length: enemies.length }, (_, enemyIndex) =>
    Array.from({ length: party.length }, (_, partyIndex) => {
      const previousCell = previousRound.cells[enemyIndex]?.[partyIndex];

      return {
        enemyToParty: '',
        partyToEnemy: '',
        enemyToPartyVisible: previousCell
          ? hasEnemyToPartyContent(previousCell)
          : false,
        partyToEnemyVisible: previousCell
          ? hasPartyToEnemyContent(previousCell)
          : false,
      };
    })
  );
};

export const createTrackerRound = (
  party: TrackerCombatant[],
  enemies: TrackerCombatant[],
  label: string,
  previousRound?: TrackerRound
): TrackerRound => ({
  label,
  party: cloneCombatants(party),
  enemies: cloneCombatants(enemies),
  partyInitiative: '',
  enemyInitiative: '',
  summary: '',
  cells: createNextRoundCells(party, enemies, previousRound),
  partyStates: previousRound
    ? previousRound.partyStates.map((state) => ({
        hp: state.hp,
        effect: state.effect,
        action: '',
        result: '',
        notes: state.notes,
      }))
    : party.map((combatant) => createCombatantRoundState(combatant.maxHp)),
  enemyStates: previousRound
    ? previousRound.enemyStates.map((state) => ({
        hp: state.hp,
        effect: state.effect,
        action: '',
        result: '',
        notes: state.notes,
      }))
    : enemies.map((combatant) => createCombatantRoundState(combatant.maxHp)),
});

const createDefaultParty = () =>
  Array.from({ length: DEFAULT_PARTY_COUNT }, (_, index) =>
    createTrackerCombatant(index + 1, 'party', index)
  );

const createDefaultEnemies = () =>
  Array.from({ length: DEFAULT_ENEMY_COUNT }, (_, index) =>
    createTrackerCombatant(index + DEFAULT_PARTY_COUNT + 1, 'enemy', index)
  );

const incrementCopiedEnemyName = (
  previousName: string | undefined,
  fallbackCount: number
): string => {
  const trimmedName = previousName?.trim() || '';

  if (!trimmedName) {
    return `Enemy ${fallbackCount + 1}`;
  }

  const trailingNumberMatch = trimmedName.match(/^(.*?)(?:\s+(\d+))$/);
  if (trailingNumberMatch) {
    const baseName = trailingNumberMatch[1]?.trim() || trimmedName;
    const currentNumber = parseInt(trailingNumberMatch[2] || '', 10);

    if (Number.isFinite(currentNumber)) {
      return `${baseName} ${currentNumber + 1}`;
    }
  }

  return `${trimmedName} 2`;
};

export const createInitialTrackerState = (): TrackerState => {
  const party = createDefaultParty();
  const enemies = createDefaultEnemies();

  return {
    version: 7,
    rounds: [createTrackerRound(party, enemies, getDefaultRoundLabel(1))],
    activeRound: 0,
  };
};

export const insertRoundAfterActive = (state: TrackerState): TrackerState => {
  const currentRound = state.rounds[state.activeRound];
  if (!currentRound) {
    return state;
  }
  const newRound = createTrackerRound(
    currentRound.party,
    currentRound.enemies,
    incrementRoundLabel(currentRound.label),
    currentRound
  );
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
  const currentRound = state.rounds[state.activeRound];
  if (!currentRound) {
    return state;
  }

  const combatant =
    side === 'party'
      ? createTrackerCombatant(nextKey, side, currentRound.party.length)
      : (() => {
          const previousEnemy =
            currentRound.enemies[currentRound.enemies.length - 1];

          if (!previousEnemy) {
            return createTrackerCombatant(
              nextKey,
              side,
              currentRound.enemies.length
            );
          }

          return {
            ...cloneCombatant(previousEnemy),
            key: nextKey,
            name: incrementCopiedEnemyName(
              previousEnemy.name,
              currentRound.enemies.length
            ),
          };
        })();

  if (side === 'party') {
    return {
      ...state,
      rounds: state.rounds.map((round, roundIndex) =>
        roundIndex === state.activeRound
          ? {
              ...round,
              party: round.party.concat(cloneCombatant(combatant)),
              cells: round.cells.map((row) => row.concat(createEmptyCell())),
              partyStates: round.partyStates.concat(
                createCombatantRoundState(combatant.maxHp)
              ),
            }
          : round
      ),
    };
  }

  return {
    ...state,
    rounds: state.rounds.map((round, roundIndex) =>
      roundIndex === state.activeRound
        ? {
            ...round,
            enemies: round.enemies.concat(cloneCombatant(combatant)),
            cells: round.cells.concat([
              Array.from({ length: round.party.length }, () =>
                createEmptyCell()
              ),
            ]),
            enemyStates: round.enemyStates.concat(
              createCombatantRoundState(combatant.maxHp)
            ),
          }
        : round
    ),
  };
};

export const removeCombatant = (
  state: TrackerState,
  side: TrackerSide,
  index: number
): TrackerState => {
  const currentRound = state.rounds[state.activeRound];
  if (!currentRound) {
    return state;
  }

  if (side === 'party') {
    return {
      ...state,
      rounds: state.rounds.map((round, roundIndex) =>
        roundIndex === state.activeRound
          ? {
              ...round,
              party: round.party.filter(
                (_, partyIndex) => partyIndex !== index
              ),
              cells: round.cells.map((row) =>
                row.filter((_, partyIndex) => partyIndex !== index)
              ),
              partyStates: round.partyStates.filter(
                (_, partyIndex) => partyIndex !== index
              ),
            }
          : round
      ),
    };
  }

  return {
    ...state,
    rounds: state.rounds.map((round, roundIndex) =>
      roundIndex === state.activeRound
        ? {
            ...round,
            enemies: round.enemies.filter(
              (_, enemyIndex) => enemyIndex !== index
            ),
            cells: round.cells.filter((_, enemyIndex) => enemyIndex !== index),
            enemyStates: round.enemyStates.filter(
              (_, enemyIndex) => enemyIndex !== index
            ),
          }
        : round
    ),
  };
};

export const updateCombatant = (
  state: TrackerState,
  side: TrackerSide,
  index: number,
  combatant: TrackerCombatant
): TrackerState => {
  const currentRound = state.rounds[state.activeRound];
  if (!currentRound) {
    return state;
  }

  const previousCombatant =
    side === 'party' ? currentRound.party[index] : currentRound.enemies[index];
  const previousMaxHp = previousCombatant?.maxHp || '';
  const nextMaxHp = combatant.maxHp || '';

  const applyRoundDefaults = (
    roundState: TrackerCombatantRoundState
  ): TrackerCombatantRoundState => {
    if (nextMaxHp === previousMaxHp) {
      return roundState;
    }

    const shouldUpdateHp = !roundState.hp || roundState.hp === previousMaxHp;

    return {
      ...roundState,
      hp: shouldUpdateHp ? nextMaxHp : roundState.hp,
    };
  };

  if (side === 'party') {
    return {
      ...state,
      rounds: state.rounds.map((round, roundIndex) =>
        roundIndex === state.activeRound
          ? {
              ...round,
              party: round.party.map((member, partyIndex) =>
                partyIndex === index ? cloneCombatant(combatant) : member
              ),
              partyStates: round.partyStates.map((partyState, partyIndex) =>
                partyIndex === index
                  ? applyRoundDefaults(partyState)
                  : partyState
              ),
            }
          : round
      ),
    };
  }

  return {
    ...state,
    rounds: state.rounds.map((round, roundIndex) =>
      roundIndex === state.activeRound
        ? {
            ...round,
            enemies: round.enemies.map((member, enemyIndex) =>
              enemyIndex === index ? cloneCombatant(combatant) : member
            ),
            enemyStates: round.enemyStates.map((enemyState, enemyIndex) =>
              enemyIndex === index ? applyRoundDefaults(enemyState) : enemyState
            ),
          }
        : round
    ),
  };
};
