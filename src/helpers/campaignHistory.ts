import { validateContinuityTransition } from './campaignContinuity';
import { canonical } from './campaignSnapshots';
import type { CampaignDocument } from './campaignDocument';
import type { WorkingCombat } from './campaignWorkingCombat';
import type { WorkingInventory } from './campaignWorkingInventory';
type SourceOrigin = WorkingCombat['origin'];
/** Follow only persisted identities/provenance. Never infer ownership from titles/content. */
export function ownedHistory(
  doc: CampaignDocument,
  type: 'combat' | 'inventory',
  working: WorkingCombat | WorkingInventory
) {
  const records = new Set<string>(),
    checkpoints = new Set<string>(),
    owners = new Set([working.id]);
  const history: {
    id: string;
    owner: string;
    sessionId: string;
    origin?: SourceOrigin;
  }[] =
    type === 'combat'
      ? doc.combatCheckpoints.map((c) => ({ ...c, owner: c.combatId }))
      : doc.inventoryCheckpoints.map((c) => ({ ...c, owner: c.workingId }));
  const visit = (origin: SourceOrigin) => {
    if (origin.kind === 'import') records.add(origin.recordId);
    if (origin.kind === 'checkpoint') {
      const p = history.find((c) => c.id === origin.checkpointId);
      if (p) {
        checkpoints.add(p.id);
        if (type === 'inventory') owners.add(p.owner);
      }
    }
  };
  visit(working.origin);
  let size = -1;
  while (size !== owners.size + checkpoints.size + records.size) {
    size = owners.size + checkpoints.size + records.size;
    for (const c of history) {
      if (
        owners.has(c.owner) ||
        checkpoints.has(c.id) ||
        (type === 'inventory' &&
          c.sessionId === working.sessionId &&
          c.origin?.kind === 'import' &&
          records.has(c.origin.recordId))
      ) {
        if (type === 'inventory') owners.add(c.owner);
        checkpoints.add(c.id);
        if (c.origin) visit(c.origin);
      }
    }
  }
  return { records, checkpoints };
}
export function ownsVersion(
  doc: CampaignDocument,
  type: 'combat' | 'inventory',
  working: WorkingCombat | WorkingInventory,
  origin: SourceOrigin
) {
  const owned = ownedHistory(doc, type, working);
  return origin.kind === 'import'
    ? owned.records.has(origin.recordId)
    : origin.kind === 'checkpoint'
    ? owned.checkpoints.has(origin.checkpointId)
    : false;
}
export function validateHistoryTransition(
  old: CampaignDocument,
  next: CampaignDocument,
  purpose: string
) {
  validateContinuityTransition(old, next);
  for (const p of next.combatCheckpoints.filter(
    (p) => !old.combatCheckpoints.some((c) => c.id === p.id)
  )) {
    const owner = old.workingCombats.find((w) => w.id === p.combatId);
    if (p.origin && owner && canonical(p.origin) !== canonical(owner.origin))
      throw new Error('Checkpoint provenance must match its encounter.');
  }
  for (const p of next.inventoryCheckpoints.filter(
    (p) => !old.inventoryCheckpoints.some((c) => c.id === p.id)
  )) {
    const owner = old.workingInventories.find((w) => w.id === p.workingId);
    if (p.origin && owner && canonical(p.origin) !== canonical(owner.origin))
      throw new Error('Checkpoint provenance must match its inventory.');
  }
  for (const combat of old.workingCombats) {
    const changed = next.workingCombats.find((c) => c.id === combat.id);
    if (!changed) continue;
    if (
      changed.generation !== combat.generation ||
      JSON.stringify(changed.origin) !== JSON.stringify(combat.origin)
    ) {
      const legacyEmpty =
        changed.origin.kind === 'empty' &&
        canonical(changed.origin) === canonical(combat.origin) &&
        old.combatCheckpoints.some(
          (c) =>
            c.combatId === combat.id &&
            canonical(c.state) === canonical(changed.state)
        );
      if (!ownsVersion(old, 'combat', combat, changed.origin) && !legacyEmpty)
        throw new Error(
          'This version does not belong to the selected encounter. Create a new encounter from Imports instead.'
        );
    }
  }
  if (purpose !== 'activate-source' && purpose !== 'import')
    for (const working of old.workingInventories) {
      const changed = next.workingInventories.find(
        (w) => w.sessionId === working.sessionId
      );
      if (
        changed &&
        (changed.id !== working.id ||
          canonical(changed.origin) !== canonical(working.origin)) &&
        changed.origin.kind !== 'empty' &&
        !ownsVersion(old, 'inventory', working, changed.origin)
      )
        throw new Error(
          'This version does not belong to the current inventory. Use Imports to replace it deliberately.'
        );
    }
}
