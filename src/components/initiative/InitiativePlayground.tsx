import { createPortal } from 'react-dom';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import type { SingleValue } from 'react-select';
import Select from 'react-select';
import { buildInitiativeAttackGraph } from '../../helpers/initiative/attackGraph';
import { buildInitiativeAttackGraphLayout } from '../../helpers/initiative/attackGraphLayout';
import { getMultipleAttackThreshold } from '../../helpers/initiative/openMelee';
import {
  encodeInitiativePlaytestState,
  type InitiativePlaytestCombatantState,
  type InitiativePlaytestState,
} from '../../helpers/initiativeCodec';
import { buildInitiativeRoundResolutionViewModel } from '../../helpers/initiative/roundResolutionViewModel';
import { resolveInitiativeRound } from '../../helpers/initiative/roundResolution';
import { buildInitiativeScenario } from '../../helpers/initiative/scenario';
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
  InitiativeDeclaredAction,
  DirectMeleeEngagement,
  InitiativeScenarioCombatant,
  InitiativeScenarioDraft,
  InitiativeScenarioDraftCombatant,
} from '../../types/initiative';
import type { WeaponOption } from '../../types/option';
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
  action: InitiativeDeclaredAction;
  attackRoutineCount: string;
  distanceInches: string;
  activationSegments: string;
  castingSegments: string;
}

