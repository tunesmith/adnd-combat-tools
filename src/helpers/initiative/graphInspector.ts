import { buildInitiativeAttackGraphNodeDisplayById } from './attackGraphDisplay';
import {
  compareCombatantInitiative,
  getEffectiveInitiative,
} from './initiativeTiming';
import { getMultipleAttackThreshold } from './openMelee';
import type { InitiativeResolvedRound } from './resolvedRound';
import type {
  DirectMeleeEngagement,
  InitiativeAttackEdge,
  InitiativeAttackGraph,
  InitiativeAttackNode,
  InitiativeChargeFirstStrike,
  InitiativeDeclaredAction,
  InitiativeScenarioCombatant,
  InitiativeTimingOverride,
} from '../../types/initiative';

export type InitiativeGraphNodeStatus = 'resolved' | 'lost';

export interface InitiativeGraphNodeReference {
  combatantName: string;
  actionTitle: string;
  actionMeta?: string;
}

interface InitiativeGraphInspectorLinkedNode {
  nodeId: string;
  reference: InitiativeGraphNodeReference;
}

interface InitiativeGraphInspectorIncomingNode
  extends InitiativeGraphInspectorLinkedNode {
  explanation: string;
}

export interface InitiativeGraphInspectorModel {
  nodeId: string;
  node: InitiativeAttackNode;
  nodeStatus?: InitiativeGraphNodeStatus;
  reference: InitiativeGraphNodeReference;
  sideLabel: string;
  timingLabel?: string;
  statusLabel: string;
  lostActionLabel: string;
  whyHere: string[];
  incoming: InitiativeGraphInspectorIncomingNode[];
  outgoing: InitiativeGraphInspectorLinkedNode[];
}

const formatDeclaredAction = (
  declaredAction: InitiativeDeclaredAction
): string =>
  declaredAction === 'none'
    ? 'No combat action'
    : declaredAction === 'open-melee'
    ? 'Open melee'
    : declaredAction === 'close'
    ? 'Move/Close'
    : declaredAction === 'set-vs-charge'
    ? 'Set vs charge'
    : declaredAction === 'turn-undead'
    ? 'Turn undead'
    : declaredAction === 'magical-device'
    ? 'Magical device'
    : declaredAction === 'spell-casting'
    ? 'Cast spell'
    : declaredAction === 'charge'
    ? 'Charge'
    : 'Missile';

const formatScenarioCombatantActionLabel = (
  combatant: InitiativeScenarioCombatant
): string =>
  combatant.actionLabel
    ? `${combatant.actionLabel} (${formatDeclaredAction(
        combatant.declaredAction
      )})`
    : formatDeclaredAction(combatant.declaredAction);

const formatInitiativeTimingMeta = (
  initiativeTiming: InitiativeTimingOverride | undefined
): string | undefined => {
  if (!initiativeTiming || initiativeTiming === 'normal') {
    return undefined;
  }

  return initiativeTiming === 'wins-initiative'
    ? 'Wins initiative'
    : 'Loses initiative';
};

const getEffectiveInitiativeValue = (
  combatant: InitiativeScenarioCombatant
): number => getEffectiveInitiative(combatant);

const getInitiativeTimingExplanation = (
  earlierCombatant: InitiativeScenarioCombatant,
  laterCombatant: InitiativeScenarioCombatant
): string | undefined => {
  const earlierTiming = formatInitiativeTimingMeta(
    earlierCombatant.initiativeTiming
  );
  const laterTiming = formatInitiativeTimingMeta(
    laterCombatant.initiativeTiming
  );

  if (earlierTiming && laterTiming) {
    return `${earlierCombatant.name}'s ${formatScenarioCombatantActionLabel(
      earlierCombatant
    )} is marked ${earlierTiming.toLowerCase()}, while ${
      laterCombatant.name
    }'s ${formatScenarioCombatantActionLabel(
      laterCombatant
    )} is marked ${laterTiming.toLowerCase()}.`;
  }

  if (earlierTiming) {
    return `${earlierCombatant.name}'s ${formatScenarioCombatantActionLabel(
      earlierCombatant
    )} is marked ${earlierTiming.toLowerCase()}.`;
  }

  if (laterTiming) {
    return `${laterCombatant.name}'s ${formatScenarioCombatantActionLabel(
      laterCombatant
    )} is marked ${laterTiming.toLowerCase()}.`;
  }

  return undefined;
};

const getDirectMeleeEngagementKey = (
  leftCombatantId: string,
  rightCombatantId: string
) => `${leftCombatantId}|${rightCombatantId}`;

const getDirectMeleeFasterAndSlower = (
  left: InitiativeScenarioCombatant,
  right: InitiativeScenarioCombatant
) => {
  if (
    left.weaponSpeedFactor !== undefined &&
    right.weaponSpeedFactor !== undefined &&
    left.weaponSpeedFactor <= right.weaponSpeedFactor
  ) {
    return {
      faster: left,
      slower: right,
    };
  }

  return {
    faster: right,
    slower: left,
  };
};

const findDirectMeleeStepIndex = (
  engagement: DirectMeleeEngagement,
  node: InitiativeAttackNode
) =>
  engagement.resolution.steps.findIndex((step) =>
    step.attacks.some(
      (attack) =>
        attack.combatantId === node.combatantId &&
        attack.attackNumber === node.attackNumber
    )
  );

