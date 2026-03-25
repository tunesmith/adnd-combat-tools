import type {
  DungeonRenderNode,
  DungeonTablePreview,
} from '../../../../types/dungeon';
import type { OutcomeEventNode } from '../../../../dungeon/domain/outcome';
import {
  createFeedSnapshot,
  resolvePendingPreview,
  resolvePreview,
  renderCompact,
  renderDetail,
  listPendingPreviewTargets,
} from '../../../support/dungeon/uiPreviewHarness';
import { resolveViaRegistry } from '../../../../dungeon/helpers/registry';
import type { OutcomeEvent } from '../../../../dungeon/domain/outcome';
import {
  DoorBeyond,
  doorBeyond,
} from '../../../../dungeon/features/navigation/entry/entryTable';
import { ChamberRoomContents } from '../../../../dungeon/features/environment/roomsChambers/roomsChambersTable';
import { TreasureMagicCategory } from '../../../../dungeon/features/treasure/magicCategory/magicCategoryTable';
import { TreasurePotion } from '../../../../dungeon/features/treasure/potion/potionTables';
import { TreasureScroll } from '../../../../dungeon/features/treasure/scroll/scrollTables';
import { TreasureRing } from '../../../../dungeon/features/treasure/ring/ringTables';
import { TreasureArmorShield } from '../../../../dungeon/features/treasure/armorShields/armorShieldsTable';
import { TreasureMiscWeapon } from '../../../../dungeon/features/treasure/miscWeapons/miscWeaponsTable';
import { TreasureRodStaffWand } from '../../../../dungeon/features/treasure/rodStaffWand/rodStaffWandTables';
import {
  TreasureSword,
  TreasureSwordUnusual,
} from '../../../../dungeon/features/treasure/swords/swordsTables';

