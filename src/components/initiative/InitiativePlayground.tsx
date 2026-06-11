import { createPortal } from 'react-dom';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import type { SingleValue } from 'react-select';
import Select from 'react-select';
import {
  buildInitiativeAttackGraphNodeDisplayById,
  getInitiativeAttackGraphNodeLineYs,
} from '../../helpers/initiative/attackGraphDisplay';
import { buildInitiativeAttackGraphLayout } from '../../helpers/initiative/attackGraphLayout';
import {
  ACTIVATION_SEGMENT_OPTIONS,
  SPELL_CASTING_TIME_OPTIONS,
  parseActivationSegments,
  parseCastingSegments,
} from '../../helpers/initiative/actionSegments';
import {
  compareCombatantInitiative,
  getAppliedMissileInitiativeAdjustment,
  getEffectiveInitiative,
  movementSuppressesPositiveReactionInitiativeBonuses,
} from '../../helpers/initiative/initiativeTiming';
import { getMultipleAttackThreshold } from '../../helpers/initiative/openMelee';
import {
  encodeInitiativePlaytestState,
  INITIATIVE_ACTION_LABEL_MAX_LENGTH,
  type InitiativePlaytestActionState,
  type InitiativePlaytestCombatantState,
  type InitiativePlaytestState,
} from '../../helpers/initiativeCodec';
import { resolveInitiativeDraft } from '../../helpers/initiative/resolvedRound';
import customStyles from '../../helpers/selectCustomStyles';
import { MONSTER } from '../../tables/attackerClass';
import {
  canSetAgainstCharge,
  getWeaponInfo,
  getWeaponOptions,
} from '../../tables/weapon';
import type {
  InitiativeAttackEdge,
  InitiativeAttackNode,
  InitiativeChargeFirstStrike,
  InitiativeDeclaredAction,
  DirectMeleeEngagement,
  InitiativeScenarioCombatant,
  InitiativeScenarioDraft,
  InitiativeScenarioDraftCombatant,
  InitiativeTimingOverride,
} from '../../types/initiative';
import type { WeaponOption } from '../../types/option';
import InitiativeApproachPanel from './InitiativeApproachPanel';
import styles from './initiativePlayground.module.css';

type InitiativePlaytestSide = 'party' | 'enemy';
type InitiativePlaytestStateSide = 'party' | 'enemies';

type InitiativePlaytestCombatant = InitiativePlaytestCombatantState;

interface InitiativePlaytestEditorTarget {
  side: InitiativePlaytestSide;
  combatantKey: number;
}

interface InitiativePlaytestAttackEditorTarget {
  side: InitiativePlaytestSide;
  combatantKey: number;
  selectedActionId: string;
  actions: InitiativePlaytestActionState[];
}

interface InitiativeTargetPickerTarget {
  attackingSide: InitiativePlaytestSide;
  attackerKey: number;
  targetKey: number;
}

const ALL_WEAPON_OPTIONS = getWeaponOptions(MONSTER);
const ACTION_OPTIONS: Array<{
  value: InitiativeDeclaredAction;
  label: string;
}> = [
  { value: 'none', label: 'No combat action' },
  { value: 'open-melee', label: 'Open melee' },
  { value: 'close', label: 'Move/Close' },
  { value: 'charge', label: 'Charge' },
  { value: 'set-vs-charge', label: 'Set vs charge' },
  { value: 'missile', label: 'Missile' },
  { value: 'turn-undead', label: 'Turn undead' },
  { value: 'magical-device', label: 'Magical device' },
  { value: 'spell-casting', label: 'Cast spell' },
];

const MISSILE_INITIATIVE_ADJUSTMENT_OPTIONS = [
  '-3',
  '-2',
  '-1',
  '0',
  '+1',
  '+2',
  '+3',
];

const INITIATIVE_TIMING_OPTIONS: Array<{
  value: InitiativeTimingOverride;
  label: string;
}> = [
  { value: 'normal', label: 'Normal initiative' },
  { value: 'wins-initiative', label: 'Wins initiative' },
  { value: 'loses-initiative', label: 'Loses initiative' },
];

const parseInitiative = (value: string): number => {
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : 0;
};

const parseOptionalNumber = (value: string): number | undefined => {
  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return undefined;
  }

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const parseAttackRoutineCount = (value: string): number | undefined => {
  const parsed = parseOptionalNumber(value);

  if (parsed === undefined) {
    return undefined;
  }

  return Math.max(1, Math.floor(parsed));
};

const parseMissileInitiativeAdjustment = (value: string): number => {
  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return 0;
  }

  const parsed = Number(trimmed);

  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return Math.max(-3, Math.min(3, Math.trunc(parsed)));
};

const getMissileTargetLimitForWeaponId = (weaponId: number): number => {
  const weaponInfo = getWeaponInfo(weaponId);
  const fireRate =
    weaponInfo?.weaponType === 'missile' ? weaponInfo.fireRate : undefined;

  if (fireRate === undefined || fireRate < 1) {
    return 1;
  }

  return Math.max(1, Math.floor(fireRate));
};

const isSingleTargetDeclarationAction = (
  declaredAction: InitiativeDeclaredAction
): boolean =>
  declaredAction === 'close' ||
  declaredAction === 'charge' ||
  declaredAction === 'set-vs-charge';

const requiresDistanceInput = (
  declaredAction: InitiativeDeclaredAction
): boolean => declaredAction === 'close' || declaredAction === 'charge';

const hasRequiredDistanceInput = (value: string): boolean => {
  const parsed = parseOptionalNumber(value);
  return parsed !== undefined && parsed > 0;
};

const requiresActivationSegmentsInput = (
  declaredAction: InitiativeDeclaredAction
): boolean => declaredAction === 'magical-device';

const requiresCastingSegmentsInput = (
  declaredAction: InitiativeDeclaredAction
): boolean => declaredAction === 'spell-casting';

const requiresAttackRoutineCountInput = (
  declaredAction: InitiativeDeclaredAction,
  weaponId: number
): boolean => declaredAction === 'open-melee' && isNonMissileWeaponId(weaponId);

const usesTargetSelection = (
  declaredAction: InitiativeDeclaredAction
): boolean => declaredAction !== 'none';

const getPairDistanceKey = (
  partyCombatantKey: number,
  enemyCombatantKey: number
): string => `${partyCombatantKey}:${enemyCombatantKey}`;

const getAttackDeclarationKey = (
  attackingSide: InitiativePlaytestSide,
  attackerKey: number,
  targetKey: number
): string => `${attackingSide}:${attackerKey}:${targetKey}`;

const getStoredCastingSegmentsForAttacker = (
  state: InitiativePlaytestState,
  attackingSide: InitiativePlaytestSide,
  attackerKey: number
): string | undefined => {
  const prefix = `${attackingSide}:${attackerKey}:`;
  const match = Object.entries(state.attackCastingSegments).find(
    ([declarationKey, value]) =>
      declarationKey.startsWith(prefix) && value.trim().length > 0
  );

  return match?.[1];
};

const getDefaultDeclaredActionForWeaponId = (
  weaponId: number
): InitiativeDeclaredAction =>
  getWeaponInfo(weaponId)?.weaponType === 'missile' ? 'missile' : 'open-melee';

const formatDeclaredAction = (
  declaredAction: InitiativeDeclaredAction
): string =>
  ACTION_OPTIONS.find((option) => option.value === declaredAction)?.label ||
  declaredAction;

const getActionInitiativeTiming = (
  action: Pick<InitiativePlaytestActionState, 'initiativeTiming'>
): InitiativeTimingOverride => action.initiativeTiming || 'normal';

const formatInitiativeTimingMeta = (
  initiativeTiming: InitiativeTimingOverride | undefined
): string | undefined => {
  if (!initiativeTiming || initiativeTiming === 'normal') {
    return undefined;
  }

  return initiativeTiming === 'wins-initiative'
    ? 'Wins initiative'
    : 'Loses initiative';
};

const getActionTimingHint = (
  declaredAction: InitiativeDeclaredAction
): string | undefined => {
  if (declaredAction === 'magical-device') {
    return 'Potion reminder: if packed away, finding it is usually 3-4 segments, quaffing is 1 segment, and the effect begins 2-5 segments later. Enter the total segments here.';
  }

  if (declaredAction === 'spell-casting') {
    return 'Scroll reminder: when a scroll reproduces a spell, use the spell casting time. Use Cast spell when scroll timing or interruption matters.';
  }

  return undefined;
};

const normalizeActionLabel = (value: string | undefined): string =>
  (value || '').trim().slice(0, INITIATIVE_ACTION_LABEL_MAX_LENGTH);

const formatCompactDeclaredAction = (
  declaredAction: InitiativeDeclaredAction,
  actionLabel: string | undefined
): string =>
  normalizeActionLabel(actionLabel) || formatDeclaredAction(declaredAction);

const getDeclarationDetail = (
  declaredAction: InitiativeDeclaredAction,
  distanceInches: string,
  activationSegments: string,
  castingSegments: string
): string | undefined => {
  if (
    requiresDistanceInput(declaredAction) &&
    distanceInches.trim().length > 0
  ) {
    return `${distanceInches}"`;
  }

  if (
    requiresActivationSegmentsInput(declaredAction) &&
    activationSegments.trim().length > 0
  ) {
    return `${activationSegments} ${
      activationSegments === '1' ? 'segment' : 'segments'
    }`;
  }

  if (
    requiresCastingSegmentsInput(declaredAction) &&
    castingSegments.trim().length > 0
  ) {
    if (castingSegments === '0') {
      return 'Instant';
    }

    return castingSegments === '10'
      ? '10+ segments'
      : `${castingSegments} ${
          castingSegments === '1' ? 'segment' : 'segments'
        }`;
  }

  return undefined;
};

const formatCompactDeclarationMeta = (
  declaredAction: InitiativeDeclaredAction,
  actionLabel: string | undefined,
  distanceInches: string,
  activationSegments: string,
  castingSegments: string
): string => {
  const displayAction = formatCompactDeclaredAction(
    declaredAction,
    actionLabel
  );
  const declarationDetail = getDeclarationDetail(
    declaredAction,
    distanceInches,
    activationSegments,
    castingSegments
  );

  return declarationDetail
    ? `${displayAction} · ${declarationDetail}`
    : displayAction;
};

const formatActionTypeMeta = (
  declaredAction: InitiativeDeclaredAction,
  distanceInches: string,
  activationSegments: string,
  castingSegments: string
): string => {
  const actionType = formatDeclaredAction(declaredAction);
  const declarationDetail = getDeclarationDetail(
    declaredAction,
    distanceInches,
    activationSegments,
    castingSegments
  );

  return declarationDetail
    ? `${actionType} · ${declarationDetail}`
    : actionType;
};

const getAvailableActionOptions = (
  weaponId: number
): Array<{
  value: InitiativeDeclaredAction;
  label: string;
}> =>
  ACTION_OPTIONS.filter(
    (option) =>
      option.value !== 'set-vs-charge' || canSetAgainstCharge(weaponId)
  );

const normalizeDeclaredActionForWeapon = (
  declaredAction: InitiativeDeclaredAction,
  weaponId: number
): InitiativeDeclaredAction =>
  declaredAction === 'set-vs-charge' && !canSetAgainstCharge(weaponId)
    ? getDefaultDeclaredActionForWeaponId(weaponId)
    : declaredAction;

const MAIN_ACTION_ID = 'main';

const normalizeActionStateForCombatant = (
  action: InitiativePlaytestActionState,
  weaponId: number
): InitiativePlaytestActionState => {
  const declaredAction = normalizeDeclaredActionForWeapon(
    action.declaredAction,
    weaponId
  );
  let targetCombatantKeys = !usesTargetSelection(declaredAction)
    ? []
    : action.targetCombatantKeys;

  if (
    isSingleTargetDeclarationAction(declaredAction) &&
    targetCombatantKeys.length > 1
  ) {
    targetCombatantKeys = targetCombatantKeys.slice(0, 1);
  }

  if (declaredAction === 'missile' && targetCombatantKeys.length > 0) {
    targetCombatantKeys = targetCombatantKeys.slice(
      0,
      getMissileTargetLimitForWeaponId(weaponId)
    );
  }

  const actionLabel = normalizeActionLabel(action.actionLabel) || undefined;
  const initiativeTiming = getActionInitiativeTiming(action);

  return {
    id: action.id || MAIN_ACTION_ID,
    declaredAction,
    ...(actionLabel ? { actionLabel } : {}),
    ...(initiativeTiming !== 'normal' ? { initiativeTiming } : {}),
    actionDistanceInches: requiresDistanceInput(declaredAction)
      ? action.actionDistanceInches
      : '',
    activationSegments: requiresActivationSegmentsInput(declaredAction)
      ? action.activationSegments
      : '',
    castingSegments: requiresCastingSegmentsInput(declaredAction)
      ? action.castingSegments
      : '',
    attackRoutineCount: requiresAttackRoutineCountInput(
      declaredAction,
      weaponId
    )
      ? action.attackRoutineCount
      : action.attackRoutineCount || '1',
    targetCombatantKeys,
  };
};

const getCombatantActions = (
  combatant: InitiativePlaytestCombatant
): InitiativePlaytestActionState[] => {
  const normalizedActions = combatant.actions.map((action, index) =>
    normalizeActionStateForCombatant(
      {
        ...action,
        id: action.id || (index === 0 ? MAIN_ACTION_ID : `action-${index + 1}`),
      },
      combatant.weaponId
    )
  );

  return normalizedActions.length > 0
    ? normalizedActions
    : [
        normalizeActionStateForCombatant(
          {
            id: MAIN_ACTION_ID,
            declaredAction: getDefaultDeclaredActionForWeaponId(
              combatant.weaponId
            ),
            actionDistanceInches: '',
            activationSegments: '',
            castingSegments: '',
            attackRoutineCount: '1',
            targetCombatantKeys: [],
          },
          combatant.weaponId
        ),
      ];
};

const getPrimaryCombatantAction = (
  combatant: InitiativePlaytestCombatant
): InitiativePlaytestActionState => {
  const primaryAction = getCombatantActions(combatant)[0];

  if (!primaryAction) {
    throw new Error(`Missing primary action for combatant ${combatant.key}`);
  }

  return primaryAction;
};

const syncCombatantActions = (
  combatant: InitiativePlaytestCombatant,
  actions: InitiativePlaytestActionState[]
): InitiativePlaytestCombatant => {
  const normalizedActions =
    actions.length > 0
      ? actions.map((action, index) =>
          normalizeActionStateForCombatant(
            {
              ...action,
              id:
                action.id ||
                (index === 0 ? MAIN_ACTION_ID : `action-${index + 1}`),
            },
            combatant.weaponId
          )
        )
      : getCombatantActions(combatant);

  return {
    ...combatant,
    actions: normalizedActions,
  };
};

const getNextActionIdForActions = (
  actions: InitiativePlaytestActionState[]
): string => {
  const usedActionIds = new Set(actions.map((action) => action.id));
  let nextIndex = 2;

  while (usedActionIds.has(`action-${nextIndex}`)) {
    nextIndex += 1;
  }

  return `action-${nextIndex}`;
};

const updateActionInList = (
  actions: InitiativePlaytestActionState[],
  actionId: string,
  updateAction: (
    action: InitiativePlaytestActionState
  ) => InitiativePlaytestActionState
): InitiativePlaytestActionState[] =>
  actions.map((action) =>
    action.id === actionId ? updateAction(action) : action
  );

const toggleActionTargetKey = (
  action: InitiativePlaytestActionState,
  targetKey: number,
  weaponId: number
): InitiativePlaytestActionState => {
  if (!usesTargetSelection(action.declaredAction)) {
    return action;
  }

  const isSelected = action.targetCombatantKeys.includes(targetKey);

  if (isSelected) {
    return {
      ...action,
      targetCombatantKeys: action.targetCombatantKeys.filter(
        (existingTargetKey) => existingTargetKey !== targetKey
      ),
    };
  }

  if (isSingleTargetDeclarationAction(action.declaredAction)) {
    return {
      ...action,
      targetCombatantKeys: [targetKey],
    };
  }

  const nextTargetCombatantKeys = action.targetCombatantKeys.concat(targetKey);

  return {
    ...action,
    targetCombatantKeys:
      action.declaredAction === 'missile'
        ? nextTargetCombatantKeys.slice(
            -getMissileTargetLimitForWeaponId(weaponId)
          )
        : nextTargetCombatantKeys,
  };
};

const createCombatant = (
  key: number,
  name: string,
  weaponId: number,
  targetCombatantKeys: number[] = [],
  declaredAction: InitiativeDeclaredAction = getDefaultDeclaredActionForWeaponId(
    weaponId
  ),
  movementRate = '12',
  attackRoutineCount = '1',
  missileInitiativeAdjustment = '0',
  actionDistanceInches = '',
  activationSegments = '',
  castingSegments = ''
): InitiativePlaytestCombatant => ({
  key,
  name,
  movementRate,
  missileInitiativeAdjustment,
  weaponId,
  actions: [
    {
      id: MAIN_ACTION_ID,
      declaredAction,
      actionDistanceInches,
      activationSegments,
      castingSegments,
      attackRoutineCount,
      targetCombatantKeys,
    },
  ],
});

const createMixedPreset = (): InitiativePlaytestState => ({
  label: 'Tied Initiative Melee',
  partyInitiative: '4',
  enemyInitiative: '4',
  nextCombatantKey: 5,
  party: [
    createCombatant(1, 'Aldred', 17, [3]),
    createCombatant(2, 'Bera', 13, [4]),
  ],
  enemies: [
    createCombatant(3, 'Gnoll', 2, [1]),
    createCombatant(4, 'Ghoul', 1, [2]),
  ],
  pairDistances: {},
  attackActivationSegments: {},
  attackCastingSegments: {},
});

const createChargeInteractionsPreset = (): InitiativePlaytestState => ({
  label: 'Charge Interactions',
  partyInitiative: '3',
  enemyInitiative: '5',
  nextCombatantKey: 11,
  party: [
    createCombatant(1, 'Garran', 59, [6], 'charge', '12'),
    createCombatant(2, 'Mave', 56, [7], 'charge', '12'),
    createCombatant(3, 'Doran', 50, [8], 'set-vs-charge', '12'),
    createCombatant(4, 'Bowman', 11, [9], 'missile', '12'),
    createCombatant(5, 'Quick Bowman', 11, [10], 'missile', '12', '1', '+3'),
  ],
  enemies: [
    createCombatant(6, 'Shortsword Guard', 57, [1], 'open-melee', '9'),
    createCombatant(7, 'Trident Guard', 59, [2], 'open-melee', '9'),
    createCombatant(8, 'Raider', 56, [3], 'charge', '12'),
    createCombatant(9, 'Raider', 56, [4], 'charge', '12'),
    createCombatant(10, 'Raider Captain', 56, [5], 'charge', '12'),
  ],
  pairDistances: {
    [getPairDistanceKey(1, 6)]: '4',
    [getPairDistanceKey(2, 7)]: '4',
    [getPairDistanceKey(3, 8)]: '4',
    [getPairDistanceKey(4, 9)]: '4',
    [getPairDistanceKey(5, 10)]: '4',
  },
  attackActivationSegments: {},
  attackCastingSegments: {},
});

const createTurnAndDevicePreset = (): InitiativePlaytestState => ({
  label: 'Turn and Device',
  partyInitiative: '3',
  enemyInitiative: '5',
  nextCombatantKey: 5,
  party: [
    createCombatant(1, 'Sister Arda', 17, [3], 'turn-undead', '12'),
    createCombatant(2, 'Rodric', 17, [4], 'magical-device', '12'),
  ],
  enemies: [
    createCombatant(3, 'Skeleton', 1, [1], 'open-melee', '12'),
    createCombatant(4, 'Skeleton 2', 1, [2], 'open-melee', '12'),
  ],
  pairDistances: {},
  attackActivationSegments: {
    [getAttackDeclarationKey('party', 2, 4)]: '3',
  },
  attackCastingSegments: {},
});

const createSpellCastingPreset = (): InitiativePlaytestState => ({
  label: 'Spell Casting',
  partyInitiative: '4',
  enemyInitiative: '4',
  nextCombatantKey: 8,
  party: [
    createCombatant(
      1,
      'Mereth - Prayer',
      17,
      [],
      'spell-casting',
      '12',
      '1',
      '0',
      '',
      '',
      '3'
    ),
    createCombatant(
      2,
      'Selise - Hold Person',
      17,
      [5],
      'spell-casting',
      '12',
      '1',
      '0',
      '',
      '',
      '5'
    ),
    createCombatant(
      3,
      'Talan - Sleep',
      17,
      [6, 7],
      'spell-casting',
      '12',
      '1',
      '0',
      '',
      '',
      '1'
    ),
  ],
  enemies: [
    createCombatant(
      5,
      'Hexer - Cause Fear',
      17,
      [2],
      'spell-casting',
      '12',
      '1',
      '0',
      '',
      '',
      '4'
    ),
    createCombatant(6, 'Guard A', 17, [], 'none'),
    createCombatant(7, 'Guard B', 17, [], 'none'),
  ],
  pairDistances: {},
  attackActivationSegments: {},
  attackCastingSegments: {},
});

