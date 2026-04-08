export type InitiativeScenarioSide = 'party' | 'enemy';
export type InitiativeScenarioOrder =
  | 'party-first'
  | 'enemy-first'
  | 'simultaneous';
export type InitiativeWeaponType = 'melee' | 'missile' | 'natural';
export type InitiativeDeclaredAction =
  | 'open-melee'
  | 'close'
  | 'charge'
  | 'set-vs-charge'
  | 'missile'
  | 'turn-undead'
  | 'magical-device'
  | 'spell-casting';

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

interface InitiativeTargetDeclaration {
  targetId: string;
  distanceInches?: number;
  activationSegments?: number;
  castingSegments?: number;
}

export interface InitiativeScenarioCombatant {
  id: string;
  side: InitiativeScenarioSide;
  index: number;
  combatantKey: number;
  name: string;
  initiative: number;
  missileInitiativeAdjustment: number;
  declaredAction: InitiativeDeclaredAction;
  movementRate: number;
  weaponId: number;
  weaponName: string;
  weaponType: InitiativeWeaponType;
  weaponLength?: number;
  weaponSpeedFactor?: number;
  intention: string;
  result: string;
  targetDeclarations: InitiativeTargetDeclaration[];
  targetIds: string[];
  attackRoutine: InitiativeAttackRoutine;
}

export interface InitiativeScenarioDraftTargetDeclaration {
  targetCombatantKey: number;
  distanceInches?: number;
  activationSegments?: number;
  castingSegments?: number;
}

export interface InitiativeScenarioDraftCombatant {
  combatantKey: number;
  name?: string;
  declaredAction?: InitiativeDeclaredAction;
  movementRate?: number;
  missileInitiativeAdjustment?: number;
  attackRoutineCount?: number;
  weaponId: number;
  intention?: string;
  result?: string;
  targetCombatantKeys?: number[];
  targetDeclarations?: InitiativeScenarioDraftTargetDeclaration[];
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

type InitiativeAttackSource =
  | 'routine-component'
  | 'timing-bonus'
  | 'movement-contact'
  | 'spell-casting';

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
  | 'multiple-routines'
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

type InitiativeMovementResolutionReason =
  | 'contact'
  | 'no-contact'
  | 'missing-target'
  | 'missing-distance'
  | 'multiple-targets'
  | 'invalid-open-melee-target'
  | 'set-not-triggered'
  | 'target-moving-elsewhere';

export type InitiativeChargeFirstStrike =
  | 'attacker'
  | 'target'
  | 'simultaneous'
  | 'undetermined';

export interface InitiativeMovementResolution {
  combatantId: string;
  targetId?: string;
  action: InitiativeDeclaredAction;
  reason: InitiativeMovementResolutionReason;
  distanceInches?: number;
  closingInchesPerSegment?: number;
  contactSegment?: number;
  remainingDistanceInches?: number;
  sameRoundAttack: boolean;
  firstStrike?: InitiativeChargeFirstStrike;
  damageMultiplier?: number;
}

export interface InitiativeScenario {
  label: string;
  partyInitiative: number;
  enemyInitiative: number;
  simpleOrder: InitiativeScenarioOrder;
  party: InitiativeScenarioCombatant[];
  enemies: InitiativeScenarioCombatant[];
  movementResolutions: InitiativeMovementResolution[];
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
  movementResolutions: InitiativeMovementResolution[];
  directMeleeEngagements: DirectMeleeEngagement[];
  unresolvedMeleeCandidateIds: string[];
}

export interface InitiativeAttackNode {
  id: string;
  combatantId: string;
  targetId?: string;
  routineId: string;
  componentId: string;
  side: InitiativeScenarioSide;
  attackNumber: number;
  label: string;
  source: InitiativeAttackSource;
  kind: 'attack' | 'contact' | 'spell-start' | 'spell-completion';
  segment?: number;
  segmentReason?:
    | 'declared-action'
    | 'movement'
    | 'spell-directed'
    | 'spell-start'
    | 'spell-completion';
}

export type InitiativeAttackEdgeReason =
  | 'simple-initiative'
  | 'direct-melee'
  | 'movement'
  | 'spell-casting'
  | 'spell-interruption';

export interface InitiativeAttackEdge {
  fromNodeId: string;
  toNodeId: string;
  reasons: InitiativeAttackEdgeReason[];
}

export interface InitiativeAttackGraph {
  nodes: InitiativeAttackNode[];
  edges: InitiativeAttackEdge[];
  layers: string[][];
  simultaneousGroups: string[][];
}
