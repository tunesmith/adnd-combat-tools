import { buildInitiativeAttackGraph } from '../helpers/initiative/attackGraph';
import { resolveInitiativeRound } from '../helpers/initiative/roundResolution';
import { buildInitiativeScenario } from '../helpers/initiative/scenario';
import type {
  InitiativeAttackGraph,
  InitiativeChargeFirstStrike,
  InitiativeScenarioDraft,
} from '../types/initiative';

const ATTACKER_ID = 'party-1';
const DEFENDER_ID = 'enemy-3';
const ATTACKER_ATTACK_NODE_ID = `attack:${ATTACKER_ID}:1`;
const DEFENDER_ATTACK_NODE_ID = `attack:${DEFENDER_ID}:1`;

const DMG_P66_JUSTIFICATION =
  'DMG p. 66: "Initiative is NOT checked..." and "longer weapon/reach attacks first."';

interface ChargeFirstStrikeCase {
  label: string;
  attackerInitiative: number;
  defenderInitiative: number;
  attackerWeaponId: number;
  defenderWeaponId: number;
  expectedFirstStrike: InitiativeChargeFirstStrike;
  dmgJustification: string;
}

const chargeFirstStrikeCases: ChargeFirstStrikeCase[] = [
  {
    label: 'attacker wins initiative and has longer reach',
    attackerInitiative: 5,
    defenderInitiative: 2,
    attackerWeaponId: 50,
    defenderWeaponId: 56,
    expectedFirstStrike: 'attacker',
    dmgJustification: DMG_P66_JUSTIFICATION,
  },
  {
    label: 'attacker wins initiative and has equal reach',
    attackerInitiative: 5,
    defenderInitiative: 2,
    attackerWeaponId: 56,
    defenderWeaponId: 56,
    expectedFirstStrike: 'simultaneous',
    dmgJustification: DMG_P66_JUSTIFICATION,
  },
  {
    label: 'attacker wins initiative and has shorter reach',
    attackerInitiative: 5,
    defenderInitiative: 2,
    attackerWeaponId: 57,
    defenderWeaponId: 50,
    expectedFirstStrike: 'target',
    dmgJustification: DMG_P66_JUSTIFICATION,
  },
  {
    label: 'attacker ties initiative and has longer reach',
    attackerInitiative: 4,
    defenderInitiative: 4,
    attackerWeaponId: 50,
    defenderWeaponId: 56,
    expectedFirstStrike: 'attacker',
    dmgJustification: DMG_P66_JUSTIFICATION,
  },
  {
    label: 'attacker ties initiative and has equal reach',
    attackerInitiative: 4,
    defenderInitiative: 4,
    attackerWeaponId: 56,
    defenderWeaponId: 56,
    expectedFirstStrike: 'simultaneous',
    dmgJustification: DMG_P66_JUSTIFICATION,
  },
  {
    label: 'attacker ties initiative and has shorter reach',
    attackerInitiative: 4,
    defenderInitiative: 4,
    attackerWeaponId: 57,
    defenderWeaponId: 50,
    expectedFirstStrike: 'target',
    dmgJustification: DMG_P66_JUSTIFICATION,
  },
  {
    label: 'attacker loses initiative and has longer reach',
    attackerInitiative: 2,
    defenderInitiative: 5,
    attackerWeaponId: 50,
    defenderWeaponId: 56,
    expectedFirstStrike: 'attacker',
    dmgJustification: DMG_P66_JUSTIFICATION,
  },
  {
    label: 'attacker loses initiative and has equal reach',
    attackerInitiative: 2,
    defenderInitiative: 5,
    attackerWeaponId: 56,
    defenderWeaponId: 56,
    expectedFirstStrike: 'simultaneous',
    dmgJustification: DMG_P66_JUSTIFICATION,
  },
  {
    label: 'attacker loses initiative and has shorter reach',
    attackerInitiative: 2,
    defenderInitiative: 5,
    attackerWeaponId: 57,
    defenderWeaponId: 50,
    expectedFirstStrike: 'target',
    dmgJustification: DMG_P66_JUSTIFICATION,
  },
];

