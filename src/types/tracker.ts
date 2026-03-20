import type { Creature } from "./creature";

export interface TrackerCombatant extends Creature {
  maxHp?: string;
}

export interface TrackerCombatantRoundStateV1 {
  hp: string;
  effect: string;
  action: string;
  result: string;
  notes: string;
}

export interface TrackerCellStateLegacy {
  enemyToParty: string;
  partyToEnemy: string;
}

export interface TrackerCellState {
  enemyToParty: string;
  partyToEnemy: string;
  isVisible: boolean;
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

export interface TrackerRoundV4 {
  partyInitiative: string;
  enemyInitiative: string;
  summary: string;
  cells: TrackerCellState[][];
  partyStates: TrackerCombatantRoundState[];
  enemyStates: TrackerCombatantRoundState[];
}

export interface TrackerRound extends TrackerRoundV4 {
  party: TrackerCombatant[];
  enemies: TrackerCombatant[];
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

export interface TrackerStateV3 {
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
  rounds: TrackerRound[];
  activeRound: number;
}

export type TrackerState = TrackerStateV5;
export type TrackerStateAnyVersion =
  | TrackerStateV1
  | TrackerStateV2
  | TrackerStateV3
  | TrackerStateV4
  | TrackerStateV5;
