import { deflateSync, unzip } from 'zlib';
import type { InitiativeDeclaredAction } from '../types/initiative';

export interface InitiativePlaytestActionState {
  id: string;
  declaredAction: InitiativeDeclaredAction;
  actionLabel?: string;
  actionDistanceInches: string;
  activationSegments: string;
  castingSegments: string;
  attackRoutineCount: string;
  targetCombatantKeys: number[];
}

export interface InitiativePlaytestCombatantState {
  key: number;
  name: string;
  movementRate: string;
  missileInitiativeAdjustment: string;
  weaponId: number;
  actions: InitiativePlaytestActionState[];
}

export interface InitiativePlaytestState {
  label: string;
  partyInitiative: string;
  enemyInitiative: string;
  nextCombatantKey: number;
  party: InitiativePlaytestCombatantState[];
  enemies: InitiativePlaytestCombatantState[];
  pairDistances: Record<string, string>;
  attackActivationSegments: Record<string, string>;
  attackCastingSegments: Record<string, string>;
}

interface InitiativePlaytestStateV1 {
  version: 1;
  label: string;
  partyInitiative: string;
  enemyInitiative: string;
  nextCombatantKey: number;
  party: unknown[];
  enemies: unknown[];
  pairDistances: Record<string, string>;
  attackActivationSegments: Record<string, string>;
  attackCastingSegments: Record<string, string>;
}

interface InitiativePlaytestStateV2 {
  version: 2;
  label: string;
  partyInitiative: string;
  enemyInitiative: string;
  nextCombatantKey: number;
  party: unknown[];
  enemies: unknown[];
  pairDistances: Record<string, string>;
  attackActivationSegments: Record<string, string>;
  attackCastingSegments: Record<string, string>;
}

interface InitiativePlaytestStateV3 {
  version: 3;
  label: string;
  partyInitiative: string;
  enemyInitiative: string;
  nextCombatantKey: number;
  party: InitiativePlaytestCombatantState[];
  enemies: InitiativePlaytestCombatantState[];
  pairDistances: Record<string, string>;
  attackActivationSegments: Record<string, string>;
  attackCastingSegments: Record<string, string>;
}

type InitiativePlaytestStateAnyVersion =
  | InitiativePlaytestStateV1
  | InitiativePlaytestStateV2
  | InitiativePlaytestStateV3;

const INITIATIVE_ACTIONS: InitiativeDeclaredAction[] = [
  'none',
  'open-melee',
  'close',
  'charge',
  'set-vs-charge',
  'missile',
  'turn-undead',
  'magical-device',
  'spell-casting',
];

export const INITIATIVE_ACTION_LABEL_MAX_LENGTH = 80;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isInitiativeDeclaredAction = (
  value: unknown
): value is InitiativeDeclaredAction =>
  typeof value === 'string' &&
  INITIATIVE_ACTIONS.includes(value as InitiativeDeclaredAction);

const sanitizeString = (value: unknown): string =>
  typeof value === 'string' ? value : String(value ?? '');

const sanitizeActionLabel = (value: unknown): string | undefined => {
  const label = sanitizeString(value).trim();

  return label.length > 0
    ? label.slice(0, INITIATIVE_ACTION_LABEL_MAX_LENGTH)
    : undefined;
};

const sanitizeNumber = (value: unknown, fallback: number): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const sanitizeTargetCombatantKeys = (value: unknown): number[] =>
  Array.isArray(value)
    ? value
        .map((targetKey) => sanitizeNumber(targetKey, NaN))
        .filter((targetKey) => Number.isFinite(targetKey))
    : [];

interface InitiativePlaytestActionFallback {
  declaredAction: InitiativeDeclaredAction;
  actionLabel?: string;
  actionDistanceInches: string;
  activationSegments: string;
  castingSegments: string;
  attackRoutineCount: string;
  targetCombatantKeys: number[];
}

const sanitizeAction = (
  candidate: unknown,
  fallback: InitiativePlaytestActionFallback,
  index: number
): InitiativePlaytestActionState | undefined => {
  if (!isRecord(candidate)) {
    return undefined;
  }

  const declaredAction = isInitiativeDeclaredAction(candidate['declaredAction'])
    ? candidate['declaredAction']
    : fallback.declaredAction;
  const actionLabel = sanitizeActionLabel(candidate['actionLabel']);
  const targetCombatantKeys = sanitizeTargetCombatantKeys(
    candidate['targetCombatantKeys']
  );

  return {
    id: sanitizeString(
      candidate['id'] || (index === 0 ? 'main' : `action-${index + 1}`)
    )
      .trim()
      .slice(0, 40),
    declaredAction,
    ...(actionLabel ? { actionLabel } : {}),
    actionDistanceInches: sanitizeString(
      candidate['actionDistanceInches'] ?? fallback.actionDistanceInches
    ),
    activationSegments: sanitizeString(
      candidate['activationSegments'] ?? fallback.activationSegments
    ),
    castingSegments: sanitizeString(
      candidate['castingSegments'] ?? fallback.castingSegments
    ),
    attackRoutineCount: sanitizeString(
      candidate['attackRoutineCount'] ?? fallback.attackRoutineCount
    ),
    targetCombatantKeys: declaredAction === 'none' ? [] : targetCombatantKeys,
  };
};

