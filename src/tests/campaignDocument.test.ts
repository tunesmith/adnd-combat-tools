import {
  parseCampaign,
  serializeCampaign,
  validateCampaign,
} from '../helpers/campaignDocument';
const example = {
  kind: 'adnd-campaign',
  schemaVersion: 1,
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
      JSON.stringify({ ...example, schemaVersion: 2 }),
      'schema version',
    ],
    [
      'unknown fields',
      JSON.stringify({ ...example, treasure: 999 }),
      'Unrecognized',
    ],
    [
      'missing notes',
      JSON.stringify({ ...example, notes: undefined }),
      'must be strings',
    ],
    [
      'empty identity',
      JSON.stringify({ ...example, id: '' }),
      'must be strings',
    ],
    [
      'wrong kind',
      JSON.stringify({ ...example, kind: 'other' }),
      'Not an AD&D',
    ],
  ])('rejects %s', (_label, input, message) =>
    expect(() => parseCampaign(input)).toThrow(message)
  );
});
