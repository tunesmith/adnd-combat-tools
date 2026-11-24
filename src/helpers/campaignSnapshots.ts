import { z } from 'zod';
import { Decompress, strFromU8, strToU8 } from 'fflate';
import { sha256 } from 'js-sha256';
import { getTrackerEncodedStateFromUrlText } from './trackerUrl';
import { transformTrackerState, compactTrackerState } from './trackerCodec';
import { parseEncumbranceDocument } from './encumbranceDocument';
import { isSessionDate } from './campaignSessionMetadata';
import type { TrackerState, TrackerStateAnyVersion } from '../types/tracker';

const MAX_SOURCE_BYTES = 1_000_000;
export const MAX_CAMPAIGN_BYTES = 8_000_000;
export type Json =
  | null
  | boolean
  | number
  | string
  | Json[]
  | { [key: string]: Json };
export function canonical(value: unknown): string {
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  if (value && typeof value === 'object')
    return (
      '{' +
      Object.keys(value)
        .sort()
        .map(
          (k) =>
            JSON.stringify(k) +
            ':' +
            canonical((value as Record<string, unknown>)[k])
        )
        .join(',') +
      '}'
    );
  return JSON.stringify(value);
}
export const fingerprint = (value: unknown): string => sha256(canonical(value));
const string = z.string();
const number = z.number().finite();
export const trackerCombatantSchema = z.object({
  key: number.int(),
  name: string.optional(),
  class: number,
  level: number,
  armorType: number,
  armorClass: number,
  weapon: number,
  maxHp: string.optional(),
  movementRate: number.optional(),
  missileInitiativeAdjustment: number.optional(),
  attacksPerRoutine: number.optional(),
  offHandWeapon: number.int().optional(),
  weaponShortlist: z.array(number).optional(),
  preparedEnemyId: string.min(1).optional(),
});
const roster = z.array(trackerCombatantSchema.passthrough()).max(100);
const state = z
  .object({
    hp: string,
    effect: string,
    nextRoundEffect: string.optional(),
    nextRoundEffectOverride: string.optional(),
    action: string,
    result: string,
    notes: string,
  })
  .passthrough();
const cell = z
  .object({
    enemyToParty: string,
    partyToEnemy: string,
    enemyToPartyVisible: z.boolean().optional(),
    partyToEnemyVisible: z.boolean().optional(),
    isVisible: z.boolean().optional(),
    enemyToPartyNoTarget: z.literal(true).optional(),
    partyToEnemyNoTarget: z.literal(true).optional(),
    enemyToPartyManualBlank: z.literal(true).optional(),
    partyToEnemyManualBlank: z.literal(true).optional(),
    enemyToPartyActionIds: z.array(string).optional(),
    partyToEnemyActionIds: z.array(string).optional(),
  })
  .passthrough();
const action = z
  .object({
    id: string.min(1),
    side: z.enum(['party', 'enemy']),
    combatantKey: number.int(),
    combatantIndex: number.int().nonnegative().optional(),
    targetSide: z.enum(['party', 'enemy']).optional(),
    direction: z.enum(['partyToEnemy', 'enemyToParty']).optional(),
    source: z.enum(['combat-cell', 'intention']).optional(),
    actionLabel: string.optional(),
    initiativeTiming: z
      .enum(['normal', 'wins-initiative', 'loses-initiative'])
      .optional(),
    attackRoutineCount: number.optional(),
    weaponId: number.int().optional(),
    usesGridTargets: z.boolean().optional(),
    castingSegments: number.nonnegative().optional(),
    activationSegments: number.nonnegative().optional(),
    actionDistanceInches: number.nonnegative().optional(),
    declaredAction: z.enum([
      'none',
      'open-melee',
      'close',
      'charge',
      'set-vs-charge',
      'missile',
      'turn-undead',
      'magical-device',
      'spell-casting',
    ]),
    targetCombatantKeys: z.array(number.int()).optional(),
    targetDeclarations: z
      .array(
        z
          .object({
            targetCombatantKey: number.int(),
            targetCombatantIndex: number.int().nonnegative(),
            cellRowIndex: number.int().nonnegative(),
            cellColumnIndex: number.int().nonnegative(),
            cellResultText: string,
          })
          .passthrough()
      )
      .optional(),
    intention: string.optional(),
    result: string.optional(),
  })
  .passthrough();
