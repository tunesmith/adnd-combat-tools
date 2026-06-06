import { deflateSync } from 'zlib';
import {
  decodeInitiativePlaytestState,
  encodeInitiativePlaytestState,
  type InitiativePlaytestActionState,
  type InitiativePlaytestCombatantState,
  type InitiativePlaytestState,
} from '../helpers/initiativeCodec';

interface CombatantStateInput {
  key: number;
  name: string;
  weaponId: number;
  declaredAction: InitiativePlaytestActionState['declaredAction'];
  actionLabel?: string;
  movementRate?: string;
  actionDistanceInches?: string;
  activationSegments?: string;
  castingSegments?: string;
  missileInitiativeAdjustment?: string;
  attackRoutineCount?: string;
  targetCombatantKeys?: number[];
}

const createCombatantState = ({
  key,
  name,
  weaponId,
  declaredAction,
  actionLabel,
  movementRate = '12',
  actionDistanceInches = '',
  activationSegments = '',
  castingSegments = '',
  missileInitiativeAdjustment = '0',
  attackRoutineCount = '1',
  targetCombatantKeys = [],
}: CombatantStateInput): InitiativePlaytestCombatantState => ({
  key,
  name,
  movementRate,
  missileInitiativeAdjustment,
  weaponId,
  actions: [
    {
      id: 'main',
      declaredAction,
      ...(actionLabel ? { actionLabel } : {}),
      actionDistanceInches,
      activationSegments,
      castingSegments,
      attackRoutineCount,
      targetCombatantKeys,
    },
  ],
});

