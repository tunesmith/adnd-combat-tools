import { parseCampaign } from '../../helpers/campaignDocument';
import type { CampaignDocument } from '../../helpers/campaignDocument';
import {
  confirmXpAward,
  confirmXpExtension,
  newXpPoint,
  previewXpAward,
  previewXpExtension,
  saveXpOpening,
  saveXpPoint,
  saveXpReward,
  selectXpRewards,
  xpLedger,
} from '../../helpers/campaignXp';
import type { XpExtensionRequest } from '../../helpers/campaignXp';
import { newXpReward } from '../../helpers/campaignXpSources';
import { placeHistoricalSession } from '../../helpers/campaignSessionOrder';
import { xpAt } from './xpCampaign';

export function backfillSession(
  doc: CampaignDocument,
  number: number,
  before: number
) {
  return placeHistoricalSession(doc, `s${before}`, {
    id: `s${number}`,
    label: `Session ${number}`,
    notes: 'Synthetic earlier notes',
  });
}

function backfillAward(
  doc: CampaignDocument,
  id: string,
  session: number,
  amounts: Record<string, number>,
  amberLimit: number | null = null
) {
  const reward = newXpReward(doc, `s${session}`, `${id}-coins`, 'money');
  reward.title = `${id} synthetic coins`;
  reward.input = { category: 'money', gp: '20' };
  reward.recipients = Object.entries(amounts).map(([characterId, amount]) => ({
    characterId,
    name:
      doc.party?.roster.find((c) => c.id === characterId)?.name ?? characterId,
    participated: true,
    eligible: true,
    level: '5',
    shares: '1',
    allocationOverride: String(amount),
    allocationReason: 'Recorded synthetic share',
  }));
  let next = saveXpReward(doc, reward);
  next = saveXpPoint(next, {
    ...newXpPoint(next, `s${session}`, id),
    label: id,
  });
  next = selectXpRewards(next, id, [reward.id]);
  const point = xpLedger(next).points.find((p) => p.id === id);
  if (!point) throw new Error('Fixture award missing');
  return saveXpPoint(next, {
    ...point,
    bonuses: point.bonuses.map((b) => ({
      ...b,
      percent: '0',
      ...(b.characterId === 'amber' && amberLimit !== null
        ? {
            finalOverride: (amounts['amber'] ?? 0) + 300,
            finalReason: 'Recorded full synthetic award',
          }
        : {}),
    })),
    caps: point.bonuses.map(({ characterId }) => ({
      characterId,
      basis: {
        characterClass: null,
        baseLevel: null,
        mode:
          characterId === 'amber' && amberLimit !== null
            ? 'override'
            : 'uncapped',
        limit: characterId === 'amber' ? amberLimit : null,
        reason: 'Recorded synthetic trained-level exception',
      },
    })),
  });
}

export function extensionBaseline() {
  let doc = parseCampaign(
    JSON.stringify({
      kind: 'adnd-campaign',
      schemaVersion: 1,
      id: 'synthetic-d49',
      title: 'Synthetic Backward XP',
      notes: 'Synthetic campaign notes',
    })
  );
  doc.sessions = [
    { id: 's85', label: 'Session 85', notes: 'Existing cutoff notes' },
    { id: 's90', label: 'Session 90', notes: 'Existing later notes' },
  ];
  doc.workspace = { ...doc.workspace, sessionId: 's90', view: 'xp' };
  doc.party = {
    roster: ['Amber', 'Birch', 'Cedar'].map((name) => ({
      id: name.toLowerCase(),
      name,
      player: '',
      notes: '',
    })),
    profiles: [],
  };
  for (const [id, sessionId, balance] of [
    ['amber', 's85', 10000],
    ['birch', 's85', 8000],
    ['cedar', 's90', 77],
  ] as const) {
    doc = saveXpOpening(doc, {
      id: `opening-${id}`,
      characterId: id,
      sessionId,
      balance,
      reason: 'Trusted synthetic baseline',
    });
  }
  doc = backfillAward(doc, 'Later award', 90, { amber: 500, birch: 200 });
  return confirmXpAward(
    doc,
    'Later award',
    previewXpAward(doc, 'Later award').fingerprint,
    'later-event',
    xpAt
  );
}

export function extensionDrafts(capped = true) {
  let doc = backfillSession(extensionBaseline(), 70, 85);
  doc = backfillSession(doc, 80, 85);
  doc = backfillAward(
    doc,
    'First backfill award',
    70,
    { amber: 1500, birch: 1000 },
    capped ? 7500 : null
  );
  return backfillAward(doc, 'Second backfill award', 80, {
    amber: 2500,
    birch: 2000,
  });
}
export const firstRequest: XpExtensionRequest = {
  pointIds: ['Second backfill award', 'First backfill award'],
  openings: [
    { characterId: 'amber', sessionId: 's70', balance: 6000 },
    { characterId: 'birch', sessionId: 's70', balance: 5000 },
  ],
};
export function acceptExtension(
  doc: CampaignDocument,
  request: XpExtensionRequest,
  id: string
) {
  return confirmXpExtension(
    doc,
    request,
    previewXpExtension(doc, request).fingerprint,
    id,
    xpAt
  );
}
export const secondRequest: XpExtensionRequest = {
  pointIds: ['Earlier backfill award'],
  openings: [
    { characterId: 'amber', sessionId: 's50', balance: 4000 },
    { characterId: 'birch', sessionId: 's50', balance: 3000 },
  ],
};
export function secondExtensionDraft(doc: CampaignDocument) {
  return backfillAward(
    backfillSession(doc, 50, 70),
    'Earlier backfill award',
    50,
    { amber: 2000, birch: 2000 }
  );
}
