import type { OutcomeEventNode } from '../../../../dungeon/domain/outcome';
import { resolveTreasureSwords } from '../../../../dungeon/domain/resolvers';
import { renderDetailTree } from '../../../../dungeon/adapters/render';
import {
  TreasureSword,
  TreasureSwordKind,
  TreasureSwordUnusual,
} from '../../../../tables/dungeon/treasureSwords';

describe('resolveTreasureSwords', () => {
  it('creates pending rolls for kind and unusual tables by default', () => {
    const node = resolveTreasureSwords({ roll: 10 });

    if (node.type !== 'event' || node.event.kind !== 'treasureSwords') {
      throw new Error('Expected treasureSwords event');
    }

    const pendingChildren = node.children || [];
    expect(pendingChildren).toHaveLength(2);

    const kinds = pendingChildren.filter(
      (child) =>
        child.type === 'pending-roll' &&
        (child.id?.startsWith('treasureSwordKind') ||
          child.table.startsWith('treasureSwordKind'))
    );
    const unusual = pendingChildren.filter(
      (child) =>
        child.type === 'pending-roll' &&
        (child.id?.startsWith('treasureSwordUnusual') ||
          child.table.startsWith('treasureSwordUnusual'))
    );

    expect(kinds).toHaveLength(1);
    expect(unusual).toHaveLength(1);
  });

  it('resolves sword result with type and unusual subtables', () => {
    const node = resolveTreasureSwords({
      roll: 26,
      kindRoll: 80,
      unusualRoll: 90,
    });

    if (node.type !== 'event' || node.event.kind !== 'treasureSwords') {
      throw new Error('Expected treasureSwords event');
    }

    expect(node.event.result).toBe(
      TreasureSword.SwordPlus1Plus2VsMagicUsers
    );

    const childEvents = (node.children || []).filter(
      (child): child is OutcomeEventNode => child.type === 'event'
    );
    expect(childEvents).toHaveLength(2);

    const kindEvent = childEvents.find(
      (child) => child.event.kind === 'treasureSwordKind'
    );
    const unusualEvent = childEvents.find(
      (child) => child.event.kind === 'treasureSwordUnusual'
    );

    if (!kindEvent || kindEvent.event.kind !== 'treasureSwordKind') {
      throw new Error('Expected treasureSwordKind child event');
    }
    expect(kindEvent.event.result).toBe(TreasureSwordKind.Broadsword);

    if (!unusualEvent || unusualEvent.event.kind !== 'treasureSwordUnusual') {
      throw new Error('Expected treasureSwordUnusual child event');
    }
    expect(unusualEvent.event.result.variant).toBe(
      TreasureSwordUnusual.Intelligence14
    );
    expect(unusualEvent.event.result.intelligence).toBe(14);
    expect(unusualEvent.event.result.primaryAbilityCount).toBe(2);
    expect(unusualEvent.event.result.communication).toBe('speech');
    expect(unusualEvent.event.result.requiresAlignment).toBe(true);

    const unusualChildren = unusualEvent.children || [];
    const alignmentPending = unusualChildren.find(
      (child) =>
        child.type === 'pending-roll' && child.table === 'treasureSwordAlignment'
    );
    expect(alignmentPending).toBeDefined();
  });

  it('assigns lawful good alignment to holy avenger swords', () => {
    const node = resolveTreasureSwords({ roll: 80, kindRoll: 50 });
    if (node.type !== 'event' || node.event.kind !== 'treasureSwords') {
      throw new Error('Expected treasureSwords event');
    }
    const alignmentEvent = (node.children || []).find(
      (child): child is OutcomeEventNode =>
        child.type === 'event' && child.event.kind === 'treasureSwordAlignment'
    );
    expect(alignmentEvent).toBeDefined();
    if (
      !alignmentEvent ||
      alignmentEvent.event.kind !== 'treasureSwordAlignment'
    ) {
      throw new Error('Missing alignment event');
    }
    expect(alignmentEvent.event.result.label).toBe('Lawful Good');
    expect(alignmentEvent.event.result.source).toBe('fixed');

    const detailNodes = renderDetailTree(node);
    const alignmentPreview = detailNodes.some(
      (child) =>
        child.kind === 'table-preview' &&
        child.id.startsWith('treasureSwordAlignment')
    );
    expect(alignmentPreview).toBe(false);
  });

  it('queues chaotic alignment rolls for swords of sharpness', () => {
    const node = resolveTreasureSwords({ roll: 84, kindRoll: 40 });
    if (node.type !== 'event' || node.event.kind !== 'treasureSwords') {
      throw new Error('Expected treasureSwords event');
    }
    const alignmentPending = (node.children || []).find(
      (child) =>
        child.type === 'pending-roll' &&
        child.table === 'treasureSwordAlignmentChaotic'
    );
    expect(alignmentPending).toBeDefined();
  });

  it('assigns neutral alignment to unusual cursed swords', () => {
    const node = resolveTreasureSwords({
      roll: 86,
      kindRoll: 20,
      unusualRoll: 80,
    });
    if (node.type !== 'event' || node.event.kind !== 'treasureSwords') {
      throw new Error('Expected treasureSwords event');
    }
    const unusualEvent = (node.children || []).find(
      (child): child is OutcomeEventNode =>
        child.type === 'event' && child.event.kind === 'treasureSwordUnusual'
    );
    if (!unusualEvent) throw new Error('Expected unusual event');
    const alignmentEvent = (unusualEvent.children || []).find(
      (child): child is OutcomeEventNode =>
        child.type === 'event' && child.event.kind === 'treasureSwordAlignment'
    );
    expect(alignmentEvent).toBeDefined();
    if (
      !alignmentEvent ||
      alignmentEvent.event.kind !== 'treasureSwordAlignment'
    ) {
      throw new Error('Missing alignment event');
    }
    expect(alignmentEvent.event.result.label).toBe('True Neutral');
    expect(alignmentEvent.event.result.source).toBe('fixed');

    const detailNodes = renderDetailTree(node);
    const alignmentPreview = detailNodes.some(
      (child) =>
        child.kind === 'table-preview' &&
        child.id.startsWith('treasureSwordAlignment')
    );
    expect(alignmentPreview).toBe(false);
  });

  it('renders alignment preview for intelligent swords', () => {
    const node = resolveTreasureSwords({
      roll: 1,
      kindRoll: 40,
      unusualRoll: 80,
    });

    if (node.type !== 'event' || node.event.kind !== 'treasureSwords') {
      throw new Error('Expected treasureSwords event');
    }

    const detailNodes = renderDetailTree(node);
    const alignmentPreview = detailNodes.find(
      (child) =>
        child.kind === 'table-preview' &&
        child.id.startsWith('treasureSwordAlignment')
    );
    expect(alignmentPreview).toBeDefined();
  });
});