const createDfCastingAtMeleePreset = (): InitiativePlaytestState => ({
  label: 'Casting at Melee',
  partyInitiative: '2',
  enemyInitiative: '1',
  nextCombatantKey: 5,
  party: [createCombatant(1, 'Fighter A', 58, [3], 'open-melee')],
  enemies: [
    createCombatant(3, 'Fighter B', 17, [1], 'open-melee'),
    createCombatant(4, 'Magic-User', 1, [1], 'spell-casting'),
  ],
  pairDistances: {
    [getPairDistanceKey(1, 3)]: '',
    [getPairDistanceKey(1, 4)]: '',
  },
  attackActivationSegments: {},
  attackCastingSegments: {
    [getAttackDeclarationKey('enemy', 4, 1)]: '3',
  },
});

const createDfFightersAndClericPreset = (): InitiativePlaytestState => ({
  label: 'Fighters and Cleric',
  partyInitiative: '5',
  enemyInitiative: '5',
  nextCombatantKey: 5,
  party: [createCombatant(1, 'Fighter A', 54, [4], 'open-melee')],
  enemies: [
    createCombatant(3, 'Fighter B', 2, [1], 'open-melee'),
    createCombatant(
      4,
      'Cleric',
      1,
      [1],
      'spell-casting',
      '12',
      '1',
      '0',
      '',
      '',
      '5'
    ),
  ],
  pairDistances: {
    [getPairDistanceKey(1, 3)]: '',
    [getPairDistanceKey(1, 4)]: '',
  },
  attackActivationSegments: {},
  attackCastingSegments: {},
});

const createDfPrincePreset = (): InitiativePlaytestState => ({
  label: 'The Prince',
  partyInitiative: '6',
  enemyInitiative: '4',
  nextCombatantKey: 16,
  party: [
    createCombatant(1, 'Fighter A', 11, [3], 'missile'),
    createCombatant(5, 'Prince', 23, [], 'none'),
  ],
  enemies: [createCombatant(3, 'Magic-User B', 11, [5], 'spell-casting')],
  pairDistances: {
    [getPairDistanceKey(5, 3)]: '',
  },
  attackActivationSegments: {},
  attackCastingSegments: {
    [getAttackDeclarationKey('enemy', 3, 5)]: '3',
  },
});

const createDfSpellsAndMeleePreset = (): InitiativePlaytestState => ({
  label: 'Enemy (A) vs Player (B)',
  partyInitiative: '6',
  enemyInitiative: '2',
  nextCombatantKey: 16,
  party: [
    createCombatant(1, 'B1', 58, [3], 'open-melee'),
    createCombatant(5, 'B2 - Hold Person', 17, [4], 'spell-casting'),
    createCombatant(6, 'B3', 17, [7], 'open-melee'),
    createCombatant(8, 'B4', 17, [9], 'open-melee'),
    createCombatant(10, 'B5 - Magic Missile', 17, [11], 'spell-casting'),
    createCombatant(13, 'B6 - Levitate', 17, [12], 'spell-casting'),
    createCombatant(15, 'B7', 17, [14], 'open-melee'),
  ],
  enemies: [
    createCombatant(3, 'A1 - Cause Fear', 17, [1], 'spell-casting'),
    createCombatant(4, 'A2', 1, [5], 'open-melee'),
    createCombatant(7, 'A3', 1, [6], 'open-melee'),
    createCombatant(9, 'A4', 1, [8], 'open-melee'),
    createCombatant(11, 'A5 - Shield', 1, [10], 'spell-casting'),
    createCombatant(12, 'A6 (two attacks)', 1, [13], 'open-melee', '12', '2'),
    createCombatant(14, 'A7 - Heat Metal', 1, [15], 'spell-casting'),
  ],
  pairDistances: {
    [getPairDistanceKey(1, 3)]: '',
    [getPairDistanceKey(5, 4)]: '',
    [getPairDistanceKey(6, 7)]: '',
    [getPairDistanceKey(8, 9)]: '',
    [getPairDistanceKey(10, 11)]: '',
    [getPairDistanceKey(13, 12)]: '',
    [getPairDistanceKey(15, 14)]: '',
  },
  attackActivationSegments: {},
  attackCastingSegments: {
    [getAttackDeclarationKey('enemy', 3, 1)]: '4',
    [getAttackDeclarationKey('party', 5, 4)]: '5',
    [getAttackDeclarationKey('enemy', 11, 10)]: '1',
    [getAttackDeclarationKey('party', 10, 11)]: '1',
    [getAttackDeclarationKey('party', 13, 12)]: '2',
    [getAttackDeclarationKey('enemy', 14, 15)]: '4',
  },
});

const createLargeBattlePreset = (): InitiativePlaytestState => ({
  label: 'Large Mixed Battle',
  partyInitiative: '4',
  enemyInitiative: '4',
  nextCombatantKey: 11,
  party: [
    createCombatant(1, 'Aldred', 56, [6], 'open-melee', '12'),
    createCombatant(2, 'Doran', 50, [7], 'set-vs-charge', '12'),
    createCombatant(3, 'Ysra - Rod', 49, [9], 'magical-device', '12'),
    createCombatant(4, 'Mave', 55, [8], 'close', '9'),
    createCombatant(5, 'Garran', 56, [10], 'charge', '12'),
  ],
  enemies: [
    createCombatant(6, 'Gnoll Captain', 2, [1], 'open-melee', '12'),
    createCombatant(7, 'Raider', 56, [2], 'charge', '12'),
    createCombatant(8, 'Orc Skirmisher', 41, [4], 'close', '9'),
    createCombatant(9, 'Goblin Archer', 16, [3], 'missile', '6'),
    createCombatant(10, 'Hobgoblin Guard', 59, [5], 'open-melee', '9'),
  ],
  pairDistances: {
    [getPairDistanceKey(2, 7)]: '4',
    [getPairDistanceKey(4, 8)]: '6',
    [getPairDistanceKey(5, 10)]: '4',
  },
  attackActivationSegments: {
    [getAttackDeclarationKey('party', 3, 9)]: '5',
  },
  attackCastingSegments: {},
});

const buildDraftCombatants = (
  side: InitiativePlaytestSide,
  combatants: InitiativePlaytestCombatant[],
  pairDistances: Record<string, string>,
  attackActivationSegments: Record<string, string>,
  attackCastingSegments: Record<string, string>
): InitiativeScenarioDraftCombatant[] =>
  combatants.map((combatant) => {
    const actions = getCombatantActions(combatant);
    const primaryAction = getPrimaryCombatantAction(combatant);
    const getActionDistanceInches = (
      action: InitiativePlaytestActionState
    ): number | undefined =>
      parseOptionalNumber(action.actionDistanceInches) ??
      (() => {
        if (action.targetCombatantKeys.length !== 1) {
          return undefined;
        }

        const targetCombatantKey = action.targetCombatantKeys[0];
        if (targetCombatantKey === undefined) {
          return undefined;
        }

        return parseOptionalNumber(
          pairDistances[
            side === 'party'
              ? getPairDistanceKey(combatant.key, targetCombatantKey)
              : getPairDistanceKey(targetCombatantKey, combatant.key)
          ] || ''
        );
      })();
    const getActionActivationSegments = (
      action: InitiativePlaytestActionState
    ): number | undefined =>
      parseActivationSegments(action.activationSegments) ??
      (() => {
        if (action.targetCombatantKeys.length !== 1) {
          return undefined;
        }

        const targetCombatantKey = action.targetCombatantKeys[0];
        if (targetCombatantKey === undefined) {
          return undefined;
        }

        return parseActivationSegments(
          attackActivationSegments[
            getAttackDeclarationKey(side, combatant.key, targetCombatantKey)
          ] || ''
        );
      })();
    const getActionCastingSegments = (
      action: InitiativePlaytestActionState
    ): number | undefined =>
      parseCastingSegments(action.castingSegments) ??
      (() => {
        const prefix = `${side}:${combatant.key}:`;
        const storedCastingSegments = Object.entries(
          attackCastingSegments
        ).find(
          ([declarationKey, value]) =>
            declarationKey.startsWith(prefix) && value.trim().length > 0
        )?.[1];
        return parseCastingSegments(storedCastingSegments || '');
      })();

    return {
      combatantKey: combatant.key,
      name: combatant.name.trim() || undefined,
      declaredAction: primaryAction.declaredAction,
      actionLabel: normalizeActionLabel(primaryAction.actionLabel) || undefined,
      initiativeTiming: primaryAction.initiativeTiming,
      movementRate: parseOptionalNumber(combatant.movementRate),
      actionDistanceInches: getActionDistanceInches(primaryAction),
      activationSegments: getActionActivationSegments(primaryAction),
      castingSegments: getActionCastingSegments(primaryAction),
      missileInitiativeAdjustment: parseMissileInitiativeAdjustment(
        combatant.missileInitiativeAdjustment
      ),
      attackRoutineCount: parseAttackRoutineCount(
        primaryAction.attackRoutineCount
      ),
      weaponId: combatant.weaponId,
      targetCombatantKeys: primaryAction.targetCombatantKeys,
      actions: actions.map((action) => ({
        id: action.id,
        declaredAction: action.declaredAction,
        actionLabel: normalizeActionLabel(action.actionLabel) || undefined,
        initiativeTiming: action.initiativeTiming,
        actionDistanceInches: getActionDistanceInches(action),
        activationSegments: getActionActivationSegments(action),
        castingSegments: getActionCastingSegments(action),
        attackRoutineCount: parseAttackRoutineCount(action.attackRoutineCount),
        targetCombatantKeys: action.targetCombatantKeys,
      })),
    };
  });

const buildDraftFromState = (
  state: InitiativePlaytestState
): InitiativeScenarioDraft => ({
  label: state.label.trim() || 'Initiative Playtest',
  partyInitiative: parseInitiative(state.partyInitiative),
  enemyInitiative: parseInitiative(state.enemyInitiative),
  party: buildDraftCombatants(
    'party',
    state.party,
    state.pairDistances,
    state.attackActivationSegments,
    state.attackCastingSegments
  ),
  enemies: buildDraftCombatants(
    'enemy',
    state.enemies,
    state.pairDistances,
    state.attackActivationSegments,
    state.attackCastingSegments
  ),
});

const getDefaultWeaponIdForSide = (side: InitiativePlaytestSide): number =>
  side === 'party' ? 17 : 1;

const getStateSide = (
  side: InitiativePlaytestSide
): InitiativePlaytestStateSide => (side === 'party' ? 'party' : 'enemies');

const getNextCombatantName = (
  side: InitiativePlaytestSide,
  count: number
): string => `${side === 'party' ? 'Party' : 'Enemy'} ${count + 1}`;

const getCombatantDisplayName = (
  side: InitiativePlaytestSide,
  combatant: InitiativePlaytestCombatant,
  index: number
): string => combatant.name.trim() || getNextCombatantName(side, index);

const getWeaponSummary = (weaponId: number): string => {
  const weaponInfo = getWeaponInfo(weaponId);

  if (weaponInfo?.weaponType === 'melee') {
    return `WSF ${weaponInfo.speedFactor}`;
  }

  if (weaponInfo?.weaponType === 'missile') {
    return `FR ${weaponInfo.fireRate}`;
  }

  return weaponInfo?.weaponType || 'natural';
};

const getCombatantMeta = (combatant: InitiativePlaytestCombatant): string => {
  const primaryAction = getPrimaryCombatantAction(combatant);
  const movementRate = parseOptionalNumber(combatant.movementRate) ?? 12;
  const missileInitiativeAdjustment = parseMissileInitiativeAdjustment(
    combatant.missileInitiativeAdjustment
  );
  const appliedMissileInitiativeAdjustment =
    primaryAction.declaredAction === 'missile'
      ? getAppliedMissileInitiativeAdjustment({
          declaredAction: primaryAction.declaredAction,
          movementRate,
          missileInitiativeAdjustment,
        })
      : 0;
  const missileInitiativeMeta =
    getWeaponInfo(combatant.weaponId)?.weaponType === 'missile' &&
    missileInitiativeAdjustment !== 0
      ? `MI ${
          missileInitiativeAdjustment > 0 ? '+' : ''
        }${missileInitiativeAdjustment}${
          appliedMissileInitiativeAdjustment !== missileInitiativeAdjustment
            ? ' suppressed'
            : ''
        }`
      : undefined;
  return [
    `MV ${combatant.movementRate.trim() || '12'}"`,
    getWeaponSummary(combatant.weaponId),
    missileInitiativeMeta,
  ]
    .filter(Boolean)
    .join(' · ');
};

const getActionHint = (
  action: InitiativePlaytestActionState
): string | undefined => {
  const normalizedActionLabel = normalizeActionLabel(action.actionLabel);
  const actionTypeMeta = formatActionTypeMeta(
    action.declaredAction,
    action.actionDistanceInches,
    action.activationSegments,
    action.castingSegments
  );

  if (normalizedActionLabel) {
    return actionTypeMeta;
  }

  const actionMeta = formatCompactDeclarationMeta(
    action.declaredAction,
    action.actionLabel,
    action.actionDistanceInches,
    action.activationSegments,
    action.castingSegments
  );
  const actionLabel = formatDeclaredAction(action.declaredAction);

  if (actionMeta === actionLabel) {
    return undefined;
  }

  const metaPrefix = `${actionLabel} · `;
  return actionMeta.startsWith(metaPrefix)
    ? actionMeta.slice(metaPrefix.length)
    : actionMeta;
};

const getActionTargetSummary = (
  action: InitiativePlaytestActionState
): string | undefined => {
  if (!usesTargetSelection(action.declaredAction)) {
    return undefined;
  }

  const targetCount = action.targetCombatantKeys.length;

  if (targetCount === 0) {
    return action.declaredAction === 'magical-device'
      ? 'No target/self'
      : 'No target';
  }

  return `${targetCount} ${targetCount === 1 ? 'target' : 'targets'}`;
};

interface MatrixHeaderActionSummary {
  id: string;
  title: string;
  meta: string | undefined;
}

const getMatrixHeaderActionSummaries = (
  combatant: InitiativePlaytestCombatant
): MatrixHeaderActionSummary[] =>
  getCombatantActions(combatant).map((action, actionIndex) => {
    const meta = [
      formatInitiativeTimingMeta(action.initiativeTiming),
      getActionHint(action),
      getActionTargetSummary(action),
    ]
      .filter((value): value is string => Boolean(value))
      .join(' · ');

    return {
      id: `${action.id}-${actionIndex}`,
      title: formatCompactDeclaredAction(
        action.declaredAction,
        action.actionLabel
      ),
      meta: meta || undefined,
    };
  });

const getActionsTargetingKey = (
  combatant: InitiativePlaytestCombatant,
  targetKey: number
): InitiativePlaytestActionState[] =>
  getCombatantActions(combatant).filter((action) =>
    action.targetCombatantKeys.includes(targetKey)
  );

const canCombatantTarget = (combatant: InitiativePlaytestCombatant): boolean =>
  getCombatantActions(combatant).some((action) =>
    usesTargetSelection(action.declaredAction)
  );

const formatActionTargetLabel = (
  action: InitiativePlaytestActionState,
  pairDistance: string
): string => {
  const timingMeta = formatInitiativeTimingMeta(action.initiativeTiming);
  const declarationMeta = formatCompactDeclarationMeta(
    action.declaredAction,
    action.actionLabel,
    action.actionDistanceInches || pairDistance,
    action.activationSegments,
    action.castingSegments
  );

  return [declarationMeta, timingMeta]
    .filter((value): value is string => Boolean(value))
    .join(' · ');
};

const formatMatrixTargetLabels = (
  actions: InitiativePlaytestActionState[],
  pairDistance: string
): string[] =>
  actions.map((action) => formatActionTargetLabel(action, pairDistance));

const isNonMissileWeaponId = (weaponId: number): boolean =>
  getWeaponInfo(weaponId)?.weaponType !== 'missile';

const getEffectiveInitiativeValue = (
  combatant: InitiativeScenarioCombatant
): number => getEffectiveInitiative(combatant);

const formatScenarioCombatantActionLabel = (
  combatant: InitiativeScenarioCombatant
): string =>
  combatant.actionLabel
    ? `${combatant.actionLabel} (${formatDeclaredAction(
        combatant.declaredAction
      )})`
    : formatDeclaredAction(combatant.declaredAction);

const getInitiativeTimingExplanation = (
  earlierCombatant: InitiativeScenarioCombatant,
  laterCombatant: InitiativeScenarioCombatant
): string | undefined => {
  const earlierTiming = formatInitiativeTimingMeta(
    earlierCombatant.initiativeTiming
  );
  const laterTiming = formatInitiativeTimingMeta(
    laterCombatant.initiativeTiming
  );

  if (earlierTiming && laterTiming) {
    return `${earlierCombatant.name}'s ${formatScenarioCombatantActionLabel(
      earlierCombatant
    )} is marked ${earlierTiming.toLowerCase()}, while ${
      laterCombatant.name
    }'s ${formatScenarioCombatantActionLabel(
      laterCombatant
    )} is marked ${laterTiming.toLowerCase()}.`;
  }

  if (earlierTiming) {
    return `${earlierCombatant.name}'s ${formatScenarioCombatantActionLabel(
      earlierCombatant
    )} is marked ${earlierTiming.toLowerCase()}.`;
  }

  if (laterTiming) {
    return `${laterCombatant.name}'s ${formatScenarioCombatantActionLabel(
      laterCombatant
    )} is marked ${laterTiming.toLowerCase()}.`;
  }

  return undefined;
};

const GRAPH_POPOVER_WIDTH = 320;
const GRAPH_POPOVER_GAP = 14;
const GRAPH_POPOVER_MARGIN = 10;
const GRAPH_POPOVER_FALLBACK_HEIGHT = 320;
const GRAPH_POPOVER_MAX_HEIGHT = 448;
const GRAPH_POPOVER_VIEWPORT_INSET = 28;

const getDirectMeleeEngagementKey = (
  leftCombatantId: string,
  rightCombatantId: string
) => `${leftCombatantId}|${rightCombatantId}`;

const getDirectMeleeFasterAndSlower = (
  left: InitiativeScenarioCombatant,
  right: InitiativeScenarioCombatant
) => {
  if (
    left.weaponSpeedFactor !== undefined &&
    right.weaponSpeedFactor !== undefined &&
    left.weaponSpeedFactor <= right.weaponSpeedFactor
  ) {
    return {
      faster: left,
      slower: right,
      difference: right.weaponSpeedFactor - left.weaponSpeedFactor,
    };
  }

  return {
    faster: right,
    slower: left,
    difference: (left.weaponSpeedFactor || 0) - (right.weaponSpeedFactor || 0),
  };
};

const findDirectMeleeStepIndex = (
  engagement: DirectMeleeEngagement,
  node: InitiativeAttackNode
) =>
  engagement.resolution.steps.findIndex((step) =>
    step.attacks.some(
      (attack) =>
        attack.combatantId === node.combatantId &&
        attack.attackNumber === node.attackNumber
    )
  );

