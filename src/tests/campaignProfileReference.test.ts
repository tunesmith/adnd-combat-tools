import fixture from './fixtures/campaignProfilesV8.json';
import {
  parseCampaign,
  serializeCampaign,
  validateCampaign,
} from '../helpers/campaignDocument';
import {
  carriedPartyProfiles,
  updatePartyProfile,
  calculatedSaves,
  combatValuesForProfile,
} from '../helpers/campaignParty';
import {
  startNextSession,
  sessionFingerprint,
} from '../helpers/campaignContinuity';
import { validateHistoryTransition } from '../helpers/campaignHistory';
import { profileReferenceSchema } from '../helpers/campaignPartyModel';

test('expanded profiles round trip and explicit carry makes independent reference values', () => {
  const source = parseCampaign(JSON.stringify(fixture));
  const continued = startNextSession(source, {
    campaignId: source.id,
    sourceSessionId: 'one',
    sourceFingerprint: sessionFingerprint(source, 'one'),
    destinationId: 'three',
    label: 'Session Three',
    combats: [],
    inventory: null,
    copyNotes: false,
    partyCharacterIds: ['synthetic-profile-0'],
    capturedAt: '2026-11-06T12:00:00.000Z',
  });
  expect(() => validateHistoryTransition(source, continued, '')).not.toThrow();
  expect(
    continued.party?.profiles.find((p) => p.sessionId === 'three')?.reference
  ).toEqual(source.party?.profiles[0]?.reference);
  const carried = carriedPartyProfiles(source, 'one', 'two', [
    'synthetic-profile-0',
  ]);
  const copy = carried[0];
  const prior = source.party?.profiles[0];
  if (!copy?.reference || !prior?.reference) throw new Error('Missing fixture');
  expect(copy.reference).toEqual(prior.reference);
  copy.reference.attributes.strength.exceptional = 100;
  copy.reference.bonuses.reactionPercent = 0;
  expect(prior.reference.attributes.strength.exceptional).toBe(64);
  expect(prior.reference.bonuses.reactionPercent).toBe(-5);
  const next = updatePartyProfile(source, copy);
  expect(parseCampaign(serializeCampaign(next))).toEqual(next);
  expect(next.workingCombats).toBe(source.workingCombats);
  expect(next.workingInventories).toBe(source.workingInventories);
  expect(calculatedSaves(copy)).toEqual(calculatedSaves(prior));
  expect(combatValuesForProfile(copy)).toEqual(combatValuesForProfile(prior));
});

test('old profiles migrate with unknown reference fields and invalid typed values are rejected', () => {
  const legacy = {
    ...fixture,
    schemaVersion: 7,
    party: {
      ...fixture.party,
      profiles: fixture.party.profiles.map(({ reference: _, ...p }) => p),
    },
  };
  const next = validateCampaign(legacy);
  expect(next.schemaVersion).toBe(16);
  expect(next.party).toEqual(legacy.party);
  expect(next.records).toEqual(legacy.records);
  const reference = fixture.party.profiles[0]?.reference;
  if (!reference) throw new Error('Missing fixture');
  for (const invalid of [
    { ...reference, maxHp: -1 },
    { ...reference, age: 1.5 },
    { ...reference, bonuses: { ...reference.bonuses, xpPercent: 1.5 } },
    { ...reference, attributes: { ...reference.attributes, intelligence: 26 } },
    {
      ...reference,
      attributes: {
        ...reference.attributes,
        strength: { score: 17, exceptional: 64 },
      },
    },
  ]) {
    expect(profileReferenceSchema.safeParse(invalid).success).toBe(false);
  }
});