describe('initiative codec', () => {
  test('round-trips a shareable initiative scenario state', async () => {
    const state: InitiativePlaytestState = {
      label: 'Large Mixed Battle',
      partyInitiative: '4',
      enemyInitiative: '4',
      nextCombatantKey: 11,
      party: [
        createCombatantState({
          key: 1,
          name: 'Aldred',
          declaredAction: 'open-melee',
          actionLabel: 'Sword of speed',
          movementRate: '12',
          actionDistanceInches: '',
          activationSegments: '',
          castingSegments: '',
          missileInitiativeAdjustment: '0',
          attackRoutineCount: '2',
          weaponId: 56,
          targetCombatantKeys: [6],
        }),
        createCombatantState({
          key: 2,
          name: 'Doran',
          declaredAction: 'set-vs-charge',
          movementRate: '12',
          actionDistanceInches: '',
          activationSegments: '',
          castingSegments: '',
          missileInitiativeAdjustment: '0',
          attackRoutineCount: '1',
          weaponId: 50,
          targetCombatantKeys: [7],
        }),
      ],
      enemies: [
        createCombatantState({
          key: 6,
          name: 'Gnoll Captain',
          declaredAction: 'open-melee',
          movementRate: '12',
          actionDistanceInches: '',
          activationSegments: '',
          castingSegments: '',
          missileInitiativeAdjustment: '0',
          attackRoutineCount: '1',
          weaponId: 2,
          targetCombatantKeys: [1],
        }),
        createCombatantState({
          key: 7,
          name: 'Raider',
          declaredAction: 'charge',
          movementRate: '12',
          actionDistanceInches: '',
          activationSegments: '',
          castingSegments: '',
          missileInitiativeAdjustment: '0',
          attackRoutineCount: '1',
          weaponId: 56,
          targetCombatantKeys: [2],
        }),
      ],
      pairDistances: {
        '2:7': '4',
      },
      attackActivationSegments: {},
      attackCastingSegments: {},
    };

    const encodedState = encodeInitiativePlaytestState(state);
    const decodedState = await decodeInitiativePlaytestState(encodedState);

    expect(decodedState).toEqual(state);
  });

  test('round-trips multiple actions as canonical action arrays', async () => {
    const state: InitiativePlaytestState = {
      label: 'Multiple Actions',
      partyInitiative: '5',
      enemyInitiative: '3',
      nextCombatantKey: 5,
      party: [
        {
          ...createCombatantState({
            key: 1,
            name: 'Astrid',
            declaredAction: 'open-melee',
            actionLabel: 'Flail',
            weaponId: 17,
            targetCombatantKeys: [3],
          }),
          actions: [
            {
              id: 'main',
              declaredAction: 'open-melee',
              actionLabel: 'Flail',
              actionDistanceInches: '',
              activationSegments: '',
              castingSegments: '',
              attackRoutineCount: '1',
              targetCombatantKeys: [3],
            },
            {
              id: 'action-2',
              declaredAction: 'magical-device',
              actionLabel: 'Spiritual hammer',
              actionDistanceInches: '',
              activationSegments: '',
              castingSegments: '',
              attackRoutineCount: '1',
              targetCombatantKeys: [4],
            },
          ],
        },
      ],
      enemies: [
        createCombatantState({
          key: 3,
          name: 'Ghoul',
          declaredAction: 'open-melee',
          weaponId: 1,
          targetCombatantKeys: [1],
        }),
        createCombatantState({
          key: 4,
          name: 'Yeenoghu',
          declaredAction: 'none',
          weaponId: 1,
        }),
      ],
      pairDistances: {},
      attackActivationSegments: {},
      attackCastingSegments: {},
    };

    await expect(
      decodeInitiativePlaytestState(encodeInitiativePlaytestState(state))
    ).resolves.toEqual(state);
  });

  test('rejects unsupported initiative state payloads', async () => {
    await expect(
      decodeInitiativePlaytestState(
        encodeURIComponent(Buffer.from('{"version":999}').toString('base64'))
      )
    ).rejects.toThrow();
  });

  test('defaults missing missile initiative adjustment to zero for old URLs', async () => {
    const encodedState = encodeURIComponent(
      deflateSync(
        JSON.stringify({
          version: 1,
          label: 'Legacy',
          partyInitiative: '4',
          enemyInitiative: '4',
          nextCombatantKey: 2,
          party: [
            {
              key: 1,
              name: 'Bowman',
              declaredAction: 'missile',
              movementRate: '12',
              attackRoutineCount: '1',
              weaponId: 11,
              targetCombatantKeys: [],
            },
          ],
          enemies: [],
          pairDistances: {},
        })
      ).toString('base64')
    );

    await expect(decodeInitiativePlaytestState(encodedState)).resolves.toEqual({
      label: 'Legacy',
      partyInitiative: '4',
      enemyInitiative: '4',
      nextCombatantKey: 2,
      party: [
        createCombatantState({
          key: 1,
          name: 'Bowman',
          declaredAction: 'missile',
          movementRate: '12',
          actionDistanceInches: '',
          activationSegments: '',
          castingSegments: '',
          missileInitiativeAdjustment: '0',
          attackRoutineCount: '1',
          weaponId: 11,
          targetCombatantKeys: [],
        }),
      ],
      enemies: [],
      pairDistances: {},
      attackActivationSegments: {},
      attackCastingSegments: {},
    });
  });

  test('accepts turn undead as a shareable declared action', async () => {
    const state: InitiativePlaytestState = {
      label: 'Turn Undead',
      partyInitiative: '3',
      enemyInitiative: '5',
      nextCombatantKey: 4,
      party: [
        createCombatantState({
          key: 1,
          name: 'Sister Arda',
          declaredAction: 'turn-undead',
          movementRate: '12',
          actionDistanceInches: '',
          activationSegments: '',
          castingSegments: '',
          missileInitiativeAdjustment: '0',
          attackRoutineCount: '3',
          weaponId: 17,
          targetCombatantKeys: [3],
        }),
      ],
      enemies: [
        createCombatantState({
          key: 3,
          name: 'Skeleton',
          declaredAction: 'open-melee',
          movementRate: '12',
          actionDistanceInches: '',
          activationSegments: '',
          castingSegments: '',
          missileInitiativeAdjustment: '0',
          attackRoutineCount: '1',
          weaponId: 1,
          targetCombatantKeys: [1],
        }),
      ],
      pairDistances: {},
      attackActivationSegments: {},
      attackCastingSegments: {},
    };

    await expect(
      decodeInitiativePlaytestState(encodeInitiativePlaytestState(state))
    ).resolves.toEqual(state);
  });

  test('round-trips no combat action and clears stale targets from older payloads', async () => {
    const state: InitiativePlaytestState = {
      label: 'No Combat Action',
      partyInitiative: '3',
      enemyInitiative: '5',
      nextCombatantKey: 4,
      party: [
        createCombatantState({
          key: 1,
          name: 'Brother Caradoc',
          declaredAction: 'none',
          movementRate: '12',
          actionDistanceInches: '',
          activationSegments: '',
          castingSegments: '',
          missileInitiativeAdjustment: '0',
          attackRoutineCount: '1',
          weaponId: 17,
          targetCombatantKeys: [],
        }),
      ],
      enemies: [],
      pairDistances: {},
      attackActivationSegments: {},
      attackCastingSegments: {},
    };

    await expect(
      decodeInitiativePlaytestState(encodeInitiativePlaytestState(state))
    ).resolves.toEqual(state);

    const legacyEncodedState = encodeURIComponent(
      deflateSync(
        JSON.stringify({
          version: 1,
          label: 'Legacy None',
          partyInitiative: '3',
          enemyInitiative: '5',
          nextCombatantKey: 4,
          party: [
            {
              key: 1,
              name: 'Brother Caradoc',
              declaredAction: 'none',
              movementRate: '12',
              attackRoutineCount: '1',
              weaponId: 17,
              targetCombatantKeys: [3],
            },
          ],
          enemies: [],
          pairDistances: {},
          attackActivationSegments: {},
          attackCastingSegments: {},
        })
      ).toString('base64')
    );

    await expect(
      decodeInitiativePlaytestState(legacyEncodedState)
    ).resolves.toEqual({
      ...state,
      label: 'Legacy None',
    });
  });

  test('round-trips magical device activation segments per directed declaration', async () => {
    const state: InitiativePlaytestState = {
      label: 'Magical Device',
      partyInitiative: '3',
      enemyInitiative: '5',
      nextCombatantKey: 4,
      party: [
        createCombatantState({
          key: 1,
          name: 'Rodric',
          declaredAction: 'magical-device',
          movementRate: '12',
          actionDistanceInches: '',
          activationSegments: '3',
          castingSegments: '',
          missileInitiativeAdjustment: '0',
          attackRoutineCount: '3',
          weaponId: 17,
          targetCombatantKeys: [3],
        }),
      ],
      enemies: [
        createCombatantState({
          key: 3,
          name: 'Skeleton',
          declaredAction: 'open-melee',
          movementRate: '12',
          actionDistanceInches: '',
          activationSegments: '',
          castingSegments: '',
          missileInitiativeAdjustment: '0',
          attackRoutineCount: '1',
          weaponId: 1,
          targetCombatantKeys: [1],
        }),
      ],
      pairDistances: {},
      attackActivationSegments: {},
      attackCastingSegments: {},
    };

    await expect(
      decodeInitiativePlaytestState(encodeInitiativePlaytestState(state))
    ).resolves.toEqual(state);
  });

  test('round-trips spell casting time per directed declaration', async () => {
    const state: InitiativePlaytestState = {
      label: 'Spell Casting',
      partyInitiative: '5',
      enemyInitiative: '4',
      nextCombatantKey: 4,
      party: [
        createCombatantState({
          key: 1,
          name: 'Mereth',
          declaredAction: 'spell-casting',
          movementRate: '12',
          actionDistanceInches: '',
          activationSegments: '',
          castingSegments: '6',
          missileInitiativeAdjustment: '0',
          attackRoutineCount: '1',
          weaponId: 17,
          targetCombatantKeys: [3],
        }),
      ],
      enemies: [
        createCombatantState({
          key: 3,
          name: 'Hobgoblin',
          declaredAction: 'open-melee',
          movementRate: '12',
          actionDistanceInches: '',
          activationSegments: '',
          castingSegments: '',
          missileInitiativeAdjustment: '0',
          attackRoutineCount: '1',
          weaponId: 17,
          targetCombatantKeys: [1],
        }),
      ],
      pairDistances: {},
      attackActivationSegments: {},
      attackCastingSegments: {},
    };

    await expect(
      decodeInitiativePlaytestState(encodeInitiativePlaytestState(state))
    ).resolves.toEqual(state);
  });
});
