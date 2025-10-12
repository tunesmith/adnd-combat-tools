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
import { TreasureScroll } from '../../../../../tables/dungeon/treasureScrolls';
import { TreasureMiscMagicE1 } from '../../../../../tables/dungeon/treasureMiscMagicE1';
import { TreasureBagOfHolding } from '../../../../../tables/dungeon/treasureBagOfHolding';
import { TreasureBracersOfDefense } from '../../../../../tables/dungeon/treasureBracersOfDefense';
import { TreasureBucknardsEverfullPurse } from '../../../../../tables/dungeon/treasureBucknardsEverfullPurse';
import { TreasureArtifactOrRelic } from '../../../../../tables/dungeon/treasureArtifactOrRelic';
import { TreasureCrystalBall } from '../../../../../tables/dungeon/treasureCrystalBall';
import { TreasureDeckOfManyThings } from '../../../../../tables/dungeon/treasureDeckOfManyThings';
import { TreasureMiscMagicE3 } from '../../../../../tables/dungeon/treasureMiscMagicE3';
import { TreasureFigurineOfWondrousPower } from '../../../../../tables/dungeon/treasureFigurineOfWondrousPower';
import { TreasureFigurineMarbleElephant } from '../../../../../tables/dungeon/treasureFigurineMarbleElephant';
import { TreasureGirdleOfGiantStrength } from '../../../../../tables/dungeon/treasureGirdleOfGiantStrength';
import { TreasureHornOfValhallaType } from '../../../../../tables/dungeon/treasureHornOfValhallaType';
import { TreasureHornOfValhallaAttunement } from '../../../../../tables/dungeon/treasureHornOfValhallaAttunement';
import { TreasureHornOfValhallaAlignment } from '../../../../../tables/dungeon/treasureHornOfValhallaAlignment';
import { TreasureEyesOfPetrification } from '../../../../../tables/dungeon/treasureEyesOfPetrification';
import * as dungeonLookup from '../../../../../dungeon/helpers/dungeonLookup';

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

  it('resolves miscellaneous magic (E.1) items from magical treasure', () => {
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
    const miscCategoryTarget = magicTargets[0];
    if (!miscCategoryTarget)
      throw new Error('missing miscellaneous magic category target');
    feed = resolvePreview(feed, miscCategoryTarget, 47);

    const miscTargets = listPendingPreviewTargets(feed).filter((target) =>
      (target.split('.').pop() ?? '').startsWith('treasureMiscMagicE1')
    );
    expect(miscTargets).toHaveLength(1);
    const miscTarget = miscTargets[0];
    if (!miscTarget) throw new Error('missing miscellaneous magic target');
    feed = resolvePreview(feed, miscTarget, 36);

    const miscEvent = findOutcomeEvent(feed.outcome, 'treasureMiscMagicE1');
    expect(miscEvent).toBeDefined();
    if (miscEvent && miscEvent.event.kind === 'treasureMiscMagicE1') {
      expect(miscEvent.event.result).toBe(TreasureMiscMagicE1.BootsOfDancing);
    }

    const detailText = renderDetail(feed)
      .filter(
        (node): node is { kind: 'paragraph'; text: string } =>
          node.kind === 'paragraph'
      )
      .map((node) => node.text.trim().toLowerCase())
      .join(' ');
    expect(detailText).toContain('there is a pair of boots of dancing.');

    const compactText = renderCompact(feed)
      .filter(
        (node): node is { kind: 'paragraph'; text: string } =>
          node.kind === 'paragraph'
      )
      .map((node) => node.text.trim().toLowerCase())
      .join(' ');
    expect(compactText).toContain('there is a pair of boots of dancing.');
  });

  it('resolves bag of holding capacities from miscellaneous magic', () => {
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
    const miscCategoryTarget = magicTargets[0];
    if (!miscCategoryTarget)
      throw new Error('missing miscellaneous magic category target');
    feed = resolvePreview(feed, miscCategoryTarget, 46);

    const miscTargets = listPendingPreviewTargets(feed).filter((target) =>
      (target.split('.').pop() ?? '').startsWith('treasureMiscMagicE1')
    );
    expect(miscTargets).toHaveLength(1);
    const miscTarget = miscTargets[0];
    if (!miscTarget) throw new Error('missing miscellaneous magic target');
    feed = resolvePreview(feed, miscTarget, 24);

    const bagTargets = listPendingPreviewTargets(feed).filter((target) =>
      (target.split('.').pop() ?? '').startsWith('treasureBagOfHolding')
    );
    expect(bagTargets).toHaveLength(1);
    const bagTarget = bagTargets[0];
    if (!bagTarget) throw new Error('missing bag of holding target');
    feed = resolvePreview(feed, bagTarget, 95);

    const bagEvent = findOutcomeEvent(feed.outcome, 'treasureBagOfHolding');
    expect(bagEvent).toBeDefined();
    if (bagEvent && bagEvent.event.kind === 'treasureBagOfHolding') {
      expect(bagEvent.event.result).toBe(TreasureBagOfHolding.TypeIV);
    }

    const detailText = renderDetail(feed)
      .filter(
        (node): node is { kind: 'paragraph'; text: string } =>
          node.kind === 'paragraph'
      )
      .map((node) => node.text.trim().toLowerCase())
      .join(' ');
    expect(detailText).toContain(
      'there is a bag of holding (250 cu. ft., 1,500 lb capacity; bag weight 60 lb).'
    );

    const compactText = renderCompact(feed)
      .filter(
        (node): node is { kind: 'paragraph'; text: string } =>
          node.kind === 'paragraph'
      )
      .map((node) => node.text.trim().toLowerCase())
      .join(' ');
    expect(compactText).toContain(
      'there is a bag of holding (250 cu. ft., 1,500 lb capacity; bag weight 60 lb).'
    );
  });

  it('resolves bag of tricks types from miscellaneous magic', () => {
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
    const miscCategoryTarget = magicTargets[0];
    if (!miscCategoryTarget)
      throw new Error('missing miscellaneous magic category target');
    feed = resolvePreview(feed, miscCategoryTarget, 46);

    const miscTargets = listPendingPreviewTargets(feed).filter((target) =>
      (target.split('.').pop() ?? '').startsWith('treasureMiscMagicE1')
    );
    expect(miscTargets).toHaveLength(1);
    const miscTarget = miscTargets[0];
    if (!miscTarget) throw new Error('missing miscellaneous magic target');
    feed = resolvePreview(feed, miscTarget, 28);

    const bagTargets = listPendingPreviewTargets(feed).filter((target) =>
      (target.split('.').pop() ?? '').startsWith('treasureBagOfTricks')
    );
    expect(bagTargets).toHaveLength(1);
    const bagTarget = bagTargets[0];
    if (!bagTarget) throw new Error('missing bag of tricks target');
    feed = resolvePreview(feed, bagTarget, 9);

    const detailText = renderDetail(feed)
      .filter(
        (node): node is { kind: 'paragraph'; text: string } =>
          node.kind === 'paragraph'
      )
      .map((node) => node.text.trim().toLowerCase())
      .join(' ');
    expect(detailText).toContain('there is a bag of tricks, "jackal".');

    const compactText = renderCompact(feed)
      .filter(
        (node): node is { kind: 'paragraph'; text: string } =>
          node.kind === 'paragraph'
      )
      .map((node) => node.text.trim().toLowerCase())
      .join(' ');
    expect(compactText).toContain('there is a bag of tricks, "jackal".');
  });

  it('resolves bracers of defense from miscellaneous magic', () => {
    let feed = createFeedSnapshot({
      action: 'passage',
      roll: 14,
      detailMode: true,
      dungeonLevel: 4,
    });

    feed = resolvePendingPreview(feed, 'chamberDimensions', 5);
    feed = resolvePendingPreview(feed, 'chamberRoomContents', 20);
    feed = resolvePendingPreview(feed, 'treasure', 98);

    const categoryTargets = listPendingPreviewTargets(feed).filter((target) =>
      (target.split('.').pop() ?? '').startsWith('treasureMagicCategory')
    );
    expect(categoryTargets).toHaveLength(1);
    const categoryTarget = categoryTargets[0];
    if (!categoryTarget) throw new Error('missing magic category target');
    feed = resolvePreview(feed, categoryTarget, 46);

    const miscTargets = listPendingPreviewTargets(feed).filter((target) =>
      (target.split('.').pop() ?? '').startsWith('treasureMiscMagicE1')
    );
    expect(miscTargets).toHaveLength(1);
    const miscTarget = miscTargets[0];
    if (!miscTarget) throw new Error('missing misc magic target');
    feed = resolvePreview(feed, miscTarget, 60);

    const bracerTargets = listPendingPreviewTargets(feed).filter((target) =>
      (target.split('.').pop() ?? '').startsWith('treasureBracersOfDefense')
    );
    expect(bracerTargets).toHaveLength(1);
    const bracerTarget = bracerTargets[0];
    if (!bracerTarget) throw new Error('missing bracers target');
    feed = resolvePreview(feed, bracerTarget, 60);

    const bracersEvent = findOutcomeEvent(
      feed.outcome,
      'treasureBracersOfDefense'
    );
    expect(bracersEvent).toBeDefined();
    if (
      !bracersEvent ||
      bracersEvent.event.kind !== 'treasureBracersOfDefense'
    ) {
      throw new Error('bracers event not found');
    }
    expect(bracersEvent.event.result).toBe(TreasureBracersOfDefense.AC4);

    const detailText = renderDetail(feed)
      .filter(
        (node): node is { kind: 'paragraph'; text: string } =>
          node.kind === 'paragraph'
      )
      .map((node) => node.text.trim().toLowerCase())
      .join(' ');
    expect(detailText).toContain('pair of bracers of defense ac4.');

    const compactText = renderCompact(feed)
      .filter(
        (node): node is { kind: 'paragraph'; text: string } =>
          node.kind === 'paragraph'
      )
      .map((node) => node.text.trim().toLowerCase())
      .join(' ');
    expect(compactText).toContain('pair of bracers of defense ac4.');
  });

  it("resolves Bucknard's everfull purse from miscellaneous magic", () => {
    let feed = createFeedSnapshot({
      action: 'passage',
      roll: 14,
      detailMode: true,
      dungeonLevel: 4,
    });

    feed = resolvePendingPreview(feed, 'chamberDimensions', 5);
    feed = resolvePendingPreview(feed, 'chamberRoomContents', 20);
    feed = resolvePendingPreview(feed, 'treasure', 98);

    const categoryTargets = listPendingPreviewTargets(feed).filter((target) =>
      (target.split('.').pop() ?? '').startsWith('treasureMagicCategory')
    );
    expect(categoryTargets).toHaveLength(1);
    const categoryTarget = categoryTargets[0];
    if (!categoryTarget) throw new Error('missing magic category target');
    feed = resolvePreview(feed, categoryTarget, 46);

    const miscTargets = listPendingPreviewTargets(feed).filter((target) =>
      (target.split('.').pop() ?? '').startsWith('treasureMiscMagicE1')
    );
    expect(miscTargets).toHaveLength(1);
    const miscTarget = miscTargets[0];
    if (!miscTarget) throw new Error('missing misc magic target');
    feed = resolvePreview(feed, miscTarget, 99);

    const purseTargets = listPendingPreviewTargets(feed).filter((target) =>
      (target.split('.').pop() ?? '').startsWith(
        'treasureBucknardsEverfullPurse'
      )
    );
    expect(purseTargets).toHaveLength(1);
    const purseTarget = purseTargets[0];
    if (!purseTarget) throw new Error('missing purse target');
    feed = resolvePreview(feed, purseTarget, 55);

    const purseEvent = findOutcomeEvent(
      feed.outcome,
      'treasureBucknardsEverfullPurse'
    );
    expect(purseEvent).toBeDefined();
    if (
      !purseEvent ||
      purseEvent.event.kind !== 'treasureBucknardsEverfullPurse'
    ) {
      throw new Error('purse event not found');
    }
    expect(purseEvent.event.result).toBe(
      TreasureBucknardsEverfullPurse.Platinum
    );

    const detailText = renderDetail(feed)
      .filter(
        (node): node is { kind: 'paragraph'; text: string } =>
          node.kind === 'paragraph'
      )
      .map((node) => node.text.trim().toLowerCase())
      .join(' ');
    expect(detailText).toContain(
      "bucknard's everfull purse of platinum is here."
    );

    const compactText = renderCompact(feed)
      .filter(
        (node): node is { kind: 'paragraph'; text: string } =>
          node.kind === 'paragraph'
      )
      .map((node) => node.text.trim().toLowerCase())
      .join(' ');
    expect(compactText).toContain(
      "bucknard's everfull purse of platinum is here."
    );
  });

  it('resolves artifacts or relics from miscellaneous magic', () => {
    let feed = createFeedSnapshot({
      action: 'passage',
      roll: 14,
      detailMode: true,
      dungeonLevel: 4,
    });

    feed = resolvePendingPreview(feed, 'chamberDimensions', 5);
    feed = resolvePendingPreview(feed, 'chamberRoomContents', 20);
    feed = resolvePendingPreview(feed, 'treasure', 98);

    const categoryTargets = listPendingPreviewTargets(feed).filter((target) =>
      (target.split('.').pop() ?? '').startsWith('treasureMagicCategory')
    );
    const categoryTarget = categoryTargets[0];
    if (!categoryTarget) throw new Error('missing magic category target');
    feed = resolvePreview(feed, categoryTarget, 46);

    const miscTargets = listPendingPreviewTargets(feed).filter((target) =>
      (target.split('.').pop() ?? '').startsWith('treasureMiscMagicE1')
    );
    const miscTarget = miscTargets[0];
    if (!miscTarget) throw new Error('missing misc magic target');
    feed = resolvePreview(feed, miscTarget, 17);

    const artifactTargets = listPendingPreviewTargets(feed).filter((target) =>
      (target.split('.').pop() ?? '').startsWith('treasureArtifactOrRelic')
    );
    const artifactTarget = artifactTargets[0];
    if (!artifactTarget) throw new Error('missing artifact target');
    feed = resolvePreview(feed, artifactTarget, 25);

    const artifactEvent = findOutcomeEvent(
      feed.outcome,
      'treasureArtifactOrRelic'
    );
    expect(artifactEvent).toBeDefined();
    if (
      !artifactEvent ||
      artifactEvent.event.kind !== 'treasureArtifactOrRelic'
    ) {
      throw new Error('artifact event not found');
    }
    expect(artifactEvent.event.result).toBe(
      TreasureArtifactOrRelic.HandOfVecna
    );

    const detailText = renderDetail(feed)
      .filter(
        (node): node is { kind: 'paragraph'; text: string } =>
          node.kind === 'paragraph'
      )
      .map((node) => node.text.trim().toLowerCase())
      .join(' ');
    expect(detailText).toContain('there is a hand of vecna.');

    const compactText = renderCompact(feed)
      .filter(
        (node): node is { kind: 'paragraph'; text: string } =>
          node.kind === 'paragraph'
      )
      .map((node) => node.text.trim().toLowerCase())
      .join(' ');
    expect(compactText).toContain('there is a hand of vecna.');
  });

  it('resolves carpet of flying sizes from miscellaneous magic', () => {
    let feed = createFeedSnapshot({
      action: 'passage',
      roll: 14,
      detailMode: true,
      dungeonLevel: 4,
    });

    feed = resolvePendingPreview(feed, 'chamberDimensions', 5);
    feed = resolvePendingPreview(feed, 'chamberRoomContents', 20);
    feed = resolvePendingPreview(feed, 'treasure', 98);

    const categoryTargets = listPendingPreviewTargets(feed).filter((target) =>
      (target.split('.').pop() ?? '').startsWith('treasureMagicCategory')
    );
    const categoryTarget = categoryTargets[0];
    if (!categoryTarget) throw new Error('missing magic category target');
    feed = resolvePreview(feed, categoryTarget, 50);

    const miscTargets = listPendingPreviewTargets(feed).filter((target) =>
      (target.split('.').pop() ?? '').startsWith('treasureMiscMagicE2')
    );
    const miscTarget = miscTargets[0];
    if (!miscTarget) throw new Error('missing misc magic target');
    feed = resolvePreview(feed, miscTarget, 7);

    const carpetTargets = listPendingPreviewTargets(feed).filter((target) =>
      (target.split('.').pop() ?? '').startsWith('treasureCarpetOfFlying')
    );
    const carpetTarget = carpetTargets[0];
    if (!carpetTarget) throw new Error('missing carpet size target');
    feed = resolvePreview(feed, carpetTarget, 55);

    const carpetEvent = findOutcomeEvent(
      feed.outcome,
      'treasureCarpetOfFlying'
    );
    expect(carpetEvent).toBeDefined();
    if (!carpetEvent || carpetEvent.event.kind !== 'treasureCarpetOfFlying') {
      throw new Error('carpet event not found');
    }
    expect(carpetEvent.event.result).toBe("4' × 6'");

    const detailText = renderDetail(feed)
      .filter(
        (node): node is { kind: 'paragraph'; text: string } =>
          node.kind === 'paragraph'
      )
      .map((node) => node.text.trim().toLowerCase())
      .join(' ');
    expect(detailText).toContain("there is a carpet of flying (4' × 6').");

    const compactText = renderCompact(feed)
      .filter(
        (node): node is { kind: 'paragraph'; text: string } =>
          node.kind === 'paragraph'
      )
      .map((node) => node.text.trim().toLowerCase())
      .join(' ');
    expect(compactText).toContain("there is a carpet of flying (4' × 6').");
  });

  it('resolves miscellaneous magic E.3 items from magical treasure', () => {
    let feed = createFeedSnapshot({
      action: 'passage',
      roll: 14,
      detailMode: true,
      dungeonLevel: 4,
    });

    feed = resolvePendingPreview(feed, 'chamberDimensions', 5);
    feed = resolvePendingPreview(feed, 'chamberRoomContents', 20);
    feed = resolvePendingPreview(feed, 'treasure', 98);

    const categoryTargets = listPendingPreviewTargets(feed).filter((target) =>
      (target.split('.').pop() ?? '').startsWith('treasureMagicCategory')
    );
    const categoryTarget = categoryTargets[0];
    if (!categoryTarget) throw new Error('missing magic category target');
    feed = resolvePreview(feed, categoryTarget, 52);

    const miscTargets = listPendingPreviewTargets(feed).filter((target) =>
      (target.split('.').pop() ?? '').startsWith('treasureMiscMagicE3')
    );
    const miscTarget = miscTargets[0];
    if (!miscTarget) throw new Error('missing misc magic E3 target');
    feed = resolvePreview(feed, miscTarget, 40);

    const miscEvent = findOutcomeEvent(feed.outcome, 'treasureMiscMagicE3');
    expect(miscEvent).toBeDefined();
    if (!miscEvent || miscEvent.event.kind !== 'treasureMiscMagicE3') {
      throw new Error('treasureMiscMagicE3 event not found');
    }
    expect(miscEvent.event.result).toBe(
      TreasureMiscMagicE3.HelmOfTeleportation
    );

    const detailText = renderDetail(feed)
      .filter(
        (node): node is { kind: 'paragraph'; text: string } =>
          node.kind === 'paragraph'
      )
      .map((node) => node.text.trim().toLowerCase())
      .join(' ');
    expect(detailText).toContain('there is a helm of teleportation.');

    const compactText = renderCompact(feed)
      .filter(
        (node): node is { kind: 'paragraph'; text: string } =>
          node.kind === 'paragraph'
      )
      .map((node) => node.text.trim().toLowerCase())
      .join(' ');
    expect(compactText).toContain('there is a helm of teleportation.');
  });

  it('resolves figurine of wondrous power variants from miscellaneous magic', () => {
    let feed = createFeedSnapshot({
      action: 'passage',
      roll: 14,
      detailMode: true,
      dungeonLevel: 4,
    });

    feed = resolvePendingPreview(feed, 'chamberDimensions', 5);
    feed = resolvePendingPreview(feed, 'chamberRoomContents', 20);
    feed = resolvePendingPreview(feed, 'treasure', 98);

    const categoryTargets = listPendingPreviewTargets(feed).filter((target) =>
      (target.split('.').pop() ?? '').startsWith('treasureMagicCategory')
    );
    const categoryTarget = categoryTargets[0];
    if (!categoryTarget) throw new Error('missing magic category target');
    feed = resolvePreview(feed, categoryTarget, 52);

    const miscTargets = listPendingPreviewTargets(feed).filter((target) =>
      (target.split('.').pop() ?? '').startsWith('treasureMiscMagicE3')
    );
    const miscTarget = miscTargets[0];
    if (!miscTarget) throw new Error('missing misc magic E3 target');
    feed = resolvePreview(feed, miscTarget, 10);

    const figurineTargets = listPendingPreviewTargets(feed).filter((target) =>
      (target.split('.').pop() ?? '').startsWith(
        'treasureFigurineOfWondrousPower'
      )
    );
    const figurineTarget = figurineTargets[0];
    if (!figurineTarget) throw new Error('missing figurine target');
    feed = resolvePreview(feed, figurineTarget, 44);

    const marbleTargets = listPendingPreviewTargets(feed).filter((target) =>
      (target.split('.').pop() ?? '').startsWith(
        'treasureFigurineMarbleElephant'
      )
    );
    const marbleTarget = marbleTargets[0];
    if (!marbleTarget) throw new Error('missing marble elephant target');
    feed = resolvePreview(feed, marbleTarget, 92);

    const figurineEvent = findOutcomeEvent(
      feed.outcome,
      'treasureFigurineOfWondrousPower'
    );
    expect(figurineEvent).toBeDefined();
    if (
      !figurineEvent ||
      figurineEvent.event.kind !== 'treasureFigurineOfWondrousPower'
    ) {
      throw new Error('figurine event not found');
    }
    expect(figurineEvent.event.result).toBe(
      TreasureFigurineOfWondrousPower.MarbleElephant
    );

    const marbleEvent = findOutcomeEvent(
      feed.outcome,
      'treasureFigurineMarbleElephant'
    );
    expect(marbleEvent).toBeDefined();
    if (
      !marbleEvent ||
      marbleEvent.event.kind !== 'treasureFigurineMarbleElephant'
    ) {
      throw new Error('marble elephant event not found');
    }
    expect(marbleEvent.event.result).toBe(
      TreasureFigurineMarbleElephant.PrehistoricMammoth
    );

    const detailText = renderDetail(feed)
      .filter(
        (node): node is { kind: 'paragraph'; text: string } =>
          node.kind === 'paragraph'
      )
      .map((node) => node.text.trim().toLowerCase())
      .join(' ');
    expect(detailText).toContain(
      'there is a figurine of wondrous power. the figurine is a marble elephant (prehistoric (mammoth)).'
    );

    const compactText = renderCompact(feed)
      .filter(
        (node): node is { kind: 'paragraph'; text: string } =>
          node.kind === 'paragraph'
      )
      .map((node) => node.text.trim().toLowerCase())
      .join(' ');
    expect(compactText).toContain(
      'there is a figurine of wondrous power. the figurine is a marble elephant (prehistoric (mammoth)).'
    );
  });

  it('resolves girdle of giant strength variants from miscellaneous magic', () => {
    let feed = createFeedSnapshot({
      action: 'passage',
      roll: 14,
      detailMode: true,
      dungeonLevel: 4,
    });

    feed = resolvePendingPreview(feed, 'chamberDimensions', 5);
    feed = resolvePendingPreview(feed, 'chamberRoomContents', 20);
    feed = resolvePendingPreview(feed, 'treasure', 98);

    const categoryTargets = listPendingPreviewTargets(feed).filter((target) =>
      (target.split('.').pop() ?? '').startsWith('treasureMagicCategory')
    );
    const categoryTarget = categoryTargets[0];
    if (!categoryTarget) throw new Error('missing magic category target');
    feed = resolvePreview(feed, categoryTarget, 52);

    const miscTargets = listPendingPreviewTargets(feed).filter((target) =>
      (target.split('.').pop() ?? '').startsWith('treasureMiscMagicE3')
    );
    const miscTarget = miscTargets[0];
    if (!miscTarget) throw new Error('missing misc magic E3 target');
    feed = resolvePreview(feed, miscTarget, 29);

    const girdleTargets = listPendingPreviewTargets(feed).filter((target) =>
      (target.split('.').pop() ?? '').startsWith(
        'treasureGirdleOfGiantStrength'
      )
    );
    const girdleTarget = girdleTargets[0];
    if (!girdleTarget) throw new Error('missing girdle target');
    feed = resolvePreview(feed, girdleTarget, 40);

    const girdleEvent = findOutcomeEvent(
      feed.outcome,
      'treasureGirdleOfGiantStrength'
    );
    expect(girdleEvent).toBeDefined();
    if (
      !girdleEvent ||
      girdleEvent.event.kind !== 'treasureGirdleOfGiantStrength'
    ) {
      throw new Error('girdle event not found');
    }
    expect(girdleEvent.event.result).toBe(TreasureGirdleOfGiantStrength.Stone);

    const detailText = renderDetail(feed)
      .filter(
        (node): node is { kind: 'paragraph'; text: string } =>
          node.kind === 'paragraph'
      )
      .map((node) => node.text.trim().toLowerCase())
      .join(' ');
    expect(detailText).toContain(
      'there is a girdle of stone giant strength (c, f, t).'
    );

    const compactText = renderCompact(feed)
      .filter(
        (node): node is { kind: 'paragraph'; text: string } =>
          node.kind === 'paragraph'
      )
      .map((node) => node.text.trim().toLowerCase())
      .join(' ');
    expect(compactText).toContain(
      'there is a girdle of stone giant strength (c, f, t).'
    );
  });

  it('resolves horn of valhalla alignment from miscellaneous magic', () => {
    let feed = createFeedSnapshot({
      action: 'passage',
      roll: 14,
      detailMode: true,
      dungeonLevel: 4,
    });

    feed = resolvePendingPreview(feed, 'chamberDimensions', 5);
    feed = resolvePendingPreview(feed, 'chamberRoomContents', 20);
    feed = resolvePendingPreview(feed, 'treasure', 98);

    const categoryTargets = listPendingPreviewTargets(feed).filter((target) =>
      (target.split('.').pop() ?? '').startsWith('treasureMagicCategory')
    );
    const categoryTarget = categoryTargets[0];
    if (!categoryTarget) throw new Error('missing magic category target');
    feed = resolvePreview(feed, categoryTarget, 52);

    const miscTargets = listPendingPreviewTargets(feed).filter((target) =>
      (target.split('.').pop() ?? '').startsWith('treasureMiscMagicE3')
    );
    const miscTarget = miscTargets[0];
    if (!miscTarget) throw new Error('missing misc magic E3 target');
    feed = resolvePreview(feed, miscTarget, 58);

    const typeTargets = listPendingPreviewTargets(feed).filter((target) =>
      (target.split('.').pop() ?? '').startsWith('treasureHornOfValhallaType')
    );
    const typeTarget = typeTargets[0];
    if (!typeTarget) throw new Error('missing horn type target');
    feed = resolvePreview(feed, typeTarget, 12);

    const attunementTargets = listPendingPreviewTargets(feed).filter((target) =>
      (target.split('.').pop() ?? '').startsWith(
        'treasureHornOfValhallaAttunement'
      )
    );
    const attunementTarget = attunementTargets[0];
    if (!attunementTarget) throw new Error('missing horn attunement target');
    feed = resolvePreview(feed, attunementTarget, 82);

    const alignmentTargets = listPendingPreviewTargets(feed).filter((target) =>
      (target.split('.').pop() ?? '').startsWith(
        'treasureHornOfValhallaAlignment'
      )
    );
    const alignmentTarget = alignmentTargets[0];
    if (!alignmentTarget) throw new Error('missing horn alignment target');
    feed = resolvePreview(feed, alignmentTarget, 7);

    const hornTypeEvent = findOutcomeEvent(
      feed.outcome,
      'treasureHornOfValhallaType'
    );
    expect(hornTypeEvent).toBeDefined();
    if (
      !hornTypeEvent ||
      hornTypeEvent.event.kind !== 'treasureHornOfValhallaType'
    ) {
      throw new Error('horn type event not found');
    }
    expect(hornTypeEvent.event.result).toBe(TreasureHornOfValhallaType.Brass);

    const attunementEvent = findOutcomeEvent(
      feed.outcome,
      'treasureHornOfValhallaAttunement'
    );
    expect(attunementEvent).toBeDefined();
    if (
      !attunementEvent ||
      attunementEvent.event.kind !== 'treasureHornOfValhallaAttunement'
    ) {
      throw new Error('horn attunement event not found');
    }
    expect(attunementEvent.event.result).toBe(
      TreasureHornOfValhallaAttunement.Aligned
    );

    const alignmentEvent = findOutcomeEvent(
      feed.outcome,
      'treasureHornOfValhallaAlignment'
    );
    expect(alignmentEvent).toBeDefined();
    if (
      !alignmentEvent ||
      alignmentEvent.event.kind !== 'treasureHornOfValhallaAlignment'
    ) {
      throw new Error('horn alignment event not found');
    }
    expect(alignmentEvent.event.result).toBe(
      TreasureHornOfValhallaAlignment.ChaoticGood
    );

    const detailText = renderDetail(feed)
      .filter(
        (node): node is { kind: 'paragraph'; text: string } =>
          node.kind === 'paragraph'
      )
      .map((node) => node.text.trim().toLowerCase())
      .join(' ');
    expect(detailText).toContain(
      'there is a brass horn of valhalla (chaotic good).'
    );

    const compactText = renderCompact(feed)
      .filter(
        (node): node is { kind: 'paragraph'; text: string } =>
          node.kind === 'paragraph'
      )
      .map((node) => node.text.trim().toLowerCase())
      .join(' ');
    expect(compactText).toContain(
      'there is a brass horn of valhalla (chaotic good).'
    );
  });

  it('resolves crystal ball variants from miscellaneous magic', () => {
    let feed = createFeedSnapshot({
      action: 'passage',
      roll: 14,
      detailMode: true,
      dungeonLevel: 4,
    });

    feed = resolvePendingPreview(feed, 'chamberDimensions', 5);
    feed = resolvePendingPreview(feed, 'chamberRoomContents', 20);
    feed = resolvePendingPreview(feed, 'treasure', 98);

    const categoryTargets = listPendingPreviewTargets(feed).filter((target) =>
      (target.split('.').pop() ?? '').startsWith('treasureMagicCategory')
    );
    const categoryTarget = categoryTargets[0];
    if (!categoryTarget) throw new Error('missing magic category target');
    feed = resolvePreview(feed, categoryTarget, 50);

    const miscTargets = listPendingPreviewTargets(feed).filter((target) =>
      (target.split('.').pop() ?? '').startsWith('treasureMiscMagicE2')
    );
    const miscTarget = miscTargets[0];
    if (!miscTarget) throw new Error('missing misc magic target');
    feed = resolvePreview(feed, miscTarget, 60);

    const crystalTargets = listPendingPreviewTargets(feed).filter((target) =>
      (target.split('.').pop() ?? '').startsWith('treasureCrystalBall')
    );
    const crystalTarget = crystalTargets[0];
    if (!crystalTarget) throw new Error('missing crystal ball target');
    feed = resolvePreview(feed, crystalTarget, 77);

    const crystalEvent = findOutcomeEvent(feed.outcome, 'treasureCrystalBall');
    expect(crystalEvent).toBeDefined();
    if (!crystalEvent || crystalEvent.event.kind !== 'treasureCrystalBall') {
      throw new Error('crystal event not found');
    }
    expect(crystalEvent.event.result).toBe(TreasureCrystalBall.Esp);

    const detailText = renderDetail(feed)
      .filter(
        (node): node is { kind: 'paragraph'; text: string } =>
          node.kind === 'paragraph'
      )
      .map((node) => node.text.trim().toLowerCase())
      .join(' ');
    expect(detailText).toContain('there is a crystal ball with esp.');

    const compactText = renderCompact(feed)
      .filter(
        (node): node is { kind: 'paragraph'; text: string } =>
          node.kind === 'paragraph'
      )
      .map((node) => node.text.trim().toLowerCase())
      .join(' ');
    expect(compactText).toContain('there is a crystal ball with esp.');
  });

  it('resolves deck of many things composition from miscellaneous magic', () => {
    let feed = createFeedSnapshot({
      action: 'passage',
      roll: 14,
      detailMode: true,
      dungeonLevel: 4,
    });

    feed = resolvePendingPreview(feed, 'chamberDimensions', 5);
    feed = resolvePendingPreview(feed, 'chamberRoomContents', 20);
    feed = resolvePendingPreview(feed, 'treasure', 98);

    const categoryTargets = listPendingPreviewTargets(feed).filter((target) =>
      (target.split('.').pop() ?? '').startsWith('treasureMagicCategory')
    );
    const categoryTarget = categoryTargets[0];
    if (!categoryTarget) throw new Error('missing magic category target');
    feed = resolvePreview(feed, categoryTarget, 50);

    const miscTargets = listPendingPreviewTargets(feed).filter((target) =>
      (target.split('.').pop() ?? '').startsWith('treasureMiscMagicE2')
    );
    const miscTarget = miscTargets[0];
    if (!miscTarget) throw new Error('missing misc magic target');
    feed = resolvePreview(feed, miscTarget, 74);

    const deckTargets = listPendingPreviewTargets(feed).filter((target) =>
      (target.split('.').pop() ?? '').startsWith('treasureDeckOfManyThings')
    );
    const deckTarget = deckTargets[0];
    if (!deckTarget) throw new Error('missing deck target');
    feed = resolvePreview(feed, deckTarget, 90);

    const deckEvent = findOutcomeEvent(
      feed.outcome,
      'treasureDeckOfManyThings'
    );
    expect(deckEvent).toBeDefined();
    if (!deckEvent || deckEvent.event.kind !== 'treasureDeckOfManyThings') {
      throw new Error('deck event not found');
    }
    expect(deckEvent.event.result).toBe(
      TreasureDeckOfManyThings.TwentyTwoPlaques
    );

    const detailText = renderDetail(feed)
      .filter(
        (node): node is { kind: 'paragraph'; text: string } =>
          node.kind === 'paragraph'
      )
      .map((node) => node.text.trim().toLowerCase())
      .join(' ');
    expect(detailText).toContain(
      'there is a deck of many things containing 22 plaques.'
    );

    const compactText = renderCompact(feed)
      .filter(
        (node): node is { kind: 'paragraph'; text: string } =>
          node.kind === 'paragraph'
      )
      .map((node) => node.text.trim().toLowerCase())
      .join(' ');
    expect(compactText).toContain(
      'there is a deck of many things containing 22 plaques.'
    );
  });

  it('resolves eyes of petrification variant from miscellaneous magic', () => {
    let feed = createFeedSnapshot({
      action: 'passage',
      roll: 14,
      detailMode: true,
      dungeonLevel: 4,
    });

    feed = resolvePendingPreview(feed, 'chamberDimensions', 5);
    feed = resolvePendingPreview(feed, 'chamberRoomContents', 20);
    feed = resolvePendingPreview(feed, 'treasure', 98);

    const categoryTargets = listPendingPreviewTargets(feed).filter((target) =>
      (target.split('.').pop() ?? '').startsWith('treasureMagicCategory')
    );
    const categoryTarget = categoryTargets[0];
    if (!categoryTarget) throw new Error('missing magic category target');
    feed = resolvePreview(feed, categoryTarget, 50);

    const miscTargets = listPendingPreviewTargets(feed).filter((target) =>
      (target.split('.').pop() ?? '').startsWith('treasureMiscMagicE2')
    );
    const miscTarget = miscTargets[0];
    if (!miscTarget) throw new Error('missing misc magic target');
    feed = resolvePreview(feed, miscTarget, 100);

    const eyesTargets = listPendingPreviewTargets(feed).filter((target) =>
      (target.split('.').pop() ?? '').startsWith('treasureEyesOfPetrification')
    );
    const eyesTarget = eyesTargets[0];
    if (!eyesTarget) throw new Error('missing eyes target');
    feed = resolvePreview(feed, eyesTarget, 12);

    const eyesEvent = findOutcomeEvent(
      feed.outcome,
      'treasureEyesOfPetrification'
    );
    expect(eyesEvent).toBeDefined();
    if (!eyesEvent || eyesEvent.event.kind !== 'treasureEyesOfPetrification') {
      throw new Error('eyes event not found');
    }
    expect(eyesEvent.event.result).toBe(TreasureEyesOfPetrification.Basilisk);

    const detailText = renderDetail(feed)
      .filter(
        (node): node is { kind: 'paragraph'; text: string } =>
          node.kind === 'paragraph'
      )
      .map((node) => node.text.trim().toLowerCase())
      .join(' ');
    expect(detailText).toContain('there are eyes of petrification (basilisk).');

    const compactText = renderCompact(feed)
      .filter(
        (node): node is { kind: 'paragraph'; text: string } =>
          node.kind === 'paragraph'
      )
      .map((node) => node.text.trim().toLowerCase())
      .join(' ');
    expect(compactText).toContain(
      'there are eyes of petrification (basilisk).'
    );
  });

  it('resolves cloak of protection bonus from miscellaneous magic', () => {
    let feed = createFeedSnapshot({
      action: 'passage',
      roll: 14,
      detailMode: true,
      dungeonLevel: 4,
    });

    feed = resolvePendingPreview(feed, 'chamberDimensions', 5);
    feed = resolvePendingPreview(feed, 'chamberRoomContents', 20);
    feed = resolvePendingPreview(feed, 'treasure', 98);

    const categoryTargets = listPendingPreviewTargets(feed).filter((target) =>
      (target.split('.').pop() ?? '').startsWith('treasureMagicCategory')
    );
    const categoryTarget = categoryTargets[0];
    if (!categoryTarget) throw new Error('missing magic category target');
    feed = resolvePreview(feed, categoryTarget, 50);

    const miscTargets = listPendingPreviewTargets(feed).filter((target) =>
      (target.split('.').pop() ?? '').startsWith('treasureMiscMagicE2')
    );
    const miscTarget = miscTargets[0];
    if (!miscTarget) throw new Error('missing misc magic target');
    feed = resolvePreview(feed, miscTarget, 33);

    const cloakTargets = listPendingPreviewTargets(feed).filter((target) =>
      (target.split('.').pop() ?? '').startsWith('treasureCloakOfProtection')
    );
    const cloakTarget = cloakTargets[0];
    if (!cloakTarget) throw new Error('missing cloak target');
    feed = resolvePreview(feed, cloakTarget, 99);

    const cloakEvent = findOutcomeEvent(
      feed.outcome,
      'treasureCloakOfProtection'
    );
    expect(cloakEvent).toBeDefined();
    if (!cloakEvent || cloakEvent.event.kind !== 'treasureCloakOfProtection') {
      throw new Error('cloak event not found');
    }
    expect(cloakEvent.event.result).toBe('+5');

    const detailText = renderDetail(feed)
      .filter(
        (node): node is { kind: 'paragraph'; text: string } =>
          node.kind === 'paragraph'
      )
      .map((node) => node.text.trim().toLowerCase())
      .join(' ');
    expect(detailText).toContain('there is a cloak of protection +5.');

    const compactText = renderCompact(feed)
      .filter(
        (node): node is { kind: 'paragraph'; text: string } =>
          node.kind === 'paragraph'
      )
      .map((node) => node.text.trim().toLowerCase())
      .join(' ');
    expect(compactText).toContain('there is a cloak of protection +5.');
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
    feed = resolvePreview(feed, potionTarget, 38);

    const giantTargets = listPendingPreviewTargets(feed).filter((target) =>
      (target.split('.').pop() ?? '').startsWith('treasurePotionGiantStrength')
    );
    expect(giantTargets).toHaveLength(1);
    const giantTarget = giantTargets[0];
    if (!giantTarget) throw new Error('missing giant control target');
    feed = resolvePreview(feed, giantTarget, 8);

    const potionEvent = findOutcomeEvent(feed.outcome, 'treasurePotion');
    expect(potionEvent).toBeDefined();
    if (potionEvent && potionEvent.event.kind === 'treasurePotion') {
      expect(potionEvent.event.result).toBe(TreasurePotion.GiantStrength);
    }

    const detailText = renderDetail(feed)
      .filter(
        (node): node is { kind: 'paragraph'; text: string } =>
          node.kind === 'paragraph'
      )
      .map((node) => node.text.trim().toLowerCase())
      .join(' ');
    expect(detailText).toContain('there is a potion of stone giant strength.');

    const compactText = renderCompact(feed)
      .filter(
        (node): node is { kind: 'paragraph'; text: string } =>
          node.kind === 'paragraph'
      )
      .map((node) => node.text.trim().toLowerCase())
      .join(' ');
    expect(compactText).toContain('there is a potion of stone giant strength.');
  });

  it('resolves human control potions with subtype detail', () => {
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
    const categoryTarget = magicTargets[0];
    if (!categoryTarget) throw new Error('missing potion category target');
    feed = resolvePreview(feed, categoryTarget, 5);

    const potionTargets = listPendingPreviewTargets(feed).filter((target) =>
      (target.split('.').pop() ?? '').startsWith('treasurePotion')
    );
    expect(potionTargets).toHaveLength(1);
    const potionTarget = potionTargets[0];
    if (!potionTarget) throw new Error('missing potion target');
    feed = resolvePreview(feed, potionTarget, 50);

    const humanTargets = listPendingPreviewTargets(feed).filter((target) =>
      (target.split('.').pop() ?? '').startsWith('treasurePotionHumanControl')
    );
    expect(humanTargets).toHaveLength(1);
    const humanTarget = humanTargets[0];
    if (!humanTarget) throw new Error('missing human control target');
    feed = resolvePreview(feed, humanTarget, 5);

    const detailText = renderDetail(feed)
      .filter(
        (node): node is { kind: 'paragraph'; text: string } =>
          node.kind === 'paragraph'
      )
      .map((node) => node.text.trim().toLowerCase())
      .join(' ');
    expect(detailText).toContain('there is a potion of gnome control.');

    const compactText = renderCompact(feed)
      .filter(
        (node): node is { kind: 'paragraph'; text: string } =>
          node.kind === 'paragraph'
      )
      .map((node) => node.text.trim().toLowerCase())
      .join(' ');
    expect(compactText).toContain('there is a potion of gnome control.');
  });

  it('resolves undead control potions with subtype detail', () => {
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
    feed = resolvePreview(feed, potionTarget, 97);

    const undeadTargets = listPendingPreviewTargets(feed).filter((target) =>
      (target.split('.').pop() ?? '').startsWith('treasurePotionUndeadControl')
    );
    expect(undeadTargets).toHaveLength(1);
    const undeadTarget = undeadTargets[0];
    if (!undeadTarget) throw new Error('missing undead control target');
    feed = resolvePreview(feed, undeadTarget, 8);

    const potionEvent = findOutcomeEvent(feed.outcome, 'treasurePotion');
    expect(potionEvent).toBeDefined();
    if (potionEvent && potionEvent.event.kind === 'treasurePotion') {
      expect(potionEvent.event.result).toBe(TreasurePotion.UndeadControl);
    }

    const detailText = renderDetail(feed)
      .filter(
        (node): node is { kind: 'paragraph'; text: string } =>
          node.kind === 'paragraph'
      )
      .map((node) => node.text.trim().toLowerCase())
      .join(' ');
    expect(detailText).toContain('there is a potion of wraith control.');

    const compactText = renderCompact(feed)
      .filter(
        (node): node is { kind: 'paragraph'; text: string } =>
          node.kind === 'paragraph'
      )
      .map((node) => node.text.trim().toLowerCase())
      .join(' ');
    expect(compactText).toContain('there is a potion of wraith control.');
  });

  it('resolves spell scrolls with caster and spell levels', () => {
    const randomSpy = jest.spyOn(Math, 'random');
    randomSpy
      .mockReturnValueOnce(0.845) // cleric/druid roll -> clerical
      .mockReturnValueOnce(0.2) // druid selection
      .mockReturnValueOnce(0.0)
      .mockReturnValueOnce(0.3)
      .mockReturnValueOnce(0.6)
      .mockReturnValueOnce(0.05)
      .mockReturnValueOnce(0.8)
      .mockReturnValueOnce(0.4)
      .mockReturnValueOnce(0.6);

    try {
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
      if (!categoryTarget) throw new Error('missing scroll category target');
      feed = resolvePreview(feed, categoryTarget, 25);

      const scrollTargets = listPendingPreviewTargets(feed).filter((target) =>
        (target.split('.').pop() ?? '').startsWith('treasureScroll')
      );
      expect(scrollTargets).toHaveLength(1);
      const scrollTarget = scrollTargets[0];
      if (!scrollTarget) throw new Error('missing scroll target');
      feed = resolvePreview(feed, scrollTarget, 60);

      const scrollEvent = findOutcomeEvent(feed.outcome, 'treasureScroll');
      expect(scrollEvent).toBeDefined();
      if (!scrollEvent || scrollEvent.event.kind !== 'treasureScroll') {
        throw new Error('scroll event missing');
      }
      expect(scrollEvent.event.result).toBe(TreasureScroll.SpellSevenLevel4to9);
      expect(scrollEvent.event.scroll.type).toBe('spells');
      if (scrollEvent.event.scroll.type === 'spells') {
        expect(scrollEvent.event.scroll.caster).toBe('druid');
        expect(scrollEvent.event.scroll.spellLevels).toEqual([
          4, 5, 6, 4, 7, 5, 6,
        ]);
      }

      const detailText = renderDetail(feed)
        .filter(
          (node): node is { kind: 'paragraph'; text: string } =>
            node.kind === 'paragraph'
        )
        .map((node) => node.text.trim().toLowerCase())
        .join(' ');
      expect(detailText).toContain(
        'a druid scroll of seven spells (4th, 5th, 6th, 4th, 7th, 5th, 6th).'
      );

      const compactText = renderCompact(feed)
        .filter(
          (node): node is { kind: 'paragraph'; text: string } =>
            node.kind === 'paragraph'
        )
        .map((node) => node.text.trim().toLowerCase())
        .join(' ');
      expect(compactText).toContain(
        'a druid scroll of seven spells (4th, 5th, 6th, 4th, 7th, 5th, 6th).'
      );
    } finally {
      randomSpy.mockRestore();
    }
  });

  it('resolves protection scrolls with xp detail', () => {
    let feed = createFeedSnapshot({
      action: 'passage',
      roll: 14,
      detailMode: true,
      dungeonLevel: 3,
    });

    feed = resolvePendingPreview(feed, 'chamberDimensions', 5);
    feed = resolvePendingPreview(feed, 'chamberRoomContents', 20);
    feed = resolvePendingPreview(feed, 'treasure', 99);

    const magicTargets = listPendingPreviewTargets(feed).filter((target) =>
      (target.split('.').pop() ?? '').startsWith('treasureMagicCategory')
    );
    expect(magicTargets).toHaveLength(1);
    const categoryTarget = magicTargets[0];
    if (!categoryTarget) throw new Error('missing scroll category target');
    feed = resolvePreview(feed, categoryTarget, 30);

    const scrollTargets = listPendingPreviewTargets(feed).filter((target) =>
      (target.split('.').pop() ?? '').startsWith('treasureScroll')
    );
    expect(scrollTargets).toHaveLength(1);
    const scrollTarget = scrollTargets[0];
    if (!scrollTarget) throw new Error('missing scroll target');
    feed = resolvePreview(feed, scrollTarget, 61);

    const elementalTargets = listPendingPreviewTargets(feed).filter((target) =>
      (target.split('.').pop() ?? '').startsWith(
        'treasureScrollProtectionElementals'
      )
    );
    expect(elementalTargets).toHaveLength(0);

    const scrollEvent = findOutcomeEvent(feed.outcome, 'treasureScroll');
    expect(scrollEvent).toBeDefined();
    if (!scrollEvent || scrollEvent.event.kind !== 'treasureScroll') {
      throw new Error('scroll event missing');
    }
    expect(scrollEvent.event.scroll.type).toBe('protection');
    if (scrollEvent.event.scroll.type === 'protection') {
      expect(scrollEvent.event.scroll.protection).toBe(
        TreasureScroll.ProtectionDemons
      );
    }

    const detailText = renderDetail(feed)
      .filter(
        (node): node is { kind: 'paragraph'; text: string } =>
          node.kind === 'paragraph'
      )
      .map((node) => node.text.trim().toLowerCase())
      .join(' ');
    expect(detailText).toContain('a protection scroll against demons.');

    const compactText = renderCompact(feed)
      .filter(
        (node): node is { kind: 'paragraph'; text: string } =>
          node.kind === 'paragraph'
      )
      .map((node) => node.text.trim().toLowerCase())
      .join(' ');
    expect(compactText).toContain('a protection scroll against demons.');
  });

  it('resolves elemental protection scrolls with subtype detail', () => {
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
    const categoryTarget = magicTargets[0];
    if (!categoryTarget) throw new Error('missing scroll category target');
    feed = resolvePreview(feed, categoryTarget, 30);

    const scrollTargets = listPendingPreviewTargets(feed).filter((target) =>
      (target.split('.').pop() ?? '').startsWith('treasureScroll')
    );
    expect(scrollTargets).toHaveLength(1);
    const scrollTarget = scrollTargets[0];
    if (!scrollTarget) throw new Error('missing scroll target');
    feed = resolvePreview(feed, scrollTarget, 65);

    const elementalTargets = listPendingPreviewTargets(feed).filter((target) =>
      (target.split('.').pop() ?? '').startsWith(
        'treasureScrollProtectionElementals'
      )
    );
    expect(elementalTargets).toHaveLength(1);
    const elementalTarget = elementalTargets[0];
    if (!elementalTarget)
      throw new Error('missing elemental protection target');
    feed = resolvePreview(feed, elementalTarget, 20);

    const scrollEvent = findOutcomeEvent(feed.outcome, 'treasureScroll');
    expect(scrollEvent).toBeDefined();
    if (!scrollEvent || scrollEvent.event.kind !== 'treasureScroll') {
      throw new Error('scroll event missing');
    }

    const detailText = renderDetail(feed)
      .filter(
        (node): node is { kind: 'paragraph'; text: string } =>
          node.kind === 'paragraph'
      )
      .map((node) => node.text.trim().toLowerCase())
      .join(' ');
    expect(detailText).toContain(
      'a protection scroll against earth elementals.'
    );

    const compactText = renderCompact(feed)
      .filter(
        (node): node is { kind: 'paragraph'; text: string } =>
          node.kind === 'paragraph'
      )
      .map((node) => node.text.trim().toLowerCase())
      .join(' ');
    expect(compactText).toContain(
      'a protection scroll against earth elementals.'
    );
  });

  it('resolves lycanthrope protection scrolls with subtype detail', () => {
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
    const categoryTarget = magicTargets[0];
    if (!categoryTarget) throw new Error('missing scroll category target');
    feed = resolvePreview(feed, categoryTarget, 30);

    const scrollTargets = listPendingPreviewTargets(feed).filter((target) =>
      (target.split('.').pop() ?? '').startsWith('treasureScroll')
    );
    expect(scrollTargets).toHaveLength(1);
    const scrollTarget = scrollTargets[0];
    if (!scrollTarget) throw new Error('missing scroll target');
    feed = resolvePreview(feed, scrollTarget, 72);

    const lycanTargets = listPendingPreviewTargets(feed).filter((target) =>
      (target.split('.').pop() ?? '').startsWith(
        'treasureScrollProtectionLycanthropes'
      )
    );
    expect(lycanTargets).toHaveLength(1);
    const lycanTarget = lycanTargets[0];
    if (!lycanTarget) throw new Error('missing lycanthrope protection target');
    feed = resolvePreview(feed, lycanTarget, 45);

    const detailText = renderDetail(feed)
      .filter(
        (node): node is { kind: 'paragraph'; text: string } =>
          node.kind === 'paragraph'
      )
      .map((node) => node.text.trim().toLowerCase())
      .join(' ');
    expect(detailText).toContain(
      'a protection scroll against all lycanthropes.'
    );

    const compactText = renderCompact(feed)
      .filter(
        (node): node is { kind: 'paragraph'; text: string } =>
          node.kind === 'paragraph'
      )
      .map((node) => node.text.trim().toLowerCase())
      .join(' ');
    expect(compactText).toContain(
      'a protection scroll against all lycanthropes.'
    );
  });

  it('resolves rings with detail copy', () => {
    let feed = createFeedSnapshot({
      action: 'passage',
      roll: 14,
      detailMode: true,
      dungeonLevel: 3,
    });

    feed = resolvePendingPreview(feed, 'chamberDimensions', 5);
    feed = resolvePendingPreview(feed, 'chamberRoomContents', 20);
    feed = resolvePendingPreview(feed, 'treasure', 99);

    const magicTargets = listPendingPreviewTargets(feed).filter((target) =>
      (target.split('.').pop() ?? '').startsWith('treasureMagicCategory')
    );
    expect(magicTargets).toHaveLength(1);
    const categoryTarget = magicTargets[0];
    if (!categoryTarget) throw new Error('missing ring category target');
    feed = resolvePreview(feed, categoryTarget, 36);

    const ringTargets = listPendingPreviewTargets(feed).filter((target) =>
      (target.split('.').pop() ?? '').startsWith('treasureRing')
    );
    expect(ringTargets).toHaveLength(1);
    const ringTarget = ringTargets[0];
    if (!ringTarget) throw new Error('missing ring target');
    feed = resolvePreview(feed, ringTarget, 45);

    const protectionTargets = listPendingPreviewTargets(feed).filter((target) =>
      target.includes('treasureRingProtection')
    );
    expect(protectionTargets).toHaveLength(1);
    const protectionTarget = protectionTargets[0];
    if (!protectionTarget) throw new Error('missing ring protection target');
    feed = resolvePreview(feed, protectionTarget, 92);

    const detailText = renderDetail(feed)
      .filter(
        (node): node is { kind: 'paragraph'; text: string } =>
          node.kind === 'paragraph'
      )
      .map((node) => node.text.trim().toLowerCase())
      .join(' ');
    expect(detailText).toContain(
      'there is a ring of protection granting +4 to ac and +2 on saving throws.'
    );

    const compactText = renderCompact(feed)
      .filter(
        (node): node is { kind: 'paragraph'; text: string } =>
          node.kind === 'paragraph'
      )
      .map((node) => node.text.trim().toLowerCase())
      .join(' ');
    expect(compactText).toContain(
      'there is a ring of protection granting +4 to ac and +2 on saving throws.'
    );
  });

  it('resolves regeneration rings with detail copy', () => {
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
    const categoryTarget = magicTargets[0];
    if (!categoryTarget) throw new Error('missing ring category target');
    feed = resolvePreview(feed, categoryTarget, 36);

    const ringTargets = listPendingPreviewTargets(feed).filter((target) =>
      (target.split('.').pop() ?? '').startsWith('treasureRing')
    );
    expect(ringTargets).toHaveLength(1);
    const ringTarget = ringTargets[0];
    if (!ringTarget) throw new Error('missing ring target');
    feed = resolvePreview(feed, ringTarget, 61); // Regeneration

    const regenTargets = listPendingPreviewTargets(feed).filter((target) =>
      target.includes('treasureRingRegeneration')
    );
    expect(regenTargets).toHaveLength(1);
    const regenTarget = regenTargets[0];
    if (!regenTarget) throw new Error('missing regeneration target');
    feed = resolvePreview(feed, regenTarget, 95);

    const detailText = renderDetail(feed)
      .filter(
        (node): node is { kind: 'paragraph'; text: string } =>
          node.kind === 'paragraph'
      )
      .map((node) => node.text.trim().toLowerCase())
      .join(' ');
    expect(detailText).toContain('there is a vampiric regeneration ring.');

    const compactText = renderCompact(feed)
      .filter(
        (node): node is { kind: 'paragraph'; text: string } =>
          node.kind === 'paragraph'
      )
      .map((node) => node.text.trim().toLowerCase())
      .join(' ');
    expect(compactText).toContain('there is a vampiric regeneration ring.');
  });

  it('resolves spell storing rings with detail copy', () => {
    const spy = jest.spyOn(dungeonLookup, 'rollDice');
    spy
      .mockImplementationOnce(() => 2) // spell count d4 => 3 spells
      .mockImplementationOnce(() => 50) // cleric roll -> magic-user branch
      .mockImplementationOnce(() => 20) // illusionist roll -> magic-user
      .mockImplementationOnce(() => 2)
      .mockImplementationOnce(() => 4)
      .mockImplementationOnce(() => 5);

    try {
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
      const categoryTarget = magicTargets[0];
      if (!categoryTarget) throw new Error('missing ring category target');
      feed = resolvePreview(feed, categoryTarget, 36);

      const ringTargets = listPendingPreviewTargets(feed).filter((target) =>
        (target.split('.').pop() ?? '').startsWith('treasureRing')
      );
      expect(ringTargets).toHaveLength(1);
      const ringTarget = ringTargets[0];
      if (!ringTarget) throw new Error('missing ring target');
      feed = resolvePreview(feed, ringTarget, 64);

      const detailText = renderDetail(feed)
        .filter(
          (node): node is { kind: 'paragraph'; text: string } =>
            node.kind === 'paragraph'
        )
        .map((node) => node.text.trim().toLowerCase())
        .join(' ');
      expect(detailText).toContain(
        'there is a ring of magic-user spell storing (2nd, 4th, 5th).'
      );

      const compactText = renderCompact(feed)
        .filter(
          (node): node is { kind: 'paragraph'; text: string } =>
            node.kind === 'paragraph'
        )
        .map((node) => node.text.trim().toLowerCase())
        .join(' ');
      expect(compactText).toContain(
        'there is a ring of magic-user spell storing (2nd, 4th, 5th).'
      );
    } finally {
      spy.mockRestore();
    }
  });

  it('resolves contrariness rings with effect detail', () => {
    let feed = createFeedSnapshot({
      action: 'passage',
      roll: 14,
      detailMode: true,
      dungeonLevel: 3,
    });

    feed = resolvePendingPreview(feed, 'chamberDimensions', 5);
    feed = resolvePendingPreview(feed, 'chamberRoomContents', 20);
    feed = resolvePendingPreview(feed, 'treasure', 99);

    const magicTargets = listPendingPreviewTargets(feed).filter((target) =>
      (target.split('.').pop() ?? '').startsWith('treasureMagicCategory')
    );
    expect(magicTargets).toHaveLength(1);
    const categoryTarget = magicTargets[0];
    if (!categoryTarget) throw new Error('missing ring category target');
    feed = resolvePreview(feed, categoryTarget, 36);

    const ringTargets = listPendingPreviewTargets(feed).filter((target) =>
      (target.split('.').pop() ?? '').startsWith('treasureRing')
    );
    expect(ringTargets).toHaveLength(1);
    const ringTarget = ringTargets[0];
    if (!ringTarget) throw new Error('missing ring target');
    feed = resolvePreview(feed, ringTarget, 4);

    const contrarinessTargets = listPendingPreviewTargets(feed).filter(
      (target) => target.includes('treasureRingContrariness')
    );
    expect(contrarinessTargets).toHaveLength(1);
    const contrarinessTarget = contrarinessTargets[0];
    if (!contrarinessTarget)
      throw new Error('missing contrariness effect target');
    feed = resolvePreview(feed, contrarinessTarget, 75);

    const detailText = renderDetail(feed)
      .filter(
        (node): node is { kind: 'paragraph'; text: string } =>
          node.kind === 'paragraph'
      )
      .map((node) => node.text.trim().toLowerCase())
      .join(' ');
    expect(detailText).toContain(
      'there is a ring of contrariness (spell turning).'
    );

    const compactText = renderCompact(feed)
      .filter(
        (node): node is { kind: 'paragraph'; text: string } =>
          node.kind === 'paragraph'
      )
      .map((node) => node.text.trim().toLowerCase())
      .join(' ');
    expect(compactText).toContain(
      'there is a ring of contrariness (spell turning).'
    );
  });

  it('resolves elemental command rings with focus detail', () => {
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
    if (!categoryTarget) throw new Error('missing ring category target');
    feed = resolvePreview(feed, categoryTarget, 36);

    const ringTargets = listPendingPreviewTargets(feed).filter((target) =>
      (target.split('.').pop() ?? '').startsWith('treasureRing')
    );
    expect(ringTargets).toHaveLength(1);
    const ringTarget = ringTargets[0];
    if (!ringTarget) throw new Error('missing ring target');
    feed = resolvePreview(feed, ringTarget, 15);

    const elementalTargets = listPendingPreviewTargets(feed).filter((target) =>
      target.includes('treasureRingElementalCommand')
    );
    expect(elementalTargets).toHaveLength(1);
    const elementalTarget = elementalTargets[0];
    if (!elementalTarget) throw new Error('missing elemental focus target');
    feed = resolvePreview(feed, elementalTarget, 3);

    const detailText = renderDetail(feed)
      .filter(
        (node): node is { kind: 'paragraph'; text: string } =>
          node.kind === 'paragraph'
      )
      .map((node) => node.text.trim().toLowerCase())
      .join(' ');
    expect(detailText).toContain('there is a ring of fire elemental command.');

    const compactText = renderCompact(feed)
      .filter(
        (node): node is { kind: 'paragraph'; text: string } =>
          node.kind === 'paragraph'
      )
      .map((node) => node.text.trim().toLowerCase())
      .join(' ');
    expect(compactText).toContain('there is a ring of fire elemental command.');
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