const buildChargeScenarioDraft = (
  testCase: ChargeFirstStrikeCase
): InitiativeScenarioDraft => ({
  label: testCase.label,
  partyInitiative: testCase.attackerInitiative,
  enemyInitiative: testCase.defenderInitiative,
  party: [
    {
      combatantKey: 1,
      name: 'Charger',
      declaredAction: 'charge',
      movementRate: 12,
      weaponId: testCase.attackerWeaponId,
      targetDeclarations: [
        {
          targetCombatantKey: 3,
          distanceInches: 4,
        },
      ],
    },
  ],
  enemies: [
    {
      combatantKey: 3,
      name: 'Defender',
      declaredAction: 'open-melee',
      movementRate: 9,
      weaponId: testCase.defenderWeaponId,
      targetCombatantKeys: [1],
    },
  ],
});

const getLayerIndex = (graph: InitiativeAttackGraph, nodeId: string): number =>
  graph.layers.findIndex((layer) => layer.includes(nodeId));

describe('initiative charge first-strike matrix', () => {
  test.each(chargeFirstStrikeCases)(
    '$label [$dmgJustification]',
    (testCase) => {
      const scenario = buildInitiativeScenario(
        buildChargeScenarioDraft(testCase)
      );
      const resolution = resolveInitiativeRound(scenario);
      const graph = buildInitiativeAttackGraph(scenario, resolution);

      expect(scenario.movementResolutions).toEqual([
        expect.objectContaining({
          combatantId: ATTACKER_ID,
          targetId: DEFENDER_ID,
          action: 'charge',
          reason: 'contact',
          contactSegment: 2,
          sameRoundAttack: true,
          firstStrike: testCase.expectedFirstStrike,
        }),
      ]);

      expect(graph.nodes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: ATTACKER_ATTACK_NODE_ID,
            kind: 'attack',
            segment: 2,
          }),
          expect.objectContaining({
            id: DEFENDER_ATTACK_NODE_ID,
            kind: 'attack',
            segment: 2,
          }),
        ])
      );

      const attackerLayerIndex = getLayerIndex(graph, ATTACKER_ATTACK_NODE_ID);
      const defenderLayerIndex = getLayerIndex(graph, DEFENDER_ATTACK_NODE_ID);

      expect(attackerLayerIndex).toBeGreaterThanOrEqual(0);
      expect(defenderLayerIndex).toBeGreaterThanOrEqual(0);

      if (testCase.expectedFirstStrike === 'attacker') {
        expect(graph.edges).toEqual(
          expect.arrayContaining([
            {
              fromNodeId: ATTACKER_ATTACK_NODE_ID,
              toNodeId: DEFENDER_ATTACK_NODE_ID,
              reasons: ['movement'],
            },
          ])
        );
        expect(attackerLayerIndex).toBeLessThan(defenderLayerIndex);
        return;
      }

      if (testCase.expectedFirstStrike === 'target') {
        expect(graph.edges).toEqual(
          expect.arrayContaining([
            {
              fromNodeId: DEFENDER_ATTACK_NODE_ID,
              toNodeId: ATTACKER_ATTACK_NODE_ID,
              reasons: ['movement'],
            },
          ])
        );
        expect(defenderLayerIndex).toBeLessThan(attackerLayerIndex);
        return;
      }

      expect(graph.edges).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            fromNodeId: ATTACKER_ATTACK_NODE_ID,
            toNodeId: DEFENDER_ATTACK_NODE_ID,
          }),
        ])
      );
      expect(graph.edges).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            fromNodeId: DEFENDER_ATTACK_NODE_ID,
            toNodeId: ATTACKER_ATTACK_NODE_ID,
          }),
        ])
      );
      expect(attackerLayerIndex).toBe(defenderLayerIndex);
    }
  );
});