const round = z
  .object({
    party: roster.optional(),
    enemies: roster.optional(),
    partyInitiative: string,
    enemyInitiative: string,
    summary: string,
    label: string.optional(),
    partyStates: z.array(state),
    enemyStates: z.array(state),
    actions: z.array(action).optional(),
    stepResults: z
      .array(
        z.object({
          stepKey: string.nullable(),
          side: z.enum(['party', 'enemy']),
          actorKey: number.int(),
          actorName: string,
          targetKeys: z.array(number.int()),
          targetLabel: string,
          stepLabel: string,
          gridMark: string.optional(),
          text: string,
        })
      )
      .optional(),
    cells: z.array(z.unknown()),
  })
  .passthrough();
const tracker = z
  .object({
    version: number.int().min(1).max(8),
    title: string.optional(),
    activeRound: number.int().nonnegative(),
    party: roster.optional(),
    enemies: roster.optional(),
    rounds: z.array(round).min(1).max(200),
  })
  .passthrough();
function validateTracker(value: unknown): TrackerStateAnyVersion {
  const data = tracker.parse(value);
  if (data.activeRound >= data.rounds.length)
    throw new Error('Invalid active round.');
  for (const r of data.rounds) {
    if (data.version >= 7 && typeof r.label !== 'string')
      throw new Error('Missing round label.');
    const party = data.version >= 5 ? r.party : data.party;
    const enemies = data.version >= 5 ? r.enemies : data.enemies;
    if (
      !party ||
      !enemies ||
      r.partyStates.length !== party.length ||
      r.enemyStates.length !== enemies.length
    )
      throw new Error('Invalid round rosters or HP state counts.');
    for (const list of [party, enemies])
      if (new Set(list.map((c) => c.key)).size !== list.length)
        throw new Error('Duplicate combatant key in roster.');
    const actions = r.actions || [];
    if (new Set(actions.map((a) => a.id)).size !== actions.length)
      throw new Error('Duplicate action ID.');
    for (const a of actions) {
      const source = a.side === 'party' ? party : enemies;
      const target = a.side === 'party' ? enemies : party;
      const sourceIndex = source.findIndex((c) => c.key === a.combatantKey);
      const targets = [
        ...(a.targetCombatantKeys || []),
        ...(a.targetDeclarations || []).map((t) => t.targetCombatantKey),
      ];
      if (
        sourceIndex < 0 ||
        targets.some((k) => !target.some((c) => c.key === k)) ||
        (a.combatantIndex !== undefined && a.combatantIndex !== sourceIndex)
      )
        throw new Error('Invalid action combatant reference.');
      for (const t of a.targetDeclarations || []) {
        const targetIndex = target.findIndex(
          (c) => c.key === t.targetCombatantKey
        );
        if (
          t.targetCombatantIndex !== targetIndex ||
          t.cellRowIndex !== (a.side === 'party' ? targetIndex : sourceIndex) ||
          t.cellColumnIndex !== (a.side === 'party' ? sourceIndex : targetIndex)
        )
          throw new Error('Invalid action target or cell reference.');
      }
    }
    if (data.version === 8) {
      const seen = new Set<string>();
      for (const entry of r.cells) {
        const c = z
          .object({
            rowIndex: number.int().nonnegative(),
            columnIndex: number.int().nonnegative(),
            enemyToParty: string.optional(),
            partyToEnemy: string.optional(),
            enemyToPartyVisible: z.boolean().optional(),
            partyToEnemyVisible: z.boolean().optional(),
            enemyToPartyNoTarget: z.literal(true).optional(),
            partyToEnemyNoTarget: z.literal(true).optional(),
            enemyToPartyManualBlank: z.literal(true).optional(),
            partyToEnemyManualBlank: z.literal(true).optional(),
            enemyToPartyActionIds: z.array(string).optional(),
            partyToEnemyActionIds: z.array(string).optional(),
          })
          .passthrough()
          .parse(entry);
        const key = `${c.rowIndex}:${c.columnIndex}`;
        if (
          c.rowIndex >= enemies.length ||
          c.columnIndex >= party.length ||
          seen.has(key)
        )
          throw new Error('Invalid sparse cell reference.');
        seen.add(key);
        for (const id of [
          ...(c.enemyToPartyActionIds || []),
          ...(c.partyToEnemyActionIds || []),
        ])
          if (!actions.some((a) => a.id === id))
            throw new Error('Invalid cell action reference.');
      }
    } else {
      if (r.cells.length !== enemies.length)
        throw new Error('Invalid cell row count.');
      for (const rowValue of r.cells) {
        const row = z.array(data.version === 1 ? string : cell).parse(rowValue);
        if (row.length !== party.length)
          throw new Error('Invalid cell column count.');
        for (const c of row) {
          if (typeof c === 'string') continue;
          if (
            data.version >= 6 &&
            (typeof c.enemyToPartyVisible !== 'boolean' ||
              typeof c.partyToEnemyVisible !== 'boolean')
          )
            throw new Error('Invalid cell visibility.');
          if (
            (data.version === 4 || data.version === 5) &&
            typeof c.isVisible !== 'boolean'
          )
            throw new Error('Invalid legacy cell visibility.');
          for (const id of [
            ...(c.enemyToPartyActionIds || []),
            ...(c.partyToEnemyActionIds || []),
          ])
            if (!actions.some((a) => a.id === id))
              throw new Error('Invalid cell action reference.');
        }
      }
    }
  }
  return data as TrackerStateAnyVersion;
}
function decodeUrl(text: string): string {
  const encoded = decodeURIComponent(
    getTrackerEncodedStateFromUrlText(text.trim()) || ''
  )
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(encoded) || encoded.length % 4 === 1)
    throw new Error('Malformed tracker URL state.');
  const alphabet =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const bytes: number[] = [];
  let bits = 0,
    count = 0;
  for (const ch of encoded.replace(/=+$/, '')) {
    bits = (bits << 6) | alphabet.indexOf(ch);
    count += 6;
    if (count >= 8) {
      count -= 8;
      bytes.push((bits >> count) & 255);
    }
  }
  let total = 0;
  const chunks: Uint8Array[] = [];
  const stream = new Decompress((chunk) => {
    total += chunk.length;
    if (total > MAX_SOURCE_BYTES)
      throw new Error('Decompressed tracker exceeds 1 MB.');
    chunks.push(chunk);
  });
  const input = new Uint8Array(bytes);
  if (
    input.length < 6 ||
    ((input[0] || 0) & 15) !== 8 ||
    ((input[0] || 0) * 256 + (input[1] || 0)) % 31 !== 0 ||
    ((input[1] || 0) & 32) !== 0
  )
    throw new Error('Invalid tracker compression header.');
  for (let i = 0; i < input.length; i += 16)
    stream.push(input.subarray(i, i + 16), i + 16 >= input.length);
  const output = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.length;
  }
  let a = 1,
    b = 0;
  output.forEach((byte) => {
    a = (a + byte) % 65521;
    b = (b + a) % 65521;
  });
  const n = input.length;
  const checksum =
    (((input[n - 4] || 0) << 24) |
      ((input[n - 3] || 0) << 16) |
      ((input[n - 2] || 0) << 8) |
      (input[n - 1] || 0)) >>>
    0;
  if (((b << 16) | a) >>> 0 !== checksum)
    throw new Error('Tracker data is truncated or its checksum is invalid.');
  const decoded = strFromU8(output);
  const reencoded: Uint8Array = strToU8(decoded);
  if (
    reencoded.length !== output.length ||
    reencoded.some((byte, i) => byte !== output[i])
  )
    throw new Error('Tracker data is not valid UTF-8.');
  return decoded;
}
export type SourceKind = 'tracker-url' | 'tracker-json' | 'inventory-json';
export interface SnapshotInterpretation {
  payload: Json;
  sourceVersion: number;
  contentHash: string;
  sourceHash: string;
  normalizerVersion: 1;
}
export function interpretSource(
  sourceKind: SourceKind,
  sourceText: string
): SnapshotInterpretation {
  if (strToU8(sourceText).length > MAX_SOURCE_BYTES)
    throw new Error('Source exceeds 1 MB.');
  const rawText =
    sourceKind === 'tracker-url' ? decodeUrl(sourceText) : sourceText;
  const raw: unknown = JSON.parse(rawText);
  let normalized: unknown;
  let sourceVersion: number;
  if (sourceKind === 'inventory-json') {
    const header = z
      .object({
        kind: z.literal('adnd-encumbrance-dm'),
        version: number.int().min(1).max(10),
      })
      .passthrough()
      .safeParse(raw);
    if (!header.success)
      throw new Error(
        'Import a supported DM inventory (versions 1–10). Player files are redacted and cannot be used as the full DM record.'
      );
    const rawCharacters = z
      .array(
        z
          .object({
            id: string,
            inventory: z.array(
              z
                .object({ id: string, containerId: string.nullable() })
                .passthrough()
            ),
          })
          .passthrough()
      )
      .parse(
        header.data.version >= 7
          ? header.data['characters']
          : [
              {
                id: 'legacy-single-character',
                inventory: header.data['inventory'],
              },
            ]
      );
    for (const c of rawCharacters) {
      const ids = new Set(c.inventory.map((i) => i.id));
      if (ids.size !== c.inventory.length)
        throw new Error('Duplicate item ID.');
      for (const item of c.inventory) {
        const visited = new Set([item.id]);
        let parent = item.containerId;
        while (parent) {
          if (!ids.has(parent) || visited.has(parent))
            throw new Error('Invalid or cyclic container reference.');
          visited.add(parent);
          parent =
            c.inventory.find((i) => i.id === parent)?.containerId || null;
        }
      }
    }
    const doc = parseEncumbranceDocument(
      rawText,
      header.data.version < 7 ? 'legacy-single-character' : undefined
    );
    if (doc.kind !== 'adnd-encumbrance-dm')
      throw new Error('DM inventory required.');
    if (new Set(doc.characters.map((c) => c.id)).size !== doc.characters.length)
      throw new Error('Duplicate character ID.');
    for (const c of doc.characters) {
      const ids = new Set(c.inventory.map((i) => i.id));
      if (ids.size !== c.inventory.length)
        throw new Error('Duplicate item ID.');
      for (const item of c.inventory) {
        const visited = new Set([item.id]);
        let parent = item.containerId;
        while (parent) {
          if (!ids.has(parent) || visited.has(parent))
            throw new Error('Invalid or cyclic container reference.');
          visited.add(parent);
          parent =
            c.inventory.find((i) => i.id === parent)?.containerId || null;
        }
      }
    }
    // Normalizer 1 is frozen for older evidence. Never rewrite retained payloads/hashes.
    if (header.data.version < 10) {
      const { storageLocations: _storage, ...legacy } = doc;
      normalized = { ...legacy, version: 9 };
    } else normalized = doc;
    sourceVersion = header.data.version;
  } else {
    const parsed = validateTracker(raw);
    const doc = transformTrackerState(parsed);
    doc.rounds.forEach((r, i) => {
      for (const side of ['partyStates', 'enemyStates'] as const)
        r[side].forEach((s, j) => {
          if (parsed.rounds[i]?.[side][j]?.hp === '') s.hp = '';
        });
    });
    normalized = doc;
    sourceVersion = parsed.version;
  }
  const payload: Json = JSON.parse(JSON.stringify(normalized));
  return {
    payload,
    sourceVersion,
    contentHash: fingerprint(payload),
    sourceHash: sha256(sourceText),
    normalizerVersion: 1,
  };
}
const revisionSchema = z
  .object({
    id: string.min(1),
    importedAt: string.datetime(),
    sourceKind: z.enum(['tracker-url', 'tracker-json', 'inventory-json']),
    sourceText: string,
    sourceName: string,
    sourceHash: string,
    contentHash: string,
    sourceVersion: number.int(),
    normalizerVersion: z.literal(1),
    payload: z.custom<Json>((value) => value !== undefined),
  })
  .strict();
