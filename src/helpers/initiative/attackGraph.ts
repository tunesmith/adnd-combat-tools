import type {
  InitiativeAttackEdge,
  InitiativeAttackEdgeReason,
  InitiativeAttackGraph,
  InitiativeAttackNode,
  InitiativeAttackSource,
  InitiativeRoundResolution,
  InitiativeScenario,
  InitiativeScenarioCombatant,
} from '../../types/initiative';

const getAttackNodeId = (combatantId: string, attackNumber: number): string =>
  `attack:${combatantId}:${attackNumber}`;

const mergeEdgeReason = (
  edgesByKey: Map<string, InitiativeAttackEdge>,
  fromNodeId: string,
  toNodeId: string,
  reason: InitiativeAttackEdgeReason
) => {
  const key = `${fromNodeId}->${toNodeId}`;
  const existing = edgesByKey.get(key);

  if (!existing) {
    edgesByKey.set(key, {
      fromNodeId,
      toNodeId,
      reasons: [reason],
    });
    return;
  }

  if (!existing.reasons.includes(reason)) {
    existing.reasons.push(reason);
  }
};

const getCombatantById = (
  scenario: InitiativeScenario
): Map<string, InitiativeScenarioCombatant> =>
  new Map(
    scenario.party
      .concat(scenario.enemies)
      .map((combatant) => [combatant.id, combatant] as const)
  );

const createNode = (
  combatant: InitiativeScenarioCombatant,
  componentId: string,
  attackNumber: number,
  label: string,
  source: InitiativeAttackSource
): InitiativeAttackNode => ({
  id: getAttackNodeId(combatant.id, attackNumber),
  combatantId: combatant.id,
  routineId: combatant.attackRoutine.id,
  componentId,
  side: combatant.side,
  attackNumber,
  label,
  source,
});

const getLayers = (
  nodes: InitiativeAttackNode[],
  edges: InitiativeAttackEdge[]
): string[][] => {
  const nodeIds = nodes.map((node) => node.id);
  const indegree = new Map(nodeIds.map((nodeId) => [nodeId, 0]));
  const outgoing = new Map(nodeIds.map((nodeId) => [nodeId, [] as string[]]));

  edges.forEach((edge) => {
    indegree.set(edge.toNodeId, (indegree.get(edge.toNodeId) || 0) + 1);
    const targets = outgoing.get(edge.fromNodeId);
    if (targets) {
      targets.push(edge.toNodeId);
    }
  });

  const layers: string[][] = [];
  let available = nodeIds.filter((nodeId) => (indegree.get(nodeId) || 0) === 0);
  const seen = new Set<string>();

  while (available.length > 0) {
    layers.push(available);

    const next: string[] = [];
    available.forEach((nodeId) => {
      seen.add(nodeId);
      (outgoing.get(nodeId) || []).forEach((targetId) => {
        const nextIndegree = (indegree.get(targetId) || 0) - 1;
        indegree.set(targetId, nextIndegree);
        if (nextIndegree === 0) {
          next.push(targetId);
        }
      });
    });

    available = nodeIds.filter(
      (nodeId) => !seen.has(nodeId) && (indegree.get(nodeId) || 0) === 0
    );
    if (next.length > 0) {
      available = available.filter((nodeId) => next.includes(nodeId));
    }
  }

  const remaining = nodeIds.filter((nodeId) => !seen.has(nodeId));
  if (remaining.length > 0) {
    layers.push(remaining);
  }

  return layers;
};

export const buildInitiativeAttackGraph = (
  scenario: InitiativeScenario,
  resolution: InitiativeRoundResolution
): InitiativeAttackGraph => {
  const combatantById = getCombatantById(scenario);
  const directMeleeCombatantIdSet = new Set(resolution.overriddenCombatantIds);
  const nodes: InitiativeAttackNode[] = [];
  const edgesByKey = new Map<string, InitiativeAttackEdge>();

  resolution.directMeleeEngagements.forEach((engagement) => {
    engagement.resolution.steps.forEach((step, stepIndex) => {
      const stepNodeIds = step.attacks.flatMap((attack) => {
        const combatant = combatantById.get(attack.combatantId);
        if (!combatant) {
          return [];
        }

        const node = createNode(
          combatant,
          attack.componentId,
          attack.attackNumber,
          attack.label,
          attack.source
        );
        nodes.push(node);
        return [node.id];
      });

      if (stepIndex === 0) {
        return;
      }

      const previousStep = engagement.resolution.steps[stepIndex - 1];
      if (!previousStep) {
        return;
      }
      const previousNodeIds = previousStep.attacks.map((attack) =>
        getAttackNodeId(attack.combatantId, attack.attackNumber)
      );

      previousNodeIds.forEach((fromNodeId) => {
        stepNodeIds.forEach((toNodeId) => {
          mergeEdgeReason(edgesByKey, fromNodeId, toNodeId, 'direct-melee');
        });
      });
    });
  });

  scenario.party.concat(scenario.enemies).forEach((combatant) => {
    if (directMeleeCombatantIdSet.has(combatant.id)) {
      return;
    }

    combatant.attackRoutine.components.forEach((component) => {
      nodes.push(
        createNode(
          combatant,
          component.id,
          component.order,
          component.label,
          'routine-component'
        )
      );
    });
  });

  if (resolution.simpleOrder === 'party-first') {
    const partyNodeIds = nodes
      .filter((node) => node.side === 'party')
      .map((node) => node.id);
    const enemyNodeIds = nodes
      .filter((node) => node.side === 'enemy')
      .map((node) => node.id);

    partyNodeIds.forEach((fromNodeId) => {
      enemyNodeIds.forEach((toNodeId) => {
        mergeEdgeReason(edgesByKey, fromNodeId, toNodeId, 'simple-initiative');
      });
    });
  }

  if (resolution.simpleOrder === 'enemy-first') {
    const partyNodeIds = nodes
      .filter((node) => node.side === 'party')
      .map((node) => node.id);
    const enemyNodeIds = nodes
      .filter((node) => node.side === 'enemy')
      .map((node) => node.id);

    enemyNodeIds.forEach((fromNodeId) => {
      partyNodeIds.forEach((toNodeId) => {
        mergeEdgeReason(edgesByKey, fromNodeId, toNodeId, 'simple-initiative');
      });
    });
  }

  const edges = Array.from(edgesByKey.values());

  return {
    nodes,
    edges,
    layers: getLayers(nodes, edges),
  };
};
