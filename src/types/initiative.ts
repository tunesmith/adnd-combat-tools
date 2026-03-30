export type InitiativeScenarioSide = 'party' | 'enemy';
export type InitiativeScenarioOrder =
  | 'party-first'
  | 'enemy-first'
  | 'simultaneous';
export type InitiativeWeaponType = 'melee' | 'missile' | 'natural';

interface InitiativeAttackRoutineComponent {
  id: string;
  order: number;
  label: string;
}

export interface InitiativeAttackRoutine {
  id: string;
  label: string;
  combatantId: string;
  components: InitiativeAttackRoutineComponent[];
  timingBasisComponentId?: string;
}

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
  attackRoutine: InitiativeAttackRoutine;
}

export interface InitiativeScenarioDraftCombatant {
  combatantKey: number;
  name?: string;
  weaponId: number;
  intention?: string;
  result?: string;
  targetCombatantKeys: number[];
}

export interface InitiativeScenarioDraft {
  label: string;
  partyInitiative: number;
  enemyInitiative: number;
  party: InitiativeScenarioDraftCombatant[];
  enemies: InitiativeScenarioDraftCombatant[];
}

export interface DirectMeleePair {
  partyCombatantId: string;
  enemyCombatantId: string;
  inference: 'mutual-targeting-non-missile-weapons';
}

type InitiativeAttackSource = 'routine-component' | 'timing-bonus';

export interface InitiativeAttackEntry {
  combatantId: string;
  routineId: string;
  componentId: string;
  attackNumber: number;
  label: string;
  source: InitiativeAttackSource;
}

interface DirectMeleeAttackStep {
  attacks: InitiativeAttackEntry[];
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

export interface InitiativeSimpleOrderStep {
  combatantIds: string[];
  sides: InitiativeScenarioSide[];
}

export interface InitiativeRoundResolution {
  label: string;
  simpleOrder: InitiativeScenarioOrder;
  simpleOrderCombatantIds: string[];
  simpleOrderSteps: InitiativeSimpleOrderStep[];
  overriddenCombatantIds: string[];
  directMeleeEngagements: DirectMeleeEngagement[];
  unresolvedMeleeCandidateIds: string[];
}

export interface InitiativeAttackNode {
  id: string;
  combatantId: string;
  routineId: string;
  componentId: string;
  side: InitiativeScenarioSide;
  attackNumber: number;
  label: string;
  source: InitiativeAttackSource;
}

export type InitiativeAttackEdgeReason = 'simple-initiative' | 'direct-melee';

export interface InitiativeAttackEdge {
  fromNodeId: string;
  toNodeId: string;
  reasons: InitiativeAttackEdgeReason[];
}

export interface InitiativeAttackGraph {
  nodes: InitiativeAttackNode[];
  edges: InitiativeAttackEdge[];
  layers: string[][];
}