const getDirectMeleeWhyHereText = ({
  node,
  combatant,
  opponent,
  engagement,
}: {
  node: InitiativeAttackNode;
  combatant: InitiativeScenarioCombatant;
  opponent: InitiativeScenarioCombatant;
  engagement: DirectMeleeEngagement;
}): string => {
  const tieInitiative = combatant.initiative;
  const { faster, slower } = getDirectMeleeFasterAndSlower(
    combatant.side === 'party' ? combatant : opponent,
    combatant.side === 'party' ? opponent : combatant
  );

  switch (engagement.resolution.reason) {
    case 'initiative': {
      const winner =
        combatant.initiative > opponent.initiative ? combatant : opponent;
      const loser = winner.id === combatant.id ? opponent : combatant;

      return `${combatant.name} and ${opponent.name} are in direct melee. ${
        winner.name
      } wins initiative ${winner.initiative} to ${loser.initiative}, so ${
        winner.id === combatant.id
          ? 'this blow comes first'
          : `${combatant.name}'s blow comes after ${winner.name}'s`
      }.`;
    }

    case 'simultaneous': {
      if (
        combatant.weaponType === 'melee' &&
        opponent.weaponType === 'melee' &&
        combatant.weaponSpeedFactor === opponent.weaponSpeedFactor &&
        combatant.weaponSpeedFactor !== undefined
      ) {
        return `${combatant.name} and ${opponent.name} are in direct melee with initiative tied at ${tieInitiative}. Their weapons are equally fast at weapon speed factor ${combatant.weaponSpeedFactor}, so these blows land simultaneously.`;
      }

      if (
        combatant.weaponType === 'natural' ||
        opponent.weaponType === 'natural'
      ) {
        const naturalWeaponCombatant =
          combatant.weaponType === 'natural' ? combatant : opponent;

        return `${combatant.name} and ${opponent.name} are in direct melee with initiative tied at ${tieInitiative}. ${naturalWeaponCombatant.name} is attacking with natural weapons, so weapon speed does not break the tie and these blows land simultaneously.`;
      }

      return `${combatant.name} and ${opponent.name} are in direct melee with initiative tied at ${tieInitiative}. At least one combatant is not using a melee weapon with a speed factor, so neither blow gains priority and they land simultaneously.`;
    }

    case 'multiple-routines': {
      return `${combatant.name} and ${
        opponent.name
      } are in direct melee, and multiple routines are in play. This blow is placed by the DMG first/middle/last routine order${
        combatant.attackRoutine.components.length > 1
          ? `. This is ${combatant.name}'s attack ${node.attackNumber} in that sequence.`
          : '.'
      }`;
    }

    case 'weapon-speed': {
      if (
        faster.weaponSpeedFactor === undefined ||
        slower.weaponSpeedFactor === undefined
      ) {
        return `${combatant.name} and ${opponent.name} are in direct melee with initiative tied at ${tieInitiative}. Weapon speed breaks the tie here.`;
      }

      if (combatant.id === faster.id) {
        return `${combatant.name} and ${opponent.name} are in direct melee with initiative tied at ${tieInitiative}. ${combatant.name}'s ${combatant.weaponName} is faster (${combatant.weaponSpeedFactor} vs ${opponent.weaponSpeedFactor}), so this blow comes first.`;
      }

      return `${combatant.name} and ${opponent.name} are in direct melee with initiative tied at ${tieInitiative}. ${faster.name}'s ${faster.weaponName} is faster (${faster.weaponSpeedFactor} vs ${slower.weaponSpeedFactor}), so ${combatant.name}'s blow comes after ${faster.name}'s.`;
    }

    case 'weapon-speed-double': {
      if (
        faster.weaponSpeedFactor === undefined ||
        slower.weaponSpeedFactor === undefined
      ) {
        return `${combatant.name} and ${opponent.name} are in direct melee with initiative tied at ${tieInitiative}. The faster weapon earns an extra blow here.`;
      }

      if (combatant.id === faster.id && node.attackNumber === 2) {
        return `${combatant.name} and ${
          opponent.name
        } are in direct melee with initiative tied at ${tieInitiative}. ${
          combatant.name
        }'s ${combatant.weaponName} is more than twice as fast as ${
          opponent.name
        }'s ${opponent.weaponName} (${combatant.weaponSpeedFactor} vs ${
          opponent.weaponSpeedFactor
        }; threshold ${getMultipleAttackThreshold(
          faster.weaponSpeedFactor
        )}), so ${combatant.name} gets this extra second blow before ${
          opponent.name
        } can strike.`;
      }

      if (combatant.id === faster.id) {
        return `${combatant.name} and ${opponent.name} are in direct melee with initiative tied at ${tieInitiative}. ${combatant.name}'s ${combatant.weaponName} is more than twice as fast as ${opponent.name}'s ${opponent.weaponName} (${combatant.weaponSpeedFactor} vs ${opponent.weaponSpeedFactor}), so ${combatant.name} gets two blows before ${opponent.name}'s first.`;
      }

      return `${combatant.name} and ${opponent.name} are in direct melee with initiative tied at ${tieInitiative}. ${faster.name}'s ${faster.weaponName} is more than twice as fast as ${slower.name}'s ${slower.weaponName} (${faster.weaponSpeedFactor} vs ${slower.weaponSpeedFactor}), so ${combatant.name}'s first blow waits until after ${faster.name}'s two attacks.`;
    }

    case 'weapon-speed-triple': {
      if (
        faster.weaponSpeedFactor === undefined ||
        slower.weaponSpeedFactor === undefined
      ) {
        return `${combatant.name} and ${opponent.name} are in direct melee with initiative tied at ${tieInitiative}. The faster weapon gets an extra third blow here.`;
      }

      const stepIndex = findDirectMeleeStepIndex(engagement, node);

      if (combatant.id === faster.id && node.attackNumber < 3) {
        return `${combatant.name} and ${opponent.name} are in direct melee with initiative tied at ${tieInitiative}. ${combatant.name}'s ${combatant.weaponName} is at least 10 factors faster than ${opponent.name}'s ${opponent.weaponName} (${combatant.weaponSpeedFactor} vs ${opponent.weaponSpeedFactor}), so ${combatant.name} gets extra early blows before ${opponent.name} can strike.`;
      }

      if (stepIndex >= 0) {
        return `${combatant.name} and ${opponent.name} are in direct melee with initiative tied at ${tieInitiative}. The weapon speed difference is 10 or more (${faster.weaponSpeedFactor} vs ${slower.weaponSpeedFactor}), so ${faster.name}'s third blow and ${slower.name}'s first blow are simultaneous.`;
      }

      return `${combatant.name} and ${opponent.name} are in direct melee with initiative tied at ${tieInitiative}. The large weapon speed difference creates an extra third blow in this exchange.`;
    }
  }
};

