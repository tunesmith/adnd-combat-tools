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
import { compareCombatantInitiative } from './initiativeTiming';
import {
  determineWeaponVsTimedAction,
  TIMED_ACTION_WEAPON_TIE,
  WEAPON_WINS,
} from '../wsf';

const getAttackNodeId = (combatantId: string, attackNumber: number): string =>
  `attack:${combatantId}:${attackNumber}`;

const getContactNodeId = (combatantId: string): string =>
  `contact:${combatantId}`;

const getSpellStartNodeId = (combatantId: string): string =>
  `spell-start:${combatantId}`;

const getSpellCompletionNodeId = (combatantId: string): string =>
  `spell-completion:${combatantId}`;

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
  segment?: number,
  targetId?: string,
  segmentReason?: InitiativeAttackNode['segmentReason']
): InitiativeAttackNode => ({
  id:
    kind === 'contact'
      ? getContactNodeId(combatant.id)
      : kind === 'spell-start'
      ? getSpellStartNodeId(combatant.id)
      : kind === 'spell-completion'
      ? getSpellCompletionNodeId(combatant.id)
      : getAttackNodeId(combatant.id, attackNumber),
  combatantId: combatant.id,
  targetId,
  routineId: combatant.attackRoutine.id,
  componentId,
  side: combatant.side,
  attackNumber,
  label,
  source,
  kind,
  segment,
  segmentReason,
});

const createRoutineAttackNode = (
  combatant: InitiativeScenarioCombatant,
  segment?: number,
  targetId?: string,
  segmentReason?: InitiativeAttackNode['segmentReason']
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
    segment,
    targetId,
    segmentReason
  );
};

const getDeclaredActionSegment = (
  combatant: InitiativeScenarioCombatant
): number | undefined =>
  combatant.declaredAction === 'magical-device' &&
  combatant.targetDeclarations.length === 1
    ? combatant.targetDeclarations[0]?.activationSegments
    : undefined;

const getSpellCastingSegments = (
  combatant: InitiativeScenarioCombatant
): number | undefined =>
  combatant.declaredAction === 'spell-casting'
    ? combatant.targetDeclarations.find(
        (targetDeclaration) => targetDeclaration.castingSegments !== undefined
      )?.castingSegments
    : undefined;

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
    segment,
    undefined,
    'movement'
  );

const createSpellStartNode = (
  combatant: InitiativeScenarioCombatant,
  segment?: number
): InitiativeAttackNode =>
  createNode(
    combatant,
    'spell-start',
    0,
    'spell start',
    'spell-casting',
    'spell-start',
    segment,
    undefined,
    'spell-start'
  );

