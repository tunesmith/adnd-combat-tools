import { renderDetailTree } from '../../../../../dungeon/adapters/render';
import {
  resolveNumberOfExits,
  resolveDoorExitLocation,
  resolvePassageExitLocation,
  resolveExitDirection,
  resolveExitAlternative,
} from '../../../../../dungeon/domain/resolvers';
import type {
  DungeonOutcomeNode,
  OutcomeEventNode,
  PendingRoll,
} from '../../../../../dungeon/domain/outcome';
import { isTableContext } from '../../../../../dungeon/helpers/outcomeTree';

function asEvent(node: DungeonOutcomeNode): OutcomeEventNode {
  if (node.type !== 'event') throw new Error('Expected event node');
  return node;
}

describe('exit location detail rendering', () => {
  test('door exit location includes placement text', () => {
    const exitsNode = resolveNumberOfExits({
      roll: 1,
      length: 10,
      width: 10,
      isRoom: true,
    });
    const exits = asEvent(exitsNode);
    const pending = exits.children?.[0] as PendingRoll | undefined;
    const doorNode = resolveDoorExitLocation({
      roll: 18,
      context:
        pending &&
        isTableContext(pending.context) &&
        pending.context.kind === 'exit'
          ? {
              index: pending.context.index,
              total: pending.context.total,
              origin: pending.context.origin,
            }
          : undefined,
    });
    const door = asEvent(doorNode);
    const enriched: OutcomeEventNode = {
      ...exits,
      children: [door],
    };
    const nodes = renderDetailTree(enriched);
    const textNodes = nodes.filter(
      (
        node
      ): node is Extract<typeof node, { kind: 'paragraph'; text: string }> =>
        node.kind === 'paragraph'
    );
    expect(textNodes.some((p) => p.text.includes('Door 1'))).toBe(true);
    expect(
      textNodes.some((p) =>
        p.text.includes(
          '(If the door is indicated in a wall where the space immediately beyond the wall has already been mapped'
        )
      )
    ).toBe(false);
    const previewNodes = nodes.filter(
      (node): node is Extract<typeof node, { kind: 'table-preview' }> =>
        node.kind === 'table-preview'
    );
    expect(
      previewNodes.some((preview) => preview.id === 'exitAlternative')
    ).toBe(true);
    const altEventNode = resolveExitAlternative({
      roll: 4,
      context: { exitType: 'door' },
    });
    if (altEventNode.type !== 'event') {
      throw new Error('Expected exit alternative event');
    }
    const resolvedDoor: OutcomeEventNode = {
      ...door,
      children: [altEventNode],
    };
    const withResolvedAlternative: OutcomeEventNode = {
      ...exits,
      children: [resolvedDoor],
    };
    const resolvedNodes = renderDetailTree(withResolvedAlternative);
    const resolvedParagraphs = resolvedNodes.filter(
      (
        node
      ): node is Extract<typeof node, { kind: 'paragraph'; text: string }> =>
        node.kind === 'paragraph'
    );
    expect(
      resolvedParagraphs.some(
        (p) =>
          p.text.includes('Door 1') &&
          p.text.includes('is on the') &&
          p.text.includes('If the door is indicated')
      )
    ).toBe(false);
    const alternativeParagraph = resolvedParagraphs.find((p) =>
      p.text.includes(
        'If the door is indicated in a wall where the space immediately beyond the wall has already been mapped'
      )
    );
    expect(alternativeParagraph).toBeDefined();
  });

  test('passage exit location schedules direction preview', () => {
    const exitsNode = resolveNumberOfExits({
      roll: 5,
      length: 30,
      width: 50,
      isRoom: false,
    });
    const exits = asEvent(exitsNode);
    const pending = exits.children?.[0] as PendingRoll | undefined;
    const passageNode = resolvePassageExitLocation({
      roll: 9,
      context:
        pending &&
        isTableContext(pending.context) &&
        pending.context.kind === 'exit'
          ? {
              index: pending.context.index,
              total: pending.context.total,
              origin: pending.context.origin,
            }
          : undefined,
    });
    const passage = asEvent(passageNode);
    const directionPending = passage.children?.find(
      (child): child is PendingRoll => child.type === 'pending-roll'
    );
    const direction = resolveExitDirection({
      roll: 20,
      context:
        directionPending &&
        isTableContext(directionPending.context) &&
        directionPending.context.kind === 'exitDirection'
          ? {
              index: directionPending.context.index,
              total: directionPending.context.total,
              origin: directionPending.context.origin,
            }
          : undefined,
    });
    const alternativePending = passage.children?.find(
      (child): child is PendingRoll =>
        child.type === 'pending-roll' && child.table === 'exitAlternative'
    );
    const passageChildren: DungeonOutcomeNode[] = [direction];
    if (alternativePending) passageChildren.push(alternativePending);
    const passageWithDirection: OutcomeEventNode = {
      ...passage,
      children: passageChildren,
    };
    const enrichedExits: OutcomeEventNode = {
      ...exits,
      children: [passageWithDirection],
    };
    const nodes = renderDetailTree(enrichedExits);
    const paragraphs = nodes.filter(
      (
        node
      ): node is Extract<typeof node, { kind: 'paragraph'; text: string }> =>
        node.kind === 'paragraph'
    );
    expect(
      paragraphs.some(
        (p) => p.text.includes('Passage 1') && p.text.includes('is on the')
      )
    ).toBe(true);
    expect(
      paragraphs.some((p) =>
        p.text.includes('The passage angles 45° to the right.')
      )
    ).toBe(true);
    expect(
      paragraphs.some((p) =>
        p.text.includes(
          'Resolve the exit direction below to learn how the passage proceeds.'
        )
      )
    ).toBe(false);
    const previewNodes = nodes.filter(
      (node): node is Extract<typeof node, { kind: 'table-preview' }> =>
        node.kind === 'table-preview'
    );
    expect(
      previewNodes.some((preview) => preview.id === 'exitAlternative')
    ).toBe(true);
  });
});
