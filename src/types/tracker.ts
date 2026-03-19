import type { Creature } from "./creature";

export interface TrackerCombatant extends Creature {
  maxHp?: string;
}

export interface TrackerCombatantRoundState {
  hp: string;
  effect: string;
  action: string;
  result: string;
  notes: string;
}

export interface TrackerRound {
  partyInitiative: string;
  enemyInitiative: string;
  summary: string;
  cells: string[][];
  partyStates: TrackerCombatantRoundState[];
  enemyStates: TrackerCombatantRoundState[];
}

export interface TrackerStateV1 {
  version: 1;
  party: TrackerCombatant[];
  enemies: TrackerCombatant[];
  rounds: TrackerRound[];
  activeRound: number;
}

export type TrackerState = TrackerStateV1;
