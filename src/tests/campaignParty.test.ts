import baseline from './fixtures/campaignSnapshots.json';
import { syntheticCombat, syntheticInventory } from './fixtures/campaignB1';
import {
  parseCampaign,
  serializeCampaign,
  validateCampaign,
} from '../helpers/campaignDocument';
import {
  createWorkingCombat,
  changeWorkingCombat,
} from '../helpers/campaignWorkingCombat';
import { startWorkingInventory } from '../helpers/campaignWorkingInventory';
import {
  sessionFingerprint,
  startNextSession,
} from '../helpers/campaignContinuity';
import { validateHistoryTransition } from '../helpers/campaignHistory';
import { setEncounterRemoval } from '../helpers/campaignEncounterRemoval';
import {
  calculatedSaves,
  effectiveLevel,
  emptyProfile,
  combatValuesForProfile,
  updatePartyProfile,
} from '../helpers/campaignParty';
import { insertRoundAfterActive } from '../helpers/trackerState';
import { BARD, CLERIC, FIGHTER } from '../tables/attackerClass';

const at = '2026-11-04T12:00:00.000Z';
function required<T>(value: T | undefined): T {
  if (value === undefined) throw new Error('Missing fixture');
  return value;
}
function fixture() {
  let doc = parseCampaign(JSON.stringify(baseline));
  doc = startWorkingInventory(
    doc,
    'session-1',
    syntheticInventory(),
    { kind: 'import', recordId: 'inventory-1', revisionId: 'inventory-r1' },
    'inventory',
    'unused',
    at
  );
  const state = syntheticCombat();
  for (const round of state.rounds) {
    const actor = required(round.party[0]);
    actor.class = CLERIC;
    actor.level = 6;
    required(round.partyStates[0]).hp = '14';
  }
  doc = createWorkingCombat(
    doc,
    'session-1',
    'Lantern fight',
    state,
    { kind: 'import', recordId: 'combat-1', revisionId: 'combat-r1' },
    'fight'
  );
  doc = createWorkingCombat(
    doc,
    'session-1',
    'Other fight',
    state,
    { kind: 'empty' },
    'other'
  );
  const profile = {
    ...emptyProfile('session-1', 'pc-a'),
    characterClass: 'cleric' as const,
    baseLevel: 6,
    adjustment: { name: 'Lantern blessing', enabled: false },
  };
  doc = updatePartyProfile(doc, profile, {
    id: 'pc-a',
    name: 'Mira',
    player: 'Synthetic player',
    notes: 'Synthetic notes',
  });
  doc = updatePartyProfile(doc, emptyProfile('session-1', 'pc-b'), {
    id: 'pc-b',
    name: 'Mira',
    player: 'Another player',
    notes: '',
  });
  return doc;
}

test('a named +1 crosses the cleric band, preserves overrides, and leaves combat rounds independent', () => {
  const doc = fixture(),
    profile = required(doc.party?.profiles[0]),
    combat = required(doc.workingCombats[0]);
  expect(calculatedSaves(profile)).toEqual([9, 12, 13, 15, 14]);
  const enabled = updatePartyProfile(doc, {
    ...profile,
    adjustment: { name: 'Lantern blessing', enabled: true },
    overrides: [5, null, null, null, null],
    saveNotes: ['Free text', '', ''],
  });
  const current = required(enabled.party?.profiles[0]);
  expect(current.baseLevel).toBe(6);
  expect(effectiveLevel(current)).toBe(7);
  expect(calculatedSaves(current)).toEqual([7, 10, 11, 13, 12]);
  expect(current.overrides[0]).toBe(5);
  expect(current.saveNotes[0]).toBe('Free text');
  expect(enabled.workingCombats).toEqual(doc.workingCombats);
  const newRound = insertRoundAfterActive(combat.state);
  expect(newRound.rounds.slice(0, 2)).toEqual(combat.state.rounds);
  expect(newRound.rounds[2]?.party[0]?.level).toBe(6);
  expect(newRound.rounds[2]?.partyStates[0]?.hp).toBe('14');
  const edited = changeWorkingCombat(
    enabled,
    combat.id,
    combat.sessionId,
    combat.generation,
    newRound
  );
  expect(edited.party).toEqual(enabled.party);
  expect(edited.workingInventories).toEqual(doc.workingInventories);
  expect(parseCampaign(serializeCampaign(edited))).toEqual(edited);
});

