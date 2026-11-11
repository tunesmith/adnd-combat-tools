import {
  campaignBankingSchema,
  legacyCampaignBankingSchema,
} from './campaignBankingModel';
import type { CampaignBanking } from './campaignBankingModel';
import { validateCampaignBanking } from './campaignBanking';
import { migrateXpTimeline } from './campaignXpTimeline';
import { campaignXpSchema, legacyCampaignXpSchema } from './campaignXpModel';
import type { CampaignXp } from './campaignXpModel';
import { validateCampaignXp } from './campaignXp';
import { parseEncumbranceDocument } from './encumbranceDocument';
import {
  campaignPartySchema,
  legacyCampaignPartySchema,
} from './campaignPartyModel';
import type { CampaignParty } from './campaignPartyModel';
import { validatePartyReferences } from './campaignParty';
import { validateContinuationReferences } from './campaignContinuity';
import { sessionContinuationSchema } from './campaignContinuityModel';
import type { SessionContinuation } from './campaignContinuityModel';
import {
  workingCombatSchema,
  legacyWorkingCombatSchema,
  combatCheckpointSchema,
} from './campaignWorkingCombat';
import type { WorkingCombat, CombatCheckpoint } from './campaignWorkingCombat';
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
  schemaVersion: 16;
  xp?: CampaignXp;
  banking?: CampaignBanking;
  party?: CampaignParty;
  workingCombats: WorkingCombat[];
  combatCheckpoints: CombatCheckpoint[];
  workingInventories: WorkingInventory[];
  inventoryCheckpoints: InventoryCheckpoint[];
  workspace: {
    sessionId: string | null;
    view: WorkspaceView;
    combatSelections?: Record<string, string>;
  };
  id: string;
  title: string;
  notes: string;
  sessions: (CampaignSession & {
    notes?: string;
    continuation?: SessionContinuation;
  })[];
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
const v4 = v3
  .extend({
    schemaVersion: z.literal(4),
    workingCombats: z.array(legacyWorkingCombatSchema).max(500),
    combatCheckpoints: z.array(combatCheckpointSchema).max(1000),
    workspace: workspaceSchema
      .extend({ combatSelections: z.record(z.string()).default({}) })
      .strict(),
  })
  .strict();
const v5 = v4
  .extend({
    schemaVersion: z.literal(5),
    workspace: v4.shape.workspace
      .extend({
        view: z.enum([
          'possessions',
          'combats',
          'history',
          'details',
          'tools',
          'session',
        ]),
      })
      .strict(),
    sessions: z
      .array(
        sessionSchema
          .extend({
            notes: z.string().max(1_000_000).optional(),
            continuation: sessionContinuationSchema.optional(),
          })
          .strict()
      )
      .max(500),
    workingCombats: z.array(workingCombatSchema).max(500),
  })
  .strict();
const v6 = v5
  .extend({
    schemaVersion: z.literal(6),
    party: legacyCampaignPartySchema
      .extend({ inventoryLinks: z.tuple([]), combatLinks: z.tuple([]) })
      .transform(({ roster, profiles }) => ({ roster, profiles }))
      .optional(),
    workingCombats: z
      .array(
        workingCombatSchema
          .extend({ removedAt: z.string().datetime().optional() })
          .strict()
      )
      .max(500),
    workspace: v5.shape.workspace
      .extend({
        view: z.enum([
          'possessions',
          'combats',
          'history',
          'details',
          'tools',
          'session',
          'party',
        ]),
      })
      .strict(),
  })
  .strict();
const v7 = v6.extend({
  schemaVersion: z.literal(7),
  party: legacyCampaignPartySchema.optional(),
});
const v8 = v7.extend({ schemaVersion: z.literal(8) });
const v9 = v8.extend({ schemaVersion: z.literal(9) });
const v10 = v9.extend({
  schemaVersion: z.literal(10),
  xp: legacyCampaignXpSchema.optional(),
  workspace: v9.shape.workspace
    .extend({
      view: z.enum([
        'possessions',
        'combats',
        'history',
        'details',
        'tools',
        'session',
        'party',
        'xp',
      ]),
    })
    .strict(),
});

const v11 = v10.extend({
  schemaVersion: z.literal(11),
  xp: campaignXpSchema
    .omit({ extensions: true, pendingRecipientResets: true })
    .optional(),
});

const v12 = v11.extend({ schemaVersion: z.literal(12) });
const v13 = v12.extend({
  schemaVersion: z.literal(13),
  xp: campaignXpSchema.omit({ pendingRecipientResets: true }).optional(),
});
const v14 = v13.extend({
  schemaVersion: z.literal(14),
  party: campaignPartySchema.optional(),
  xp: campaignXpSchema.optional(),
});

const v15 = v14.extend({
  schemaVersion: z.literal(15),
  banking: legacyCampaignBankingSchema.optional(),
  workspace: v14.shape.workspace
    .extend({
      view: z.enum([
        'possessions',
        'combats',
        'history',
        'details',
        'tools',
        'session',
        'party',
        'xp',
        'banking',
      ]),
    })
    .strict(),
});

const v16 = v15.extend({
  schemaVersion: z.literal(16),
  banking: campaignBankingSchema.optional(),
});

