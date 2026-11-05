import { importCampaignSource } from '../helpers/campaignImport';
import {
  ownedHistory,
  validateHistoryTransition,
} from '../helpers/campaignHistory';
import { parseCampaign, serializeCampaign } from '../helpers/campaignDocument';
import {
  captureCombatCheckpoint,
  restoreWorkingCombat,
} from '../helpers/campaignWorkingCombat';
import { syntheticCombat, syntheticInventory } from './fixtures/campaignB1';
function required<T>(v: T | undefined): T {
  if (v === undefined) throw Error('fixture');
  return v;
}
const at = '2026-11-04T12:00:00.000Z';
const empty = () => ({
  ...parseCampaign(
    JSON.stringify({
      kind: 'adnd-campaign',
      schemaVersion: 1,
      id: 'synthetic',
      title: 'Test',
      notes: '',
    })
  ),
  sessions: [{ id: 's', label: 'Synthetic session' }],
});
function add(
  doc: ReturnType<typeof empty>,
  id: string,
  inventory = false,
  use = true,
  targetId?: string,
  distinct = false
) {
  const payload = inventory
    ? syntheticInventory()
    : { ...syntheticCombat(), title: id };
  return importCampaignSource(
    doc,
    {
      sourceKind: inventory ? 'inventory-json' : 'tracker-json',
      sourceText: JSON.stringify(payload),
      sourceName: 'synthetic.json',
      title: id,
      sessionId: 's',
      targetId,
      allowDistinct: distinct,
    },
    {
      recordId: id,
      revisionId: id + '-revision',
      workingId: id + '-working',
      checkpointId: id + '-before',
      importedAt: at,
    },
    use
  );
}
test('atomic import/use and store-only retain immutable evidence and independent source ownership after rename/reopen', () => {
  const a = add(empty(), 'A').document,
    b = add(a, 'B').document,
    master = add(b, 'Prep', false, false).document;
  expect(master.records).toHaveLength(3);
  expect(master.workingCombats).toHaveLength(2);
  expect(master.records.slice(0, 2)).toEqual(b.records);
  const working = master.workingCombats[0];
  if (!working) throw Error('fixture');
  working.title = 'Renamed';
  const owned = ownedHistory(master, 'combat', working);
  expect(Array.from(owned.records)).toEqual(['A']);
  expect(owned.records.has('B')).toBe(false);
  expect(() =>
    restoreWorkingCombat(
      master,
      working.id,
      syntheticCombat(),
      { kind: 'import', recordId: 'B', revisionId: 'B-revision' },
      'before',
      at
    )
  ).toThrow('belong');
  const forged = {
    ...master,
    workingCombats: master.workingCombats.map((c) =>
      c.id === working.id
        ? {
            ...c,
            generation: 1,
            origin: {
              kind: 'import' as const,
              recordId: 'B',
              revisionId: 'B-revision',
            },
          }
        : c
    ),
  };
  expect(() => validateHistoryTransition(master, forged, '')).toThrow('belong');
  expect(parseCampaign(serializeCampaign(master))).toEqual(master);
});
test('first inventory activates directly, explicit replacement checkpoints current work, duplicate reuse cannot activate twice', () => {
  const first = add(empty(), 'Inventory', true).document;
  expect(first.inventoryCheckpoints).toHaveLength(0);
  const repeat = add(first, 'Ignored', true, true, 'Inventory').document;
  expect(repeat.workingInventories).toEqual(first.workingInventories);
  expect(repeat.records).toEqual(first.records);
  expect(() => add(first, 'Duplicate', true)).toThrow('Matching');
  const next = add(first, 'Other', true, true, undefined, true).document;
  expect(next.inventoryCheckpoints[0]?.document).toEqual(
    first.workingInventories[0]?.document
  );
  expect(() => validateHistoryTransition(first, next, '')).toThrow('belong');
  expect(() => validateHistoryTransition(first, next, 'import')).not.toThrow();
  expect(
    Array.from(
      ownedHistory(next, 'inventory', required(next.workingInventories[0]))
        .records
    )
  ).toEqual(['Other']);
});
test('restoring owned checkpoints retains original imported lineage through save/reopen', () => {
  const doc = add(empty(), 'A').document,
    working = doc.workingCombats[0];
  if (!working) throw Error('fixture');
  const checkpoint = captureCombatCheckpoint(
      doc,
      working.id,
      'Before',
      'check',
      at
    ),
    state = checkpoint.combatCheckpoints[0]?.state;
  if (!state) throw Error('fixture');
  const restored = restoreWorkingCombat(
    checkpoint,
    working.id,
    state,
    { kind: 'checkpoint', checkpointId: 'check' },
    'preserved',
    at
  );
  expect(
    Array.from(
      ownedHistory(
        parseCampaign(serializeCampaign(restored)),
        'combat',
        required(restored.workingCombats[0])
      ).records
    )
  ).toEqual(['A']);
  expect(() =>
    validateHistoryTransition(checkpoint, restored, '')
  ).not.toThrow();
});

test('adding a revision preserves current encounter edits and every earlier source', () => {
  const doc = add(empty(), 'A').document;
  const current = doc.workingCombats[0];
  if (!current) throw Error('fixture');
  required(current.state.rounds[0]).summary = 'Working note';
  const text = JSON.stringify({
    ...syntheticCombat(),
    title: 'Revised source',
  });
  const result = importCampaignSource(
    doc,
    {
      sourceKind: 'tracker-json',
      sourceText: text,
      sourceName: 'revision.json',
      title: 'Unused title',
      sessionId: 's',
      targetId: 'A',
    },
    {
      recordId: 'unused',
      revisionId: 'A-r2',
      workingId: 'unused-work',
      checkpointId: 'unused-check',
      importedAt: at,
    },
    true
  );
  expect(result.document.records[0]?.revisions).toHaveLength(2);
  expect(result.document.records[0]?.revisions[0]).toEqual(
    doc.records[0]?.revisions[0]
  );
  expect(result.document.workingCombats).toEqual(doc.workingCombats);
  expect(result.keptWorking).toBe(true);
});
