import type { CampaignDocument } from './campaignDocument';
import { interpretSource, contentIdentity } from './campaignSnapshots';
import type {
  SourceKind,
  CampaignRecord,
  CampaignRevision,
} from './campaignSnapshots';
export function captureSnapshot(
  document: CampaignDocument,
  input: {
    sourceKind: SourceKind;
    sourceText: string;
    sourceName: string;
    sessionId: string;
    title: string;
    targetId?: string;
    allowDistinct?: boolean;
  },
  identifiers: { recordId: string; revisionId: string; importedAt: string }
) {
  if (!document.sessions.some((s) => s.id === input.sessionId))
    throw new Error('Select a session first.');
  const interpretation = interpretSource(input.sourceKind, input.sourceText);
  const type = input.sourceKind === 'inventory-json' ? 'inventory' : 'combat';
  const existing = input.targetId
    ? document.records.find((r) => r.id === input.targetId)
    : undefined;
  if (input.targetId && !existing) throw new Error('Target record is missing.');
  if (existing && existing.type !== type)
    throw new Error('Snapshot type does not match the target record.');
  const identity = contentIdentity(type, interpretation.payload);
  const duplicate = existing?.revisions.find(
    (r) => contentIdentity(existing.type, r.payload) === identity
  );
  if (existing && duplicate)
    return {
      document: {
        ...document,
        records: document.records.map((r) =>
          r.id === existing.id ? { ...r, currentRevisionId: duplicate.id } : r
        ),
      },
      recordId: existing.id,
      duplicate: true,
    };
  if (
    !existing &&
    !input.allowDistinct &&
    document.records.some(
      (r) =>
        r.type === type &&
        r.revisions.some((v) => contentIdentity(r.type, v.payload) === identity)
    )
  )
    throw new Error(
      'Matching content exists. Reuse its record or explicitly create a distinct record.'
    );
  const revision: CampaignRevision = {
    ...interpretation,
    id: identifiers.revisionId,
    importedAt: identifiers.importedAt,
    sourceKind: input.sourceKind,
    sourceText: input.sourceText,
    sourceName: input.sourceName,
  };
  const record: CampaignRecord = existing
    ? {
        ...existing,
        revisions: [...existing.revisions, revision],
        currentRevisionId: revision.id,
      }
    : {
        id: identifiers.recordId,
        type,
        title: input.title,
        sessionId: input.sessionId,
        revisions: [revision],
        currentRevisionId: revision.id,
      };
  return {
    document: {
      ...document,
      records: existing
        ? document.records.map((r) => (r.id === existing.id ? record : r))
        : [...document.records, record],
    },
    recordId: record.id,
    duplicate: false,
  };
}
