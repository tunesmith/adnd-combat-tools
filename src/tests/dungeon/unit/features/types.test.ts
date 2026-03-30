import {
  createRegistryOutcomeMap,
  createPendingResolverMap,
  type DungeonTableDefinition,
} from '../../../../dungeon/features/types';
import { markContextualResolution } from '../../../../dungeon/features/shared';

function createBaseDefinition(id: string): DungeonTableDefinition {
  return {
    id,
    heading: 'Simple',
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
}

describe('feature registry contract', () => {
  test('falls back to the resolver when no registry override is provided', () => {
    const definition = createBaseDefinition('simpleTable');

    const registryMap = createRegistryOutcomeMap([definition]);
    const resolveSimpleTable = registryMap['simpleTable'];
    expect(resolveSimpleTable).toBeDefined();
    if (!resolveSimpleTable) {
      throw new Error('simpleTable resolver missing');
    }

    const outcome = resolveSimpleTable({
      id: 'simpleTable',
      context: undefined,
      doorChain: undefined,
      roll: 1,
    });

    expect(outcome).toEqual({
      type: 'event',
      roll: 1,
      event: { kind: 'periodicCheck', result: 0, level: 1 },
    });
  });

  test('fails loudly when a table provides registry without resolvePending', () => {
    const definition: DungeonTableDefinition = {
      ...createBaseDefinition('contextualTable'),
      registry: ({ roll }: { roll?: number }) => ({
        type: 'event',
        roll: roll ?? 1,
        event: { kind: 'periodicCheck', result: 0, level: 1 },
      }),
    };

    expect(() => createRegistryOutcomeMap([definition])).toThrow(
      'Dungeon table "contextualTable" provides a registry handler but no resolvePending handler.'
    );
    expect(() => createPendingResolverMap([definition])).toThrow(
      'Dungeon table "contextualTable" provides a registry handler but no resolvePending handler.'
    );
  });

  test('markContextualResolution requires both registry and resolvePending', () => {
    const invalidDefinition = {
      ...createBaseDefinition('missingPending'),
      registry: ({ roll }: { roll?: number }) => ({
        type: 'event',
        roll: roll ?? 1,
        event: { kind: 'periodicCheck', result: 0, level: 1 },
      }),
    };

    expect(() =>
      markContextualResolution(
        invalidDefinition as Parameters<typeof markContextualResolution>[0]
      )
    ).toThrow(
      'Dungeon table "missingPending" requires both registry and resolvePending handlers.'
    );
  });
});