const ALL_WEAPON_OPTIONS = getWeaponOptions(MONSTER);
const ACTION_OPTIONS: Array<{
  value: InitiativeDeclaredAction;
  label: string;
}> = [
  { value: 'none', label: 'No combat action' },
  { value: 'open-melee', label: 'Open melee' },
  { value: 'close', label: 'Close' },
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

const ACTIVATION_SEGMENT_OPTIONS: Array<{
  value: string;
  label: string;
}> = [
  { value: '', label: 'None' },
  { value: '1', label: '1 segment' },
  { value: '2', label: '2 segments' },
  { value: '3', label: '3 segments' },
  { value: '4', label: '4 segments' },
  { value: '5', label: '5 segments' },
  { value: '6', label: '6 segments' },
];

const SPELL_CASTING_TIME_OPTIONS: Array<{
  value: string;
  label: string;
}> = [
  { value: '0', label: 'Instant' },
  { value: '1', label: '1 segment' },
  { value: '2', label: '2 segments' },
  { value: '3', label: '3 segments' },
  { value: '4', label: '4 segments' },
  { value: '5', label: '5 segments' },
  { value: '6', label: '6 segments' },
  { value: '7', label: '7 segments' },
  { value: '8', label: '8 segments' },
  { value: '9', label: '9 segments' },
  { value: '10', label: '10+ segments' },
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

const parseActivationSegments = (value: string): number | undefined => {
  const parsed = parseOptionalNumber(value);

  if (parsed === undefined) {
    return undefined;
  }

  return Math.max(1, Math.min(6, Math.floor(parsed)));
};

const parseCastingSegments = (value: string): number | undefined => {
  const parsed = parseOptionalNumber(value);

  if (parsed === undefined) {
    return undefined;
  }

  return Math.max(0, Math.min(10, Math.floor(parsed)));
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
  declaredAction === 'set-vs-charge' ||
  declaredAction === 'magical-device';

const requiresDistanceInput = (
  declaredAction: InitiativeDeclaredAction
): boolean => declaredAction === 'close' || declaredAction === 'charge';

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

const formatDeclarationMeta = (
  declaredAction: InitiativeDeclaredAction,
  distanceInches: string,
  activationSegments: string,
  castingSegments: string
): string => {
  if (
    requiresDistanceInput(declaredAction) &&
    distanceInches.trim().length > 0
  ) {
    return `${formatDeclaredAction(declaredAction)} · ${distanceInches}"`;
  }

  if (
    requiresActivationSegmentsInput(declaredAction) &&
    activationSegments.trim().length > 0
  ) {
    return `${formatDeclaredAction(declaredAction)} · ${activationSegments} ${
      activationSegments === '1' ? 'segment' : 'segments'
    }`;
  }

  if (
    requiresCastingSegmentsInput(declaredAction) &&
    castingSegments.trim().length > 0
  ) {
    if (castingSegments === '0') {
      return `${formatDeclaredAction(declaredAction)} · Instant`;
    }

    return `${formatDeclaredAction(declaredAction)} · ${
      castingSegments === '10'
        ? '10+ segments'
        : `${castingSegments} ${
            castingSegments === '1' ? 'segment' : 'segments'
          }`
    }`;
  }

  return formatDeclaredAction(declaredAction);
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
  declaredAction,
  movementRate,
  actionDistanceInches,
  activationSegments,
  castingSegments,
  missileInitiativeAdjustment,
  attackRoutineCount,
  weaponId,
  targetCombatantKeys,
});

const createMixedPreset = (): InitiativePlaytestState => ({
  label: 'Mixed Open Melee',
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

const createEnemyEdgePreset = (): InitiativePlaytestState => ({
  label: 'Enemy Initiative Edge',
  partyInitiative: '2',
  enemyInitiative: '5',
  nextCombatantKey: 5,
  party: [createCombatant(1, 'Hugh', 2, [3]), createCombatant(2, 'Lysa', 17)],
  enemies: [
    createCombatant(3, 'Orc', 1, [1]),
    createCombatant(4, 'Orc Archer', 16),
  ],
  pairDistances: {},
  attackActivationSegments: {},
  attackCastingSegments: {},
});

const createScrumPreset = (): InitiativePlaytestState => ({
  label: 'Ambiguous Scrum',
  partyInitiative: '6',
  enemyInitiative: '1',
  nextCombatantKey: 6,
  party: [
    createCombatant(1, 'Moryn', 2, [4]),
    createCombatant(2, 'Sella', 3, [4]),
    createCombatant(3, 'Tarn', 16),
  ],
  enemies: [
    createCombatant(4, 'Bugbear', 1, [1]),
    createCombatant(5, 'Kobold', 1),
  ],
  pairDistances: {},
  attackActivationSegments: {},
  attackCastingSegments: {},
});

const createChargePreset = (): InitiativePlaytestState => ({
  label: 'Charge Contact',
  partyInitiative: '3',
  enemyInitiative: '5',
  nextCombatantKey: 5,
  party: [
    createCombatant(1, 'Garran', 56, [3], 'charge', '12'),
    createCombatant(2, 'Ysra', 49, [], 'missile', '12'),
  ],
  enemies: [
    createCombatant(3, 'Hobgoblin', 57, [1], 'open-melee', '9'),
    createCombatant(4, 'Goblin Archer', 16, [], 'missile', '6'),
  ],
  pairDistances: {
    [getPairDistanceKey(1, 3)]: '4',
  },
  attackActivationSegments: {},
  attackCastingSegments: {},
});

const createSetVsChargePreset = (): InitiativePlaytestState => ({
  label: 'Set vs Charge',
  partyInitiative: '2',
  enemyInitiative: '5',
  nextCombatantKey: 4,
  party: [createCombatant(1, 'Doran', 50, [3], 'set-vs-charge', '12')],
  enemies: [createCombatant(3, 'Raider', 56, [1], 'charge', '12')],
  pairDistances: {
    [getPairDistanceKey(1, 3)]: '4',
  },
  attackActivationSegments: {},
  attackCastingSegments: {},
});

const createMissileVsChargePreset = (): InitiativePlaytestState => ({
  label: 'Missile vs Charge',
  partyInitiative: '5',
  enemyInitiative: '2',
  nextCombatantKey: 4,
  party: [createCombatant(1, 'Bowman', 11, [3], 'missile', '12')],
  enemies: [createCombatant(3, 'Raider', 56, [1], 'charge', '12')],
  pairDistances: {
    [getPairDistanceKey(1, 3)]: '4',
  },
  attackActivationSegments: {},
  attackCastingSegments: {},
});

const createMissileDexEdgePreset = (): InitiativePlaytestState => ({
  label: 'Missile Dex Edge',
  partyInitiative: '3',
  enemyInitiative: '5',
  nextCombatantKey: 4,
  party: [createCombatant(1, 'Bowman', 11, [3], 'missile', '12', '1', '+3')],
  enemies: [createCombatant(3, 'Raider', 56, [1], 'charge', '12')],
  pairDistances: {
    [getPairDistanceKey(1, 3)]: '4',
  },
  attackActivationSegments: {},
  attackCastingSegments: {},
});

const createTurnUndeadPreset = (): InitiativePlaytestState => ({
  label: 'Turn Undead',
  partyInitiative: '3',
  enemyInitiative: '5',
  nextCombatantKey: 4,
  party: [createCombatant(1, 'Sister Arda', 17, [3], 'turn-undead', '12')],
  enemies: [createCombatant(3, 'Skeleton', 1, [1], 'open-melee', '12')],
  pairDistances: {},
  attackActivationSegments: {},
  attackCastingSegments: {},
});

const createMagicalDevicePreset = (): InitiativePlaytestState => ({
  label: 'Magical Device',
  partyInitiative: '3',
  enemyInitiative: '5',
  nextCombatantKey: 4,
  party: [createCombatant(1, 'Rodric', 17, [3], 'magical-device', '12')],
  enemies: [createCombatant(3, 'Skeleton', 1, [1], 'open-melee', '12')],
  pairDistances: {},
  attackActivationSegments: {
    [getAttackDeclarationKey('party', 1, 3)]: '3',
  },
  attackCastingSegments: {},
});

const createSpellCastingPreset = (): InitiativePlaytestState => ({
  label: 'Spell Casting',
  partyInitiative: '5',
  enemyInitiative: '4',
  nextCombatantKey: 4,
  party: [createCombatant(1, 'Mereth', 17, [3], 'spell-casting', '12')],
  enemies: [createCombatant(3, 'Hobgoblin', 17, [1], 'open-melee', '12')],
  pairDistances: {},
  attackActivationSegments: {},
  attackCastingSegments: {
    [getAttackDeclarationKey('party', 1, 3)]: '6',
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
    createCombatant(3, 'Ysra', 49, [9], 'missile', '12'),
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
  attackActivationSegments: {},
  attackCastingSegments: {},
});

const buildDraftCombatants = (
  side: InitiativePlaytestSide,
  combatants: InitiativePlaytestCombatant[],
  pairDistances: Record<string, string>,
  attackActivationSegments: Record<string, string>,
  attackCastingSegments: Record<string, string>
): InitiativeScenarioDraftCombatant[] =>
  combatants.map((combatant) => ({
    combatantKey: combatant.key,
    name: combatant.name.trim() || undefined,
    declaredAction: combatant.declaredAction,
    movementRate: parseOptionalNumber(combatant.movementRate),
    actionDistanceInches:
      parseOptionalNumber(combatant.actionDistanceInches) ??
      (() => {
        if (combatant.targetCombatantKeys.length !== 1) {
          return undefined;
        }

        const targetCombatantKey = combatant.targetCombatantKeys[0];
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
      })(),
    activationSegments:
      parseActivationSegments(combatant.activationSegments) ??
      (() => {
        if (combatant.targetCombatantKeys.length !== 1) {
          return undefined;
        }

        const targetCombatantKey = combatant.targetCombatantKeys[0];
        if (targetCombatantKey === undefined) {
          return undefined;
        }
        return parseActivationSegments(
          attackActivationSegments[
            getAttackDeclarationKey(side, combatant.key, targetCombatantKey)
          ] || ''
        );
      })(),
    castingSegments:
      parseCastingSegments(combatant.castingSegments) ??
      (() => {
        const prefix = `${side}:${combatant.key}:`;
        const storedCastingSegments = Object.entries(
          attackCastingSegments
        ).find(
          ([declarationKey, value]) =>
            declarationKey.startsWith(prefix) && value.trim().length > 0
        )?.[1];
        return parseCastingSegments(storedCastingSegments || '');
      })(),
    missileInitiativeAdjustment: parseMissileInitiativeAdjustment(
      combatant.missileInitiativeAdjustment
    ),
    attackRoutineCount: parseAttackRoutineCount(combatant.attackRoutineCount),
    weaponId: combatant.weaponId,
    targetCombatantKeys: combatant.targetCombatantKeys,
  }));

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

const getCombatantMeta = (combatant: InitiativePlaytestCombatant): string =>
  [
    `MV ${combatant.movementRate.trim() || '12'}"`,
    getWeaponSummary(combatant.weaponId),
    getWeaponInfo(combatant.weaponId)?.weaponType === 'missile' &&
    parseMissileInitiativeAdjustment(combatant.missileInitiativeAdjustment) !==
      0
      ? `MI ${
          parseMissileInitiativeAdjustment(
            combatant.missileInitiativeAdjustment
          ) > 0
            ? '+'
            : ''
        }${parseMissileInitiativeAdjustment(
          combatant.missileInitiativeAdjustment
        )}`
      : undefined,
  ]
    .filter(Boolean)
    .join(' · ');

const getCombatantActionMeta = (
  combatant: InitiativePlaytestCombatant
): string =>
  formatDeclarationMeta(
    combatant.declaredAction,
    combatant.actionDistanceInches,
    combatant.activationSegments,
    combatant.castingSegments
  );

const getCombatantActionHint = (
  combatant: InitiativePlaytestCombatant
): string | undefined => {
  const actionMeta = getCombatantActionMeta(combatant);
  const actionLabel = formatDeclaredAction(combatant.declaredAction);

  if (actionMeta === actionLabel) {
    return undefined;
  }

  const metaPrefix = `${actionLabel} · `;
  return actionMeta.startsWith(metaPrefix)
    ? actionMeta.slice(metaPrefix.length)
    : actionMeta;
};

const getCombatantTargetSummary = (
  combatant: InitiativePlaytestCombatant
): string => {
  if (!usesTargetSelection(combatant.declaredAction)) {
    return 'No targets used';
  }

  const targetCount = combatant.targetCombatantKeys.length;

  if (targetCount === 0) {
    return 'No targets';
  }

  return `${targetCount} ${targetCount === 1 ? 'target' : 'targets'}`;
};

const isNonMissileWeaponId = (weaponId: number): boolean =>
  getWeaponInfo(weaponId)?.weaponType !== 'missile';

const getEffectiveInitiativeValue = (
  combatant: InitiativeScenarioCombatant
): number =>
  combatant.initiative +
  (combatant.declaredAction === 'missile'
    ? combatant.missileInitiativeAdjustment
    : 0);

const truncateGraphText = (text: string, maxLength: number): string =>
  text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;

const getGraphActionLines = (text: string): string[] => {
  const [actionLabel, suffixLabel] = text.split(' · ');

  if (!actionLabel || !suffixLabel) {
    return [truncateGraphText(text, 20)];
  }

  return [
    truncateGraphText(actionLabel, 16),
    truncateGraphText(suffixLabel, 16),
  ];
};

type GraphNodeDisplayLineKind = 'name' | 'target' | 'action';

interface GraphNodeDisplayLine {
  text: string;
  kind: GraphNodeDisplayLineKind;
  isSecondary?: boolean;
}

interface GraphNodeDisplay {
  combatantName: string;
  targetLabel: string;
  actionLabel: string;
  lines: GraphNodeDisplayLine[];
  width: number;
  height: number;
}

const GRAPH_NODE_MIN_WIDTH = 102;
const GRAPH_NODE_MAX_WIDTH = 132;
const GRAPH_NODE_HEIGHT = 66;
const GRAPH_NODE_HORIZONTAL_PADDING = 14;
const GRAPH_NODE_LINE_GAP = 14;
const GRAPH_POPOVER_WIDTH = 320;
const GRAPH_POPOVER_GAP = 14;
const GRAPH_POPOVER_MARGIN = 10;
const GRAPH_POPOVER_FALLBACK_HEIGHT = 320;

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

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
        fromCombatant.initiative > toCombatant.initiative
          ? fromCombatant
          : toCombatant;
      const loser =
        winner.id === fromCombatant.id ? toCombatant : fromCombatant;

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

const estimateGraphNodeLineWidth = (
  text: string,
  kind: GraphNodeDisplayLineKind
): number =>
  text.length * (kind === 'name' ? 6.6 : kind === 'target' ? 5.8 : 5.2);

const getGraphNodeWidth = (lines: GraphNodeDisplayLine[]): number =>
  clamp(
    Math.max(
      ...lines.map(
        (line) =>
          estimateGraphNodeLineWidth(line.text, line.kind) +
          GRAPH_NODE_HORIZONTAL_PADDING * 2
      )
    ),
    GRAPH_NODE_MIN_WIDTH,
    GRAPH_NODE_MAX_WIDTH
  );

const getGraphNodeLineYs = (height: number, lineCount: number): number[] => {
  const totalSpan = (lineCount - 1) * GRAPH_NODE_LINE_GAP;
  const centerY = height / 2 + 1;

  return Array.from(
    { length: lineCount },
    (_unusedValue, index) =>
      centerY - totalSpan / 2 + index * GRAPH_NODE_LINE_GAP
  );
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
  Record<'unresolved' | GraphNodeStatus, string>
> = {
  party: {
    unresolved: '#6F8E34',
    resolved: '#556C2E',
    lost: '#3E4D28',
  },
  enemy: {
    unresolved: '#9A4E40',
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
): string => GRAPH_NODE_FILL_BY_SIDE[side][status || 'unresolved'];

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
  const graphPopoverRef = useRef<HTMLDivElement | null>(null);
  const graphContextMenuRef = useRef<HTMLDivElement | null>(null);
  const graphViewportRef = useRef<HTMLDivElement | null>(null);
  const pendingGraphRevealNodeIdRef = useRef<string | undefined>(undefined);
  const [graphPopoverHeight, setGraphPopoverHeight] = useState<number>(
    GRAPH_POPOVER_FALLBACK_HEIGHT
  );
  const [graphContextMenu, setGraphContextMenu] = useState<
    GraphContextMenuState | undefined
  >(undefined);
  const scenario = useMemo(
    () => buildInitiativeScenario(buildDraftFromState(state)),
    [state]
  );
  const resolution = useMemo(
    () => resolveInitiativeRound(scenario),
    [scenario]
  );
  const attackGraph = useMemo(
    () => buildInitiativeAttackGraph(scenario, resolution),
    [resolution, scenario]
  );
  const viewModel = useMemo(
    () => buildInitiativeRoundResolutionViewModel(scenario, resolution),
    [resolution, scenario]
  );
  const simpleOrderCard = viewModel.cards.find(
    (card) => card.kind === 'simple-order'
  );
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
      Object.fromEntries(
        attackGraph.nodes.map((node) => {
          const combatantName =
            viewModel.combatantNameById[node.combatantId] || node.combatantId;
          const combatant = combatantById.get(node.combatantId);

          let targetLabel = 'No target';
          if (node.targetId) {
            targetLabel =
              viewModel.combatantNameById[node.targetId] || node.targetId;
          } else if (combatant?.targetIds.length === 1) {
            const targetId = combatant.targetIds[0];
            targetLabel = targetId
              ? viewModel.combatantNameById[targetId] || targetId
              : 'No target';
          } else if ((combatant?.targetIds.length || 0) > 1) {
            targetLabel = 'Multiple targets';
          }

          const actionLabel = combatant
            ? node.kind === 'spell-start'
              ? 'Cast spell · start'
              : node.kind === 'spell-completion'
              ? 'Cast spell · complete'
              : `${formatDeclaredAction(combatant.declaredAction)} · ${
                  node.label
                }`
            : 'Unknown action';
          const actionLines = getGraphActionLines(actionLabel);
          const lines: GraphNodeDisplayLine[] = [
            {
              text: truncateGraphText(combatantName, 18),
              kind: 'name',
            },
            {
              text: truncateGraphText(`→ ${targetLabel}`, 18),
              kind: 'target',
            },
            ...actionLines.map((actionLine, index) => ({
              text: actionLine,
              kind: 'action' as const,
              isSecondary: index > 0,
            })),
          ];

          return [
            node.id,
            {
              combatantName,
              targetLabel,
              actionLabel,
              lines,
              width: getGraphNodeWidth(lines),
              height: GRAPH_NODE_HEIGHT,
            } as GraphNodeDisplay,
          ];
        })
      ),
    [attackGraph.nodes, combatantById, viewModel.combatantNameById]
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

              if (
                changes.declaredAction &&
                !usesTargetSelection(changes.declaredAction)
              ) {
                updatedCombatant.targetCombatantKeys = [];
              }

              if (
                changes.declaredAction &&
                isSingleTargetDeclarationAction(changes.declaredAction) &&
                updatedCombatant.targetCombatantKeys.length > 1
              ) {
                updatedCombatant.targetCombatantKeys =
                  updatedCombatant.targetCombatantKeys.slice(0, 1);
              }

              if (changes.weaponId !== undefined) {
                updatedCombatant.declaredAction =
                  normalizeDeclaredActionForWeapon(
                    updatedCombatant.declaredAction,
                    changes.weaponId
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

    const firstTargetKey = combatant.targetCombatantKeys[0];
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

    setActionEditorTarget({
      side,
      combatantKey,
      action: combatant.declaredAction,
      attackRoutineCount: combatant.attackRoutineCount,
      distanceInches:
        combatant.actionDistanceInches ||
        (pairKey ? state.pairDistances[pairKey] || '' : ''),
      activationSegments:
        combatant.activationSegments ||
        (declarationKey
          ? state.attackActivationSegments[declarationKey] || ''
          : ''),
      castingSegments:
        combatant.castingSegments ||
        (combatant.declaredAction === 'spell-casting'
          ? getStoredCastingSegmentsForAttacker(state, side, combatantKey) ||
            '1'
          : declarationKey
          ? state.attackCastingSegments[declarationKey] || ''
          : ''),
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
        combatant.targetCombatantKeys.includes(combatantKey)
          ? {
              ...combatant,
              targetCombatantKeys: combatant.targetCombatantKeys.filter(
                (targetKey) => targetKey !== combatantKey
              ),
            }
          : combatant
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

    const {
      side,
      combatantKey,
      action,
      attackRoutineCount,
      distanceInches,
      activationSegments,
      castingSegments,
    } = actionEditorTarget;
    const stateSide = getStateSide(side);

    setState((previous) => {
      const attackingCombatant = previous[stateSide].find(
        (combatant) => combatant.key === combatantKey
      );

      if (!attackingCombatant) {
        return previous;
      }

      const nextTargetCombatantKeys = !usesTargetSelection(action)
        ? []
        : isSingleTargetDeclarationAction(action)
        ? attackingCombatant.targetCombatantKeys.slice(0, 1)
        : action === 'missile'
        ? attackingCombatant.targetCombatantKeys.slice(
            0,
            getMissileTargetLimitForWeaponId(attackingCombatant.weaponId)
          )
        : attackingCombatant.targetCombatantKeys;

      return {
        ...previous,
        [stateSide]: previous[stateSide].map((combatant) =>
          combatant.key !== combatantKey
            ? combatant
            : {
                ...combatant,
                declaredAction: action,
                actionDistanceInches: requiresDistanceInput(action)
                  ? distanceInches
                  : '',
                activationSegments: requiresActivationSegmentsInput(action)
                  ? activationSegments
                  : '',
                castingSegments: requiresCastingSegmentsInput(action)
                  ? castingSegments
                  : '',
                attackRoutineCount: requiresAttackRoutineCountInput(
                  action,
                  combatant.weaponId
                )
                  ? attackRoutineCount
                  : combatant.attackRoutineCount,
                targetCombatantKeys: nextTargetCombatantKeys,
              }
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

      if (
        !attackingCombatant ||
        !usesTargetSelection(attackingCombatant.declaredAction)
      ) {
        return previous;
      }

      const isSelected =
        attackingCombatant.targetCombatantKeys.includes(targetKey);
      let nextTargetCombatantKeys: number[];

      if (isSelected) {
        nextTargetCombatantKeys = attackingCombatant.targetCombatantKeys.filter(
          (existingTargetKey) => existingTargetKey !== targetKey
        );
      } else if (
        isSingleTargetDeclarationAction(attackingCombatant.declaredAction)
      ) {
        nextTargetCombatantKeys = [targetKey];
      } else {
        nextTargetCombatantKeys =
          attackingCombatant.targetCombatantKeys.concat(targetKey);

        if (attackingCombatant.declaredAction === 'missile') {
          nextTargetCombatantKeys = nextTargetCombatantKeys.slice(
            -getMissileTargetLimitForWeaponId(attackingCombatant.weaponId)
          );
        }
      }

      return {
        ...previous,
        [stateSide]: previous[stateSide].map((combatant) =>
          combatant.key === attackerKey
            ? {
                ...combatant,
                targetCombatantKeys: nextTargetCombatantKeys,
              }
            : combatant
        ),
      };
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
          ? {
              ...combatant,
              targetCombatantKeys: [],
            }
          : combatant
      ),
    }));

    setActionEditorTarget(undefined);
  };

  const attackNodeLabelById = useMemo(
    () =>
      Object.fromEntries(
        attackGraph.nodes.map((node) => [
          node.id,
          `${
            viewModel.combatantNameById[node.combatantId] || node.combatantId
          } ${node.label}`,
        ])
      ),
    [attackGraph.nodes, viewModel.combatantNameById]
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
      const hasUnresolvedBlockers = blockerIds
        ? Array.from(blockerIds).some(
            (blockerId) => graphNodeStatusById[blockerId] === undefined
          )
        : false;

      return !hasUnresolvedBlockers;
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

    const preferredRight =
      selectedGraphNodeLayout.x +
      selectedGraphNodeLayout.width +
      GRAPH_POPOVER_GAP;
    const maxLeft = Math.max(
      GRAPH_POPOVER_MARGIN,
      graphLayout.width - GRAPH_POPOVER_WIDTH - GRAPH_POPOVER_MARGIN
    );
    const placeLeft =
      preferredRight >
      graphLayout.width - GRAPH_POPOVER_WIDTH - GRAPH_POPOVER_MARGIN;
    const maxTop = Math.max(
      GRAPH_POPOVER_MARGIN,
      graphLayout.height - graphPopoverHeight - GRAPH_POPOVER_MARGIN
    );
    const preferredTop = Math.max(
      GRAPH_POPOVER_MARGIN,
      selectedGraphNodeLayout.y - 6
    );

    return {
      left: placeLeft
        ? Math.max(
            GRAPH_POPOVER_MARGIN,
            selectedGraphNodeLayout.x - GRAPH_POPOVER_WIDTH - GRAPH_POPOVER_GAP
          )
        : Math.min(preferredRight, maxLeft),
      top: Math.min(preferredTop, maxTop),
    };
  }, [
    graphLayout.height,
    graphLayout.width,
    graphPopoverHeight,
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
  const movementResolutionByCombatantId = useMemo(
    () =>
      new Map(
        resolution.movementResolutions.map((movementResolution) => [
          movementResolution.combatantId,
          movementResolution,
        ])
      ),
    [resolution.movementResolutions]
  );
  const selectedGraphWhyHere = useMemo(() => {
    if (!selectedGraphNode) {
      return [];
    }

    const combatant = combatantById.get(selectedGraphNode.combatantId);
    if (!combatant) {
      return [];
    }

    const lines: string[] = [];
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
    const hasMovementEdge = relatedEdges.some((edge) =>
      edge.reasons.includes('movement')
    );
    const targetName = selectedGraphNode.targetId
      ? viewModel.combatantNameById[selectedGraphNode.targetId] ||
        selectedGraphNode.targetId
      : undefined;
    const movementResolution = movementResolutionByCombatantId.get(
      combatant.id
    );
    const targetCombatant = selectedGraphNode.targetId
      ? combatantById.get(selectedGraphNode.targetId)
      : undefined;
    const directMeleeOpponentId =
      directMeleeEdge?.fromNodeId === selectedGraphNode.id
        ? attackNodeById.get(directMeleeEdge.toNodeId)?.combatantId
        : directMeleeEdge?.toNodeId === selectedGraphNode.id
        ? attackNodeById.get(directMeleeEdge.fromNodeId)?.combatantId
        : undefined;
    const directMeleeOpponentName = directMeleeOpponentId
      ? viewModel.combatantNameById[directMeleeOpponentId] ||
        directMeleeOpponentId
      : undefined;
    const directMeleeTargetId =
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
    } else if (selectedGraphNode.kind === 'contact') {
      lines.push(
        `Contact is reached on segment ${selectedGraphNode.segment}. This marks the moment movement closes to melee without assuming an automatic same-round blow.`
      );
    } else if (selectedGraphSimultaneousGroup) {
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
    } else if (selectedGraphNode.segmentReason === 'spell-directed') {
      if (
        targetName &&
        targetInitiative !== undefined &&
        targetInitiative > combatantInitiative
      ) {
        lines.push(
          `${combatant.name}'s attack is directed at ${targetName}. Since ${
            targetCombatant?.side === 'party' ? 'Party' : 'Enemy'
          } won initiative ${targetInitiative} to ${combatantInitiative}, attacks against ${targetName} land on segment ${
            selectedGraphNode.segment
          } (DMG p. 65 rule 2).`
        );
      } else if (
        targetName &&
        targetInitiative !== undefined &&
        targetInitiative === combatantInitiative
      ) {
        lines.push(
          `${combatant.name}'s attack is directed at ${targetName}. With initiative tied at ${targetInitiative}, attacks against ${targetName} land on segment ${selectedGraphNode.segment} (DMG p. 65 rule 2).`
        );
      } else {
        lines.push(
          `${combatant.name}'s attack is directed at ${
            targetName || 'a spell caster'
          }. DMG p. 65 rule 2 places that attack on segment ${
            selectedGraphNode.segment
          }.`
        );
      }
    } else if (
      selectedGraphNode.segmentReason === 'declared-action' &&
      combatant.declaredAction === 'magical-device'
    ) {
      lines.push(
        `${combatant.name}'s device use is on segment ${selectedGraphNode.segment} because its declared activation time places it there.`
      );
    } else if (
      selectedGraphNode.kind === 'attack' &&
      selectedGraphNode.segment !== undefined &&
      (hasMovementEdge ||
        movementResolution?.contactSegment === selectedGraphNode.segment)
    ) {
      if (movementResolution?.distanceInches !== undefined) {
        lines.push(
          `${combatant.name}'s attack is on segment ${selectedGraphNode.segment} because, at movement rate ${combatant.movementRate}", it can cover ${movementResolution.distanceInches}" and reach contact by then.`
        );
      } else {
        lines.push(
          `${combatant.name}'s attack is on segment ${selectedGraphNode.segment} because movement contact is reached by then.`
        );
      }
    } else if (
      selectedGraphNode.kind === 'attack' &&
      combatant.declaredAction === 'missile'
    ) {
      lines.push(
        selectedGraphNode.targetId !== undefined &&
          combatant.targetIds.length > 1
          ? `${combatant.name}'s missile volley is split across multiple targets. This node is the shot aimed at ${targetName}.`
          : `${combatant.name}'s missile volley stays unsegmented. Ordinary firing rate is treated as one initiative-controlled volley rather than as separate early and late shots.`
      );
    } else if (
      selectedGraphNode.kind === 'attack' &&
      combatant.declaredAction === 'turn-undead'
    ) {
      lines.push(
        `${combatant.name}'s turning attempt is initiative-controlled, but it has no separate segment timing.`
      );
    } else if (
      selectedGraphNode.kind === 'attack' &&
      combatant.declaredAction === 'magical-device'
    ) {
      lines.push(
        `${combatant.name}'s device use stays unsegmented because no activation time was declared for it.`
      );
    } else if (hasDirectMeleeEdge) {
      if (directMeleeEngagement && directMeleeOpponent) {
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
          `${combatant.name}${
            targetName
              ? ` and ${targetName}`
              : directMeleeOpponentName
              ? ` and ${directMeleeOpponentName}`
              : ''
          } are in direct melee, so initiative determines the order of their blows here.`
        );
      }
    } else if (
      selectedGraphNode.kind === 'attack' &&
      combatant.attackRoutine.components.length > 1 &&
      combatant.declaredAction !== 'missile'
    ) {
      lines.push(
        `This is ${combatant.name}'s attack ${selectedGraphNode.attackNumber} in that combatant's ordinary round routine.`
      );
    } else {
      lines.push(
        `This action has no separate segment timing, so its order comes from the other actions it must happen before or after.`
      );
    }

    return lines;
  }, [
    combatantById,
    attackNodeById,
    attackNodeLabelById,
    movementResolutionByCombatantId,
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
      fromNode?.targetId ||
      (fromCombatant?.targetIds.length === 1
        ? fromCombatant.targetIds[0]
        : undefined);
    const toDirectMeleeTargetId =
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
            const fromInitiative = getEffectiveInitiativeValue(fromCombatant);
            const toInitiative = getEffectiveInitiativeValue(toCombatant);

            if (fromInitiative !== toInitiative) {
              return `${fromCombatant.name}'s effective initiative ${fromInitiative} beats ${toCombatant.name}'s ${toInitiative}, so ${fromName} happens first at this stage of the round.`;
            }
          }

          return `This follows the general round order for this stage.`;
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
          if (fromNode?.kind === 'contact' && fromNode.segment !== undefined) {
            return `Contact is established on segment ${fromNode.segment}, and that has to happen before the later result shown here.`;
          }

          if (fromNode?.segment !== undefined) {
            return `Movement/contact timing means ${fromName} happens before ${toName} on segment ${fromNode.segment}.`;
          }

          return `Movement and contact timing create this local order.`;
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
  const actionEditedTargetNames =
    actionEditedCombatant?.targetCombatantKeys.map((targetCombatantKey) => {
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
                  Mixed Example
                </button>
                <button
                  type={'button'}
                  className={styles['presetMenuButton']}
                  onClick={() => loadPreset(createEnemyEdgePreset)}
                >
                  Enemy Edge
                </button>
                <button
                  type={'button'}
                  className={styles['presetMenuButton']}
                  onClick={() => loadPreset(createScrumPreset)}
                >
                  Ambiguous Scrum
                </button>
                <button
                  type={'button'}
                  className={styles['presetMenuButton']}
                  onClick={() => loadPreset(createChargePreset)}
                >
                  Charge Contact
                </button>
                <button
                  type={'button'}
                  className={styles['presetMenuButton']}
                  onClick={() => loadPreset(createSetVsChargePreset)}
                >
                  Set vs Charge
                </button>
                <button
                  type={'button'}
                  className={styles['presetMenuButton']}
                  onClick={() => loadPreset(createMissileVsChargePreset)}
                >
                  Missile vs Charge
                </button>
                <button
                  type={'button'}
                  className={styles['presetMenuButton']}
                  onClick={() => loadPreset(createMissileDexEdgePreset)}
                >
                  Missile Dex Edge
                </button>
                <button
                  type={'button'}
                  className={styles['presetMenuButton']}
                  onClick={() => loadPreset(createTurnUndeadPreset)}
                >
                  Turn Undead
                </button>
                <button
                  type={'button'}
                  className={styles['presetMenuButton']}
                  onClick={() => loadPreset(createMagicalDevicePreset)}
                >
                  Magical Device
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
        </div>
        {shareFeedback ? (
          <div className={styles['shareFeedback']}>{shareFeedback}</div>
        ) : null}
      </div>

      <div className={styles['layout']}>
        <section className={styles['panel']}>
          <div className={styles['matrixSection']}>
            <div className={styles['matrixHeader']}>
              <h3 className={styles['matrixTitle']}>Engagement Matrix</h3>
              <p className={styles['matrixCopy']}>
                Party combatants run across the top, enemies run down the side.
                Set each combatant&apos;s round action from its header, then use
                the cells only to toggle targets. Clean open-melee mutual
                targets light up as duels. Click the metadata half of a row or
                column header to edit persistent combatant details.
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
                      {state.party.map((partyCombatant, partyIndex) => (
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
                              <span className={styles['matrixCombatantName']}>
                                {formatDeclaredAction(
                                  partyCombatant.declaredAction
                                )}
                              </span>
                              {getCombatantActionHint(partyCombatant) ? (
                                <span className={styles['matrixCombatantMeta']}>
                                  {getCombatantActionHint(partyCombatant)}
                                </span>
                              ) : null}
                              <span className={styles['matrixCombatantMeta']}>
                                {getCombatantTargetSummary(partyCombatant)}
                              </span>
                            </button>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {state.enemies.map((enemyCombatant, enemyIndex) => {
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
                                <span className={styles['matrixCombatantName']}>
                                  {formatDeclaredAction(
                                    enemyCombatant.declaredAction
                                  )}
                                </span>
                                {getCombatantActionHint(enemyCombatant) ? (
                                  <span
                                    className={styles['matrixCombatantMeta']}
                                  >
                                    {getCombatantActionHint(enemyCombatant)}
                                  </span>
                                ) : null}
                                <span className={styles['matrixCombatantMeta']}>
                                  {getCombatantTargetSummary(enemyCombatant)}
                                </span>
                              </button>
                            </div>
                          </th>
                          {state.party.map((partyCombatant, partyIndex) => {
                            const partyTargetsEnemy =
                              partyCombatant.targetCombatantKeys.includes(
                                enemyCombatant.key
                              );
                            const enemyTargetsParty =
                              enemyCombatant.targetCombatantKeys.includes(
                                partyCombatant.key
                              );
                            const isMutualTarget =
                              partyTargetsEnemy && enemyTargetsParty;
                            const isDuel =
                              isMutualTarget &&
                              partyCombatant.declaredAction === 'open-melee' &&
                              enemyCombatant.declaredAction === 'open-melee' &&
                              isNonMissileWeaponId(partyCombatant.weaponId) &&
                              isNonMissileWeaponId(enemyCombatant.weaponId);
                            const pairDistance =
                              partyCombatant.actionDistanceInches ||
                              enemyCombatant.actionDistanceInches ||
                              state.pairDistances[
                                getPairDistanceKey(
                                  partyCombatant.key,
                                  enemyCombatant.key
                                )
                              ] ||
                              '';
                            const partyDeclarationLabel = partyTargetsEnemy
                              ? formatDeclarationMeta(
                                  partyCombatant.declaredAction,
                                  partyCombatant.actionDistanceInches ||
                                    pairDistance,
                                  partyCombatant.activationSegments,
                                  partyCombatant.castingSegments
                                )
                              : '';
                            const enemyDeclarationLabel = enemyTargetsParty
                              ? formatDeclarationMeta(
                                  enemyCombatant.declaredAction,
                                  enemyCombatant.actionDistanceInches ||
                                    pairDistance,
                                  enemyCombatant.activationSegments,
                                  enemyCombatant.castingSegments
                                )
                              : '';

                            return (
                              <td
                                key={`matrix-${enemyCombatant.key}-${partyCombatant.key}`}
                                className={[
                                  styles['matrixCell'],
                                  isDuel ? styles['matrixCellDuel'] : '',
                                ]
                                  .filter(Boolean)
                                  .join(' ')}
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
                                        !usesTargetSelection(
                                          enemyCombatant.declaredAction
                                        )
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
                                        toggleAttackTarget(
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
                                            {enemyDeclarationLabel}
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
                                        !usesTargetSelection(
                                          partyCombatant.declaredAction
                                        )
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
                                        toggleAttackTarget(
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
                                            {partyDeclarationLabel}
                                          </span>
                                        </>
                                      ) : null}
                                    </button>
                                  </div>
                                  {isDuel ? (
                                    <span className={styles['matrixBadge']}>
                                      Duel
                                    </span>
                                  ) : isMutualTarget ? (
                                    <span className={styles['matrixBadge']}>
                                      Mutual target
                                    </span>
                                  ) : null}
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
            <div className={styles['graphHeader']}>
              <h2 className={styles['graphTitle']}>Precedence DAG</h2>
            </div>
            <div className={styles['summaryStrip']}>
              <div
                className={[
                  styles['summaryCell'],
                  styles['summaryCellBaseline'],
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <span className={styles['summaryLabel']}>Baseline</span>
                <span
                  className={[
                    styles['summaryValue'],
                    styles['summaryValueLong'],
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {simpleOrderCard?.summary || resolution.simpleOrder}
                </span>
              </div>
              <div className={styles['summaryCell']}>
                <span className={styles['summaryLabel']}>Duels</span>
                <span className={styles['summaryValue']}>
                  {resolution.directMeleeEngagements.length}
                </span>
              </div>
              <div className={styles['summaryCell']}>
                <span className={styles['summaryLabel']}>Movement</span>
                <span className={styles['summaryValue']}>
                  {resolution.movementResolutions.length}
                </span>
              </div>
              <div className={styles['summaryCell']}>
                <span className={styles['summaryLabel']}>Unresolved</span>
                <span className={styles['summaryValue']}>
                  {resolution.unresolvedMeleeCandidateIds.length}
                </span>
              </div>
            </div>
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
                          const lineYs = getGraphNodeLineYs(
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
                              {attackNodeLabelById[selectedGraphNode.id] ||
                                selectedGraphNode.id}
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
                                ? getGraphNodeStatusLabel(
                                    selectedGraphNodeStatus
                                  )
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
                                applyGraphNodeStatus(
                                  selectedGraphNode.id,
                                  'lost'
                                )
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
                              <h4 className={styles['graphSubhead']}>
                                Blocked By
                              </h4>
                              <ol className={styles['graphInspectorList']}>
                                {selectedGraphIncomingEdges.map((edge) => (
                                  <li
                                    key={`incoming-${edge.fromNodeId}-${edge.toNodeId}`}
                                    className={styles['graphInspectorItem']}
                                  >
                                    <button
                                      type={'button'}
                                      className={
                                        styles['graphInspectorLinkButton']
                                      }
                                      onClick={() =>
                                        openGraphNode(edge.fromNodeId, true)
                                      }
                                    >
                                      {attackNodeLabelById[edge.fromNodeId] ||
                                        edge.fromNodeId}
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
                                      className={
                                        styles['graphInspectorLinkButton']
                                      }
                                      onClick={() =>
                                        openGraphNode(target.nodeId, true)
                                      }
                                    >
                                      {target.label}
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <div className={styles['graphEmpty']}>
                      Add combatants to generate a precedence graph.
                    </div>
                  )}
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
      {actionEditorTarget && actionEditedCombatant && modalRoot
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
                  in the engagement matrix; any distance or timing entered here
                  applies to the whole declaration.
                </p>
                <label
                  className={styles['modalLabel']}
                  htmlFor={'initiative-attack-action'}
                >
                  Action
                </label>
                <select
                  id={'initiative-attack-action'}
                  className={styles['selectInput']}
                  value={actionEditorTarget.action}
                  onChange={(event) =>
                    setActionEditorTarget((previous) =>
                      previous
                        ? {
                            ...previous,
                            action: event.target
                              .value as InitiativeDeclaredAction,
                            castingSegments:
                              event.target.value === 'spell-casting'
                                ? previous.castingSegments || '1'
                                : previous.castingSegments,
                          }
                        : previous
                    )
                  }
                >
                  {getAvailableActionOptions(
                    actionEditedCombatant.weaponId
                  ).map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {requiresAttackRoutineCountInput(
                  actionEditorTarget.action,
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
                      value={actionEditorTarget.attackRoutineCount}
                      onChange={(event) =>
                        setActionEditorTarget((previous) =>
                          previous
                            ? {
                                ...previous,
                                attackRoutineCount: event.target.value,
                              }
                            : previous
                        )
                      }
                    />
                    <p className={styles['modalHint']}>
                      Use <strong>1</strong> for an ordinary weapon routine or a
                      natural routine such as claw/claw/bite.
                    </p>
                  </>
                ) : null}
                {requiresDistanceInput(actionEditorTarget.action) ? (
                  <>
                    <label
                      className={styles['modalLabel']}
                      htmlFor={'initiative-attack-distance'}
                    >
                      Distance to target (inches)
                    </label>
                    <input
                      id={'initiative-attack-distance'}
                      className={styles['textInput']}
                      inputMode={'decimal'}
                      type={'text'}
                      placeholder={'e.g. 4'}
                      value={actionEditorTarget.distanceInches}
                      onChange={(event) =>
                        setActionEditorTarget((previous) =>
                          previous
                            ? {
                                ...previous,
                                distanceInches: event.target.value,
                              }
                            : previous
                        )
                      }
                    />
                    <p className={styles['modalHint']}>
                      Enter the current effective range in tabletop inches. The
                      DM can translate from the actual battlefield during play.
                    </p>
                  </>
                ) : null}
                {requiresActivationSegmentsInput(actionEditorTarget.action) ? (
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
                      value={actionEditorTarget.activationSegments}
                      onChange={(event) =>
                        setActionEditorTarget((previous) =>
                          previous
                            ? {
                                ...previous,
                                activationSegments: event.target.value,
                              }
                            : previous
                        )
                      }
                    >
                      {ACTIVATION_SEGMENT_OPTIONS.map((option) => (
                        <option key={option.label} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <p className={styles['modalHint']}>
                      Use this only when the device description gives an
                      activation time. Leave it at None when the device attack
                      is initiative-controlled but not tied to a specific
                      segment.
                    </p>
                  </>
                ) : null}
                {requiresCastingSegmentsInput(actionEditorTarget.action) ? (
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
                      value={actionEditorTarget.castingSegments}
                      onChange={(event) =>
                        setActionEditorTarget((previous) =>
                          previous
                            ? {
                                ...previous,
                                castingSegments: event.target.value,
                              }
                            : previous
                        )
                      }
                    >
                      {SPELL_CASTING_TIME_OPTIONS.map((option) => (
                        <option key={option.label} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <p className={styles['modalHint']}>
                      Use the spell&apos;s casting time. In this rules slice,
                      casting time is also treated as the segment where the
                      spell completes.
                    </p>
                  </>
                ) : null}
                {actionEditorTarget.action === 'none' ? (
                  <p className={styles['modalHint']}>
                    This combatant is spending the round on a non-combat action.
                    It will not appear in the initiative graph and it ignores
                    target selections in the matrix.
                  </p>
                ) : null}
                {actionEditorTarget.action === 'missile' ? (
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
                {isSingleTargetDeclarationAction(actionEditorTarget.action) ? (
                  <p className={styles['modalHint']}>
                    This action uses only one target. If more than one cell is
                    selected, only the first target will be kept when you save.
                  </p>
                ) : null}
                <div className={styles['modalMeta']}>
                  <span className={styles['modalMetaLabel']}>
                    Current action
                  </span>
                  <span className={styles['modalMetaValue']}>
                    {actionEditedCombatantName}
                  </span>
                  <span className={styles['modalMetaValue']}>
                    {formatDeclarationMeta(
                      actionEditorTarget.action,
                      actionEditorTarget.distanceInches,
                      actionEditorTarget.activationSegments,
                      actionEditorTarget.castingSegments
                    )}
                  </span>
                  <span className={styles['modalMetaLabel']}>Targets</span>
                  <span className={styles['modalMetaValue']}>
                    {actionEditedTargetSummary}
                  </span>
                </div>
                <div className={styles['modalActions']}>
                  {actionEditedCombatant.targetCombatantKeys.length > 0 ? (
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
    </div>
  );
};

export default InitiativePlayground;