export interface CampaignRevision extends SnapshotInterpretation {
  id: string;
  importedAt: string;
  sourceKind: SourceKind;
  sourceText: string;
  sourceName: string;
}
export interface CampaignSession {
  partyOrder?: string[];
  id: string;
  label: string;
  date?: string;
  sessionNumber?: number;
}
export interface CampaignRecord {
  id: string;
  type: 'combat' | 'inventory';
  title: string;
  sessionId: string;
  currentRevisionId: string;
  revisions: CampaignRevision[];
}
export const sessionSchema = z
  .object({
    id: string.min(1),
    label: string.min(1).max(1000),
    date: string.refine(isSessionDate, 'Invalid session date.').optional(),
    sessionNumber: number
      .int()
      .positive()
      .max(Number.MAX_SAFE_INTEGER)
      .optional(),
    partyOrder: z.array(string.min(1)).max(500).optional(),
  })
  .strict();
export const recordSchema = z
  .object({
    id: string.min(1),
    type: z.enum(['combat', 'inventory']),
    title: string.max(1000),
    sessionId: string.min(1),
    currentRevisionId: string.min(1),
    revisions: z.array(revisionSchema).min(1).max(200),
  })
  .strict();

/** Match the standalone codec's omitted defaults without changing stored evidence. */
export function contentIdentity(
  type: 'combat' | 'inventory',
  payload: Json
): string {
  return fingerprint({
    type,
    payload:
      type === 'combat'
        ? compactTrackerState(payload as unknown as TrackerState)
        : parseEncumbranceDocument(JSON.stringify(payload)),
  });
}
