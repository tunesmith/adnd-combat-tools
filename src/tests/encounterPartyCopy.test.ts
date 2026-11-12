import {
  parseCampaign,
  serializeCampaign,
  validateHistoryTransition,
} from '../helpers/campaignDocument';
import {
  createEncounterFromParty,
  createWorkingCombat,
  changeWorkingCombat,
} from '../helpers/campaignWorkingCombat';
import { syntheticCombat } from './fixtures/campaignB1';
import baseline from './fixtures/campaignSnapshots.json';
function required<T>(value: T | undefined): T {
  if (value === undefined) throw new Error('Missing test fixture value');
  return value;
}
const at = '2026-11-12T12:00:00.000Z';
function fixture() {
  const state = syntheticCombat();
  state.activeRound = 0;
  const last = required(state.rounds[state.rounds.length - 1]);
  last.partyStates[0] = {
    hp: '',
    notes: 'Combat reference',
    effect: 'Bless',
    action: 'Attack',
    result: 'Hit',
  };
  last.partyStates[1] = {
    hp: '2+1',
    notes: 'Shield',
    effect: '',
    action: '',
    result: '',
  };
  return createWorkingCombat(
    parseCampaign(JSON.stringify(baseline)),
    'session-1',
    'Source',
    state,
    { kind: 'empty' },
    'source'
  );
}
test('copies last-round setup and exact HP, retains reference notes, clears transient state and preserves history', () => {
  const doc = fixture(),
    before = serializeCampaign(doc);
  const source = required(doc.workingCombats.find((c) => c.id === 'source'));
  const last = required(source.state.rounds[source.state.rounds.length - 1]);
  const next = createEncounterFromParty(
    doc,
    'session-1',
    'Hobgoblins',
    source,
    'new',
    'checkpoint',
    at
  );
  validateHistoryTransition(doc, next, 'edit');
  const reopened = parseCampaign(serializeCampaign(next));
  const copy = required(reopened.workingCombats.find((c) => c.id === 'new'));
  expect(copy.encounterId).toBe('new');
  expect(copy.continuedFrom).toBeUndefined();
  expect(copy.state.activeRound).toBe(0);
  expect(copy.state.rounds).toHaveLength(1);
  expect(copy.state.rounds[0]).toMatchObject({
    label: 'Round 1',
    party: last.party,
    enemies: [],
    enemyStates: [],
    cells: [],
    summary: '',
    partyInitiative: '',
    enemyInitiative: '',
  });
  expect(required(copy.state.rounds[0]).actions || []).toEqual([]);
  expect(required(copy.state.rounds[0]).partyStates).toEqual(
    last.partyStates.map((s) => ({
      hp: s.hp,
      notes: s.notes,
      effect: '',
      action: '',
      result: '',
    }))
  );
  expect(reopened.workspace.combatSelections?.['session-1']).toBe('new');
  required(required(copy.state.rounds[0]).partyStates[0]).hp = '4';
  const corrected = changeWorkingCombat(
    reopened,
    'new',
    'session-1',
    0,
    copy.state
  );
  expect(corrected.workingCombats.find((c) => c.id === 'source')).toEqual(
    source
  );
  expect(serializeCampaign(doc)).toBe(before);
  expect(
    createEncounterFromParty(
      next,
      'session-1',
      'Duplicate',
      source,
      'new',
      'checkpoint',
      at
    )
  ).toBe(next);
});
test('empty creation and stale source guards', () => {
  const doc = fixture();
  const next = createEncounterFromParty(
    doc,
    'session-1',
    'Empty',
    undefined,
    'new',
    'unused',
    at
  );
  validateHistoryTransition(doc, next, 'edit');
  expect(
    required(
      required(next.workingCombats.find((c) => c.id === 'new')).state.rounds[0]
    ).party
  ).toEqual([]);
  for (const source of [
    { id: 'missing', generation: 0 },
    { id: 'source', generation: 1 },
  ]) {
    expect(() =>
      createEncounterFromParty(
        doc,
        'session-1',
        'Bad',
        source,
        'new',
        'checkpoint',
        at
      )
    ).toThrow('Source encounter');
  }
  const source = required(doc.workingCombats.find((c) => c.id === 'source'));
  source.removedAt = at;
  expect(() =>
    createEncounterFromParty(
      doc,
      'session-1',
      'Bad',
      source,
      'new',
      'checkpoint',
      at
    )
  ).toThrow('Source encounter');
});
