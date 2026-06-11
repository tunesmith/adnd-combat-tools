import { buildInitiativeScenarioFromTrackerRound } from '../helpers/initiative/trackerScenario';
import { resolveTrackerRoundInitiative } from '../helpers/initiative/trackerRoundResolution';
import { createInitialTrackerState } from '../helpers/trackerState';
import type { DirectMeleeEngagement } from '../types/initiative';
import type { TrackerRound } from '../types/tracker';

const requireRound = (): TrackerRound => {
  const state = createInitialTrackerState();
  const round = state.rounds[0];

  if (!round) {
    throw new Error('Missing tracker round');
  }

  return round;
};

const setMutualTarget = (
  round: TrackerRound,
  enemyIndex: number,
  partyIndex: number
) => {
  const row = round.cells[enemyIndex];
  const current = row?.[partyIndex];

  if (!current) {
    throw new Error(`Missing tracker cell ${enemyIndex},${partyIndex}`);
  }

  if (!row) {
    throw new Error(`Missing tracker row ${enemyIndex}`);
  }

  row[partyIndex] = {
    ...current,
    enemyToPartyVisible: true,
    partyToEnemyVisible: true,
    enemyToParty: 'x',
    partyToEnemy: 'x',
  };
};

const setPartyTarget = (
  round: TrackerRound,
  enemyIndex: number,
  partyIndex: number,
  text = 'target',
  actionIds?: string[]
) => {
  const row = round.cells[enemyIndex];
  const current = row?.[partyIndex];

  if (!row || !current) {
    throw new Error(`Missing tracker cell ${enemyIndex},${partyIndex}`);
  }

  row[partyIndex] = {
    ...current,
    partyToEnemyVisible: true,
    partyToEnemy: text,
    ...(actionIds ? { partyToEnemyActionIds: actionIds } : {}),
  };
};

const setEnemyTarget = (
  round: TrackerRound,
  enemyIndex: number,
  partyIndex: number,
  text = 'target',
  actionIds?: string[]
) => {
  const row = round.cells[enemyIndex];
  const current = row?.[partyIndex];

  if (!row || !current) {
    throw new Error(`Missing tracker cell ${enemyIndex},${partyIndex}`);
  }

  row[partyIndex] = {
    ...current,
    enemyToPartyVisible: true,
    enemyToParty: text,
    ...(actionIds ? { enemyToPartyActionIds: actionIds } : {}),
  };
};

const getStepSignatures = (engagement: DirectMeleeEngagement): string[][] =>
  engagement.resolution.steps.map((step) =>
    step.attacks.map((attack) => `${attack.combatantId}${attack.attackNumber}`)
  );

const requireEngagement = (
  engagement: DirectMeleeEngagement | undefined
): DirectMeleeEngagement => {
  if (!engagement) {
    throw new Error('Missing direct melee engagement');
  }

  return engagement;
};

