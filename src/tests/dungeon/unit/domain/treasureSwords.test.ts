import type {
  OutcomeEventNode,
  PendingRoll,
} from '../../../../dungeon/domain/outcome';
import {
  resolveTreasureSwords,
  resolveTreasureSwordPrimaryAbility,
} from '../../../../dungeon/domain/resolvers';
import {
  renderDetailTree,
  toCompactRender,
} from '../../../../dungeon/adapters/render';
import {
  TreasureSword,
  TreasureSwordKind,
  TreasureSwordUnusual,
  TreasureSwordPrimaryAbility,
} from '../../../../tables/dungeon/treasureSwords';
import type { TreasureSwordPrimaryAbilityResult } from '../../../../tables/dungeon/treasureSwords';

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
      languageRolls: [41],
      primaryAbilityRolls: [34, 67],
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
    expect(unusualEvent.event.result.languagesKnown).toBe(2);

    const unusualChildren = unusualEvent.children || [];
    const alignmentPending = unusualChildren.find(
      (child) =>
        child.type === 'pending-roll' && child.table === 'treasureSwordAlignment'
    );
    expect(alignmentPending).toBeDefined();

    const abilityEvents = collectAbilityEvents(unusualEvent);
    expect(abilityEvents).toHaveLength(2);

    const detailNodes = renderDetailTree(node);
    const detailText = detailNodes
      .filter(
        (child): child is { kind: 'paragraph'; text: string } =>
          child.kind === 'paragraph'
      )
      .map((child) => child.text)
      .join(' ');
    expect(detailText).toContain('(I14, 2 languages)');
    expect(detailText).toContain('plus 2 additional tongues.');
    expect(detailText).toContain('The sword can detect evil/good in a 1" radius.');
    expect(detailText).toContain('The sword can detect magic in a 1" radius.');
  });

  it('queues pending primary ability rolls when none are preset', () => {
    const node = resolveTreasureSwords({
      roll: 26,
      kindRoll: 80,
      unusualRoll: 90,
      languageRolls: [41],
    });

    if (node.type !== 'event' || node.event.kind !== 'treasureSwords') {
      throw new Error('Expected treasureSwords event');
    }

    const unusualEvent = (node.children || []).find(
      (child): child is OutcomeEventNode =>
        child.type === 'event' && child.event.kind === 'treasureSwordUnusual'
    );
    if (
      !unusualEvent ||
      unusualEvent.event.kind !== 'treasureSwordUnusual'
    ) {
      throw new Error('Expected treasureSwordUnusual child event');
    }

    const pendingAbilities = (unusualEvent.children || []).filter(
      (child): child is PendingRoll =>
        child.type === 'pending-roll' &&
        child.table === 'treasureSwordPrimaryAbility'
    );
    expect(pendingAbilities).toHaveLength(
      unusualEvent.event.result.primaryAbilityCount
    );
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

  it('doubles ability range when the same ability appears multiple times', () => {
    const node = resolveTreasureSwords({
      roll: 10,
      kindRoll: 15,
      unusualRoll: 84,
      primaryAbilityRolls: [67, 67],
    });

    if (node.type !== 'event' || node.event.kind !== 'treasureSwords') {
      throw new Error('Expected treasureSwords event');
    }

    const unusualEvent = (node.children || []).find(
      (child): child is OutcomeEventNode =>
        child.type === 'event' && child.event.kind === 'treasureSwordUnusual'
    );
    if (
      !unusualEvent ||
      unusualEvent.event.kind !== 'treasureSwordUnusual'
    ) {
      throw new Error('Expected unusual event');
    }
    const abilityEvents = collectAbilityEvents(unusualEvent);
    expect(abilityEvents).toHaveLength(2);
    const counts = aggregateAbilityCounts(abilityEvents);
    expect(counts.get(TreasureSwordPrimaryAbility.DetectMagic)).toBe(2);
  });

  it('includes abilities in compact render once determined', () => {
    const node = resolveTreasureSwords({
      roll: 26,
      kindRoll: 80,
      unusualRoll: 90,
      languageRolls: [41],
      primaryAbilityRolls: [34, 67],
    });

    if (node.type !== 'event' || node.event.kind !== 'treasureSwords') {
      throw new Error('Expected treasureSwords event');
    }

    const compactTexts = toCompactRender(node)
      .filter(
        (child): child is { kind: 'paragraph'; text: string } =>
          child.kind === 'paragraph'
      )
      .map((child) => child.text)
      .join(' ');

    expect(compactTexts).toContain(
      'The sword can detect evil/good in a 1" radius.'
    );
    expect(compactTexts).toContain(
      'The sword can detect magic in a 1" radius.'
    );
  });

  it('includes abilities in compact render after resolving pending rolls', () => {
    const node = resolveTreasureSwords({
      roll: 26,
      kindRoll: 80,
      unusualRoll: 90,
      languageRolls: [41],
    });

    if (node.type !== 'event' || node.event.kind !== 'treasureSwords') {
      throw new Error('Expected treasureSwords event');
    }

    const unusualEvent = (node.children || []).find(
      (child): child is OutcomeEventNode =>
        child.type === 'event' && child.event.kind === 'treasureSwordUnusual'
    );
    if (
      !unusualEvent ||
      unusualEvent.event.kind !== 'treasureSwordUnusual'
    ) {
      throw new Error('Expected treasureSwordUnusual event');
    }

    const pendingAbilityIndex = (unusualEvent.children || []).findIndex(
      (child) =>
        child.type === 'pending-roll' &&
        child.table === 'treasureSwordPrimaryAbility'
    );
    expect(pendingAbilityIndex).toBeGreaterThanOrEqual(0);

    const pendingAbility = (unusualEvent.children || [])[pendingAbilityIndex];
    if (!pendingAbility || pendingAbility.type !== 'pending-roll') {
      throw new Error('Missing pending primary ability roll');
    }
    const pendingContext =
      pendingAbility.context && typeof pendingAbility.context === 'object'
        ? (pendingAbility.context as {
            slotKey?: unknown;
            rollIndex?: unknown;
            tableVariant?: unknown;
          })
        : {};

    const abilityNode = resolveTreasureSwordPrimaryAbility({
      roll: 34,
      slotKey:
        typeof pendingContext.slotKey === 'string'
          ? pendingContext.slotKey
          : undefined,
      rollIndex:
        typeof pendingContext.rollIndex === 'number'
          ? pendingContext.rollIndex
          : undefined,
      tableVariant:
        pendingContext.tableVariant === 'restricted'
          ? 'restricted'
          : 'standard',
    });

    const updatedChildren = [...(unusualEvent.children || [])];
    updatedChildren[pendingAbilityIndex] = abilityNode;
    unusualEvent.children = updatedChildren;

    const compactText = toCompactRender(node)
      .filter(
        (child): child is { kind: 'paragraph'; text: string } =>
          child.kind === 'paragraph'
      )
      .map((child) => child.text)
      .join(' ');

    expect(compactText).toContain(
      'The sword can detect evil/good in a 1" radius.'
    );
  });

  it('keeps the roll-twice table collapsed when resolving restricted abilities', () => {
    const node = resolveTreasureSwords({
      roll: 26,
      kindRoll: 80,
      unusualRoll: 90,
      languageRolls: [41],
    });

    if (node.type !== 'event' || node.event.kind !== 'treasureSwords') {
      throw new Error('Expected treasureSwords event');
    }

    const unusualEvent = (node.children || []).find(
      (child): child is OutcomeEventNode =>
        child.type === 'event' && child.event.kind === 'treasureSwordUnusual'
    );
    if (
      !unusualEvent ||
      unusualEvent.event.kind !== 'treasureSwordUnusual'
    ) {
      throw new Error('Expected treasureSwordUnusual event');
    }

    const pendingAbilityIndex = (unusualEvent.children || []).findIndex(
      (child) =>
        child.type === 'pending-roll' &&
        child.table === 'treasureSwordPrimaryAbility'
    );
    if (pendingAbilityIndex < 0) {
      throw new Error('Expected pending primary ability');
    }

    const pendingStandard = (unusualEvent.children || [])[pendingAbilityIndex];
    if (!pendingStandard || pendingStandard.type !== 'pending-roll') {
      throw new Error('Missing standard pending');
    }
    const standardContext =
      pendingStandard.context && typeof pendingStandard.context === 'object'
        ? (pendingStandard.context as {
            slotKey?: unknown;
            rollIndex?: unknown;
          })
        : {};

    const rollTwiceNode = resolveTreasureSwordPrimaryAbility({
      roll: 93,
      slotKey:
        typeof standardContext.slotKey === 'string'
          ? standardContext.slotKey
          : undefined,
      rollIndex:
        typeof standardContext.rollIndex === 'number'
          ? standardContext.rollIndex
          : undefined,
    });

    const updatedChildren = [...(unusualEvent.children || [])];
    updatedChildren[pendingAbilityIndex] = rollTwiceNode;
    unusualEvent.children = updatedChildren;

    const instructionNode = updatedChildren[pendingAbilityIndex];
    if (
      !instructionNode ||
      instructionNode.type !== 'event' ||
      instructionNode.event.kind !== 'treasureSwordPrimaryAbility' ||
      instructionNode.event.result.kind !== 'instruction'
    ) {
      throw new Error('Expected instruction node after 93 roll');
    }

    const pendingRestricted = (instructionNode.children || []).filter(
      (child): child is PendingRoll =>
        child.type === 'pending-roll' &&
        child.table === 'treasureSwordPrimaryAbilityRestricted'
    );
    expect(pendingRestricted).toHaveLength(2);

    const firstRestrictedContext =
      pendingRestricted[0]?.context &&
      typeof pendingRestricted[0]?.context === 'object'
        ? (pendingRestricted[0]?.context as {
            slotKey?: unknown;
            rollIndex?: unknown;
          })
        : {};

    const restrictedAbilityNode = resolveTreasureSwordPrimaryAbility({
      roll: 34,
      slotKey:
        typeof firstRestrictedContext.slotKey === 'string'
          ? firstRestrictedContext.slotKey
          : undefined,
      rollIndex:
        typeof firstRestrictedContext.rollIndex === 'number'
          ? firstRestrictedContext.rollIndex
          : undefined,
      tableVariant: 'restricted',
    });

    const instructionChildren = [...(instructionNode.children || [])];
    instructionChildren[0] = restrictedAbilityNode;
    instructionNode.children = instructionChildren;

    const remainingPending = instructionChildren.filter(
      (child): child is PendingRoll => child.type === 'pending-roll'
    );
    expect(remainingPending).toHaveLength(1);
    expect(remainingPending[0]?.table).toBe(
      'treasureSwordPrimaryAbilityRestricted'
    );

    const detailNodes = renderDetailTree(node);
    const standardPreviews = detailNodes.filter(
      (child) =>
        child.kind === 'table-preview' &&
        child.id.startsWith('treasureSwordPrimaryAbility') &&
        !child.id.startsWith('treasureSwordPrimaryAbilityRestricted')
    );
    expect(standardPreviews).toHaveLength(1);
    const restrictedPreviews = detailNodes.filter(
      (child) =>
        child.kind === 'table-preview' &&
        child.id.startsWith('treasureSwordPrimaryAbilityRestricted')
    );
    expect(restrictedPreviews.length).toBeGreaterThan(0);
  });

  it('adds extra abilities when 93-98 is rolled', () => {
    let node = resolveTreasureSwords({
      roll: 15,
      kindRoll: 5,
      unusualRoll: 78,
      primaryAbilityRolls: [93, 5, 20],
    });

    if (node.type !== 'event' || node.event.kind !== 'treasureSwords') {
      throw new Error('Expected treasureSwords event');
    }

    const unusualEvent = (node.children || []).find(
      (child): child is OutcomeEventNode =>
        child.type === 'event' && child.event.kind === 'treasureSwordUnusual'
    );
    if (
      !unusualEvent ||
      unusualEvent.event.kind !== 'treasureSwordUnusual'
    ) {
      throw new Error('Expected unusual event');
    }
    const instructionNodes = (unusualEvent.children || []).filter(
      (child): child is OutcomeEventNode =>
        child.type === 'event' &&
        child.event.kind === 'treasureSwordPrimaryAbility' &&
        child.event.result.kind === 'instruction'
    );
    expect(instructionNodes).toHaveLength(1);
    const instructionNode = instructionNodes[0];
    if (!instructionNode) {
      throw new Error('Expected instruction node for primary abilities');
    }
    const instructionPending = instructionNodes[0]?.children?.filter(
      (child): child is PendingRoll =>
        child.type === 'pending-roll' &&
        child.table === 'treasureSwordPrimaryAbilityRestricted'
    );
    expect(instructionPending).toBeDefined();
    const pendingList = instructionPending ?? [];
    const forcedRolls: Array<{ roll: number; expected: string }> = [
      { roll: 5, expected: 'detect "elevator"/shifting rooms/walls in a 1" radius' },
      { roll: 20, expected: 'detect sloping passages in a 1" radius' },
    ];
    const instructionChildren = [...(instructionNode.children || [])];
    pendingList.forEach((pending, index) => {
      const context =
        pending.context && typeof pending.context === 'object'
          ? (pending.context as {
              slotKey?: unknown;
              tableVariant?: unknown;
              rollIndex?: unknown;
            })
          : {};
      expect(context.tableVariant).toBe('restricted');
      const forced = forcedRolls[index];
      if (!forced) {
        throw new Error('Missing forced roll for instruction resolution');
      }
      const resultNode = resolveTreasureSwordPrimaryAbility({
        roll: forced.roll,
        rollIndex:
          typeof context.rollIndex === 'number' ? context.rollIndex : undefined,
        slotKey: typeof context.slotKey === 'string' ? (context.slotKey as string) : undefined,
        tableVariant:
          context.tableVariant === 'restricted' ? 'restricted' : 'standard',
      });
      if (resultNode.type !== 'event') {
        throw new Error('Expected ability event');
      }
      if (
        resultNode.event.kind !== 'treasureSwordPrimaryAbility' ||
        resultNode.event.result.kind !== 'ability'
      ) {
        throw new Error('Expected ability result');
      }
      expect(resultNode.event.result.description).toBe(forced.expected);

      const pendingIndex = instructionChildren.findIndex(
        (child) => child === pending
      );
      if (pendingIndex < 0) {
        throw new Error('Unable to locate pending child to replace');
      }
      instructionChildren[pendingIndex] = resultNode;
    });
    instructionNode.children = instructionChildren;

    const detailNodes = renderDetailTree(node);
    const remainingRestrictedPreviews = detailNodes.filter(
      (child) =>
        child.kind === 'table-preview' &&
        child.id.startsWith('treasureSwordPrimaryAbilityRestricted')
    );
    expect(remainingRestrictedPreviews).toHaveLength(0);
  });

  it('records extraordinary powers when rolled on the primary table', () => {
    const node = resolveTreasureSwords({
      roll: 20,
      kindRoll: 12,
      unusualRoll: 100,
      languageRolls: [20],
      primaryAbilityRolls: [100, 34, 45],
    });

    if (node.type !== 'event' || node.event.kind !== 'treasureSwords') {
      throw new Error('Expected treasureSwords event');
    }

    const unusualEvent = (node.children || []).find(
      (child): child is OutcomeEventNode =>
        child.type === 'event' && child.event.kind === 'treasureSwordUnusual'
    );
    if (
      !unusualEvent ||
      unusualEvent.event.kind !== 'treasureSwordUnusual'
    ) {
      throw new Error('Expected unusual event');
    }
    const abilityEvents = collectAbilityEvents(unusualEvent);
    const counts = aggregateAbilityCounts(abilityEvents);
    expect(counts.get(TreasureSwordPrimaryAbility.ExtraordinaryPower)).toBe(1);
    const abilityDescriptions = summarizeAbilityDescriptions(unusualEvent);
    const extraordinary = abilityDescriptions.find((text) =>
      text.includes('extraordinary power')
    );
    expect(extraordinary).toBeDefined();
  });
});

