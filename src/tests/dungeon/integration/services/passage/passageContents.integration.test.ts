import {
  createFeedSnapshot,
  resolvePendingPreview,
  renderCompact,
  renderDetail,
  listPendingPreviewTargets,
  resolvePreview,
} from '../../../../support/dungeon/uiPreviewHarness';
import type {
  OutcomeEvent,
  OutcomeEventNode,
  PendingRoll,
} from '../../../../../dungeon/domain/outcome';
import { describeChamberRoomContents } from '../../../../../dungeon/adapters/render/chamberRoomContents';
import { collectCharacterPartyMessages } from '../../../../../dungeon/adapters/render/monsters';
import { renderTreasureContainerCompact } from '../../../../../dungeon/adapters/render/treasureContainer';
import { resolveTreasureContainer } from '../../../../../dungeon/domain/resolvers';
import { TreasureMagicCategory } from '../../../../../tables/dungeon/treasureMagic';
import { TreasureWithoutMonster } from '../../../../../tables/dungeon/treasure';
import { TreasurePotion } from '../../../../../tables/dungeon/treasurePotions';

describe('passage contents', () => {
  it('shows empty chamber contents once resolved', () => {
    let feed = createFeedSnapshot({
      action: 'passage',
      roll: 14,
      detailMode: true,
      dungeonLevel: 1,
    });

    feed = resolvePendingPreview(feed, 'chamberDimensions', 5);
    const pendingTargets = listPendingPreviewTargets(feed);
    const pendingBases = pendingTableBases(pendingTargets);
    expect(pendingBases).toContain('chamberRoomContents');

    feed = resolvePendingPreview(feed, 'chamberRoomContents', 1);
    const contentsEvent = findOutcomeEvent(feed.outcome, 'chamberRoomContents');
    expect(contentsEvent).toBeDefined();
    if (contentsEvent) {
      expect(describeChamberRoomContents(contentsEvent)).toContain(
        'The area is empty.'
      );
    }

    const compactText = renderCompact(feed)
      .filter(
        (node): node is { kind: 'paragraph'; text: string } =>
          node.kind === 'paragraph'
      )
      .map((node) => node.text.trim())
      .join(' ');
    expect(compactText).toContain('The area is empty.');
  });

  it('wires monsters into chamber contents', () => {
    let feed = createFeedSnapshot({
      action: 'passage',
      roll: 14,
      detailMode: true,
      dungeonLevel: 1,
    });

    feed = resolvePendingPreview(feed, 'chamberDimensions', 5);
    let pendingTargets = listPendingPreviewTargets(feed);
    let pendingBases = pendingTableBases(pendingTargets);
    expect(pendingBases).toContain('chamberRoomContents');

    feed = resolvePendingPreview(feed, 'chamberRoomContents', 13);

    pendingTargets = listPendingPreviewTargets(feed);
    pendingBases = pendingTableBases(pendingTargets);
    expect(pendingBases).toContain('monsterLevel');

    feed = resolvePendingPreview(feed, 'monsterLevel', 3);

    pendingTargets = listPendingPreviewTargets(feed);
    pendingBases = pendingTableBases(pendingTargets);
    expect(pendingBases).not.toContain('monsterLevel');
    const monsterTableBase = pendingBases.find(
      (base) => base.startsWith('monster') && base !== 'monsterLevel'
    );
    expect(monsterTableBase).toBeDefined();

    if (monsterTableBase) {
      feed = resolvePendingPreview(feed, monsterTableBase, 40);
    }

    const humanTargets = listPendingPreviewTargets(feed).filter((target) =>
      target.includes('human')
    );
    if (humanTargets.length > 0) {
      const humanTarget = humanTargets[0];
      if (humanTarget) {
        feed = resolvePreview(feed, humanTarget, 90);
      }
    }

    const compactNodes = renderCompact(feed);
    const compactParagraphs = compactNodes
      .filter(
        (node): node is { kind: 'paragraph'; text: string } =>
          node.kind === 'paragraph'
      )
      .map((node) => node.text.trim().toLowerCase());
    expect(compactParagraphs.join(' ')).toContain('a monster is present');
    expect(compactNodes.some((node) => node.kind === 'character-party')).toBe(
      true
    );
    const contentsEvent = findOutcomeEvent(feed.outcome, 'chamberRoomContents');
    expect(contentsEvent).toBeDefined();
    if (contentsEvent) {
      const partyMessages = collectCharacterPartyMessages(
        contentsEvent,
        'compact'
      );
      expect(partyMessages.length).toBeGreaterThan(0);
      const detailText = describeChamberRoomContents(contentsEvent);
      expect(detailText).toContain('A monster is present.');
    }
  });

  it('describes special stair results in contents summary', () => {
    let feed = createFeedSnapshot({
      action: 'passage',
      roll: 14,
      detailMode: true,
      dungeonLevel: 1,
    });

    feed = resolvePendingPreview(feed, 'chamberDimensions', 5);
    let pendingTargets = listPendingPreviewTargets(feed);
    let pendingBases = pendingTableBases(pendingTargets);
    expect(pendingBases).toContain('chamberRoomContents');

    feed = resolvePendingPreview(feed, 'chamberRoomContents', 18);

    pendingTargets = listPendingPreviewTargets(feed);
    pendingBases = pendingTableBases(pendingTargets);
    expect(pendingBases).toContain('chamberRoomStairs');

    feed = resolvePendingPreview(feed, 'chamberRoomStairs', 20);

    const compactText = renderCompact(feed)
      .filter(
        (node): node is { kind: 'paragraph'; text: string } =>
          node.kind === 'paragraph'
      )
      .map((node) => node.text.trim())
      .join(' ');
    expect(compactText).toContain(
      'Special, or Stairway leading down three levels — two flights of stairs and a slanting passageway.'
    );
    const contentsEvent = findOutcomeEvent(feed.outcome, 'chamberRoomContents');
    expect(contentsEvent).toBeDefined();
    if (contentsEvent) {
      expect(describeChamberRoomContents(contentsEvent)).toContain(
        'Stairway leading down three levels'
      );
    }
  });

  it('describes trick or trap results in contents summary', () => {
    let feed = createFeedSnapshot({
      action: 'passage',
      roll: 14,
      detailMode: true,
      dungeonLevel: 1,
    });

    feed = resolvePendingPreview(feed, 'chamberDimensions', 5);
    let pendingTargets = listPendingPreviewTargets(feed);
    let pendingBases = pendingTableBases(pendingTargets);
    expect(pendingBases).toContain('chamberRoomContents');

    feed = resolvePendingPreview(feed, 'chamberRoomContents', 19);

    pendingTargets = listPendingPreviewTargets(feed);
    pendingBases = pendingTableBases(pendingTargets);
    expect(pendingBases).toContain('trickTrap');

    feed = resolvePendingPreview(feed, 'trickTrap', 6);

    const compactText = renderCompact(feed)
      .filter(
        (node): node is { kind: 'paragraph'; text: string } =>
          node.kind === 'paragraph'
      )
      .map((node) => node.text.trim())
      .join(' ')
      .toLowerCase();
    expect(compactText).toContain("pit, 10' deep");

    const contentsEvent = findOutcomeEvent(feed.outcome, 'chamberRoomContents');
    expect(contentsEvent).toBeDefined();
    if (contentsEvent) {
      const detail = describeChamberRoomContents(contentsEvent).toLowerCase();
      expect(detail).toContain("pit, 10' deep");
    }
  });

  it('wires treasure-only results into contents', () => {
    let feed = createFeedSnapshot({
      action: 'passage',
      roll: 14,
      detailMode: true,
      dungeonLevel: 3,
    });

    feed = resolvePendingPreview(feed, 'chamberDimensions', 5);
    feed = resolvePendingPreview(feed, 'chamberRoomContents', 20);

    const treasurePending = findPendingRoll(feed.outcome, 'treasure');
    expect(treasurePending).toBeDefined();
    expect(treasurePending?.context).toEqual(
      expect.objectContaining({
        kind: 'treasure',
        level: 3,
        withMonster: false,
        rollIndex: 1,
        totalRolls: 1,
      })
    );

    const pendingBases = pendingTableBases(listPendingPreviewTargets(feed));
    expect(pendingBases).toContain('treasure');

    feed = resolvePendingPreview(feed, 'treasure', 80);

    const containerTargets = listPendingPreviewTargets(feed).filter((target) =>
      (target.split('.').pop() ?? '').startsWith('treasureContainer')
    );
    expect(containerTargets).toHaveLength(1);
    const firstContainerTarget = containerTargets[0];
    if (!firstContainerTarget) throw new Error('missing container target');

    feed = resolvePreview(feed, firstContainerTarget, 6);

    const protectionTargets = listPendingPreviewTargets(feed).filter((target) =>
      (target.split('.').pop() ?? '').startsWith('treasureProtectionType')
    );
    expect(protectionTargets).toHaveLength(1);
    const protectionTarget = protectionTargets[0];
    if (!protectionTarget) throw new Error('missing protection target');

    feed = resolvePreview(feed, protectionTarget, 12);

    const hiddenTargets = listPendingPreviewTargets(feed).filter((target) =>
      (target.split('.').pop() ?? '').startsWith('treasureProtectionHiddenBy')
    );
    expect(hiddenTargets).toHaveLength(1);
    const hiddenTarget = hiddenTargets[0];
    if (!hiddenTarget) throw new Error('missing hidden protection target');
    feed = resolvePreview(feed, hiddenTarget, 11);

    const treasureEvent = findOutcomeEvent(feed.outcome, 'treasure');
    expect(treasureEvent).toBeDefined();
    if (treasureEvent && treasureEvent.event.kind === 'treasure') {
      expect(treasureEvent.event.entries).toHaveLength(1);
      expect(treasureEvent.event.entries[0]?.command).toBe(
        TreasureWithoutMonster.GoldPerLevel
      );
      expect(treasureEvent.event.level).toBe(3);
    }

    const compactText = renderCompact(feed)
      .filter(
        (node): node is { kind: 'paragraph'; text: string } =>
          node.kind === 'paragraph'
      )
      .map((node) => node.text.trim())
      .join(' ')
      .toLowerCase();
    expect(compactText).toContain('750 gold pieces');
    expect(compactText).toContain('contained in small coffers');
    expect(compactText).toContain(
      'if desired, the treasure is hidden under a heap of trash or dung.'
    );
  });

  it('queues magical treasure category rolls', () => {
    let feed = createFeedSnapshot({
      action: 'passage',
      roll: 14,
      detailMode: true,
      dungeonLevel: 3,
    });

    feed = resolvePendingPreview(feed, 'chamberDimensions', 5);
    feed = resolvePendingPreview(feed, 'chamberRoomContents', 20);

    feed = resolvePendingPreview(feed, 'treasure', 99);

    const pendingAfterMagic = pendingTableBases(
      listPendingPreviewTargets(feed)
    );
    expect(pendingAfterMagic).toContain('treasureMagicCategory');

    const magicTargets = listPendingPreviewTargets(feed).filter((target) =>
      (target.split('.').pop() ?? '').startsWith('treasureMagicCategory')
    );
    expect(magicTargets).toHaveLength(1);
    const magicTarget = magicTargets[0];
    if (!magicTarget) throw new Error('missing treasure magic target');

    feed = resolvePreview(feed, magicTarget, 44);

    const treasureEvent = findOutcomeEvent(feed.outcome, 'treasure');
    expect(treasureEvent).toBeDefined();
    if (treasureEvent && treasureEvent.event.kind === 'treasure') {
      expect(treasureEvent.event.entries[0]?.command).toBe(
        TreasureWithoutMonster.Magic
      );
    }

    const magicEvent = findOutcomeEvent(feed.outcome, 'treasureMagicCategory');
    expect(magicEvent).toBeDefined();
    if (magicEvent && magicEvent.event.kind === 'treasureMagicCategory') {
      expect(magicEvent.event.result).toBe(
        TreasureMagicCategory.RodsStavesWands
      );
    }

    const containerTargets = listPendingPreviewTargets(feed).filter((target) =>
      (target.split('.').pop() ?? '').startsWith('treasureContainer')
    );
    expect(containerTargets).toHaveLength(1);
    const containerTarget = containerTargets[0];
    if (!containerTarget) throw new Error('missing container target');
    feed = resolvePreview(feed, containerTarget, 7);

    const protectionTargets = listPendingPreviewTargets(feed).filter((target) =>
      (target.split('.').pop() ?? '').startsWith('treasureProtectionType')
    );
    expect(protectionTargets).toHaveLength(1);
    const protectionTarget = protectionTargets[0];
    if (!protectionTarget) throw new Error('missing protection target');
    feed = resolvePreview(feed, protectionTarget, 18);

    const guardedTargets = listPendingPreviewTargets(feed).filter((target) =>
      (target.split('.').pop() ?? '').startsWith('treasureProtectionHiddenBy')
    );
    expect(guardedTargets).toHaveLength(1);
    const hiddenTarget = guardedTargets[0];
    if (!hiddenTarget) throw new Error('missing hidden protection target');
    feed = resolvePreview(feed, hiddenTarget, 14);

    const contentsEvent = findOutcomeEvent(feed.outcome, 'chamberRoomContents');
    expect(contentsEvent).toBeDefined();
    if (contentsEvent) {
      const detail = describeChamberRoomContents(contentsEvent).toLowerCase();
      expect(detail).toContain('there is magical treasure');
    }

    const compactParagraphs = renderCompact(feed)
      .filter(
        (node): node is { kind: 'paragraph'; text: string } =>
          node.kind === 'paragraph'
      )
      .map((node) => node.text.trim().toLowerCase())
      .join(' ');
    expect(compactParagraphs).toContain('there is magical treasure');
    const detailNodes = renderDetail(feed)
      .filter(
        (node): node is { kind: 'paragraph'; text: string } =>
          node.kind === 'paragraph'
      )
      .map((node) => node.text.trim().toLowerCase());
    expect(detailNodes).toContain(
      'roll on table d to determine the rod, staff, or wand.'
    );
  });

  it('resolves potions from magical treasure', () => {
    let feed = createFeedSnapshot({
      action: 'passage',
      roll: 14,
      detailMode: true,
      dungeonLevel: 4,
    });

    feed = resolvePendingPreview(feed, 'chamberDimensions', 5);
    feed = resolvePendingPreview(feed, 'chamberRoomContents', 20);

    feed = resolvePendingPreview(feed, 'treasure', 99);

    const magicTargets = listPendingPreviewTargets(feed).filter((target) =>
      (target.split('.').pop() ?? '').startsWith('treasureMagicCategory')
    );
    expect(magicTargets).toHaveLength(1);
    const potionCategoryTarget = magicTargets[0];
    if (!potionCategoryTarget)
      throw new Error('missing potion category target');
    feed = resolvePreview(feed, potionCategoryTarget, 2);

    const potionTargets = listPendingPreviewTargets(feed).filter((target) =>
      (target.split('.').pop() ?? '').startsWith('treasurePotion')
    );
    expect(potionTargets).toHaveLength(1);
    const potionTarget = potionTargets[0];
    if (!potionTarget) throw new Error('missing potion target');
    feed = resolvePreview(feed, potionTarget, 2);

    const potionEvent = findOutcomeEvent(feed.outcome, 'treasurePotion');
    expect(potionEvent).toBeDefined();
    if (potionEvent && potionEvent.event.kind === 'treasurePotion') {
      expect(potionEvent.event.result).toBe(TreasurePotion.AnimalControl);
    }

    const animalTargets = listPendingPreviewTargets(feed).filter((target) =>
      (target.split('.').pop() ?? '').startsWith('treasurePotionAnimalControl')
    );
    expect(animalTargets).toHaveLength(1);
    const animalTarget = animalTargets[0];
    if (!animalTarget) throw new Error('missing animal control target');
    feed = resolvePreview(feed, animalTarget, 3);

    const detailNodes = renderDetail(feed)
      .filter(
        (node): node is { kind: 'paragraph'; text: string } =>
          node.kind === 'paragraph'
      )
      .map((node) => node.text.trim().toLowerCase());
    expect(detailNodes).toContain(
      'there is a potion of mammal/marsupial control.'
    );

    const compactText = renderCompact(feed)
      .filter(
        (node): node is { kind: 'paragraph'; text: string } =>
          node.kind === 'paragraph'
      )
      .map((node) => node.text.trim().toLowerCase())
      .join(' ');
    expect(compactText).toContain(
      'there is a potion of mammal/marsupial control.'
    );
  });

  it('resolves dragon control potions with subtype detail', () => {
    let feed = createFeedSnapshot({
      action: 'passage',
      roll: 14,
      detailMode: true,
      dungeonLevel: 5,
    });

    feed = resolvePendingPreview(feed, 'chamberDimensions', 5);
    feed = resolvePendingPreview(feed, 'chamberRoomContents', 20);

    feed = resolvePendingPreview(feed, 'treasure', 99);

    const magicTargets = listPendingPreviewTargets(feed).filter((target) =>
      (target.split('.').pop() ?? '').startsWith('treasureMagicCategory')
    );
    expect(magicTargets).toHaveLength(1);
    const categoryTarget = magicTargets[0];
    if (!categoryTarget) throw new Error('missing potion category target');
    feed = resolvePreview(feed, categoryTarget, 5);

    const potionTargets = listPendingPreviewTargets(feed).filter((target) =>
      (target.split('.').pop() ?? '').startsWith('treasurePotion')
    );
    expect(potionTargets).toHaveLength(1);
    const potionTarget = potionTargets[0];
    if (!potionTarget) throw new Error('missing potion target');
    feed = resolvePreview(feed, potionTarget, 19);

    const dragonTargets = listPendingPreviewTargets(feed).filter((target) =>
      (target.split('.').pop() ?? '').startsWith('treasurePotionDragonControl')
    );
    expect(dragonTargets).toHaveLength(1);
    const dragonTarget = dragonTargets[0];
    if (!dragonTarget) throw new Error('missing dragon control target');
    feed = resolvePreview(feed, dragonTarget, 9);

    const detailText = renderDetail(feed)
      .filter(
        (node): node is { kind: 'paragraph'; text: string } =>
          node.kind === 'paragraph'
      )
      .map((node) => node.text.trim().toLowerCase())
      .join(' ');
    expect(detailText).toContain('there is a potion of blue dragon control.');

    const compactText = renderCompact(feed)
      .filter(
        (node): node is { kind: 'paragraph'; text: string } =>
          node.kind === 'paragraph'
      )
      .map((node) => node.text.trim().toLowerCase())
      .join(' ');
    expect(compactText).toContain('there is a potion of blue dragon control.');
  });

  it('resolves giant control potions with subtype detail', () => {
    let feed = createFeedSnapshot({
      action: 'passage',
      roll: 14,
      detailMode: true,
      dungeonLevel: 5,
    });

    feed = resolvePendingPreview(feed, 'chamberDimensions', 5);
    feed = resolvePendingPreview(feed, 'chamberRoomContents', 20);

    feed = resolvePendingPreview(feed, 'treasure', 99);

    const magicTargets = listPendingPreviewTargets(feed).filter((target) =>
      (target.split('.').pop() ?? '').startsWith('treasureMagicCategory')
    );
    expect(magicTargets).toHaveLength(1);
    const categoryTarget = magicTargets[0];
    if (!categoryTarget) throw new Error('missing potion category target');
    feed = resolvePreview(feed, categoryTarget, 5);

    const potionTargets = listPendingPreviewTargets(feed).filter((target) =>
      (target.split('.').pop() ?? '').startsWith('treasurePotion')
    );
    expect(potionTargets).toHaveLength(1);
    const potionTarget = potionTargets[0];
    if (!potionTarget) throw new Error('missing potion target');
    feed = resolvePreview(feed, potionTarget, 35);

    const giantTargets = listPendingPreviewTargets(feed).filter((target) =>
      (target.split('.').pop() ?? '').startsWith('treasurePotionGiantControl')
    );
    expect(giantTargets).toHaveLength(1);
    const giantTarget = giantTargets[0];
    if (!giantTarget) throw new Error('missing giant control target');
    feed = resolvePreview(feed, giantTarget, 8);

    const detailText = renderDetail(feed)
      .filter(
        (node): node is { kind: 'paragraph'; text: string } =>
          node.kind === 'paragraph'
      )
      .map((node) => node.text.trim().toLowerCase())
      .join(' ');
    expect(detailText).toContain('there is a potion of stone giant control.');

    const compactText = renderCompact(feed)
      .filter(
        (node): node is { kind: 'paragraph'; text: string } =>
          node.kind === 'paragraph'
      )
      .map((node) => node.text.trim().toLowerCase())
      .join(' ');
    expect(compactText).toContain('there is a potion of stone giant control.');
  });

  it('rolls treasure twice when monsters guard it', () => {
    let feed = createFeedSnapshot({
      action: 'passage',
      roll: 14,
      detailMode: true,
      dungeonLevel: 2,
    });

    feed = resolvePendingPreview(feed, 'chamberDimensions', 5);
    feed = resolvePendingPreview(feed, 'chamberRoomContents', 15);

    const treasurePending = findPendingRoll(feed.outcome, 'treasure');
    expect(treasurePending).toBeDefined();
    expect(treasurePending?.context).toEqual(
      expect.objectContaining({
        kind: 'treasure',
        withMonster: true,
        rollIndex: 1,
        totalRolls: 2,
      })
    );

    const pendingTargets = listPendingPreviewTargets(feed);
    const treasureTargets = pendingTargets.filter((target) =>
      (target.split('.').pop() ?? '').startsWith('treasure')
    );
    expect(treasureTargets).toHaveLength(2);

    feed = resolvePendingPreview(feed, 'treasure', 30);

    let containerTargets = listPendingPreviewTargets(feed).filter((target) =>
      (target.split('.').pop() ?? '').startsWith('treasureContainer')
    );
    expect(containerTargets).toHaveLength(1);
    const firstMonsterContainer = containerTargets[0];
    if (!firstMonsterContainer) throw new Error('missing monster container');
    feed = resolvePreview(feed, firstMonsterContainer, 19);

    let protectionTargets = listPendingPreviewTargets(feed).filter((target) =>
      (target.split('.').pop() ?? '').startsWith('treasureProtectionType')
    );
    expect(protectionTargets).toHaveLength(1);
    const firstProtectionTarget = protectionTargets[0];
    if (!firstProtectionTarget)
      throw new Error('missing first treasure protection target');
    feed = resolvePreview(feed, firstProtectionTarget, 4);

    let guardedTargets = listPendingPreviewTargets(feed).filter((target) =>
      (target.split('.').pop() ?? '').startsWith('treasureProtectionGuardedBy')
    );
    expect(guardedTargets).toHaveLength(1);
    const guardedTarget = guardedTargets[0];
    if (!guardedTarget) throw new Error('missing guarded protection target');
    feed = resolvePreview(feed, guardedTarget, 18);

    feed = resolvePendingPreview(feed, 'treasure', 97);

    containerTargets = listPendingPreviewTargets(feed).filter((target) =>
      (target.split('.').pop() ?? '').startsWith('treasureContainer')
    );
    expect(containerTargets).toHaveLength(1);
    const secondMonsterContainer = containerTargets[0];
    if (!secondMonsterContainer)
      throw new Error('missing second monster container');
    feed = resolvePreview(feed, secondMonsterContainer, 4);

    protectionTargets = listPendingPreviewTargets(feed).filter((target) =>
      (target.split('.').pop() ?? '').startsWith('treasureProtectionType')
    );
    expect(protectionTargets).toHaveLength(1);
    const secondProtectionTarget = protectionTargets[0];
    if (!secondProtectionTarget)
      throw new Error('missing second treasure protection target');
    feed = resolvePreview(feed, secondProtectionTarget, 15);

    guardedTargets = listPendingPreviewTargets(feed).filter((target) =>
      (target.split('.').pop() ?? '').startsWith('treasureProtectionHiddenBy')
    );
    expect(guardedTargets).toHaveLength(1);
    const hiddenProtectionTarget = guardedTargets[0];
    if (!hiddenProtectionTarget)
      throw new Error('missing hidden protection target');
    feed = resolvePreview(feed, hiddenProtectionTarget, 14);

    const treasureEvents = findOutcomeEvents(feed.outcome, 'treasure');
    const treasureNodes = treasureEvents.filter(
      (
        event
      ): event is OutcomeEventNode & {
        event: Extract<OutcomeEvent, { kind: 'treasure' }>;
      } => event.event.kind === 'treasure'
    );
    const treasureWithMonster = treasureNodes.filter(
      (event) => event.event.withMonster
    );
    expect(treasureWithMonster).toHaveLength(2);
    const [first, second] = treasureWithMonster;
    expect(first?.event.entries).toHaveLength(1);
    expect(second?.event.entries).toHaveLength(1);
    expect(first?.event.entries[0]?.command).toBe(
      TreasureWithoutMonster.SilverPerLevel
    );
    expect(second?.event.entries[0]?.command).toBe(
      TreasureWithoutMonster.Magic
    );
    expect(first?.event.rollIndex).toBe(1);
    expect(second?.event.rollIndex).toBe(2);

    const compactText = renderCompact(feed)
      .filter(
        (node): node is { kind: 'paragraph'; text: string } =>
          node.kind === 'paragraph'
      )
      .map((node) => node.text.trim().toLowerCase())
      .join(' ');
    expect(compactText).toContain('2,000 silver pieces');
    expect(compactText).toContain('there is magical treasure.');
    expect(compactText).toContain('contained in sacks');
    expect(compactText).toContain(
      'if desired, the treasure is guarded by spears released from the walls when the container is opened.'
    );
    expect(compactText).toContain(
      'if desired, the treasure is hidden behind a loose stone in the wall.'
    );
    expect(compactText).not.toContain('contained in loose');
  });

  it('omits container text when treasure is loose', () => {
    const node = resolveTreasureContainer({ roll: 19 }) as OutcomeEventNode;
    const compactNodes = renderTreasureContainerCompact(node);
    expect(compactNodes).toHaveLength(0);
  });
});

