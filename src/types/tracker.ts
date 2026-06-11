import type { Creature } from './creature';
import type { InitiativeDeclaredAction } from './initiative';

export type TrackerAttackHand = 'main' | 'offHand';
export type TrackerActionSide = 'party' | 'enemy';
export type TrackerActionDirection = 'partyToEnemy' | 'enemyToParty';

export interface TrackerCombatant extends Creature {
  maxHp?: string;
  offHandWeapon?: number;
  weaponShortlist?: number[];
}

export interface TrackerCombatantRoundStateV1 {
  hp: string;
  effect: string;
  action: string;
  result: string;
  notes: string;
}

interface TrackerCellStateLegacy {
  enemyToParty: string;
  partyToEnemy: string;
}

export interface TrackerCellStateV5 {
  enemyToParty: string;
  partyToEnemy: string;
  isVisible: boolean;
}

export interface TrackerCellState {
  enemyToParty: string;
  partyToEnemy: string;
  enemyToPartyVisible: boolean;
  partyToEnemyVisible: boolean;
}

export interface TrackerActionTargetDeclaration {
  targetCombatantKey: number;
  targetCombatantIndex: number;
  cellRowIndex: number;
  cellColumnIndex: number;
  cellResultText: string;
}

export interface TrackerActionDeclaration {
  id: string;
  source: 'combat-cell' | 'intention';
  side: TrackerActionSide;
  direction: TrackerActionDirection;
  combatantKey: number;
  combatantIndex: number;
  targetSide: TrackerActionSide;
  declaredAction: InitiativeDeclaredAction;
  actionLabel?: string;
  actionDistanceInches?: number;
  castingSegments?: number;
  weaponId: number;
  intention: string;
  result: string;
  targetDeclarations: TrackerActionTargetDeclaration[];
}

export interface TrackerRoundV1 {
  partyInitiative: string;
  enemyInitiative: string;
  summary: string;
  cells: string[][];
  partyStates: TrackerCombatantRoundStateV1[];
  enemyStates: TrackerCombatantRoundStateV1[];
}

export interface TrackerCombatantRoundStateV2 {
  maxHp: string;
  hp: string;
  effect: string;
  action: string;
  result: string;
  notes: string;
}

export interface TrackerRoundV2 {
  partyInitiative: string;
  enemyInitiative: string;
  summary: string;
  cells: TrackerCellStateLegacy[][];
  partyStates: TrackerCombatantRoundStateV2[];
  enemyStates: TrackerCombatantRoundStateV2[];
}

export interface TrackerCombatantRoundState {
  hp: string;
  effect: string;
  action: string;
  result: string;
  notes: string;
}

interface TrackerRoundV4 {
  partyInitiative: string;
  enemyInitiative: string;
  summary: string;
  cells: TrackerCellStateV5[][];
  partyStates: TrackerCombatantRoundState[];
  enemyStates: TrackerCombatantRoundState[];
}

export interface TrackerRoundV5 extends TrackerRoundV4 {
  party: TrackerCombatant[];
  enemies: TrackerCombatant[];
}

export interface TrackerRoundV6 extends Omit<TrackerRoundV5, 'cells'> {
  cells: TrackerCellState[][];
}

export interface TrackerRound extends TrackerRoundV6 {
  label: string;
  actions?: TrackerActionDeclaration[];
}

export interface TrackerStateV1 {
  version: 1;
  party: TrackerCombatant[];
  enemies: TrackerCombatant[];
  rounds: TrackerRoundV1[];
  activeRound: number;
}

export interface TrackerStateV2 {
  version: 2;
  party: TrackerCombatant[];
  enemies: TrackerCombatant[];
  rounds: TrackerRoundV2[];
  activeRound: number;
}

interface TrackerStateV3 {
  version: 3;
  party: TrackerCombatant[];
  enemies: TrackerCombatant[];
  rounds: {
    partyInitiative: string;
    enemyInitiative: string;
    summary: string;
    cells: TrackerCellStateLegacy[][];
    partyStates: TrackerCombatantRoundState[];
    enemyStates: TrackerCombatantRoundState[];
  }[];
  activeRound: number;
}

export interface TrackerStateV4 {
  version: 4;
  party: TrackerCombatant[];
  enemies: TrackerCombatant[];
  rounds: TrackerRoundV4[];
  activeRound: number;
}

export interface TrackerStateV5 {
  version: 5;
  rounds: TrackerRoundV5[];
  activeRound: number;
}

interface TrackerStateV6 {
  version: 6;
  title?: string;
  rounds: TrackerRoundV6[];
  activeRound: number;
}

interface TrackerStateV7 {
  version: 7;
  title?: string;
  rounds: TrackerRound[];
  activeRound: number;
}

export type TrackerState = TrackerStateV7;
export type TrackerStateAnyVersion =
  | TrackerStateV1
  | TrackerStateV2
  | TrackerStateV3
  | TrackerStateV4
  | TrackerStateV5
  | TrackerStateV6
  | TrackerStateV7;
