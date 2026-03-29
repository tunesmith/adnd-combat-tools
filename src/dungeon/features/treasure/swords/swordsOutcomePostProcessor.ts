import type {
  DungeonOutcomeNode,
  OutcomeEventNode,
} from '../../../domain/outcome';
import {
  getPendingRollArgs,
  getPendingRollKind,
  withPendingRollArgs,
} from '../../../domain/pendingRoll';
import {
  describeSwordSpecialPurpose,
  type TreasureSwordExtraordinaryPowerResult,
  type TreasureSwordSpecialPurposeResult,
} from './swordsTables';
import type { TreasureSwordAlignment } from './swordsAlignmentTable';

export function postProcessSwordsOutcomeTree(
  node: DungeonOutcomeNode
): DungeonOutcomeNode {
  return propagateAlignment(node, undefined);
}

function propagateAlignment(
  node: DungeonOutcomeNode,
  currentAlignment: TreasureSwordAlignment | undefined
): DungeonOutcomeNode {
  if (node.type === 'event') {
    let nextAlignment = currentAlignment;
    if (node.event.kind === 'treasureSwordAlignment') {
      nextAlignment = node.event.result.alignment;
    } else if (node.event.kind === 'treasureSwordUnusual') {
      const alignmentChild = (node.children || []).find(
        (child): child is OutcomeEventNode =>
          child.type === 'event' &&
          child.event.kind === 'treasureSwordAlignment'
      );
      if (
        alignmentChild &&
        alignmentChild.event.kind === 'treasureSwordAlignment'
      ) {
        const alignmentResult = alignmentChild.event.result;
        nextAlignment = alignmentResult.alignment;
      }
    }
    const originalChildren = node.children ?? [];
    const updatedChildren = originalChildren.map((child) =>
      propagateAlignment(child, nextAlignment)
    );
    const childrenChanged = originalChildren.some(
      (child, index) => child !== updatedChildren[index]
    );

    let updatedNode = node;
    if (
      node.event.kind === 'treasureSwordExtraordinaryPower' &&
      nextAlignment !== undefined
    ) {
      updatedNode = applyAlignmentToExtraordinaryEvent(node, updatedChildren);
    } else if (
      node.event.kind === 'treasureSwordSpecialPurpose' &&
      nextAlignment !== undefined
    ) {
      updatedNode = applyAlignmentToSpecialPurposeEvent(node, nextAlignment);
      if (childrenChanged && updatedNode.children) {
        updatedNode = {
          ...updatedNode,
          children: updatedChildren,
        };
      }
    } else if (childrenChanged) {
      updatedNode = {
        ...node,
        children: updatedChildren,
      };
    }
    return updatedNode;
  }

  if (
    node.type === 'pending-roll' &&
    getPendingRollKind(node) === 'treasureSwordSpecialPurpose' &&
    currentAlignment !== undefined
  ) {
    const pendingArgs = getPendingRollArgs(node);
    const existing =
      pendingArgs && typeof pendingArgs === 'object'
        ? (pendingArgs as SpecialPurposeContext)
        : undefined;
    const alreadyAligned =
      existing?.alignment === currentAlignment &&
      existing?.alignmentReady === true;
    if (alreadyAligned) return node;
    const nextContext: SpecialPurposeContext = {
      kind: 'treasureSwordSpecialPurpose',
      ...existing,
      alignment: currentAlignment,
      alignmentReady: true,
    };
    return withPendingRollArgs(node, nextContext);
  }
  if (
    node.type === 'pending-roll' &&
    getPendingRollKind(node) === 'treasureSwordSpecialPurposePower' &&
    currentAlignment !== undefined
  ) {
    const pendingArgs = getPendingRollArgs(node);
    const existing =
      pendingArgs && typeof pendingArgs === 'object'
        ? (pendingArgs as {
            slotKey?: string;
            rollIndex?: number;
            parentSlotKey?: string;
            alignment?: TreasureSwordAlignment;
          })
        : undefined;
    const alreadyAligned = existing?.alignment === currentAlignment;
    if (alreadyAligned) return node;
    const nextContext = {
      kind: 'treasureSwordSpecialPurposePower' as const,
      ...existing,
      alignment: currentAlignment,
    };
    return withPendingRollArgs(node, nextContext);
  }
  if (
    node.type === 'pending-roll' &&
    getPendingRollKind(node) === 'treasureSwordDragonSlayerColor'
  ) {
    const pendingArgs = getPendingRollArgs(node);
    const existing =
      pendingArgs && typeof pendingArgs === 'object'
        ? (pendingArgs as {
            slotKey?: string;
            rollIndex?: number;
            alignment?: TreasureSwordAlignment;
            alignmentReady?: boolean;
          })
        : undefined;
    if (currentAlignment === undefined) return node;
    const alreadyAligned =
      existing?.alignment === currentAlignment &&
      existing?.alignmentReady === true;
    if (alreadyAligned) return node;
    const nextContext = {
      kind: 'treasureSwordDragonSlayerColor' as const,
      ...existing,
      alignment: currentAlignment,
      alignmentReady: true,
    };
    return withPendingRollArgs(node, nextContext);
  }
  return node;
}

function applyAlignmentToExtraordinaryEvent(
  node: OutcomeEventNode,
  children: DungeonOutcomeNode[]
): OutcomeEventNode {
  if (node.event.kind !== 'treasureSwordExtraordinaryPower') return node;
  const result = node.event.result;
  let updated = node;
  if (result.kind === 'power' && result.alignmentRequired) {
    const nextResult: Extract<
      TreasureSwordExtraordinaryPowerResult,
      { kind: 'power' }
    > = {
      ...result,
      alignmentRequired: undefined,
    };
    updated = {
      ...node,
      event: {
        ...node.event,
        result: nextResult,
      },
    };
  }
  if (children.length > 0) {
    updated = {
      ...updated,
      children,
    };
  }
  return updated;
}

function applyAlignmentToSpecialPurposeEvent(
  node: OutcomeEventNode,
  alignment: TreasureSwordAlignment
): OutcomeEventNode {
  if (node.event.kind !== 'treasureSwordSpecialPurpose') return node;
  const result = node.event.result;
  if (result.alignment === alignment) return node;
  const updatedResult: TreasureSwordSpecialPurposeResult = {
    ...result,
    alignment,
    description: describeSwordSpecialPurpose(result.purpose, { alignment }),
  };
  return {
    ...node,
    event: {
      ...node.event,
      result: updatedResult,
    },
    children: node.children,
  };
}

type SpecialPurposeContext = {
  kind: 'treasureSwordSpecialPurpose';
  slotKey?: string;
  rollIndex?: number;
  parentSlotKey?: string;
  alignment?: TreasureSwordAlignment;
  alignmentReady?: boolean;
};
