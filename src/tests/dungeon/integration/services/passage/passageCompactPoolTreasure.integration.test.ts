import {
  createFeedSnapshot,
  resolvePendingPreview,
  resolvePreview,
  listPendingPreviewTargets,
  renderCompact,
} from '../../../../support/dungeon/uiPreviewHarness';
import type { DungeonRenderNode } from '../../../../../types/dungeon';

describe('passage compact pool treasure handling', () => {
  it('describes pool treasure in compact output', () => {
    let feed = createFeedSnapshot({
      action: 'passage',
      roll: 14,
      detailMode: true,
      dungeonLevel: 1,
    });

    feed = resolvePendingPreview(feed, 'chamberDimensions', 20);
    feed = resolvePendingPreview(feed, 'unusualShape', 1);
    feed = resolvePendingPreview(feed, 'unusualSize', 11);
    feed = resolvePendingPreview(feed, 'numberOfExits', 8);

    for (let zeroIndex = 0; zeroIndex < 4; zeroIndex += 1) {
      const locationSuffix = `numberOfExits.${zeroIndex}.passageExitLocation`;
      const locationTarget = listPendingPreviewTargets(feed).find((target) =>
        target.endsWith(locationSuffix)
      );
      if (!locationTarget)
        throw new Error(
          `missing passage exit location for index ${zeroIndex + 1}`
        );
      feed = resolvePreview(feed, locationTarget, 1);

      const directionSuffix = `${locationSuffix}.0.exitDirection`;
      const directionTarget = listPendingPreviewTargets(feed).find((target) =>
        target.endsWith(directionSuffix)
      );
      if (!directionTarget)
        throw new Error(`missing exit direction for index ${zeroIndex + 1}`);
      feed = resolvePreview(feed, directionTarget, 1);

      const alternativeSuffix = `${locationSuffix}.1.exitAlternative`;
      const alternativeTarget = listPendingPreviewTargets(feed).find((target) =>
        target.endsWith(alternativeSuffix)
      );
      if (!alternativeTarget)
        throw new Error(`missing exit alternative for index ${zeroIndex + 1}`);
      const altRoll = zeroIndex === 2 ? 7 : 11;
      feed = resolvePreview(feed, alternativeTarget, altRoll);
    }

    feed = resolvePendingPreview(feed, 'chamberRoomContents', 5);
    feed = resolvePendingPreview(feed, 'circularContents', 1);
    feed = resolvePendingPreview(feed, 'circularPool', 14);

    const monsterLevelTarget = listPendingPreviewTargets(feed).find((target) =>
      target.split('.').pop()?.startsWith('monsterLevel')
    );
    if (!monsterLevelTarget) throw new Error('missing monster level target');
    feed = resolvePreview(feed, monsterLevelTarget, 18);

    const monsterTargets = listPendingPreviewTargets(feed).filter((target) =>
      target.split('.').pop()?.startsWith('monsterTwo')
    );
    expect(monsterTargets).toHaveLength(1);
    const monsterTarget = monsterTargets[0];
    if (!monsterTarget) throw new Error('missing monster target');
    feed = resolvePreview(feed, monsterTarget, 95);

    const treasureTargets = listPendingPreviewTargets(feed)
      .filter((target) => target.split('.').pop() === 'treasure')
      .sort();
    expect(treasureTargets).toHaveLength(2);

    const firstTreasureTarget = treasureTargets[0];
    if (!firstTreasureTarget) throw new Error('missing first treasure target');
    feed = resolvePreview(feed, firstTreasureTarget, 75);

    let containerTarget = listPendingPreviewTargets(feed).find((target) =>
      target.split('.').pop()?.startsWith('treasureContainer')
    );
    if (!containerTarget)
      throw new Error('missing first treasure container target');
    feed = resolvePreview(feed, containerTarget, 1);

    let protectionTarget = listPendingPreviewTargets(feed).find((target) =>
      target.split('.').pop()?.startsWith('treasureProtectionType')
    );
    if (!protectionTarget)
      throw new Error('missing first treasure protection target');
    feed = resolvePreview(feed, protectionTarget, 12);

    const hiddenTarget = listPendingPreviewTargets(feed).find((target) =>
      target.split('.').pop()?.startsWith('treasureProtectionHiddenBy')
    );
    if (!hiddenTarget) throw new Error('missing hidden protection target');
    feed = resolvePreview(feed, hiddenTarget, 9);

    const remainingTreasureTargets = listPendingPreviewTargets(feed)
      .filter((target) => target.split('.').pop() === 'treasure')
      .sort();
    expect(remainingTreasureTargets).toHaveLength(1);
    const secondTreasureTarget = remainingTreasureTargets[0];
    if (!secondTreasureTarget)
      throw new Error('missing second treasure target');
    feed = resolvePreview(feed, secondTreasureTarget, 60);

    containerTarget = listPendingPreviewTargets(feed).find((target) =>
      target.split('.').pop()?.startsWith('treasureContainer')
    );
    if (!containerTarget)
      throw new Error('missing second treasure container target');
    feed = resolvePreview(feed, containerTarget, 10);

    protectionTarget = listPendingPreviewTargets(feed).find((target) =>
      target.split('.').pop()?.startsWith('treasureProtectionType')
    );
    if (!protectionTarget)
      throw new Error('missing second treasure protection target');
    feed = resolvePreview(feed, protectionTarget, 5);

    const guardedTarget = listPendingPreviewTargets(feed).find((target) =>
      target.split('.').pop()?.startsWith('treasureProtectionGuardedBy')
    );
    if (!guardedTarget) throw new Error('missing guarded protection target');
    feed = resolvePreview(feed, guardedTarget, 6);

    const compactText = collectParagraphText(renderCompact(feed))
      .toLowerCase()
      .replace(/\s+/g, ' ');

    expect(compactText).toContain('there are 100 platinum pieces here.');
    expect(compactText).toContain('the treasure is contained in bags.');
    expect(compactText).toContain(
      'if desired, the treasure is hidden inside an ordinary item in plain view.'
    );
    expect(compactText).toContain('there are 250 gold pieces here.');
    expect(compactText).toContain('the treasure is contained in huge chests.');
    expect(compactText).toContain(
      'if desired, the treasure is guarded by poisoned needles in the lock.'
    );
  });
});

function collectParagraphText(nodes: readonly DungeonRenderNode[]): string {
  return nodes
    .filter(
      (
        node
      ): node is Extract<typeof node, { kind: 'paragraph'; text: string }> =>
        node.kind === 'paragraph'
    )
    .map((node) => node.text.trim())
    .join(' ');
}
