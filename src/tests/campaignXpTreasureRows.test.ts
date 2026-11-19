import {
  parseCampaign,
  serializeCampaign,
  validateHistoryTransition,
} from '../helpers/campaignDocument';
import {
  resolveXpReward,
  saveXpReward,
  saveXpPoint,
  newXpPoint,
  selectXpRewards,
  previewXpAward,
  confirmXpAward,
  beginXpCorrection,
  xpEvidenceDuplicates,
  saveXpOpening,
  rewardSettlement,
  stageXpAward,
} from '../helpers/campaignXp';
import {
  newXpReward,
  captureTreasurePossession,
  possessionXpCandidates,
} from '../helpers/campaignXpSources';
import {
  newTreasureRow,
  treasureSubtotal,
} from '../helpers/campaignXpTreasure';
import { startWorkingInventory } from '../helpers/campaignWorkingInventory';
import { updatePartyProfile } from '../helpers/campaignParty';
import type { XpReward, XpTreasureRow } from '../helpers/campaignXpModel';
import { xpCampaign, xpAt } from './fixtures/xpCampaign';
import { storageInventory } from './fixtures/storageInventory';

function required<T>(value: T | undefined): T {
  if (value === undefined) throw Error('Missing treasure fixture');
  return value;
}
function fixture() {
  let doc = xpCampaign();
  const existing = required(doc.party?.profiles[0]);
  doc = updatePartyProfile(
    doc,
    { ...existing, characterId: 'sixth', sessionId: 'session-1' },
    { id: 'sixth', name: 'Sixth', player: '', notes: '' }
  );
  doc = saveXpOpening(doc, {
    id: 'opening-sixth',
    characterId: 'sixth',
    sessionId: 'session-1',
    balance: 0,
    reason: 'Fixture',
  });
  const gear = storageInventory();
  const holder = required(gear.characters[0]),
    bottle = required(
      gear.storageLocations[0]?.inventory.find((i) => i.id === 'scroll')
    );
  holder.inventory = Array.from({ length: 7 }, (_, i) => ({
    ...bottle,
    id: 'bottle-' + i,
    name: 'Bottle ' + (i + 1),
    containerId: null,
    quantity: i === 3 ? 2 : 1,
    valueGpOverride: 150,
  }));
  doc = startWorkingInventory(
    doc,
    'session-1',
    gear,
    { kind: 'empty' },
    'gear',
    'unused',
    xpAt
  );
  const items = possessionXpCandidates(doc, 'session-1').filter((c) =>
    c.item.id.startsWith('bottle-')
  );
  const rows = items.map(
    (item, i): XpTreasureRow => ({
      ...captureTreasurePossession(
        newTreasureRow('row-' + i),
        item,
        'session-1'
      ),
      disposition: 'keep',
      retainedXp: String([250, 0, 200, 200, 200, 200, 0][i]),
    })
  );
  const base = newXpReward(doc, 'session-1', 'gnoll-pack', 'treasure');
  const reward: XpReward = {
    ...base,
    title: 'Gnoll pack',
    input: { category: 'treasure', rows },
    ratio: { ...base.ratio, proposed: '6/7' },
    recipients: base.recipients.map((c) => ({
      ...c,
      eligible: true,
      participated: true,
    })),
  };
  return { doc, rows, items, reward };
}
test('seven linked bottles settle together and a correction preserves the original item decisions', () => {
  const { doc, rows, reward } = fixture();
  const kept = resolveXpReward(reward);
  expect(kept.raw).toBe('1050');
  expect(kept.allocations.map((a) => a.calculated)).toEqual(
    Array(6).fill('150')
  );
  const mixed = rows.map(
    (r, i): XpTreasureRow =>
      i === 2
        ? { ...r, disposition: 'sell', proceeds: '400' }
        : i === 0 || i === 6
        ? r
        : { ...r, disposition: 'defer' }
  );
  const input = { category: 'treasure' as const, rows: mixed };
  let current = parseCampaign(
    serializeCampaign(saveXpReward(doc, { ...reward, input }))
  );
  expect(current.xp?.rewards.at(-1)?.input).toEqual(input);
  expect(treasureSubtotal(mixed)).toEqual({
    subtotal: '650',
    deferred: 4,
    missing: 0,
  });
  const point = newXpPoint(current, 'session-1', 'camp');
  expect(
    stageXpAward(
      current,
      { ...point, rewardIds: [reward.id] },
      {}
    ).xp?.points.at(-1)?.rewardIds
  ).toEqual([]);
  expect(() =>
    resolveXpReward({
      ...reward,
      input,
      rawOverride: { amount: '650', reason: 'Preview' },
    })
  ).toThrow(/pending/);
  expect(rewardSettlement(current, reward.id)).toBeUndefined();
  current = saveXpReward(current, { ...reward, version: 2 });
  current = selectXpRewards(saveXpPoint(current, point), point.id, [reward.id]);
  const preview = previewXpAward(current, point.id);
  expect(preview.rows.map((r) => r.base)).toEqual(Array(6).fill('150'));
  const confirmed = confirmXpAward(
    current,
    point.id,
    preview.fingerprint,
    'award',
    xpAt
  );
  validateHistoryTransition(current, confirmed, '');
  current = beginXpCorrection(
    parseCampaign(serializeCampaign(confirmed)),
    'award',
    'correction'
  );
  const correctedRows = rows.map(
    (r, i): XpTreasureRow =>
      i === 2 ? { ...r, disposition: 'sell', proceeds: '400' } : r
  );
  current = saveXpReward(
    current,
    {
      ...reward,
      version: 3,
      input: { category: 'treasure', rows: correctedRows },
    },
    'correction'
  );
  const update = previewXpAward(current, 'correction');
  const revised = confirmXpAward(
    current,
    'correction',
    update.fingerprint,
    'revision',
    xpAt,
    true
  );
  validateHistoryTransition(current, revised, '');
  const history = parseCampaign(serializeCampaign(revised)).xp?.events;
  expect(history?.[0]).toEqual(confirmed.xp?.events[0]);
  expect(history?.[1]?.rewards[0]?.input).toEqual({
    category: 'treasure',
    rows: correctedRows,
  });
  expect(revised.workingInventories).toEqual(doc.workingInventories);
  expect(revised.banking).toEqual(doc.banking);
});
test('each lot has its own evidence and selling needs actual proceeds, including an explicit zero', () => {
  const { doc, rows, items, reward } = fixture();
  expect(rows[3]?.marketGp).toBe('300');
  const saved = saveXpReward(doc, reward);
  expect(
    possessionXpCandidates(saved, 'session-1').filter((i) => i.captured)
  ).toHaveLength(7);
  const row = required(rows[3]);
  const older: XpReward = {
    ...reward,
    id: 'legacy',
    evidence: required(row.evidence ?? undefined),
    input: {
      category: 'treasure',
      disposition: 'sell',
      proceeds: null,
      marketGp: '300',
      retainedXp: null,
    },
  };
  expect(xpEvidenceDuplicates(saved, older).map((r) => r.id)).toEqual([
    reward.id,
  ]);
  expect(
    xpEvidenceDuplicates(saveXpReward(doc, older), reward).map((r) => r.id)
  ).toEqual(['legacy']);
  expect(() =>
    saveXpReward(doc, {
      ...reward,
      input: { category: 'treasure', rows: [row, { ...row, id: 'different' }] },
    })
  ).toThrow(/same Gear lot/);
  const sale = { ...row, disposition: 'sell' as const };
  expect(treasureSubtotal([sale])).toEqual({
    subtotal: '0',
    deferred: 0,
    missing: 1,
  });
  expect(treasureSubtotal([{ ...sale, proceeds: '0' }])).toEqual({
    subtotal: '0',
    deferred: 0,
    missing: 0,
  });
  const refreshed = captureTreasurePossession(
    { ...sale, label: 'Grey bottle', proceeds: '0' },
    { ...required(items[3]), gp: '350' },
    'session-1'
  );
  expect(refreshed).toMatchObject({
    id: row.id,
    label: 'Grey bottle',
    disposition: 'sell',
    proceeds: '0',
    marketGp: '350',
    retainedXp: '200',
  });
});