const getDirectMeleeEdgeExplanation = ({
  engagement,
  fromNode,
  toNode,
  fromCombatant,
  toCombatant,
  fromName,
  toName,
}: {
  engagement: DirectMeleeEngagement;
  fromNode?: InitiativeAttackNode;
  toNode?: InitiativeAttackNode;
  fromCombatant?: InitiativeScenarioCombatant;
  toCombatant?: InitiativeScenarioCombatant;
  fromName: string;
  toName: string;
}): string => {
  if (!fromCombatant || !toCombatant || !fromNode || !toNode) {
    return `${fromName} and ${toName} are part of the same direct melee exchange.`;
  }

  const left = fromCombatant.side === 'party' ? fromCombatant : toCombatant;
  const right = fromCombatant.side === 'party' ? toCombatant : fromCombatant;
  const { faster } = getDirectMeleeFasterAndSlower(left, right);

  switch (engagement.resolution.reason) {
    case 'initiative': {
      const winner =
        compareCombatantInitiative(fromCombatant, toCombatant) > 0
          ? fromCombatant
          : toCombatant;
      const loser =
        winner.id === fromCombatant.id ? toCombatant : fromCombatant;
      const timingExplanation = getInitiativeTimingExplanation(winner, loser);

      if (timingExplanation) {
        return `${timingExplanation} ${fromName} comes before ${toName} in this melee exchange.`;
      }

      return `${winner.name} wins initiative ${winner.initiative} to ${loser.initiative}, so ${fromName} comes before ${toName} in this melee exchange.`;
    }

    case 'multiple-routines':
      return fromCombatant.id === toCombatant.id
        ? `${fromCombatant.name} has multiple routine attacks this round, so ${fromName} comes before ${toName} under the DMG first/middle/last routine order.`
        : `Multiple routine attacks are in play here, so ${fromName} falls earlier in the DMG first/middle/last routine order than ${toName}.`;

    case 'weapon-speed':
      return `${left.name} and ${right.name} tied initiative at ${left.initiative}. ${faster.name}'s lower weapon speed factor breaks the tie, so ${fromName} comes before ${toName}.`;

    case 'weapon-speed-double':
      return fromCombatant.id === toCombatant.id
        ? `${left.name} and ${right.name} tied initiative at ${left.initiative}. ${faster.name}'s faster weapon earns an extra blow, so ${fromName} comes before ${toName}.`
        : `${left.name} and ${right.name} tied initiative at ${left.initiative}. ${faster.name}'s weapon is more than twice as fast, so ${fromName} comes before ${toName}.`;

    case 'weapon-speed-triple':
      return `${left.name} and ${right.name} tied initiative at ${left.initiative}. The large weapon speed difference creates an extra third blow, which sets the order between ${fromName} and ${toName}.`;

    case 'simultaneous':
      return `${left.name} and ${right.name} tied initiative, so their blows land simultaneously here.`;
  }
};

const getReachPriorityText = ({
  combatant,
  opponent,
  firstStrike,
  thisBlowIsFirst,
}: {
  combatant: InitiativeScenarioCombatant;
  opponent: InitiativeScenarioCombatant;
  firstStrike?: InitiativeChargeFirstStrike;
  thisBlowIsFirst: boolean;
}): string => {
  if (firstStrike === 'attacker') {
    if (
      combatant.weaponLength !== undefined &&
      opponent.weaponLength !== undefined &&
      combatant.weaponType !== 'missile' &&
      opponent.weaponType !== 'missile'
    ) {
      return thisBlowIsFirst
        ? `${combatant.name}'s ${combatant.weaponName} has longer reach (${combatant.weaponLength} vs ${opponent.weaponLength}), so ${combatant.name} attacks first at contact.`
        : `${opponent.name}'s ${opponent.weaponName} has longer reach (${opponent.weaponLength} vs ${combatant.weaponLength}), so ${combatant.name}'s blow comes after ${opponent.name}'s.`;
    }

    return thisBlowIsFirst
      ? `${combatant.name} attacks first at contact.`
      : `${combatant.name}'s blow comes after ${opponent.name}'s at contact.`;
  }

  if (firstStrike === 'target') {
    if (
      combatant.weaponLength !== undefined &&
      opponent.weaponLength !== undefined &&
      combatant.weaponType !== 'missile' &&
      opponent.weaponType !== 'missile'
    ) {
      return thisBlowIsFirst
        ? `${combatant.name}'s ${combatant.weaponName} has longer reach (${combatant.weaponLength} vs ${opponent.weaponLength}), so ${combatant.name} attacks first at contact.`
        : `${opponent.name}'s ${opponent.weaponName} has longer reach (${opponent.weaponLength} vs ${combatant.weaponLength}), so ${combatant.name}'s blow comes after ${opponent.name}'s.`;
    }

    return thisBlowIsFirst
      ? `${combatant.name} attacks first at contact.`
      : `${combatant.name}'s blow comes after ${opponent.name}'s at contact.`;
  }

  if (firstStrike === 'simultaneous') {
    if (
      combatant.weaponLength !== undefined &&
      opponent.weaponLength !== undefined &&
      combatant.weaponType !== 'missile' &&
      opponent.weaponType !== 'missile'
    ) {
      return `Their reach is equal at ${combatant.weaponLength}, so the blows land simultaneously at contact.`;
    }

    return `The blows land simultaneously at contact.`;
  }

  return `Reach does not currently settle who attacks first at contact.`;
};

