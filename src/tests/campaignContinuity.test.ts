import baseline from './fixtures/campaignB1V2.json';
import { parseCampaign, serializeCampaign } from '../helpers/campaignDocument';
import {
  sessionFingerprint,
  startNextSession,
  validateContinuityTransition,
} from '../helpers/campaignContinuity';
import type { NextSessionRequest } from '../helpers/campaignContinuity';
import {
  createWorkingCombat,
  captureCombatCheckpoint,
  changeWorkingCombat,
} from '../helpers/campaignWorkingCombat';
import {
  startWorkingInventory,
  changeWorkingInventory,
} from '../helpers/campaignWorkingInventory';
import { syntheticCombat, syntheticInventory } from './fixtures/campaignB1';
import {
  validateHistoryTransition,
  ownedHistory,
} from '../helpers/campaignHistory';
import type { CampaignDocument } from '../helpers/campaignDocument';
const at = '2026-11-04T12:00:00.000Z';
function required<T>(v: T | undefined): T {
  if (v === undefined) throw Error('Missing fixture');
  return v;
}
function setup() {
  let doc = startWorkingInventory(
    parseCampaign(JSON.stringify(baseline)),
    'session-1',
    syntheticInventory(),
    { kind: 'import', recordId: 'inventory-1', revisionId: 'inventory-r1' },
    'inventory',
    'unused',
    at
  );
  for (const id of ['finished', 'ongoing', 'prepared', 'unspecified'])
    doc = createWorkingCombat(
      doc,
      'session-1',
      'Same title',
      syntheticCombat(),
      { kind: 'import', recordId: 'combat-1', revisionId: 'combat-r1' },
      id
    );
  doc.workingCombats = doc.workingCombats.map((c) => ({
    ...c,
    status:
      c.id === 'finished'
        ? 'finished'
        : c.id === 'ongoing'
        ? 'in-progress'
        : c.id === 'prepared'
        ? 'prepared'
        : 'unspecified',
  }));
  doc.sessions = doc.sessions.map((s) => ({
    ...s,
    notes: 'Stopping point\nRemember the lantern.',
  }));
  doc.workspace.combatSelections = { 'session-1': 'ongoing' };
  return doc;
}
function request(
  doc: CampaignDocument,
  inventory = true,
  copyNotes = true
): NextSessionRequest {
  return {
    campaignId: doc.id,
    sourceSessionId: 'session-1',
    sourceFingerprint: sessionFingerprint(doc, 'session-1'),
    destinationId: 'session-2',
    label: 'After the gate',
    combats: [
      {
        sourceId: 'ongoing',
        instanceId: 'ongoing-next',
        checkpointId: 'combat-before-next',
      },
    ],
    inventory: inventory
      ? {
          sourceId: 'inventory',
          instanceId: 'inventory-next',
          checkpointId: 'inventory-before-next',
        }
      : null,
    copyNotes,
    capturedAt: at,
  };
}
test('continuation copies exact multi-round state and notes, retains logical identity, and freezes source recovery history', () => {
  const source = setup(),
    before = serializeCampaign(source),
    next = startNextSession(source, request(source));
  expect(next.workingCombats).toHaveLength(5);
  const old = required(source.workingCombats.find((c) => c.id === 'ongoing')),
    copy = required(next.workingCombats.find((c) => c.id === 'ongoing-next'));
  expect(copy.encounterId).toBe(old.encounterId);
  expect(copy.id).not.toBe(old.id);
  expect(copy.state).toEqual(old.state);
  expect(copy.state.rounds).toHaveLength(2);
  expect(copy.state.activeRound).toBe(1);
  expect(copy.state).not.toBe(old.state);
  expect(copy.status).toBe('in-progress');
  expect(copy.continuedFrom?.checkpointId).toBe('combat-before-next');
  expect(next.combatCheckpoints[0]?.state).toEqual(old.state);
  expect(next.combatCheckpoints[0]?.status).toBe(old.status);
  expect(next.inventoryCheckpoints[0]?.document).toEqual(
    source.workingInventories[0]?.document
  );
  expect(next.workingInventories[1]?.document).toEqual(
    source.workingInventories[0]?.document
  );
  expect(next.sessions[1]?.notes).toBe(source.sessions[0]?.notes);
  expect(next.workspace.combatSelections?.['session-1']).toBe('ongoing');
  expect(serializeCampaign(source)).toBe(before);
  expect(() => validateHistoryTransition(source, next, '')).not.toThrow();
  expect(parseCampaign(serializeCampaign(next))).toEqual(next);
  const state = JSON.parse(JSON.stringify(copy.state)) as typeof copy.state;
  required(required(state.rounds[1]).partyStates[0]).hp = '3';
  let later = changeWorkingCombat(next, copy.id, 'session-2', 0, state);
  const inventory = syntheticInventory();
  required(required(inventory.characters[0]).inventory[2]).quantity = 9;
  later = changeWorkingInventory(
    later,
    'inventory-next',
    'session-2',
    inventory
  );
  later.sessions = later.sessions.map((s) =>
    s.id === 'session-2' ? { ...s, notes: 'Later notes' } : s
  );
  expect(later.workingCombats.find((c) => c.id === 'ongoing')?.state).toEqual(
    old.state
  );
  expect(later.combatCheckpoints).toEqual(next.combatCheckpoints);
  expect(later.inventoryCheckpoints).toEqual(next.inventoryCheckpoints);
  expect(later.sessions[0]?.notes).toBe(source.sessions[0]?.notes);
  expect(later.records).toEqual(source.records);
  expect(() => validateHistoryTransition(next, later, '')).not.toThrow();
  const history = ownedHistory(later, 'combat', copy);
  expect(history.checkpoints.has('combat-before-next')).toBe(true);
});
test('inventory, encounters and notes are independent explicit choices; no imported roster is carried automatically', () => {
  const source = setup(),
    plan = request(source, false, false);
  plan.combats = [];
  const next = startNextSession(source, plan);
  expect(next.workingInventories).toEqual(source.workingInventories);
  expect(next.workingCombats).toEqual(source.workingCombats);
  expect(next.combatCheckpoints).toEqual([]);
  expect(next.inventoryCheckpoints).toEqual([]);
  expect(next.sessions[1]?.notes).toBe('');
  const inventoryOnly = request(source, true, false);
  inventoryOnly.combats = [];
  const carried = startNextSession(source, inventoryOnly);
  expect(carried.workingCombats).toEqual(source.workingCombats);
  expect(carried.workingInventories).toHaveLength(2);
  for (const id of ['prepared', 'finished', 'unspecified']) {
    const explicit = request(source, false, false);
    explicit.combats = [
      {
        sourceId: id,
        instanceId: id + '-next',
        checkpointId: id + '-checkpoint',
      },
    ];
    const result = startNextSession(source, explicit);
    expect(
      result.workingCombats.find((c) => c.id === id + '-next')?.encounterId
    ).toBe(id);
  }
});
test('repeated confirmation is idempotent; stale data, duplicate selection, missing inventory and switched campaigns cannot transfer partially', () => {
  const source = setup(),
    plan = request(source),
    next = startNextSession(source, plan);
  expect(startNextSession(next, plan)).toBe(next);
  expect(() => startNextSession({ ...source, id: 'different' }, plan)).toThrow(
    'Campaign changed'
  );
  const revised: CampaignDocument = JSON.parse(JSON.stringify(source));
  required(revised.records[0]).title = 'Changed evidence selection';
  expect(() => startNextSession(revised, plan)).toThrow(
    'Source session changed'
  );
  const changed = {
    ...source,
    sessions: source.sessions.map((s) => ({
      ...s,
      notes: 'Changed after review',
    })),
  };
  expect(() => startNextSession(changed, plan)).toThrow(
    'Source session changed'
  );
  expect(() =>
    startNextSession(
      {
        ...source,
        sessions: [...source.sessions, { id: 'session-2', label: 'Existing' }],
      },
      plan
    )
  ).toThrow('already exists');
  expect(() =>
    startNextSession(source, {
      ...plan,
      combats: [...plan.combats, ...plan.combats],
    })
  ).toThrow('more than once');
  const missing = { ...source, workingInventories: [] },
    bad = request(missing);
  expect(() => startNextSession(missing, bad)).toThrow('inventory');
  expect(source.sessions).toHaveLength(1);
});
test('native-shared transition validation rejects advanced rounds, reset HP, changed notes, forged identities and missing source checkpoints', () => {
  const source = setup(),
    next = startNextSession(source, request(source));
  for (const tamper of [
    (d: CampaignDocument) => {
      required(
        d.workingCombats.find((c) => c.id === 'ongoing-next')
      ).state.activeRound = 0;
    },
    (d: CampaignDocument) => {
      required(
        required(
          required(d.workingCombats.find((c) => c.id === 'ongoing-next')).state
            .rounds[1]
        ).partyStates[0]
      ).hp = '99';
    },
    (d: CampaignDocument) => {
      required(d.sessions.find((s) => s.id === 'session-2')).notes =
        'Guessed notes';
    },
    (d: CampaignDocument) => {
      d.combatCheckpoints = [];
    },
    (d: CampaignDocument) => {
      required(
        d.workingCombats.find((c) => c.id === 'ongoing-next')
      ).encounterId = 'another-fight';
    },
  ]) {
    const bad: CampaignDocument = JSON.parse(JSON.stringify(next));
    tamper(bad);
    expect(() => {
      parseCampaign(serializeCampaign(bad));
      validateContinuityTransition(source, bad);
    }).toThrow();
  }
  const moved: CampaignDocument = JSON.parse(JSON.stringify(source));
  required(moved.workingCombats[0]).sessionId = 'session-2';
  expect(() => validateContinuityTransition(source, moved)).toThrow(
    'immutable'
  );
});
test('V1–V4 migrate without changing evidence/IDs/checkpoints and never infer status from rounds or HP', () => {
  const source = setup();
  const checkpointed = captureCombatCheckpoint(
    source,
    'ongoing',
    'Legacy history',
    'legacy-check',
    at
  );
  const legacySessions = source.sessions.map(({ id, label }) => ({
    id,
    label,
  }));
  const {
    workingCombats,
    combatCheckpoints,
    workingInventories,
    inventoryCheckpoints,
    workspace,
    ...envelope
  } = checkpointed;
  void workingCombats;
  void combatCheckpoints;
  void workingInventories;
  void inventoryCheckpoints;
  void workspace;
  const v4 = {
    ...checkpointed,
    schemaVersion: 4,
    sessions: legacySessions,
    workingCombats: checkpointed.workingCombats.map(
      ({ encounterId, status, continuedFrom, ...c }) => {
        void encounterId;
        void status;
        void continuedFrom;
        return c;
      }
    ),
    combatCheckpoints: checkpointed.combatCheckpoints.map(
      ({ status, ...c }) => {
        void status;
        return c;
      }
    ),
  };
  const variants = [
    {
      kind: source.kind,
      schemaVersion: 1,
      id: source.id,
      title: source.title,
      notes: source.notes,
    },
    { ...envelope, schemaVersion: 2, sessions: legacySessions },
    {
      ...envelope,
      schemaVersion: 3,
      sessions: legacySessions,
      workingInventories: source.workingInventories,
      inventoryCheckpoints: [],
      workspace: { sessionId: 'session-1', view: 'possessions' },
    },
    v4,
  ];
  for (const old of variants) {
    const bytes = JSON.stringify(old),
      migrated = parseCampaign(bytes);
    expect(migrated.schemaVersion).toBe(9);
    expect(migrated.id).toBe(source.id);
    expect(migrated.sessions.every((s) => s.notes === '')).toBe(true);
    expect(
      migrated.workingCombats.every(
        (c) => c.status === 'unspecified' && c.encounterId === c.id
      )
    ).toBe(true);
    expect(JSON.stringify(old)).toBe(bytes);
    if ('records' in old) expect(migrated.records).toEqual(old.records);
  }
  const migrated = parseCampaign(JSON.stringify(v4));
  expect(migrated.combatCheckpoints).toEqual(v4.combatCheckpoints);
  expect(migrated.workingInventories).toEqual(v4.workingInventories);
  expect(migrated.workingCombats.map((c) => c.id)).toEqual(
    source.workingCombats.map((c) => c.id)
  );
});
