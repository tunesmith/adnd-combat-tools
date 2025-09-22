import {
  createFeedSnapshot,
  renderDetail,
  resolvePendingPreview,
} from '../../../support/dungeon/uiPreviewHarness';
import type { DungeonTablePreview } from '../../../../types/dungeon';

it.skip('logs detail nodes after rolling 3 then 13', () => {
  let feed = createFeedSnapshot({
    action: 'passage',
    roll: 3,
    detailMode: true,
    dungeonLevel: 1,
  });

  const detailAfter3 = renderDetail(feed);
  const doorPreview = detailAfter3.find(
    (node): node is DungeonTablePreview =>
      node.kind === 'table-preview' && node.title === 'Door Location'
  );
  expect(doorPreview?.targetId ?? doorPreview?.id).toBe(
    'root.periodicCheck.0.doorLocation:0'
  );

  feed = resolvePendingPreview(feed, 'doorLocation', 13);
  const detailAfter13 = renderDetail(feed);
  const collapsedDoorPreview = detailAfter13.find(
    (node): node is DungeonTablePreview =>
      node.kind === 'table-preview' && node.title === 'Door Location'
  );
  void collapsedDoorPreview;
  void detailAfter13;
  // inspect detailAfter13 here – e.g. look for headings/paragraphs/previews
});
