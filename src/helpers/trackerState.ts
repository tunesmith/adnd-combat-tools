import { getTrackerActionDeclarations } from './trackerActionDeclarations';
import { FIGHTER, MONSTER } from '../tables/attackerClass';
import { getWeaponOptions } from '../tables/weapon';
import {
  DEFAULT_MISSILE_INITIATIVE_ADJUSTMENT,
  DEFAULT_MOVEMENT_RATE,
} from './initiative/initiativeTiming';
import type {
  TrackerCombatant,
  TrackerCellState,
  TrackerCombatantRoundState,
  TrackerRound,
  TrackerState,
} from '../types/tracker';

type TrackerSide = 'party' | 'enemy';

export type NewCombatHpMode = 'carry-current' | 'reset-to-max';

const DEFAULT_PARTY_COUNT = 3;
const DEFAULT_ENEMY_COUNT = 3;
const DEFAULT_ROUND_PREFIX = 'Round';
const FALLBACK_WEAPON_ID = 1;

const getDefaultClass = (side: TrackerSide): number =>
  side === 'party' ? FIGHTER : MONSTER;

const getDefaultWeapon = (attackerClass: number): number =>
  getWeaponOptions(attackerClass)[0]?.value || FALLBACK_WEAPON_ID;

export const ensureWeaponShortlist = (
  combatant: TrackerCombatant
): TrackerCombatant =>
  combatant.weaponShortlist && combatant.weaponShortlist.length > 0
    ? combatant
    : {
        ...combatant,
        weaponShortlist: [combatant.weapon],
      };

export const createBaseCombatant = (
  key: number,
  side: TrackerSide,
  name: string,
  values?: Pick<TrackerCombatant, 'class' | 'level'>
): TrackerCombatant => {
  const attackerClass = values?.class ?? getDefaultClass(side);
  const defaultWeapon = getDefaultWeapon(attackerClass);

  return {
    key,
    name,
    class: attackerClass,
    level: values?.level ?? (side === 'party' ? 1 : 3),
    armorType: side === 'party' ? 2 : 1,
    armorClass: side === 'party' ? 10 : 5,
    weapon: defaultWeapon,
    weaponShortlist: [defaultWeapon],
    maxHp: '',
    movementRate: DEFAULT_MOVEMENT_RATE,
    missileInitiativeAdjustment: DEFAULT_MISSILE_INITIATIVE_ADJUSTMENT,
    attacksPerRoutine: 1,
  };
};

const createTrackerCombatant = (
  key: number,
  side: TrackerSide,
  count: number
): TrackerCombatant =>
  createBaseCombatant(
    key,
    side,
    `${side === 'party' ? 'Party' : 'Enemy'} ${count + 1}`
  );