const getMovementAttackWhyHereText = ({
  node,
  combatant,
  placement,
  opponent,
}: {
  node: InitiativeAttackNode;
  combatant: InitiativeScenarioCombatant;
  placement: Extract<
    NonNullable<InitiativeAttackNode['placement']>,
    {
      kind: 'movement-attack';
    }
  >;
  opponent?: InitiativeScenarioCombatant;
}): string => {
  const opponentName = opponent?.name || 'the opposing combatant';
  const segment = placement.contactSegment || node.segment;

  if (placement.action === 'set-vs-charge') {
    return `${
      combatant.name
    } sets against ${opponentName}'s charge. Because ${opponentName} reaches contact on segment ${segment}, ${
      combatant.name
    }'s set weapon strikes first and deals ${
      placement.damageMultiplier || 2
    }x normal damage if it hits.`;
  }

  if (placement.role === 'charge-target') {
    return `${
      combatant.name
    } is being charged by ${opponentName}. Contact comes on segment ${segment}. ${getReachPriorityText(
      {
        combatant,
        opponent: opponent || combatant,
        firstStrike: placement.firstStrike,
        thisBlowIsFirst: placement.firstStrike === 'target',
      }
    )}`;
  }

  if (placement.action === 'charge') {
    const distanceText =
      placement.distanceInches !== undefined
        ? ` reaches ${opponentName} from ${placement.distanceInches}" away`
        : ` reaches ${opponentName}`;

    return `${
      combatant.name
    }${distanceText} on segment ${segment} and can strike on the charge. ${getReachPriorityText(
      {
        combatant,
        opponent: opponent || combatant,
        firstStrike: placement.firstStrike,
        thisBlowIsFirst: placement.firstStrike === 'attacker',
      }
    )}`;
  }

  if (placement.action === 'close') {
    const distanceText =
      placement.distanceInches !== undefined
        ? ` from ${placement.distanceInches}" away`
        : '';

    return `${
      combatant.name
    } reaches striking range of ${opponentName}${distanceText} on segment ${segment}. Because ${opponentName} is charging into contact, ${
      combatant.name
    } can also attack in the same round. ${getReachPriorityText({
      combatant,
      opponent: opponent || combatant,
      firstStrike: placement.firstStrike,
      thisBlowIsFirst: placement.firstStrike === 'target',
    })}`;
  }

  if (placement.distanceInches !== undefined) {
    return `${combatant.name}'s attack is on segment ${segment} because movement contact is reached from ${placement.distanceInches}" away by then.`;
  }

  return `${combatant.name}'s attack is on segment ${segment} because movement contact is reached by then.`;
};

const getMovementEdgeExplanation = ({
  fromNode,
  toNode,
  fromCombatant,
  toCombatant,
  fromName,
  toName,
}: {
  fromNode?: InitiativeAttackNode;
  toNode?: InitiativeAttackNode;
  fromCombatant?: InitiativeScenarioCombatant;
  toCombatant?: InitiativeScenarioCombatant;
  fromName: string;
  toName: string;
}): string => {
  const fromPlacement =
    fromNode?.placement?.kind === 'movement-attack' ? fromNode.placement : null;
  const toPlacement =
    toNode?.placement?.kind === 'movement-attack' ? toNode.placement : null;

  if (
    fromPlacement?.action === 'set-vs-charge' &&
    fromCombatant &&
    toCombatant
  ) {
    return `${fromCombatant.name} is set against ${toCombatant.name}'s charge, so the set weapon strikes first when contact is made on segment ${fromPlacement.contactSegment}.`;
  }

  if (toPlacement?.action === 'set-vs-charge' && fromCombatant && toCombatant) {
    return `${toCombatant.name} is set against ${fromCombatant.name}'s charge, so ${fromName} waits until after the set weapon takes effect on segment ${toPlacement.contactSegment}.`;
  }

  if (
    fromPlacement?.action === 'charge' &&
    fromCombatant &&
    toCombatant &&
    fromPlacement.firstStrike === 'attacker'
  ) {
    return `${fromCombatant.name}'s charge reaches contact on segment ${fromPlacement.contactSegment}, and longer reach lets ${fromCombatant.name} strike before ${toCombatant.name}.`;
  }

  if (
    fromPlacement?.role === 'charge-target' &&
    fromCombatant &&
    toCombatant &&
    fromPlacement.firstStrike === 'target'
  ) {
    return `${fromCombatant.name} is charged on segment ${fromPlacement.contactSegment} but has the longer reach, so ${fromName} happens before ${toName}.`;
  }

  if (
    fromPlacement?.firstStrike === 'simultaneous' ||
    toPlacement?.firstStrike === 'simultaneous'
  ) {
    return `Contact is simultaneous here, so no movement edge should separate these blows.`;
  }

  if (fromNode?.kind === 'contact' && fromNode.segment !== undefined) {
    return `Contact is established on segment ${fromNode.segment}, and that has to happen before the later result shown here.`;
  }

  if (fromNode?.segment !== undefined) {
    return `Movement and contact timing make ${fromName} happen before ${toName} on segment ${fromNode.segment}.`;
  }

  return `Movement and contact timing create this local order.`;
};

const getNodeReference = (
  nodeId: string,
  referenceByNodeId: Record<string, InitiativeGraphNodeReference>
): InitiativeGraphNodeReference => ({
  combatantName: referenceByNodeId[nodeId]?.combatantName || nodeId,
  actionTitle: referenceByNodeId[nodeId]?.actionTitle || 'Unknown action',
  actionMeta: referenceByNodeId[nodeId]?.actionMeta,
});

const buildNodeLabelById = (
  referenceByNodeId: Record<string, InitiativeGraphNodeReference>
): Record<string, string> =>
  Object.fromEntries(
    Object.entries(referenceByNodeId).map(([nodeId, reference]) => [
      nodeId,
      `${reference.combatantName}: ${reference.actionTitle}${
        reference.actionMeta ? `, ${reference.actionMeta}` : ''
      }`,
    ])
  );

const buildCombatantById = (
  resolvedRound: InitiativeResolvedRound
): Map<string, InitiativeScenarioCombatant> =>
  new Map(
    resolvedRound.scenario.party
      .concat(resolvedRound.scenario.enemies)
      .map((combatant) => [combatant.id, combatant] as const)
  );