describe('uiPreviewHarness', () => {
  test('resolves door continuation chain without residual pending nodes', () => {
    let feed = createFeedSnapshot({
      action: 'passage',
      roll: 3,
      detailMode: true,
    });

    feed = resolvePendingPreview(feed, 'doorLocation', 1);
    feed = resolvePendingPreview(feed, 'periodicCheckDoorOnly', 3);
    feed = resolvePendingPreview(feed, 'doorLocation', 4);

    expect(feed.pendingCount).toBe(0);
    const compact = renderCompact(feed)
      .filter(
        (n): n is { kind: 'paragraph'; text: string } => n.kind === 'paragraph'
      )
      .map((n) => n.text.trim());

    expect(compact).toEqual([
      "A door is to the Left. There are no other doors. The main passage extends -- check again in 30'.",
    ]);
  });

  test('UI collapse maps update for door continuation resolution', () => {
    let feed = createFeedSnapshot({
      action: 'passage',
      roll: 3,
      detailMode: true,
    });

    feed = resolvePendingPreview(feed, 'doorLocation', 1);

    // Locate the door continuation preview after resolving door location.
    const preview = renderDetail(feed).find(
      (node): node is DungeonTablePreview =>
        node.kind === 'table-preview' &&
        node.id.startsWith('periodicCheckDoorOnly')
    );
    expect(preview).toBeDefined();

    type FeedState = {
      id: string;
      messages: DungeonRenderNode[];
      outcome?: OutcomeEventNode;
      renderCache?: {
        detail?: DungeonRenderNode[];
        compact?: DungeonRenderNode[];
      };
      pendingCount?: number;
    };

    let state: FeedState[] = [
      {
        id: feed.id,
        messages: feed.messages,
        outcome: feed.outcome,
        renderCache: feed.renderCache,
        pendingCount: feed.pendingCount,
      },
    ];

    let collapsed: Record<string, boolean> = {};
    let resolvedMap: Record<string, boolean> = {};

    if (!preview) {
      throw new Error('Expected periodicCheckDoorOnly preview');
    }

    const result = resolveViaRegistry(
      preview,
      feed.id,
      3,
      (updater) => {
        state =
          typeof updater === 'function'
            ? (updater as (prev: FeedState[]) => FeedState[])(state)
            : (updater as FeedState[]);
      },
      (updater) => {
        collapsed =
          typeof updater === 'function'
            ? (
                updater as (
                  prev: Record<string, boolean>
                ) => Record<string, boolean>
              )(collapsed)
            : (updater as Record<string, boolean>);
      },
      (updater) => {
        resolvedMap =
          typeof updater === 'function'
            ? (
                updater as (
                  prev: Record<string, boolean>
                ) => Record<string, boolean>
              )(resolvedMap)
            : (updater as Record<string, boolean>);
      },
      state[0]
    );

    expect(result).toBe(true);
    const keyBase = `${feed.id}:${preview.targetId ?? preview.id}`;
    expect(collapsed[keyBase]).toBe(true);
    expect(resolvedMap[keyBase]).toBe(true);
  });

  test('captures chamber unusual size reroll behaviour (current UI)', () => {
    let feed = createFeedSnapshot({
      action: 'passage',
      roll: 14,
      detailMode: true,
    });
    feed = resolvePendingPreview(feed, 'chamberDimensions', 18);
    feed = resolvePendingPreview(feed, 'unusualShape', 6);
    feed = resolvePendingPreview(feed, 'unusualSize', 15);
    feed = resolvePendingPreview(feed, 'unusualSize', 15);

    expect(feed.pendingCount).toBe(2);
    const pendingTargets = listPendingPreviewTargets(feed);
    expect(pendingTargets).toHaveLength(2);
    expect(
      pendingTargets.some((target) => target.includes('chamberRoomContents'))
    ).toBe(true);
    expect(
      pendingTargets.some((target) => target.includes('unusualSize'))
    ).toBe(true);

    const compactText = renderCompact(feed)
      .filter(
        (n): n is { kind: 'paragraph'; text: string } => n.kind === 'paragraph'
      )
      .map((n) => n.text.trim())
      .join(' ');
    expect(compactText).toContain(
      'Add 2000 sq. ft. (current total 4,000 sq. ft.) and roll again.'
    );
    expect(compactText).not.toContain(
      'Add 2000 sq. ft. (current total 2,000 sq. ft.) and roll again.'
    );
    expect(compactText).not.toContain('It is about 4,500 sq. ft.');
  });

  test('chamber unusual size resolves fully when reroll finishes', () => {
    let feed = createFeedSnapshot({
      action: 'passage',
      roll: 14,
      detailMode: true,
    });
    feed = resolvePendingPreview(feed, 'chamberDimensions', 18);
    feed = resolvePendingPreview(feed, 'unusualShape', 6);
    feed = resolvePendingPreview(feed, 'unusualSize', 15);
    feed = resolvePendingPreview(feed, 'unusualSize', 15);
    feed = resolvePendingPreview(feed, 'unusualSize', 1);

    expect(feed.pendingCount).toBe(2);
    const pendingAfter = listPendingPreviewTargets(feed);
    expect(pendingAfter).toHaveLength(2);
    expect(
      pendingAfter.some((target) => target.includes('chamberRoomContents'))
    ).toBe(true);
    expect(
      pendingAfter.some((target) => target.includes('numberOfExits'))
    ).toBe(true);

    const compactView = renderCompact(feed);
    const compactText = compactView
      .filter(
        (n): n is { kind: 'paragraph'; text: string } => n.kind === 'paragraph'
      )
      .map((n) => n.text.trim())
      .join(' ');
    // expect(compactText).toContain(
    //   'Add 2000 sq. ft. (current total 2,000 sq. ft.) and roll again.'
    // );
    // expect(compactText).toContain(
    //   'Add 2000 sq. ft. (current total 4,000 sq. ft.) and roll again.'
    // );
    expect(compactText).toContain('It is about 4,500 sq. ft.');
    // expect(compactText).toBe(
    //   'The passage opens into a chamber. The chamber has an unusual shape and size. It is triangular. It is about 4,500 sq. ft. Determine exits, contents, and treasure separately.'
    // );
  });

  test('illusionary wall chamber skips contents preview when forcing monster result', () => {
    let feed = createFeedSnapshot({
      action: 'passage',
      roll: 19,
      detailMode: true,
      dungeonLevel: 4,
    });

    feed = resolvePendingPreview(feed, 'trickTrap', 19);
    feed = resolvePendingPreview(feed, 'illusionaryWallNature', 12);

    const previewsBefore = renderDetail(feed).filter(
      (node): node is DungeonTablePreview => node.kind === 'table-preview'
    );
    const chamberPreviewBefore = previewsBefore.find(
      (node) => node.id.split(':')[0] === 'chamberDimensions'
    );
    expect(chamberPreviewBefore).toBeDefined();
    expect(chamberPreviewBefore?.context).toEqual(
      expect.objectContaining({
        kind: 'chamberDimensions',
        forcedContents: ChamberRoomContents.MonsterAndTreasure,
        level: 4,
      })
    );
    feed = resolvePendingPreview(feed, 'chamberDimensions', 1);

    const contentsEvent = findOutcomeEvent(feed.outcome, 'chamberRoomContents');
    expect(contentsEvent?.event.kind).toBe('chamberRoomContents');
    expect((contentsEvent?.event as any).autoResolved).toBe(true);

    const detail = renderDetail(feed);
    const previews = detail.filter(
      (node): node is DungeonTablePreview => node.kind === 'table-preview'
    );
    const hasContentsPreview = previews.some((preview) => {
      const previewBase = preview.id.split(':')[0];
      const targetBase = (preview.targetId ?? '')
        .split('.')
        .pop()
        ?.split(':')[0];
      return (
        previewBase === 'chamberRoomContents' ||
        targetBase === 'chamberRoomContents'
      );
    });
    expect(hasContentsPreview).toBe(false);
    const pendingTargets = listPendingPreviewTargets(feed);
    const pendingBases = pendingTargets.map((target) => {
      const last = target.split('.').pop() ?? target;
      return last.split(':')[0];
    });
    expect(pendingBases).not.toContain('chamberRoomContents');
    const pendingTables = collectPendingTables(feed.outcome);
    expect(pendingTables).toContain('monsterLevel:4');
    expect(pendingTables).not.toContain('monsterLevel:1');
  });

  test('wandering trick trap retains generic summary before wall detail', () => {
    let feed = createFeedSnapshot({
      action: 'passage',
      roll: 20,
      detailMode: true,
    });

    feed = resolvePendingPreview(feed, 'wanderingWhereFrom', 19);
    feed = resolvePendingPreview(feed, 'trickTrap', 19);

    const detailNodes = renderDetail(feed);
    const paragraphTexts = detailNodes
      .filter(
        (node): node is { kind: 'paragraph'; text: string } =>
          node.kind === 'paragraph'
      )
      .map((node) => node.text.trim());
    const illusionarySummaries = paragraphTexts.filter(
      (text) => text === 'There is an illusionary wall.'
    );
    expect(illusionarySummaries.length).toBe(1);
  });

  test('door preview resolution preserves exit metadata', () => {
    let feed = createFeedSnapshot({
      action: 'door',
      roll: pickRollForDoorBeyond(DoorBeyond.Room),
      detailMode: true,
    });

    feed = resolvePendingPreview(feed, 'roomDimensions', 11);
    feed = resolvePendingPreview(feed, 'numberOfExits', 4);
    feed = resolvePendingPreview(feed, 'doorExitLocation', 18);

    const doorExitEvent = findOutcomeEvent(feed.outcome, 'doorExitLocation');
    expect(doorExitEvent?.event.kind).toBe('doorExitLocation');
    if (!doorExitEvent || doorExitEvent.event.kind !== 'doorExitLocation') {
      throw new Error('Expected door exit location event');
    }
    expect(doorExitEvent.event.index).toBe(1);
    expect(doorExitEvent.event.total).toBe(2);
    expect(doorExitEvent.event.origin).toBe('room');

    feed = resolvePendingPreview(feed, 'exitAlternative', 4);

    const alternativeEvent = findOutcomeEvent(feed.outcome, 'exitAlternative');
    expect(alternativeEvent?.event.kind).toBe('exitAlternative');
    if (
      !alternativeEvent ||
      alternativeEvent.event.kind !== 'exitAlternative'
    ) {
      throw new Error('Expected exit alternative event');
    }
    expect(alternativeEvent.event.exitType).toBe('door');
  });

  test('passage preview resolution preserves exit metadata', () => {
    let feed = createFeedSnapshot({
      action: 'passage',
      roll: 14,
      detailMode: true,
    });

    feed = resolvePendingPreview(feed, 'chamberDimensions', 5);
    feed = resolvePendingPreview(feed, 'numberOfExits', 4);
    feed = resolvePendingPreview(feed, 'passageExitLocation', 9);

    const passageExitEvent = findOutcomeEvent(
      feed.outcome,
      'passageExitLocation'
    );
    expect(passageExitEvent?.event.kind).toBe('passageExitLocation');
    if (
      !passageExitEvent ||
      passageExitEvent.event.kind !== 'passageExitLocation'
    ) {
      throw new Error('Expected passage exit location event');
    }
    expect(passageExitEvent.event.index).toBe(1);
    expect(passageExitEvent.event.total).toBe(3);
    expect(passageExitEvent.event.origin).toBe('chamber');

    feed = resolvePendingPreview(feed, 'exitDirection', 20);

    const directionEvent = findOutcomeEvent(feed.outcome, 'exitDirection');
    expect(directionEvent?.event.kind).toBe('exitDirection');
    if (!directionEvent || directionEvent.event.kind !== 'exitDirection') {
      throw new Error('Expected exit direction event');
    }
    expect(directionEvent.event.index).toBe(1);
    expect(directionEvent.event.total).toBe(3);
    expect(directionEvent.event.origin).toBe('chamber');

    feed = resolvePendingPreview(feed, 'exitAlternative', 7);

    const alternativeEvent = findOutcomeEvent(feed.outcome, 'exitAlternative');
    expect(alternativeEvent?.event.kind).toBe('exitAlternative');
    if (
      !alternativeEvent ||
      alternativeEvent.event.kind !== 'exitAlternative'
    ) {
      throw new Error('Expected exit alternative event');
    }
    expect(alternativeEvent.event.exitType).toBe('passage');
  });

  test('circular pool preview resolution preserves dungeon level', () => {
    let feed = createFeedSnapshot({
      action: 'passage',
      roll: 14,
      detailMode: true,
      dungeonLevel: 4,
    });

    feed = resolvePendingPreview(feed, 'chamberDimensions', 18);
    feed = resolvePendingPreview(feed, 'unusualShape', 2);
    feed = resolvePendingPreview(feed, 'unusualSize', 1);
    feed = resolvePendingPreview(feed, 'circularContents', 1);
    feed = resolvePendingPreview(feed, 'circularPool', 11);

    const pendingTables = collectPendingTables(feed.outcome);
    expect(pendingTables).toContain('monsterLevel:4');
    expect(pendingTables).not.toContain('monsterLevel:1');
  });

  test('resolved chamber contents preview reroll preserves dungeon level', () => {
    let feed = createFeedSnapshot({
      action: 'passage',
      roll: 14,
      detailMode: true,
      dungeonLevel: 4,
    });

    feed = resolvePendingPreview(feed, 'chamberDimensions', 5);
    feed = resolvePendingPreview(feed, 'chamberRoomContents', 1);

    const contentsPreview = findPreview(
      renderDetail(feed),
      'chamberRoomContents'
    );
    expect(contentsPreview?.context).toEqual({
      kind: 'chamberContents',
      level: 4,
    });

    if (!contentsPreview) {
      throw new Error('Expected chamber contents preview');
    }

    feed = resolvePreview(
      feed,
      contentsPreview.targetId ?? contentsPreview.id,
      13
    );

    const contentsEvent = findOutcomeEvent(feed.outcome, 'chamberRoomContents');
    expect(contentsEvent?.event.kind).toBe('chamberRoomContents');
    if (!contentsEvent || contentsEvent.event.kind !== 'chamberRoomContents') {
      throw new Error('Expected chamber room contents event');
    }
    expect(contentsEvent.event.result).toBe(ChamberRoomContents.MonsterOnly);

    const pendingTables = collectPendingTables(feed.outcome);
    expect(pendingTables).toContain('monsterLevel:4');
    expect(pendingTables).not.toContain('monsterLevel:1');
  });

  test('resolved chamber dimensions preview reroll preserves forced contents', () => {
    let feed = createFeedSnapshot({
      action: 'passage',
      roll: 19,
      detailMode: true,
      dungeonLevel: 4,
    });

    feed = resolvePendingPreview(feed, 'trickTrap', 19);
    feed = resolvePendingPreview(feed, 'illusionaryWallNature', 12);
    feed = resolvePendingPreview(feed, 'chamberDimensions', 1);

    const chamberPreview = findPreview(renderDetail(feed), 'chamberDimensions');
    expect(chamberPreview?.context).toEqual(
      expect.objectContaining({
        kind: 'chamberDimensions',
        forcedContents: ChamberRoomContents.MonsterAndTreasure,
        level: 4,
      })
    );

    if (!chamberPreview) {
      throw new Error('Expected chamber dimensions preview');
    }

    feed = resolvePreview(
      feed,
      chamberPreview.targetId ?? chamberPreview.id,
      5
    );

    const contentsEvent = findOutcomeEvent(feed.outcome, 'chamberRoomContents');
    expect(contentsEvent?.event.kind).toBe('chamberRoomContents');
    expect(
      (contentsEvent?.event as { autoResolved?: boolean } | undefined)
        ?.autoResolved
    ).toBe(true);
    if (!contentsEvent || contentsEvent.event.kind !== 'chamberRoomContents') {
      throw new Error('Expected chamber room contents event');
    }
    expect(contentsEvent.event.result).toBe(
      ChamberRoomContents.MonsterAndTreasure
    );
    const pendingTables = collectPendingTables(feed.outcome);
    expect(pendingTables).toContain('monsterLevel:4');
    expect(pendingTables).not.toContain('monsterLevel:1');

    const previews = renderDetail(feed).filter(
      (node): node is DungeonTablePreview => node.kind === 'table-preview'
    );
    expect(
      previews.some((preview) => preview.id === 'chamberRoomContents')
    ).toBe(false);
  });

  test('resolved circular pool preview reroll preserves dungeon level', () => {
    let feed = createFeedSnapshot({
      action: 'passage',
      roll: 14,
      detailMode: true,
      dungeonLevel: 4,
    });

    feed = resolvePendingPreview(feed, 'chamberDimensions', 18);
    feed = resolvePendingPreview(feed, 'unusualShape', 1);
    feed = resolvePendingPreview(feed, 'unusualSize', 1);
    feed = resolvePendingPreview(feed, 'circularContents', 1);
    feed = resolvePendingPreview(feed, 'circularPool', 1);

    const poolPreview = findPreview(renderDetail(feed), 'circularPool');
    expect(poolPreview?.context).toEqual({
      kind: 'wandering',
      level: 4,
    });

    if (!poolPreview) {
      throw new Error('Expected circular pool preview');
    }

    feed = resolvePreview(feed, poolPreview.targetId ?? poolPreview.id, 11);

    const pendingTables = collectPendingTables(feed.outcome);
    expect(pendingTables).toContain('monsterLevel:4');
    expect(pendingTables).not.toContain('monsterLevel:1');
  });

  test('resolved treasure magic category preview reroll preserves treasure magic context', () => {
    let feed = createFeedSnapshot({
      action: 'passage',
      roll: 14,
      detailMode: true,
      dungeonLevel: 4,
    });

    feed = resolvePendingPreview(feed, 'chamberDimensions', 5);
    feed = resolvePendingPreview(feed, 'chamberRoomContents', 20);
    feed = resolvePendingPreview(feed, 'treasure', 99);
    feed = resolvePendingPreview(feed, 'treasureMagicCategory', 2);

    const magicPreview = findPreview(
      renderDetail(feed),
      'treasureMagicCategory'
    );
    expect(magicPreview?.context).toEqual({
      kind: 'treasureMagic',
      level: 4,
      treasureRoll: 99,
      rollIndex: 1,
    });

    if (!magicPreview) {
      throw new Error('Expected treasure magic category preview');
    }

    feed = resolvePreview(feed, magicPreview.targetId ?? magicPreview.id, 44);

    const magicEvent = findOutcomeEvent(feed.outcome, 'treasureMagicCategory');
    expect(magicEvent).toBeDefined();
    if (magicEvent?.event.kind === 'treasureMagicCategory') {
      expect(magicEvent.event.result).toBe(
        TreasureMagicCategory.RodsStavesWands
      );
    }

    const pendingTables = collectPendingTables(feed.outcome);
    expect(pendingTables).toContain('treasureRodStaffWand');
    expect(pendingTables).not.toContain('treasurePotion');
  });

  test('resolved treasure preview reroll preserves treasure context', () => {
    let feed = createFeedSnapshot({
      action: 'passage',
      roll: 14,
      detailMode: true,
      dungeonLevel: 4,
    });

    feed = resolvePendingPreview(feed, 'chamberDimensions', 5);
    feed = resolvePendingPreview(feed, 'chamberRoomContents', 20);
    feed = resolvePendingPreview(feed, 'treasure', 99);

    const treasurePreview = findPreview(renderDetail(feed), 'treasure');
    expect(treasurePreview?.context).toEqual(
      expect.objectContaining({
        kind: 'treasure',
        level: 4,
        withMonster: false,
        rollIndex: 1,
      })
    );

    if (!treasurePreview) {
      throw new Error('Expected treasure preview');
    }

    feed = resolvePreview(
      feed,
      treasurePreview.targetId ?? treasurePreview.id,
      1
    );

    const treasureEvent = findOutcomeEvent(feed.outcome, 'treasure');
    expect(treasureEvent?.roll).toBe(1);

    const protectionPreview = findPreview(
      renderDetail(feed),
      'treasureProtectionType'
    );
    expect(protectionPreview?.context).toEqual({
      kind: 'treasureProtection',
      treasureRoll: 1,
    });
  });

  test('resolved treasure protection preview reroll stays feature-owned', () => {
    let feed = createFeedSnapshot({
      action: 'passage',
      roll: 14,
      detailMode: true,
      dungeonLevel: 4,
    });

    feed = resolvePendingPreview(feed, 'chamberDimensions', 5);
    feed = resolvePendingPreview(feed, 'chamberRoomContents', 20);
    feed = resolvePendingPreview(feed, 'treasure', 99);
    feed = resolvePendingPreview(feed, 'treasureProtectionType', 9);

    const protectionPreview = findPreview(
      renderDetail(feed),
      'treasureProtectionType'
    );
    expect(protectionPreview?.context).toEqual({
      kind: 'treasureProtection',
      treasureRoll: 9,
    });

    if (!protectionPreview) {
      throw new Error('Expected treasure protection preview');
    }

    feed = resolvePreview(
      feed,
      protectionPreview.targetId ?? protectionPreview.id,
      1
    );

    const pendingTables = collectPendingTables(feed.outcome);
    expect(pendingTables).toContain('treasureProtectionGuardedBy');
    expect(pendingTables).not.toContain('treasureProtectionHiddenBy');
  });

  test('resolved treasure potion preview reroll preserves treasure magic context', () => {
    let feed = createFeedSnapshot({
      action: 'passage',
      roll: 14,
      detailMode: true,
      dungeonLevel: 4,
    });

    feed = resolvePendingPreview(feed, 'chamberDimensions', 5);
    feed = resolvePendingPreview(feed, 'chamberRoomContents', 20);
    feed = resolvePendingPreview(feed, 'treasure', 99);
    feed = resolvePendingPreview(feed, 'treasureMagicCategory', 2);
    feed = resolvePendingPreview(feed, 'treasurePotion', 2);

    const potionPreview = findPreview(renderDetail(feed), 'treasurePotion');
    expect(potionPreview?.context).toEqual({
      kind: 'treasureMagic',
      level: 4,
      treasureRoll: 2,
      rollIndex: 1,
    });

    if (!potionPreview) {
      throw new Error('Expected treasure potion preview');
    }

    feed = resolvePreview(feed, potionPreview.targetId ?? potionPreview.id, 50);

    const potionEvent = findOutcomeEvent(feed.outcome, 'treasurePotion');
    expect(potionEvent).toBeDefined();
    if (potionEvent?.event.kind === 'treasurePotion') {
      expect(potionEvent.event.result).toBe(TreasurePotion.HumanControl);
    }

    const pendingTables = collectPendingTables(feed.outcome);
    expect(pendingTables).toContain('treasurePotionHumanControl');
    expect(pendingTables).not.toContain('treasurePotionAnimalControl');
  });

  test('resolved treasure scroll preview reroll preserves treasure magic context', () => {
    let feed = createFeedSnapshot({
      action: 'passage',
      roll: 14,
      detailMode: true,
      dungeonLevel: 4,
    });

    feed = resolvePendingPreview(feed, 'chamberDimensions', 5);
    feed = resolvePendingPreview(feed, 'chamberRoomContents', 20);
    feed = resolvePendingPreview(feed, 'treasure', 99);
    feed = resolvePendingPreview(feed, 'treasureMagicCategory', 21);
    feed = resolvePendingPreview(feed, 'treasureScroll', 65);

    const scrollPreview = findPreview(renderDetail(feed), 'treasureScroll');
    expect(scrollPreview?.context).toEqual({
      kind: 'treasureMagic',
      level: 4,
      treasureRoll: 21,
      rollIndex: 1,
    });

    if (!scrollPreview) {
      throw new Error('Expected treasure scroll preview');
    }

    feed = resolvePreview(feed, scrollPreview.targetId ?? scrollPreview.id, 72);

    const scrollEvent = findOutcomeEvent(feed.outcome, 'treasureScroll');
    expect(scrollEvent).toBeDefined();
    if (scrollEvent?.event.kind === 'treasureScroll') {
      expect(scrollEvent.event.result).toBe(
        TreasureScroll.ProtectionLycanthropes
      );
    }

    const pendingTables = collectPendingTables(feed.outcome);
    expect(pendingTables).toContain('treasureScrollProtectionLycanthropes');
    expect(pendingTables).not.toContain('treasureScrollProtectionElementals');
  });

  test('resolved treasure ring preview reroll preserves treasure magic context', () => {
    let feed = createFeedSnapshot({
      action: 'passage',
      roll: 14,
      detailMode: true,
      dungeonLevel: 4,
    });

    feed = resolvePendingPreview(feed, 'chamberDimensions', 5);
    feed = resolvePendingPreview(feed, 'chamberRoomContents', 20);
    feed = resolvePendingPreview(feed, 'treasure', 99);
    feed = resolvePendingPreview(feed, 'treasureMagicCategory', 36);
    feed = resolvePendingPreview(feed, 'treasureRing', 45);

    const ringPreview = findPreview(renderDetail(feed), 'treasureRing');
    expect(ringPreview?.context).toEqual({
      kind: 'treasureMagic',
      level: 4,
      treasureRoll: 36,
      rollIndex: 1,
    });

    if (!ringPreview) {
      throw new Error('Expected treasure ring preview');
    }

    feed = resolvePreview(feed, ringPreview.targetId ?? ringPreview.id, 1);

    const ringEvent = findOutcomeEvent(feed.outcome, 'treasureRing');
    expect(ringEvent).toBeDefined();
    if (ringEvent?.event.kind === 'treasureRing') {
      expect(ringEvent.event.result).toBe(TreasureRing.Contrariness);
    }

    const pendingTables = collectPendingTables(feed.outcome);
    expect(pendingTables).toContain('treasureRingContrariness');
    expect(pendingTables).not.toContain('treasureRingProtection');
  });

  test('resolved armor and shields preview reroll preserves treasure magic context', () => {
    let feed = createFeedSnapshot({
      action: 'passage',
      roll: 14,
      detailMode: true,
      dungeonLevel: 4,
    });

    feed = resolvePendingPreview(feed, 'chamberDimensions', 5);
    feed = resolvePendingPreview(feed, 'chamberRoomContents', 20);
    feed = resolvePendingPreview(feed, 'treasure', 99);
    feed = resolvePendingPreview(feed, 'treasureMagicCategory', 61);
    feed = resolvePendingPreview(feed, 'treasureArmorShields', 1);

    const armorPreview = findPreview(
      renderDetail(feed),
      'treasureArmorShields'
    );
    expect(armorPreview?.context).toEqual({
      kind: 'treasureMagic',
      level: 4,
      treasureRoll: 61,
      rollIndex: 1,
    });

    if (!armorPreview) {
      throw new Error('Expected treasure armor and shields preview');
    }

    feed = resolvePreview(feed, armorPreview.targetId ?? armorPreview.id, 98);

    const armorEvent = findOutcomeEvent(feed.outcome, 'treasureArmorShields');
    expect(armorEvent).toBeDefined();
    if (armorEvent?.event.kind === 'treasureArmorShields') {
      expect(armorEvent.event.result).toBe(
        TreasureArmorShield.ShieldMinus1MissileAttractor
      );
    }
  });

  test('resolved miscellaneous weapons preview reroll preserves treasure magic context', () => {
    let feed = createFeedSnapshot({
      action: 'passage',
      roll: 14,
      detailMode: true,
      dungeonLevel: 4,
    });

    feed = resolvePendingPreview(feed, 'chamberDimensions', 5);
    feed = resolvePendingPreview(feed, 'chamberRoomContents', 20);
    feed = resolvePendingPreview(feed, 'treasure', 99);
    feed = resolvePendingPreview(feed, 'treasureMagicCategory', 87);
    feed = resolvePendingPreview(feed, 'treasureMiscWeapons', 1);

    const miscPreview = findPreview(renderDetail(feed), 'treasureMiscWeapons');
    expect(miscPreview?.context).toEqual({
      kind: 'treasureMagic',
      level: 4,
      treasureRoll: 87,
      rollIndex: 1,
    });

    if (!miscPreview) {
      throw new Error('Expected treasure miscellaneous weapons preview');
    }

    feed = resolvePreview(feed, miscPreview.targetId ?? miscPreview.id, 100);

    const miscEvent = findOutcomeEvent(feed.outcome, 'treasureMiscWeapons');
    expect(miscEvent).toBeDefined();
    if (miscEvent?.event.kind === 'treasureMiscWeapons') {
      expect(miscEvent.event.result.item).toBe(TreasureMiscWeapon.TridentPlus3);
    }
  });

  test('resolved swords preview reroll preserves treasure magic context', () => {
    let feed = createFeedSnapshot({
      action: 'passage',
      roll: 14,
      detailMode: true,
      dungeonLevel: 4,
    });

    feed = resolvePendingPreview(feed, 'chamberDimensions', 5);
    feed = resolvePendingPreview(feed, 'chamberRoomContents', 20);
    feed = resolvePendingPreview(feed, 'treasure', 99);
    feed = resolvePendingPreview(feed, 'treasureMagicCategory', 76);
    feed = resolvePendingPreview(feed, 'treasureSwords', 1);

    const swordsPreview = findPreview(renderDetail(feed), 'treasureSwords');
    expect(swordsPreview?.context).toEqual({
      kind: 'treasureMagic',
      level: 4,
      treasureRoll: 76,
      rollIndex: 1,
    });

    if (!swordsPreview) {
      throw new Error('Expected swords preview');
    }

    feed = resolvePreview(feed, swordsPreview.targetId ?? swordsPreview.id, 80);

    const swordEvent = findOutcomeEvent(feed.outcome, 'treasureSwords');
    expect(swordEvent).toBeDefined();
    if (swordEvent?.event.kind === 'treasureSwords') {
      expect(swordEvent.event.result).toBe(TreasureSword.SwordPlus5HolyAvenger);
    }

    const pendingTables = collectPendingTables(feed.outcome);
    expect(pendingTables).toContain('treasureSwordKind');
    expect(pendingTables).toContain('treasureSwordUnusual');
    expect(findPreview(renderDetail(feed), 'treasureSwordAlignment')).toBe(
      undefined
    );
  });

  test('resolved sword unusual reroll preserves sword context and alignment preview', () => {
    let feed = createFeedSnapshot({
      action: 'passage',
      roll: 14,
      detailMode: true,
      dungeonLevel: 4,
    });

    feed = resolvePendingPreview(feed, 'chamberDimensions', 5);
    feed = resolvePendingPreview(feed, 'chamberRoomContents', 20);
    feed = resolvePendingPreview(feed, 'treasure', 99);
    feed = resolvePendingPreview(feed, 'treasureMagicCategory', 76);
    feed = resolvePendingPreview(feed, 'treasureSwords', 1);
    feed = resolvePendingPreview(feed, 'treasureSwordKind', 80);
    feed = resolvePendingPreview(feed, 'treasureSwordUnusual', 1);

    const unusualPreview = findPreview(
      renderDetail(feed),
      'treasureSwordUnusual'
    );
    expect(unusualPreview?.context).toEqual({
      kind: 'treasureSword',
      sword: TreasureSword.SwordPlus1,
      rollIndex: 1,
    });

    if (!unusualPreview) {
      throw new Error('Expected sword unusual preview');
    }

    feed = resolvePreview(
      feed,
      unusualPreview.targetId ?? unusualPreview.id,
      80
    );

    const unusualEvent = findOutcomeEvent(feed.outcome, 'treasureSwordUnusual');
    expect(unusualEvent).toBeDefined();
    if (unusualEvent?.event.kind === 'treasureSwordUnusual') {
      expect(unusualEvent.event.result.variant).toBe(
        TreasureSwordUnusual.Intelligence12
      );
    }

    const alignmentPreview = findPreview(
      renderDetail(feed),
      'treasureSwordAlignment'
    );
    expect(alignmentPreview).toBeDefined();

    const pendingTables = collectPendingTables(feed.outcome);
    expect(pendingTables).toContain('treasureSwordAlignment');
    expect(pendingTables).toContain('treasureSwordPrimaryAbility');
  });

  test('resolved sword primary ability preview reroll stays feature-owned', () => {
    let feed = createFeedSnapshot({
      action: 'passage',
      roll: 14,
      detailMode: true,
      dungeonLevel: 4,
    });

    feed = resolvePendingPreview(feed, 'chamberDimensions', 5);
    feed = resolvePendingPreview(feed, 'chamberRoomContents', 20);
    feed = resolvePendingPreview(feed, 'treasure', 99);
    feed = resolvePendingPreview(feed, 'treasureMagicCategory', 76);
    feed = resolvePendingPreview(feed, 'treasureSwords', 15);
    feed = resolvePendingPreview(feed, 'treasureSwordKind', 5);
    feed = resolvePendingPreview(feed, 'treasureSwordUnusual', 78);
    feed = resolvePendingPreview(feed, 'treasureSwordPrimaryAbility', 5);

    const abilityPreview = findPreview(
      renderDetail(feed),
      'treasureSwordPrimaryAbility'
    );
    expect(abilityPreview).toBeDefined();
    expect(abilityPreview?.autoCollapse).toBe(true);

    if (!abilityPreview) {
      throw new Error('Expected sword primary ability preview');
    }

    feed = resolvePreview(
      feed,
      abilityPreview.targetId ?? abilityPreview.id,
      93
    );

    const rerolledAbilityPreview = findPreview(
      renderDetail(feed),
      'treasureSwordPrimaryAbility'
    );
    expect(rerolledAbilityPreview).toBeDefined();
    expect(rerolledAbilityPreview?.autoCollapse).toBe(true);

    const restrictedPreview = findPreview(
      renderDetail(feed),
      'treasureSwordPrimaryAbilityRestricted'
    );
    expect(restrictedPreview).toBeDefined();

    const pendingTables = collectPendingTables(feed.outcome);
    expect(pendingTables).toContain('treasureSwordPrimaryAbilityRestricted');
  });

  test('resolved rod staff wand preview reroll remains feature-owned', () => {
    let feed = createFeedSnapshot({
      action: 'passage',
      roll: 14,
      detailMode: true,
      dungeonLevel: 4,
    });

    feed = resolvePendingPreview(feed, 'chamberDimensions', 5);
    feed = resolvePendingPreview(feed, 'chamberRoomContents', 20);
    feed = resolvePendingPreview(feed, 'treasure', 99);
    feed = resolvePendingPreview(feed, 'treasureMagicCategory', 41);
    feed = resolvePendingPreview(feed, 'treasureRodStaffWand', 1);

    const rodPreview = findPreview(renderDetail(feed), 'treasureRodStaffWand');
    expect(rodPreview).toBeDefined();

    if (!rodPreview) {
      throw new Error('Expected rod staff wand preview');
    }

    feed = resolvePreview(feed, rodPreview.targetId ?? rodPreview.id, 25);

    const rodEvent = findOutcomeEvent(feed.outcome, 'treasureRodStaffWand');
    expect(rodEvent).toBeDefined();
    if (rodEvent?.event.kind === 'treasureRodStaffWand') {
      expect(rodEvent.event.result).toBe(TreasureRodStaffWand.StaffSerpent);
    }

    const pendingTables = collectPendingTables(feed.outcome);
    expect(pendingTables).toContain('treasureStaffSerpent');
  });

  test('resolved miscellaneous magic preview reroll preserves treasure magic context', () => {
    let feed = createFeedSnapshot({
      action: 'passage',
      roll: 14,
      detailMode: true,
      dungeonLevel: 4,
    });

    feed = resolvePendingPreview(feed, 'chamberDimensions', 5);
    feed = resolvePendingPreview(feed, 'chamberRoomContents', 20);
    feed = resolvePendingPreview(feed, 'treasure', 99);
    feed = resolvePendingPreview(feed, 'treasureMagicCategory', 52);
    feed = resolvePendingPreview(feed, 'treasureMiscMagicE3', 1);

    const miscPreview = findPreview(renderDetail(feed), 'treasureMiscMagicE3');
    expect(miscPreview?.context).toEqual({
      kind: 'treasureMagic',
      level: 4,
      treasureRoll: 52,
      rollIndex: 1,
    });

    if (!miscPreview) {
      throw new Error('Expected miscellaneous magic preview');
    }

    feed = resolvePreview(feed, miscPreview.targetId ?? miscPreview.id, 54);

    const pendingTables = collectPendingTables(feed.outcome);
    expect(pendingTables).toContain('treasureHornOfValhallaType');
    expect(pendingTables).not.toContain('treasureFigurineOfWondrousPower');
  });

  test('resolved horn of valhalla preview reroll preserves treasure magic context', () => {
    let feed = createFeedSnapshot({
      action: 'passage',
      roll: 14,
      detailMode: true,
      dungeonLevel: 4,
    });

    feed = resolvePendingPreview(feed, 'chamberDimensions', 5);
    feed = resolvePendingPreview(feed, 'chamberRoomContents', 20);
    feed = resolvePendingPreview(feed, 'treasure', 99);
    feed = resolvePendingPreview(feed, 'treasureMagicCategory', 52);
    feed = resolvePendingPreview(feed, 'treasureMiscMagicE3', 54);
    feed = resolvePendingPreview(feed, 'treasureHornOfValhallaType', 1);

    const hornPreview = findPreview(
      renderDetail(feed),
      'treasureHornOfValhallaType'
    );
    expect(hornPreview?.context).toEqual({
      kind: 'treasureMagic',
      level: 4,
      treasureRoll: 52,
      rollIndex: 1,
    });

    if (!hornPreview) {
      throw new Error('Expected horn of valhalla preview');
    }

    feed = resolvePreview(feed, hornPreview.targetId ?? hornPreview.id, 20);

    const pendingTables = collectPendingTables(feed.outcome);
    expect(pendingTables).toContain('treasureHornOfValhallaAttunement');
  });
});

function pickRollForDoorBeyond(cmd: DoorBeyond): number {
  const entry = doorBeyond.entries.find(
    (candidate) => candidate.command === cmd
  );
  if (!entry) throw new Error('No entry for command');
  return entry.range[0];
}

function findOutcomeEvent(
  node: OutcomeEventNode | undefined,
  kind: OutcomeEvent['kind']
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

function collectPendingTables(node: OutcomeEventNode | undefined): string[] {
  if (!node || node.type !== 'event' || !node.children) return [];
  const pending: string[] = [];
  for (const child of node.children) {
    if (child.type === 'pending-roll') {
      pending.push(child.table);
      continue;
    }
    pending.push(...collectPendingTables(child));
  }
  return pending;
}

function findPreview(
  nodes: DungeonRenderNode[],
  id: string
): DungeonTablePreview | undefined {
  return nodes.find(
    (node): node is DungeonTablePreview =>
      node.kind === 'table-preview' && node.id === id
  );
}
