import { z } from 'zod';
import { canonical, interpretSource } from './campaignSnapshots';
import { createEmptyEncumbranceDocument } from './encumbranceDocument';
import type { EncumbranceDmDocumentV9 } from '../types/encumbrance';
import type { CampaignDocument } from './campaignDocument';
export type WorkspaceView =
  | 'possessions'
  | 'combats'
  | 'history'
  | 'details'
  | 'tools';
export interface WorkingInventory {
  id: string;
  sessionId: string;
  title: string;
  document: EncumbranceDmDocumentV9;
  origin:
    | { kind: 'empty' }
    | { kind: 'import'; recordId: string; revisionId: string }
    | { kind: 'checkpoint'; checkpointId: string };
}
export interface InventoryCheckpoint {
  id: string;
  workingId: string;
  sessionId: string;
  label: string;
  capturedAt: string;
  document: EncumbranceDmDocumentV9;
}
const id = z.string().min(1);
const inventory = z.unknown().superRefine((value, ctx) => {
  try {
    if (canonical(value) !== canonical(normalizeWorkingInventory(value)))
      ctx.addIssue({
        code: 'custom',
        message:
          'Working inventory contains unsupported or unnormalized fields.',
      });
  } catch (error) {
    ctx.addIssue({ code: 'custom', message: String(error) });
  }
});
export const workingInventorySchema = z
  .object({
    id,
    sessionId: id,
    title: z.string().min(1).max(1000),
    document: inventory,
    origin: z.discriminatedUnion('kind', [
      z.object({ kind: z.literal('empty') }).strict(),
      z
        .object({ kind: z.literal('import'), recordId: id, revisionId: id })
        .strict(),
      z.object({ kind: z.literal('checkpoint'), checkpointId: id }).strict(),
    ]),
  })
  .strict();
export const inventoryCheckpointSchema = z
  .object({
    id,
    workingId: id,
    sessionId: id,
    label: z.string().min(1).max(1000),
    capturedAt: z.string().datetime(),
    document: inventory,
  })
  .strict();
export const workspaceSchema = z
  .object({
    sessionId: id.nullable(),
    view: z.enum(['possessions', 'combats', 'history', 'details', 'tools']),
  })
  .strict();
function normalizeWorkingInventory(value: unknown): EncumbranceDmDocumentV9 {
  const document = interpretSource('inventory-json', JSON.stringify(value))
    .payload as unknown as EncumbranceDmDocumentV9;
  const ids = document.characters.flatMap((c) => c.inventory.map((i) => i.id));
  if (new Set(ids).size !== ids.length)
    throw new Error(
      'Working inventory item IDs must be unique across characters for safe transfers.'
    );
  return document;
}
export function emptyWorkingInventory(): EncumbranceDmDocumentV9 {
  return normalizeWorkingInventory(createEmptyEncumbranceDocument());
}
export function captureInventoryCheckpoint(
  campaign: CampaignDocument,
  workingId: string,
  label: string,
  id: string,
  at: string
): CampaignDocument {
  const working = campaign.workingInventories.find((w) => w.id === workingId);
  if (!working) throw new Error('Working inventory changed; try again.');
  if (!label.trim()) throw new Error('Give the checkpoint a name.');
  return {
    ...campaign,
    inventoryCheckpoints: [
      ...campaign.inventoryCheckpoints,
      {
        id,
        workingId,
        sessionId: working.sessionId,
        label: label.trim(),
        capturedAt: at,
        document: JSON.parse(JSON.stringify(working.document)),
      },
    ],
  };
}
export function startWorkingInventory(
  campaign: CampaignDocument,
  sessionId: string,
  document: EncumbranceDmDocumentV9,
  origin: WorkingInventory['origin'],
  id: string,
  checkpointId: string,
  at: string
): CampaignDocument {
  if (!campaign.sessions.some((s) => s.id === sessionId))
    throw new Error('Select a session first.');
  const previous = campaign.workingInventories.find(
    (w) => w.sessionId === sessionId
  );
  const preserved = previous
    ? captureInventoryCheckpoint(
        campaign,
        previous.id,
        'Before replacing working inventory',
        checkpointId,
        at
      )
    : campaign;
  const working: WorkingInventory = {
    id,
    sessionId,
    title: 'Working possessions',
    document: normalizeWorkingInventory(document),
    origin,
  };
  return {
    ...preserved,
    workingInventories: [
      ...preserved.workingInventories.filter((w) => w.sessionId !== sessionId),
      working,
    ],
  };
}
export function changeWorkingInventory(
  campaign: CampaignDocument,
  workingId: string,
  sessionId: string,
  document: EncumbranceDmDocumentV9
): CampaignDocument {
  if (
    !campaign.workingInventories.some(
      (w) => w.id === workingId && w.sessionId === sessionId
    )
  )
    throw new Error(
      'Working inventory was replaced; this delayed edit was cancelled.'
    );
  const normalized = normalizeWorkingInventory(document);
  return {
    ...campaign,
    workingInventories: campaign.workingInventories.map((w) =>
      w.id === workingId ? { ...w, document: normalized } : w
    ),
  };
}