test('reviewed bard history separates saves from fighter attack levels, and unsupported cases stay manual', () => {
  const profile = {
    ...emptyProfile('session-1', 'pc'),
    characterClass: 'bard' as const,
    baseLevel: 6,
    retainedFighter: 5,
    retainedThief: 6,
    adjustment: { name: 'Blessing', enabled: true },
  };
  expect(calculatedSaves(profile)).toEqual([7, 10, 11, 13, 12]);
  expect(combatValuesForProfile(profile)).toEqual({ class: BARD, level: 5 });
  expect(calculatedSaves({ ...profile, retainedThief: null })).toBeNull();
  expect(calculatedSaves({ ...profile, saveBasis: 'manual' })).toBeNull();
  expect(
    combatValuesForProfile({ ...profile, combatBasis: 'manual' })
  ).toBeUndefined();
  expect(calculatedSaves({ ...profile, characterClass: 'monk' })).toEqual([
    12, 11, 12, 15, 13,
  ]);
  expect(
    combatValuesForProfile({ ...profile, characterClass: 'monk' })
  ).toBeUndefined();
  expect(
    combatValuesForProfile({
      ...profile,
      characterClass: 'fighter',
      baseLevel: 22,
    })
  ).toEqual({ class: FIGHTER, level: 17 });
});

test('selective continuation copies profiles and working data independently, even with duplicate names', () => {
  const doc = fixture();
  const next = startNextSession(doc, {
    campaignId: doc.id,
    sourceSessionId: 'session-1',
    sourceFingerprint: sessionFingerprint(doc, 'session-1'),
    destinationId: 'session-2',
    label: 'Next session',
    copyNotes: false,
    capturedAt: at,
    partyCharacterIds: ['pc-a'],
    combats: [
      {
        sourceId: 'fight',
        instanceId: 'continued',
        checkpointId: 'checkpoint',
      },
    ],
    inventory: {
      sourceId: 'inventory',
      instanceId: 'carried',
      checkpointId: 'inventory-checkpoint',
    },
  });
  expect(() => validateHistoryTransition(doc, next, '')).not.toThrow();
  expect(next.party?.roster).toEqual(doc.party?.roster);
  expect(
    next.party?.profiles
      .filter((p) => p.sessionId === 'session-2')
      .map((p) => p.characterId)
  ).toEqual(['pc-a']);
  expect(
    next.workingInventories.find((w) => w.id === 'carried')?.document
  ).toEqual(doc.workingInventories[0]?.document);
  const copy = required(
    next.party?.profiles.find((p) => p.sessionId === 'session-2')
  );
  const edited = updatePartyProfile(next, { ...copy, baseLevel: 9 });
  expect(
    edited.party?.profiles.find(
      (p) => p.sessionId === 'session-1' && p.characterId === 'pc-a'
    )?.baseLevel
  ).toBe(6);
  expect(
    edited.workingCombats.find((c) => c.id === 'continued')?.state
  ).toEqual(doc.workingCombats.find((c) => c.id === 'fight')?.state);
  expect(parseCampaign(serializeCampaign(edited))).toEqual(edited);
});

test('a continued encounter can be removed, saved and recovered with frozen state and logical identity', () => {
  const source = fixture(),
    next = startNextSession(source, {
      campaignId: source.id,
      sourceSessionId: 'session-1',
      sourceFingerprint: sessionFingerprint(source, 'session-1'),
      destinationId: 'session-2',
      label: 'Next',
      copyNotes: false,
      capturedAt: at,
      partyCharacterIds: ['pc-a'],
      inventory: null,
      combats: [
        {
          sourceId: 'fight',
          instanceId: 'continued',
          checkpointId: 'checkpoint',
        },
      ],
    });
  const removed = setEncounterRemoval(next, 'continued', 'session-2', 0, at);
  expect(removed.workspace.combatSelections?.['session-2']).toBeUndefined();
  expect(removed.records).toEqual(next.records);
  expect(removed.combatCheckpoints).toEqual(next.combatCheckpoints);
  expect(removed.workingCombats.find((c) => c.id === 'fight')).toEqual(
    next.workingCombats.find((c) => c.id === 'fight')
  );
  expect(() => validateHistoryTransition(next, removed, '')).not.toThrow();
  const archived = required(
    removed.workingCombats.find((c) => c.id === 'continued')
  );
  expect(() =>
    changeWorkingCombat(removed, 'continued', 'session-2', 0, archived.state)
  ).toThrow();
  const forged = {
    ...removed,
    workingCombats: removed.workingCombats.map((c) =>
      c.id === 'continued' ? { ...c, title: 'Modified' } : c
    ),
  };
  expect(() => validateHistoryTransition(removed, forged, '')).toThrow(
    'retain'
  );
  const reopened = parseCampaign(serializeCampaign(removed));
  const recovered = setEncounterRemoval(reopened, 'continued', 'session-2', 1);
  expect(() =>
    validateHistoryTransition(reopened, recovered, '')
  ).not.toThrow();
  const restored = required(
    recovered.workingCombats.find((c) => c.id === 'continued')
  );
  expect(restored.removedAt).toBeUndefined();
  expect(restored.encounterId).toBe('fight');
  expect(restored.state).toEqual(archived.state);
  expect(restored.generation).toBe(2);
  expect(recovered.party).toEqual(next.party);
  expect(recovered.workingCombats).toHaveLength(next.workingCombats.length);
  expect(() =>
    validateCampaign({
      ...recovered,
      party: { ...required(recovered.party), profiles: [] },
    })
  ).toThrow();
});