const buildDirectMeleeEngagementByCombatantIds = (
  resolvedRound: InitiativeResolvedRound
): Map<string, DirectMeleeEngagement> => {
  const engagementsByCombatantIds = new Map<string, DirectMeleeEngagement>();

  resolvedRound.scenario.directMeleeEngagements.forEach((engagement) => {
    engagementsByCombatantIds.set(
      getDirectMeleeEngagementKey(
        engagement.partyCombatantId,
        engagement.enemyCombatantId
      ),
      engagement
    );
    engagementsByCombatantIds.set(
      getDirectMeleeEngagementKey(
        engagement.enemyCombatantId,
        engagement.partyCombatantId
      ),
      engagement
    );
  });

  return engagementsByCombatantIds;
};

const getGraphEdgeExplanation = ({
  edge,
  combatantById,
  attackNodeById,
  attackNodeLabelById,
  directMeleeEngagementByCombatantIds,
}: {
  edge: InitiativeAttackEdge;
  combatantById: Map<string, InitiativeScenarioCombatant>;
  attackNodeById: Map<string, InitiativeAttackNode>;
  attackNodeLabelById: Record<string, string>;
  directMeleeEngagementByCombatantIds: Map<string, DirectMeleeEngagement>;
}): string => {
  const fromNode = attackNodeById.get(edge.fromNodeId);
  const toNode = attackNodeById.get(edge.toNodeId);
  const fromCombatant = fromNode
    ? combatantById.get(fromNode.combatantId)
    : undefined;
  const toCombatant = toNode
    ? combatantById.get(toNode.combatantId)
    : undefined;
  const fromName =
    (fromNode && attackNodeLabelById[fromNode.id]) || edge.fromNodeId;
  const toName = (toNode && attackNodeLabelById[toNode.id]) || edge.toNodeId;
  const fromDirectMeleeTargetId =
    (fromNode?.placement?.kind === 'direct-melee'
      ? fromNode.placement.opponentId
      : undefined) ||
    fromNode?.targetId ||
    (fromCombatant?.targetIds.length === 1
      ? fromCombatant.targetIds[0]
      : undefined);
  const toDirectMeleeTargetId =
    (toNode?.placement?.kind === 'direct-melee'
      ? toNode.placement.opponentId
      : undefined) ||
    toNode?.targetId ||
    (toCombatant?.targetIds.length === 1
      ? toCombatant.targetIds[0]
      : undefined);
  const directMeleeEngagement =
    fromCombatant && fromDirectMeleeTargetId
      ? directMeleeEngagementByCombatantIds.get(
          getDirectMeleeEngagementKey(fromCombatant.id, fromDirectMeleeTargetId)
        )
      : toCombatant && toDirectMeleeTargetId
      ? directMeleeEngagementByCombatantIds.get(
          getDirectMeleeEngagementKey(toCombatant.id, toDirectMeleeTargetId)
        )
      : fromCombatant && toCombatant
      ? directMeleeEngagementByCombatantIds.get(
          getDirectMeleeEngagementKey(fromCombatant.id, toCombatant.id)
        )
      : undefined;

  return edge.reasons
    .map((reason) => {
      if (reason === 'simple-initiative') {
        if (fromNode && toNode && fromNode.combatantId === toNode.combatantId) {
          return `This is the same combatant's ordinary routine order. ${fromName} happens before ${toName}.`;
        }

        if (fromCombatant && toCombatant) {
          const timingExplanation = getInitiativeTimingExplanation(
            fromCombatant,
            toCombatant
          );
          if (timingExplanation) {
            return `${timingExplanation} ${fromName} happens before ${toName}.`;
          }

          const fromInitiative = getEffectiveInitiativeValue(fromCombatant);
          const toInitiative = getEffectiveInitiativeValue(toCombatant);

          if (fromInitiative !== toInitiative) {
            return `${fromCombatant.name}'s effective initiative ${fromInitiative} beats ${toCombatant.name}'s ${toInitiative}, so ${fromName} happens first at this stage of the round.`;
          }
        }

        return `This follows the general round order for this stage.`;
      }

      if (reason === 'action-sequence') {
        if (fromCombatant && toCombatant) {
          const timingExplanation = getInitiativeTimingExplanation(
            fromCombatant,
            toCombatant
          );

          return timingExplanation
            ? `${timingExplanation} ${fromName} is ordered before ${toName}.`
            : `${fromCombatant.name}'s action order puts ${fromName} before ${toName}.`;
        }

        return `${fromName} is ordered before ${toName} by action timing.`;
      }

      if (reason === 'direct-melee') {
        return directMeleeEngagement
          ? getDirectMeleeEdgeExplanation({
              engagement: directMeleeEngagement,
              fromNode,
              toNode,
              fromCombatant,
              toCombatant,
              fromName,
              toName,
            })
          : `${fromCombatant?.name || fromName} and ${
              toCombatant?.name || toName
            } are in direct melee, so initiative decides which blow happens first.`;
      }

      if (reason === 'movement') {
        return getMovementEdgeExplanation({
          fromNode,
          toNode,
          fromCombatant,
          toCombatant,
          fromName,
          toName,
        });
      }

      if (reason === 'spell-casting') {
        if (
          fromNode?.kind === 'spell-start' &&
          toNode?.kind === 'spell-completion'
        ) {
          return toNode.segment !== undefined
            ? `This is the spell's casting span. It starts here and completes at the end of segment ${toNode.segment}.`
            : `This links the spell's start and completion.`;
        }

        return `This is part of the same spell's casting sequence.`;
      }

      if (
        fromNode?.kind === 'spell-completion' &&
        toNode?.kind === 'spell-completion'
      ) {
        if (
          fromNode.segment !== undefined &&
          toNode.segment !== undefined &&
          fromNode.segment === toNode.segment
        ) {
          return `Both spells complete on segment ${
            fromNode.segment
          }, so initiative breaks the tie in favor of ${
            fromCombatant?.name || fromName
          }.`;
        }

        return `${
          fromCombatant?.name || fromName
        } completes early enough to interrupt ${toCombatant?.name || toName}.`;
      }

      if (toNode?.kind === 'spell-completion') {
        if (
          fromNode?.segmentReason === 'spell-directed' &&
          fromNode.segment !== undefined
        ) {
          return `${
            fromCombatant?.name || fromName
          }'s attack is placed on segment ${
            fromNode.segment
          } against a spell caster under DMG p. 65 rule 2. A successful hit there spoils the spell.`;
        }

        return `${
          fromCombatant?.name || fromName
        } can attack before the spell completes, so a successful hit spoils it.`;
      }

      if (fromNode?.kind === 'spell-completion') {
        return `${fromCombatant?.name || fromName} completes before ${
          toCombatant?.name || toName
        }, so that later action no longer has a chance to spoil the spell.`;
      }

      return `This comes from the spell interruption timing rules.`;
    })
    .join(' ');
};