const getDirectMeleeWhyHereText = ({
  node,
  combatant,
  opponent,
  engagement,
}: {
  node: InitiativeAttackNode;
  combatant: InitiativeScenarioCombatant;
  opponent: InitiativeScenarioCombatant;
  engagement: DirectMeleeEngagement;
}): string => {
  const tieInitiative = combatant.initiative;
  const { faster, slower } = getDirectMeleeFasterAndSlower(
    combatant.side === 'party' ? combatant : opponent,
    combatant.side === 'party' ? opponent : combatant
  );

  switch (engagement.resolution.reason) {
    case 'initiative': {
      const winner =
        combatant.initiative > opponent.initiative ? combatant : opponent;
      const loser = winner.id === combatant.id ? opponent : combatant;

      return `${combatant.name} and ${opponent.name} are in direct melee. ${
        winner.name
      } wins initiative ${winner.initiative} to ${loser.initiative}, so ${
        winner.id === combatant.id
          ? 'this blow comes first'
          : `${combatant.name}'s blow comes after ${winner.name}'s`
      }.`;
    }

    case 'simultaneous': {
      if (
        combatant.weaponType === 'melee' &&
        opponent.weaponType === 'melee' &&
        combatant.weaponSpeedFactor === opponent.weaponSpeedFactor &&
        combatant.weaponSpeedFactor !== undefined
      ) {
        return `${combatant.name} and ${opponent.name} are in direct melee with initiative tied at ${tieInitiative}. Their weapons are equally fast at weapon speed factor ${combatant.weaponSpeedFactor}, so these blows land simultaneously.`;
      }

      if (
        combatant.weaponType === 'natural' ||
        opponent.weaponType === 'natural'
      ) {
        const naturalWeaponCombatant =
          combatant.weaponType === 'natural' ? combatant : opponent;

        return `${combatant.name} and ${opponent.name} are in direct melee with initiative tied at ${tieInitiative}. ${naturalWeaponCombatant.name} is attacking with natural weapons, so weapon speed does not break the tie and these blows land simultaneously.`;
      }

      return `${combatant.name} and ${opponent.name} are in direct melee with initiative tied at ${tieInitiative}. At least one combatant is not using a melee weapon with a speed factor, so neither blow gains priority and they land simultaneously.`;
    }

    case 'multiple-routines': {
      return `${combatant.name} and ${
        opponent.name
      } are in direct melee, and multiple routines are in play. This blow is placed by the DMG first/middle/last routine order${
        combatant.attackRoutine.components.length > 1
          ? `. This is ${combatant.name}'s attack ${node.attackNumber} in that sequence.`
          : '.'
      }`;
    }

    case 'weapon-speed': {
      if (
        faster.weaponSpeedFactor === undefined ||
        slower.weaponSpeedFactor === undefined
      ) {
        return `${combatant.name} and ${opponent.name} are in direct melee with initiative tied at ${tieInitiative}. Weapon speed breaks the tie here.`;
      }

      if (combatant.id === faster.id) {
        return `${combatant.name} and ${opponent.name} are in direct melee with initiative tied at ${tieInitiative}. ${combatant.name}'s ${combatant.weaponName} is faster (${combatant.weaponSpeedFactor} vs ${opponent.weaponSpeedFactor}), so this blow comes first.`;
      }

      return `${combatant.name} and ${opponent.name} are in direct melee with initiative tied at ${tieInitiative}. ${faster.name}'s ${faster.weaponName} is faster (${faster.weaponSpeedFactor} vs ${slower.weaponSpeedFactor}), so ${combatant.name}'s blow comes after ${faster.name}'s.`;
    }

    case 'weapon-speed-double': {
      if (
        faster.weaponSpeedFactor === undefined ||
        slower.weaponSpeedFactor === undefined
      ) {
        return `${combatant.name} and ${opponent.name} are in direct melee with initiative tied at ${tieInitiative}. The faster weapon earns an extra blow here.`;
      }

      if (combatant.id === faster.id && node.attackNumber === 2) {
        return `${combatant.name} and ${
          opponent.name
        } are in direct melee with initiative tied at ${tieInitiative}. ${
          combatant.name
        }'s ${combatant.weaponName} is more than twice as fast as ${
          opponent.name
        }'s ${opponent.weaponName} (${combatant.weaponSpeedFactor} vs ${
          opponent.weaponSpeedFactor
        }; threshold ${getMultipleAttackThreshold(
          faster.weaponSpeedFactor
        )}), so ${combatant.name} gets this extra second blow before ${
          opponent.name
        } can strike.`;
      }

      if (combatant.id === faster.id) {
        return `${combatant.name} and ${opponent.name} are in direct melee with initiative tied at ${tieInitiative}. ${combatant.name}'s ${combatant.weaponName} is more than twice as fast as ${opponent.name}'s ${opponent.weaponName} (${combatant.weaponSpeedFactor} vs ${opponent.weaponSpeedFactor}), so ${combatant.name} gets two blows before ${opponent.name}'s first.`;
      }

      return `${combatant.name} and ${opponent.name} are in direct melee with initiative tied at ${tieInitiative}. ${faster.name}'s ${faster.weaponName} is more than twice as fast as ${slower.name}'s ${slower.weaponName} (${faster.weaponSpeedFactor} vs ${slower.weaponSpeedFactor}), so ${combatant.name}'s first blow waits until after ${faster.name}'s two attacks.`;
    }

    case 'weapon-speed-triple': {
      if (
        faster.weaponSpeedFactor === undefined ||
        slower.weaponSpeedFactor === undefined
      ) {
        return `${combatant.name} and ${opponent.name} are in direct melee with initiative tied at ${tieInitiative}. The faster weapon gets an extra third blow here.`;
      }

      const stepIndex = findDirectMeleeStepIndex(engagement, node);

      if (combatant.id === faster.id && node.attackNumber < 3) {
        return `${combatant.name} and ${opponent.name} are in direct melee with initiative tied at ${tieInitiative}. ${combatant.name}'s ${combatant.weaponName} is at least 10 factors faster than ${opponent.name}'s ${opponent.weaponName} (${combatant.weaponSpeedFactor} vs ${opponent.weaponSpeedFactor}), so ${combatant.name} gets extra early blows before ${opponent.name} can strike.`;
      }

      if (stepIndex >= 0) {
        return `${combatant.name} and ${opponent.name} are in direct melee with initiative tied at ${tieInitiative}. The weapon speed difference is 10 or more (${faster.weaponSpeedFactor} vs ${slower.weaponSpeedFactor}), so ${faster.name}'s third blow and ${slower.name}'s first blow are simultaneous.`;
      }

      return `${combatant.name} and ${opponent.name} are in direct melee with initiative tied at ${tieInitiative}. The large weapon speed difference creates an extra third blow in this exchange.`;
    }
  }
};

const getDirectMeleeEdgeExplanation = ({
  engagement,
  fromNode,
  toNode,
  fromCombatant,
  toCombatant,
  fromName,
  toName,
}: {
  engagement: DirectMeleeEngagement;
  fromNode?: InitiativeAttackNode;
  toNode?: InitiativeAttackNode;
  fromCombatant?: InitiativeScenarioCombatant;
  toCombatant?: InitiativeScenarioCombatant;
  fromName: string;
  toName: string;
}): string => {
  if (!fromCombatant || !toCombatant || !fromNode || !toNode) {
    return `${fromName} and ${toName} are part of the same direct melee exchange.`;
  }

  const left = fromCombatant.side === 'party' ? fromCombatant : toCombatant;
  const right = fromCombatant.side === 'party' ? toCombatant : fromCombatant;
  const { faster } = getDirectMeleeFasterAndSlower(left, right);

  switch (engagement.resolution.reason) {
    case 'initiative': {
      const winner =
        compareCombatantInitiative(fromCombatant, toCombatant) > 0
          ? fromCombatant
          : toCombatant;
      const loser =
        winner.id === fromCombatant.id ? toCombatant : fromCombatant;
      const timingExplanation = getInitiativeTimingExplanation(winner, loser);

      if (timingExplanation) {
        return `${timingExplanation} ${fromName} comes before ${toName} in this melee exchange.`;
      }

      return `${winner.name} wins initiative ${winner.initiative} to ${loser.initiative}, so ${fromName} comes before ${toName} in this melee exchange.`;
    }

    case 'multiple-routines':
      return fromCombatant.id === toCombatant.id
        ? `${fromCombatant.name} has multiple routine attacks this round, so ${fromName} comes before ${toName} under the DMG first/middle/last routine order.`
        : `Multiple routine attacks are in play here, so ${fromName} falls earlier in the DMG first/middle/last routine order than ${toName}.`;

    case 'weapon-speed':
      return `${left.name} and ${right.name} tied initiative at ${left.initiative}. ${faster.name}'s lower weapon speed factor breaks the tie, so ${fromName} comes before ${toName}.`;

    case 'weapon-speed-double':
      return fromCombatant.id === toCombatant.id
        ? `${left.name} and ${right.name} tied initiative at ${left.initiative}. ${faster.name}'s faster weapon earns an extra blow, so ${fromName} comes before ${toName}.`
        : `${left.name} and ${right.name} tied initiative at ${left.initiative}. ${faster.name}'s weapon is more than twice as fast, so ${fromName} comes before ${toName}.`;

    case 'weapon-speed-triple':
      return `${left.name} and ${right.name} tied initiative at ${left.initiative}. The large weapon speed difference creates an extra third blow, which sets the order between ${fromName} and ${toName}.`;

    case 'simultaneous':
      return `${left.name} and ${right.name} tied initiative, so their blows land simultaneously here.`;
  }
};

const getReachPriorityText = ({
  combatant,
  opponent,
  firstStrike,
  thisBlowIsFirst,
}: {
  combatant: InitiativeScenarioCombatant;
  opponent: InitiativeScenarioCombatant;
  firstStrike?: InitiativeChargeFirstStrike;
  thisBlowIsFirst: boolean;
}): string => {
  if (firstStrike === 'attacker') {
    if (
      combatant.weaponLength !== undefined &&
      opponent.weaponLength !== undefined &&
      combatant.weaponType !== 'missile' &&
      opponent.weaponType !== 'missile'
    ) {
      return thisBlowIsFirst
        ? `${combatant.name}'s ${combatant.weaponName} has longer reach (${combatant.weaponLength} vs ${opponent.weaponLength}), so ${combatant.name} attacks first at contact.`
        : `${opponent.name}'s ${opponent.weaponName} has longer reach (${opponent.weaponLength} vs ${combatant.weaponLength}), so ${combatant.name}'s blow comes after ${opponent.name}'s.`;
    }

    return thisBlowIsFirst
      ? `${combatant.name} attacks first at contact.`
      : `${combatant.name}'s blow comes after ${opponent.name}'s at contact.`;
  }

  if (firstStrike === 'target') {
    if (
      combatant.weaponLength !== undefined &&
      opponent.weaponLength !== undefined &&
      combatant.weaponType !== 'missile' &&
      opponent.weaponType !== 'missile'
    ) {
      return thisBlowIsFirst
        ? `${combatant.name}'s ${combatant.weaponName} has longer reach (${combatant.weaponLength} vs ${opponent.weaponLength}), so ${combatant.name} attacks first at contact.`
        : `${opponent.name}'s ${opponent.weaponName} has longer reach (${opponent.weaponLength} vs ${combatant.weaponLength}), so ${combatant.name}'s blow comes after ${opponent.name}'s.`;
    }

    return thisBlowIsFirst
      ? `${combatant.name} attacks first at contact.`
      : `${combatant.name}'s blow comes after ${opponent.name}'s at contact.`;
  }

  if (firstStrike === 'simultaneous') {
    if (
      combatant.weaponLength !== undefined &&
      opponent.weaponLength !== undefined &&
      combatant.weaponType !== 'missile' &&
      opponent.weaponType !== 'missile'
    ) {
      return `Their reach is equal at ${combatant.weaponLength}, so the blows land simultaneously at contact.`;
    }

    return `The blows land simultaneously at contact.`;
  }

  return `Reach does not currently settle who attacks first at contact.`;
};

const getMovementAttackWhyHereText = ({
  node,
  combatant,
  placement,
  opponent,
}: {
  node: InitiativeAttackNode;
  combatant: InitiativeScenarioCombatant;
  placement: Extract<
    NonNullable<InitiativeAttackNode['placement']>,
    {
      kind: 'movement-attack';
    }
  >;
  opponent?: InitiativeScenarioCombatant;
}): string => {
  const opponentName = opponent?.name || 'the opposing combatant';
  const segment = placement.contactSegment || node.segment;

  if (placement.action === 'set-vs-charge') {
    return `${
      combatant.name
    } sets against ${opponentName}'s charge. Because ${opponentName} reaches contact on segment ${segment}, ${
      combatant.name
    }'s set weapon strikes first and deals ${
      placement.damageMultiplier || 2
    }x normal damage if it hits.`;
  }

  if (placement.role === 'charge-target') {
    return `${
      combatant.name
    } is being charged by ${opponentName}. Contact comes on segment ${segment}. ${getReachPriorityText(
      {
        combatant,
        opponent: opponent || combatant,
        firstStrike: placement.firstStrike,
        thisBlowIsFirst: placement.firstStrike === 'target',
      }
    )}`;
  }

  if (placement.action === 'charge') {
    const distanceText =
      placement.distanceInches !== undefined
        ? ` reaches ${opponentName} from ${placement.distanceInches}" away`
        : ` reaches ${opponentName}`;

    return `${
      combatant.name
    }${distanceText} on segment ${segment} and can strike on the charge. ${getReachPriorityText(
      {
        combatant,
        opponent: opponent || combatant,
        firstStrike: placement.firstStrike,
        thisBlowIsFirst: placement.firstStrike === 'attacker',
      }
    )}`;
  }

  if (placement.action === 'close') {
    const distanceText =
      placement.distanceInches !== undefined
        ? ` from ${placement.distanceInches}" away`
        : '';

    return `${
      combatant.name
    } reaches striking range of ${opponentName}${distanceText} on segment ${segment}. Because ${opponentName} is charging into contact, ${
      combatant.name
    } can also attack in the same round. ${getReachPriorityText({
      combatant,
      opponent: opponent || combatant,
      firstStrike: placement.firstStrike,
      thisBlowIsFirst: placement.firstStrike === 'target',
    })}`;
  }

  if (placement.distanceInches !== undefined) {
    return `${combatant.name}'s attack is on segment ${segment} because movement contact is reached from ${placement.distanceInches}" away by then.`;
  }

  return `${combatant.name}'s attack is on segment ${segment} because movement contact is reached by then.`;
};

const getMovementEdgeExplanation = ({
  fromNode,
  toNode,
  fromCombatant,
  toCombatant,
  fromName,
  toName,
}: {
  fromNode?: InitiativeAttackNode;
  toNode?: InitiativeAttackNode;
  fromCombatant?: InitiativeScenarioCombatant;
  toCombatant?: InitiativeScenarioCombatant;
  fromName: string;
  toName: string;
}): string => {
  const fromPlacement =
    fromNode?.placement?.kind === 'movement-attack' ? fromNode.placement : null;
  const toPlacement =
    toNode?.placement?.kind === 'movement-attack' ? toNode.placement : null;

  if (
    fromPlacement?.action === 'set-vs-charge' &&
    fromCombatant &&
    toCombatant
  ) {
    return `${fromCombatant.name} is set against ${toCombatant.name}'s charge, so the set weapon strikes first when contact is made on segment ${fromPlacement.contactSegment}.`;
  }

  if (toPlacement?.action === 'set-vs-charge' && fromCombatant && toCombatant) {
    return `${toCombatant.name} is set against ${fromCombatant.name}'s charge, so ${fromName} waits until after the set weapon takes effect on segment ${toPlacement.contactSegment}.`;
  }

  if (
    fromPlacement?.action === 'charge' &&
    fromCombatant &&
    toCombatant &&
    fromPlacement.firstStrike === 'attacker'
  ) {
    return `${fromCombatant.name}'s charge reaches contact on segment ${fromPlacement.contactSegment}, and longer reach lets ${fromCombatant.name} strike before ${toCombatant.name}.`;
  }

  if (
    fromPlacement?.role === 'charge-target' &&
    fromCombatant &&
    toCombatant &&
    fromPlacement.firstStrike === 'target'
  ) {
    return `${fromCombatant.name} is charged on segment ${fromPlacement.contactSegment} but has the longer reach, so ${fromName} happens before ${toName}.`;
  }

  if (
    fromPlacement?.firstStrike === 'simultaneous' ||
    toPlacement?.firstStrike === 'simultaneous'
  ) {
    return `Contact is simultaneous here, so no movement edge should separate these blows.`;
  }

  if (fromNode?.kind === 'contact' && fromNode.segment !== undefined) {
    return `Contact is established on segment ${fromNode.segment}, and that has to happen before the later result shown here.`;
  }

  if (fromNode?.segment !== undefined) {
    return `Movement and contact timing make ${fromName} happen before ${toName} on segment ${fromNode.segment}.`;
  }

  return `Movement and contact timing create this local order.`;
};

interface InitiativePlaygroundProps {
  rememberedState?: InitiativePlaytestState;
}

type GraphNodeStatus = 'resolved' | 'lost';

interface GraphContextMenuState {
  nodeId: string;
  left: number;
  top: number;
}

const GRAPH_NODE_FILL_BY_SIDE: Record<
  InitiativePlaytestSide,
  Record<'pending' | GraphNodeStatus, string>
> = {
  party: {
    pending: '#6F8E34',
    resolved: '#556C2E',
    lost: '#3E4D28',
  },
  enemy: {
    pending: '#9A4E40',
    resolved: '#74483C',
    lost: '#553730',
  },
};

const GRAPH_NODE_STATUS_BADGE: Record<
  GraphNodeStatus,
  {
    label: string;
    symbol: string;
  }
> = {
  resolved: {
    label: 'Resolved',
    symbol: '✓',
  },
  lost: {
    label: 'Lost',
    symbol: '×',
  },
};

const getGraphNodeFill = (
  side: InitiativePlaytestSide,
  status: GraphNodeStatus | undefined
): string => GRAPH_NODE_FILL_BY_SIDE[side][status || 'pending'];

const getGraphNodeStatusLabel = (status: GraphNodeStatus): string =>
  GRAPH_NODE_STATUS_BADGE[status].label;

const GRAPH_NODE_ENABLED_LABEL = 'Ready to resolve';

