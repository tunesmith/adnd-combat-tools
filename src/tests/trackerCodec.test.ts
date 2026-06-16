import { deflate, unzipSync } from 'zlib';
import {
  decodeTrackerState,
  encodeTrackerState,
  encodeTrackerStateSync,
  transformTrackerState,
} from '../helpers/trackerCodec';
import type {
  TrackerState,
  TrackerStateAnyVersion,
  TrackerStateV2,
  TrackerStateV5,
  TrackerStateV8,
} from '../types/tracker';

const encodeLegacyState = (value: unknown): Promise<string> =>
  new Promise((resolve, reject) => {
    deflate(JSON.stringify(value), (error, buffer) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(encodeURIComponent(buffer.toString('base64')));
    });
  });

const decodeEncodedTrackerPayload = (
  encodedState: string
): TrackerStateAnyVersion =>
  JSON.parse(
    unzipSync(
      Buffer.from(decodeURIComponent(encodedState), 'base64')
    ).toString()
  ) as TrackerStateAnyVersion;

describe('tracker codec', () => {
  test('migrates version 2 tracker state into round-snapshot shape', () => {
    const legacyState: TrackerStateV2 = {
      version: 2,
      party: [
        {
          key: 1,
          name: 'Lodi',
          class: 1,
          level: 7,
          armorType: 10,
          armorClass: -1,
          weapon: 12,
          maxHp: '',
        },
      ],
      enemies: [
        {
          key: 2,
          name: 'Ghoul',
          class: 10,
          level: 3,
          armorType: 1,
          armorClass: 6,
          weapon: 0,
          maxHp: '',
        },
      ],
      rounds: [
        {
          partyInitiative: '4',
          enemyInitiative: '5',
          summary: 'The ghoul lunges first.',
          cells: [[{ enemyToParty: 'xx', partyToEnemy: '16' }]],
          partyStates: [
            {
              maxHp: '19',
              hp: '',
              effect: '',
              action: 'attack',
              result: '',
              notes: '',
            },
          ],
          enemyStates: [
            {
              maxHp: '11',
              hp: '7',
              effect: 'slowed',
              action: '',
              result: '',
              notes: '',
            },
          ],
        },
      ],
      activeRound: 0,
    };

    const migrated = transformTrackerState(legacyState);

    expect(migrated.version).toBe(7);
    expect(migrated.rounds[0]?.label).toBe('Round 1');
    expect(migrated.rounds[0]?.party[0]?.maxHp).toBe('19');
    expect(migrated.rounds[0]?.enemies[0]?.maxHp).toBe('11');
    expect(migrated.rounds[0]?.cells[0]?.[0]).toEqual({
      enemyToParty: 'xx',
      partyToEnemy: '16',
      enemyToPartyVisible: true,
      partyToEnemyVisible: true,
    });
    expect(migrated.rounds[0]?.partyStates[0]).toEqual({
      hp: '19',
      effect: '',
      action: 'attack',
      result: '',
      notes: '',
    });
    expect(migrated.rounds[0]?.enemyStates[0]).toEqual({
      hp: '7',
      effect: 'slowed',
      action: '',
      result: '',
      notes: '',
    });
  });

  test('decodes legacy encoded tracker state through the shared migration path', async () => {
    const encodedState = await encodeLegacyState({
      version: 2,
      party: [
        {
          key: 1,
          name: 'Azalia',
          class: 8,
          level: 6,
          armorType: 2,
          armorClass: -4,
          weapon: 17,
          maxHp: '',
        },
      ],
      enemies: [
        {
          key: 2,
          name: 'Gnoll',
          class: 10,
          level: 1,
          armorType: 5,
          armorClass: 5,
          weapon: 15,
          maxHp: '8',
        },
      ],
      rounds: [
        {
          partyInitiative: '',
          enemyInitiative: '',
          summary: '',
          cells: [[{ enemyToParty: '', partyToEnemy: 'dead' }]],
          partyStates: [
            {
              maxHp: '14',
              hp: '9',
              effect: 'hopeful',
              action: '',
              result: '',
              notes: '',
            },
          ],
          enemyStates: [
            {
              maxHp: '',
              hp: '',
              effect: '',
              action: '',
              result: '',
              notes: '',
            },
          ],
        },
      ],
      activeRound: 0,
    } as TrackerStateV2);

    const decoded = await decodeTrackerState(encodedState);

    expect(decoded.version).toBe(7);
    expect(decoded.rounds[0]?.label).toBe('Round 1');
    expect(decoded.rounds[0]?.party[0]?.maxHp).toBe('14');
    expect(decoded.rounds[0]?.enemies[0]?.maxHp).toBe('8');
    expect(decoded.rounds[0]?.cells[0]?.[0]).toEqual({
      enemyToParty: '',
      partyToEnemy: 'dead',
      enemyToPartyVisible: true,
      partyToEnemyVisible: true,
    });
  });

  test('migrates version 5 per-cell visibility to independent half visibility', () => {
    const versionFiveState: TrackerStateV5 = {
      version: 5,
      rounds: [
        {
          party: [
            {
              key: 1,
              name: 'Lodi',
              class: 1,
              level: 7,
              armorType: 10,
              armorClass: -1,
              weapon: 12,
              maxHp: '19',
            },
          ],
          enemies: [
            {
              key: 2,
              name: 'Ghoul',
              class: 10,
              level: 3,
              armorType: 1,
              armorClass: 6,
              weapon: 0,
              maxHp: '11',
            },
          ],
          partyInitiative: '4',
          enemyInitiative: '5',
          summary: '',
          cells: [[{ enemyToParty: 'xx', partyToEnemy: '', isVisible: true }]],
          partyStates: [
            {
              hp: '19',
              effect: '',
              action: '',
              result: '',
              notes: '',
            },
          ],
          enemyStates: [
            {
              hp: '11',
              effect: '',
              action: '',
              result: '',
              notes: '',
            },
          ],
        },
      ],
      activeRound: 0,
    };

    const migrated = transformTrackerState(versionFiveState);

    expect(migrated.version).toBe(7);
    expect(migrated.rounds[0]?.label).toBe('Round 1');
    expect(migrated.rounds[0]?.cells[0]?.[0]).toEqual({
      enemyToParty: 'xx',
      partyToEnemy: '',
      enemyToPartyVisible: true,
      partyToEnemyVisible: true,
    });
  });

  test('migrates version 6 tracker state to labeled rounds', () => {
    const migrated = transformTrackerState({
      version: 6,
      title: 'Bridge Ambush',
      rounds: [
        {
          party: [
            {
              key: 1,
              name: 'Lodi',
              class: 1,
              level: 7,
              armorType: 10,
              armorClass: -1,
              weapon: 12,
              maxHp: '19',
            },
          ],
          enemies: [
            {
              key: 2,
              name: 'Ghoul',
              class: 10,
              level: 3,
              armorType: 1,
              armorClass: 6,
              weapon: 0,
              maxHp: '11',
            },
          ],
          partyInitiative: '',
          enemyInitiative: '',
          summary: '',
          cells: [
            [
              {
                enemyToParty: '',
                partyToEnemy: '',
                enemyToPartyVisible: false,
                partyToEnemyVisible: false,
              },
            ],
          ],
          partyStates: [
            {
              hp: '19',
              effect: '',
              action: '',
              result: '',
              notes: '',
            },
          ],
          enemyStates: [
            {
              hp: '11',
              effect: '',
              action: '',
              result: '',
              notes: '',
            },
          ],
        },
      ],
      activeRound: 0,
    });

    expect(migrated.version).toBe(7);
    expect(migrated.title).toBe('Bridge Ambush');
    expect(migrated.rounds[0]?.label).toBe('Round 1');
  });

  test('roundtrips current-version tracker titles through the codec', async () => {
    const encoded = await encodeTrackerState({
      version: 7,
      title: 'Assault on the Shrine',
      rounds: [
        {
          label: 'Surprise 1',
          party: [
            {
              key: 1,
              name: 'Lodi',
              class: 1,
              level: 7,
              armorType: 10,
              armorClass: -1,
              weapon: 12,
              maxHp: '19',
            },
          ],
          enemies: [
            {
              key: 2,
              name: 'Ghoul',
              class: 10,
              level: 3,
              armorType: 1,
              armorClass: 6,
              weapon: 0,
              maxHp: '11',
            },
          ],
          partyInitiative: '4',
          enemyInitiative: '5',
          summary: '',
          cells: [
            [
              {
                enemyToParty: 'xx',
                partyToEnemy: '',
                enemyToPartyVisible: true,
                partyToEnemyVisible: false,
              },
            ],
          ],
          partyStates: [
            {
              hp: '19',
              effect: '',
              action: 'shoot bow',
              result: '',
              notes: '',
            },
          ],
          enemyStates: [
            {
              hp: '11',
              effect: '',
              action: 'advance',
              result: '',
              notes: '',
            },
          ],
        },
      ],
      activeRound: 0,
    });

    const decoded = await decodeTrackerState(encoded);

    expect(decoded.title).toBe('Assault on the Shrine');
    expect(decoded.rounds[0]?.label).toBe('Surprise 1');
    expect(decoded.rounds[0]?.partyStates[0]?.action).toBe('shoot bow');
  });

  test('normalizes current-version combatants without shortlists on decode', async () => {
    const encoded = await encodeLegacyState({
      version: 7,
      rounds: [
        {
          label: 'Round 1',
          party: [
            {
              key: 1,
              name: 'Lodi',
              class: 1,
              level: 7,
              armorType: 10,
              armorClass: -1,
              weapon: 12,
              maxHp: '19',
            },
          ],
          enemies: [
            {
              key: 2,
              name: 'Ghoul',
              class: 10,
              level: 3,
              armorType: 1,
              armorClass: 6,
              weapon: 1,
              maxHp: '11',
              weaponShortlist: [],
            },
          ],
          partyInitiative: '',
          enemyInitiative: '',
          summary: '',
          cells: [
            [
              {
                enemyToParty: '',
                partyToEnemy: '',
                enemyToPartyVisible: false,
                partyToEnemyVisible: false,
              },
            ],
          ],
          partyStates: [
            {
              hp: '19',
              effect: '',
              action: '',
              result: '',
              notes: '',
            },
          ],
          enemyStates: [
            {
              hp: '11',
              effect: '',
              action: '',
              result: '',
              notes: '',
            },
          ],
        },
      ],
      activeRound: 0,
    });

    const decoded = await decodeTrackerState(encoded);

    expect(decoded.rounds[0]?.party[0]?.weaponShortlist).toEqual([12]);
    expect(decoded.rounds[0]?.enemies[0]?.weaponShortlist).toEqual([1]);
  });

  test('encodes current tracker cells as sparse version 8 cells', async () => {
    const state: TrackerState = {
      version: 7,
      title: 'Sparse Cells',
      rounds: [
        {
          label: 'Round 1',
          party: [
            {
              key: 1,
              name: 'Lodi',
              class: 1,
              level: 7,
              armorType: 10,
              armorClass: -1,
              weapon: 12,
              weaponShortlist: [12],
              maxHp: '19',
            },
            {
              key: 3,
              name: 'Bemis',
              class: 1,
              level: 5,
              armorType: 6,
              armorClass: 4,
              weapon: 13,
              weaponShortlist: [13],
              maxHp: '16',
            },
          ],
          enemies: [
            {
              key: 2,
              name: 'Ghoul',
              class: 10,
              level: 3,
              armorType: 1,
              armorClass: 6,
              weapon: 1,
              weaponShortlist: [1],
              maxHp: '11',
            },
            {
              key: 4,
              name: 'Gnoll',
              class: 10,
              level: 2,
              armorType: 5,
              armorClass: 5,
              weapon: 15,
              weaponShortlist: [15],
              maxHp: '8',
            },
          ],
          partyInitiative: '4',
          enemyInitiative: '5',
          summary: '',
          cells: [
            [
              {
                enemyToParty: '',
                partyToEnemy: '',
                enemyToPartyVisible: false,
                partyToEnemyVisible: false,
              },
              {
                enemyToParty: '',
                partyToEnemy: 'hit 8',
                enemyToPartyVisible: false,
                partyToEnemyVisible: true,
                partyToEnemyActionIds: ['party:3:main'],
              },
            ],
            [
              {
                enemyToParty: '',
                partyToEnemy: '',
                enemyToPartyVisible: true,
                partyToEnemyVisible: false,
              },
              {
                enemyToParty: 'claw',
                partyToEnemy: '',
                enemyToPartyVisible: true,
                partyToEnemyVisible: false,
                enemyToPartyActionIds: ['enemy:4:main'],
              },
            ],
          ],
          actions: [
            {
              id: 'party:3:main',
              source: 'intention',
              side: 'party',
              direction: 'partyToEnemy',
              combatantKey: 3,
              combatantIndex: 1,
              targetSide: 'enemy',
              declaredAction: 'charge',
              actionLabel: 'Door rush',
              actionDistanceInches: 5,
              weaponId: 13,
              intention: 'Door rush (5")',
              result: '',
              targetDeclarations: [
                {
                  targetCombatantKey: 2,
                  targetCombatantIndex: 0,
                  cellRowIndex: 0,
                  cellColumnIndex: 1,
                  cellResultText: 'hit 8',
                },
              ],
            },
            {
              id: 'enemy:4:main',
              source: 'intention',
              side: 'enemy',
              direction: 'enemyToParty',
              combatantKey: 4,
              combatantIndex: 1,
              targetSide: 'party',
              declaredAction: 'open-melee',
              actionLabel: 'Claw',
              attackRoutineCount: 2,
              weaponId: 15,
              intention: 'Claw',
              result: '',
              targetDeclarations: [],
            },
          ],
          partyStates: [
            {
              hp: '19',
              effect: '',
              action: 'attack',
              result: '',
              notes: '',
            },
            {
              hp: '16',
              effect: '',
              action: 'charge',
              result: '',
              notes: '',
            },
          ],
          enemyStates: [
            {
              hp: '11',
              effect: '',
              action: '',
              result: '',
              notes: '',
            },
            {
              hp: '8',
              effect: '',
              action: 'claw Bemis',
              result: '',
              notes: '',
            },
          ],
        },
      ],
      activeRound: 0,
    };

    const encoded = await encodeTrackerState(state);
    const persisted = decodeEncodedTrackerPayload(encoded);

    expect(persisted.version).toBe(8);
    if (persisted.version !== 8) {
      throw new Error('Expected sparse version 8 tracker payload');
    }

    expect(persisted.rounds[0]?.cells).toEqual([
      {
        rowIndex: 0,
        columnIndex: 1,
        partyToEnemy: 'hit 8',
        partyToEnemyVisible: true,
        partyToEnemyActionIds: ['party:3:main'],
      },
      {
        rowIndex: 1,
        columnIndex: 0,
        enemyToPartyVisible: true,
      },
      {
        rowIndex: 1,
        columnIndex: 1,
        enemyToParty: 'claw',
        enemyToPartyVisible: true,
        enemyToPartyActionIds: ['enemy:4:main'],
      },
    ]);
    expect(persisted.rounds[0]?.actions).toEqual([
      {
        id: 'party:3:main',
        side: 'party',
        combatantKey: 3,
        declaredAction: 'charge',
        actionLabel: 'Door rush',
        actionDistanceInches: 5,
        targetCombatantKeys: [2],
      },
      {
        id: 'enemy:4:main',
        side: 'enemy',
        combatantKey: 4,
        declaredAction: 'open-melee',
        actionLabel: 'Claw',
        attackRoutineCount: 2,
      },
    ]);
    await expect(decodeTrackerState(encoded)).resolves.toEqual(state);
  });

  test('decodes version 8 action targets from pre-compaction target declarations', async () => {
    const legacyState: TrackerStateV8 = {
      version: 8,
      rounds: [
        {
          label: 'Round 1',
          party: [
            {
              key: 1,
              name: 'Bemis',
              class: 1,
              level: 5,
              armorType: 6,
              armorClass: 4,
              weapon: 13,
              maxHp: '16',
            },
          ],
          enemies: [
            {
              key: 2,
              name: 'Ghoul',
              class: 10,
              level: 3,
              armorType: 1,
              armorClass: 6,
              weapon: 1,
              maxHp: '11',
            },
          ],
          partyInitiative: '4',
          enemyInitiative: '5',
          summary: '',
          cells: [
            {
              rowIndex: 0,
              columnIndex: 0,
              partyToEnemy: 'hit 8',
              partyToEnemyVisible: true,
              partyToEnemyActionIds: ['party:1:main'],
            },
          ],
          partyStates: [
            {
              hp: '16',
              effect: '',
              action: 'charge',
              result: '',
              notes: '',
            },
          ],
          enemyStates: [
            {
              hp: '11',
              effect: '',
              action: '',
              result: '',
              notes: '',
            },
          ],
          actions: [
            {
              id: 'party:1:main',
              side: 'party',
              combatantKey: 1,
              declaredAction: 'charge',
              actionDistanceInches: 5,
              targetDeclarations: [
                {
                  targetCombatantKey: 2,
                  targetCombatantIndex: 0,
                  cellRowIndex: 0,
                  cellColumnIndex: 0,
                  cellResultText: 'hit 8',
                },
              ],
            },
          ],
        },
      ],
      activeRound: 0,
    };

    const decoded = await decodeTrackerState(
      await encodeLegacyState(legacyState)
    );

    expect(decoded.rounds[0]?.actions?.[0]?.targetDeclarations).toEqual([
      {
        targetCombatantKey: 2,
        targetCombatantIndex: 0,
        cellRowIndex: 0,
        cellColumnIndex: 0,
        cellResultText: 'hit 8',
      },
    ]);
  });

  test('sync encoder matches the async codec path', async () => {
    const state = transformTrackerState({
      version: 6,
      title: 'Bridge Ambush',
      rounds: [
        {
          party: [
            {
              key: 1,
              name: 'Lodi',
              class: 1,
              level: 7,
              armorType: 10,
              armorClass: -1,
              weapon: 12,
              maxHp: '19',
            },
          ],
          enemies: [
            {
              key: 2,
              name: 'Ghoul',
              class: 10,
              level: 3,
              armorType: 1,
              armorClass: 6,
              weapon: 0,
              maxHp: '11',
            },
          ],
          partyInitiative: '4',
          enemyInitiative: '5',
          summary: 'Late save smoke test',
          cells: [
            [
              {
                enemyToParty: 'xx',
                partyToEnemy: '',
                enemyToPartyVisible: true,
                partyToEnemyVisible: false,
              },
            ],
          ],
          partyStates: [
            {
              hp: '19',
              effect: '',
              action: 'attack',
              result: '',
              notes: '',
            },
          ],
          enemyStates: [
            {
              hp: '11',
              effect: '',
              action: 'advance',
              result: '',
              notes: '',
            },
          ],
        },
      ],
      activeRound: 0,
    });

    const asyncEncoded = await encodeTrackerState(state);
    const syncEncoded = encodeTrackerStateSync(state);

    expect(syncEncoded).toBe(asyncEncoded);
    await expect(decodeTrackerState(syncEncoded)).resolves.toEqual(state);
  });
});
