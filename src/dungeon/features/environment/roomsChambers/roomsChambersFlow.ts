import type {
  DungeonOutcomeNode,
  OutcomeEventNode,
} from '../../../domain/outcome';
import { createPendingRoll } from '../../../domain/pendingRoll';
import type { DungeonTableDefinition } from '../../types';

type PostProcessChildren = NonNullable<
  DungeonTableDefinition['postProcessChildren']
>;

export const postProcessRoomOrChamberChildren: PostProcessChildren = (
  node,
  children,
  resolveNode
) => {
  if (
    node.event.kind !== 'roomDimensions' &&
    node.event.kind !== 'chamberDimensions'
  ) {
    return children;
  }

  let nextChildren = [...children];
  const unusualSizeIndex = nextChildren.findIndex(
    (child) => child.event.kind === 'unusualSize'
  );
  const unusualSizeNode =
    unusualSizeIndex >= 0 ? nextChildren[unusualSizeIndex] : undefined;
  const area = unusualSizeNode
    ? totalAreaFromUnusualSize(unusualSizeNode)
    : undefined;

  let promotedExit: OutcomeEventNode | undefined;
  if (unusualSizeNode && Array.isArray(unusualSizeNode.children)) {
    const remainingNested: DungeonOutcomeNode[] = [];
    for (const nestedChild of unusualSizeNode.children) {
      if (
        !promotedExit &&
        nestedChild.type === 'event' &&
        nestedChild.event.kind === 'numberOfExits'
      ) {
        promotedExit = nestedChild;
        continue;
      }
      remainingNested.push(nestedChild);
    }
    if (promotedExit) {
      nextChildren[unusualSizeIndex] = {
        ...unusualSizeNode,
        children: remainingNested.length > 0 ? remainingNested : undefined,
      };
    }
  }

  if (promotedExit) {
    nextChildren = [...nextChildren, promotedExit];
  }

  const hasNumberOfExits = nextChildren.some(
    (child) => child.event.kind === 'numberOfExits'
  );
  if (!hasNumberOfExits && area !== undefined && area > 0) {
    const resolved = resolveNode(
      createPendingRoll({
        kind: 'numberOfExits',
        args: {
          kind: 'exits',
          length: area,
          width: 1,
          isRoom: node.event.kind === 'roomDimensions',
        },
      })
    );
    if (resolved) {
      nextChildren = [...nextChildren, resolved];
    }
  }

  return nextChildren;
};

function totalAreaFromUnusualSize(node: OutcomeEventNode): number | undefined {
  if (node.event.kind !== 'unusualSize') return undefined;
  const area = (node.event as { area?: number }).area;
  if (area !== undefined) return area;
  if (!node.children) return undefined;
  for (const child of node.children) {
    if (child.type !== 'event') continue;
    const childArea = totalAreaFromUnusualSize(child);
    if (childArea !== undefined) return childArea;
  }
  return undefined;
}