const buildGraphInspectorWhyHere = ({
  node,
  resolvedRound,
  combatantById,
  attackNodeById,
  attackNodeLabelById,
  directMeleeEngagementByCombatantIds,
}: {
  node: InitiativeAttackNode;
  resolvedRound: InitiativeResolvedRound;
  combatantById: Map<string, InitiativeScenarioCombatant>;
  attackNodeById: Map<string, InitiativeAttackNode>;
  attackNodeLabelById: Record<string, string>;
  directMeleeEngagementByCombatantIds: Map<string, DirectMeleeEngagement>;
}): string[] => {
  const combatant = combatantById.get(node.combatantId);
  if (!combatant) {
    return [];
  }

  const lines: string[] = [];
  const placement = node.placement;
  const incomingEdges = resolvedRound.attackGraph.edges.filter(
    (edge) => edge.toNodeId === node.id
  );
  const outgoingEdges = resolvedRound.attackGraph.edges.filter(
    (edge) => edge.fromNodeId === node.id
  );
  const relatedEdges = incomingEdges.concat(outgoingEdges);
  const directMeleeEdges = relatedEdges.filter((edge) =>
    edge.reasons.includes('direct-melee')
  );
  const hasDirectMeleeEdge = directMeleeEdges.length > 0;
  const directMeleeEdge =
    directMeleeEdges.find((edge) => {
      const otherNodeId =
        edge.fromNodeId === node.id ? edge.toNodeId : edge.fromNodeId;
      const otherNode = attackNodeById.get(otherNodeId);

      return otherNode?.combatantId !== combatant.id;
    }) || directMeleeEdges[0];
  const targetName = node.targetId
    ? resolvedRound.viewModel.combatantNameById[node.targetId] || node.targetId
    : undefined;
  const targetCombatant = node.targetId
    ? combatantById.get(node.targetId)
    : undefined;
  const placementOpponentId =
    placement?.kind === 'movement-attack'
      ? placement.opponentId
      : placement?.kind === 'direct-melee'
      ? placement.opponentId
      : undefined;
  const placementOpponent = placementOpponentId
    ? combatantById.get(placementOpponentId)
    : undefined;
  const directMeleeOpponentId =
    directMeleeEdge?.fromNodeId === node.id
      ? attackNodeById.get(directMeleeEdge.toNodeId)?.combatantId
      : directMeleeEdge?.toNodeId === node.id
      ? attackNodeById.get(directMeleeEdge.fromNodeId)?.combatantId
      : undefined;
  const directMeleeTargetId =
    (placement?.kind === 'direct-melee' ? placement.opponentId : undefined) ||
    targetCombatant?.id ||
    (combatant.targetIds.length === 1 ? combatant.targetIds[0] : undefined) ||
    (directMeleeOpponentId !== undefined &&
    directMeleeOpponentId !== combatant.id
      ? directMeleeOpponentId
      : undefined);
  const directMeleeEngagement =
    directMeleeTargetId !== undefined
      ? directMeleeEngagementByCombatantIds.get(
          getDirectMeleeEngagementKey(combatant.id, directMeleeTargetId)
        )
      : undefined;
  const directMeleeOpponent =
    (directMeleeTargetId !== undefined
      ? combatantById.get(directMeleeTargetId)
      : undefined) || targetCombatant;
  const simultaneousGroup = resolvedRound.attackGraph.simultaneousGroups.find(
    (group) => group.includes(node.id)
  );
  const simultaneousPeerLabels = simultaneousGroup
    ? simultaneousGroup
        .filter((nodeId) => nodeId !== node.id)
        .map((nodeId) => attackNodeLabelById[nodeId] || nodeId)
    : [];
  const combatantInitiative = getEffectiveInitiativeValue(combatant);
  const targetInitiative = targetCombatant
    ? getEffectiveInitiativeValue(targetCombatant)
    : undefined;

  if (node.kind === 'spell-start') {
    if (node.segment !== undefined) {
      lines.push(
        `Spells begin on segment ${node.segment}. Casting span is shown explicitly.`
      );
    } else {
      lines.push(
        `This is an instant spell, so there is no separate casting span to show.`
      );
    }
  } else if (node.kind === 'spell-completion') {
    if (node.segment !== undefined) {
      lines.push(
        `This spell completes at the end of segment ${
          node.segment
        } because its casting time is ${
          node.segment >= 10
            ? '10+ segments'
            : `${node.segment} ${node.segment === 1 ? 'segment' : 'segments'}`
        }.`
      );
    } else {
      lines.push(
        `This spell is instantaneous, so it has no separate completion segment.`
      );
    }
  } else if (placement?.kind === 'movement-completion') {
    lines.push(
      `${combatant.name} finishes moving ${placement.distanceInches}" on segment ${node.segment}. This marks a targetless Move/Close declaration at MV ${placement.movementRate}".`
    );
  } else if (node.kind === 'contact') {
    lines.push(
      `Contact is reached on segment ${node.segment}. This marks the moment movement closes to melee without assuming an automatic same-round blow.`
    );
  } else if (placement?.kind === 'spell-directed') {
    const caster =
      combatantById.get(placement.casterId) ||
      (targetCombatant?.declaredAction === 'spell-casting'
        ? targetCombatant
        : undefined);
    const casterName = caster?.name || targetName || 'the spell caster';
    const casterInitiative = caster
      ? getEffectiveInitiativeValue(caster)
      : targetInitiative;

    if (
      casterName &&
      casterInitiative !== undefined &&
      casterInitiative > combatantInitiative
    ) {
      lines.push(
        `${combatant.name}'s attack is directed at ${casterName}. Since ${
          caster?.side === 'party' ? 'Party' : 'Enemy'
        } won initiative ${casterInitiative} to ${combatantInitiative}, attacks against ${casterName} land on segment ${
          node.segment
        } (DMG p. 65 rule 2).`
      );
    } else if (
      casterName &&
      casterInitiative !== undefined &&
      casterInitiative === combatantInitiative
    ) {
      lines.push(
        `${combatant.name}'s attack is directed at ${casterName}. With initiative tied at ${casterInitiative}, attacks against ${casterName} land on segment ${node.segment} (DMG p. 65 rule 2).`
      );
    } else {
      lines.push(
        `${combatant.name}'s attack is directed at ${casterName}. DMG p. 65 rule 2 places that attack on segment ${node.segment}.`
      );
    }
  } else if (placement?.kind === 'weapon-vs-spell') {
    const caster = combatantById.get(placement.casterId) || targetCombatant;
    const casterName = caster?.name || targetName || 'the spell caster';
    const effectiveInitiative = getEffectiveInitiativeValue(combatant);
    const casterInitiative = caster
      ? getEffectiveInitiativeValue(caster)
      : undefined;
    const initiativeText =
      casterInitiative !== undefined && casterInitiative === effectiveInitiative
        ? `initiative is tied at ${effectiveInitiative}`
        : casterInitiative !== undefined
        ? `${
            caster?.side === 'party' ? 'Party' : 'Enemy'
          } won initiative ${casterInitiative} to ${effectiveInitiative}`
        : 'initiative and weapon speed are compared here';
    const weaponLabel = combatant.weaponName || `${combatant.name}'s weapon`;

    if (placement.relation === 'before') {
      lines.push(
        `${combatant.name} is striking a caster in melee. Since ${initiativeText}, ${weaponLabel}'s weapon speed factor ${placement.weaponSpeedFactor} beats this ${placement.castingSegments}-segment spell under DMG p. 66-67, so ${combatant.name} can attack before ${casterName}'s spell completes.`
      );
    } else if (placement.relation === 'simultaneous') {
      lines.push(
        `${combatant.name} is striking a caster in melee. Since ${initiativeText}, ${weaponLabel}'s weapon speed factor ${placement.weaponSpeedFactor} matches this ${placement.castingSegments}-segment spell under DMG p. 66-67, so the blow and the spell completion are simultaneous.`
      );
    } else {
      lines.push(
        `${combatant.name} is striking a caster in melee. Since ${initiativeText}, ${weaponLabel}'s weapon speed factor ${placement.weaponSpeedFactor} is too slow to beat this ${placement.castingSegments}-segment spell under DMG p. 66-67, so ${casterName}'s spell completes before ${combatant.name} can strike.`
      );
    }
  } else if (placement?.kind === 'declared-action-segment') {
    lines.push(
      `${combatant.name}'s device use is on segment ${
        node.segment
      } because its declared activation time is ${
        placement.activationSegments
      } ${placement.activationSegments === 1 ? 'segment' : 'segments'}.`
    );
  } else if (placement?.kind === 'movement-attack') {
    lines.push(
      getMovementAttackWhyHereText({
        node,
        combatant,
        placement,
        opponent: placementOpponent,
      })
    );
  } else if (placement?.kind === 'missile-volley') {
    lines.push(
      placement.splitTarget && placement.targetId !== undefined
        ? `${
            combatant.name
          }'s missile volley is split across multiple targets. This node is the shot aimed at ${
            resolvedRound.viewModel.combatantNameById[placement.targetId] ||
            placement.targetId
          }.`
        : `${combatant.name}'s missile volley stays unsegmented. Ordinary firing rate is treated as one initiative-controlled volley rather than as separate early and late shots.`
    );
  } else if (placement?.kind === 'turn-undead-unsegmented') {
    lines.push(
      `${combatant.name}'s turning attempt is initiative-controlled, but it has no separate segment timing.`
    );
  } else if (placement?.kind === 'magical-device-unsegmented') {
    lines.push(
      `${combatant.name}'s device use stays unsegmented because no activation time was declared for it.`
    );
  } else if (placement?.kind === 'non-combat-unsegmented') {
    lines.push(
      `${combatant.name}'s non-combat action is initiative-controlled, but it has no separate segment timing.`
    );
  } else if (placement?.kind === 'direct-melee') {
    if (directMeleeEngagement && directMeleeOpponent) {
      lines.push(
        getDirectMeleeWhyHereText({
          node,
          combatant,
          opponent: directMeleeOpponent,
          engagement: directMeleeEngagement,
        })
      );
    } else if (simultaneousPeerLabels.length > 0) {
      lines.push(
        `This action is simultaneous with ${simultaneousPeerLabels.join(
          ' and '
        )}. No narrower rule in this slice gives either action precedence.`
      );
    } else {
      lines.push(
        `This action is part of a simultaneous exchange, so no narrower rule in this slice gives it precedence over the other action in that cluster.`
      );
    }
  } else if (placement?.kind === 'routine-sequence') {
    lines.push(
      `This is ${combatant.name}'s attack ${placement.attackNumber} in that combatant's ordinary round routine.`
    );
  } else if (simultaneousGroup) {
    if (simultaneousPeerLabels.length > 0) {
      lines.push(
        `This action is simultaneous with ${simultaneousPeerLabels.join(
          ' and '
        )}. No narrower rule in this slice gives either action precedence.`
      );
    } else {
      lines.push(
        `This action is part of a simultaneous exchange, so no narrower rule in this slice gives it precedence over the other action in that cluster.`
      );
    }
  } else if (
    hasDirectMeleeEdge &&
    directMeleeEngagement &&
    directMeleeOpponent
  ) {
    lines.push(
      getDirectMeleeWhyHereText({
        node,
        combatant,
        opponent: directMeleeOpponent,
        engagement: directMeleeEngagement,
      })
    );
  } else {
    lines.push(
      `This action has no separate segment call of its own. It follows the ordinary round order shown by the arrows around it.`
    );
  }

  return lines;
};

