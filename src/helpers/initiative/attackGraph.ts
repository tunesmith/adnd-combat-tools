import type {
  InitiativeAttackEdge,
  InitiativeAttackEdgeReason,
  InitiativeAttackGraph,
  InitiativeMovementResolution,
  InitiativeAttackNode,
  InitiativeRoundResolution,
  InitiativeScenario,
  InitiativeScenarioCombatant,
} from '../../types/initiative';

const getAttackNodeId = (combatantId: string, attackNumber: number): string =>
  `attack:${combatantId}:${attackNumber}`;

const getContactNodeId = (combatantId: string): string =>
  `contact:${combatantId}`;

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
  source: InitiativeAttackNode['source'],
  kind: InitiativeAttackNode['kind'],
  segment?: number
): InitiativeAttackNode => ({
  id:
    kind === 'contact'
      ? getContactNodeId(combatant.id)
      : getAttackNodeId(combatant.id, attackNumber),
  combatantId: combatant.id,
  routineId: combatant.attackRoutine.id,
  componentId,
  side: combatant.side,
  attackNumber,
  label,
  source,
  kind,
  segment,
});

const createRoutineAttackNode = (
  combatant: InitiativeScenarioCombatant,
  segment?: number
): InitiativeAttackNode => {
  const timingBasisComponent =
    combatant.attackRoutine.components.find(
      (component) =>
        component.id === combatant.attackRoutine.timingBasisComponentId
    ) || combatant.attackRoutine.components[0];

  if (!timingBasisComponent) {
    throw new Error(`Missing timing basis component for ${combatant.id}`);
  }

  return createNode(
    combatant,
    timingBasisComponent.id,
    timingBasisComponent.order,
    timingBasisComponent.label,
    'routine-component',
    'attack',
    segment
  );
};

const hasRegisteredCombatAction = (
  combatant: InitiativeScenarioCombatant
): boolean => combatant.targetIds.length > 0;

const hasInvalidOpenMeleeOpposition = (
  combatant: InitiativeScenarioCombatant,
  movementResolutionByCombatantId: Map<string, InitiativeMovementResolution>
): boolean =>
  combatant.declaredAction === 'open-melee' &&
  combatant.targetIds.some((targetId) => {
    const targetMovementResolution =
      movementResolutionByCombatantId.get(targetId);
    return (
      targetMovementResolution?.reason === 'invalid-open-melee-target' &&
      targetMovementResolution.targetId === combatant.id
    );
  });

const createContactNode = (
  combatant: InitiativeScenarioCombatant,
  segment: number
): InitiativeAttackNode =>
  createNode(
    combatant,
    'contact',
    0,
    'contact',
    'movement-contact',
    'contact',
    segment
  );

