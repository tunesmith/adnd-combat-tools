import { renderDetailTree } from '../../../../../dungeon/adapters/render';
import { resolveNumberOfExits } from '../../../../../dungeon/features/navigation/exit/numberOfExitsResolver';
import {
  resolveDoorExitLocation,
  resolvePassageExitLocation,
  resolveExitDirection,
  resolveExitAlternative,
} from '../../../../../dungeon/features/navigation/exit/exitLocationResolvers';
import type {
  DungeonOutcomeNode,
  OutcomeEventNode,
  PendingRoll,
} from '../../../../../dungeon/domain/outcome';
import { readTableContext } from '../../../../../dungeon/helpers/tableContext';
import {
  collectPreviews,
  findPreviewById,
  hasPreviewId,
} from '../../../../support/dungeon/previewUtils';

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
    const pendingContext = readTableContext(pending?.context);
    const doorNode = resolveDoorExitLocation({
      roll: 18,
      context:
        pendingContext && pendingContext.kind === 'exit'
          ? {
              index: pendingContext.index,
              total: pendingContext.total,
              origin: pendingContext.origin,
            }
          : undefined,
    });
    const door = asEvent(doorNode);
    if (door.event.kind !== 'doorExitLocation') {
      throw new Error('Expected door exit location event');
    }
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
    expect(
      textNodes.some((p) => p.text.includes('Door 1') && p.text.includes(':'))
    ).toBe(true);
    expect(textNodes.some((p) => p.text.includes('(or'))).toBe(false);
    const previewNodes = collectPreviews(nodes);
    const doorPreview = findPreviewById(nodes, 'doorExitLocation');
    expect(doorPreview?.context).toEqual({
      kind: 'exit',
      exitType: 'door',
      index: door.event.index,
      total: door.event.total,
      origin: door.event.origin,
    });
    expect(previewNodes).toContainEqual(
      expect.objectContaining({ id: 'exitAlternative' })
    );
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
        (p) => p.text.includes('Door 1') && p.text.includes('(or')
      )
    ).toBe(true);
    expect(
      resolvedParagraphs.some((p) =>
        p.text.includes(
          'If an exit abuts mapped space, use the option shown in parentheses.'
        )
      )
    ).toBe(true);
    const alternativeParagraph = resolvedParagraphs.find((p) =>
      p.text.includes(
        'If this door abuts mapped space, treat it as a secret door.'
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
    const pendingContext = readTableContext(pending?.context);
    const passageNode = resolvePassageExitLocation({
      roll: 9,
      context:
        pendingContext && pendingContext.kind === 'exit'
          ? {
              index: pendingContext.index,
              total: pendingContext.total,
              origin: pendingContext.origin,
            }
          : undefined,
    });
    const passage = asEvent(passageNode);
    const directionPending = passage.children?.find(
      (child): child is PendingRoll => child.type === 'pending-roll'
    );
    const directionContext = readTableContext(directionPending?.context);
    const direction = resolveExitDirection({
      roll: 20,
      context:
        directionContext && directionContext.kind === 'exitDirection'
          ? {
              index: directionContext.index,
              total: directionContext.total,
              origin: directionContext.origin,
            }
          : undefined,
    });
    const resolvedDirection = asEvent(direction);
    if (resolvedDirection.event.kind !== 'exitDirection') {
      throw new Error('Expected exit direction event');
    }
    const alternativePending = passage.children?.find(
      (child): child is PendingRoll =>
        child.type === 'pending-roll' && child.table === 'exitAlternative'
    );
    if (passage.event.kind !== 'passageExitLocation') {
      throw new Error('Expected passage exit location event');
    }
    const passageChildren: DungeonOutcomeNode[] = [resolvedDirection];
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
        (p) => p.text.includes('Passage 1') && p.text.includes(':')
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
    const passagePreview = findPreviewById(nodes, 'passageExitLocation');
    expect(passagePreview?.context).toEqual({
      kind: 'exit',
      exitType: 'passage',
      index: passage.event.index,
      total: passage.event.total,
      origin: passage.event.origin,
    });
    const directionPreview = findPreviewById(nodes, 'exitDirection');
    expect(directionPreview?.context).toEqual({
      kind: 'exitDirection',
      index: resolvedDirection.event.index,
      total: resolvedDirection.event.total,
      origin: resolvedDirection.event.origin,
    });
    expect(hasPreviewId(nodes, 'exitAlternative')).toBe(true);
  });
});