const createCombatantRoundState = (
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

const cloneCombatant = (combatant: TrackerCombatant): TrackerCombatant => {
  const clone = ensureWeaponShortlist({
    ...combatant,
  });

  return {
    ...clone,
    weaponShortlist: clone.weaponShortlist?.slice(),
  };
};

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

export function getNextRoundEffect(state: TrackerCombatantRoundState): string {
  if (state.nextRoundEffectOverride !== undefined)
    return state.nextRoundEffectOverride;
  if (!state.nextRoundEffect?.trim()) return state.effect;
  return [state.effect, state.nextRoundEffect]
    .filter((text) => text.trim())
    .join('\n');
}

export function editCombatantRoundField(
  state: TrackerCombatantRoundState,
  field: Exclude<keyof TrackerCombatantRoundState, 'nextRoundEffect'>,
  value: string
): TrackerCombatantRoundState {
  const edited = { ...state, [field]: value };
  if (
    state.nextRoundEffect !== undefined &&
    (field === 'effect' || field === 'nextRoundEffectOverride')
  ) {
    // Freeze the old combined preview before correcting its opening text.
    if (field === 'effect' && state.nextRoundEffect.trim()) {
      edited.nextRoundEffectOverride = getNextRoundEffect(state);
    }
    delete edited.nextRoundEffect;
  }
  return edited;
}

const carryCombatantIntoRound = (
  state: TrackerCombatantRoundState
): TrackerCombatantRoundState => ({
  ...createCombatantRoundState(state.hp),
  notes: state.notes,
  effect: getNextRoundEffect(state),
});

const createTrackerRound = (
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
    ? previousRound.partyStates.map(carryCombatantIntoRound)
    : party.map((combatant) => createCombatantRoundState(combatant.maxHp)),
  enemyStates: previousRound
    ? previousRound.enemyStates.map(carryCombatantIntoRound)
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

function carryOpenMelee(previous: TrackerRound, next: TrackerRound) {
  const melee = getTrackerActionDeclarations(previous).filter(
    (action) => action.declaredAction === 'open-melee'
  );
  for (const side of ['party', 'enemy'] as const) {
    const party = side === 'party';
    const actors = party ? next.party : next.enemies;
    const targets = party ? next.enemies : next.party;
    const direction = party ? 'partyToEnemy' : 'enemyToParty';
    actors.forEach((actor, index) => {
      const actions = melee.filter(
        (action) => action.side === side && action.combatantKey === actor.key
      );
      if (!actions.length) return;
      const targetKeys = new Set(
        actions.flatMap((action) =>
          action.targetDeclarations.map((target) => target.targetCombatantKey)
        )
      );
      let continuing = false;
      targets.forEach((target, targetIndex) => {
        const cell = party
          ? next.cells[targetIndex]?.[index]
          : next.cells[index]?.[targetIndex];
        if (!cell) return;
        // Replace the legacy shorthand-based visibility for this direction only.
        const keep = targetKeys.has(target.key);
        cell[`${direction}Visible`] = keep;
        if (keep) continuing = true;
      });
      if (continuing) {
        (next.actions ??= []).push({
          id: `${side}:${actor.key}:main`,
          source: 'intention',
          side,
          direction,
          combatantIndex: index,
          combatantKey: actor.key,
          weaponId: actor.weapon,
          targetSide: party ? 'enemy' : 'party',
          declaredAction: 'open-melee',
          intention: '',
          result: '',
          targetDeclarations: [],
        });
      }
    });
  }
}

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
  carryOpenMelee(currentRound, newRound);
  const rounds = state.rounds.slice();
  rounds.splice(state.activeRound + 1, 0, newRound);

  return {
    ...state,
    rounds,
    activeRound: state.activeRound + 1,
  };
};

export const startNewCombatFromActiveRound = (
  state: TrackerState,
  hpMode: NewCombatHpMode
): TrackerState => {
  const currentRound = state.rounds[state.activeRound];
  if (!currentRound) {
    return state;
  }

  const newRound = createTrackerRound(
    currentRound.party,
    currentRound.enemies,
    getDefaultRoundLabel(1)
  );

  if (hpMode === 'carry-current') {
    newRound.partyStates = newRound.partyStates.map((roundState, index) => ({
      ...roundState,
      hp: currentRound.partyStates[index]?.hp || '',
    }));
    newRound.enemyStates = newRound.enemyStates.map((roundState, index) => ({
      ...roundState,
      hp: currentRound.enemyStates[index]?.hp || '',
    }));
  }

  return {
    version: state.version,
    rounds: [newRound],
    activeRound: 0,
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
  nextKey: number,
  partyDraft?: TrackerCombatant
): TrackerState => {
  const currentRound = state.rounds[state.activeRound];
  if (!currentRound) {
    return state;
  }

  const combatant =
    side === 'party'
      ? partyDraft
        ? { ...partyDraft, key: nextKey }
        : createTrackerCombatant(nextKey, side, currentRound.party.length)
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

  // Removing a roster entry also removes its declarations and reindexes surviving
  // targets. Earlier rounds remain historical; only this round is edited.
  return {
    ...state,
    rounds: state.rounds.map((round, roundIndex) => {
      if (roundIndex !== state.activeRound) return round;
      const party = round.party.filter(
        (_, i) => side !== 'party' || i !== index
      );
      const enemies = round.enemies.filter(
        (_, i) => side !== 'enemy' || i !== index
      );
      const actions = round.actions?.flatMap((action) => {
        const actors = action.side === 'party' ? party : enemies;
        const targets = action.side === 'party' ? enemies : party;
        const combatantIndex = actors.findIndex(
          (c) => c.key === action.combatantKey
        );
        if (combatantIndex < 0) return [];
        return [
          {
            ...action,
            combatantIndex,
            targetDeclarations: action.targetDeclarations.flatMap((target) => {
              const targetCombatantIndex = targets.findIndex(
                (c) => c.key === target.targetCombatantKey
              );
              if (targetCombatantIndex < 0) return [];
              return [
                {
                  ...target,
                  targetCombatantIndex,
                  cellRowIndex:
                    action.side === 'party'
                      ? targetCombatantIndex
                      : combatantIndex,
                  cellColumnIndex:
                    action.side === 'party'
                      ? combatantIndex
                      : targetCombatantIndex,
                },
              ];
            }),
          },
        ];
      });
      const actionIds = new Set(actions?.map((action) => action.id));
      return {
        ...round,
        party,
        enemies,
        ...(actions ? { actions } : {}),
        partyStates: round.partyStates.filter(
          (_, i) => side !== 'party' || i !== index
        ),
        enemyStates: round.enemyStates.filter(
          (_, i) => side !== 'enemy' || i !== index
        ),
        cells: round.cells
          .filter((_, i) => side !== 'enemy' || i !== index)
          .map((row) =>
            row
              .filter((_, i) => side !== 'party' || i !== index)
              .map((cell) => ({
                ...cell,
                ...(cell.partyToEnemyActionIds
                  ? {
                      partyToEnemyActionIds: cell.partyToEnemyActionIds.filter(
                        (id) => actionIds.has(id)
                      ),
                    }
                  : {}),
                ...(cell.enemyToPartyActionIds
                  ? {
                      enemyToPartyActionIds: cell.enemyToPartyActionIds.filter(
                        (id) => actionIds.has(id)
                      ),
                    }
                  : {}),
              }))
          ),
      };
    }),
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
