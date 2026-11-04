import { captureSnapshot } from '../helpers/campaignCapture';
import { syntheticCombat, syntheticInventory } from './fixtures/campaignB1';
import { deflateSync } from 'zlib';
import { interpretSource, canonical } from '../helpers/campaignSnapshots';
import { parseCampaign, serializeCampaign } from '../helpers/campaignDocument';
import type { CampaignDocument } from '../helpers/campaignDocument';
import { encodeTrackerStateSync } from '../helpers/trackerCodec';
import { createEmptyEncumbranceDocument } from '../helpers/encumbranceDocument';

const combat = syntheticCombat;
function first(d: CampaignDocument) {
  const record = d.records[0];
  const revision = record?.revisions[0];
  if (!record || !revision) throw new Error('Fixture lacks revision');
  return { record, revision };
}
function campaign(): CampaignDocument {
  const data = combat();
  const text = JSON.stringify(data);
  const snapshot = interpretSource('tracker-json', text);
  return {
    kind: 'adnd-campaign',
    schemaVersion: 4,
    workingCombats: [],
    combatCheckpoints: [],
    workingInventories: [],
    inventoryCheckpoints: [],
    workspace: { sessionId: null, view: 'possessions', combatSelections: {} },
    id: 'campaign',
    title: 'Synthetic',
    notes: '',
    sessions: [{ id: 'session', label: 'Moonrise' }],
    records: [
      {
        id: 'combat',
        type: 'combat',
        title: 'Skirmish',
        sessionId: 'session',
        currentRevisionId: 'rev',
        revisions: [
          {
            ...snapshot,
            id: 'rev',
            importedAt: '2026-11-04T00:00:00.000Z',
            sourceKind: 'tracker-json',
            sourceText: text,
            sourceName: 'synthetic.json',
          },
        ],
      },
    ],
  };
}
test('tracker URL and JSON normalize to the same content; original whitespace preserved separately', () => {
  const data = combat();
  const url =
    '  https://example.invalid/tracker#s=' +
    encodeTrackerStateSync(data) +
    '  ';
  const a = interpretSource('tracker-url', url),
    b = interpretSource('tracker-json', JSON.stringify(data));
  expect(a.contentHash).toBe(b.contentHash);
  expect(a.sourceHash).not.toBe(b.sourceHash);
  expect(canonical(a.payload)).toContain('Unknown HP, not zero');
});
test('snapshot and metadata survive serialization and title/notes changes', () => {
  const doc = campaign();
  const updated = { ...doc, title: 'Renamed', notes: 'New notes' };
  expect(parseCampaign(serializeCampaign(updated))).toEqual(updated);
  expect(parseCampaign(serializeCampaign(updated)).records).toEqual(
    doc.records
  );
});
test('corrupt source, payload, references and duplicate revisions are rejected', () => {
  for (const mutate of [
    (d: CampaignDocument) => {
      first(d).revision.sourceText = '{}';
    },
    (d: CampaignDocument) => {
      first(d).revision.payload = {};
    },
    (d: CampaignDocument) => {
      first(d).record.sessionId = 'missing';
    },
    (d: CampaignDocument) => {
      first(d).record.revisions.push({
        ...first(d).revision,
        id: 'copy',
      });
    },
  ]) {
    const doc = campaign();
    mutate(doc);
    expect(() => parseCampaign(JSON.stringify(doc))).toThrow();
  }
});
test('bounded decompression rejects bombs and truncated data', () => {
  const encoded = encodeURIComponent(
    deflateSync(' '.repeat(2_000_000)).toString('base64')
  );
  expect(() => interpretSource('tracker-url', encoded)).toThrow();
  expect(() =>
    interpretSource('tracker-url', 'https://example.invalid/#s=abc')
  ).toThrow();
});
test('future tracker versions and invalid round references are rejected', () => {
  const data = combat();
  expect(() =>
    interpretSource('tracker-json', JSON.stringify({ ...data, version: 99 }))
  ).toThrow();
  expect(() =>
    interpretSource(
      'tracker-json',
      JSON.stringify({ ...data, activeRound: 99 })
    )
  ).toThrow();
});
test('DM inventory parser is reused and player documents rejected', () => {
  const dm = createEmptyEncumbranceDocument();
  expect(
    interpretSource('inventory-json', JSON.stringify(dm)).sourceVersion
  ).toBe(9);
  expect(() =>
    interpretSource(
      'inventory-json',
      JSON.stringify(createEmptyEncumbranceDocument('adnd-encumbrance-player'))
    )
  ).toThrow('Player');
});

