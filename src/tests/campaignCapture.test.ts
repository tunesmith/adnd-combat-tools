import baseline from './fixtures/campaignSnapshots.json';
import { captureSnapshot } from '../helpers/campaignCapture';
import { parseCampaign, serializeCampaign } from '../helpers/campaignDocument';
import {
  createWorkingCombat,
  captureCombatCheckpoint,
} from '../helpers/campaignWorkingCombat';
import {
  startWorkingInventory,
  captureInventoryCheckpoint,
} from '../helpers/campaignWorkingInventory';
import { syntheticCombat, syntheticInventory } from './fixtures/campaignB1';
import { encodeTrackerStateSync } from '../helpers/trackerCodec';
import type { SourceKind } from '../helpers/campaignSnapshots';
const at = '2026-11-04T12:00:00.000Z';
function campaign() {
  let doc = startWorkingInventory(
    parseCampaign(JSON.stringify(baseline)),
    'session-1',
    syntheticInventory(),
    { kind: 'empty' },
    'working-inventory',
    'unused',
    at
  );
  doc = createWorkingCombat(
    doc,
    'session-1',
    'Working combat',
    syntheticCombat(),
    { kind: 'empty' },
    'working-combat'
  );
  doc = captureInventoryCheckpoint(
    doc,
    'working-inventory',
    'Inventory before import',
    'inventory-check',
    at
  );
  return captureCombatCheckpoint(
    doc,
    'working-combat',
    'Combat before import',
    'combat-check',
    at
  );
}
function input(kind: SourceKind, changed = false) {
  const combat = syntheticCombat(),
    inventory = syntheticInventory();
  if (changed) {
    combat.title = 'Another synthetic encounter';
    const item = inventory.characters[0]?.inventory[2];
    if (!item) throw new Error('Missing fixture');
    item.quantity = 8;
  }
  return {
    sourceKind: kind,
    sourceText:
      kind === 'inventory-json'
        ? JSON.stringify(inventory)
        : kind === 'tracker-url'
        ? 'https://example.invalid/tracker#s=' + encodeTrackerStateSync(combat)
        : JSON.stringify(combat),
    sourceName: 'synthetic input',
    sessionId: 'session-1',
    title: 'New snapshot',
  };
}
const ids = {
  recordId: 'new-record',
  revisionId: 'new-revision',
  importedAt: at,
};
const kinds: SourceKind[] = ['tracker-json', 'tracker-url', 'inventory-json'];
test.each(kinds)(
  '%s attaches new content to a mixed campaign without altering prior evidence or working state',
  (kind) => {
    const doc = campaign(),
      before = serializeCampaign(doc);
    const result = captureSnapshot(doc, input(kind, true), ids);
    expect(result.duplicate).toBe(false);
    expect(result.document.records).toHaveLength(doc.records.length + 1);
    expect(result.document.records.slice(0, doc.records.length)).toEqual(
      doc.records
    );
    const { records: oldRecords, ...oldFields } = doc,
      { records: newRecords, ...newFields } = result.document;
    void oldRecords;
    void newRecords;
    expect(newFields).toEqual(oldFields);
    expect(serializeCampaign(doc)).toBe(before);
    expect(parseCampaign(serializeCampaign(result.document))).toEqual(
      result.document
    );
  }
);
test.each(kinds)(
  '%s detects true same-type duplicates and reuses a targeted revision in a mixed campaign',
  (kind) => {
    const doc = campaign();
    const targetId = kind === 'inventory-json' ? 'inventory-1' : 'combat-1';
    // Walk the opposite-type evidence before reaching the real duplicate.
    doc.records = [
      ...doc.records.filter((r) => r.id !== targetId),
      ...doc.records.filter((r) => r.id === targetId),
    ];
    const before = serializeCampaign(doc);
    expect(() => captureSnapshot(doc, input(kind), ids)).toThrow(
      'Matching content exists'
    );
    const result = captureSnapshot(doc, { ...input(kind), targetId }, ids);
    expect(result.duplicate).toBe(true);
    expect(result.recordId).toBe(targetId);
    expect(result.document).toEqual(doc);
    expect(serializeCampaign(doc)).toBe(before);
  }
);
test.each(kinds)(
  '%s permits an explicitly distinct record while retaining original revisions and working state',
  (kind) => {
    const doc = campaign(),
      before = serializeCampaign(doc);
    const result = captureSnapshot(
      doc,
      { ...input(kind), allowDistinct: true },
      ids
    );
    expect(result.duplicate).toBe(false);
    expect(result.recordId).toBe(ids.recordId);
    expect(result.document.records.slice(0, doc.records.length)).toEqual(
      doc.records
    );
    expect(
      result.document.records[doc.records.length]?.revisions[0]?.sourceText
    ).toBe(input(kind).sourceText);
    const reopened = parseCampaign(serializeCampaign(result.document));
    expect(reopened.workingInventories).toEqual(doc.workingInventories);
    expect(reopened.workingCombats).toEqual(doc.workingCombats);
    expect(reopened.inventoryCheckpoints).toEqual(doc.inventoryCheckpoints);
    expect(reopened.combatCheckpoints).toEqual(doc.combatCheckpoints);
    expect(serializeCampaign(doc)).toBe(before);
  }
);
test.each(kinds)(
  '%s rejects a mismatched target before comparing payloads',
  (kind) => {
    const doc = campaign(),
      before = serializeCampaign(doc);
    expect(() =>
      captureSnapshot(
        doc,
        {
          ...input(kind),
          targetId: kind === 'inventory-json' ? 'combat-1' : 'inventory-1',
          allowDistinct: true,
        },
        ids
      )
    ).toThrow('Snapshot type does not match');
    expect(serializeCampaign(doc)).toBe(before);
  }
);