export const getInitiativeGraphNodeStatusLabel = (
  status: InitiativeGraphNodeStatus
): string => (status === 'resolved' ? 'Resolved' : 'Lost');

export const buildInitiativeGraphEnabledNodeIds = (
  attackGraph: InitiativeAttackGraph,
  nodeStatusById: Record<string, InitiativeGraphNodeStatus>
): Set<string> => {
  const incomingBlockerIdsByNodeId = new Map<string, Set<string>>();

  attackGraph.edges.forEach((edge) => {
    const blockerIds = incomingBlockerIdsByNodeId.get(edge.toNodeId);

    if (blockerIds) {
      blockerIds.add(edge.fromNodeId);
    } else {
      incomingBlockerIdsByNodeId.set(edge.toNodeId, new Set([edge.fromNodeId]));
    }
  });

  const baseEnabledNodes = attackGraph.nodes.filter((node) => {
    if (nodeStatusById[node.id] !== undefined) {
      return false;
    }

    const blockerIds = incomingBlockerIdsByNodeId.get(node.id);
    const hasPendingBlockers = blockerIds
      ? Array.from(blockerIds).some(
          (blockerId) => nodeStatusById[blockerId] === undefined
        )
      : false;

    return !hasPendingBlockers;
  });
  const earliestUnresolvedSegment = attackGraph.nodes.reduce<
    number | undefined
  >((earliestSegment, node) => {
    if (node.segment === undefined || nodeStatusById[node.id] !== undefined) {
      return earliestSegment;
    }

    if (earliestSegment === undefined || node.segment < earliestSegment) {
      return node.segment;
    }

    return earliestSegment;
  }, undefined);

  return new Set(
    baseEnabledNodes.flatMap((node) => {
      if (
        node.segment !== undefined &&
        earliestUnresolvedSegment !== undefined &&
        node.segment > earliestUnresolvedSegment
      ) {
        return [];
      }

      return [node.id];
    })
  );
};

