import { parseCampaign, serializeCampaign } from '../helpers/campaignDocument';
import {
  confirmXpAward,
  previewXpAward,
  resolveXpReward,
} from '../helpers/campaignXp';
import type { XpReward } from '../helpers/campaignXpModel';
import { xpCastleDraft, xpAt } from './fixtures/xpCampaign';

function fileWith(input: unknown) {
  const doc = xpCastleDraft();
  if (!doc.xp) throw Error('Missing XP ledger');
  return JSON.stringify({
    ...doc,
    xp: {
      ...doc.xp,
      version: 2,
      rewards: doc.xp.rewards.map((r) =>
        r.id === 'scroll' ? { ...r, input } : r
      ),
    },
  });
}
function scrollInput(text: string) {
  const reward = parseCampaign(text).xp?.rewards.find((r) => r.id === 'scroll');
  if (reward?.input.category !== 'treasure') throw Error('Missing treasure');
  return reward.input;
}
test.each([
  ['2500', null, '2500'],
  [null, '2500', '2500'],
  ['0', null, '0'],
  [null, '0', '0'],
  [null, null, null],
  ['1/2', '0.500', '0.500'],
  [undefined, null, null],
])(
  'upgrades single-item GP amounts %s and %s to %s',
  (marketGp, proceeds, gp) => {
    const file = fileWith({
      category: 'treasure',
      retainedXp: '400',
      disposition: 'defer',
      marketGp,
      proceeds,
    });
    expect(scrollInput(file)).toEqual({
      category: 'treasure',
      rows: [
        {
          id: 'first',
          label: 'Kept warding scroll',
          evidence: null,
          retainedXp: '400',
          disposition: 'defer',
          gp,
        },
      ],
    });
    expect(() => parseCampaign(file, 'edit')).toThrow();
  }
);
test('reports differing old amounts with the item identity, including a zero conflicting with a positive price', () => {
  const file = fileWith({
    category: 'treasure',
    rows: [
      {
        id: 'ring',
        label: 'Elf-sized ring mail',
        evidence: null,
        retainedXp: '400',
        disposition: 'sell',
        marketGp: '2500',
        proceeds: '0',
      },
    ],
  });
  expect(() => parseCampaign(file)).toThrow(
    /xp.rewards.*Elf-sized ring mail.*2500 gp.*0 gp/
  );
});
test('normalizes frozen rewards and point overrides at open, preserves row IDs and evidence, and replays a confirmed award', () => {
  const draft = xpCastleDraft(),
    pointId = 'refuge-point',
    preview = previewXpAward(draft, pointId);
  const doc = confirmXpAward(
    draft,
    pointId,
    preview.fingerprint,
    'award',
    xpAt
  );
  if (!doc.xp) throw Error('Missing XP');
  const source = doc.xp.rewards.find((r) => r.id === 'scroll');
  if (!source) throw Error('Missing treasure');
  function legacy(r: XpReward) {
    if (r.input.category !== 'treasure') return r;
    return {
      ...r,
      input: {
        category: 'treasure',
        rows: r.input.rows.map(({ gp, ...row }) => ({
          ...row,
          marketGp: gp,
          proceeds: null,
        })),
      },
    };
  }
  const old = legacy(source);
  const file = JSON.stringify({
    ...doc,
    xp: {
      ...doc.xp,
      version: 2,
      rewards: doc.xp.rewards.map(legacy),
      points: doc.xp.points.map((p) => ({ ...p, rewardOverrides: [old] })),
      events: doc.xp.events.map((e) => ({
        ...e,
        rewards: e.rewards.map(legacy),
        point: { ...e.point, rewardOverrides: [old] },
      })),
    },
  });
  const converted = parseCampaign(file),
    event = converted.xp?.events[0];
  expect(event?.rows).toEqual(doc.xp.events[0]?.rows);
  expect(event?.resolutions).toEqual(doc.xp.events[0]?.resolutions);
  expect(event?.rewards).toEqual(doc.xp.events[0]?.rewards);
  expect(event?.point.rewardOverrides).toEqual([source]);
  expect(converted.xp?.points[0]?.rewardOverrides).toEqual([source]);
  const saved = serializeCampaign(converted);
  expect(saved).not.toMatch(/"(?:marketGp|proceeds)"\s*:/);
  expect(serializeCampaign(parseCampaign(saved))).toBe(saved);
});
test('a converted draft gives identical award fingerprints on reopen and rejects a stale price preview', () => {
  const doc = parseCampaign(
    fileWith({
      category: 'treasure',
      disposition: 'sell',
      retainedXp: '400',
      marketGp: null,
      proceeds: '2500',
    })
  );
  const preview = previewXpAward(doc, 'refuge-point'),
    reopened = parseCampaign(serializeCampaign(doc));
  expect(previewXpAward(reopened, 'refuge-point').fingerprint).toBe(
    preview.fingerprint
  );
  const reward = reopened.xp?.rewards.find((r) => r.id === 'scroll');
  if (reward?.input.category !== 'treasure' || !reward.input.rows[0])
    throw Error('Missing treasure');
  expect(resolveXpReward(reward).raw).toBe('2500');
  reward.input.rows[0].gp = '2499';
  expect(() =>
    confirmXpAward(reopened, 'refuge-point', preview.fingerprint, 'stale', xpAt)
  ).toThrow(/changed/);
});