describe('tracker initiative scenario builder', () => {
  test('extracts combatants, weapon metadata, targets, and simple side order from a tracker round', () => {
    const round = requireRound();

    round.partyInitiative = '5';
    round.enemyInitiative = '2';

    if (
      !round.party[0] ||
      !round.party[1] ||
      !round.enemies[0] ||
      !round.enemies[1] ||
      !round.partyStates[0] ||
      !round.partyStates[1] ||
      !round.enemyStates[0]
    ) {
      throw new Error('Missing combatants or round state');
    }

    round.party[0].name = 'Lodi';
    round.party[0].weapon = 2;
    round.party[1].weapon = 9;
    round.enemies[0].name = 'Ghoul';
    round.enemies[0].weapon = 1;
    round.enemies[1].weapon = 2;
    round.partyStates[0].action = 'close and strike';
    round.partyStates[1].action = 'loose arrow';
    round.enemyStates[0].action = 'claw';

    setMutualTarget(round, 0, 0);
    setMutualTarget(round, 1, 1);

    const scenario = buildInitiativeScenarioFromTrackerRound(round);

    expect(scenario.label).toBe('Round 1');
    expect(scenario.partyInitiative).toBe(5);
    expect(scenario.enemyInitiative).toBe(2);
    expect(scenario.simpleOrder).toBe('party-first');

    expect(scenario.party[0]).toMatchObject({
      id: 'party-1',
      side: 'party',
      name: 'Lodi',
      initiative: 5,
      weaponId: 2,
      weaponName: 'Axe, Battle',
      weaponType: 'melee',
      weaponSpeedFactor: 7,
      intention: 'close and strike',
      targetIds: ['enemy-4'],
      attackRoutine: {
        id: 'routine:party-1:1',
        timingBasisComponentId: 'attack-1',
      },
    });
    expect(scenario.party[1]).toMatchObject({
      id: 'party-2',
      weaponId: 9,
      declaredAction: 'missile',
      weaponType: 'missile',
      weaponSpeedFactor: undefined,
      intention: 'loose arrow',
      targetIds: ['enemy-5'],
      attackRoutine: {
        components: [
          { id: 'attack-1', order: 1, label: 'attack 1' },
          { id: 'attack-2', order: 2, label: 'attack 2' },
        ],
      },
    });
    expect(scenario.enemies[0]).toMatchObject({
      id: 'enemy-4',
      side: 'enemy',
      name: 'Ghoul',
      initiative: 2,
      weaponId: 1,
      weaponName: 'Natural Weapon (Monster)',
      weaponType: 'natural',
      intention: 'claw',
      targetIds: ['party-1'],
    });
    expect(scenario.directMeleePairs).toEqual([
      {
        partyCombatantId: 'party-1',
        enemyCombatantId: 'enemy-4',
        inference: 'mutual-targeting-non-missile-weapons',
      },
    ]);
    const engagement = requireEngagement(scenario.directMeleeEngagements[0]);

    expect(scenario.directMeleeEngagements).toHaveLength(1);
    expect(engagement.resolution.reason).toBe('initiative');
    expect(getStepSignatures(engagement)).toEqual([['party-11'], ['enemy-41']]);
  });

  test('resolves tied direct melee with natural weapons as simultaneous', () => {
    const round = requireRound();

    round.partyInitiative = '3';
    round.enemyInitiative = '3';

    if (
      !round.party[0] ||
      !round.party[1] ||
      !round.enemies[0] ||
      !round.enemies[1]
    ) {
      throw new Error('Missing combatants');
    }

    round.party[0].weapon = 3;
    round.party[1].weapon = 9;
    round.enemies[0].weapon = 1;
    round.enemies[1].weapon = 2;

    setMutualTarget(round, 0, 0);
    setMutualTarget(round, 1, 1);

    const scenario = buildInitiativeScenarioFromTrackerRound(round);

    expect(scenario.simpleOrder).toBe('simultaneous');
    expect(scenario.directMeleePairs).toEqual([
      {
        partyCombatantId: 'party-1',
        enemyCombatantId: 'enemy-4',
        inference: 'mutual-targeting-non-missile-weapons',
      },
    ]);
    const engagement = requireEngagement(scenario.directMeleeEngagements[0]);

    expect(scenario.directMeleeEngagements).toHaveLength(1);
    expect(engagement.resolution.reason).toBe('simultaneous');
    expect(getStepSignatures(engagement)).toEqual([['party-11', 'enemy-41']]);
  });

  test('applies the open melee weapon speed resolver to tied direct weapon pairs', () => {
    const round = requireRound();

    round.partyInitiative = '4';
    round.enemyInitiative = '4';

    if (!round.party[0] || !round.enemies[0]) {
      throw new Error('Missing combatants');
    }

    round.party[0].weapon = 17;
    round.enemies[0].weapon = 2;

    setMutualTarget(round, 0, 0);

    const scenario = buildInitiativeScenarioFromTrackerRound(round);

    expect(scenario.directMeleePairs).toEqual([
      {
        partyCombatantId: 'party-1',
        enemyCombatantId: 'enemy-4',
        inference: 'mutual-targeting-non-missile-weapons',
      },
    ]);
    const engagement = requireEngagement(scenario.directMeleeEngagements[0]);

    expect(scenario.directMeleeEngagements).toHaveLength(1);
    expect(engagement.resolution.reason).toBe('weapon-speed-double');
    expect(getStepSignatures(engagement)).toEqual([
      ['party-11'],
      ['party-12'],
      ['enemy-41'],
    ]);
  });

  test('maps structured tracker attack routine counts to open melee sequencing', () => {
    const round = requireRound();

    round.partyInitiative = '5';
    round.enemyInitiative = '3';

    if (!round.party[0] || !round.enemies[0]) {
      throw new Error('Missing combatants');
    }

    round.party[0].name = 'Lodi';
    round.party[0].weapon = 17;
    round.enemies[0].name = 'Gnoll';
    round.enemies[0].weapon = 1;
    round.actions = [
      {
        id: 'party:1:main',
        source: 'intention',
        side: 'party',
        direction: 'partyToEnemy',
        combatantKey: 1,
        combatantIndex: 0,
        targetSide: 'enemy',
        declaredAction: 'open-melee',
        actionLabel: 'Two attacks',
        attackRoutineCount: 2,
        weaponId: 17,
        intention: 'Two attacks',
        result: '',
        targetDeclarations: [],
      },
    ];

    setMutualTarget(round, 0, 0);

    const resolvedRound = resolveTrackerRoundInitiative(round);
    const engagement = requireEngagement(
      resolvedRound.scenario.directMeleeEngagements[0]
    );

    expect(resolvedRound.scenario.party[0]).toMatchObject({
      id: 'party-1',
      declaredAction: 'open-melee',
      actionLabel: 'Two attacks',
      attackRoutine: {
        components: [
          { id: 'attack-1', order: 1, label: 'attack 1' },
          { id: 'attack-2', order: 2, label: 'attack 2' },
        ],
      },
      targetIds: ['enemy-4'],
    });
    expect(engagement.resolution.reason).toBe('multiple-routines');
    expect(getStepSignatures(engagement)).toEqual([
      ['party-11'],
      ['enemy-41'],
      ['party-12'],
    ]);
    expect(resolvedRound.attackGraph.layers).toEqual([
      ['attack:party-1:1'],
      ['attack:enemy-4:1'],
      ['attack:party-1:2'],
    ]);
  });

  test('does not invent direct pairs for many-to-one melee contact', () => {
    const round = requireRound();

    if (!round.party[0] || !round.party[1] || !round.enemies[0]) {
      throw new Error('Missing combatants');
    }

    round.party[0].weapon = 2;
    round.party[1].weapon = 3;
    round.enemies[0].weapon = 1;

    setMutualTarget(round, 0, 0);
    setMutualTarget(round, 0, 1);

    const scenario = buildInitiativeScenarioFromTrackerRound(round);

    expect(scenario.directMeleePairs).toEqual([]);
    expect(scenario.directMeleeEngagements).toEqual([]);
  });

  test('maps structured tracker Move/Close intentions to targetless movement timing', () => {
    const round = requireRound();

    round.partyInitiative = '6';
    round.enemyInitiative = '3';

    if (!round.party[0]) {
      throw new Error('Missing combatant');
    }

    round.party[0].name = 'Lodi';
    round.party[0].weapon = 2;
    round.party[0].movementRate = 9;
    round.actions = [
      {
        id: 'party:1:main',
        source: 'intention',
        side: 'party',
        direction: 'partyToEnemy',
        combatantKey: 1,
        combatantIndex: 0,
        targetSide: 'enemy',
        declaredAction: 'close',
        actionLabel: 'Move east',
        actionDistanceInches: 6,
        weaponId: 2,
        intention: 'Move east (6")',
        result: '',
        targetDeclarations: [],
      },
    ];

    const scenario = buildInitiativeScenarioFromTrackerRound(round);

    expect(scenario.party[0]).toMatchObject({
      id: 'party-1',
      name: 'Lodi',
      declaredAction: 'close',
      actionLabel: 'Move east',
      movementRate: 9,
      actionDistanceInches: 6,
      targetIds: [],
    });
    expect(scenario.movementResolutions).toEqual([
      expect.objectContaining({
        combatantId: 'party-1',
        action: 'close',
        reason: 'movement-complete',
        distanceInches: 6,
        closingInchesPerSegment: 0.9,
        contactSegment: 7,
        sameRoundAttack: false,
      }),
    ]);
  });

  test('maps structured tracker Charge intentions to charge contact graph nodes', () => {
    const round = requireRound();

    round.partyInitiative = '4';
    round.enemyInitiative = '4';

    if (!round.party[0] || !round.enemies[0]) {
      throw new Error('Missing combatants');
    }

    round.party[0].name = 'Garran';
    round.party[0].weapon = 50;
    round.party[0].movementRate = 12;
    round.enemies[0].name = 'Hobgoblin';
    round.enemies[0].weapon = 57;
    round.actions = [
      {
        id: 'party:1:main',
        source: 'intention',
        side: 'party',
        direction: 'partyToEnemy',
        combatantKey: 1,
        combatantIndex: 0,
        targetSide: 'enemy',
        declaredAction: 'charge',
        actionDistanceInches: 4,
        weaponId: 50,
        intention: 'Charge 4"',
        result: '',
        targetDeclarations: [],
      },
    ];

    const firstRow = round.cells[0];
    const firstCell = firstRow?.[0];

    if (!firstRow || !firstCell) {
      throw new Error('Missing target cell');
    }

    firstRow[0] = {
      ...firstCell,
      partyToEnemyVisible: true,
      partyToEnemy: 'charge target',
    };

    const resolvedRound = resolveTrackerRoundInitiative(round);

    expect(resolvedRound.scenario.party[0]).toMatchObject({
      id: 'party-1',
      declaredAction: 'charge',
      actionDistanceInches: 4,
      targetDeclarations: [
        {
          targetId: 'enemy-4',
          distanceInches: 4,
        },
      ],
    });
    expect(resolvedRound.resolution.movementResolutions).toEqual([
      expect.objectContaining({
        combatantId: 'party-1',
        targetId: 'enemy-4',
        action: 'charge',
        reason: 'contact',
        distanceInches: 4,
        contactSegment: 2,
        sameRoundAttack: true,
      }),
    ]);
    expect(resolvedRound.attackGraph.nodes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'attack:party-1:1',
          kind: 'attack',
          segment: 2,
          placement: expect.objectContaining({
            kind: 'movement-attack',
            action: 'charge',
            role: 'acting-combatant',
            opponentId: 'enemy-4',
            distanceInches: 4,
            contactSegment: 2,
          }),
        }),
      ])
    );
  });

  test('maps structured tracker No combat action labels to graph nodes', () => {
    const round = requireRound();

    round.partyInitiative = '3';
    round.enemyInitiative = '5';

    if (!round.party[0]) {
      throw new Error('Missing combatant');
    }

    round.party[0].name = 'Bemis';
    round.party[0].weapon = 13;
    round.actions = [
      {
        id: 'party:1:main',
        source: 'intention',
        side: 'party',
        direction: 'partyToEnemy',
        combatantKey: 1,
        combatantIndex: 0,
        targetSide: 'enemy',
        declaredAction: 'none',
        actionLabel: 'Gem of seeing',
        weaponId: 13,
        intention: 'Gem of seeing',
        result: '',
        targetDeclarations: [],
      },
    ];

    const resolvedRound = resolveTrackerRoundInitiative(round);

    expect(resolvedRound.scenario.party[0]).toMatchObject({
      id: 'party-1',
      declaredAction: 'none',
      actionLabel: 'Gem of seeing',
      targetIds: [],
    });
    expect(resolvedRound.attackGraph.nodes).toEqual([
      expect.objectContaining({
        id: 'attack:party-1:1',
        combatantId: 'party-1',
        label: 'action',
        actionLabel: 'Gem of seeing',
        placement: {
          kind: 'non-combat-unsegmented',
        },
      }),
    ]);
  });

  test('maps tracker missile initiative adjustment to initiative combatants', () => {
    const round = requireRound();

    round.partyInitiative = '4';
    round.enemyInitiative = '4';

    if (!round.party[0] || !round.enemies[0]) {
      throw new Error('Missing combatants');
    }

    round.party[0].name = 'Lodi';
    round.party[0].weapon = 9;
    round.party[0].missileInitiativeAdjustment = 2;
    round.enemies[0].name = 'Gnoll';
    setMutualTarget(round, 0, 0);

    const scenario = buildInitiativeScenarioFromTrackerRound(round);

    expect(scenario.party[0]).toMatchObject({
      id: 'party-1',
      name: 'Lodi',
      declaredAction: 'missile',
      missileInitiativeAdjustment: 2,
    });
  });

  test('maps structured tracker Missile intentions to split target volley nodes', () => {
    const round = requireRound();

    round.partyInitiative = '5';
    round.enemyInitiative = '2';

    if (!round.party[0] || !round.enemies[0] || !round.enemies[1]) {
      throw new Error('Missing combatants');
    }

    round.party[0].name = 'Lodi';
    round.party[0].weapon = 9;
    round.enemies[0].name = 'Gnoll 1';
    round.enemies[1].name = 'Gnoll 2';
    round.actions = [
      {
        id: 'party:1:main',
        source: 'intention',
        side: 'party',
        direction: 'partyToEnemy',
        combatantKey: 1,
        combatantIndex: 0,
        targetSide: 'enemy',
        declaredAction: 'missile',
        actionLabel: 'Fire arrows',
        weaponId: 9,
        intention: 'Fire arrows',
        result: '',
        targetDeclarations: [],
      },
    ];

    setPartyTarget(round, 0, 0, 'first arrow');
    setPartyTarget(round, 1, 0, 'second arrow');

    const resolvedRound = resolveTrackerRoundInitiative(round);

    expect(resolvedRound.scenario.party[0]).toMatchObject({
      id: 'party-1',
      declaredAction: 'missile',
      actionLabel: 'Fire arrows',
      targetIds: ['enemy-4', 'enemy-5'],
      attackRoutine: {
        components: [
          { id: 'attack-1', order: 1, label: 'attack 1' },
          { id: 'attack-2', order: 2, label: 'attack 2' },
        ],
      },
    });
    expect(resolvedRound.attackGraph.nodes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'attack:party-1:1',
          targetId: 'enemy-4',
          placement: {
            kind: 'missile-volley',
            splitTarget: true,
            targetId: 'enemy-4',
          },
        }),
        expect.objectContaining({
          id: 'attack:party-1:2',
          targetId: 'enemy-5',
          placement: {
            kind: 'missile-volley',
            splitTarget: true,
            targetId: 'enemy-5',
          },
        }),
      ])
    );
  });

  test('maps structured tracker initiative timing overrides for grid attacks', () => {
    const round = requireRound();

    round.partyInitiative = '2';
    round.enemyInitiative = '5';

    if (!round.party[0] || !round.enemies[0]) {
      throw new Error('Missing combatants');
    }

    round.party[0].name = 'Lodi';
    round.party[0].weapon = 17;
    round.enemies[0].name = 'Gnoll';
    round.enemies[0].weapon = 1;
    round.actions = [
      {
        id: 'party:1:main',
        source: 'intention',
        side: 'party',
        direction: 'partyToEnemy',
        combatantKey: 1,
        combatantIndex: 0,
        targetSide: 'enemy',
        declaredAction: 'open-melee',
        actionLabel: 'Sword of speed',
        initiativeTiming: 'wins-initiative',
        weaponId: 17,
        intention: 'Sword of speed',
        result: '',
        targetDeclarations: [],
      },
    ];

    setMutualTarget(round, 0, 0);

    const scenario = buildInitiativeScenarioFromTrackerRound(round);
    const engagement = requireEngagement(scenario.directMeleeEngagements[0]);

    expect(scenario.party[0]).toMatchObject({
      id: 'party-1',
      declaredAction: 'open-melee',
      actionLabel: 'Sword of speed',
      initiativeTiming: 'wins-initiative',
      targetIds: ['enemy-4'],
    });
    expect(engagement.resolution.steps[0]?.attacks).toEqual([
      expect.objectContaining({
        combatantId: 'party-1',
      }),
    ]);
  });

  test('maps structured tracker Turn undead intentions to unsegmented graph nodes', () => {
    const round = requireRound();

    round.partyInitiative = '3';
    round.enemyInitiative = '5';

    if (!round.party[0] || !round.enemies[0]) {
      throw new Error('Missing combatants');
    }

    round.party[0].name = 'Astrid';
    round.party[0].weapon = 17;
    round.enemies[0].name = 'Ghoul';
    round.enemies[0].weapon = 1;
    round.actions = [
      {
        id: 'party:1:main',
        source: 'intention',
        side: 'party',
        direction: 'partyToEnemy',
        combatantKey: 1,
        combatantIndex: 0,
        targetSide: 'enemy',
        declaredAction: 'turn-undead',
        actionLabel: 'Turn undead',
        weaponId: 17,
        intention: 'Turn undead',
        result: '',
        targetDeclarations: [],
      },
    ];

    setPartyTarget(round, 0, 0, 'turn target');
    setEnemyTarget(round, 0, 0, 'claw');

    const resolvedRound = resolveTrackerRoundInitiative(round);

    expect(resolvedRound.scenario.party[0]).toMatchObject({
      id: 'party-1',
      declaredAction: 'turn-undead',
      actionLabel: 'Turn undead',
      targetIds: ['enemy-4'],
    });
    expect(resolvedRound.attackGraph.nodes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'attack:party-1:1',
          targetId: 'enemy-4',
          placement: {
            kind: 'turn-undead-unsegmented',
          },
        }),
        expect.objectContaining({
          id: 'attack:enemy-4:1',
          targetId: 'party-1',
        }),
      ])
    );
    expect(resolvedRound.attackGraph.edges).toEqual([
      {
        fromNodeId: 'attack:enemy-4:1',
        toNodeId: 'attack:party-1:1',
        reasons: ['simple-initiative'],
      },
    ]);
  });

  test('maps multiple structured tracker intentions for one combatant', () => {
    const round = requireRound();

    round.partyInitiative = '6';
    round.enemyInitiative = '3';

    if (!round.party[0] || !round.enemies[0]) {
      throw new Error('Missing combatants');
    }

    round.party[0].name = 'Lodi';
    round.party[0].weapon = 17;
    round.enemies[0].name = 'Gnoll';
    round.actions = [
      {
        id: 'party:1:main',
        source: 'intention',
        side: 'party',
        direction: 'partyToEnemy',
        combatantKey: 1,
        combatantIndex: 0,
        targetSide: 'enemy',
        declaredAction: 'open-melee',
        actionLabel: 'Sword of speed',
        initiativeTiming: 'wins-initiative',
        weaponId: 17,
        intention: 'Sword of speed',
        result: '',
        targetDeclarations: [],
      },
      {
        id: 'party:1:action-2',
        source: 'intention',
        side: 'party',
        direction: 'partyToEnemy',
        combatantKey: 1,
        combatantIndex: 0,
        targetSide: 'enemy',
        declaredAction: 'close',
        actionLabel: 'Move east',
        usesGridTargets: false,
        actionDistanceInches: 6,
        weaponId: 17,
        intention: 'Move east (6")',
        result: '',
        targetDeclarations: [],
      },
    ];

    const firstRow = round.cells[0];
    const firstCell = firstRow?.[0];

    if (!firstRow || !firstCell) {
      throw new Error('Missing target cell');
    }

    firstRow[0] = {
      ...firstCell,
      partyToEnemyVisible: true,
      partyToEnemy: 'target',
    };

    const scenario = buildInitiativeScenarioFromTrackerRound(round);

    expect(scenario.party).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'party-1',
          actionId: 'party:1:main',
          actionIndex: 0,
          ownerCombatantKey: 1,
          actionLabel: 'Sword of speed',
          initiativeTiming: 'wins-initiative',
          targetIds: ['enemy-4'],
        }),
        expect.objectContaining({
          id: 'party-action-1001',
          actionId: 'party:1:action-2',
          actionIndex: 1,
          ownerCombatantKey: 1,
          declaredAction: 'close',
          actionLabel: 'Move east',
          actionDistanceInches: 6,
          targetIds: [],
        }),
      ])
    );
  });

  test('maps assigned tracker targets to separate structured action nodes', () => {
    const round = requireRound();

    round.partyInitiative = '6';
    round.enemyInitiative = '3';

    if (!round.party[0] || !round.enemies[0] || !round.enemies[1]) {
      throw new Error('Missing combatants');
    }

    round.party[0].name = 'Astrid';
    round.party[0].weapon = 17;
    round.enemies[0].name = 'Ghoul';
    round.enemies[1].name = 'Yeenoghu';
    round.actions = [
      {
        id: 'party:1:main',
        source: 'intention',
        side: 'party',
        direction: 'partyToEnemy',
        combatantKey: 1,
        combatantIndex: 0,
        targetSide: 'enemy',
        declaredAction: 'open-melee',
        actionLabel: 'Flail',
        weaponId: 17,
        intention: 'Flail',
        result: '',
        targetDeclarations: [],
      },
      {
        id: 'party:1:action-2',
        source: 'intention',
        side: 'party',
        direction: 'partyToEnemy',
        combatantKey: 1,
        combatantIndex: 0,
        targetSide: 'enemy',
        declaredAction: 'magical-device',
        actionLabel: 'Spiritual hammer',
        weaponId: 17,
        intention: 'Spiritual hammer',
        result: '',
        targetDeclarations: [],
      },
    ];

    setPartyTarget(round, 0, 0, 'flail hit', ['party:1:main']);
    setPartyTarget(round, 1, 0, 'hammer hit', ['party:1:action-2']);

    const resolvedRound = resolveTrackerRoundInitiative(round);

    expect(resolvedRound.scenario.party).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'party-1',
          actionId: 'party:1:main',
          declaredAction: 'open-melee',
          actionLabel: 'Flail',
          targetIds: ['enemy-4'],
        }),
        expect.objectContaining({
          id: 'party-action-1001',
          actionId: 'party:1:action-2',
          declaredAction: 'magical-device',
          actionLabel: 'Spiritual hammer',
          targetIds: ['enemy-5'],
        }),
      ])
    );
    expect(resolvedRound.attackGraph.nodes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'attack:party-1:1',
          targetId: 'enemy-4',
          actionLabel: 'Flail',
        }),
        expect.objectContaining({
          id: 'attack:party-action-1001:1',
          targetId: 'enemy-5',
          actionLabel: 'Spiritual hammer',
          placement: {
            kind: 'magical-device-unsegmented',
          },
        }),
      ])
    );
  });

  test('maps structured tracker Cast spell intentions to spell timing nodes', () => {
    const round = requireRound();

    round.partyInitiative = '6';
    round.enemyInitiative = '3';

    if (!round.party[0]) {
      throw new Error('Missing combatant');
    }

    round.party[0].name = 'Sot';
    round.party[0].weapon = 5;
    round.actions = [
      {
        id: 'party:1:main',
        source: 'intention',
        side: 'party',
        direction: 'partyToEnemy',
        combatantKey: 1,
        combatantIndex: 0,
        targetSide: 'enemy',
        declaredAction: 'spell-casting',
        actionLabel: 'Magic Missile',
        castingSegments: 1,
        weaponId: 5,
        intention: 'Magic Missile (1 segment)',
        result: '',
        targetDeclarations: [],
      },
    ];

    const resolvedRound = resolveTrackerRoundInitiative(round);

    expect(resolvedRound.scenario.party[0]).toMatchObject({
      id: 'party-1',
      name: 'Sot',
      declaredAction: 'spell-casting',
      actionLabel: 'Magic Missile',
      castingSegments: 1,
      targetIds: [],
    });
    expect(resolvedRound.attackGraph.nodes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'spell-start:party-1',
          kind: 'spell-start',
          segment: 1,
        }),
        expect.objectContaining({
          id: 'spell-completion:party-1',
          kind: 'spell-completion',
          segment: 1,
        }),
      ])
    );
  });

  test('maps targetless structured tracker Magical device intentions to timed graph nodes', () => {
    const round = requireRound();

    round.partyInitiative = '6';
    round.enemyInitiative = '3';

    if (!round.party[0]) {
      throw new Error('Missing combatant');
    }

    round.party[0].name = 'Lodi';
    round.party[0].weapon = 57;
    round.actions = [
      {
        id: 'party:1:main',
        source: 'intention',
        side: 'party',
        direction: 'partyToEnemy',
        combatantKey: 1,
        combatantIndex: 0,
        targetSide: 'enemy',
        declaredAction: 'magical-device',
        actionLabel: 'Ring of invisibility',
        activationSegments: 1,
        weaponId: 57,
        intention: 'Ring of invisibility',
        result: '',
        targetDeclarations: [],
      },
    ];

    const resolvedRound = resolveTrackerRoundInitiative(round);

    expect(resolvedRound.scenario.party[0]).toMatchObject({
      id: 'party-1',
      declaredAction: 'magical-device',
      actionLabel: 'Ring of invisibility',
      activationSegments: 1,
      targetIds: [],
    });
    expect(resolvedRound.attackGraph.nodes).toEqual([
      expect.objectContaining({
        id: 'attack:party-1:1',
        segment: 1,
        placement: {
          kind: 'declared-action-segment',
          declaredAction: 'magical-device',
          activationSegments: 1,
        },
      }),
    ]);
  });

  test('maps structured tracker Magical device intentions with optional multiple targets', () => {
    const round = requireRound();

    round.partyInitiative = '6';
    round.enemyInitiative = '3';

    if (!round.party[0] || !round.enemies[0] || !round.enemies[1]) {
      throw new Error('Missing combatants');
    }

    round.party[0].name = 'Shep';
    round.party[0].weapon = 5;
    round.enemies[0].name = 'Ghoul 1';
    round.enemies[1].name = 'Ghoul 2';
    round.actions = [
      {
        id: 'party:1:main',
        source: 'intention',
        side: 'party',
        direction: 'partyToEnemy',
        combatantKey: 1,
        combatantIndex: 0,
        targetSide: 'enemy',
        declaredAction: 'magical-device',
        actionLabel: 'Wand burst',
        activationSegments: 7,
        weaponId: 5,
        intention: 'Wand burst (7 segments)',
        result: '',
        targetDeclarations: [],
      },
    ];

    const firstRow = round.cells[0];
    const secondRow = round.cells[1];
    const firstCell = firstRow?.[0];
    const secondCell = secondRow?.[0];

    if (!firstRow || !secondRow || !firstCell || !secondCell) {
      throw new Error('Missing target cells');
    }

    firstRow[0] = {
      ...firstCell,
      partyToEnemyVisible: true,
      partyToEnemy: 'target',
    };
    secondRow[0] = {
      ...secondCell,
      partyToEnemyVisible: true,
      partyToEnemy: 'target',
    };

    const resolvedRound = resolveTrackerRoundInitiative(round);

    expect(resolvedRound.scenario.party[0]).toMatchObject({
      id: 'party-1',
      name: 'Shep',
      declaredAction: 'magical-device',
      actionLabel: 'Wand burst',
      activationSegments: 7,
      targetIds: ['enemy-4', 'enemy-5'],
    });
    expect(resolvedRound.attackGraph.nodes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'attack:party-1:1',
          combatantId: 'party-1',
          actionLabel: 'Wand burst',
          segment: 7,
          placement: {
            kind: 'declared-action-segment',
            declaredAction: 'magical-device',
            activationSegments: 7,
          },
        }),
      ])
    );
  });

  test('maps structured tracker Set vs charge responses to charge timing nodes', () => {
    const round = requireRound();

    round.partyInitiative = '2';
    round.enemyInitiative = '5';

    if (!round.party[0] || !round.enemies[0]) {
      throw new Error('Missing combatants');
    }

    round.party[0].name = 'Doran';
    round.party[0].weapon = 50;
    round.party[0].movementRate = 12;
    round.enemies[0].name = 'Raider';
    round.enemies[0].weapon = 56;
    round.enemies[0].movementRate = 12;
    round.actions = [
      {
        id: 'party:1:main',
        source: 'intention',
        side: 'party',
        direction: 'partyToEnemy',
        combatantKey: 1,
        combatantIndex: 0,
        targetSide: 'enemy',
        declaredAction: 'set-vs-charge',
        actionLabel: 'Set spear',
        weaponId: 50,
        intention: 'Set spear',
        result: '',
        targetDeclarations: [],
      },
      {
        id: 'enemy:4:main',
        source: 'intention',
        side: 'enemy',
        direction: 'enemyToParty',
        combatantKey: 4,
        combatantIndex: 0,
        targetSide: 'party',
        declaredAction: 'charge',
        actionLabel: 'Charge Doran',
        actionDistanceInches: 4,
        weaponId: 56,
        intention: 'Charge Doran',
        result: '',
        targetDeclarations: [],
      },
    ];

    setPartyTarget(round, 0, 0, 'set spear');
    setEnemyTarget(round, 0, 0, 'charge');

    const resolvedRound = resolveTrackerRoundInitiative(round);

    expect(resolvedRound.scenario.party[0]).toMatchObject({
      id: 'party-1',
      declaredAction: 'set-vs-charge',
      targetIds: ['enemy-4'],
    });
    expect(resolvedRound.scenario.enemies[0]).toMatchObject({
      id: 'enemy-4',
      declaredAction: 'charge',
      actionDistanceInches: 4,
      targetDeclarations: [
        {
          targetId: 'party-1',
          distanceInches: 4,
        },
      ],
    });
    expect(resolvedRound.resolution.movementResolutions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          combatantId: 'enemy-4',
          targetId: 'party-1',
          action: 'charge',
          reason: 'contact',
          contactSegment: 2,
          firstStrike: 'target',
        }),
        expect.objectContaining({
          combatantId: 'party-1',
          targetId: 'enemy-4',
          action: 'set-vs-charge',
          reason: 'contact',
          contactSegment: 2,
          firstStrike: 'attacker',
          damageMultiplier: 2,
        }),
      ])
    );
    expect(resolvedRound.attackGraph.nodes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'attack:party-1:1',
          segment: 2,
          placement: {
            kind: 'movement-attack',
            action: 'set-vs-charge',
            role: 'acting-combatant',
            opponentId: 'enemy-4',
            distanceInches: 4,
            movementRate: 12,
            contactSegment: 2,
            firstStrike: 'attacker',
            damageMultiplier: 2,
          },
        }),
        expect.objectContaining({
          id: 'attack:enemy-4:1',
          segment: 2,
          placement: {
            kind: 'movement-attack',
            action: 'charge',
            role: 'acting-combatant',
            opponentId: 'party-1',
            distanceInches: 4,
            movementRate: 12,
            contactSegment: 2,
            firstStrike: 'target',
            damageMultiplier: undefined,
          },
        }),
      ])
    );
    expect(resolvedRound.attackGraph.edges).toEqual(
      expect.arrayContaining([
        {
          fromNodeId: 'attack:party-1:1',
          toNodeId: 'attack:enemy-4:1',
          reasons: ['movement'],
        },
      ])
    );
  });
});