type AbilityEventNode = OutcomeEventNode & {
  event: {
    kind: 'treasureSwordPrimaryAbility';
    result: Extract<TreasureSwordPrimaryAbilityResult, { kind: 'ability' }>;
  };
};

function collectAbilityEvents(node: OutcomeEventNode): AbilityEventNode[] {
  const result: AbilityEventNode[] = [];
  const queue: OutcomeEventNode[] = [node];
  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) continue;
    if (
      current.event.kind === 'treasureSwordPrimaryAbility' &&
      current.event.result.kind === 'ability'
    ) {
      result.push(current as AbilityEventNode);
    }
    const children = current.children || [];
    for (const child of children) {
      if (child.type === 'event') {
        queue.push(child);
      }
    }
  }
  return result;
}

function summarizeAbilityDescriptions(node: OutcomeEventNode): string[] {
  const detailNodes = renderDetailTree(node);
  return detailNodes
    .filter((child) => child.kind === 'paragraph')
    .map((child) => (child as { text: string }).text)
    .filter((text) => text.startsWith('The sword can'));
}

function aggregateAbilityCounts(
  events: AbilityEventNode[]
): Map<TreasureSwordPrimaryAbility, number> {
  const counts = new Map<TreasureSwordPrimaryAbility, number>();
  for (const event of events) {
    const result = event.event.result;
    const current = counts.get(result.ability) ?? 0;
    const contribution = result.multiplier ?? result.rolls.length ?? 1;
    counts.set(result.ability, current + contribution);
  }
  return counts;
}
