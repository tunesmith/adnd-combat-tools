import { deflateSync, unzip } from 'zlib';
import type { InitiativeDeclaredAction } from '../types/initiative';

export interface InitiativePlaytestCombatantState {
  key: number;
  name: string;
  declaredAction: InitiativeDeclaredAction;
  movementRate: string;
  weaponId: number;
  targetCombatantKeys: number[];
}

export interface InitiativePlaytestState {
  label: string;
  partyInitiative: string;
  enemyInitiative: string;
  nextCombatantKey: number;
  party: InitiativePlaytestCombatantState[];
  enemies: InitiativePlaytestCombatantState[];
  pairDistances: Record<string, string>;
}

interface InitiativePlaytestStateV1 {
  version: 1;
  label: string;
  partyInitiative: string;
  enemyInitiative: string;
  nextCombatantKey: number;
  party: InitiativePlaytestCombatantState[];
  enemies: InitiativePlaytestCombatantState[];
  pairDistances: Record<string, string>;
}

type InitiativePlaytestStateAnyVersion = InitiativePlaytestStateV1;

const INITIATIVE_ACTIONS: InitiativeDeclaredAction[] = [
  'open-melee',
  'close',
  'charge',
  'set-vs-charge',
  'missile',
];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isInitiativeDeclaredAction = (
  value: unknown
): value is InitiativeDeclaredAction =>
  typeof value === 'string' &&
  INITIATIVE_ACTIONS.includes(value as InitiativeDeclaredAction);

const sanitizeString = (value: unknown): string =>
  typeof value === 'string' ? value : String(value ?? '');

const sanitizeNumber = (value: unknown, fallback: number): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const sanitizeCombatant = (
  candidate: unknown
): InitiativePlaytestCombatantState => {
  if (!isRecord(candidate)) {
    throw new Error('Stored initiative combatant is invalid.');
  }

  const targetCombatantKeys = Array.isArray(candidate['targetCombatantKeys'])
    ? candidate['targetCombatantKeys']
        .map((value) => sanitizeNumber(value, NaN))
        .filter((value) => Number.isFinite(value))
    : [];

  return {
    key: sanitizeNumber(candidate['key'], 0),
    name: sanitizeString(candidate['name']),
    declaredAction: isInitiativeDeclaredAction(candidate['declaredAction'])
      ? candidate['declaredAction']
      : 'open-melee',
    movementRate: sanitizeString(candidate['movementRate'] || '12'),
    weaponId: sanitizeNumber(candidate['weaponId'], 1),
    targetCombatantKeys,
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

const transformInitiativePlaytestState = (
  candidate: InitiativePlaytestStateAnyVersion
): InitiativePlaytestState => {
  if (candidate.version !== 1) {
    throw new Error(
      `Unsupported initiative state version ${candidate.version}`
    );
  }

  return {
    label: sanitizeString(candidate.label),
    partyInitiative: sanitizeString(candidate.partyInitiative),
    enemyInitiative: sanitizeString(candidate.enemyInitiative),
    nextCombatantKey: sanitizeNumber(candidate.nextCombatantKey, 1),
    party: candidate.party.map(sanitizeCombatant),
    enemies: candidate.enemies.map(sanitizeCombatant),
    pairDistances: sanitizePairDistances(candidate.pairDistances),
  };
};

const parseInitiativePlaytestState = (
  value: unknown
): InitiativePlaytestState => {
  if (!isRecord(value)) {
    throw new Error('Stored initiative state is invalid.');
  }

  const version = sanitizeNumber(value['version'], NaN);
  if (version !== 1) {
    throw new Error('Stored initiative state is not a supported version.');
  }

  if (!Array.isArray(value['party']) || !Array.isArray(value['enemies'])) {
    throw new Error('Stored initiative state is missing combatant rosters.');
  }

  return transformInitiativePlaytestState({
    version: 1,
    label: sanitizeString(value['label']),
    partyInitiative: sanitizeString(value['partyInitiative']),
    enemyInitiative: sanitizeString(value['enemyInitiative']),
    nextCombatantKey: sanitizeNumber(value['nextCombatantKey'], 1),
    party: value['party'].map(sanitizeCombatant),
    enemies: value['enemies'].map(sanitizeCombatant),
    pairDistances: sanitizePairDistances(value['pairDistances']),
  });
};

export const encodeInitiativePlaytestState = (
  state: InitiativePlaytestState
): string => {
  const persistedState: InitiativePlaytestStateV1 = {
    version: 1,
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