export function validateCampaign(value: unknown): CampaignDocument {
  if (!value || typeof value !== 'object')
    throw new Error('Expected a campaign object.');
  const header = value as Record<string, unknown>;
  if (header['kind'] !== 'adnd-campaign')
    throw new Error('Not an AD&D campaign document.');
  if (
    header['schemaVersion'] !== 1 &&
    header['schemaVersion'] !== 2 &&
    header['schemaVersion'] !== 3 &&
    header['schemaVersion'] !== 4 &&
    header['schemaVersion'] !== 5 &&
    header['schemaVersion'] !== 6 &&
    header['schemaVersion'] !== 7 &&
    header['schemaVersion'] !== 8 &&
    header['schemaVersion'] !== 9 &&
    header['schemaVersion'] !== 10 &&
    header['schemaVersion'] !== 11 &&
    header['schemaVersion'] !== 12 &&
    header['schemaVersion'] !== 13 &&
    header['schemaVersion'] !== 14 &&
    header['schemaVersion'] !== 15 &&
    header['schemaVersion'] !== 16
  )
    throw new Error(
      'Unsupported campaign schema version. This app supports versions 1 through 16.'
    );
  if (
    value &&
    typeof value === 'object' &&
    (value as Record<string, unknown>)['schemaVersion'] === 1
  ) {
    return {
      ...v1.parse(value),
      schemaVersion: 16,
      workingCombats: [],
      combatCheckpoints: [],
      sessions: [],
      records: [],
      workingInventories: [],
      inventoryCheckpoints: [],
      workspace: { sessionId: null, view: 'possessions', combatSelections: {} },
    };
  }
  const legacy =
    header['schemaVersion'] === 2
      ? {
          ...v2.parse(value),
          schemaVersion: 3 as const,
          workingInventories: [],
          inventoryCheckpoints: [],
          workspace: { sessionId: null, view: 'possessions' as const },
        }
      : header['schemaVersion'] === 3
      ? v3.parse(value)
      : header['schemaVersion'] === 4
      ? v4.parse(value)
      : header['schemaVersion'] === 5
      ? v5.parse(value)
      : header['schemaVersion'] === 6
      ? v6.parse(value)
      : header['schemaVersion'] === 7
      ? v7.parse(value)
      : header['schemaVersion'] === 8
      ? v8.parse(value)
      : header['schemaVersion'] === 9
      ? v9.parse(value)
      : header['schemaVersion'] === 10
      ? v10.parse(value)
      : header['schemaVersion'] === 11
      ? v11.parse(value)
      : header['schemaVersion'] === 12
      ? v12.parse(value)
      : header['schemaVersion'] === 13
      ? v13.parse(value)
      : header['schemaVersion'] === 14
      ? v14.parse(value)
      : header['schemaVersion'] === 15
      ? v15.parse(value)
      : v16.parse(value);
  const migrated =
    legacy.schemaVersion === 3
      ? {
          ...legacy,
          schemaVersion: 4 as const,
          workingCombats: [],
          combatCheckpoints: [],
          workspace: { ...legacy.workspace, combatSelections: {} },
        }
      : legacy;
  const parsed = (migrated.schemaVersion === 4
    ? {
        ...migrated,
        schemaVersion: 16 as const,
        sessions: migrated.sessions.map((s) => ({ ...s, notes: '' })),
        workingCombats: migrated.workingCombats.map((c) => ({
          ...c,
          encounterId: c.id,
          status: 'unspecified' as const,
        })),
      }
    : {
        ...migrated,
        schemaVersion: 16 as const,
      }) as unknown as CampaignDocument;
  if (Number(header['schemaVersion']) < 9)
    parsed.workingInventories = parsed.workingInventories.map((w) => {
      const document = parseEncumbranceDocument(JSON.stringify(w.document));
      if (document.kind !== 'adnd-encumbrance-dm')
        throw new Error('DM inventory required.');
      return { ...w, document };
    });
  // Older XP previews had a separate chronology. Align the visible tabs once,
  // preserving its established as-of balances; subsequent tab moves mirror this field.
  if (parsed.xp?.sessionOrder.length) {
    const order = [
      ...parsed.xp.sessionOrder,
      ...parsed.sessions
        .map((s) => s.id)
        .filter((id) => !parsed.xp?.sessionOrder.includes(id)),
    ];
    parsed.sessions.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
  }
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
  for (const c of parsed.workingCombats) {
    unique(c.id);
    if (!parsed.sessions.some((s) => s.id === c.sessionId))
      throw new Error('Invalid combat session.');
    const origin = c.origin;
    if (
      origin.kind === 'import' &&
      !parsed.records.some(
        (r) =>
          r.id === origin.recordId &&
          r.type === 'combat' &&
          r.revisions.some((v) => v.id === origin.revisionId)
      )
    )
      throw new Error('Invalid combat origin.');
    if (
      origin.kind === 'checkpoint' &&
      !parsed.combatCheckpoints.some((p) => p.id === origin.checkpointId)
    )
      throw new Error('Invalid combat checkpoint origin.');
  }
  for (const p of parsed.combatCheckpoints) {
    unique(p.id);
    if (
      !parsed.workingCombats.some(
        (c) => c.id === p.combatId && c.sessionId === p.sessionId
      )
    )
      throw new Error('Invalid checkpoint encounter.');
  }
  for (const [sessionId, combatId] of Object.entries(
    parsed.workspace.combatSelections || {}
  )) {
    if (
      !parsed.workingCombats.some(
        (c) => c.id === combatId && c.sessionId === sessionId && !c.removedAt
      )
    )
      throw new Error('Invalid selected encounter.');
  }
  validatePartyReferences(parsed, unique);
  validateContinuationReferences(parsed);
  if (parsed.xp) parsed.xp = migrateXpTimeline(parsed.xp);
  validateCampaignBanking(parsed, unique);
  validateCampaignXp(parsed, unique);
  return parsed;
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

export { validateHistoryTransition } from './campaignHistory';