const buildInitiativeGraphNodeReferenceById = (
  resolvedRound: InitiativeResolvedRound
): Record<string, InitiativeGraphNodeReference> =>
  Object.fromEntries(
    Object.entries(
      buildInitiativeAttackGraphNodeDisplayById(resolvedRound)
    ).map(([nodeId, display]) => [
      nodeId,
      {
        combatantName: display.combatantName,
        actionTitle: display.actionTitle,
        actionMeta: display.actionMeta,
      },
    ])
  );

export const buildInitiativeGraphInspectorModel = (
  resolvedRound: InitiativeResolvedRound,
  nodeId: string,
  nodeStatusById: Record<string, InitiativeGraphNodeStatus>
): InitiativeGraphInspectorModel | undefined => {
  const node = resolvedRound.attackGraph.nodes.find(
    (candidate) => candidate.id === nodeId
  );

  if (!node) {
    return undefined;
  }

  const combatantById = buildCombatantById(resolvedRound);
  const attackNodeById = new Map(
    resolvedRound.attackGraph.nodes.map(
      (attackNode) => [attackNode.id, attackNode] as const
    )
  );
  const directMeleeEngagementByCombatantIds =
    buildDirectMeleeEngagementByCombatantIds(resolvedRound);
  const referenceByNodeId =
    buildInitiativeGraphNodeReferenceById(resolvedRound);
  const attackNodeLabelById = buildNodeLabelById(referenceByNodeId);
  const incomingEdges = resolvedRound.attackGraph.edges.filter(
    (edge) => edge.toNodeId === node.id
  );
  const outgoingEdges = resolvedRound.attackGraph.edges.filter(
    (edge) => edge.fromNodeId === node.id
  );
  const outgoingSeen = new Set<string>();
  const outgoing = outgoingEdges.flatMap((edge) => {
    if (outgoingSeen.has(edge.toNodeId)) {
      return [];
    }

    outgoingSeen.add(edge.toNodeId);
    return [
      {
        nodeId: edge.toNodeId,
        reference: getNodeReference(edge.toNodeId, referenceByNodeId),
      },
    ];
  });
  const nodeStatus = nodeStatusById[node.id];

  return {
    nodeId: node.id,
    node,
    nodeStatus,
    reference: getNodeReference(node.id, referenceByNodeId),
    sideLabel: node.side === 'party' ? 'Party' : 'Enemy',
    timingLabel:
      node.segment !== undefined ? `Segment: ${node.segment}` : undefined,
    statusLabel: nodeStatus
      ? getInitiativeGraphNodeStatusLabel(nodeStatus)
      : 'Pending',
    lostActionLabel:
      node.kind === 'spell-start' || node.kind === 'spell-completion'
        ? 'Mark spoiled'
        : 'Mark lost',
    whyHere: buildGraphInspectorWhyHere({
      node,
      resolvedRound,
      combatantById,
      attackNodeById,
      attackNodeLabelById,
      directMeleeEngagementByCombatantIds,
    }),
    incoming: incomingEdges.map((edge) => ({
      nodeId: edge.fromNodeId,
      reference: getNodeReference(edge.fromNodeId, referenceByNodeId),
      explanation: getGraphEdgeExplanation({
        edge,
        combatantById,
        attackNodeById,
        attackNodeLabelById,
        directMeleeEngagementByCombatantIds,
      }),
    })),
    outgoing,
  };
};
