import {
  parseCampaign,
  serializeCampaign,
  validateCampaign,
} from '../helpers/campaignDocument';
const example = {
  workingCombats: [],
  combatCheckpoints: [],
  workingInventories: [],
  inventoryCheckpoints: [],
  sessions: [],
  records: [],
  workspace: { sessionId: null, view: 'possessions', combatSelections: {} },
  kind: 'adnd-campaign',
  schemaVersion: 21,
  sessionMetadataVersion: 1,
  id: 'synthetic-id',
  title: 'Lantern Company',
  notes: 'Only invented campaign notes.',
};
describe('campaign document envelope', () => {
  test('round-trips all fields including identity', () => {
    expect(parseCampaign(serializeCampaign(validateCampaign(example)))).toEqual(
      example
    );
  });
  test.each([
    ['malformed JSON', '{broken', 'Invalid JSON'],
    [
      'future schema',
      JSON.stringify({ ...example, schemaVersion: 22 }),
      'schema version',
    ],
    [
      'unknown fields',
      JSON.stringify({ ...example, treasure: 999 }),
      'Unrecognized',
    ],
    ['missing notes', JSON.stringify({ ...example, notes: undefined }), ''],
    ['empty identity', JSON.stringify({ ...example, id: '' }), ''],
    [
      'wrong kind',
      JSON.stringify({ ...example, kind: 'other' }),
      'Not an AD&D',
    ],
  ])('rejects %s', (_label, input, message) =>
    expect(() => parseCampaign(input)).toThrow(message)
  );
});

test.each([...Array.from({ length: 20 }, (_, i) => i + 1), 22])(
  'rejects unsupported campaign schema %s without rewriting it',
  (schemaVersion) => {
    const input = JSON.stringify({ ...example, schemaVersion });
    expect(() => parseCampaign(input)).toThrow('requires version 21');
    expect(JSON.parse(input).schemaVersion).toBe(schemaVersion);
  }
);
test('current campaigns reject obsolete XP timeline data', () => {
  expect(() =>
    parseCampaign(
      JSON.stringify({
        ...example,
        xp: {
          version: 1,
          sessionOrder: [],
          openings: [],
          rewards: [],
          points: [],
          events: [],
        },
      })
    )
  ).toThrow();
});