const addNode = (
  nodesById: Map<string, InitiativeAttackNode>,
  node: InitiativeAttackNode
) => {
  const existing = nodesById.get(node.id);

  if (!existing) {
    nodesById.set(node.id, node);
    return;
  }

  if (existing.segment === undefined && node.segment !== undefined) {
    existing.segment = node.segment;
  }
};

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
  const nodesById = new Map<string, InitiativeAttackNode>();
  const edgesByKey = new Map<string, InitiativeAttackEdge>();
  const movementResolutionByCombatantId = new Map(
    resolution.movementResolutions.map((movementResolution) => [
      movementResolution.combatantId,
      movementResolution,
    ])
  );
  const movementResolutionCombatantIdSet = new Set(
    resolution.movementResolutions.map(
      (movementResolution) => movementResolution.combatantId
    )
  );
  const movementHandledCombatantIdSet = new Set<string>();

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
          attack.source,
          'attack'
        );
        addNode(nodesById, node);
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

  resolution.movementResolutions.forEach((movementResolution) => {
    if (
      movementResolution.reason !== 'contact' ||
      movementResolution.targetId === undefined ||
      movementResolution.contactSegment === undefined
    ) {
      return;
    }

    const attacker = combatantById.get(movementResolution.combatantId);
    const target = combatantById.get(movementResolution.targetId);

    if (!attacker || !target) {
      return;
    }

    const contactNode = createContactNode(
      attacker,
      movementResolution.contactSegment
    );
    addNode(nodesById, contactNode);
    movementHandledCombatantIdSet.add(attacker.id);

    if (!movementResolution.sameRoundAttack) {
      return;
    }

    const attackerAttackNode = createRoutineAttackNode(
      attacker,
      movementResolution.contactSegment
    );
    addNode(nodesById, attackerAttackNode);
    movementHandledCombatantIdSet.add(attacker.id);
    mergeEdgeReason(
      edgesByKey,
      contactNode.id,
      attackerAttackNode.id,
      'movement'
    );

    const targetMovementResolution = movementResolutionByCombatantId.get(
      target.id
    );
    const targetCanRespond =
      (target.declaredAction === 'open-melee' &&
        target.targetIds.includes(attacker.id)) ||
      Boolean(
        targetMovementResolution?.reason === 'contact' &&
          targetMovementResolution.sameRoundAttack &&
          targetMovementResolution.targetId === attacker.id
      );

    if (!targetCanRespond) {
      return;
    }

    const targetAttackNode = createRoutineAttackNode(
      target,
      targetMovementResolution?.contactSegment ||
        movementResolution.contactSegment
    );
    addNode(nodesById, targetAttackNode);
    movementHandledCombatantIdSet.add(target.id);

    if (movementResolution.firstStrike === 'attacker') {
      mergeEdgeReason(
        edgesByKey,
        attackerAttackNode.id,
        targetAttackNode.id,
        'movement'
      );
      return;
    }

    mergeEdgeReason(
      edgesByKey,
      contactNode.id,
      targetAttackNode.id,
      'movement'
    );

    if (movementResolution.firstStrike === 'target') {
      mergeEdgeReason(
        edgesByKey,
        targetAttackNode.id,
        attackerAttackNode.id,
        'movement'
      );
    }
  });

  scenario.party.concat(scenario.enemies).forEach((combatant) => {
    if (
      directMeleeCombatantIdSet.has(combatant.id) ||
      movementResolutionCombatantIdSet.has(combatant.id) ||
      movementHandledCombatantIdSet.has(combatant.id) ||
      !hasRegisteredCombatAction(combatant) ||
      hasInvalidOpenMeleeOpposition(combatant, movementResolutionByCombatantId)
    ) {
      return;
    }

    combatant.attackRoutine.components.forEach((component) => {
      addNode(
        nodesById,
        createNode(
          combatant,
          component.id,
          component.order,
          component.label,
          'routine-component',
          'attack'
        )
      );
    });
  });

  const nodes = Array.from(nodesById.values());
  const simpleInitiativeNodes = nodes.filter(
    (node) =>
      !directMeleeCombatantIdSet.has(node.combatantId) &&
      !movementHandledCombatantIdSet.has(node.combatantId)
  );

  if (resolution.simpleOrder === 'party-first') {
    const partyNodeIds = simpleInitiativeNodes
      .filter((node) => node.side === 'party')
      .map((node) => node.id);
    const enemyNodeIds = simpleInitiativeNodes
      .filter((node) => node.side === 'enemy')
      .map((node) => node.id);

    partyNodeIds.forEach((fromNodeId) => {
      enemyNodeIds.forEach((toNodeId) => {
        mergeEdgeReason(edgesByKey, fromNodeId, toNodeId, 'simple-initiative');
      });
    });
  }

  if (resolution.simpleOrder === 'enemy-first') {
    const partyNodeIds = simpleInitiativeNodes
      .filter((node) => node.side === 'party')
      .map((node) => node.id);
    const enemyNodeIds = simpleInitiativeNodes
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
