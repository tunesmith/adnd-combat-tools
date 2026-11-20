import { xpCampaign } from './fixtures/xpCampaign';
import { syntheticCombat } from './fixtures/campaignB1';
import { storageInventory } from './fixtures/storageInventory';
import { createWorkingCombat } from '../helpers/campaignWorkingCombat';
import { startWorkingInventory } from '../helpers/campaignWorkingInventory';
import {
  startNextSession,
  sessionFingerprint,
} from '../helpers/campaignContinuity';
import {
  encounterXpCandidates,
  newXpReward,
  rewardFromEncounter,
  rewardFromPossession,
  possessionXpCandidates,
  refreshXpEvidence,
  xpEvidenceChanged,
} from '../helpers/campaignXpSources';
import { saveXpReward, xpEvidenceDuplicates } from '../helpers/campaignXp';
import { transferInventorySubtree } from '../helpers/encumbranceStorage';
function required<T>(value: T | undefined): T {
  if (value === undefined) throw Error('Fixture');
  return value;
}
test('encounter candidates deduplicate rounds/continuations, leave tracker category IDs unused, and require explicit campaign recipients', () => {
  const state = syntheticCombat();
  required(required(state.rounds[0]).enemies[0]).maxHp = '14';
  required(required(state.rounds[0]).enemyStates[0]).hp = '3';
  let doc = createWorkingCombat(
    xpCampaign(),
    'session-1',
    'Synthetic gate',
    state,
    { kind: 'empty' },
    'gate'
  );
  const candidates = encounterXpCandidates(doc, 'gate');
  expect(candidates).toHaveLength(3);
  let reward = rewardFromEncounter(
    doc,
    newXpReward(doc, 'session-1', 'gate-reward', 'monster'),
    'gate',
    [required(candidates[0]).key]
  );
  if (reward.input.category !== 'monster') throw Error('Fixture');
  expect(reward.input.monsters[0]).toMatchObject({
    hitDice: null,
    startingHp: '14',
  });
  expect(reward.recipients.every((r) => !r.eligible && !r.participated)).toBe(
    true
  );
  required(reward.input.monsters[0]).hitDice = '3';
  doc = saveXpReward(doc, reward);
  expect(xpEvidenceChanged(doc, reward)).toBe(false);
  const changed = JSON.parse(JSON.stringify(doc)) as typeof doc;
  required(
    required(required(changed.workingCombats[0]).state.rounds[0]).enemies[0]
  ).maxHp = '17';
  expect(xpEvidenceChanged(changed, reward)).toBe(true);
  const refreshed = refreshXpEvidence(changed, reward);
  expect(
    refreshed.input.category === 'monster' && refreshed.input.monsters[0]
  ).toMatchObject({ hitDice: '3', startingHp: '17' });
  expect(reward.input.monsters[0]?.startingHp).toBe('14');
  const next = startNextSession(doc, {
    campaignId: doc.id,
    sourceSessionId: 'session-1',
    sourceFingerprint: sessionFingerprint(doc, 'session-1'),
    destinationId: 'session-3',
    label: 'Continuation',
    combats: [
      {
        sourceId: 'gate',
        instanceId: 'gate-next',
        checkpointId: 'before-next',
      },
    ],
    inventory: null,
    copyNotes: false,
    capturedAt: '2026-11-07T12:00:00.000Z',
  });
  expect(encounterXpCandidates(next, 'gate-next')).toHaveLength(3);
  expect(encounterXpCandidates(next, 'gate-next')[0]?.captured).toBe(true);
  reward = rewardFromEncounter(
    next,
    newXpReward(next, 'session-3', 'possible-duplicate', 'monster'),
    'gate-next',
    [required(candidates[0]).key]
  );
  expect(xpEvidenceDuplicates(next, reward).map((r) => r.id)).toEqual([
    'gate-reward',
  ]);
});
test('possessions supply explicit selected-item evidence and preserve custody independence through storage and session continuation', () => {
  let doc = startWorkingInventory(
    xpCampaign(),
    'session-1',
    storageInventory(),
    { kind: 'empty' },
    'stock',
    'unused',
    '2026-11-07T12:00:00.000Z'
  );
  const candidate = required(
    possessionXpCandidates(doc, 'session-1').find((c) => c.item.id === 'scroll')
  );
  const reward = rewardFromPossession(
    doc,
    newXpReward(doc, 'session-1', 'scroll-evidence', 'treasure'),
    'session-1',
    candidate.key
  );
  if (reward.input.category !== 'treasure') throw Error('Missing treasure');
  const row = required(reward.input.rows[0]);
  expect(row).toMatchObject({
    disposition: 'defer',
    retainedXp: null,
    gp: '100',
  });
  expect(row.evidence?.label).toContain('Synthetic Castle');
  doc = saveXpReward(doc, reward);
  const working = required(doc.workingInventories[0]);
  working.document = transferInventorySubtree(
    storageInventory(),
    'scroll',
    'castle',
    'synthetic-tal'
  );
  expect(xpEvidenceChanged(doc, reward)).toBe(true);
  expect(row.evidence?.label).toContain('Synthetic Castle');
  const next = startNextSession(doc, {
    campaignId: doc.id,
    sourceSessionId: 'session-1',
    sourceFingerprint: sessionFingerprint(doc, 'session-1'),
    destinationId: 'session-3',
    label: 'Continue stock',
    combats: [],
    inventory: {
      sourceId: 'stock',
      instanceId: 'stock-next',
      checkpointId: 'stock-before-next',
    },
    copyNotes: false,
    capturedAt: '2026-11-07T12:00:00.000Z',
  });
  expect(
    possessionXpCandidates(next, 'session-3').find(
      (c) => c.item.id === 'scroll'
    )
  ).toMatchObject({ key: candidate.key, captured: true });
  expect(next.xp?.rewards).toEqual(doc.xp?.rewards);
});