test('both snapshot types and deliberate revisions survive reload with exact sources', () => {
  const initial = parseCampaign(
    JSON.stringify({
      kind: 'adnd-campaign',
      schemaVersion: 1,
      id: 'migrated',
      title: 'Preserved',
      notes: 'Original',
    })
  );
  const doc = {
    ...initial,
    sessions: [{ id: 's', label: 'An arbitrary session label' }],
  };
  const text = JSON.stringify(syntheticCombat(), null, 2) + '\n';
  const first = captureSnapshot(
    doc,
    {
      sourceKind: 'tracker-json',
      sourceText: text,
      sourceName: 'combat.json',
      sessionId: 's',
      title: 'Gate',
    },
    { recordId: 'r', revisionId: 'v1', importedAt: '2026-11-04T00:00:00.000Z' }
  );
  const repeat = captureSnapshot(
    first.document,
    {
      sourceKind: 'tracker-url',
      sourceText:
        'https://example.invalid/#s=' +
        encodeTrackerStateSync(syntheticCombat()),
      sourceName: 'URL',
      sessionId: 's',
      title: 'Ignored',
      targetId: 'r',
    },
    {
      recordId: 'unused',
      revisionId: 'unused',
      importedAt: '2026-11-04T01:00:00.000Z',
    }
  );
  expect(repeat.duplicate).toBe(true);
  expect(repeat.document.records[0]?.revisions).toHaveLength(1);
  expect(() =>
    captureSnapshot(
      first.document,
      {
        sourceKind: 'tracker-json',
        sourceText: text,
        sourceName: 'same.json',
        sessionId: 's',
        title: 'Duplicate',
      },
      {
        recordId: 'r2',
        revisionId: 'v2',
        importedAt: '2026-11-04T01:00:00.000Z',
      }
    )
  ).toThrow('Matching');
  const different = syntheticCombat();
  different.title = 'Changed captured title';
  const revised = captureSnapshot(
    first.document,
    {
      sourceKind: 'tracker-json',
      sourceText: JSON.stringify(different),
      sourceName: 'same.json',
      sessionId: 's',
      title: 'Gate',
      targetId: 'r',
    },
    {
      recordId: 'unused',
      revisionId: 'v2',
      importedAt: '2026-11-04T01:00:00.000Z',
    }
  );
  const inventoryText = JSON.stringify(syntheticInventory(), null, 2) + '\n';
  const both = captureSnapshot(
    revised.document,
    {
      sourceKind: 'inventory-json',
      sourceText: inventoryText,
      sourceName: 'dm.json',
      sessionId: 's',
      title: 'DM inventory',
    },
    { recordId: 'i', revisionId: 'iv1', importedAt: '2026-11-04T02:00:00.000Z' }
  );
  const restored = parseCampaign(
    serializeCampaign({
      ...both.document,
      title: 'Metadata edit',
      notes: 'Still attached',
    })
  );
  expect(restored.records[0]?.revisions).toHaveLength(2);
  expect(restored.records[0]?.currentRevisionId).toBe('v2');
  expect(restored.records[0]?.revisions[0]?.sourceText).toBe(text);
  expect(restored.records[1]?.revisions[0]?.sourceText).toBe(inventoryText);
  const distinct = captureSnapshot(
    restored,
    {
      sourceKind: 'tracker-json',
      sourceText: text,
      sourceName: 'same.json',
      sessionId: 's',
      title: 'Another encounter',
      allowDistinct: true,
    },
    { recordId: 'r3', revisionId: 'v3', importedAt: '2026-11-04T03:00:00.000Z' }
  );
  expect(distinct.document.records).toHaveLength(3);
});

test('legacy DM normalization is deterministic and uses the existing migration', () => {
  const legacy = {
    kind: 'adnd-encumbrance-dm',
    version: 1,
    character: {
      name: 'Invented legacy adventurer',
      strength: { score: 8, exceptional: 'none' },
    },
    inventory: [],
    dm: { privateNotes: 'Synthetic legacy note' },
  };
  const a = interpretSource('inventory-json', JSON.stringify(legacy));
  const b = interpretSource('inventory-json', JSON.stringify(legacy, null, 2));
  expect(a.contentHash).toBe(b.contentHash);
  expect(canonical(a.payload)).toContain('Synthetic legacy note');
  expect(a.sourceVersion).toBe(1);
});

test('invalid cell action references and cyclic inventory containers are rejected before normalization', () => {
  const data = syntheticCombat();
  const cell = data.rounds[0]?.cells[0]?.[0];
  if (!cell) throw new Error('Missing fixture cell');
  cell.partyToEnemyActionIds = ['nonexistent-action'];
  expect(() => interpretSource('tracker-json', JSON.stringify(data))).toThrow(
    'reference'
  );
  const inv = syntheticInventory();
  const character = inv.characters[0];
  const first = character?.inventory[0];
  if (!first) throw new Error('Missing fixture item');
  first.containerId = 'gem';
  expect(() => interpretSource('inventory-json', JSON.stringify(inv))).toThrow(
    'container'
  );
});
test('oversized input is rejected before parsing', () => {
  expect(() => interpretSource('tracker-json', ' '.repeat(1_000_001))).toThrow(
    '1 MB'
  );
  expect(() => parseCampaign(' '.repeat(8_000_001))).toThrow('8 MB');
});

test('codec-omitted defaults do not create an equivalent URL duplicate', () => {
  const data = syntheticCombat();
  data.rounds.forEach((r) => {
    r.actions = [];
  });
  const base = { ...campaign(), records: [] };
  const first = captureSnapshot(
    base,
    {
      sourceKind: 'tracker-json',
      sourceText: JSON.stringify(data),
      sourceName: 'full.json',
      sessionId: 'session',
      title: 'Full state',
    },
    {
      recordId: 'full',
      revisionId: 'first',
      importedAt: '2026-11-04T00:00:00.000Z',
    }
  );
  const second = captureSnapshot(
    first.document,
    {
      sourceKind: 'tracker-url',
      sourceText: 'https://example.invalid/#s=' + encodeTrackerStateSync(data),
      sourceName: 'URL',
      sessionId: 'session',
      title: 'Same state',
      targetId: 'full',
    },
    {
      recordId: 'unused',
      revisionId: 'unused',
      importedAt: '2026-11-04T01:00:00.000Z',
    }
  );
  expect(second.duplicate).toBe(true);
  expect(second.document.records[0]?.revisions).toHaveLength(1);
});

test('compressed tracker checksum corruption is rejected', () => {
  const bytes = deflateSync(JSON.stringify(syntheticCombat()));
  bytes[bytes.length - 1] = (bytes[bytes.length - 1] || 0) ^ 1;
  expect(() =>
    interpretSource('tracker-url', encodeURIComponent(bytes.toString('base64')))
  ).toThrow('checksum');
});
