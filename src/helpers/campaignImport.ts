import { captureSnapshot } from './campaignCapture';
import { createWorkingCombat } from './campaignWorkingCombat';
import { startWorkingInventory } from './campaignWorkingInventory';
import { ownedHistory } from './campaignHistory';
import type { CampaignDocument } from './campaignDocument';
import type { TrackerState } from '../types/tracker';
import type { EncumbranceDmDocument } from '../types/encumbrance';
export function activateSource(
  doc: CampaignDocument,
  recordId: string,
  revisionId: string,
  sessionId: string,
  ids: {
    workingId: string;
    checkpointId: string;
    at: string;
    bankingReview?: string;
  },
  reuse = true
) {
  const record = doc.records.find((r) => r.id === recordId),
    revision = record?.revisions.find((r) => r.id === revisionId);
  if (!record || !revision) throw new Error('Stored source is missing.');
  const origin = { kind: 'import' as const, recordId, revisionId };
  if (record.type === 'combat') {
    const existing =
      reuse &&
      doc.workingCombats.find(
        (c) =>
          c.sessionId === sessionId &&
          !c.removedAt &&
          ownedHistory(doc, 'combat', c).records.has(recordId)
      );
    if (existing)
      return {
        ...doc,
        workspace: {
          ...doc.workspace,
          sessionId,
          view: 'combats' as const,
          combatSelections: {
            ...doc.workspace.combatSelections,
            [sessionId]: existing.id,
          },
        },
      };
    return createWorkingCombat(
      doc,
      sessionId,
      record.title,
      revision.payload as unknown as TrackerState,
      origin,
      ids.workingId
    );
  }
  const current = doc.workingInventories.find((w) => w.sessionId === sessionId);
  if (
    reuse &&
    current &&
    ownedHistory(doc, 'inventory', current).records.has(recordId)
  )
    return {
      ...doc,
      workspace: { ...doc.workspace, sessionId, view: 'possessions' as const },
    };
  return {
    ...startWorkingInventory(
      doc,
      sessionId,
      revision.payload as unknown as EncumbranceDmDocument,
      origin,
      ids.workingId,
      ids.checkpointId,
      ids.at,
      ids.bankingReview
    ),
    workspace: { ...doc.workspace, sessionId, view: 'possessions' as const },
  };
}
export function importCampaignSource(
  doc: CampaignDocument,
  input: Parameters<typeof captureSnapshot>[1],
  ids: Parameters<typeof captureSnapshot>[2] & {
    workingId: string;
    checkpointId: string;
    bankingReview?: string;
  },
  use: boolean
) {
  const captured = captureSnapshot(doc, input, ids);
  if (!use) return { ...captured, keptWorking: false };
  const record = captured.document.records.find(
    (r) => r.id === captured.recordId
  );
  if (!record) throw new Error('Missing captured record');
  const document = activateSource(
    captured.document,
    record.id,
    record.currentRevisionId,
    input.sessionId,
    {
      workingId: ids.workingId,
      checkpointId: ids.checkpointId,
      at: ids.importedAt,
      bankingReview: ids.bankingReview,
    },
    captured.duplicate || (!!input.targetId && record.type === 'combat')
  );
  const keptWorking =
    record.type === 'combat'
      ? doc.workingCombats.some(
          (c) => c.id === document.workspace.combatSelections?.[input.sessionId]
        )
      : doc.workingInventories.some((w) =>
          document.workingInventories.some(
            (n) => n.id === w.id && n.sessionId === input.sessionId
          )
        );
  return { ...captured, document, keptWorking };
}

export function activateCheckpoint(
  doc: CampaignDocument,
  type: 'combat' | 'inventory',
  checkpointId: string,
  sessionId: string,
  ids: {
    workingId: string;
    checkpointId: string;
    at: string;
    bankingReview?: string;
  }
) {
  const origin = { kind: 'checkpoint' as const, checkpointId };
  if (type === 'combat') {
    const c = doc.combatCheckpoints.find((c) => c.id === checkpointId);
    if (!c) throw new Error('Checkpoint missing');
    return createWorkingCombat(
      doc,
      sessionId,
      c.state.title || c.label,
      c.state,
      origin,
      ids.workingId
    );
  }
  const c = doc.inventoryCheckpoints.find((c) => c.id === checkpointId);
  if (!c) throw new Error('Checkpoint missing');
  return {
    ...startWorkingInventory(
      doc,
      sessionId,
      c.document,
      origin,
      ids.workingId,
      ids.checkpointId,
      ids.at,
      ids.bankingReview
    ),
    workspace: { ...doc.workspace, sessionId, view: 'possessions' as const },
  };
}