const sanitizeCombatant = (
  candidate: unknown
): InitiativePlaytestCombatantState => {
  if (!isRecord(candidate)) {
    throw new Error('Stored initiative combatant is invalid.');
  }

  const targetCombatantKeys = sanitizeTargetCombatantKeys(
    candidate['targetCombatantKeys']
  );

  const declaredAction = isInitiativeDeclaredAction(candidate['declaredAction'])
    ? candidate['declaredAction']
    : 'open-melee';
  const actionLabel = sanitizeActionLabel(candidate['actionLabel']);
  const fallbackAction: InitiativePlaytestActionFallback = {
    declaredAction,
    ...(actionLabel ? { actionLabel } : {}),
    actionDistanceInches: sanitizeString(candidate['actionDistanceInches']),
    activationSegments: sanitizeString(candidate['activationSegments']),
    castingSegments: sanitizeString(candidate['castingSegments']),
    attackRoutineCount: sanitizeString(candidate['attackRoutineCount'] || '1'),
    targetCombatantKeys: declaredAction === 'none' ? [] : targetCombatantKeys,
  };

  const actions = Array.isArray(candidate['actions'])
    ? candidate['actions']
        .map((action, index) => sanitizeAction(action, fallbackAction, index))
        .filter(
          (action): action is InitiativePlaytestActionState =>
            action !== undefined
        )
    : [];

  return {
    key: sanitizeNumber(candidate['key'], 0),
    name: sanitizeString(candidate['name']),
    movementRate: sanitizeString(candidate['movementRate'] || '12'),
    missileInitiativeAdjustment: sanitizeString(
      candidate['missileInitiativeAdjustment'] || '0'
    ),
    weaponId: sanitizeNumber(candidate['weaponId'], 1),
    actions:
      actions.length > 0
        ? actions
        : [
            {
              id: 'main',
              ...fallbackAction,
            },
          ],
  };
};

const sanitizePairDistances = (value: unknown): Record<string, string> => {
  if (!isRecord(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => /^\d+:\d+$/.test(key))
      .map(([key, distance]) => [key, sanitizeString(distance)])
  );
};

const sanitizeAttackActivationSegments = (
  value: unknown
): Record<string, string> => {
  if (!isRecord(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => /^(party|enemy):\d+:\d+$/.test(key))
      .map(([key, activationSegments]) => [
        key,
        sanitizeString(activationSegments),
      ])
  );
};

const sanitizeAttackCastingSegments = (
  value: unknown
): Record<string, string> => {
  if (!isRecord(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => /^(party|enemy):\d+:\d+$/.test(key))
      .map(([key, castingSegments]) => [key, sanitizeString(castingSegments)])
  );
};

const transformInitiativePlaytestState = (
  candidate: InitiativePlaytestStateAnyVersion
): InitiativePlaytestState => {
  return {
    label: sanitizeString(candidate.label),
    partyInitiative: sanitizeString(candidate.partyInitiative),
    enemyInitiative: sanitizeString(candidate.enemyInitiative),
    nextCombatantKey: sanitizeNumber(candidate.nextCombatantKey, 1),
    party: candidate.party.map(sanitizeCombatant),
    enemies: candidate.enemies.map(sanitizeCombatant),
    pairDistances: sanitizePairDistances(candidate.pairDistances),
    attackActivationSegments: sanitizeAttackActivationSegments(
      candidate.attackActivationSegments
    ),
    attackCastingSegments: sanitizeAttackCastingSegments(
      candidate.attackCastingSegments
    ),
  };
};

const parseInitiativePlaytestState = (
  value: unknown
): InitiativePlaytestState => {
  if (!isRecord(value)) {
    throw new Error('Stored initiative state is invalid.');
  }

  const version = sanitizeNumber(value['version'], NaN);
  if (version !== 1 && version !== 2 && version !== 3) {
    throw new Error('Stored initiative state is not a supported version.');
  }

  if (!Array.isArray(value['party']) || !Array.isArray(value['enemies'])) {
    throw new Error('Stored initiative state is missing combatant rosters.');
  }

  return transformInitiativePlaytestState({
    version,
    label: sanitizeString(value['label']),
    partyInitiative: sanitizeString(value['partyInitiative']),
    enemyInitiative: sanitizeString(value['enemyInitiative']),
    nextCombatantKey: sanitizeNumber(value['nextCombatantKey'], 1),
    party: value['party'],
    enemies: value['enemies'],
    pairDistances: sanitizePairDistances(value['pairDistances']),
    attackActivationSegments: sanitizeAttackActivationSegments(
      value['attackActivationSegments']
    ),
    attackCastingSegments: sanitizeAttackCastingSegments(
      value['attackCastingSegments']
    ),
  });
};

export const encodeInitiativePlaytestState = (
  state: InitiativePlaytestState
): string => {
  const persistedState: InitiativePlaytestStateV3 = {
    version: 3,
    ...state,
  };

  return encodeURIComponent(
    deflateSync(JSON.stringify(persistedState)).toString('base64')
  );
};

export const decodeInitiativePlaytestState = (
  encodedState: string
): Promise<InitiativePlaytestState> =>
  new Promise((resolve, reject) => {
    let buffer: Buffer;

    try {
      buffer = Buffer.from(decodeURIComponent(encodedState), 'base64');
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
          parseInitiativePlaytestState(
            JSON.parse(inflated.toString()) as unknown
          )
        );
      } catch (error) {
        reject(error);
      }
    });
  });
