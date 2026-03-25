import {
  createRegistryOutcomeMap,
  type DungeonTableDefinition,
} from '../../../../dungeon/features/types';

describe('feature registry contract', () => {
  test('throws when a contextual table omits an explicit registry handler', () => {
    const invalidDefinition: DungeonTableDefinition = {
      id: 'invalidContextualTable',
      heading: 'Invalid',
      manualResolution: 'contextual',
      registry: undefined as never,
      resolver: () => ({
        type: 'event',
        roll: 1,
        event: { kind: 'periodicCheck', result: 0, level: 1 },
      }),
      renderers: {
        renderDetail: () => [],
        renderCompact: () => [],
      },
    };

    expect(() => createRegistryOutcomeMap([invalidDefinition])).toThrow(
      'Dungeon table "invalidContextualTable" requires an explicit registry handler.'
    );
  });
});
