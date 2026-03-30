import type {
  OutcomeEventNode,
  PendingRoll,
} from '../../../../dungeon/domain/outcome';
import {
  resolveTreasureSwords,
  resolveTreasureSwordPrimaryAbility,
  resolveTreasureSwordExtraordinaryPower,
  resolveTreasureSwordUnusual,
  resolveTreasureSwordSpecialPurpose,
  resolveTreasureSwordSpecialPurposePower,
} from '../../../../dungeon/features/treasure/swords/swordsResolvers';
import {
  renderDetailTree,
  toCompactRender,
} from '../../../../dungeon/adapters/render';
import { findChildEvent } from '../../../../dungeon/adapters/render/shared';
import {
  TreasureSword,
  TreasureSwordKind,
  TreasureSwordUnusual,
  TreasureSwordPrimaryAbility,
  TreasureSwordExtraordinaryPower,
  TreasureSwordSpecialPurpose,
  describeSwordSpecialPurpose,
  TreasureSwordDragonSlayerColor,
  type TreasureSwordDragonSlayerColorResult,
} from '../../../../dungeon/features/treasure/swords/swordsTables';
import type {
  TreasureSwordPrimaryAbilityResult,
  TreasureSwordSpecialPurposeResult,
  TreasureSwordSpecialPurposePowerResult,
} from '../../../../dungeon/features/treasure/swords/swordsTables';
import { summarizePrimaryAbilities } from '../../../../dungeon/features/treasure/swords/swordsRender';
import {
  TreasureSwordAlignment,
  type TreasureSwordAlignmentResult,
} from '../../../../dungeon/features/treasure/swords/swordsAlignmentTable';
import { computeSwordEgo } from '../../../../dungeon/features/treasure/swords/swordEgo';
import {
  collectPreviews,
  collectPreviewTargetKeys,
} from '../../../support/dungeon/previewUtils';

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

    expect(node.event.result).toBe(TreasureSword.SwordPlus1Plus2VsMagicUsers);

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
        child.type === 'pending-roll' &&
        child.table === 'treasureSwordAlignment'
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
    expect(detailText).toContain(
      'The sword can detect evil/good in a 1" radius.'
    );
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
    if (!unusualEvent || unusualEvent.event.kind !== 'treasureSwordUnusual') {
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

  it('queues extraordinary power rolls when unusual results grant one', () => {
    const node = resolveTreasureSwords({
      roll: 26,
      kindRoll: 80,
      unusualRoll: 100,
    });

    if (node.type !== 'event' || node.event.kind !== 'treasureSwords') {
      throw new Error('Expected treasureSwords event');
    }

    const unusualEvent = (node.children || []).find(
      (child): child is OutcomeEventNode =>
        child.type === 'event' && child.event.kind === 'treasureSwordUnusual'
    );
    if (!unusualEvent) {
      throw new Error('Expected treasureSwordUnusual event');
    }

    const extraPending = (unusualEvent.children || []).filter(
      (child): child is PendingRoll =>
        child.type === 'pending-roll' &&
        child.table === 'treasureSwordExtraordinaryPower'
    );
    expect(extraPending).toHaveLength(1);
  });

  it('waits to display ego until the sword is fully resolved', () => {
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

    expect(computeSwordEgo(node)).toBeUndefined();

    const compactText = toCompactRender(node)
      .filter(
        (child): child is { kind: 'paragraph'; text: string } =>
          child.kind === 'paragraph'
      )
      .map((child) => child.text)
      .join(' ');

    expect(compactText).not.toContain(', E');
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
    const alignmentPreview = collectPreviews(detailNodes).some((child) =>
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
    const alignmentPreview = collectPreviews(detailNodes).some((child) =>
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
    const alignmentPreview = collectPreviews(detailNodes).find((child) =>
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
    if (!unusualEvent || unusualEvent.event.kind !== 'treasureSwordUnusual') {
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

  it('computes and renders ego once an intelligent sword is fully resolved', () => {
    const node = resolveTreasureSwords({
      roll: 26,
      kindRoll: 80,
      unusualRoll: 90,
      alignmentRoll: 31,
      languageRolls: [41],
      primaryAbilityRolls: [34, 67],
    });

    if (node.type !== 'event' || node.event.kind !== 'treasureSwords') {
      throw new Error('Expected treasureSwords event');
    }

    expect(computeSwordEgo(node)).toBe(7);

    const detailText = renderDetailTree(node)
      .filter(
        (child): child is { kind: 'paragraph'; text: string } =>
          child.kind === 'paragraph'
      )
      .map((child) => child.text)
      .join(' ');
    expect(detailText).toContain('(I14, 2 languages, E7).');

    const detailBullet = renderDetailTree(node).find(
      (child): child is { kind: 'bullet-list'; items: string[] } =>
        child.kind === 'bullet-list'
    );
    expect(detailBullet?.items[0]).toContain('(I14, 2 languages, E7)');
  });

  it('annotates luck blade wishes in detail and compact output', () => {
    const node = resolveTreasureSwords({
      roll: 50,
      kindRoll: 10,
      luckBladeWishes: 4,
    });

    if (node.type !== 'event' || node.event.kind !== 'treasureSwords') {
      throw new Error('Expected treasureSwords event');
    }

    const detailNodes = renderDetailTree(node);
    const detailBullet = detailNodes.find(
      (child): child is { kind: 'bullet-list'; items: string[] } =>
        child.kind === 'bullet-list'
    );
    expect(detailBullet).toBeDefined();
    expect(detailBullet?.items[0]).toContain('Luck Blade (4 wishes)');

    const compactText = toCompactRender(node)
      .filter(
        (child): child is { kind: 'paragraph'; text: string } =>
          child.kind === 'paragraph'
      )
      .map((child) => child.text)
      .join(' ');
    expect(compactText).toContain('Luck Blade (4 wishes)');
  });

  it('does not calculate or render ego for non-unusual swords', () => {
    const node = resolveTreasureSwords({
      roll: 46,
      kindRoll: 10,
      unusualRoll: 20,
    });

    if (node.type !== 'event' || node.event.kind !== 'treasureSwords') {
      throw new Error('Expected treasureSwords event');
    }

    expect(computeSwordEgo(node)).toBeUndefined();

    const compactText = toCompactRender(node)
      .filter(
        (child): child is { kind: 'paragraph'; text: string } =>
          child.kind === 'paragraph'
      )
      .map((child) => child.text)
      .join(' ');
    expect(compactText).toContain('undead.');
    expect(compactText).not.toContain('(E');
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
    if (!unusualEvent || unusualEvent.event.kind !== 'treasureSwordUnusual') {
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
    if (!unusualEvent || unusualEvent.event.kind !== 'treasureSwordUnusual') {
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
    const standardPreviews = collectPreviews(detailNodes).filter(
      (child) =>
        child.id.startsWith('treasureSwordPrimaryAbility') &&
        !child.id.startsWith('treasureSwordPrimaryAbilityRestricted')
    );
    expect(standardPreviews).toHaveLength(2);
    const collapsedPreviews = standardPreviews.filter(
      (preview) => (preview as { autoCollapse?: boolean }).autoCollapse
    );
    expect(collapsedPreviews.length).toBeGreaterThan(0);
    const restrictedPreviews = collectPreviews(detailNodes).filter((child) =>
      child.id.startsWith('treasureSwordPrimaryAbilityRestricted')
    );
    expect(restrictedPreviews.length).toBeGreaterThan(0);
  });

  it('queues extraordinary power rolls when a primary ability result indicates one', () => {
    const abilityNode = resolveTreasureSwordPrimaryAbility({
      roll: 100,
      slotKey: 'test-slot',
    });

    if (abilityNode.type !== 'event') {
      throw new Error('Expected event node');
    }

    if (abilityNode.event.kind !== 'treasureSwordPrimaryAbility') {
      throw new Error('Expected primary ability event');
    }

    const result = abilityNode.event.result;
    if (result.kind !== 'instruction') {
      throw new Error('Expected instruction result');
    }
    expect(result.instruction).toBe('extraordinaryPower');

    const extraPending = (abilityNode.children || []).filter(
      (child): child is PendingRoll =>
        child.type === 'pending-roll' &&
        child.table === 'treasureSwordExtraordinaryPower'
    );
    expect(extraPending).toHaveLength(1);
  });

  it('queues dragon slayer target selection when sword is mundane', () => {
    const unusualNode = resolveTreasureSwordUnusual({
      roll: 20,
      sword: TreasureSword.SwordPlus2DragonSlayer,
      rollIndex: 1,
    });

    if (unusualNode.type !== 'event') {
      throw new Error('Expected unusual sword event');
    }
    if (unusualNode.event.kind !== 'treasureSwordUnusual') {
      throw new Error('Unexpected unusual event kind');
    }

    const result = unusualNode.event.result;
    if (!result || result.variant !== TreasureSwordUnusual.Normal) {
      throw new Error('Expected normal sword result');
    }

    const pendingColor = (unusualNode.children || []).find(
      (child: PendingRoll | OutcomeEventNode): child is PendingRoll =>
        child.type === 'pending-roll' &&
        child.table === 'treasureSwordDragonSlayerColor'
    );
    expect(pendingColor).toBeDefined();
    const context = pendingColor?.context;
    if (!context || typeof context !== 'object') {
      throw new Error('Expected dragon slayer context');
    }
    expect((context as { kind?: string }).kind).toBe(
      'treasureSwordDragonSlayerColor'
    );
  });

  it('excludes dragons matching the sword alignment when intelligent', () => {
    const swordNode = resolveTreasureSwords({
      roll: 63,
      kindRoll: 42,
      unusualRoll: 95,
      alignmentRoll: 10,
      dragonSlayerColorRoll: 1,
    });

    if (
      swordNode.type !== 'event' ||
      swordNode.event.kind !== 'treasureSwords'
    ) {
      throw new Error('Expected treasure swords event');
    }

    const unusualEvent = findChildEvent(swordNode, 'treasureSwordUnusual');
    if (!unusualEvent || unusualEvent.type !== 'event') {
      throw new Error('Expected unusual event');
    }
    const alignmentEvent = findChildEvent(
      unusualEvent,
      'treasureSwordAlignment'
    );
    if (!alignmentEvent || alignmentEvent.type !== 'event') {
      throw new Error('Expected alignment event');
    }
    if (alignmentEvent.event.kind !== 'treasureSwordAlignment') {
      throw new Error('Unexpected alignment event kind');
    }
    const alignmentResult = alignmentEvent.event
      .result as TreasureSwordAlignmentResult;
    const colorEvent = findChildEvent(
      unusualEvent,
      'treasureSwordDragonSlayerColor'
    );
    if (!colorEvent || colorEvent.type !== 'event') {
      throw new Error('Expected dragon slayer color event');
    }
    if (colorEvent.event.kind !== 'treasureSwordDragonSlayerColor') {
      throw new Error('Unexpected dragon slayer color kind');
    }
    const colorResult = colorEvent.event
      .result as TreasureSwordDragonSlayerColorResult;
    expect(colorResult.alignment).not.toBe(alignmentResult.alignment);
  });

  it('keeps the extraordinary power table collapsed when resolving restricted rolls', () => {
    const instructionNode = resolveTreasureSwordExtraordinaryPower({
      roll: 96,
      slotKey: 'extra-slot',
      rollIndex: 2,
    });

    if (instructionNode.type !== 'event') {
      throw new Error('Expected event node');
    }

    if (instructionNode.event.kind !== 'treasureSwordExtraordinaryPower') {
      throw new Error('Expected extraordinary power event');
    }

    const result = instructionNode.event.result;
    if (result.kind !== 'instruction') {
      throw new Error('Expected instruction result');
    }
    expect(result.instruction).toBe('rollTwice');

    const pendingRestricted = (instructionNode.children || []).filter(
      (child): child is PendingRoll =>
        child.type === 'pending-roll' &&
        child.table === 'treasureSwordExtraordinaryPowerRestricted'
    );
    expect(pendingRestricted).toHaveLength(2);

    const firstContext = pendingRestricted[0]?.context;
    if (!firstContext || typeof firstContext !== 'object') {
      throw new Error('Missing restricted context');
    }

    const resolvedFirst = resolveTreasureSwordExtraordinaryPower({
      roll: 42,
      slotKey:
        typeof (firstContext as { slotKey?: unknown }).slotKey === 'string'
          ? ((firstContext as { slotKey?: string }).slotKey as string)
          : undefined,
      rollIndex:
        typeof (firstContext as { rollIndex?: unknown }).rollIndex === 'number'
          ? ((firstContext as { rollIndex?: number }).rollIndex as number)
          : undefined,
      tableVariant: 'restricted',
    });

    const updatedChildren = [...(instructionNode.children || [])];
    updatedChildren[0] = resolvedFirst;
    instructionNode.children = updatedChildren;

    const remaining = updatedChildren.filter(
      (child): child is PendingRoll =>
        child.type === 'pending-roll' &&
        child.table === 'treasureSwordExtraordinaryPowerRestricted'
    );
    expect(remaining).toHaveLength(1);

    const remainingContext = remaining[0]?.context;
    if (!remainingContext || typeof remainingContext !== 'object') {
      throw new Error('Missing remaining restricted context');
    }

    const resolvedSecond = resolveTreasureSwordExtraordinaryPower({
      roll: 12,
      slotKey:
        typeof (remainingContext as { slotKey?: unknown }).slotKey === 'string'
          ? ((remainingContext as { slotKey?: string }).slotKey as string)
          : undefined,
      rollIndex:
        typeof (remainingContext as { rollIndex?: unknown }).rollIndex ===
        'number'
          ? ((remainingContext as { rollIndex?: number }).rollIndex as number)
          : undefined,
      tableVariant: 'restricted',
    });

    instructionNode.children = [resolvedFirst, resolvedSecond];

    const detailNodes = renderDetailTree(instructionNode);
    const previewIds = collectPreviewTargetKeys(detailNodes);
    expect(
      previewIds.some((id) => id.startsWith('treasureSwordExtraordinaryPower'))
    ).toBe(true);
  });

  it('spawns special purpose and power rolls when 100 is rolled', () => {
    const extraNode = resolveTreasureSwordExtraordinaryPower({
      roll: 100,
      slotKey: 'extra-slot',
      alignment: TreasureSwordAlignment.LawfulGood,
    });

    if (extraNode.type !== 'event') {
      throw new Error('Expected event node for extraordinary power');
    }

    if (extraNode.event.kind !== 'treasureSwordExtraordinaryPower') {
      throw new Error('Expected extraordinary power event');
    }

    const result = extraNode.event.result;
    if (result.kind !== 'power') {
      throw new Error('Expected power result');
    }
    expect(result.power).toBe(
      TreasureSwordExtraordinaryPower.ChooseAnyAndSpecialPurpose
    );

    const pendingPurpose = (extraNode.children || []).find(
      (child): child is PendingRoll =>
        child.type === 'pending-roll' &&
        child.table === 'treasureSwordSpecialPurpose'
    );
    expect(pendingPurpose).toBeDefined();

    const context =
      pendingPurpose && typeof pendingPurpose.context === 'object'
        ? (pendingPurpose.context as {
            slotKey?: unknown;
            rollIndex?: unknown;
            alignment?: unknown;
          })
        : {};

    expect(context.alignment).toBe(TreasureSwordAlignment.LawfulGood);

    const purposeNode = resolveTreasureSwordSpecialPurpose({
      roll: 8,
      slotKey:
        typeof context.slotKey === 'string'
          ? (context.slotKey as string)
          : undefined,
      rollIndex:
        typeof context.rollIndex === 'number'
          ? (context.rollIndex as number)
          : undefined,
      alignment: TreasureSwordAlignment.LawfulGood,
    });

    if (purposeNode.type !== 'event') {
      throw new Error('Expected special purpose event');
    }

    if (purposeNode.event.kind !== 'treasureSwordSpecialPurpose') {
      throw new Error('Expected special purpose kind');
    }

    const purposeResult = purposeNode.event.result;
    expect(purposeResult.description).toBe('defeat/slay Chaotic Evil');
    expect(purposeResult.alignment).toBe(TreasureSwordAlignment.LawfulGood);

    const powerPending = (purposeNode.children || []).find(
      (child): child is PendingRoll =>
        child.type === 'pending-roll' &&
        child.table === 'treasureSwordSpecialPurposePower'
    );
    expect(powerPending).toBeDefined();

    const powerContext =
      powerPending && typeof powerPending.context === 'object'
        ? (powerPending.context as {
            slotKey?: unknown;
            rollIndex?: unknown;
          })
        : {};

    const powerNode = resolveTreasureSwordSpecialPurposePower({
      roll: 22,
      slotKey:
        typeof powerContext.slotKey === 'string'
          ? (powerContext.slotKey as string)
          : undefined,
      rollIndex:
        typeof powerContext.rollIndex === 'number'
          ? (powerContext.rollIndex as number)
          : undefined,
    });

    if (powerNode.type !== 'event') {
      throw new Error('Expected special purpose power event');
    }

    if (powerNode.event.kind !== 'treasureSwordSpecialPurposePower') {
      throw new Error('Expected special purpose power kind');
    }

    const powerResult = powerNode.event.result;
    expect(powerResult.description).toBe('disintegrate the target');
  });

  it('describes resolved special purposes in compact render', () => {
    const swordNode = resolveTreasureSwords({
      roll: 26,
      kindRoll: 80,
      unusualRoll: 100,
      alignmentRoll: 31,
      extraordinaryPowerRolls: [100],
    });

    if (
      swordNode.type !== 'event' ||
      swordNode.event.kind !== 'treasureSwords'
    ) {
      throw new Error('Expected treasureSwords event');
    }

    const unusualEvent = findChildEvent(swordNode, 'treasureSwordUnusual');
    if (
      !unusualEvent ||
      unusualEvent.type !== 'event' ||
      unusualEvent.event.kind !== 'treasureSwordUnusual'
    ) {
      throw new Error('Expected unusual sword event');
    }

    const extraordinaryEvent = findChildEvent(
      unusualEvent,
      'treasureSwordExtraordinaryPower'
    );
    if (
      !extraordinaryEvent ||
      extraordinaryEvent.type !== 'event' ||
      extraordinaryEvent.event.kind !== 'treasureSwordExtraordinaryPower'
    ) {
      throw new Error('Expected extraordinary power event');
    }

    const originalChildren = extraordinaryEvent.children || [];
    const pendingPurpose = originalChildren.find(
      (child): child is PendingRoll =>
        child.type === 'pending-roll' &&
        child.table === 'treasureSwordSpecialPurpose'
    );
    const pendingPower = originalChildren.find(
      (child): child is PendingRoll =>
        child.type === 'pending-roll' &&
        child.table === 'treasureSwordSpecialPurposePower'
    );
    if (!pendingPurpose || !pendingPower) {
      throw new Error('Expected both special purpose pending rolls');
    }

    const purposeContext =
      pendingPurpose.context && typeof pendingPurpose.context === 'object'
        ? (pendingPurpose.context as {
            slotKey?: unknown;
            rollIndex?: unknown;
            parentSlotKey?: unknown;
            alignment?: unknown;
          })
        : {};
    const powerContext =
      pendingPower.context && typeof pendingPower.context === 'object'
        ? (pendingPower.context as {
            slotKey?: unknown;
            rollIndex?: unknown;
            parentSlotKey?: unknown;
            alignment?: unknown;
          })
        : {};

    const resolvedPurpose = resolveTreasureSwordSpecialPurpose({
      roll: 42,
      slotKey:
        typeof purposeContext.slotKey === 'string'
          ? (purposeContext.slotKey as string)
          : undefined,
      rollIndex:
        typeof purposeContext.rollIndex === 'number'
          ? (purposeContext.rollIndex as number)
          : undefined,
      parentSlotKey:
        typeof purposeContext.parentSlotKey === 'string'
          ? (purposeContext.parentSlotKey as string)
          : undefined,
      alignment:
        typeof purposeContext.alignment === 'number'
          ? (purposeContext.alignment as TreasureSwordAlignment)
          : undefined,
    });

    if (
      resolvedPurpose.type !== 'event' ||
      resolvedPurpose.event.kind !== 'treasureSwordSpecialPurpose'
    ) {
      throw new Error('Expected resolved special purpose event');
    }

    const purposeResult = resolvedPurpose.event
      .result as TreasureSwordSpecialPurposeResult;

    const resolvedPower = resolveTreasureSwordSpecialPurposePower({
      roll: 11,
      slotKey:
        typeof powerContext.slotKey === 'string'
          ? (powerContext.slotKey as string)
          : undefined,
      rollIndex:
        typeof powerContext.rollIndex === 'number'
          ? (powerContext.rollIndex as number)
          : undefined,
      parentSlotKey:
        typeof powerContext.parentSlotKey === 'string'
          ? (powerContext.parentSlotKey as string)
          : purposeResult.parentSlotKey,
      alignment:
        typeof powerContext.alignment === 'number'
          ? (powerContext.alignment as TreasureSwordAlignment)
          : purposeResult.alignment,
    });

    if (
      resolvedPower.type !== 'event' ||
      resolvedPower.event.kind !== 'treasureSwordSpecialPurposePower'
    ) {
      throw new Error('Expected resolved special purpose power event');
    }

    const powerResult = resolvedPower.event
      .result as TreasureSwordSpecialPurposePowerResult;

    extraordinaryEvent.children = originalChildren.map((child) => {
      if (child === pendingPurpose) return resolvedPurpose;
      if (child === pendingPower) return resolvedPower;
      return child;
    });

    const compactSummary = toCompactRender(swordNode)
      .filter(
        (node): node is { kind: 'paragraph'; text: string } =>
          node.kind === 'paragraph'
      )
      .map((node) => node.text)
      .join(' ');

    expect(compactSummary).toContain(
      'The character can choose 1 extraordinary power.'
    );
    expect(compactSummary).not.toContain('then roll for a special purpose');
    expect(compactSummary).toContain(
      `Its special purpose is to ${purposeResult.description}.`
    );
    expect(compactSummary).toContain(
      `When that purpose activates, the sword can ${powerResult.description}.`
    );
  });

  it('includes dragon slayer color in detail and compact output when mundane', () => {
    const node = resolveTreasureSwords({
      roll: 63,
      kindRoll: 42,
      unusualRoll: 20,
      dragonSlayerColorRoll: 8,
    });

    if (node.type !== 'event' || node.event.kind !== 'treasureSwords') {
      throw new Error('Expected treasure swords event');
    }

    const detailNodes = renderDetailTree(node);
    const detailBullet = detailNodes.find(
      (child): child is { kind: 'bullet-list'; items: string[] } =>
        child.kind === 'bullet-list'
    );
    expect(detailBullet).toBeDefined();
    expect(detailBullet?.items[0]).toContain('Dragon Slayer [Red]');

    const compactText = toCompactRender(node)
      .filter(
        (child): child is { kind: 'paragraph'; text: string } =>
          child.kind === 'paragraph'
      )
      .map((child) => child.text)
      .join(' ');
    expect(compactText).toContain('Dragon Slayer [Red]');

    const dragonColorEvent = findChildEvent(node, 'treasureSwordUnusual');
    if (!dragonColorEvent || dragonColorEvent.type !== 'event') {
      throw new Error('Expected unusual child');
    }
    const colorChild = findChildEvent(
      dragonColorEvent,
      'treasureSwordDragonSlayerColor'
    );
    if (!colorChild || colorChild.type !== 'event') {
      throw new Error('Expected dragon slayer color event');
    }
    if (colorChild.event.kind !== 'treasureSwordDragonSlayerColor') {
      throw new Error('Unexpected dragon slayer color kind');
    }
    const colorResult = colorChild.event
      .result as TreasureSwordDragonSlayerColorResult;
    expect(colorResult.color).toBe(TreasureSwordDragonSlayerColor.Red);
  });

  it('adapts slay good or evil purposes to the sword alignment', () => {
    expect(
      describeSwordSpecialPurpose(TreasureSwordSpecialPurpose.SlayGoodOrEvil, {
        alignment: TreasureSwordAlignment.ChaoticGood,
      })
    ).toBe('slay neutral or evil');

    const goodAligned = resolveTreasureSwordSpecialPurpose({
      roll: 70,
      alignment: TreasureSwordAlignment.ChaoticGood,
    });

    if (goodAligned.type !== 'event') {
      throw new Error('Expected event node for good alignment');
    }
    if (goodAligned.event.kind !== 'treasureSwordSpecialPurpose') {
      throw new Error('Expected special purpose event');
    }
    expect(goodAligned.event.result.alignment).toBe(
      TreasureSwordAlignment.ChaoticGood
    );
    expect(goodAligned.event.result.description).toBe('slay neutral or evil');

    const evilAligned = resolveTreasureSwordSpecialPurpose({
      roll: 70,
      alignment: TreasureSwordAlignment.LawfulEvil,
    });
    if (evilAligned.type !== 'event') {
      throw new Error('Expected event node for evil alignment');
    }
    if (evilAligned.event.kind !== 'treasureSwordSpecialPurpose') {
      throw new Error('Expected special purpose event');
    }
    expect(evilAligned.event.result.description).toBe('slay good or neutral');

    const neutralAligned = resolveTreasureSwordSpecialPurpose({
      roll: 70,
      alignment: TreasureSwordAlignment.NeutralAbsolute,
    });
    if (neutralAligned.type !== 'event') {
      throw new Error('Expected event node for neutral alignment');
    }
    if (neutralAligned.event.kind !== 'treasureSwordSpecialPurpose') {
      throw new Error('Expected special purpose event');
    }
    expect(neutralAligned.event.result.description).toBe('slay good or evil');
  });

  it('renders special purpose details with alignment-aware text', () => {
    const purposeNode = resolveTreasureSwordSpecialPurpose({
      roll: 4,
      alignment: TreasureSwordAlignment.LawfulGood,
    });

    if (purposeNode.type !== 'event') {
      throw new Error('Expected event node');
    }

    const nodes = renderDetailTree(purposeNode);
    const paragraph = nodes.find((entry) => entry.kind === 'paragraph') as
      | { text?: string }
      | undefined;
    expect(paragraph?.text).toContain('defeat/slay Chaotic Evil');
  });

  it('adds extra abilities when 93-98 is rolled', () => {
    const node = resolveTreasureSwords({
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
    if (!unusualEvent || unusualEvent.event.kind !== 'treasureSwordUnusual') {
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
      {
        roll: 5,
        expected: 'detect "elevator"/shifting rooms/walls in a 1" radius',
      },
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
        slotKey:
          typeof context.slotKey === 'string'
            ? (context.slotKey as string)
            : undefined,
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
    const remainingRestrictedPreviews = collectPreviews(detailNodes).filter(
      (child) => child.id.startsWith('treasureSwordPrimaryAbilityRestricted')
    );
    expect(remainingRestrictedPreviews.length).toBeGreaterThan(0);
  });

  it('records extraordinary powers when rolled on the primary table', () => {
    const node = resolveTreasureSwords({
      roll: 20,
      kindRoll: 12,
      unusualRoll: 100,
      languageRolls: [20],
      primaryAbilityRolls: [100, 34, 45],
      extraordinaryPowerRolls: [42],
    });

    if (node.type !== 'event' || node.event.kind !== 'treasureSwords') {
      throw new Error('Expected treasureSwords event');
    }

    const unusualEvent = (node.children || []).find(
      (child): child is OutcomeEventNode =>
        child.type === 'event' && child.event.kind === 'treasureSwordUnusual'
    );
    if (!unusualEvent || unusualEvent.event.kind !== 'treasureSwordUnusual') {
      throw new Error('Expected unusual event');
    }
    const summaries = summarizePrimaryAbilities(unusualEvent);
    const extraordinary = summaries.find(
      (summary) =>
        summary.extraordinaryPower === TreasureSwordExtraordinaryPower.Heal
    );
    expect(extraordinary).toBeDefined();
    expect(extraordinary?.description).toBe('heal — 1 time/day');
    expect(extraordinary?.count).toBe(1);
  });

  it('counts telepathy, reading, languages, and extraordinary powers in ego', () => {
    const node = resolveTreasureSwords({
      roll: 20,
      kindRoll: 12,
      unusualRoll: 100,
      alignmentRoll: 31,
      languageRolls: [20],
      primaryAbilityRolls: [34, 45, 67],
      extraordinaryPowerRolls: [42],
    });

    if (node.type !== 'event' || node.event.kind !== 'treasureSwords') {
      throw new Error('Expected treasureSwords event');
    }

    expect(computeSwordEgo(node)).toBe(12);

    const compactText = toCompactRender(node)
      .filter(
        (child): child is { kind: 'paragraph'; text: string } =>
          child.kind === 'paragraph'
      )
      .map((child) => child.text)
      .join(' ');
    expect(compactText).toContain('(I17, 1 language, E12)');
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