function findOutcomeEvent(
  node: OutcomeEventNode | undefined,
  kind: OutcomeEventNode['event']['kind']
): OutcomeEventNode | undefined {
  if (!node || node.type !== 'event') return undefined;
  if (node.event.kind === kind) return node;
  if (node.children) {
    for (const child of node.children) {
      if (child.type === 'event') {
        const candidate = findOutcomeEvent(child, kind);
        if (candidate) return candidate;
      }
    }
  }
  return undefined;
}

function findOutcomeEvents(
  node: OutcomeEventNode | undefined,
  kind: OutcomeEventNode['event']['kind']
): OutcomeEventNode[] {
  if (!node || node.type !== 'event') return [];
  const results: OutcomeEventNode[] = [];
  const visit = (current: OutcomeEventNode | undefined): void => {
    if (!current || current.type !== 'event') return;
    if (current.event.kind === kind) {
      results.push(current);
    }
    current.children?.forEach((child) => {
      if (child.type === 'event') visit(child);
    });
  };
  visit(node);
  return results;
}

function pendingTableBases(targets: string[]): string[] {
  return targets.map((id) => {
    const lastSegment = id.split('.').pop() ?? id;
    const [base] = lastSegment.split(':');
    return base ?? '';
  });
}

function findPendingRoll(
  node: OutcomeEventNode | PendingRoll | undefined,
  table: string
): PendingRoll | undefined {
  if (!node) return undefined;
  if (node.type === 'pending-roll') {
    return node.table.split(':')[0] === table ? node : undefined;
  }
  if (!node.children) return undefined;
  for (const child of node.children) {
    if (child.type === 'pending-roll') {
      if (child.table.split(':')[0] === table) return child;
    } else {
      const found = findPendingRoll(child, table);
      if (found) return found;
    }
  }
  return undefined;
}
