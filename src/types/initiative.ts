export type InitiativeScenarioSide = 'party' | 'enemy';
export type InitiativeScenarioOrder =
  | 'party-first'
  | 'enemy-first'
  | 'simultaneous';
export type InitiativeWeaponType = 'melee' | 'missile' | 'natural';

export interface InitiativeScenarioCombatant {
  id: string;
  side: InitiativeScenarioSide;
  index: number;
  combatantKey: number;
  name: string;
  initiative: number;
  weaponId: number;
  weaponName: string;
  weaponType: InitiativeWeaponType;
  weaponSpeedFactor?: number;
  intention: string;
  result: string;
  targetIds: string[];
}

export interface DirectMeleePair {
  partyCombatantId: string;
  enemyCombatantId: string;
  inference: 'mutual-targeting-non-missile-weapons';
}

interface DirectMeleeAttack {
  combatantId: string;
  attackNumber: number;
}

interface DirectMeleeAttackStep {
  attacks: DirectMeleeAttack[];
}

type DirectMeleeResolutionReason =
  | 'initiative'
  | 'simultaneous'
  | 'weapon-speed'
  | 'weapon-speed-double'
  | 'weapon-speed-triple';

interface DirectMeleeResolution {
  reason: DirectMeleeResolutionReason;
  steps: DirectMeleeAttackStep[];
}

export interface DirectMeleeEngagement extends DirectMeleePair {
  resolution: DirectMeleeResolution;
}

export interface InitiativeScenario {
  label: string;
  partyInitiative: number;
  enemyInitiative: number;
  simpleOrder: InitiativeScenarioOrder;
  party: InitiativeScenarioCombatant[];
  enemies: InitiativeScenarioCombatant[];
  directMeleePairs: DirectMeleePair[];
  directMeleeEngagements: DirectMeleeEngagement[];
  unresolvedMeleeCandidateIds: string[];
}