test('reused imported encounter evidence is flagged across separate working identities without banning distinct rewards', () => {
  let doc = createWorkingCombat(
    xpCampaign(),
    'session-1',
    'Imported source A',
    syntheticCombat(),
    { kind: 'import', recordId: 'combat-1', revisionId: 'combat-r1' },
    'import-a'
  );
  const first = required(encounterXpCandidates(doc, 'import-a')[0]);
  const reward = rewardFromEncounter(
    doc,
    newXpReward(doc, 'session-1', 'first-import-reward', 'monster'),
    'import-a',
    [first.key]
  );
  doc = saveXpReward(doc, reward);
  doc = createWorkingCombat(
    doc,
    'session-2',
    'Renamed prepared copy',
    syntheticCombat(),
    { kind: 'import', recordId: 'combat-1', revisionId: 'combat-r1' },
    'import-b'
  );
  const second = required(encounterXpCandidates(doc, 'import-b')[0]);
  expect(second.captured).toBe(true);
  const copy = rewardFromEncounter(
    doc,
    newXpReward(doc, 'session-2', 'second-import-reward', 'monster'),
    'import-b',
    [second.key]
  );
  expect(xpEvidenceDuplicates(doc, copy).map((r) => r.id)).toEqual([
    'first-import-reward',
  ]);
  expect(() =>
    saveXpReward(doc, {
      ...copy,
      distinctReason: 'A separate prepared encounter, deliberately reviewed',
    })
  ).not.toThrow();
});

test('copied fractional coin lots enter XP as exact GP fractions rather than floating-point products', () => {
  const inventory = storageInventory();
  const lot = required(
    required(inventory.storageLocations[0]).inventory.find(
      (i) => i.id === 'gold-lot'
    )
  );
  lot.valueGpOverride = 0.05;
  lot.quantity = 3;
  const doc = startWorkingInventory(
    xpCampaign(),
    'session-1',
    inventory,
    { kind: 'empty' },
    'fractional-stock',
    'unused',
    '2026-11-07T12:00:00.000Z'
  );
  const candidate = required(
    possessionXpCandidates(doc, 'session-1').find(
      (c) => c.item.id === 'gold-lot'
    )
  );
  const reward = rewardFromPossession(
    doc,
    newXpReward(doc, 'session-1', 'fractional-money', 'money'),
    'session-1',
    candidate.key
  );
  expect(reward.input).toEqual({ category: 'money', gp: '3/20' });
});

test('inventory number precision and exponent notation remain exact when copied into XP inputs', () => {
  const inventory = storageInventory();
  const holder = required(inventory.storageLocations[0]);
  const item = required(holder.inventory[0]);
  item.valueGpOverride = 1 / 3;
  let doc = startWorkingInventory(
    xpCampaign(),
    'session-1',
    inventory,
    { kind: 'empty' },
    'precise-stock',
    'unused',
    '2026-11-07T12:00:00.000Z'
  );
  let candidate = required(
    possessionXpCandidates(doc, 'session-1').find((c) => c.item.id === item.id)
  );
  expect(
    rewardFromPossession(
      doc,
      newXpReward(doc, 'session-1', 'precise', 'money'),
      'session-1',
      candidate.key
    ).input
  ).toEqual({ category: 'money', gp: '3333333333333333/10000000000000000' });
  item.valueGpOverride = 1e-8;
  doc = startWorkingInventory(
    xpCampaign(),
    'session-1',
    inventory,
    { kind: 'empty' },
    'tiny-stock',
    'unused',
    '2026-11-07T12:00:00.000Z'
  );
  candidate = required(
    possessionXpCandidates(doc, 'session-1').find((c) => c.item.id === item.id)
  );
  expect(candidate.gp).toBe('1/100000000');
});
