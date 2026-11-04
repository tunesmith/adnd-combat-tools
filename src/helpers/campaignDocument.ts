import {
  workingInventorySchema,
  inventoryCheckpointSchema,
  workspaceSchema,
} from './campaignWorkingInventory';
import type {
  WorkingInventory,
  InventoryCheckpoint,
  WorkspaceView,
} from './campaignWorkingInventory';
import { z } from 'zod';
import { strToU8 } from 'fflate';
import {
  canonical,
  contentIdentity,
  interpretSource,
  MAX_CAMPAIGN_BYTES,
  recordSchema,
  sessionSchema,
} from './campaignSnapshots';
import type { CampaignRecord, CampaignSession } from './campaignSnapshots';
export interface CampaignDocument {
  kind: 'adnd-campaign';
  schemaVersion: 3;
  workingInventories: WorkingInventory[];
  inventoryCheckpoints: InventoryCheckpoint[];
  workspace: { sessionId: string | null; view: WorkspaceView };
  id: string;
  title: string;
  notes: string;
  sessions: CampaignSession[];
  records: CampaignRecord[];
}
const common = {
  kind: z.literal('adnd-campaign'),
  id: z
    .string()
    .min(1)
    .refine(
      (value) => value.trim().length > 0,
      'Campaign ID must not be blank'
    ),
  title: z.string().max(1000),
  notes: z.string().max(1_000_000),
};
const v1 = z.object({ ...common, schemaVersion: z.literal(1) }).strict();
const v2 = z
  .object({
    ...common,
    schemaVersion: z.literal(2),
    sessions: z.array(sessionSchema).max(500),
    records: z.array(recordSchema).max(500),
  })
  .strict();
const v3 = v2
  .extend({
    schemaVersion: z.literal(3),
    workingInventories: z.array(workingInventorySchema).max(500),
    inventoryCheckpoints: z.array(inventoryCheckpointSchema).max(1000),
    workspace: workspaceSchema,
  })
  .strict();
export function validateCampaign(value: unknown): CampaignDocument {
  if (!value || typeof value !== 'object')
    throw new Error('Expected a campaign object.');
  const header = value as Record<string, unknown>;
  if (header['kind'] !== 'adnd-campaign')
    throw new Error('Not an AD&D campaign document.');
  if (
    header['schemaVersion'] !== 1 &&
    header['schemaVersion'] !== 2 &&
    header['schemaVersion'] !== 3
  )
    throw new Error(
      'Unsupported campaign schema version. This app supports versions 1, 2 and 3.'
    );
  if (
    value &&
    typeof value === 'object' &&
    (value as Record<string, unknown>)['schemaVersion'] === 1
  ) {
    return {
      ...v1.parse(value),
      schemaVersion: 3,
      sessions: [],
      records: [],
      workingInventories: [],
      inventoryCheckpoints: [],
      workspace: { sessionId: null, view: 'possessions' },
    };
  }
  const parsed =
    header['schemaVersion'] === 2
      ? {
          ...v2.parse(value),
          schemaVersion: 3 as const,
          workingInventories: [],
          inventoryCheckpoints: [],
          workspace: { sessionId: null, view: 'possessions' as const },
        }
      : v3.parse(value);
  const ids = new Set<string>();
  const unique = (id: string) => {
    if (ids.has(id)) throw new Error('Duplicate campaign identity.');
    ids.add(id);
  };
  parsed.sessions.forEach((s) => unique(s.id));
  for (const record of parsed.records) {
    unique(record.id);
    if (!parsed.sessions.some((s) => s.id === record.sessionId))
      throw new Error('Invalid session association.');
    if (!record.revisions.some((r) => r.id === record.currentRevisionId))
      throw new Error('Invalid selected revision.');
    const hashes = new Set<string>();
    for (const revision of record.revisions) {
      unique(revision.id);
      if (
        (record.type === 'inventory') !==
        (revision.sourceKind === 'inventory-json')
      )
        throw new Error('Snapshot type mismatch.');
      const interpretation = interpretSource(
        revision.sourceKind,
        revision.sourceText
      );
      for (const key of [
        'payload',
        'sourceHash',
        'contentHash',
        'sourceVersion',
        'normalizerVersion',
      ] as const)
        if (canonical(revision[key]) !== canonical(interpretation[key]))
          throw new Error(
            'Stored snapshot is inconsistent with its original source.'
          );
      const identity = contentIdentity(record.type, interpretation.payload);
      if (hashes.has(identity)) throw new Error('Duplicate revision content.');
      hashes.add(identity);
    }
  }
  if (
    parsed.workspace.sessionId !== null &&
    !parsed.sessions.some((s) => s.id === parsed.workspace.sessionId)
  )
    throw new Error('Invalid selected session.');
  const workingSessions = new Set<string>();
  for (const w of parsed.workingInventories) {
    unique(w.id);
    if (
      !parsed.sessions.some((s) => s.id === w.sessionId) ||
      workingSessions.has(w.sessionId)
    )
      throw new Error('Each session may have one working inventory.');
    workingSessions.add(w.sessionId);
    const origin = w.origin;
    if (
      origin.kind === 'import' &&
      !parsed.records.some(
        (r) =>
          r.id === origin.recordId &&
          r.type === 'inventory' &&
          r.revisions.some((v) => v.id === origin.revisionId)
      )
    )
      throw new Error('Invalid working inventory origin.');
    if (
      origin.kind === 'checkpoint' &&
      !parsed.inventoryCheckpoints.some((c) => c.id === origin.checkpointId)
    )
      throw new Error('Invalid checkpoint origin.');
  }
  for (const c of parsed.inventoryCheckpoints) {
    unique(c.id);
    if (!parsed.sessions.some((s) => s.id === c.sessionId))
      throw new Error('Invalid checkpoint session.');
  }
  return parsed as CampaignDocument;
}
export function parseCampaign(text: string): CampaignDocument {
  if (strToU8(text).length > MAX_CAMPAIGN_BYTES)
    throw new Error('Campaign exceeds 8 MB.');
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new Error('Invalid JSON. The active campaign has not been replaced.');
  }
  return validateCampaign(value);
}
export function serializeCampaign(document: CampaignDocument): string {
  const text = JSON.stringify(validateCampaign(document), null, 2) + '\n';
  if (strToU8(text).length > MAX_CAMPAIGN_BYTES)
    throw new Error('Campaign exceeds 8 MB.');
  return text;
}
