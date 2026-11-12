import {
  assertBankingReplacementReviewed,
  validatePhysicalMoney,
} from './campaignBanking';
import { continuedFromSchema } from './campaignContinuityModel';
import type { ContinuedFrom } from './campaignContinuityModel';
import { z } from 'zod';
import { canonical, interpretSource } from './campaignSnapshots';
import {
  createEmptyEncumbranceDocument,
  parseEncumbranceDocument,
} from './encumbranceDocument';
import type { EncumbranceDmDocument } from '../types/encumbrance';
import type { CampaignDocument } from './campaignDocument';
export type WorkspaceView =
  | 'possessions'
  | 'combats'
  | 'history'
  | 'details'
  | 'tools'
  | 'session'
  | 'party'
  | 'xp'
  | 'banking';
export interface WorkingInventory {
  continuedFrom?: ContinuedFrom;
  id: string;
  sessionId: string;
  title: string;
  document: EncumbranceDmDocument;
  origin:
    | { kind: 'empty' }
    | { kind: 'import'; recordId: string; revisionId: string }
    | { kind: 'checkpoint'; checkpointId: string };
}
export interface InventoryCheckpoint {
  characterCopy?: {
    characterId: string;
    targetWorkingId: string;
    targetSessionId: string;
  };
  id: string;
  workingId: string;
  sessionId: string;
  label: string;
  capturedAt: string;
  origin?: WorkingInventory['origin'];
  document: EncumbranceDmDocument;
}
const id = z.string().min(1);
const inventory = z
  .custom<EncumbranceDmDocument>()
  .superRefine((value, ctx) => {
    try {
      if (
        canonical(value) !==
        canonical(
          interpretSource('inventory-json', JSON.stringify(value)).payload
        )
      )
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
    continuedFrom: continuedFromSchema.optional(),
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
    characterCopy: z
      .object({ characterId: id, targetWorkingId: id, targetSessionId: id })
      .strict()
      .optional(),
    id,
    workingId: id,
    sessionId: id,
    label: z.string().min(1).max(1000),
    capturedAt: z.string().datetime(),
    origin: workingInventorySchema.shape.origin.optional(),
    document: inventory,
  })
  .strict();
export const workspaceSchema = z
  .object({
    sessionId: id.nullable(),
    view: z.enum(['possessions', 'combats', 'history', 'details', 'tools']),
  })
  .strict();
function normalizeWorkingInventory(value: unknown): EncumbranceDmDocument {
  const document = parseEncumbranceDocument(JSON.stringify(value));
  if (document.kind !== 'adnd-encumbrance-dm')
    throw new Error('DM inventory required.');
  return document;
}
export function emptyWorkingInventory(): EncumbranceDmDocument {
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
        origin: working.origin,
        document: JSON.parse(JSON.stringify(working.document)),
      },
    ],
  };
}
export function startWorkingInventory(
  campaign: CampaignDocument,
  sessionId: string,
  document: EncumbranceDmDocument,
  origin: WorkingInventory['origin'],
  id: string,
  checkpointId: string,
  at: string,
  bankingReview?: string
): CampaignDocument {
  if (!campaign.sessions.some((s) => s.id === sessionId))
    throw new Error('Select a session first.');
  const previous = campaign.workingInventories.find(
    (w) => w.sessionId === sessionId
  );
  assertBankingReplacementReviewed(
    campaign,
    sessionId,
    normalizeWorkingInventory(document),
    bankingReview
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
  document: EncumbranceDmDocument,
  removalCheckpoint?: { id: string; at: string }
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
  validatePhysicalMoney(normalized);
  const previous = campaign.workingInventories.find((w) => w.id === workingId);
  const removed =
    previous?.document.characters.filter(
      (c) => !normalized.characters.some((n) => n.id === c.id)
    ) ?? [];
  let preserved = campaign;
  if (removed.length) {
    if (!removalCheckpoint)
      throw Error(
        'Preserve a checkpoint before removing an inventory character.'
      );
    preserved = captureInventoryCheckpoint(
      campaign,
      workingId,
      `Before removing ${removed
        .map((c) => c.name || 'Unnamed character')
        .join(', ')}`,
      removalCheckpoint.id,
      removalCheckpoint.at
    );
  }
  return {
    ...preserved,
    workingInventories: preserved.workingInventories.map((w) =>
      w.id === workingId ? { ...w, document: normalized } : w
    ),
  };
}
