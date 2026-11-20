import { newTreasureRow, rewardEvidence } from './campaignXpTreasure';
import {
  profilesInSession,
  xpRecipientAvailable,
  encounterLevel,
} from './campaignParty';
import { xpExact, xpMultiply, xpNumber } from './xpArithmetic';
import { ownedHistory } from './campaignHistory';
import type { CampaignDocument } from './campaignDocument';
import type {
  XpEvidence,
  XpReward,
  XpRecipient,
  XpTreasureRow,
} from './campaignXpModel';
import { xpLedger } from './campaignXp';
import { fingerprint } from './campaignSnapshots';
import { parseEncumbranceDocument } from './encumbranceDocument';
import { inventoryHolders } from './encumbranceStorage';
import { encumbranceCatalogById } from '../tables/encumbranceCatalog';
import { getInventoryItemInfo } from './encumbranceRules';
import type { TrackerCombatant } from '../types/tracker';
const freeze = <T>(value: T): T => JSON.parse(JSON.stringify(value));

function defaultXpRecipients(
  doc: CampaignDocument,
  sessionId: string
): XpRecipient[] {
  return profilesInSession(doc, sessionId).flatMap((p) => {
    const c = doc.party?.roster.find((c) => c.id === p.characterId);
    return c && xpRecipientAvailable(doc, sessionId, c.id)
      ? [
          {
            characterId: c.id,
            name: c.name,
            participated: false,
            eligible: false,
            level: encounterLevel(p),
            shares: '1',
            allocationOverride: null,
            allocationReason: '',
          },
        ]
      : [];
  });
}
export function manualXpEvidence(sessionId: string): XpEvidence {
  return {
    kind: 'manual',
    sourceId: '',
    instanceId: '',
    sessionId,
    keys: [],
    label: 'Manual entry',
    fingerprint: '',
    snapshot: null,
  };
}