const createSpellCompletionNode = (
  combatant: InitiativeScenarioCombatant,
  segment?: number
): InitiativeAttackNode =>
  createNode(
    combatant,
    'spell-completion',
    1,
    'spell completion',
    'spell-casting',
    'spell-completion',
    segment,
    undefined,
    'spell-completion'
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

  if (
    existing.segmentReason === undefined &&
    node.segmentReason !== undefined
  ) {
    existing.segmentReason = node.segmentReason;
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

interface SimpleInitiativePhase {
  combatantId: string;
  nodeId: string;
  side: InitiativeScenarioCombatant['side'];
  phase: number;
  effectiveInitiative: number;
  node: InitiativeAttackNode;
}

const areDirectMeleeOpponents = (
  leftCombatantId: string,
  rightCombatantId: string,
  directMeleeOpponentByCombatantId: Map<string, string>
): boolean =>
  directMeleeOpponentByCombatantId.get(leftCombatantId) === rightCombatantId;

const getRoutineComponentCount = (
  combatant: InitiativeScenarioCombatant
): number => Math.max(1, combatant.attackRoutine.components.length);

const getRoutinePhase = (
  componentOrder: number,
  componentCount: number
): number => {
  if (componentCount <= 1) {
    return 0.5;
  }

  return (componentOrder - 1) / (componentCount - 1);
};

const getSimpleInitiativePhase = (
  combatant: InitiativeScenarioCombatant,
  attackNumber: number
): number => {
  if (combatant.declaredAction === 'missile') {
    return 0.5;
  }

  return getRoutinePhase(attackNumber, getRoutineComponentCount(combatant));
};

const buildSimpleInitiativePhases = (
  simpleInitiativeNodes: InitiativeAttackNode[],
  combatantById: Map<string, InitiativeScenarioCombatant>
): SimpleInitiativePhase[] =>
  simpleInitiativeNodes.flatMap((node) => {
    const combatant = combatantById.get(node.combatantId);

    if (!combatant) {
      return [];
    }

    return [
      {
        combatantId: combatant.id,
        nodeId: node.id,
        side: combatant.side,
        phase: getSimpleInitiativePhase(combatant, node.attackNumber),
        effectiveInitiative:
          combatant.initiative +
          (combatant.declaredAction === 'missile'
            ? combatant.missileInitiativeAdjustment
            : 0),
        node,
      },
    ];
  });

const addSimpleInitiativeEdges = (
  combatantById: Map<string, InitiativeScenarioCombatant>,
  simpleInitiativeNodes: InitiativeAttackNode[],
  edgesByKey: Map<string, InitiativeAttackEdge>,
  directMeleeOpponentByCombatantId: Map<string, string>
) => {
  const phases = buildSimpleInitiativePhases(
    simpleInitiativeNodes,
    combatantById
  );
  const phaseValues = Array.from(
    new Set(phases.map((phase) => phase.phase))
  ).sort((left, right) => left - right);

  phaseValues.forEach((phaseValue, index) => {
    const currentNodes = phases.filter((phase) => phase.phase === phaseValue);
    const nextPhaseValue = phaseValues[index + 1];

    currentNodes.forEach((leftPhase, leftIndex) => {
      currentNodes.slice(leftIndex + 1).forEach((rightPhase) => {
        if (leftPhase.side === rightPhase.side) {
          return;
        }

        if (
          (leftPhase.node.segmentReason === 'spell-directed' ||
            rightPhase.node.segmentReason === 'spell-directed') &&
          leftPhase.combatantId !== rightPhase.combatantId
        ) {
          return;
        }

        if (
          areDirectMeleeOpponents(
            leftPhase.combatantId,
            rightPhase.combatantId,
            directMeleeOpponentByCombatantId
          )
        ) {
          return;
        }

        if (leftPhase.effectiveInitiative > rightPhase.effectiveInitiative) {
          mergeEdgeReason(
            edgesByKey,
            leftPhase.nodeId,
            rightPhase.nodeId,
            'simple-initiative'
          );
          return;
        }

        if (rightPhase.effectiveInitiative > leftPhase.effectiveInitiative) {
          mergeEdgeReason(
            edgesByKey,
            rightPhase.nodeId,
            leftPhase.nodeId,
            'simple-initiative'
          );
        }
      });
    });

    if (nextPhaseValue === undefined) {
      return;
    }

    const nextNodes = phases
      .filter((phase) => phase.phase === nextPhaseValue)
      .map((phase) => phase.nodeId);
    const currentNodeIds = currentNodes.map((phase) => phase.nodeId);

    currentNodeIds.forEach((fromNodeId) => {
      const fromPhase = currentNodes.find(
        (phase) => phase.nodeId === fromNodeId
      );
      nextNodes.forEach((toNodeId) => {
        const toPhase = phases.find((phase) => phase.nodeId === toNodeId);

        if (
          fromPhase?.node.segmentReason === 'spell-directed' &&
          fromPhase.combatantId !== toPhase?.combatantId
        ) {
          return;
        }

        if (
          fromPhase &&
          toPhase &&
          areDirectMeleeOpponents(
            fromPhase.combatantId,
            toPhase.combatantId,
            directMeleeOpponentByCombatantId
          )
        ) {
          return;
        }

        mergeEdgeReason(edgesByKey, fromNodeId, toNodeId, 'simple-initiative');
      });
    });
  });
};

const addRoutineSequenceEdges = (
  combatantById: Map<string, InitiativeScenarioCombatant>,
  simpleInitiativeNodes: InitiativeAttackNode[],
  edgesByKey: Map<string, InitiativeAttackEdge>
) => {
  const nodesByCombatant = new Map<string, InitiativeAttackNode[]>();

  simpleInitiativeNodes.forEach((node) => {
    const existing = nodesByCombatant.get(node.combatantId) || [];
    existing.push(node);
    nodesByCombatant.set(node.combatantId, existing);
  });

  nodesByCombatant.forEach((nodes, combatantId) => {
    const combatant = combatantById.get(combatantId);

    if (
      !combatant ||
      combatant.declaredAction === 'missile' ||
      combatant.attackRoutine.components.length <= 1
    ) {
      return;
    }

    const orderedNodes = [...nodes].sort(
      (leftNode, rightNode) => leftNode.attackNumber - rightNode.attackNumber
    );

    orderedNodes.forEach((node, index) => {
      const nextNode = orderedNodes[index + 1];

      if (!nextNode) {
        return;
      }

      mergeEdgeReason(edgesByKey, node.id, nextNode.id, 'simple-initiative');
    });
  });
};

const addDirectMovementPrecedence = (
  resolution: InitiativeRoundResolution,
  combatantById: Map<string, InitiativeScenarioCombatant>,
  movementHandledCombatantIdSet: Set<string>,
  nodesById: Map<string, InitiativeAttackNode>,
  edgesByKey: Map<string, InitiativeAttackEdge>
) => {
  resolution.movementResolutions.forEach((movementResolution) => {
    if (movementResolution.targetId === undefined) {
      return;
    }

    const mover = combatantById.get(movementResolution.combatantId);
    const target = combatantById.get(movementResolution.targetId);

    if (
      !mover ||
      !target ||
      !target.targetIds.includes(mover.id) ||
      movementHandledCombatantIdSet.has(target.id)
    ) {
      return;
    }

    const moverNodeIds = Array.from(nodesById.values())
      .filter((node) => node.combatantId === mover.id)
      .map((node) => node.id);
    const targetNodeIds = Array.from(nodesById.values())
      .filter((node) => node.combatantId === target.id)
      .map((node) => node.id);

    if (moverNodeIds.length === 0 || targetNodeIds.length === 0) {
      return;
    }

    const initiativeComparison = compareCombatantInitiative(target, mover);

    if (initiativeComparison === 0) {
      return;
    }

    const fromNodeIds = initiativeComparison > 0 ? targetNodeIds : moverNodeIds;
    const toNodeIds = initiativeComparison > 0 ? moverNodeIds : targetNodeIds;

    fromNodeIds.forEach((fromNodeId) => {
      toNodeIds.forEach((toNodeId) => {
        mergeEdgeReason(edgesByKey, fromNodeId, toNodeId, 'simple-initiative');
      });
    });
  });
};

const getDirectMissileChargeComponentLimit = (
  combatant: InitiativeScenarioCombatant,
  combatantById: Map<string, InitiativeScenarioCombatant>,
  movementResolutionByCombatantId: Map<string, InitiativeMovementResolution>
): number | undefined => {
  if (
    combatant.declaredAction !== 'missile' ||
    combatant.targetIds.length !== 1
  ) {
    return undefined;
  }

  const targetId = combatant.targetIds[0];
  if (!targetId) {
    return undefined;
  }

  const target = combatantById.get(targetId);
  const targetMovementResolution =
    movementResolutionByCombatantId.get(targetId);

  if (
    !target ||
    target.declaredAction !== 'charge' ||
    target.targetDeclarations.length !== 1 ||
    target.targetDeclarations[0]?.targetId !== combatant.id ||
    targetMovementResolution?.reason !== 'contact' ||
    !targetMovementResolution.sameRoundAttack ||
    targetMovementResolution.targetId !== combatant.id
  ) {
    return undefined;
  }

  const initiativeComparison = compareCombatantInitiative(combatant, target);

  if (initiativeComparison === 0) {
    return 1;
  }

  return initiativeComparison > 0 ? 1 : 0;
};

type SpellTimingRelation =
  | 'before'
  | 'simultaneous'
  | 'after'
  | 'indeterminate';

const compareToSpellCompletion = (
  timingSegment: number,
  castingSegments: number
): SpellTimingRelation =>
  timingSegment < castingSegments
    ? 'before'
    : timingSegment === castingSegments
    ? 'simultaneous'
    : 'after';

const getRelevantSpellDirectedNodes = (
  attacker: InitiativeScenarioCombatant,
  nodesById: Map<string, InitiativeAttackNode>
): InitiativeAttackNode[] => {
  if (attacker.declaredAction === 'spell-casting') {
    const completionNode = nodesById.get(getSpellCompletionNodeId(attacker.id));
    return completionNode ? [completionNode] : [];
  }

  return Array.from(nodesById.values()).filter(
    (node) => node.combatantId === attacker.id && node.kind === 'attack'
  );
};

const getSpellInterruptionRelation = (
  attacker: InitiativeScenarioCombatant,
  caster: InitiativeScenarioCombatant,
  castingSegments: number,
  attackerNode: InitiativeAttackNode
): SpellTimingRelation => {
  if (castingSegments === 0) {
    return 'after';
  }

  if (attacker.declaredAction === 'spell-casting') {
    const attackerCastingSegments = getSpellCastingSegments(attacker) ?? 1;
    const spellTimingRelation = compareToSpellCompletion(
      attackerCastingSegments,
      castingSegments
    );

    if (spellTimingRelation !== 'simultaneous') {
      return spellTimingRelation;
    }

    const initiativeComparison = compareCombatantInitiative(attacker, caster);

    if (initiativeComparison > 0) {
      return 'before';
    }

    if (initiativeComparison < 0) {
      return 'after';
    }

    return 'simultaneous';
  }

  if (attackerNode.segment !== undefined) {
    return compareToSpellCompletion(attackerNode.segment, castingSegments);
  }

  const initiativeComparison = compareCombatantInitiative(attacker, caster);
  const isLaterOrdinaryRoutineAttack =
    attackerNode.kind === 'attack' &&
    attacker.attackRoutine.components.length > 1 &&
    attackerNode.attackNumber > 1 &&
    attacker.declaredAction !== 'missile';

  // The DMG multiple-routine rule establishes a later attack as "last" in the
  // round, not as another early attack segment. Treat that later ordinary
  // routine as too vague to order against same-round spell completion unless a
  // narrower timing rule makes it explicit.
  if (isLaterOrdinaryRoutineAttack) {
    return castingSegments >= 10 ? 'before' : 'indeterminate';
  }

  if (
    attacker.declaredAction === 'open-melee' &&
    attacker.weaponType === 'melee' &&
    attacker.weaponSpeedFactor !== undefined &&
    initiativeComparison <= 0
  ) {
    const weaponVsSpellResult = determineWeaponVsTimedAction(
      attacker.weaponSpeedFactor,
      castingSegments,
      initiativeComparison === 0 ? null : attacker.initiative
    );

    if (weaponVsSpellResult === WEAPON_WINS) {
      return 'before';
    }

    if (weaponVsSpellResult === TIMED_ACTION_WEAPON_TIE) {
      return 'simultaneous';
    }

    return 'after';
  }

  if (initiativeComparison > 0) {
    return 'before';
  }

  return compareToSpellCompletion(caster.initiative, castingSegments);
};

const getSpellInterruptionSegment = (
  attacker: InitiativeScenarioCombatant,
  caster: InitiativeScenarioCombatant,
  castingSegments: number,
  attackerNode: InitiativeAttackNode
): number | undefined => {
  if (castingSegments === 0) {
    return undefined;
  }

  if (attacker.declaredAction === 'spell-casting') {
    return undefined;
  }

  if (attackerNode.segment !== undefined) {
    return attackerNode.segment;
  }

  const initiativeComparison = compareCombatantInitiative(attacker, caster);
  const isLaterOrdinaryRoutineAttack =
    attackerNode.kind === 'attack' &&
    attacker.attackRoutine.components.length > 1 &&
    attackerNode.attackNumber > 1 &&
    attacker.declaredAction !== 'missile';

  if (isLaterOrdinaryRoutineAttack) {
    return undefined;
  }

  if (
    attacker.declaredAction === 'open-melee' &&
    attacker.weaponType === 'melee' &&
    attacker.weaponSpeedFactor !== undefined &&
    initiativeComparison <= 0
  ) {
    return undefined;
  }

  return initiativeComparison <= 0 ? caster.initiative : undefined;
};

const addSpellInterruptionEdges = (
  scenario: InitiativeScenario,
  nodesById: Map<string, InitiativeAttackNode>,
  edgesByKey: Map<string, InitiativeAttackEdge>
) => {
  scenario.party.concat(scenario.enemies).forEach((caster) => {
    if (
      caster.declaredAction !== 'spell-casting' ||
      caster.targetIds.length < 1
    ) {
      return;
    }

    const completionNodeId = getSpellCompletionNodeId(caster.id);
    if (!nodesById.has(completionNodeId)) {
      return;
    }

    const castingSegments = getSpellCastingSegments(caster) ?? 1;
    const attackers = scenario.party
      .concat(scenario.enemies)
      .filter(
        (combatant) =>
          combatant.id !== caster.id && combatant.targetIds.includes(caster.id)
      );

    attackers.forEach((attacker) => {
      const attackerNodes = getRelevantSpellDirectedNodes(
        attacker,
        nodesById
      ).filter(
        (attackerNode) =>
          attackerNode.targetId === undefined ||
          attackerNode.targetId === caster.id
      );
      if (attackerNodes.length === 0) {
        return;
      }

      attackerNodes.forEach((attackerNode) => {
        const interruptionSegment = getSpellInterruptionSegment(
          attacker,
          caster,
          castingSegments,
          attackerNode
        );

        if (
          interruptionSegment !== undefined &&
          attackerNode.segment === undefined
        ) {
          attackerNode.segment = interruptionSegment;
          attackerNode.segmentReason = 'spell-directed';
        }

        const relation = getSpellInterruptionRelation(
          attacker,
          caster,
          castingSegments,
          attackerNode
        );

        if (relation === 'before') {
          mergeEdgeReason(
            edgesByKey,
            attackerNode.id,
            completionNodeId,
            'spell-interruption'
          );
          return;
        }

        if (relation === 'after') {
          mergeEdgeReason(
            edgesByKey,
            completionNodeId,
            attackerNode.id,
            'spell-interruption'
          );
        }
      });
    });
  });
};

export const buildInitiativeAttackGraph = (
  scenario: InitiativeScenario,
  resolution: InitiativeRoundResolution
): InitiativeAttackGraph => {
  const combatantById = getCombatantById(scenario);
  const nodesById = new Map<string, InitiativeAttackNode>();
  const edgesByKey = new Map<string, InitiativeAttackEdge>();
  const directMeleeOpponentByCombatantId = new Map(
    resolution.directMeleeEngagements.flatMap((engagement) => [
      [engagement.partyCombatantId, engagement.enemyCombatantId] as const,
      [engagement.enemyCombatantId, engagement.partyCombatantId] as const,
    ])
  );
  const directMeleeCombatantIdSet = new Set(
    directMeleeOpponentByCombatantId.keys()
  );
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
  const simultaneousGroupsByKey = new Map<string, string[]>();

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

      if (step.attacks.length > 1 && stepNodeIds.length > 1) {
        const simultaneousNodeIds = stepNodeIds.filter((nodeId) => {
          const node = nodesById.get(nodeId);
          return node?.segment === undefined;
        });

        if (simultaneousNodeIds.length > 1) {
          const groupKey = [...simultaneousNodeIds].sort().join('|');
          simultaneousGroupsByKey.set(groupKey, simultaneousNodeIds);
        }
      }

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

    movementHandledCombatantIdSet.add(attacker.id);

    if (!movementResolution.sameRoundAttack) {
      const contactNode = createContactNode(
        attacker,
        movementResolution.contactSegment
      );
      addNode(nodesById, contactNode);
      return;
    }

    const attackerAttackNode = createRoutineAttackNode(
      attacker,
      movementResolution.contactSegment
    );
    addNode(nodesById, attackerAttackNode);
    movementHandledCombatantIdSet.add(attacker.id);

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
        movementResolution.contactSegment,
      attacker.id
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
      combatant.declaredAction === 'spell-casting' &&
      hasRegisteredCombatAction(combatant)
    ) {
      const castingSegments = getSpellCastingSegments(combatant);
      const spellStartNode = createSpellStartNode(
        combatant,
        castingSegments !== undefined && castingSegments > 0 ? 1 : undefined
      );
      const spellCompletionNode = createSpellCompletionNode(
        combatant,
        castingSegments !== undefined && castingSegments > 0
          ? castingSegments
          : undefined
      );
      addNode(nodesById, spellStartNode);
      addNode(nodesById, spellCompletionNode);
      mergeEdgeReason(
        edgesByKey,
        spellStartNode.id,
        spellCompletionNode.id,
        'spell-casting'
      );
      return;
    }

    if (
      directMeleeCombatantIdSet.has(combatant.id) ||
      movementResolutionCombatantIdSet.has(combatant.id) ||
      movementHandledCombatantIdSet.has(combatant.id) ||
      !hasRegisteredCombatAction(combatant) ||
      hasInvalidOpenMeleeOpposition(combatant, movementResolutionByCombatantId)
    ) {
      return;
    }

    const directMissileChargeComponentLimit =
      getDirectMissileChargeComponentLimit(
        combatant,
        combatantById,
        movementResolutionByCombatantId
      );
    const attackRoutineComponents =
      directMissileChargeComponentLimit === undefined
        ? combatant.attackRoutine.components
        : combatant.attackRoutine.components.slice(
            0,
            directMissileChargeComponentLimit
          );

    if (
      combatant.declaredAction === 'missile' &&
      combatant.targetIds.length > 0
    ) {
      const missileTargetIds = combatant.targetIds.slice(
        0,
        attackRoutineComponents.length
      );
      const usesTargetSpecificMissileNodes = missileTargetIds.length > 1;

      if (usesTargetSpecificMissileNodes) {
        missileTargetIds.forEach((targetId, index) => {
          const component =
            attackRoutineComponents[index] || attackRoutineComponents[0];

          if (!component) {
            return;
          }

          addNode(
            nodesById,
            createNode(
              combatant,
              component.id,
              component.order,
              component.label,
              'routine-component',
              'attack',
              getDeclaredActionSegment(combatant),
              targetId,
              getDeclaredActionSegment(combatant) !== undefined
                ? 'declared-action'
                : undefined
            )
          );
        });
        return;
      }
    }

    attackRoutineComponents.forEach((component) => {
      addNode(
        nodesById,
        createNode(
          combatant,
          component.id,
          component.order,
          component.label,
          'routine-component',
          'attack',
          getDeclaredActionSegment(combatant),
          combatant.targetIds.length === 1 ? combatant.targetIds[0] : undefined,
          getDeclaredActionSegment(combatant) !== undefined
            ? 'declared-action'
            : undefined
        )
      );
    });
  });

  const nodes = Array.from(nodesById.values());
  const simpleInitiativeNodes = nodes.filter(
    (node) =>
      node.kind === 'attack' &&
      !movementHandledCombatantIdSet.has(node.combatantId)
  );

  addSpellInterruptionEdges(scenario, nodesById, edgesByKey);
  addDirectMovementPrecedence(
    resolution,
    combatantById,
    movementHandledCombatantIdSet,
    nodesById,
    edgesByKey
  );
  addRoutineSequenceEdges(combatantById, simpleInitiativeNodes, edgesByKey);
  addSimpleInitiativeEdges(
    combatantById,
    simpleInitiativeNodes,
    edgesByKey,
    directMeleeOpponentByCombatantId
  );

  const edges = Array.from(edgesByKey.values());

  return {
    nodes,
    edges,
    layers: getLayers(nodes, edges),
    simultaneousGroups: Array.from(simultaneousGroupsByKey.values()),
  };
};