const InitiativePlayground = ({
  rememberedState,
}: InitiativePlaygroundProps) => {
  const [state, setState] = useState<InitiativePlaytestState>(
    rememberedState || createMixedPreset
  );
  const [editorTarget, setEditorTarget] = useState<
    InitiativePlaytestEditorTarget | undefined
  >(undefined);
  const [actionEditorTarget, setActionEditorTarget] = useState<
    InitiativePlaytestAttackEditorTarget | undefined
  >(undefined);
  const [targetPickerTarget, setTargetPickerTarget] = useState<
    InitiativeTargetPickerTarget | undefined
  >(undefined);
  const [selectedGraphNodeId, setSelectedGraphNodeId] = useState<
    string | undefined
  >(undefined);
  const [hoveredGraphNodeId, setHoveredGraphNodeId] = useState<
    string | undefined
  >(undefined);
  const [graphNodeStatusById, setGraphNodeStatusById] = useState<
    Record<string, GraphNodeStatus>
  >({});
  const [examplesMenuOpen, setExamplesMenuOpen] = useState<boolean>(false);
  const [approachOpen, setApproachOpen] = useState<boolean>(false);
  const graphPopoverRef = useRef<HTMLDivElement | null>(null);
  const graphContextMenuRef = useRef<HTMLDivElement | null>(null);
  const graphViewportRef = useRef<HTMLDivElement | null>(null);
  const pendingGraphRevealNodeIdRef = useRef<string | undefined>(undefined);
  const [graphPopoverHeight, setGraphPopoverHeight] = useState<number>(
    GRAPH_POPOVER_FALLBACK_HEIGHT
  );
  const [graphViewportMetrics, setGraphViewportMetrics] = useState<{
    clientHeight: number;
    clientWidth: number;
    scrollLeft: number;
    scrollTop: number;
  }>({
    clientHeight: 0,
    clientWidth: 0,
    scrollLeft: 0,
    scrollTop: 0,
  });
  const [graphContextMenu, setGraphContextMenu] = useState<
    GraphContextMenuState | undefined
  >(undefined);
  const resolvedRound = useMemo(
    () => resolveInitiativeDraft(buildDraftFromState(state)),
    [state]
  );
  const { scenario, resolution, attackGraph, viewModel } = resolvedRound;
  const attackNodeById = useMemo(
    () => new Map(attackGraph.nodes.map((node) => [node.id, node] as const)),
    [attackGraph.nodes]
  );
  const combatantById = useMemo(
    () =>
      new Map(
        scenario.party
          .concat(scenario.enemies)
          .map((combatant) => [combatant.id, combatant] as const)
      ),
    [scenario.enemies, scenario.party]
  );
  const directMeleeEngagementByCombatantIds = useMemo(() => {
    const entries = resolution.directMeleeEngagements.flatMap((engagement) => [
      [
        getDirectMeleeEngagementKey(
          engagement.partyCombatantId,
          engagement.enemyCombatantId
        ),
        engagement,
      ] as const,
      [
        getDirectMeleeEngagementKey(
          engagement.enemyCombatantId,
          engagement.partyCombatantId
        ),
        engagement,
      ] as const,
    ]);

    return new Map(entries);
  }, [resolution.directMeleeEngagements]);
  const graphNodeDisplayById = useMemo(
    () =>
      buildInitiativeAttackGraphNodeDisplayById(resolvedRound, {
        targetPrefix: '→',
      }),
    [resolvedRound]
  );
  const graphLayout = useMemo(
    () =>
      buildInitiativeAttackGraphLayout(
        attackGraph,
        Object.fromEntries(
          Object.entries(graphNodeDisplayById).map(([nodeId, display]) => [
            nodeId,
            {
              width: display.width,
              height: display.height,
            },
          ])
        )
      ),
    [attackGraph, graphNodeDisplayById]
  );
  const menuPortalTarget =
    typeof document !== 'undefined' ? document.body : undefined;
  const modalRoot = typeof document !== 'undefined' ? document.body : null;
  const [shareFeedback, setShareFeedback] = useState<string | undefined>(
    undefined
  );
  const encodedState = useMemo(
    () => encodeInitiativePlaytestState(state),
    [state]
  );

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const url = new URL(window.location.href);
    url.searchParams.set('s', encodedState);
    window.history.replaceState({}, '', `${url.pathname}?${url.searchParams}`);
  }, [encodedState]);

  useEffect(() => {
    if (
      (!selectedGraphNodeId && !graphContextMenu) ||
      typeof window === 'undefined'
    ) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedGraphNodeId(undefined);
        setGraphContextMenu(undefined);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [graphContextMenu, selectedGraphNodeId]);

  useEffect(() => {
    if (!selectedGraphNodeId) {
      setGraphPopoverHeight(GRAPH_POPOVER_FALLBACK_HEIGHT);
      return;
    }

    const popoverElement = graphPopoverRef.current;

    if (!popoverElement) {
      return;
    }

    const updateHeight = () => {
      const nextHeight = Math.ceil(popoverElement.offsetHeight);
      setGraphPopoverHeight((previous) =>
        previous === nextHeight ? previous : nextHeight
      );
    };

    updateHeight();

    if (typeof ResizeObserver === 'undefined') {
      return;
    }

    const resizeObserver = new ResizeObserver(() => {
      updateHeight();
    });

    resizeObserver.observe(popoverElement);
    return () => resizeObserver.disconnect();
  }, [selectedGraphNodeId]);

  useEffect(() => {
    const viewport = graphViewportRef.current;

    if (!viewport) {
      return;
    }

    const updateMetrics = () => {
      const nextMetrics = {
        clientHeight: viewport.clientHeight,
        clientWidth: viewport.clientWidth,
        scrollLeft: viewport.scrollLeft,
        scrollTop: viewport.scrollTop,
      };

      setGraphViewportMetrics((previous) =>
        previous.clientHeight === nextMetrics.clientHeight &&
        previous.clientWidth === nextMetrics.clientWidth &&
        previous.scrollLeft === nextMetrics.scrollLeft &&
        previous.scrollTop === nextMetrics.scrollTop
          ? previous
          : nextMetrics
      );
    };

    updateMetrics();
    viewport.addEventListener('scroll', updateMetrics, { passive: true });

    if (typeof ResizeObserver === 'undefined') {
      return () => viewport.removeEventListener('scroll', updateMetrics);
    }

    const resizeObserver = new ResizeObserver(() => {
      updateMetrics();
    });

    resizeObserver.observe(viewport);
    return () => {
      viewport.removeEventListener('scroll', updateMetrics);
      resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    if (
      (!selectedGraphNodeId && !graphContextMenu) ||
      typeof window === 'undefined'
    ) {
      return;
    }

    const handleDocumentClick = (event: MouseEvent) => {
      const target = event.target;

      if (!(target instanceof Element)) {
        return;
      }

      if (graphPopoverRef.current?.contains(target)) {
        return;
      }

      if (graphContextMenuRef.current?.contains(target)) {
        return;
      }

      if (target.closest('[data-graph-node-button="true"]')) {
        return;
      }

      setSelectedGraphNodeId(undefined);
      setGraphContextMenu(undefined);
    };

    window.addEventListener('click', handleDocumentClick);
    return () => window.removeEventListener('click', handleDocumentClick);
  }, [graphContextMenu, selectedGraphNodeId]);

  useEffect(() => {
    setGraphNodeStatusById((previous) =>
      Object.keys(previous).length === 0 ? previous : {}
    );
    setGraphContextMenu(undefined);
  }, [attackGraph]);

  const getShareUrl = (): string | undefined => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const url = new URL(window.location.href);
    url.searchParams.set('s', encodedState);
    return url.toString();
  };

  const copyShareUrl = async () => {
    const shareUrl = getShareUrl();

    if (!shareUrl) {
      return;
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareFeedback('Share URL copied.');
    } catch (error) {
      console.error('Unable to copy initiative share URL:', error);
      setShareFeedback('Clipboard blocked. Copy the URL from the address bar.');
    }
  };

  const updateLabel = (event: ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    setState((previous) => ({
      ...previous,
      label: value,
    }));
  };

  const updateInitiative = (
    field: 'partyInitiative' | 'enemyInitiative',
    value: string
  ) => {
    setState((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const updateCombatant = (
    side: InitiativePlaytestSide,
    combatantKey: number,
    changes: Partial<InitiativePlaytestCombatant>
  ) => {
    const stateSide = getStateSide(side);

    setState((previous) => ({
      ...previous,
      [stateSide]: previous[stateSide].map((combatant) =>
        combatant.key === combatantKey
          ? (() => {
              const updatedCombatant = { ...combatant, ...changes };

              if (changes.weaponId !== undefined) {
                const weaponId = changes.weaponId;
                updatedCombatant.actions = getCombatantActions(
                  updatedCombatant
                ).map((action) =>
                  normalizeActionStateForCombatant(action, weaponId)
                );
              }

              return updatedCombatant;
            })()
          : combatant
      ),
    }));
  };

  const openActionEditor = (
    side: InitiativePlaytestSide,
    combatantKey: number
  ) => {
    const combatant = state[getStateSide(side)].find(
      (candidate) => candidate.key === combatantKey
    );

    if (!combatant) {
      return;
    }

    const actions = getCombatantActions(combatant).map((action) => {
      const firstTargetKey = action.targetCombatantKeys[0];
      const pairKey =
        firstTargetKey !== undefined
          ? side === 'party'
            ? getPairDistanceKey(combatantKey, firstTargetKey)
            : getPairDistanceKey(firstTargetKey, combatantKey)
          : undefined;
      const declarationKey =
        firstTargetKey !== undefined
          ? getAttackDeclarationKey(side, combatantKey, firstTargetKey)
          : undefined;

      return {
        ...action,
        actionDistanceInches:
          action.actionDistanceInches ||
          (pairKey ? state.pairDistances[pairKey] || '' : ''),
        activationSegments:
          action.activationSegments ||
          (declarationKey
            ? state.attackActivationSegments[declarationKey] || ''
            : ''),
        castingSegments:
          action.castingSegments ||
          (action.declaredAction === 'spell-casting'
            ? getStoredCastingSegmentsForAttacker(state, side, combatantKey) ||
              '1'
            : declarationKey
            ? state.attackCastingSegments[declarationKey] || ''
            : ''),
      };
    });
    const primaryAction = actions[0];

    setActionEditorTarget({
      side,
      combatantKey,
      selectedActionId: primaryAction?.id || MAIN_ACTION_ID,
      actions,
    });
  };

  const addCombatant = (side: InitiativePlaytestSide) => {
    const stateSide = getStateSide(side);

    setState((previous) => {
      const nextCombatant = createCombatant(
        previous.nextCombatantKey,
        getNextCombatantName(side, previous[stateSide].length),
        getDefaultWeaponIdForSide(side)
      );

      return {
        ...previous,
        nextCombatantKey: previous.nextCombatantKey + 1,
        [stateSide]: previous[stateSide].concat(nextCombatant),
      };
    });
  };

  const removeCombatant = (
    side: InitiativePlaytestSide,
    combatantKey: number
  ) => {
    const stateSide = getStateSide(side);
    const opposingStateSide: InitiativePlaytestStateSide =
      side === 'party' ? 'enemies' : 'party';

    setState((previous) => ({
      ...previous,
      pairDistances: Object.fromEntries(
        Object.entries(previous.pairDistances).filter(([pairKey]) => {
          const [partyCombatantKey, enemyCombatantKey] = pairKey
            .split(':')
            .map((value) => parseInt(value, 10));

          if (side === 'party') {
            return partyCombatantKey !== combatantKey;
          }

          return enemyCombatantKey !== combatantKey;
        })
      ),
      attackActivationSegments: Object.fromEntries(
        Object.entries(previous.attackActivationSegments).filter(
          ([declarationKey]) => {
            const [declarationSide, attackerKeyValue, targetKeyValue] =
              declarationKey.split(':');
            const attackerKey = parseInt(attackerKeyValue || '', 10);
            const targetKey = parseInt(targetKeyValue || '', 10);

            if (declarationSide !== 'party' && declarationSide !== 'enemy') {
              return false;
            }

            if (side === declarationSide && attackerKey === combatantKey) {
              return false;
            }

            const targetSide = declarationSide === 'party' ? 'enemy' : 'party';
            if (side === targetSide && targetKey === combatantKey) {
              return false;
            }

            return true;
          }
        )
      ),
      attackCastingSegments: Object.fromEntries(
        Object.entries(previous.attackCastingSegments).filter(
          ([declarationKey]) => {
            const [declarationSide, attackerKeyValue, targetKeyValue] =
              declarationKey.split(':');
            const attackerKey = parseInt(attackerKeyValue || '', 10);
            const targetKey = parseInt(targetKeyValue || '', 10);

            if (declarationSide !== 'party' && declarationSide !== 'enemy') {
              return false;
            }

            if (side === declarationSide && attackerKey === combatantKey) {
              return false;
            }

            const targetSide = declarationSide === 'party' ? 'enemy' : 'party';
            if (side === targetSide && targetKey === combatantKey) {
              return false;
            }

            return true;
          }
        )
      ),
      [stateSide]: previous[stateSide].filter(
        (combatant) => combatant.key !== combatantKey
      ),
      [opposingStateSide]: previous[opposingStateSide].map((combatant) =>
        syncCombatantActions(
          combatant,
          getCombatantActions(combatant).map((action) => ({
            ...action,
            targetCombatantKeys: action.targetCombatantKeys.filter(
              (targetKey) => targetKey !== combatantKey
            ),
          }))
        )
      ),
    }));
    setEditorTarget((previous) =>
      previous &&
      previous.side === side &&
      previous.combatantKey === combatantKey
        ? undefined
        : previous
    );
    setActionEditorTarget((previous) =>
      previous &&
      previous.side === side &&
      previous.combatantKey === combatantKey
        ? undefined
        : previous
    );
    setTargetPickerTarget((previous) => {
      if (!previous) {
        return previous;
      }

      const targetSide = previous.attackingSide === 'party' ? 'enemy' : 'party';
      return (previous.attackingSide === side &&
        previous.attackerKey === combatantKey) ||
        (targetSide === side && previous.targetKey === combatantKey)
        ? undefined
        : previous;
    });
  };

  const loadPreset = (presetFactory: () => InitiativePlaytestState) => {
    setState(presetFactory());
    setShareFeedback(undefined);
    setExamplesMenuOpen(false);
  };

  const saveActionDeclaration = () => {
    if (!actionEditorTarget) {
      return;
    }

    const { side, combatantKey, actions } = actionEditorTarget;
    const stateSide = getStateSide(side);

    setState((previous) => {
      const attackingCombatant = previous[stateSide].find(
        (combatant) => combatant.key === combatantKey
      );

      if (!attackingCombatant) {
        return previous;
      }

      return {
        ...previous,
        [stateSide]: previous[stateSide].map((combatant) =>
          combatant.key !== combatantKey
            ? combatant
            : syncCombatantActions(combatant, actions)
        ),
      };
    });

    setActionEditorTarget(undefined);
  };

  const toggleAttackTarget = (
    attackingSide: InitiativePlaytestSide,
    attackerKey: number,
    targetKey: number
  ) => {
    const stateSide = getStateSide(attackingSide);

    setState((previous) => {
      const attackingCombatant = previous[stateSide].find(
        (combatant) => combatant.key === attackerKey
      );
      const targetAction = attackingCombatant
        ? getCombatantActions(attackingCombatant).find((action) =>
            usesTargetSelection(action.declaredAction)
          )
        : undefined;

      if (!attackingCombatant || !targetAction) {
        return previous;
      }

      const nextActions = updateActionInList(
        getCombatantActions(attackingCombatant),
        targetAction.id,
        (action) =>
          toggleActionTargetKey(action, targetKey, attackingCombatant.weaponId)
      );

      return {
        ...previous,
        [stateSide]: previous[stateSide].map((combatant) =>
          combatant.key === attackerKey
            ? syncCombatantActions(combatant, nextActions)
            : combatant
        ),
      };
    });
  };

  const openTargetPickerOrToggle = (
    attackingSide: InitiativePlaytestSide,
    attackerKey: number,
    targetKey: number
  ) => {
    const stateSide = getStateSide(attackingSide);
    const attackingCombatant = state[stateSide].find(
      (combatant) => combatant.key === attackerKey
    );

    if (!attackingCombatant) {
      return;
    }

    const targetableActions = getCombatantActions(attackingCombatant).filter(
      (action) => usesTargetSelection(action.declaredAction)
    );

    if (targetableActions.length <= 1) {
      toggleAttackTarget(attackingSide, attackerKey, targetKey);
      return;
    }

    setTargetPickerTarget({
      attackingSide,
      attackerKey,
      targetKey,
    });
  };

  const clearActionDeclaration = () => {
    if (!actionEditorTarget) {
      return;
    }

    const { side, combatantKey } = actionEditorTarget;
    const stateSide = getStateSide(side);

    setState((previous) => ({
      ...previous,
      [stateSide]: previous[stateSide].map((combatant) =>
        combatant.key === combatantKey
          ? syncCombatantActions(
              combatant,
              updateActionInList(
                getCombatantActions(combatant),
                actionEditorTarget.selectedActionId,
                (action) => ({
                  ...action,
                  targetCombatantKeys: [],
                })
              )
            )
          : combatant
      ),
    }));

    setActionEditorTarget(undefined);
  };

  const attackNodeLabelById = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(graphNodeDisplayById).map(([nodeId, display]) => [
          nodeId,
          `${display.combatantName}: ${display.actionTitle}${
            display.actionMeta ? `, ${display.actionMeta}` : ''
          }`,
        ])
      ),
    [graphNodeDisplayById]
  );
  const revealGraphNodeInViewport = useCallback(
    (nodeId: string) => {
      const viewport = graphViewportRef.current;
      const layoutNode = graphLayout.nodes.find(
        (candidate) => candidate.nodeId === nodeId
      );

      if (!viewport || !layoutNode) {
        return;
      }

      const margin = 32;
      const nodeLeft = layoutNode.x;
      const nodeRight = layoutNode.x + layoutNode.width;
      const nodeTop = layoutNode.y;
      const nodeBottom = layoutNode.y + layoutNode.height;
      const viewLeft = viewport.scrollLeft;
      const viewRight = viewLeft + viewport.clientWidth;
      const viewTop = viewport.scrollTop;
      const viewBottom = viewTop + viewport.clientHeight;

      let nextLeft = viewLeft;
      let nextTop = viewTop;

      if (nodeLeft - margin < viewLeft) {
        nextLeft = Math.max(0, nodeLeft - margin);
      } else if (nodeRight + margin > viewRight) {
        nextLeft = Math.max(0, nodeRight + margin - viewport.clientWidth);
      }

      if (nodeTop - margin < viewTop) {
        nextTop = Math.max(0, nodeTop - margin);
      } else if (nodeBottom + margin > viewBottom) {
        nextTop = Math.max(0, nodeBottom + margin - viewport.clientHeight);
      }

      if (nextLeft !== viewLeft || nextTop !== viewTop) {
        viewport.scrollTo({
          left: nextLeft,
          top: nextTop,
          behavior: 'smooth',
        });
      }
    },
    [graphLayout.nodes]
  );
  const openGraphNode = (nodeId: string, revealInViewport = false) => {
    if (revealInViewport) {
      pendingGraphRevealNodeIdRef.current = nodeId;
    }

    setSelectedGraphNodeId(nodeId);
  };
  const toggleSelectedGraphNode = (nodeId: string) => {
    setSelectedGraphNodeId((previous) => {
      if (previous === nodeId) {
        pendingGraphRevealNodeIdRef.current = undefined;
        return undefined;
      }

      return nodeId;
    });
  };
  const setGraphNodeStatus = (
    nodeId: string,
    status: GraphNodeStatus | undefined
  ) => {
    setGraphNodeStatusById((previous) => {
      if (status === undefined) {
        if (!(nodeId in previous)) {
          return previous;
        }

        const next = { ...previous };
        delete next[nodeId];
        return next;
      }

      if (previous[nodeId] === status) {
        return previous;
      }

      return {
        ...previous,
        [nodeId]: status,
      };
    });
  };
  const applyGraphNodeStatus = (
    nodeId: string,
    status: GraphNodeStatus | undefined
  ) => {
    setGraphNodeStatus(nodeId, status);
    setGraphContextMenu(undefined);
  };
  const selectedGraphNode = attackGraph.nodes.find(
    (node) => node.id === selectedGraphNodeId
  );
  const selectedGraphNodeLayout = useMemo(
    () =>
      selectedGraphNode
        ? graphLayout.nodes.find(
            (layoutNode) => layoutNode.nodeId === selectedGraphNode.id
          )
        : undefined,
    [graphLayout.nodes, selectedGraphNode]
  );
  const selectedGraphNodeStatus = selectedGraphNode
    ? graphNodeStatusById[selectedGraphNode.id]
    : undefined;
  const selectedGraphIncomingEdges = useMemo(
    () =>
      selectedGraphNode
        ? attackGraph.edges.filter(
            (edge) => edge.toNodeId === selectedGraphNode.id
          )
        : [],
    [attackGraph.edges, selectedGraphNode]
  );
  const selectedGraphOutgoingEdges = useMemo(
    () =>
      selectedGraphNode
        ? attackGraph.edges.filter(
            (edge) => edge.fromNodeId === selectedGraphNode.id
          )
        : [],
    [attackGraph.edges, selectedGraphNode]
  );
  const selectedGraphOutgoingTargets = useMemo(() => {
    const seen = new Set<string>();

    return selectedGraphOutgoingEdges.flatMap((edge) => {
      if (seen.has(edge.toNodeId)) {
        return [];
      }

      seen.add(edge.toNodeId);
      return [
        {
          nodeId: edge.toNodeId,
          label: attackNodeLabelById[edge.toNodeId] || edge.toNodeId,
        },
      ];
    });
  }, [attackNodeLabelById, selectedGraphOutgoingEdges]);
  const selectedGraphSimultaneousGroup = useMemo(
    () =>
      selectedGraphNode
        ? attackGraph.simultaneousGroups.find((group) =>
            group.includes(selectedGraphNode.id)
          )
        : undefined,
    [attackGraph.simultaneousGroups, selectedGraphNode]
  );
  const enabledGraphNodeIds = useMemo(() => {
    const incomingBlockerIdsByNodeId = new Map<string, Set<string>>();

    attackGraph.edges.forEach((edge) => {
      const blockerIds = incomingBlockerIdsByNodeId.get(edge.toNodeId);

      if (blockerIds) {
        blockerIds.add(edge.fromNodeId);
      } else {
        incomingBlockerIdsByNodeId.set(
          edge.toNodeId,
          new Set([edge.fromNodeId])
        );
      }
    });

    const baseEnabledNodes = attackGraph.nodes.filter((node) => {
      if (graphNodeStatusById[node.id] !== undefined) {
        return false;
      }

      const blockerIds = incomingBlockerIdsByNodeId.get(node.id);
      const hasPendingBlockers = blockerIds
        ? Array.from(blockerIds).some(
            (blockerId) => graphNodeStatusById[blockerId] === undefined
          )
        : false;

      return !hasPendingBlockers;
    });
    const earliestEnabledSegment = baseEnabledNodes.reduce<number | undefined>(
      (earliestSegment, node) => {
        if (node.segment === undefined) {
          return earliestSegment;
        }

        if (earliestSegment === undefined || node.segment < earliestSegment) {
          return node.segment;
        }

        return earliestSegment;
      },
      undefined
    );

    return new Set(
      baseEnabledNodes.flatMap((node) => {
        if (
          node.segment !== undefined &&
          earliestEnabledSegment !== undefined &&
          node.segment > earliestEnabledSegment
        ) {
          return [];
        }

        return [node.id];
      })
    );
  }, [attackGraph.edges, attackGraph.nodes, graphNodeStatusById]);
  const selectedGraphLostLabel =
    selectedGraphNode?.kind === 'spell-start' ||
    selectedGraphNode?.kind === 'spell-completion'
      ? 'Mark spoiled'
      : 'Mark lost';
  const contextMenuGraphNode = graphContextMenu
    ? attackGraph.nodes.find((node) => node.id === graphContextMenu.nodeId)
    : undefined;
  const contextMenuGraphNodeStatus = contextMenuGraphNode
    ? graphNodeStatusById[contextMenuGraphNode.id]
    : undefined;
  const contextMenuGraphNodeLostLabel =
    contextMenuGraphNode?.kind === 'spell-start' ||
    contextMenuGraphNode?.kind === 'spell-completion'
      ? 'Mark spoiled'
      : 'Mark lost';
  const graphEdgesInRenderOrder = useMemo(() => {
    if (!hoveredGraphNodeId) {
      return graphLayout.edges;
    }

    const highlightedEdges: typeof graphLayout.edges = [];
    const ordinaryEdges: typeof graphLayout.edges = [];

    graphLayout.edges.forEach((edge) => {
      if (
        edge.fromNodeId === hoveredGraphNodeId ||
        edge.toNodeId === hoveredGraphNodeId
      ) {
        highlightedEdges.push(edge);
      } else {
        ordinaryEdges.push(edge);
      }
    });

    return ordinaryEdges.concat(highlightedEdges);
  }, [graphLayout, hoveredGraphNodeId]);
  const selectedGraphPopoverPosition = useMemo(() => {
    if (!selectedGraphNodeLayout) {
      return undefined;
    }

    const viewportWidth =
      graphViewportMetrics.clientWidth > 0
        ? graphViewportMetrics.clientWidth
        : graphLayout.width;
    const viewportHeight =
      graphViewportMetrics.clientHeight > 0
        ? graphViewportMetrics.clientHeight
        : graphLayout.height;
    const visibleNodeLeft =
      selectedGraphNodeLayout.x - graphViewportMetrics.scrollLeft;
    const visibleNodeTop =
      selectedGraphNodeLayout.y - graphViewportMetrics.scrollTop;
    const preferredRight =
      visibleNodeLeft + selectedGraphNodeLayout.width + GRAPH_POPOVER_GAP;
    const maxLeft = Math.max(
      GRAPH_POPOVER_MARGIN,
      viewportWidth - GRAPH_POPOVER_WIDTH - GRAPH_POPOVER_MARGIN
    );
    const placeLeft =
      preferredRight >
      viewportWidth - GRAPH_POPOVER_WIDTH - GRAPH_POPOVER_MARGIN;
    const maxPopoverHeight = Math.max(
      160,
      Math.min(
        GRAPH_POPOVER_MAX_HEIGHT,
        viewportHeight - GRAPH_POPOVER_MARGIN * 2 - GRAPH_POPOVER_VIEWPORT_INSET
      )
    );
    const effectivePopoverHeight = Math.min(
      graphPopoverHeight,
      maxPopoverHeight
    );
    const maxTop = Math.max(
      GRAPH_POPOVER_MARGIN,
      viewportHeight -
        effectivePopoverHeight -
        GRAPH_POPOVER_MARGIN -
        GRAPH_POPOVER_VIEWPORT_INSET
    );
    const preferredTop = Math.max(GRAPH_POPOVER_MARGIN, visibleNodeTop - 6);

    return {
      left: placeLeft
        ? Math.max(
            GRAPH_POPOVER_MARGIN,
            visibleNodeLeft - GRAPH_POPOVER_WIDTH - GRAPH_POPOVER_GAP
          )
        : Math.min(preferredRight, maxLeft),
      top: Math.min(preferredTop, maxTop),
      maxHeight: maxPopoverHeight,
    };
  }, [
    graphLayout.height,
    graphLayout.width,
    graphPopoverHeight,
    graphViewportMetrics.clientHeight,
    graphViewportMetrics.clientWidth,
    graphViewportMetrics.scrollLeft,
    graphViewportMetrics.scrollTop,
    selectedGraphNodeLayout,
  ]);

  useEffect(() => {
    if (
      !selectedGraphNodeId ||
      pendingGraphRevealNodeIdRef.current !== selectedGraphNodeId
    ) {
      return;
    }

    pendingGraphRevealNodeIdRef.current = undefined;

    if (typeof window === 'undefined') {
      revealGraphNodeInViewport(selectedGraphNodeId);
      return;
    }

    window.requestAnimationFrame(() => {
      revealGraphNodeInViewport(selectedGraphNodeId);
    });
  }, [revealGraphNodeInViewport, selectedGraphNodeId]);
  const selectedGraphWhyHere = useMemo(() => {
    if (!selectedGraphNode) {
      return [];
    }

    const combatant = combatantById.get(selectedGraphNode.combatantId);
    if (!combatant) {
      return [];
    }

    const lines: string[] = [];
    const placement = selectedGraphNode.placement;
    const relatedEdges = selectedGraphIncomingEdges.concat(
      selectedGraphOutgoingEdges
    );
    const directMeleeEdges = relatedEdges.filter((edge) =>
      edge.reasons.includes('direct-melee')
    );
    const hasDirectMeleeEdge = directMeleeEdges.length > 0;
    const directMeleeEdge =
      directMeleeEdges.find((edge) => {
        const otherNodeId =
          edge.fromNodeId === selectedGraphNode.id
            ? edge.toNodeId
            : edge.fromNodeId;
        const otherNode = attackNodeById.get(otherNodeId);

        return otherNode?.combatantId !== combatant.id;
      }) || directMeleeEdges[0];
    const targetName = selectedGraphNode.targetId
      ? viewModel.combatantNameById[selectedGraphNode.targetId] ||
        selectedGraphNode.targetId
      : undefined;
    const targetCombatant = selectedGraphNode.targetId
      ? combatantById.get(selectedGraphNode.targetId)
      : undefined;
    const placementOpponentId =
      placement?.kind === 'movement-attack'
        ? placement.opponentId
        : placement?.kind === 'direct-melee'
        ? placement.opponentId
        : undefined;
    const placementOpponent = placementOpponentId
      ? combatantById.get(placementOpponentId)
      : undefined;
    const directMeleeOpponentId =
      directMeleeEdge?.fromNodeId === selectedGraphNode.id
        ? attackNodeById.get(directMeleeEdge.toNodeId)?.combatantId
        : directMeleeEdge?.toNodeId === selectedGraphNode.id
        ? attackNodeById.get(directMeleeEdge.fromNodeId)?.combatantId
        : undefined;
    const directMeleeTargetId =
      (placement?.kind === 'direct-melee' ? placement.opponentId : undefined) ||
      targetCombatant?.id ||
      (combatant.targetIds.length === 1 ? combatant.targetIds[0] : undefined) ||
      (directMeleeOpponentId !== undefined &&
      directMeleeOpponentId !== combatant.id
        ? directMeleeOpponentId
        : undefined);
    const directMeleeEngagement =
      directMeleeTargetId !== undefined
        ? directMeleeEngagementByCombatantIds.get(
            getDirectMeleeEngagementKey(combatant.id, directMeleeTargetId)
          )
        : undefined;
    const directMeleeOpponent =
      (directMeleeTargetId !== undefined
        ? combatantById.get(directMeleeTargetId)
        : undefined) || targetCombatant;
    const simultaneousPeerLabels = selectedGraphSimultaneousGroup
      ? selectedGraphSimultaneousGroup
          .filter((nodeId) => nodeId !== selectedGraphNode.id)
          .map((nodeId) => attackNodeLabelById[nodeId] || nodeId)
      : [];
    const combatantInitiative = getEffectiveInitiativeValue(combatant);
    const targetInitiative = targetCombatant
      ? getEffectiveInitiativeValue(targetCombatant)
      : undefined;

    if (selectedGraphNode.kind === 'spell-start') {
      if (selectedGraphNode.segment !== undefined) {
        lines.push(
          `Spells begin on segment ${selectedGraphNode.segment}. Casting span is shown explicitly.`
        );
      } else {
        lines.push(
          `This is an instant spell, so there is no separate casting span to show.`
        );
      }
    } else if (selectedGraphNode.kind === 'spell-completion') {
      if (selectedGraphNode.segment !== undefined) {
        lines.push(
          `This spell completes at the end of segment ${
            selectedGraphNode.segment
          } because its casting time is ${
            selectedGraphNode.segment >= 10
              ? '10+ segments'
              : `${selectedGraphNode.segment} ${
                  selectedGraphNode.segment === 1 ? 'segment' : 'segments'
                }`
          }.`
        );
      } else {
        lines.push(
          `This spell is instantaneous, so it has no separate completion segment.`
        );
      }
    } else if (placement?.kind === 'movement-completion') {
      lines.push(
        `${combatant.name} finishes moving ${placement.distanceInches}" on segment ${selectedGraphNode.segment}. This marks a targetless Move/Close declaration at MV ${placement.movementRate}".`
      );
    } else if (selectedGraphNode.kind === 'contact') {
      lines.push(
        `Contact is reached on segment ${selectedGraphNode.segment}. This marks the moment movement closes to melee without assuming an automatic same-round blow.`
      );
    } else if (placement?.kind === 'spell-directed') {
      const caster =
        combatantById.get(placement.casterId) ||
        (targetCombatant?.declaredAction === 'spell-casting'
          ? targetCombatant
          : undefined);
      const casterName = caster?.name || targetName || 'the spell caster';
      const casterInitiative = caster
        ? getEffectiveInitiativeValue(caster)
        : targetInitiative;

      if (
        casterName &&
        casterInitiative !== undefined &&
        casterInitiative > combatantInitiative
      ) {
        lines.push(
          `${combatant.name}'s attack is directed at ${casterName}. Since ${
            caster?.side === 'party' ? 'Party' : 'Enemy'
          } won initiative ${casterInitiative} to ${combatantInitiative}, attacks against ${casterName} land on segment ${
            selectedGraphNode.segment
          } (DMG p. 65 rule 2).`
        );
      } else if (
        casterName &&
        casterInitiative !== undefined &&
        casterInitiative === combatantInitiative
      ) {
        lines.push(
          `${combatant.name}'s attack is directed at ${casterName}. With initiative tied at ${casterInitiative}, attacks against ${casterName} land on segment ${selectedGraphNode.segment} (DMG p. 65 rule 2).`
        );
      } else {
        lines.push(
          `${combatant.name}'s attack is directed at ${casterName}. DMG p. 65 rule 2 places that attack on segment ${selectedGraphNode.segment}.`
        );
      }
    } else if (placement?.kind === 'weapon-vs-spell') {
      const caster = combatantById.get(placement.casterId) || targetCombatant;
      const casterName = caster?.name || targetName || 'the spell caster';
      const effectiveInitiative = getEffectiveInitiativeValue(combatant);
      const casterInitiative = caster
        ? getEffectiveInitiativeValue(caster)
        : undefined;
      const initiativeText =
        casterInitiative !== undefined &&
        casterInitiative === effectiveInitiative
          ? `initiative is tied at ${effectiveInitiative}`
          : casterInitiative !== undefined
          ? `${
              caster?.side === 'party' ? 'Party' : 'Enemy'
            } won initiative ${casterInitiative} to ${effectiveInitiative}`
          : 'initiative and weapon speed are compared here';
      const weaponLabel = combatant.weaponName || `${combatant.name}'s weapon`;

      if (placement.relation === 'before') {
        lines.push(
          `${combatant.name} is striking a caster in melee. Since ${initiativeText}, ${weaponLabel}'s weapon speed factor ${placement.weaponSpeedFactor} beats this ${placement.castingSegments}-segment spell under DMG p. 66-67, so ${combatant.name} can attack before ${casterName}'s spell completes.`
        );
      } else if (placement.relation === 'simultaneous') {
        lines.push(
          `${combatant.name} is striking a caster in melee. Since ${initiativeText}, ${weaponLabel}'s weapon speed factor ${placement.weaponSpeedFactor} matches this ${placement.castingSegments}-segment spell under DMG p. 66-67, so the blow and the spell completion are simultaneous.`
        );
      } else {
        lines.push(
          `${combatant.name} is striking a caster in melee. Since ${initiativeText}, ${weaponLabel}'s weapon speed factor ${placement.weaponSpeedFactor} is too slow to beat this ${placement.castingSegments}-segment spell under DMG p. 66-67, so ${casterName}'s spell completes before ${combatant.name} can strike.`
        );
      }
    } else if (placement?.kind === 'declared-action-segment') {
      lines.push(
        `${combatant.name}'s device use is on segment ${
          selectedGraphNode.segment
        } because its declared activation time is ${
          placement.activationSegments
        } ${placement.activationSegments === 1 ? 'segment' : 'segments'}.`
      );
    } else if (placement?.kind === 'movement-attack') {
      lines.push(
        getMovementAttackWhyHereText({
          node: selectedGraphNode,
          combatant,
          placement,
          opponent: placementOpponent,
        })
      );
    } else if (placement?.kind === 'missile-volley') {
      lines.push(
        placement.splitTarget && placement.targetId !== undefined
          ? `${
              combatant.name
            }'s missile volley is split across multiple targets. This node is the shot aimed at ${
              viewModel.combatantNameById[placement.targetId] ||
              placement.targetId
            }.`
          : `${combatant.name}'s missile volley stays unsegmented. Ordinary firing rate is treated as one initiative-controlled volley rather than as separate early and late shots.`
      );
    } else if (placement?.kind === 'turn-undead-unsegmented') {
      lines.push(
        `${combatant.name}'s turning attempt is initiative-controlled, but it has no separate segment timing.`
      );
    } else if (placement?.kind === 'magical-device-unsegmented') {
      lines.push(
        `${combatant.name}'s device use stays unsegmented because no activation time was declared for it.`
      );
    } else if (placement?.kind === 'non-combat-unsegmented') {
      lines.push(
        `${combatant.name}'s non-combat action is initiative-controlled, but it has no separate segment timing.`
      );
    } else if (placement?.kind === 'direct-melee') {
      if (directMeleeEngagement && directMeleeOpponent) {
        lines.push(
          getDirectMeleeWhyHereText({
            node: selectedGraphNode,
            combatant,
            opponent: directMeleeOpponent,
            engagement: directMeleeEngagement,
          })
        );
      } else if (simultaneousPeerLabels.length > 0) {
        lines.push(
          `This action is simultaneous with ${simultaneousPeerLabels.join(
            ' and '
          )}. No narrower rule in this slice gives either action precedence.`
        );
      } else {
        lines.push(
          `This action is part of a simultaneous exchange, so no narrower rule in this slice gives it precedence over the other action in that cluster.`
        );
      }
    } else if (placement?.kind === 'routine-sequence') {
      lines.push(
        `This is ${combatant.name}'s attack ${placement.attackNumber} in that combatant's ordinary round routine.`
      );
    } else if (selectedGraphSimultaneousGroup) {
      if (simultaneousPeerLabels.length > 0) {
        lines.push(
          `This action is simultaneous with ${simultaneousPeerLabels.join(
            ' and '
          )}. No narrower rule in this slice gives either action precedence.`
        );
      } else {
        lines.push(
          `This action is part of a simultaneous exchange, so no narrower rule in this slice gives it precedence over the other action in that cluster.`
        );
      }
    } else if (
      hasDirectMeleeEdge &&
      directMeleeEngagement &&
      directMeleeOpponent
    ) {
      lines.push(
        getDirectMeleeWhyHereText({
          node: selectedGraphNode,
          combatant,
          opponent: directMeleeOpponent,
          engagement: directMeleeEngagement,
        })
      );
    } else {
      lines.push(
        `This action has no separate segment call of its own. It follows the ordinary round order shown by the arrows around it.`
      );
    }

    return lines;
  }, [
    combatantById,
    attackNodeById,
    attackNodeLabelById,
    directMeleeEngagementByCombatantIds,
    selectedGraphIncomingEdges,
    selectedGraphNode,
    selectedGraphOutgoingEdges,
    selectedGraphSimultaneousGroup,
    viewModel.combatantNameById,
  ]);
  const getGraphEdgeExplanation = (edge: InitiativeAttackEdge): string => {
    const fromNode = attackNodeById.get(edge.fromNodeId);
    const toNode = attackNodeById.get(edge.toNodeId);
    const fromCombatant = fromNode
      ? combatantById.get(fromNode.combatantId)
      : undefined;
    const toCombatant = toNode
      ? combatantById.get(toNode.combatantId)
      : undefined;
    const fromName =
      (fromNode && attackNodeLabelById[fromNode.id]) || edge.fromNodeId;
    const toName = (toNode && attackNodeLabelById[toNode.id]) || edge.toNodeId;
    const fromDirectMeleeTargetId =
      (fromNode?.placement?.kind === 'direct-melee'
        ? fromNode.placement.opponentId
        : undefined) ||
      fromNode?.targetId ||
      (fromCombatant?.targetIds.length === 1
        ? fromCombatant.targetIds[0]
        : undefined);
    const toDirectMeleeTargetId =
      (toNode?.placement?.kind === 'direct-melee'
        ? toNode.placement.opponentId
        : undefined) ||
      toNode?.targetId ||
      (toCombatant?.targetIds.length === 1
        ? toCombatant.targetIds[0]
        : undefined);
    const directMeleeEngagement =
      fromCombatant && fromDirectMeleeTargetId
        ? directMeleeEngagementByCombatantIds.get(
            getDirectMeleeEngagementKey(
              fromCombatant.id,
              fromDirectMeleeTargetId
            )
          )
        : toCombatant && toDirectMeleeTargetId
        ? directMeleeEngagementByCombatantIds.get(
            getDirectMeleeEngagementKey(toCombatant.id, toDirectMeleeTargetId)
          )
        : fromCombatant && toCombatant
        ? directMeleeEngagementByCombatantIds.get(
            getDirectMeleeEngagementKey(fromCombatant.id, toCombatant.id)
          )
        : undefined;

    return edge.reasons
      .map((reason) => {
        if (reason === 'simple-initiative') {
          if (
            fromNode &&
            toNode &&
            fromNode.combatantId === toNode.combatantId
          ) {
            return `This is the same combatant's ordinary routine order. ${fromName} happens before ${toName}.`;
          }

          if (fromCombatant && toCombatant) {
            const timingExplanation = getInitiativeTimingExplanation(
              fromCombatant,
              toCombatant
            );
            if (timingExplanation) {
              return `${timingExplanation} ${fromName} happens before ${toName}.`;
            }

            const fromInitiative = getEffectiveInitiativeValue(fromCombatant);
            const toInitiative = getEffectiveInitiativeValue(toCombatant);

            if (fromInitiative !== toInitiative) {
              return `${fromCombatant.name}'s effective initiative ${fromInitiative} beats ${toCombatant.name}'s ${toInitiative}, so ${fromName} happens first at this stage of the round.`;
            }
          }

          return `This follows the general round order for this stage.`;
        }

        if (reason === 'action-sequence') {
          if (fromCombatant && toCombatant) {
            const timingExplanation = getInitiativeTimingExplanation(
              fromCombatant,
              toCombatant
            );

            return timingExplanation
              ? `${timingExplanation} ${fromName} is ordered before ${toName}.`
              : `${fromCombatant.name}'s action order puts ${fromName} before ${toName}.`;
          }

          return `${fromName} is ordered before ${toName} by action timing.`;
        }

        if (reason === 'direct-melee') {
          return directMeleeEngagement
            ? getDirectMeleeEdgeExplanation({
                engagement: directMeleeEngagement,
                fromNode,
                toNode,
                fromCombatant,
                toCombatant,
                fromName,
                toName,
              })
            : `${fromCombatant?.name || fromName} and ${
                toCombatant?.name || toName
              } are in direct melee, so initiative decides which blow happens first.`;
        }

        if (reason === 'movement') {
          return getMovementEdgeExplanation({
            fromNode,
            toNode,
            fromCombatant,
            toCombatant,
            fromName,
            toName,
          });
        }

        if (reason === 'spell-casting') {
          if (
            fromNode?.kind === 'spell-start' &&
            toNode?.kind === 'spell-completion'
          ) {
            return toNode.segment !== undefined
              ? `This is the spell's casting span. It starts here and completes at the end of segment ${toNode.segment}.`
              : `This links the spell's start and completion.`;
          }

          return `This is part of the same spell's casting sequence.`;
        }

        if (
          fromNode?.kind === 'spell-completion' &&
          toNode?.kind === 'spell-completion'
        ) {
          if (
            fromNode.segment !== undefined &&
            toNode.segment !== undefined &&
            fromNode.segment === toNode.segment
          ) {
            return `Both spells complete on segment ${
              fromNode.segment
            }, so initiative breaks the tie in favor of ${
              fromCombatant?.name || fromName
            }.`;
          }

          return `${
            fromCombatant?.name || fromName
          } completes early enough to interrupt ${
            toCombatant?.name || toName
          }.`;
        }

        if (toNode?.kind === 'spell-completion') {
          if (
            fromNode?.segmentReason === 'spell-directed' &&
            fromNode.segment !== undefined
          ) {
            return `${
              fromCombatant?.name || fromName
            }'s attack is placed on segment ${
              fromNode.segment
            } against a spell caster under DMG p. 65 rule 2. A successful hit there spoils the spell.`;
          }

          return `${
            fromCombatant?.name || fromName
          } can attack before the spell completes, so a successful hit spoils it.`;
        }

        if (fromNode?.kind === 'spell-completion') {
          return `${fromCombatant?.name || fromName} completes before ${
            toCombatant?.name || toName
          }, so that later action no longer has a chance to spoil the spell.`;
        }

        return `This comes from the spell interruption timing rules.`;
      })
      .join(' ');
  };
  const editedCombatant =
    editorTarget !== undefined
      ? state[getStateSide(editorTarget.side)].find(
          (combatant) => combatant.key === editorTarget.combatantKey
        )
      : undefined;
  const editedCombatantIndex =
    editorTarget !== undefined
      ? state[getStateSide(editorTarget.side)].findIndex(
          (combatant) => combatant.key === editorTarget.combatantKey
        )
      : -1;
  const editedCombatantDisplayName =
    editedCombatant && editorTarget && editedCombatantIndex >= 0
      ? getCombatantDisplayName(
          editorTarget.side,
          editedCombatant,
          editedCombatantIndex
        )
      : undefined;
  const actionEditedCombatant =
    actionEditorTarget !== undefined
      ? state[getStateSide(actionEditorTarget.side)].find(
          (combatant) => combatant.key === actionEditorTarget.combatantKey
        )
      : undefined;
  const actionEditedCombatantIndex =
    actionEditorTarget !== undefined
      ? state[getStateSide(actionEditorTarget.side)].findIndex(
          (combatant) => combatant.key === actionEditorTarget.combatantKey
        )
      : -1;
  const actionEditedCombatantName =
    actionEditedCombatant &&
    actionEditorTarget &&
    actionEditedCombatantIndex >= 0
      ? getCombatantDisplayName(
          actionEditorTarget.side,
          actionEditedCombatant,
          actionEditedCombatantIndex
        )
      : undefined;
  const selectedEditedAction =
    actionEditorTarget?.actions.find(
      (action) => action.id === actionEditorTarget.selectedActionId
    ) || actionEditorTarget?.actions[0];
  const updateSelectedEditedAction = (
    updateAction: (
      action: InitiativePlaytestActionState
    ) => InitiativePlaytestActionState
  ) => {
    setActionEditorTarget((previous) => {
      if (!previous) {
        return previous;
      }

      const selectedAction =
        previous.actions.find(
          (action) => action.id === previous.selectedActionId
        ) || previous.actions[0];

      if (!selectedAction) {
        return previous;
      }

      return {
        ...previous,
        actions: updateActionInList(
          previous.actions,
          selectedAction.id,
          updateAction
        ),
      };
    });
  };
  const actionEditedTargetNames =
    selectedEditedAction?.targetCombatantKeys.map((targetCombatantKey) => {
      const targetSide =
        actionEditorTarget?.side === 'party' ? 'enemy' : 'party';
      const targetCombatants = state[getStateSide(targetSide)];
      const targetIndex = targetCombatants.findIndex(
        (combatant) => combatant.key === targetCombatantKey
      );
      const targetCombatant =
        targetIndex >= 0 ? targetCombatants[targetIndex] : undefined;

      return targetCombatant
        ? getCombatantDisplayName(targetSide, targetCombatant, targetIndex)
        : undefined;
    }) || [];
  const actionEditedTargetSummary =
    actionEditedTargetNames.length > 0
      ? actionEditedTargetNames.filter(Boolean).join(', ')
      : 'No targets selected';
  const actionEditedPrimarySummary = selectedEditedAction
    ? normalizeActionLabel(selectedEditedAction.actionLabel)
      ? formatCompactDeclaredAction(
          selectedEditedAction.declaredAction,
          selectedEditedAction.actionLabel
        )
      : formatCompactDeclarationMeta(
          selectedEditedAction.declaredAction,
          selectedEditedAction.actionLabel,
          selectedEditedAction.actionDistanceInches,
          selectedEditedAction.activationSegments,
          selectedEditedAction.castingSegments
        )
    : undefined;
  const actionEditedSecondarySummary =
    selectedEditedAction !== undefined
      ? [
          normalizeActionLabel(selectedEditedAction.actionLabel)
            ? formatActionTypeMeta(
                selectedEditedAction.declaredAction,
                selectedEditedAction.actionDistanceInches,
                selectedEditedAction.activationSegments,
                selectedEditedAction.castingSegments
              )
            : undefined,
          formatInitiativeTimingMeta(selectedEditedAction.initiativeTiming),
        ]
          .filter((value): value is string => Boolean(value))
          .join(' · ') || undefined
      : undefined;
  const actionEditorDistanceMissing =
    selectedEditedAction !== undefined &&
    requiresDistanceInput(selectedEditedAction.declaredAction) &&
    !hasRequiredDistanceInput(selectedEditedAction.actionDistanceInches);
  const actionEditorDistanceLabel =
    selectedEditedAction?.declaredAction === 'close'
      ? 'Move distance (inches)'
      : 'Distance to target (inches)';
  const targetPickerCombatant = targetPickerTarget
    ? state[getStateSide(targetPickerTarget.attackingSide)].find(
        (combatant) => combatant.key === targetPickerTarget.attackerKey
      )
    : undefined;
  const targetPickerCombatantIndex = targetPickerTarget
    ? state[getStateSide(targetPickerTarget.attackingSide)].findIndex(
        (combatant) => combatant.key === targetPickerTarget.attackerKey
      )
    : -1;
  const targetPickerTargetSide =
    targetPickerTarget?.attackingSide === 'party' ? 'enemy' : 'party';
  const targetPickerDefender = targetPickerTarget
    ? state[getStateSide(targetPickerTargetSide)].find(
        (combatant) => combatant.key === targetPickerTarget.targetKey
      )
    : undefined;
  const targetPickerDefenderIndex = targetPickerTarget
    ? state[getStateSide(targetPickerTargetSide)].findIndex(
        (combatant) => combatant.key === targetPickerTarget.targetKey
      )
    : -1;
  const targetPickerCombatantName =
    targetPickerTarget &&
    targetPickerCombatant &&
    targetPickerCombatantIndex >= 0
      ? getCombatantDisplayName(
          targetPickerTarget.attackingSide,
          targetPickerCombatant,
          targetPickerCombatantIndex
        )
      : undefined;
  const targetPickerDefenderName =
    targetPickerTarget && targetPickerDefender && targetPickerDefenderIndex >= 0
      ? getCombatantDisplayName(
          targetPickerTargetSide,
          targetPickerDefender,
          targetPickerDefenderIndex
        )
      : undefined;
  const targetPickerActions = targetPickerCombatant
    ? getCombatantActions(targetPickerCombatant).filter((action) =>
        usesTargetSelection(action.declaredAction)
      )
    : [];
  const toggleTargetPickerAction = (actionId: string) => {
    if (!targetPickerTarget) {
      return;
    }

    const { attackingSide, attackerKey, targetKey } = targetPickerTarget;
    const stateSide = getStateSide(attackingSide);

    setState((previous) => ({
      ...previous,
      [stateSide]: previous[stateSide].map((combatant) =>
        combatant.key === attackerKey
          ? syncCombatantActions(
              combatant,
              updateActionInList(
                getCombatantActions(combatant),
                actionId,
                (action) =>
                  toggleActionTargetKey(action, targetKey, combatant.weaponId)
              )
            )
          : combatant
      ),
    }));
  };
  const renderGraphNodeReference = (nodeId: string) => {
    const display = graphNodeDisplayById[nodeId];

    if (!display) {
      return nodeId;
    }

    return (
      <span className={styles['graphNodeReference']}>
        <span className={styles['graphNodeReferenceName']}>
          {display.combatantName}
        </span>
        <span className={styles['graphNodeReferenceAction']}>
          {display.actionTitle}
        </span>
        {display.actionMeta ? (
          <span className={styles['graphNodeReferenceMeta']}>
            {display.actionMeta}
          </span>
        ) : null}
      </span>
    );
  };

  return (
    <div className={styles['page']}>
      <div className={styles['hero']}>
        <div>
          <div className={styles['eyebrow']}>AD&amp;D 1e Initiative</div>
          <h1 className={styles['title']}>Initiative Playground</h1>
        </div>
        <div className={styles['presetBar']}>
          <div className={styles['presetMenuWrap']}>
            <button
              type={'button'}
              className={styles['presetButton']}
              aria-expanded={examplesMenuOpen}
              aria-haspopup={'true'}
              onClick={() => setExamplesMenuOpen((previous) => !previous)}
            >
              Examples
            </button>
            {examplesMenuOpen ? (
              <div className={styles['presetMenu']}>
                <button
                  type={'button'}
                  className={styles['presetMenuButton']}
                  onClick={() => loadPreset(createMixedPreset)}
                >
                  Tied Melee
                </button>
                <button
                  type={'button'}
                  className={styles['presetMenuButton']}
                  onClick={() => loadPreset(createChargeInteractionsPreset)}
                >
                  Charge Interactions
                </button>
                <button
                  type={'button'}
                  className={styles['presetMenuButton']}
                  onClick={() => loadPreset(createTurnAndDevicePreset)}
                >
                  Turn and Device
                </button>
                <button
                  type={'button'}
                  className={styles['presetMenuButton']}
                  onClick={() => loadPreset(createSpellCastingPreset)}
                >
                  Spell Casting
                </button>
                <button
                  type={'button'}
                  className={styles['presetMenuButton']}
                  onClick={() => loadPreset(createLargeBattlePreset)}
                >
                  Large Mixed
                </button>
                <button
                  type={'button'}
                  className={styles['presetMenuButton']}
                  onClick={() => loadPreset(createDfCastingAtMeleePreset)}
                >
                  DF: Casting at Melee
                </button>
                <button
                  type={'button'}
                  className={styles['presetMenuButton']}
                  onClick={() => loadPreset(createDfFightersAndClericPreset)}
                >
                  DF: Fighters and Cleric
                </button>
                <button
                  type={'button'}
                  className={styles['presetMenuButton']}
                  onClick={() => loadPreset(createDfPrincePreset)}
                >
                  DF: The Prince
                </button>
                <button
                  type={'button'}
                  className={styles['presetMenuButton']}
                  onClick={() => loadPreset(createDfSpellsAndMeleePreset)}
                >
                  DF: Spells and Melee
                </button>
              </div>
            ) : null}
          </div>
          <button
            type={'button'}
            className={styles['presetButton']}
            onClick={() => void copyShareUrl()}
          >
            Copy Share URL
          </button>
          <button
            type={'button'}
            className={styles['presetButton']}
            aria-expanded={approachOpen}
            onClick={() => {
              setApproachOpen((previous) => !previous);
              setExamplesMenuOpen(false);
            }}
          >
            Approach
          </button>
        </div>
        {shareFeedback ? (
          <div className={styles['shareFeedback']}>{shareFeedback}</div>
        ) : null}
        {approachOpen ? <InitiativeApproachPanel /> : null}
      </div>

      <div className={styles['layout']}>
        <section className={styles['panel']}>
          <div className={styles['matrixSection']}>
            <div className={styles['matrixHeader']}>
              <h3 className={styles['matrixTitle']}>Engagement Matrix</h3>
              <p className={styles['matrixCopy']}>
                Party combatants run across the top, enemies run down the side.
                Set each combatant&apos;s round action from its header, then use
                the cells only to toggle targets. Click the metadata half of a
                row or column header to edit persistent combatant details.
              </p>
            </div>

            {state.party.length > 0 && state.enemies.length > 0 ? (
              <div className={styles['matrixWrap']}>
                <table className={styles['matrixTable']}>
                  <colgroup>
                    <col className={styles['matrixLabelColumn']} />
                    {state.party.map((partyCombatant) => (
                      <col
                        key={`party-column-${partyCombatant.key}`}
                        className={styles['matrixCombatantColumn']}
                      />
                    ))}
                  </colgroup>
                  <thead>
                    <tr>
                      <th className={styles['matrixCorner']}>
                        <div className={styles['matrixCornerTop']}>
                          <div className={styles['matrixCornerHeading']}>
                            <span className={styles['matrixLegendLabel']}>
                              Party vs Enemy
                            </span>
                          </div>
                          <button
                            type={'button'}
                            className={[
                              styles['addButton'],
                              styles['matrixCornerActionParty'],
                            ]
                              .filter(Boolean)
                              .join(' ')}
                            onClick={() => addCombatant('party')}
                          >
                            Add party
                          </button>
                        </div>
                        <div className={styles['matrixSetupGrid']}>
                          <label
                            className={[
                              styles['fieldLabel'],
                              styles['matrixSetupField'],
                              styles['matrixSetupFieldWide'],
                            ]
                              .filter(Boolean)
                              .join(' ')}
                          >
                            <span className={styles['matrixSetupLabel']}>
                              Scenario
                            </span>
                            <input
                              className={[
                                styles['textInput'],
                                styles['matrixSetupInput'],
                              ]
                                .filter(Boolean)
                                .join(' ')}
                              value={state.label}
                              onChange={updateLabel}
                            />
                          </label>
                          <div className={styles['matrixSetupPair']}>
                            <label
                              className={[
                                styles['fieldLabel'],
                                styles['matrixSetupField'],
                              ]
                                .filter(Boolean)
                                .join(' ')}
                            >
                              <span className={styles['matrixSetupLabel']}>
                                Party init
                              </span>
                              <input
                                className={[
                                  styles['textInput'],
                                  styles['matrixSetupInput'],
                                ]
                                  .filter(Boolean)
                                  .join(' ')}
                                inputMode={'numeric'}
                                value={state.partyInitiative}
                                onChange={(event) =>
                                  updateInitiative(
                                    'partyInitiative',
                                    event.target.value
                                  )
                                }
                              />
                            </label>
                            <label
                              className={[
                                styles['fieldLabel'],
                                styles['matrixSetupField'],
                              ]
                                .filter(Boolean)
                                .join(' ')}
                            >
                              <span className={styles['matrixSetupLabel']}>
                                Enemy init
                              </span>
                              <input
                                className={[
                                  styles['textInput'],
                                  styles['matrixSetupInput'],
                                ]
                                  .filter(Boolean)
                                  .join(' ')}
                                inputMode={'numeric'}
                                value={state.enemyInitiative}
                                onChange={(event) =>
                                  updateInitiative(
                                    'enemyInitiative',
                                    event.target.value
                                  )
                                }
                              />
                            </label>
                          </div>
                        </div>
                        <div className={styles['matrixCornerBottom']}>
                          <button
                            type={'button'}
                            className={[
                              styles['addButton'],
                              styles['matrixCornerActionEnemy'],
                            ]
                              .filter(Boolean)
                              .join(' ')}
                            onClick={() => addCombatant('enemy')}
                          >
                            Add enemy
                          </button>
                        </div>
                      </th>
                      {state.party.map((partyCombatant, partyIndex) => {
                        const partyActionSummaries =
                          getMatrixHeaderActionSummaries(partyCombatant);

                        return (
                          <th
                            key={`party-header-${partyCombatant.key}`}
                            className={styles['matrixColumnHeader']}
                          >
                            <div className={styles['matrixColumnHeaderSplit']}>
                              <button
                                type={'button'}
                                className={[
                                  styles['matrixCombatantButton'],
                                  styles['matrixCombatantMetaButton'],
                                ].join(' ')}
                                onClick={() =>
                                  setEditorTarget({
                                    side: 'party',
                                    combatantKey: partyCombatant.key,
                                  })
                                }
                              >
                                <span className={styles['matrixCombatantName']}>
                                  {getCombatantDisplayName(
                                    'party',
                                    partyCombatant,
                                    partyIndex
                                  )}
                                </span>
                                <span className={styles['matrixCombatantMeta']}>
                                  {getCombatantMeta(partyCombatant)}
                                </span>
                              </button>
                              <button
                                type={'button'}
                                className={[
                                  styles['matrixCombatantButton'],
                                  styles['matrixCombatantActionButton'],
                                ].join(' ')}
                                onClick={() =>
                                  openActionEditor('party', partyCombatant.key)
                                }
                              >
                                <span
                                  className={styles['matrixActionSummaryList']}
                                >
                                  {partyActionSummaries.map((actionSummary) => (
                                    <span
                                      key={actionSummary.id}
                                      className={
                                        styles['matrixActionSummaryItem']
                                      }
                                    >
                                      <span
                                        className={
                                          styles['matrixActionSummaryTitle']
                                        }
                                      >
                                        {actionSummary.title}
                                      </span>
                                      {actionSummary.meta ? (
                                        <span
                                          className={
                                            styles['matrixActionSummaryMeta']
                                          }
                                        >
                                          {actionSummary.meta}
                                        </span>
                                      ) : null}
                                    </span>
                                  ))}
                                </span>
                              </button>
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {state.enemies.map((enemyCombatant, enemyIndex) => {
                      const enemyActionSummaries =
                        getMatrixHeaderActionSummaries(enemyCombatant);

                      return (
                        <tr key={`enemy-row-${enemyCombatant.key}`}>
                          <th className={styles['matrixRowHeader']}>
                            <div className={styles['matrixRowHeaderSplit']}>
                              <button
                                type={'button'}
                                className={[
                                  styles['matrixCombatantButton'],
                                  styles['matrixCombatantMetaButton'],
                                ].join(' ')}
                                onClick={() =>
                                  setEditorTarget({
                                    side: 'enemy',
                                    combatantKey: enemyCombatant.key,
                                  })
                                }
                              >
                                <span className={styles['matrixCombatantName']}>
                                  {getCombatantDisplayName(
                                    'enemy',
                                    enemyCombatant,
                                    enemyIndex
                                  )}
                                </span>
                                <span className={styles['matrixCombatantMeta']}>
                                  {getCombatantMeta(enemyCombatant)}
                                </span>
                              </button>
                              <button
                                type={'button'}
                                className={[
                                  styles['matrixCombatantButton'],
                                  styles['matrixCombatantActionButton'],
                                ].join(' ')}
                                onClick={() =>
                                  openActionEditor('enemy', enemyCombatant.key)
                                }
                              >
                                <span
                                  className={styles['matrixActionSummaryList']}
                                >
                                  {enemyActionSummaries.map((actionSummary) => (
                                    <span
                                      key={actionSummary.id}
                                      className={
                                        styles['matrixActionSummaryItem']
                                      }
                                    >
                                      <span
                                        className={
                                          styles['matrixActionSummaryTitle']
                                        }
                                      >
                                        {actionSummary.title}
                                      </span>
                                      {actionSummary.meta ? (
                                        <span
                                          className={
                                            styles['matrixActionSummaryMeta']
                                          }
                                        >
                                          {actionSummary.meta}
                                        </span>
                                      ) : null}
                                    </span>
                                  ))}
                                </span>
                              </button>
                            </div>
                          </th>
                          {state.party.map((partyCombatant, partyIndex) => {
                            const partyPrimaryAction =
                              getPrimaryCombatantAction(partyCombatant);
                            const enemyPrimaryAction =
                              getPrimaryCombatantAction(enemyCombatant);
                            const partyTargetingActions =
                              getActionsTargetingKey(
                                partyCombatant,
                                enemyCombatant.key
                              );
                            const enemyTargetingActions =
                              getActionsTargetingKey(
                                enemyCombatant,
                                partyCombatant.key
                              );
                            const partyTargetsEnemy =
                              partyTargetingActions.length > 0;
                            const enemyTargetsParty =
                              enemyTargetingActions.length > 0;
                            const pairDistance =
                              partyPrimaryAction.actionDistanceInches ||
                              enemyPrimaryAction.actionDistanceInches ||
                              state.pairDistances[
                                getPairDistanceKey(
                                  partyCombatant.key,
                                  enemyCombatant.key
                                )
                              ] ||
                              '';
                            const partyDeclarationLabels = partyTargetsEnemy
                              ? formatMatrixTargetLabels(
                                  partyTargetingActions,
                                  pairDistance
                                )
                              : [];
                            const enemyDeclarationLabels = enemyTargetsParty
                              ? formatMatrixTargetLabels(
                                  enemyTargetingActions,
                                  pairDistance
                                )
                              : [];

                            return (
                              <td
                                key={`matrix-${enemyCombatant.key}-${partyCombatant.key}`}
                                className={styles['matrixCell']}
                              >
                                <div className={styles['matrixCellBody']}>
                                  <div className={styles['matrixCellActions']}>
                                    <button
                                      type={'button'}
                                      className={[
                                        styles['matrixToggle'],
                                        styles['matrixToggleEnemy'],
                                        enemyTargetsParty
                                          ? styles['matrixToggleActiveEnemy']
                                          : styles['matrixToggleIdle'],
                                      ]
                                        .filter(Boolean)
                                        .join(' ')}
                                      disabled={
                                        !canCombatantTarget(enemyCombatant)
                                      }
                                      aria-label={`Declare enemy attack from ${getCombatantDisplayName(
                                        'enemy',
                                        enemyCombatant,
                                        enemyIndex
                                      )} to ${getCombatantDisplayName(
                                        'party',
                                        partyCombatant,
                                        partyIndex
                                      )}`}
                                      onClick={() =>
                                        openTargetPickerOrToggle(
                                          'enemy',
                                          enemyCombatant.key,
                                          partyCombatant.key
                                        )
                                      }
                                    >
                                      {enemyTargetsParty ? (
                                        <>
                                          <span
                                            className={
                                              styles['matrixToggleLabel']
                                            }
                                          >
                                            E&rarr;P
                                          </span>
                                          <span
                                            className={
                                              styles['matrixToggleMeta']
                                            }
                                          >
                                            {enemyDeclarationLabels.map(
                                              (
                                                declarationLabel,
                                                labelIndex
                                              ) => (
                                                <span
                                                  key={`${declarationLabel}-${labelIndex}`}
                                                  className={
                                                    styles[
                                                      'matrixToggleMetaLine'
                                                    ]
                                                  }
                                                >
                                                  {declarationLabel}
                                                </span>
                                              )
                                            )}
                                          </span>
                                        </>
                                      ) : null}
                                    </button>
                                    <button
                                      type={'button'}
                                      className={[
                                        styles['matrixToggle'],
                                        styles['matrixToggleParty'],
                                        partyTargetsEnemy
                                          ? styles['matrixToggleActiveParty']
                                          : styles['matrixToggleIdle'],
                                      ]
                                        .filter(Boolean)
                                        .join(' ')}
                                      disabled={
                                        !canCombatantTarget(partyCombatant)
                                      }
                                      aria-label={`Declare party attack from ${getCombatantDisplayName(
                                        'party',
                                        partyCombatant,
                                        partyIndex
                                      )} to ${getCombatantDisplayName(
                                        'enemy',
                                        enemyCombatant,
                                        enemyIndex
                                      )}`}
                                      onClick={() =>
                                        openTargetPickerOrToggle(
                                          'party',
                                          partyCombatant.key,
                                          enemyCombatant.key
                                        )
                                      }
                                    >
                                      {partyTargetsEnemy ? (
                                        <>
                                          <span
                                            className={
                                              styles['matrixToggleLabel']
                                            }
                                          >
                                            P&rarr;E
                                          </span>
                                          <span
                                            className={
                                              styles['matrixToggleMeta']
                                            }
                                          >
                                            {partyDeclarationLabels.map(
                                              (
                                                declarationLabel,
                                                labelIndex
                                              ) => (
                                                <span
                                                  key={`${declarationLabel}-${labelIndex}`}
                                                  className={
                                                    styles[
                                                      'matrixToggleMetaLine'
                                                    ]
                                                  }
                                                >
                                                  {declarationLabel}
                                                </span>
                                              )
                                            )}
                                          </span>
                                        </>
                                      ) : null}
                                    </button>
                                  </div>
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className={styles['matrixEmpty']}>
                <div>
                  Add at least one party combatant and one enemy combatant to
                  use the engagement matrix.
                </div>
                <div className={styles['matrixLegendActions']}>
                  <button
                    type={'button'}
                    className={styles['addButton']}
                    onClick={() => addCombatant('party')}
                  >
                    Add party
                  </button>
                  <button
                    type={'button'}
                    className={styles['addButton']}
                    onClick={() => addCombatant('enemy')}
                  >
                    Add enemy
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className={styles['panel']}>
          <div className={styles['graphPanel']}>
            <h2 className={styles['graphTitle']}>Precedence DAG</h2>
            <div className={styles['graphWorkspace']}>
              <div className={styles['graphViewportShell']}>
                <div ref={graphViewportRef} className={styles['graphViewport']}>
                  {attackGraph.nodes.length > 0 ? (
                    <div
                      className={styles['graphCanvas']}
                      data-graph-canvas={'true'}
                      style={{
                        width: graphLayout.width,
                        height: graphLayout.height,
                      }}
                    >
                      <svg
                        className={styles['graphSvg']}
                        viewBox={`0 0 ${graphLayout.width} ${graphLayout.height}`}
                        width={graphLayout.width}
                        height={graphLayout.height}
                        aria-label={'Initiative precedence graph'}
                        onMouseMove={(event) => {
                          const target = event.target;

                          if (!(target instanceof Element)) {
                            return;
                          }

                          const nodeElement = target.closest(
                            '[data-graph-node-button="true"]'
                          );
                          const nextHoveredNodeId =
                            nodeElement?.getAttribute('data-graph-node-id') ||
                            undefined;

                          setHoveredGraphNodeId((previous) =>
                            previous === nextHoveredNodeId
                              ? previous
                              : nextHoveredNodeId
                          );
                        }}
                        onMouseLeave={() => {
                          setHoveredGraphNodeId(undefined);
                        }}
                        onClick={() => {
                          if (graphContextMenu) {
                            setGraphContextMenu(undefined);
                          }
                          if (selectedGraphNodeId) {
                            setSelectedGraphNodeId(undefined);
                          }
                        }}
                      >
                        <defs>
                          <marker
                            id={'initiative-dag-arrowhead'}
                            viewBox={'0 0 10 10'}
                            refX={'4'}
                            refY={'5'}
                            markerUnits={'userSpaceOnUse'}
                            markerWidth={'8'}
                            markerHeight={'8'}
                            orient={'auto-start-reverse'}
                          >
                            <path
                              d={'M 0 0 L 10 5 L 0 10 z'}
                              className={styles['graphArrowhead']}
                            />
                          </marker>
                          <marker
                            id={'initiative-dag-arrowhead-highlighted'}
                            viewBox={'0 0 10 10'}
                            refX={'4'}
                            refY={'5'}
                            markerUnits={'userSpaceOnUse'}
                            markerWidth={'8'}
                            markerHeight={'8'}
                            orient={'auto-start-reverse'}
                          >
                            <path
                              d={'M 0 0 L 10 5 L 0 10 z'}
                              className={[
                                styles['graphArrowhead'],
                                styles['graphArrowheadSelected'],
                              ]
                                .filter(Boolean)
                                .join(' ')}
                            />
                          </marker>
                          <marker
                            id={'initiative-dag-arrowhead-spell'}
                            viewBox={'0 0 14 14'}
                            refX={'4'}
                            refY={'7'}
                            markerUnits={'userSpaceOnUse'}
                            markerWidth={'12'}
                            markerHeight={'12'}
                            orient={'auto-start-reverse'}
                          >
                            <path
                              d={'M 0 0 L 14 7 L 0 14 z'}
                              className={styles['graphArrowhead']}
                            />
                          </marker>
                          <marker
                            id={'initiative-dag-arrowhead-spell-highlighted'}
                            viewBox={'0 0 14 14'}
                            refX={'4'}
                            refY={'7'}
                            markerUnits={'userSpaceOnUse'}
                            markerWidth={'12'}
                            markerHeight={'12'}
                            orient={'auto-start-reverse'}
                          >
                            <path
                              d={'M 0 0 L 14 7 L 0 14 z'}
                              className={[
                                styles['graphArrowhead'],
                                styles['graphArrowheadSelected'],
                              ]
                                .filter(Boolean)
                                .join(' ')}
                            />
                          </marker>
                        </defs>

                        {graphLayout.hasSegmentBand ? (
                          <>
                            {graphLayout.segmentColumns.map(
                              (segmentColumn, columnIndex) => (
                                <rect
                                  key={`segment-lane-${segmentColumn.segment}`}
                                  x={segmentColumn.startX}
                                  y={graphLayout.headerLineY}
                                  width={
                                    segmentColumn.endX - segmentColumn.startX
                                  }
                                  height={
                                    graphLayout.segmentBandBottomY -
                                    graphLayout.headerLineY
                                  }
                                  className={[
                                    styles['graphSegmentLane'],
                                    columnIndex % 2 === 0
                                      ? styles['graphSegmentLaneEven']
                                      : styles['graphSegmentLaneOdd'],
                                  ]
                                    .filter(Boolean)
                                    .join(' ')}
                                />
                              )
                            )}
                            <line
                              x1={graphLayout.segmentBoundaryXs[0] || 0}
                              y1={graphLayout.headerLineY}
                              x2={
                                graphLayout.segmentBoundaryXs[
                                  graphLayout.segmentBoundaryXs.length - 1
                                ] || 0
                              }
                              y2={graphLayout.headerLineY}
                              className={styles['graphSegmentHeaderLine']}
                            />
                            <line
                              x1={graphLayout.segmentBoundaryXs[0] || 0}
                              y1={graphLayout.segmentBandBottomY}
                              x2={
                                graphLayout.segmentBoundaryXs[
                                  graphLayout.segmentBoundaryXs.length - 1
                                ] || 0
                              }
                              y2={graphLayout.segmentBandBottomY}
                              className={styles['graphSegmentBandLine']}
                            />
                            {graphLayout.segmentColumns.map((segmentColumn) => (
                              <g
                                key={`segment-column-${segmentColumn.segment}`}
                              >
                                <text
                                  x={segmentColumn.centerX}
                                  y={graphLayout.headerLabelY}
                                  textAnchor={'middle'}
                                  className={styles['graphSegmentColumnLabel']}
                                >
                                  {segmentColumn.segment}
                                </text>
                              </g>
                            ))}
                            {graphLayout.segmentBoundaryXs.map((boundaryX) => (
                              <line
                                key={`segment-boundary-${boundaryX}`}
                                x1={boundaryX}
                                y1={graphLayout.headerLineY}
                                x2={boundaryX}
                                y2={graphLayout.segmentBandBottomY}
                                className={styles['graphSegmentGuide']}
                              />
                            ))}
                          </>
                        ) : null}

                        {graphLayout.simultaneousGroups.map((group) => (
                          <rect
                            key={`simultaneous-group-${group.nodeIds.join(
                              '-'
                            )}`}
                            x={group.x}
                            y={group.y}
                            width={group.width}
                            height={group.height}
                            rx={18}
                            className={styles['graphSimultaneousGroup']}
                          />
                        ))}

                        {graphEdgesInRenderOrder.map((edge) => {
                          const isHighlighted =
                            hoveredGraphNodeId !== undefined &&
                            (edge.fromNodeId === hoveredGraphNodeId ||
                              edge.toNodeId === hoveredGraphNodeId);
                          const isSpellCastingEdge =
                            edge.reasons.includes('spell-casting');
                          const fromNode = attackNodeById.get(edge.fromNodeId);
                          const fromStatus =
                            graphNodeStatusById[edge.fromNodeId];

                          return (
                            <path
                              key={`${edge.fromNodeId}-${edge.toNodeId}-${
                                isHighlighted ? 'highlighted' : 'normal'
                              }`}
                              d={edge.path}
                              className={[
                                styles['graphEdge'],
                                isSpellCastingEdge
                                  ? styles['graphEdgeSpellCasting']
                                  : '',
                                fromStatus === 'resolved'
                                  ? styles['graphEdgeResolved']
                                  : '',
                                fromStatus === 'resolved' &&
                                fromNode?.side === 'party'
                                  ? styles['graphEdgeResolvedParty']
                                  : '',
                                fromStatus === 'resolved' &&
                                fromNode?.side === 'enemy'
                                  ? styles['graphEdgeResolvedEnemy']
                                  : '',
                                fromStatus === 'lost'
                                  ? styles['graphEdgeLost']
                                  : '',
                                fromStatus === 'lost' &&
                                fromNode?.side === 'party'
                                  ? styles['graphEdgeLostParty']
                                  : '',
                                fromStatus === 'lost' &&
                                fromNode?.side === 'enemy'
                                  ? styles['graphEdgeLostEnemy']
                                  : '',
                                isHighlighted
                                  ? styles['graphEdgeSelected']
                                  : '',
                              ]
                                .filter(Boolean)
                                .join(' ')}
                              markerEnd={
                                isSpellCastingEdge
                                  ? isHighlighted
                                    ? 'url(#initiative-dag-arrowhead-spell-highlighted)'
                                    : 'url(#initiative-dag-arrowhead-spell)'
                                  : isHighlighted
                                  ? 'url(#initiative-dag-arrowhead-highlighted)'
                                  : 'url(#initiative-dag-arrowhead)'
                              }
                            />
                          );
                        })}

                        {graphLayout.nodes.map((layoutNode) => {
                          const node = attackNodeById.get(layoutNode.nodeId);
                          if (!node) {
                            return null;
                          }

                          const display = graphNodeDisplayById[node.id];
                          if (!display) {
                            return null;
                          }

                          const isSelected = selectedGraphNode?.id === node.id;
                          const nodeStatus = graphNodeStatusById[node.id];
                          const isEnabled =
                            nodeStatus === undefined &&
                            enabledGraphNodeIds.has(node.id);
                          const lineYs = getInitiativeAttackGraphNodeLineYs(
                            layoutNode.height,
                            display.lines.length
                          );

                          return (
                            <g
                              key={layoutNode.nodeId}
                              transform={`translate(${layoutNode.x} ${layoutNode.y})`}
                              role={'button'}
                              tabIndex={0}
                              data-graph-node-button={'true'}
                              data-graph-node-id={node.id}
                              aria-label={`${display.combatantName}, target ${display.targetLabel}, ${display.actionLabel}`}
                              onClick={(event) => {
                                event.stopPropagation();
                                setGraphContextMenu(undefined);
                                toggleSelectedGraphNode(node.id);
                              }}
                              onContextMenu={(event) => {
                                event.preventDefault();
                                event.stopPropagation();

                                const canvasElement =
                                  graphViewportRef.current?.querySelector(
                                    '[data-graph-canvas="true"]'
                                  );
                                const canvasRect =
                                  canvasElement?.getBoundingClientRect();

                                if (!canvasRect) {
                                  return;
                                }

                                setSelectedGraphNodeId(undefined);
                                setGraphContextMenu({
                                  nodeId: node.id,
                                  left: Math.min(
                                    Math.max(
                                      8,
                                      event.clientX - canvasRect.left + 10
                                    ),
                                    Math.max(8, graphLayout.width - 190)
                                  ),
                                  top: Math.min(
                                    Math.max(
                                      8,
                                      event.clientY - canvasRect.top + 10
                                    ),
                                    Math.max(8, graphLayout.height - 128)
                                  ),
                                });
                              }}
                              onFocus={() => setHoveredGraphNodeId(node.id)}
                              onBlur={() =>
                                setHoveredGraphNodeId((previous) =>
                                  previous === node.id ? undefined : previous
                                )
                              }
                              onKeyDown={(event) => {
                                if (
                                  event.key === 'Enter' ||
                                  event.key === ' '
                                ) {
                                  event.preventDefault();
                                  toggleSelectedGraphNode(node.id);
                                }
                              }}
                            >
                              <rect
                                x={0}
                                y={0}
                                width={layoutNode.width}
                                height={layoutNode.height}
                                rx={16}
                                style={{
                                  fill: getGraphNodeFill(node.side, nodeStatus),
                                }}
                                className={[
                                  styles['graphNodeCard'],
                                  node.side === 'party'
                                    ? styles['graphNodeParty']
                                    : styles['graphNodeEnemy'],
                                  nodeStatus === 'resolved'
                                    ? styles['graphNodeResolved']
                                    : '',
                                  nodeStatus === 'resolved' &&
                                  node.side === 'party'
                                    ? styles['graphNodePartyResolved']
                                    : '',
                                  nodeStatus === 'resolved' &&
                                  node.side === 'enemy'
                                    ? styles['graphNodeEnemyResolved']
                                    : '',
                                  nodeStatus === 'lost'
                                    ? styles['graphNodeLost']
                                    : '',
                                  nodeStatus === 'lost' && node.side === 'party'
                                    ? styles['graphNodePartyLost']
                                    : '',
                                  nodeStatus === 'lost' && node.side === 'enemy'
                                    ? styles['graphNodeEnemyLost']
                                    : '',
                                  isSelected ? styles['graphNodeSelected'] : '',
                                ]
                                  .filter(Boolean)
                                  .join(' ')}
                              />
                              {isEnabled ? (
                                <g aria-label={GRAPH_NODE_ENABLED_LABEL}>
                                  <circle
                                    cx={13}
                                    cy={13}
                                    r={8}
                                    className={styles['graphNodeEnabledBadge']}
                                  />
                                  <path
                                    d={'M 10 8.5 L 10 17.5 L 17 13 z'}
                                    className={
                                      styles['graphNodeEnabledBadgeIcon']
                                    }
                                  />
                                </g>
                              ) : null}
                              {nodeStatus ? (
                                <g
                                  aria-label={getGraphNodeStatusLabel(
                                    nodeStatus
                                  )}
                                >
                                  <circle
                                    cx={layoutNode.width - 13}
                                    cy={13}
                                    r={9}
                                    className={[
                                      styles['graphNodeStatusBadge'],
                                      nodeStatus === 'resolved'
                                        ? styles['graphNodeStatusBadgeResolved']
                                        : styles['graphNodeStatusBadgeLost'],
                                    ]
                                      .filter(Boolean)
                                      .join(' ')}
                                  />
                                  <text
                                    x={layoutNode.width - 13}
                                    y={13}
                                    textAnchor={'middle'}
                                    dominantBaseline={'central'}
                                    className={[
                                      styles['graphNodeStatusBadgeText'],
                                      nodeStatus === 'lost'
                                        ? styles['graphNodeStatusBadgeTextLost']
                                        : '',
                                    ]
                                      .filter(Boolean)
                                      .join(' ')}
                                  >
                                    {GRAPH_NODE_STATUS_BADGE[nodeStatus].symbol}
                                  </text>
                                </g>
                              ) : null}
                              {display.lines.map((line, index) => (
                                <text
                                  key={`${layoutNode.nodeId}-line-${index}`}
                                  x={layoutNode.width / 2}
                                  y={lineYs[index]}
                                  textAnchor={'middle'}
                                  dominantBaseline={'middle'}
                                  className={[
                                    line.kind === 'name'
                                      ? styles['graphNodeName']
                                      : line.kind === 'target'
                                      ? styles['graphNodeTarget']
                                      : styles['graphNodeAction'],
                                    nodeStatus === 'resolved'
                                      ? styles['graphNodeTextResolved']
                                      : '',
                                    nodeStatus === 'lost'
                                      ? styles['graphNodeTextLost']
                                      : '',
                                    line.kind === 'name' &&
                                    nodeStatus === 'resolved'
                                      ? styles['graphNodeNameResolved']
                                      : '',
                                    line.kind === 'name' &&
                                    nodeStatus === 'lost'
                                      ? styles['graphNodeNameLost']
                                      : '',
                                    line.isSecondary
                                      ? styles['graphNodeActionSecondary']
                                      : '',
                                  ]
                                    .filter(Boolean)
                                    .join(' ')}
                                >
                                  {line.text}
                                </text>
                              ))}
                            </g>
                          );
                        })}
                      </svg>
                      {contextMenuGraphNode && graphContextMenu ? (
                        <div
                          ref={graphContextMenuRef}
                          className={styles['graphContextMenu']}
                          style={{
                            left: graphContextMenu.left,
                            top: graphContextMenu.top,
                          }}
                          onClick={(event) => event.stopPropagation()}
                        >
                          <button
                            type={'button'}
                            className={styles['graphContextMenuButton']}
                            onClick={() =>
                              applyGraphNodeStatus(
                                contextMenuGraphNode.id,
                                'resolved'
                              )
                            }
                            disabled={contextMenuGraphNodeStatus === 'resolved'}
                          >
                            Resolve
                          </button>
                          <button
                            type={'button'}
                            className={styles['graphContextMenuButton']}
                            onClick={() =>
                              applyGraphNodeStatus(
                                contextMenuGraphNode.id,
                                'lost'
                              )
                            }
                            disabled={contextMenuGraphNodeStatus === 'lost'}
                          >
                            {contextMenuGraphNodeLostLabel}
                          </button>
                          {contextMenuGraphNodeStatus ? (
                            <button
                              type={'button'}
                              className={styles['graphContextMenuButton']}
                              onClick={() =>
                                applyGraphNodeStatus(
                                  contextMenuGraphNode.id,
                                  undefined
                                )
                              }
                            >
                              Clear status
                            </button>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <div className={styles['graphEmpty']}>
                      Add combatants to generate a precedence graph.
                    </div>
                  )}
                  {selectedGraphNode && selectedGraphPopoverPosition ? (
                    <div
                      ref={graphPopoverRef}
                      className={[
                        styles['graphInspector'],
                        styles['graphPopover'],
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      style={selectedGraphPopoverPosition}
                      onClick={(event) => event.stopPropagation()}
                    >
                      <div className={styles['graphInspectorHeader']}>
                        <div className={styles['graphInspectorTitle']}>
                          {renderGraphNodeReference(selectedGraphNode.id)}
                        </div>
                      </div>
                      <div className={styles['graphInspectorMeta']}>
                        <span>
                          Side:{' '}
                          {selectedGraphNode.side === 'party'
                            ? 'Party'
                            : 'Enemy'}
                        </span>
                        {selectedGraphNode.segment !== undefined ? (
                          <span>Segment: {selectedGraphNode.segment}</span>
                        ) : null}
                        <span>
                          Status:{' '}
                          {selectedGraphNodeStatus
                            ? getGraphNodeStatusLabel(selectedGraphNodeStatus)
                            : 'Pending'}
                        </span>
                      </div>
                      <div className={styles['graphInspectorActions']}>
                        <button
                          type={'button'}
                          className={[
                            styles['graphInspectorButton'],
                            styles['graphInspectorButtonResolve'],
                          ]
                            .filter(Boolean)
                            .join(' ')}
                          onClick={() =>
                            applyGraphNodeStatus(
                              selectedGraphNode.id,
                              'resolved'
                            )
                          }
                          disabled={selectedGraphNodeStatus === 'resolved'}
                        >
                          Resolve
                        </button>
                        <button
                          type={'button'}
                          className={[
                            styles['graphInspectorButton'],
                            styles['graphInspectorButtonLost'],
                          ]
                            .filter(Boolean)
                            .join(' ')}
                          onClick={() =>
                            applyGraphNodeStatus(selectedGraphNode.id, 'lost')
                          }
                          disabled={selectedGraphNodeStatus === 'lost'}
                        >
                          {selectedGraphLostLabel}
                        </button>
                        {selectedGraphNodeStatus ? (
                          <button
                            type={'button'}
                            className={[
                              styles['graphInspectorButton'],
                              styles['graphInspectorButtonClear'],
                            ]
                              .filter(Boolean)
                              .join(' ')}
                            onClick={() =>
                              applyGraphNodeStatus(
                                selectedGraphNode.id,
                                undefined
                              )
                            }
                          >
                            Clear status
                          </button>
                        ) : null}
                      </div>

                      <div className={styles['graphInspectorSection']}>
                        <h4 className={styles['graphSubhead']}>Why Here</h4>
                        <ol className={styles['graphInspectorPlainList']}>
                          {selectedGraphWhyHere.map((line, index) => (
                            <li
                              key={`why-here-${selectedGraphNode.id}-${index}`}
                              className={styles['graphInspectorPlainItem']}
                            >
                              <span className={styles['stepDetail']}>
                                {line}
                              </span>
                            </li>
                          ))}
                        </ol>
                      </div>

                      {selectedGraphIncomingEdges.length > 0 ? (
                        <div className={styles['graphInspectorSection']}>
                          <h4 className={styles['graphSubhead']}>Blocked By</h4>
                          <ol className={styles['graphInspectorList']}>
                            {selectedGraphIncomingEdges.map((edge) => (
                              <li
                                key={`incoming-${edge.fromNodeId}-${edge.toNodeId}`}
                                className={styles['graphInspectorItem']}
                              >
                                <button
                                  type={'button'}
                                  className={styles['graphInspectorLinkButton']}
                                  onClick={() =>
                                    openGraphNode(edge.fromNodeId, true)
                                  }
                                >
                                  {renderGraphNodeReference(edge.fromNodeId)}
                                </button>
                                <span className={styles['stepDetail']}>
                                  {getGraphEdgeExplanation(edge)}
                                </span>
                              </li>
                            ))}
                          </ol>
                        </div>
                      ) : null}

                      {selectedGraphOutgoingTargets.length > 0 ? (
                        <div className={styles['graphInspectorSection']}>
                          <h4 className={styles['graphSubhead']}>Blocks</h4>
                          <ul className={styles['graphInspectorLinkList']}>
                            {selectedGraphOutgoingTargets.map((target) => (
                              <li key={`outgoing-target-${target.nodeId}`}>
                                <button
                                  type={'button'}
                                  className={styles['graphInspectorLinkButton']}
                                  onClick={() =>
                                    openGraphNode(target.nodeId, true)
                                  }
                                >
                                  {renderGraphNodeReference(target.nodeId)}
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
      {editedCombatant && editorTarget && modalRoot
        ? createPortal(
            <>
              <div
                className={styles['modalShadow']}
                onClick={() => setEditorTarget(undefined)}
              />
              <div
                className={styles['modal']}
                role={'dialog'}
                aria-modal={'true'}
                aria-labelledby={'initiative-editor-title'}
              >
                <div
                  id={'initiative-editor-title'}
                  className={styles['modalTitle']}
                >
                  {editorTarget.side === 'party'
                    ? 'Edit Party Combatant'
                    : 'Edit Enemy Combatant'}
                </div>
                <p className={styles['modalText']}>
                  Target declarations are edited from the engagement matrix. Use
                  this modal to change the combatant label, movement, weapon, or
                  missile timing metadata.
                </p>
                <label
                  className={styles['modalLabel']}
                  htmlFor={`initiative-name-${editedCombatant.key}`}
                >
                  Name
                </label>
                <input
                  id={`initiative-name-${editedCombatant.key}`}
                  className={styles['textInput']}
                  type={'text'}
                  value={editedCombatant.name}
                  onChange={(event) =>
                    updateCombatant(editorTarget.side, editedCombatant.key, {
                      name: event.target.value,
                    })
                  }
                />
                <label className={styles['modalLabel']}>Weapon</label>
                <Select
                  instanceId={`initiative-weapon-${editedCombatant.key}`}
                  styles={customStyles}
                  menuPortalTarget={menuPortalTarget}
                  menuPosition={'fixed'}
                  value={
                    ALL_WEAPON_OPTIONS.find(
                      (option) => option.value === editedCombatant.weaponId
                    ) || null
                  }
                  options={ALL_WEAPON_OPTIONS}
                  onChange={(option: SingleValue<WeaponOption>) => {
                    if (!option) {
                      return;
                    }

                    updateCombatant(editorTarget.side, editedCombatant.key, {
                      weaponId: option.value,
                    });
                  }}
                />
                <label
                  className={styles['modalLabel']}
                  htmlFor={`initiative-move-${editedCombatant.key}`}
                >
                  Movement rate
                </label>
                <input
                  id={`initiative-move-${editedCombatant.key}`}
                  className={styles['textInput']}
                  inputMode={'decimal'}
                  type={'text'}
                  value={editedCombatant.movementRate}
                  onChange={(event) =>
                    updateCombatant(editorTarget.side, editedCombatant.key, {
                      movementRate: event.target.value,
                    })
                  }
                />
                <label
                  className={styles['modalLabel']}
                  htmlFor={`initiative-missile-init-${editedCombatant.key}`}
                >
                  Missile initiative adj
                </label>
                <select
                  id={`initiative-missile-init-${editedCombatant.key}`}
                  className={styles['selectInput']}
                  value={editedCombatant.missileInitiativeAdjustment}
                  onChange={(event) =>
                    updateCombatant(editorTarget.side, editedCombatant.key, {
                      missileInitiativeAdjustment: event.target.value,
                    })
                  }
                >
                  {MISSILE_INITIATIVE_ADJUSTMENT_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <p className={styles['modalHint']}>
                  DMG Dexterity missile-initiative adjustment. This affects only
                  missile timing, not melee or movement order.
                </p>
                {movementSuppressesPositiveReactionInitiativeBonuses(
                  parseOptionalNumber(editedCombatant.movementRate) ?? 12
                ) &&
                parseMissileInitiativeAdjustment(
                  editedCombatant.missileInitiativeAdjustment
                ) > 0 ? (
                  <p className={styles['modalHint']}>
                    PHB encumbrance treats movement below 12&quot; as normal, no
                    reaction or initiative bonuses. Positive missile-initiative
                    bonuses are ignored at this movement rate.
                  </p>
                ) : null}
                <div className={styles['modalMeta']}>
                  <span className={styles['modalMetaLabel']}>
                    Current display
                  </span>
                  <span className={styles['modalMetaValue']}>
                    {editedCombatantDisplayName}
                  </span>
                  <span className={styles['modalMetaValue']}>
                    {getCombatantMeta(editedCombatant)}
                  </span>
                </div>
                <div className={styles['modalActions']}>
                  <button
                    type={'button'}
                    className={styles['modalButtonDanger']}
                    onClick={() =>
                      removeCombatant(editorTarget.side, editedCombatant.key)
                    }
                  >
                    Remove combatant
                  </button>
                  <button
                    type={'button'}
                    className={styles['modalButton']}
                    onClick={() => setEditorTarget(undefined)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </>,
            modalRoot
          )
        : null}
      {actionEditorTarget &&
      actionEditedCombatant &&
      selectedEditedAction &&
      modalRoot
        ? createPortal(
            <>
              <div
                className={styles['modalShadow']}
                onClick={() => setActionEditorTarget(undefined)}
              />
              <div
                className={styles['modal']}
                role={'dialog'}
                aria-modal={'true'}
                aria-labelledby={'initiative-attack-editor-title'}
              >
                <div
                  id={'initiative-attack-editor-title'}
                  className={styles['modalTitle']}
                >
                  Edit Action
                </div>
                <p className={styles['modalText']}>
                  Set the round action for{' '}
                  <strong>{actionEditedCombatantName}</strong>. Choose targets
                  in the engagement matrix when the action needs one; any
                  distance or timing entered here applies to the whole
                  declaration.
                </p>
                <div className={styles['actionList']}>
                  {actionEditorTarget.actions.map((action, actionIndex) => (
                    <button
                      key={action.id}
                      type={'button'}
                      className={[
                        styles['actionListButton'],
                        action.id === selectedEditedAction.id
                          ? styles['actionListButtonActive']
                          : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      onClick={() =>
                        setActionEditorTarget((previous) =>
                          previous
                            ? {
                                ...previous,
                                selectedActionId: action.id,
                              }
                            : previous
                        )
                      }
                    >
                      <span className={styles['actionListButtonTitle']}>
                        {actionIndex === 0
                          ? 'Main'
                          : `Action ${actionIndex + 1}`}
                      </span>
                      <span className={styles['actionListButtonMeta']}>
                        {[
                          formatCompactDeclaredAction(
                            action.declaredAction,
                            action.actionLabel
                          ),
                          formatInitiativeTimingMeta(action.initiativeTiming),
                        ]
                          .filter((value): value is string => Boolean(value))
                          .join(' · ')}
                      </span>
                    </button>
                  ))}
                  <button
                    type={'button'}
                    className={styles['actionListAddButton']}
                    onClick={() =>
                      setActionEditorTarget((previous) => {
                        if (!previous) {
                          return previous;
                        }

                        const nextAction: InitiativePlaytestActionState = {
                          id: getNextActionIdForActions(previous.actions),
                          declaredAction: 'none',
                          actionLabel: 'Extra action',
                          actionDistanceInches: '',
                          activationSegments: '',
                          castingSegments: '',
                          attackRoutineCount: '1',
                          targetCombatantKeys: [],
                        };

                        return {
                          ...previous,
                          selectedActionId: nextAction.id,
                          actions: previous.actions.concat(nextAction),
                        };
                      })
                    }
                  >
                    Add action
                  </button>
                </div>
                <label
                  className={styles['modalLabel']}
                  htmlFor={'initiative-attack-action'}
                >
                  Action
                </label>
                <select
                  id={'initiative-attack-action'}
                  className={styles['selectInput']}
                  value={selectedEditedAction.declaredAction}
                  onChange={(event) => {
                    const declaredAction = event.target
                      .value as InitiativeDeclaredAction;

                    updateSelectedEditedAction((action) =>
                      normalizeActionStateForCombatant(
                        {
                          ...action,
                          declaredAction,
                          castingSegments:
                            declaredAction === 'spell-casting'
                              ? action.castingSegments || '1'
                              : action.castingSegments,
                        },
                        actionEditedCombatant.weaponId
                      )
                    );
                  }}
                >
                  {getAvailableActionOptions(
                    actionEditedCombatant.weaponId
                  ).map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <label
                  className={styles['modalLabel']}
                  htmlFor={'initiative-attack-label'}
                >
                  Action label
                </label>
                <input
                  id={'initiative-attack-label'}
                  className={styles['textInput']}
                  type={'text'}
                  placeholder={'e.g. Drink potion'}
                  maxLength={INITIATIVE_ACTION_LABEL_MAX_LENGTH}
                  value={selectedEditedAction.actionLabel || ''}
                  onChange={(event) =>
                    updateSelectedEditedAction((action) => ({
                      ...action,
                      actionLabel: event.target.value,
                    }))
                  }
                />
                <label
                  className={styles['modalLabel']}
                  htmlFor={'initiative-attack-timing'}
                >
                  Initiative timing
                </label>
                <select
                  id={'initiative-attack-timing'}
                  className={styles['selectInput']}
                  value={getActionInitiativeTiming(selectedEditedAction)}
                  onChange={(event) => {
                    const initiativeTiming = event.target
                      .value as InitiativeTimingOverride;

                    updateSelectedEditedAction((action) => ({
                      ...action,
                      ...(initiativeTiming === 'normal'
                        ? { initiativeTiming: undefined }
                        : { initiativeTiming }),
                    }));
                  }}
                >
                  {INITIATIVE_TIMING_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p className={styles['modalHint']}>
                  Use this only for effects such as speed weapons or slow that
                  explicitly make this action win or lose initiative.
                </p>
                {requiresAttackRoutineCountInput(
                  selectedEditedAction.declaredAction,
                  actionEditedCombatant.weaponId
                ) ? (
                  <>
                    <label
                      className={styles['modalLabel']}
                      htmlFor={'initiative-attack-routines'}
                    >
                      Attack routines this round
                    </label>
                    <input
                      id={'initiative-attack-routines'}
                      className={styles['textInput']}
                      inputMode={'numeric'}
                      type={'text'}
                      value={selectedEditedAction.attackRoutineCount}
                      onChange={(event) =>
                        updateSelectedEditedAction((action) => ({
                          ...action,
                          attackRoutineCount: event.target.value,
                        }))
                      }
                    />
                    <p className={styles['modalHint']}>
                      Use <strong>1</strong> for an ordinary weapon routine or a
                      natural routine such as claw/claw/bite.
                    </p>
                  </>
                ) : null}
                {requiresDistanceInput(selectedEditedAction.declaredAction) ? (
                  <>
                    <label
                      className={styles['modalLabel']}
                      htmlFor={'initiative-attack-distance'}
                    >
                      {actionEditorDistanceLabel}
                    </label>
                    <input
                      id={'initiative-attack-distance'}
                      className={styles['textInput']}
                      inputMode={'decimal'}
                      type={'text'}
                      placeholder={'e.g. 4'}
                      value={selectedEditedAction.actionDistanceInches}
                      onChange={(event) =>
                        updateSelectedEditedAction((action) => ({
                          ...action,
                          actionDistanceInches: event.target.value,
                        }))
                      }
                    />
                    <p className={styles['modalHint']}>
                      {selectedEditedAction.declaredAction === 'close'
                        ? 'Enter the tabletop inches being crossed. With no selected target, the graph marks when this move finishes.'
                        : 'Enter the current effective range in tabletop inches. The DM can translate from the actual battlefield during play.'}
                    </p>
                  </>
                ) : null}
                {requiresActivationSegmentsInput(
                  selectedEditedAction.declaredAction
                ) ? (
                  <>
                    <label
                      className={styles['modalLabel']}
                      htmlFor={'initiative-attack-activation-segments'}
                    >
                      Activation time
                    </label>
                    <select
                      id={'initiative-attack-activation-segments'}
                      className={styles['selectInput']}
                      value={selectedEditedAction.activationSegments}
                      onChange={(event) =>
                        updateSelectedEditedAction((action) => ({
                          ...action,
                          activationSegments: event.target.value,
                        }))
                      }
                    >
                      {ACTIVATION_SEGMENT_OPTIONS.map((option) => (
                        <option key={option.label} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <p className={styles['modalHint']}>
                      {getActionTimingHint(selectedEditedAction.declaredAction)}
                    </p>
                  </>
                ) : null}
                {requiresCastingSegmentsInput(
                  selectedEditedAction.declaredAction
                ) ? (
                  <>
                    <label
                      className={styles['modalLabel']}
                      htmlFor={'initiative-attack-casting-segments'}
                    >
                      Casting time
                    </label>
                    <select
                      id={'initiative-attack-casting-segments'}
                      className={styles['selectInput']}
                      value={selectedEditedAction.castingSegments}
                      onChange={(event) =>
                        updateSelectedEditedAction((action) => ({
                          ...action,
                          castingSegments: event.target.value,
                        }))
                      }
                    >
                      {SPELL_CASTING_TIME_OPTIONS.map((option) => (
                        <option key={option.label} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <p className={styles['modalHint']}>
                      {getActionTimingHint(selectedEditedAction.declaredAction)}
                    </p>
                  </>
                ) : null}
                {selectedEditedAction.declaredAction === 'none' ? (
                  <p className={styles['modalHint']}>
                    This combatant is spending the round on a non-combat action.
                    Add a label to show it as an untimed initiative-controlled
                    graph entry; unlabeled non-combat actions are omitted and
                    target selections are ignored.
                  </p>
                ) : null}
                {selectedEditedAction.declaredAction === 'missile' ? (
                  <p className={styles['modalHint']}>
                    This missile volley can currently be declared against up to{' '}
                    <strong>
                      {getMissileTargetLimitForWeaponId(
                        actionEditedCombatant.weaponId
                      )}
                    </strong>{' '}
                    target
                    {getMissileTargetLimitForWeaponId(
                      actionEditedCombatant.weaponId
                    ) === 1
                      ? ''
                      : 's'}
                    . If you pick more, the newest selections replace the oldest
                    ones.
                  </p>
                ) : null}
                {selectedEditedAction.declaredAction === 'close' ? (
                  <p className={styles['modalHint']}>
                    Move/Close can have one target or no target. With a target,
                    it resolves closing to striking range; without one, it marks
                    movement completion.
                  </p>
                ) : selectedEditedAction.declaredAction === 'magical-device' ? (
                  <p className={styles['modalHint']}>
                    Magical device use can have multiple targets or no target.
                    Leave targets empty for self or targetless activations such
                    as drinking a potion.
                  </p>
                ) : isSingleTargetDeclarationAction(
                    selectedEditedAction.declaredAction
                  ) ? (
                  <p className={styles['modalHint']}>
                    This action uses only one target. If more than one cell is
                    selected, only the first target will be kept when you save.
                  </p>
                ) : null}
                <div className={styles['modalMeta']}>
                  <span className={styles['modalMetaLabel']}>
                    Current action
                  </span>
                  <span
                    className={[
                      styles['modalMetaValue'],
                      styles['modalMetaValuePrimary'],
                    ].join(' ')}
                  >
                    {actionEditedPrimarySummary}
                  </span>
                  {actionEditedSecondarySummary ? (
                    <span
                      className={[
                        styles['modalMetaValue'],
                        styles['modalMetaValueSecondary'],
                      ].join(' ')}
                    >
                      {actionEditedSecondarySummary}
                    </span>
                  ) : null}
                  <span className={styles['modalMetaLabel']}>Targets</span>
                  <span className={styles['modalMetaValue']}>
                    {actionEditedTargetSummary}
                  </span>
                </div>
                <div className={styles['modalActions']}>
                  {selectedEditedAction.targetCombatantKeys.length > 0 ? (
                    <button
                      type={'button'}
                      className={styles['modalButtonDanger']}
                      onClick={clearActionDeclaration}
                    >
                      Clear targets
                    </button>
                  ) : (
                    <span />
                  )}
                  <div className={styles['modalActionGroup']}>
                    {selectedEditedAction.id !== MAIN_ACTION_ID ? (
                      <button
                        type={'button'}
                        className={styles['modalButtonDanger']}
                        onClick={() =>
                          setActionEditorTarget((previous) => {
                            if (!previous) {
                              return previous;
                            }

                            const nextActions = previous.actions.filter(
                              (action) => action.id !== selectedEditedAction.id
                            );

                            return {
                              ...previous,
                              selectedActionId:
                                nextActions[0]?.id || MAIN_ACTION_ID,
                              actions: nextActions,
                            };
                          })
                        }
                      >
                        Remove action
                      </button>
                    ) : null}
                    <button
                      type={'button'}
                      className={styles['modalButton']}
                      onClick={() => setActionEditorTarget(undefined)}
                    >
                      Cancel
                    </button>
                    <button
                      type={'button'}
                      className={styles['modalButton']}
                      onClick={saveActionDeclaration}
                      disabled={actionEditorDistanceMissing}
                    >
                      Save action
                    </button>
                  </div>
                </div>
              </div>
            </>,
            modalRoot
          )
        : null}
      {targetPickerTarget &&
      targetPickerCombatant &&
      targetPickerDefender &&
      modalRoot
        ? createPortal(
            <>
              <div
                className={styles['modalShadow']}
                onClick={() => setTargetPickerTarget(undefined)}
              />
              <div
                className={styles['modal']}
                role={'dialog'}
                aria-modal={'true'}
                aria-labelledby={'initiative-target-picker-title'}
              >
                <div
                  id={'initiative-target-picker-title'}
                  className={styles['modalTitle']}
                >
                  Assign Target
                </div>
                <p className={styles['modalText']}>
                  Choose which actions from{' '}
                  <strong>{targetPickerCombatantName}</strong> apply to{' '}
                  <strong>{targetPickerDefenderName}</strong>.
                </p>
                <div className={styles['targetPickerList']}>
                  {targetPickerActions.map((action, actionIndex) => {
                    const isChecked = action.targetCombatantKeys.includes(
                      targetPickerTarget.targetKey
                    );

                    return (
                      <label
                        key={action.id}
                        className={styles['targetPickerOption']}
                      >
                        <input
                          className={styles['targetPickerCheckbox']}
                          type={'checkbox'}
                          checked={isChecked}
                          onChange={() => toggleTargetPickerAction(action.id)}
                        />
                        <span className={styles['targetPickerText']}>
                          <span className={styles['targetPickerTitle']}>
                            {actionIndex === 0
                              ? 'Main action'
                              : `Action ${actionIndex + 1}`}
                          </span>
                          <span className={styles['targetPickerMeta']}>
                            {[
                              formatCompactDeclarationMeta(
                                action.declaredAction,
                                action.actionLabel,
                                action.actionDistanceInches,
                                action.activationSegments,
                                action.castingSegments
                              ),
                              formatInitiativeTimingMeta(
                                action.initiativeTiming
                              ),
                            ]
                              .filter((value): value is string =>
                                Boolean(value)
                              )
                              .join(' · ')}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
                <p className={styles['modalHint']}>
                  Single-target actions replace their previous target when
                  checked here.
                </p>
                <div className={styles['modalActions']}>
                  <span />
                  <div className={styles['modalActionGroup']}>
                    <button
                      type={'button'}
                      className={styles['modalButton']}
                      onClick={() => setTargetPickerTarget(undefined)}
                    >
                      Done
                    </button>
                  </div>
                </div>
              </div>
            </>,
            modalRoot
          )
        : null}
    </div>
  );
};

export default InitiativePlayground;