export function newXpReward(
  doc: CampaignDocument,
  sessionId: string,
  id: string,
  category: XpReward['input']['category']
): XpReward {
  return {
    id,
    version: 1,
    title: 'New XP event',
    origin: { sessionId, phase: 'during', order: 0 },
    input:
      category === 'monster'
        ? {
            category,
            monsters: [
              {
                id: `${id}-monster`,
                name: 'Monster group',
                count: 1,
                basis: 'hit-dice',
                hitDice: null,
                hpAdjustment: 0,
                startingHp: null,
                special: 0,
                exceptional: 0,
                bandOverride: null,
                bandReason: '',
              },
            ],
          }
        : category === 'money'
        ? { category, gp: null }
        : {
            category,
            rows: [newTreasureRow('first')],
          },
    recipients: defaultXpRecipients(doc, sessionId),
    ratio: {
      proposed: category === 'monster' ? null : '1',
      override: null,
      reason: '',
      recordedProposal: null,
      recordedReason: '',
    },
    rawOverride: null,
    evidence: manualXpEvidence(sessionId),
    distinctReason: '',
    notes: '',
  };
}
interface XpMonsterCandidate {
  key: string;
  aliases: string[];
  combatant: TrackerCombatant;
  firstSavedHp: string;
  firstSessionId: string;
  captured: boolean;
}
export function encounterXpCandidates(
  doc: CampaignDocument,
  instanceId: string
): XpMonsterCandidate[] {
  const selected = doc.workingCombats.find((c) => c.id === instanceId);
  if (!selected) return [];
  const found = new Map<string, XpMonsterCandidate>();
  const records = Array.from(
    new Set(
      doc.workingCombats
        .filter((c) => c.encounterId === selected.encounterId)
        .flatMap((c) => Array.from(ownedHistory(doc, 'combat', c).records))
    )
  ).sort();
  const captured = new Set(
    [
      ...xpLedger(doc).rewards,
      ...xpLedger(doc).events.flatMap((e) => e.rewards),
    ].flatMap((r) => r.evidence.keys)
  );
  for (const combat of doc.workingCombats.filter(
    (c) => c.encounterId === selected.encounterId
  ))
    for (const round of combat.state.rounds)
      round.enemies.forEach((combatant, index) => {
        const key = `encounter:${encodeURIComponent(
          selected.encounterId
        )}:enemy:${combatant.key}`;
        const aliases = records.map(
          (id) => `record:${encodeURIComponent(id)}:enemy:${combatant.key}`
        );
        if (!found.has(key))
          found.set(key, {
            key,
            aliases,
            combatant: { ...combatant },
            firstSavedHp: round.enemyStates[index]?.hp || '',
            firstSessionId: combat.sessionId,
            captured:
              captured.has(key) || aliases.some((alias) => captured.has(alias)),
          });
      });
  return Array.from(found.values());
}
export function rewardFromEncounter(
  doc: CampaignDocument,
  reward: XpReward,
  instanceId: string,
  keys: string[]
): XpReward {
  const combat = doc.workingCombats.find((c) => c.id === instanceId);
  if (!combat) throw new Error('Encounter changed.');
  const candidates = encounterXpCandidates(doc, instanceId).filter((c) =>
    keys.includes(c.key)
  );
  if (!candidates.length)
    throw new Error('Choose at least one distinct monster.');
  const snapshot = freeze({
    workingStateFingerprint: fingerprint(combat.state),
    title: combat.title,
    encounterId: combat.encounterId,
    monsters: candidates.map(
      ({ captured: _captured, ...candidate }) => candidate
    ),
    partyCandidates: combat.state.rounds.flatMap((r) =>
      r.party.map((c) => ({
        key: c.key,
        name: c.name,
        trackerClass: c.class,
        trackerCategory: c.level,
      }))
    ),
  });
  const evidence: XpEvidence = {
    kind: 'encounter',
    sourceId: Array.from(ownedHistory(doc, 'combat', combat).records).sort()[0]
      ? `record:${
          Array.from(ownedHistory(doc, 'combat', combat).records).sort()[0]
        }`
      : combat.encounterId,
    instanceId: combat.id,
    sessionId: combat.sessionId,
    keys: Array.from(new Set(candidates.flatMap((c) => [c.key, ...c.aliases]))),
    label: combat.title,
    snapshot,
    fingerprint: fingerprint(snapshot),
  };
  return {
    ...reward,
    title: combat.title,
    evidence,
    input: {
      category: 'monster',
      monsters: candidates.map((c) => ({
        id: c.key,
        name: c.combatant.name || 'Unnamed monster',
        count: 1,
        basis: 'hit-dice',
        hitDice: null,
        hpAdjustment: 0,
        // Recorded maximum is offered for review, never current remaining HP or a tracker category ID.
        startingHp:
          c.combatant.maxHp && /^\d+$/.test(c.combatant.maxHp)
            ? c.combatant.maxHp
            : null,
        special: 0,
        exceptional: 0,
        bandOverride: null,
        bandReason: '',
      })),
    },
  };
}
function inventoryRoot(doc: CampaignDocument, id: string): string {
  const visited = new Set<string>();
  let working = doc.workingInventories.find((w) => w.id === id);
  while (working?.continuedFrom && !visited.has(working.id)) {
    visited.add(working.id);
    const parent = doc.workingInventories.find(
      (w) => w.id === working?.continuedFrom?.instanceId
    );
    if (!parent) break;
    working = parent;
  }
  if (working?.origin.kind === 'import')
    return `record:${working.origin.recordId}`;
  return working?.id || id;
}
export function possessionXpCandidates(
  doc: CampaignDocument,
  sessionId: string
) {
  const working = doc.workingInventories.find((w) => w.sessionId === sessionId);
  if (!working) return [];
  const parsed = parseEncumbranceDocument(JSON.stringify(working.document));
  if (parsed.kind !== 'adnd-encumbrance-dm') return [];
  const known = new Set(
    [
      ...xpLedger(doc).rewards,
      ...xpLedger(doc).events.flatMap((e) => e.rewards),
    ].flatMap((r) => rewardEvidence(r).flatMap((e) => e.keys))
  );
  return inventoryHolders(parsed).flatMap((holder) =>
    holder.inventory.map((item) => {
      const definition = getInventoryItemInfo(item, encumbranceCatalogById);
      const key = `inventory:${encodeURIComponent(
        inventoryRoot(doc, working.id)
      )}:item:${encodeURIComponent(item.id)}`;
      return {
        key,
        item,
        definition,
        holderId: holder.id,
        holderName: holder.name,
        workingId: working.id,
        name: item.name || definition?.name || item.catalogId,
        gp: xpExact(
          xpMultiply(
            xpNumber(item.valueGpOverride ?? definition?.valueGp ?? 0),
            xpNumber(item.quantity)
          )
        ),
        captured: known.has(key),
        possibleRepeat: Array.from(known).some((other) =>
          other.endsWith(`:item:${encodeURIComponent(item.id)}`)
        ),
      };
    })
  );
}
function possessionEvidence(
  candidate: ReturnType<typeof possessionXpCandidates>[number],
  sessionId: string
): XpEvidence {
  const {
    captured: _captured,
    possibleRepeat: _repeat,
    ...rawSnapshot
  } = candidate;
  const snapshot = freeze(rawSnapshot);
  return {
    kind: 'item',
    sourceId: candidate.key,
    instanceId: candidate.workingId,
    sessionId,
    keys: [candidate.key],
    label: `${candidate.name} · ${candidate.holderName}`,
    snapshot,
    fingerprint: fingerprint(snapshot),
  };
}
export function captureTreasurePossession(
  row: XpTreasureRow,
  item: ReturnType<typeof possessionXpCandidates>[number],
  sessionId: string
): XpTreasureRow {
  const prior = row.evidence?.keys[0];
  const label =
    row.label && (!prior || prior === item.key) ? row.label : item.name;
  return {
    ...row,
    label,
    gp: item.gp,
    evidence: possessionEvidence(item, sessionId),
  };
}
export function rewardFromPossession(
  doc: CampaignDocument,
  reward: XpReward,
  sessionId: string,
  key: string
): XpReward {
  const candidate = possessionXpCandidates(doc, sessionId).find(
    (c) => c.key === key
  );
  if (!candidate) throw new Error('Inventory item changed.');
  if (reward.input.category === 'money')
    return {
      ...reward,
      title: candidate.name,
      evidence: possessionEvidence(candidate, sessionId),
      input: { category: 'money', gp: candidate.gp },
    };
  const rows =
    reward.input.category === 'treasure'
      ? reward.input.rows
      : [newTreasureRow('first')];
  const [row] = rows;
  if (!row || rows.length !== 1)
    throw Error('Choose a treasure row for this possession.');
  return {
    ...reward,
    input: {
      category: 'treasure',
      rows: [captureTreasurePossession(row, candidate, sessionId)],
    },
  };
}
export function refreshXpEvidence(
  doc: CampaignDocument,
  reward: XpReward
): XpReward {
  if (reward.input.category === 'treasure') {
    const [row] = reward.input.rows;
    if (reward.input.rows.length === 1 && row?.evidence) {
      return rewardFromPossession(
        doc,
        reward,
        row.evidence.sessionId,
        row.evidence.keys[0] || ''
      );
    }
    return reward;
  }
  if (reward.evidence.kind === 'encounter') {
    const copy = rewardFromEncounter(
      doc,
      reward,
      reward.evidence.instanceId,
      reward.evidence.keys
    );
    if (
      copy.input.category === 'monster' &&
      reward.input.category === 'monster'
    ) {
      const previous = reward.input.monsters;
      return {
        ...copy,
        input: {
          ...copy.input,
          monsters: copy.input.monsters.map((m) => {
            const old = previous.find((p) => p.id === m.id);
            return old ? { ...old, name: m.name, startingHp: m.startingHp } : m;
          }),
        },
      };
    }
    return copy;
  }
  if (reward.evidence.kind === 'item')
    return rewardFromPossession(
      doc,
      reward,
      reward.evidence.sessionId,
      reward.evidence.keys[0] || ''
    );
  return reward;
}
export function xpEvidenceChanged(
  doc: CampaignDocument,
  reward: XpReward
): boolean {
  try {
    if (reward.input.category === 'treasure') {
      return reward.input.rows.some((row) => {
        if (!row.evidence) return false;
        const item = possessionXpCandidates(doc, row.evidence.sessionId).find(
          (c) => c.key === row.evidence?.keys[0]
        );
        return (
          !item ||
          possessionEvidence(item, row.evidence.sessionId).fingerprint !==
            row.evidence.fingerprint
        );
      });
    }
    if (reward.evidence.kind === 'manual') return false;
    return (
      refreshXpEvidence(doc, reward).evidence.fingerprint !==
      reward.evidence.fingerprint
    );
  } catch {
    return true;
  }
}

export function xpEvidencePartyNames(evidence: XpEvidence): string[] {
  if (!evidence.snapshot || typeof evidence.snapshot !== 'object') return [];
  const candidates = (evidence.snapshot as Record<string, unknown>)[
    'partyCandidates'
  ];
  if (!Array.isArray(candidates)) return [];
  return Array.from(
    new Set(
      candidates.flatMap((entry: unknown) =>
        entry &&
        typeof entry === 'object' &&
        typeof (entry as Record<string, unknown>)['name'] === 'string'
          ? [String((entry as Record<string, unknown>)['name'])]
          : []
      )
    )
  );
}
