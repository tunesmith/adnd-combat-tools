import { buildInitiativeScenario } from './scenario';
import type {
  InitiativeScenario,
  InitiativeScenarioDraftActionDeclaration,
  InitiativeScenarioDraft,
} from '../../types/initiative';
import { getTrackerActionDeclarations } from '../trackerActionDeclarations';
import type {
  TrackerActionDeclaration,
  TrackerActionSide,
  TrackerRound,
} from '../../types/tracker';

const parseInitiative = (value: string): number => {
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getActionKey = (side: TrackerActionSide, combatantKey: number): string =>
  `${side}:${combatantKey}`;

const groupActionsByCombatant = (
  actions: TrackerActionDeclaration[]
): Map<string, TrackerActionDeclaration[]> =>
  actions.reduce<Map<string, TrackerActionDeclaration[]>>((groups, action) => {
    const key = getActionKey(action.side, action.combatantKey);
    groups.set(key, (groups.get(key) || []).concat(action));
    return groups;
  }, new Map());

const toInitiativeDraftActions = (
  actions: TrackerActionDeclaration[]
): InitiativeScenarioDraftActionDeclaration[] | undefined =>
  actions.length > 0
    ? actions.map((action) => ({
        id: action.id,
        declaredAction: action.declaredAction,
        actionLabel: action.actionLabel,
        initiativeTiming: action.initiativeTiming,
        actionDistanceInches: action.actionDistanceInches,
        activationSegments: action.activationSegments,
        castingSegments: action.castingSegments,
        targetDeclarations: action.targetDeclarations.map(
          (targetDeclaration) => ({
            targetCombatantKey: targetDeclaration.targetCombatantKey,
            distanceInches: action.actionDistanceInches,
            activationSegments: action.activationSegments,
            castingSegments: action.castingSegments,
          })
        ),
      }))
    : undefined;

export const buildInitiativeScenarioFromTrackerRound = (
  round: TrackerRound
): InitiativeScenario => {
  const partyInitiative = parseInitiative(round.partyInitiative);
  const enemyInitiative = parseInitiative(round.enemyInitiative);
  const actionGroups = groupActionsByCombatant(
    getTrackerActionDeclarations(round)
  );

  const draft: InitiativeScenarioDraft = {
    label: round.label,
    partyInitiative,
    enemyInitiative,
    party: round.party.map((combatant, index) => ({
      combatantKey: combatant.key,
      name: combatant.name,
      weaponId: combatant.weapon,
      movementRate: combatant.movementRate,
      missileInitiativeAdjustment: combatant.missileInitiativeAdjustment,
      intention: round.partyStates[index]?.action || '',
      result: round.partyStates[index]?.result || '',
      actions: toInitiativeDraftActions(
        actionGroups.get(getActionKey('party', combatant.key)) || []
      ),
    })),
    enemies: round.enemies.map((combatant, index) => ({
      combatantKey: combatant.key,
      name: combatant.name,
      weaponId: combatant.weapon,
      movementRate: combatant.movementRate,
      missileInitiativeAdjustment: combatant.missileInitiativeAdjustment,
      intention: round.enemyStates[index]?.action || '',
      result: round.enemyStates[index]?.result || '',
      actions: toInitiativeDraftActions(
        actionGroups.get(getActionKey('enemy', combatant.key)) || []
      ),
    })),
  };

  return buildInitiativeScenario(draft);
};
