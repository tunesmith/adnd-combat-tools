import { resolveInitiativeRound } from '../helpers/initiative/roundResolution';
import { buildInitiativeRoundResolutionViewModel } from '../helpers/initiative/roundResolutionViewModel';
import { buildInitiativeScenario } from '../helpers/initiative/scenario';
import type { InitiativeScenarioDraft } from '../types/initiative';

const createMixedDraft = (): InitiativeScenarioDraft => ({
  label: 'Mixed Open Melee',
  partyInitiative: 4,
  enemyInitiative: 4,
  party: [
    {
      combatantKey: 1,
      name: 'Aldred',
      weaponId: 17,
      targetCombatantKeys: [3],
    },
    {
      combatantKey: 2,
      name: 'Bera',
      weaponId: 16,
      targetCombatantKeys: [],
    },
  ],
  enemies: [
    {
      combatantKey: 3,
      name: 'Gnoll',
      weaponId: 2,
      targetCombatantKeys: [1],
    },
    {
      combatantKey: 4,
      name: 'Ghoul',
      weaponId: 1,
      targetCombatantKeys: [],
    },
  ],
});

describe('initiative round resolution view model', () => {
  test('explains simple order and direct melee timing', () => {
    const scenario = buildInitiativeScenario(createMixedDraft());
    const resolution = resolveInitiativeRound(scenario);
    const viewModel = buildInitiativeRoundResolutionViewModel(
      scenario,
      resolution
    );

    expect(viewModel.cards[0]).toMatchObject({
      id: 'simple-order',
      kind: 'simple-order',
      title: 'Simple Initiative Order',
    });
    expect(viewModel.cards[0]?.summary).toContain('tied initiative at 4');
    expect(viewModel.cards[1]).toMatchObject({
      kind: 'direct-melee',
      title: 'Aldred vs Gnoll',
    });
    expect(viewModel.cards[1]?.summary).toContain(
      'multiple-attack threshold of 4'
    );
    expect(viewModel.cards[1]?.steps).toEqual([
      {
        label: 'Step 1',
        detail: 'Aldred attack 1',
        combatantIds: ['party-1'],
      },
      {
        label: 'Step 2',
        detail: 'Aldred attack 2',
        combatantIds: ['party-1'],
      },
      {
        label: 'Step 3',
        detail: 'Gnoll attack 1',
        combatantIds: ['enemy-3'],
      },
    ]);
  });

  test('adds an unresolved card when mutual contact is ambiguous', () => {
    const scenario = buildInitiativeScenario({
      label: 'Ambiguous Scrum',
      partyInitiative: 6,
      enemyInitiative: 1,
      party: [
        {
          combatantKey: 1,
          name: 'Moryn',
          weaponId: 2,
          targetCombatantKeys: [4],
        },
        {
          combatantKey: 2,
          name: 'Sella',
          weaponId: 3,
          targetCombatantKeys: [4],
        },
      ],
      enemies: [
        {
          combatantKey: 4,
          name: 'Bugbear',
          weaponId: 1,
          targetCombatantKeys: [1, 2],
        },
      ],
    });
    const resolution = resolveInitiativeRound(scenario);
    const viewModel = buildInitiativeRoundResolutionViewModel(
      scenario,
      resolution
    );
    const unresolvedCard = viewModel.cards.find(
      (card) => card.kind === 'unresolved'
    );

    expect(unresolvedCard?.kind).toBe('unresolved');
    expect(unresolvedCard?.summary).toContain('clean one-to-one pairing');
    expect(unresolvedCard?.steps[0]).toEqual({
      label: 'Held back for adjudication',
      detail: 'Moryn, Sella, Bugbear',
      combatantIds: ['party-1', 'party-2', 'enemy-4'],
    });
  });

  test('adds movement cards for close and charge outcomes', () => {
    const scenario = buildInitiativeScenario({
      label: 'Charge Contact',
      partyInitiative: 3,
      enemyInitiative: 5,
      party: [
        {
          combatantKey: 1,
          name: 'Garran',
          declaredAction: 'charge',
          movementRate: 12,
          weaponId: 50,
          targetDeclarations: [
            {
              targetCombatantKey: 3,
              distanceInches: 4,
            },
          ],
        },
      ],
      enemies: [
        {
          combatantKey: 3,
          name: 'Raider',
          declaredAction: 'open-melee',
          movementRate: 9,
          weaponId: 17,
          targetCombatantKeys: [1],
        },
      ],
    });
    const resolution = resolveInitiativeRound(scenario);
    const viewModel = buildInitiativeRoundResolutionViewModel(
      scenario,
      resolution
    );
    const movementCard = viewModel.cards.find(
      (card) => card.kind === 'movement'
    );

    expect(movementCard).toMatchObject({
      kind: 'movement',
      title: 'Garran charge',
    });
    expect(movementCard?.summary).toContain('segment 2');
    expect(movementCard?.summary).toContain('attacks first at contact');
    expect(movementCard?.steps[2]).toEqual({
      label: 'Outcome',
      detail:
        'Contact on segment 2 at 2.4" per segment; same-round charge attack applies.',
      combatantIds: ['party-1', 'enemy-3'],
    });
  });

  test('explains set versus charge as an automatic first strike with double damage', () => {
    const scenario = buildInitiativeScenario({
      label: 'Set vs Charge',
      partyInitiative: 2,
      enemyInitiative: 5,
      party: [
        {
          combatantKey: 1,
          name: 'Doran',
          declaredAction: 'set-vs-charge',
          movementRate: 12,
          weaponId: 50,
          targetCombatantKeys: [3],
        },
      ],
      enemies: [
        {
          combatantKey: 3,
          name: 'Raider',
          declaredAction: 'charge',
          movementRate: 12,
          weaponId: 56,
          targetDeclarations: [
            {
              targetCombatantKey: 1,
              distanceInches: 4,
            },
          ],
        },
      ],
    });
    const resolution = resolveInitiativeRound(scenario);
    const viewModel = buildInitiativeRoundResolutionViewModel(
      scenario,
      resolution
    );
    const movementCard = viewModel.cards.find(
      (card) => card.id === 'movement-party-1'
    );

    expect(movementCard?.summary).toContain('set weapon takes effect first');
    expect(movementCard?.summary).toContain('double normal damage');
    expect(movementCard?.steps[2]).toEqual({
      label: 'Outcome',
      detail:
        'Charge contact on segment 2; the set weapon strikes first and deals 2x normal damage on a hit.',
      combatantIds: ['party-1', 'enemy-3'],
    });
  });

  test('explains when a set weapon never triggers', () => {
    const scenario = buildInitiativeScenario({
      label: 'Set Not Triggered',
      partyInitiative: 6,
      enemyInitiative: 2,
      party: [
        {
          combatantKey: 1,
          name: 'Doran',
          declaredAction: 'set-vs-charge',
          movementRate: 12,
          weaponId: 50,
          targetCombatantKeys: [3],
        },
      ],
      enemies: [
        {
          combatantKey: 3,
          name: 'Raider',
          declaredAction: 'open-melee',
          movementRate: 9,
          weaponId: 56,
          targetCombatantKeys: [1],
        },
      ],
    });
    const resolution = resolveInitiativeRound(scenario);
    const viewModel = buildInitiativeRoundResolutionViewModel(
      scenario,
      resolution
    );
    const movementCard = viewModel.cards.find(
      (card) => card.id === 'movement-party-1'
    );

    expect(movementCard?.summary).toContain('did not charge into contact');
    expect(movementCard?.steps[2]).toEqual({
      label: 'Outcome',
      detail: 'No charging contact occurred against the set weapon this round.',
      combatantIds: ['party-1', 'enemy-3'],
    });
  });

  test('explains a closer striking a charging opponent on contact', () => {
    const scenario = buildInitiativeScenario({
      label: 'Charge vs Close',
      partyInitiative: 2,
      enemyInitiative: 5,
      party: [
        {
          combatantKey: 1,
          name: 'Ronan',
          declaredAction: 'close',
          movementRate: 12,
          weaponId: 17,
          targetDeclarations: [
            {
              targetCombatantKey: 3,
              distanceInches: 6,
            },
          ],
        },
      ],
      enemies: [
        {
          combatantKey: 3,
          name: 'Lancer',
          declaredAction: 'charge',
          movementRate: 9,
          weaponId: 50,
          targetDeclarations: [
            {
              targetCombatantKey: 1,
              distanceInches: 6,
            },
          ],
        },
      ],
    });
    const resolution = resolveInitiativeRound(scenario);
    const viewModel = buildInitiativeRoundResolutionViewModel(
      scenario,
      resolution
    );
    const movementCard = viewModel.cards.find(
      (card) => card.id === 'movement-party-1'
    );

    expect(movementCard?.summary).toContain(
      'this closer can also strike in the same round'
    );
    expect(movementCard?.steps[2]).toEqual({
      label: 'Outcome',
      detail:
        'Striking range reached on segment 2 at 3" per segment; same-round return attack applies against the charger.',
      combatantIds: ['party-1', 'enemy-3'],
    });
  });

  test('explains invalid open melee versus close declarations', () => {
    const scenario = buildInitiativeScenario({
      label: 'Invalid Open Melee vs Close',
      partyInitiative: 4,
      enemyInitiative: 2,
      party: [
        {
          combatantKey: 1,
          name: 'Ronan',
          declaredAction: 'close',
          movementRate: 12,
          weaponId: 17,
          targetDeclarations: [
            {
              targetCombatantKey: 3,
              distanceInches: 3.5,
            },
          ],
        },
      ],
      enemies: [
        {
          combatantKey: 3,
          name: 'Orc',
          declaredAction: 'open-melee',
          movementRate: 9,
          weaponId: 1,
          targetCombatantKeys: [1],
        },
      ],
    });
    const resolution = resolveInitiativeRound(scenario);
    const viewModel = buildInitiativeRoundResolutionViewModel(
      scenario,
      resolution
    );
    const movementCard = viewModel.cards.find(
      (card) => card.id === 'movement-party-1'
    );

    expect(movementCard?.summary).toContain(
      'open melee versus close is treated as an invalid declaration'
    );
    expect(movementCard?.steps[2]).toEqual({
      label: 'Outcome',
      detail:
        'Invalid direct pairing: open melee cannot oppose a close declaration in the same exchange.',
      combatantIds: ['party-1', 'enemy-3'],
    });
  });

  test('explains one bow shot before charge contact when the missile side wins initiative', () => {
    const scenario = buildInitiativeScenario({
      label: 'Bow vs Charge',
      partyInitiative: 5,
      enemyInitiative: 2,
      party: [
        {
          combatantKey: 1,
          name: 'Bowman',
          declaredAction: 'missile',
          weaponId: 11,
          targetCombatantKeys: [3],
        },
      ],
      enemies: [
        {
          combatantKey: 3,
          name: 'Raider',
          declaredAction: 'charge',
          movementRate: 12,
          weaponId: 56,
          targetDeclarations: [
            {
              targetCombatantKey: 1,
              distanceInches: 4,
            },
          ],
        },
      ],
    });
    const resolution = resolveInitiativeRound(scenario);
    const viewModel = buildInitiativeRoundResolutionViewModel(
      scenario,
      resolution
    );
    const movementCard = viewModel.cards.find(
      (card) => card.id === 'movement-enemy-3'
    );

    expect(movementCard?.summary).toContain(
      'Bowman gets one missile shot off before Raider reaches contact on segment 2.'
    );
    expect(movementCard?.summary).toContain(
      'Later missile shots are lost once melee contact is made.'
    );
    expect(movementCard?.steps[2]).toEqual({
      label: 'Outcome',
      detail:
        'Contact on segment 2; Bowman gets one missile shot before contact; later missile shots are lost at contact.',
      combatantIds: ['enemy-3', 'party-1'],
    });
  });

  test('explains that pending missile shots are lost when the charge wins initiative', () => {
    const scenario = buildInitiativeScenario({
      label: 'Charge Beats Bow',
      partyInitiative: 2,
      enemyInitiative: 5,
      party: [
        {
          combatantKey: 1,
          name: 'Bowman',
          declaredAction: 'missile',
          weaponId: 11,
          targetCombatantKeys: [3],
        },
      ],
      enemies: [
        {
          combatantKey: 3,
          name: 'Raider',
          declaredAction: 'charge',
          movementRate: 12,
          weaponId: 56,
          targetDeclarations: [
            {
              targetCombatantKey: 1,
              distanceInches: 4,
            },
          ],
        },
      ],
    });
    const resolution = resolveInitiativeRound(scenario);
    const viewModel = buildInitiativeRoundResolutionViewModel(
      scenario,
      resolution
    );
    const movementCard = viewModel.cards.find(
      (card) => card.id === 'movement-enemy-3'
    );

    expect(movementCard?.summary).toContain(
      'Raider reaches Bowman on segment 2 before ordinary missile fire can be completed.'
    );
    expect(movementCard?.summary).toContain(
      'Pending missile shots are lost once melee contact is made.'
    );
    expect(movementCard?.steps[2]).toEqual({
      label: 'Outcome',
      detail:
        'Contact on segment 2; the charge closes before ordinary missile fire, so pending missile shots are lost.',
      combatantIds: ['enemy-3', 'party-1'],
    });
  });

  test('explains tied bow fire and charge as simultaneous', () => {
    const scenario = buildInitiativeScenario({
      label: 'Bow vs Charge Tie',
      partyInitiative: 4,
      enemyInitiative: 4,
      party: [
        {
          combatantKey: 1,
          name: 'Bowman',
          declaredAction: 'missile',
          weaponId: 11,
          targetCombatantKeys: [3],
        },
      ],
      enemies: [
        {
          combatantKey: 3,
          name: 'Raider',
          declaredAction: 'charge',
          movementRate: 12,
          weaponId: 56,
          targetDeclarations: [
            {
              targetCombatantKey: 1,
              distanceInches: 4,
            },
          ],
        },
      ],
    });
    const resolution = resolveInitiativeRound(scenario);
    const viewModel = buildInitiativeRoundResolutionViewModel(
      scenario,
      resolution
    );
    const movementCard = viewModel.cards.find(
      (card) => card.id === 'movement-enemy-3'
    );

    expect(movementCard?.summary).toContain(
      'The first missile shot and the charge attack are simultaneous in this tied round'
    );
    expect(movementCard?.summary).toContain(
      'Later missile shots are lost once melee contact is made.'
    );
    expect(movementCard?.steps[2]).toEqual({
      label: 'Outcome',
      detail:
        "Contact on segment 2; Bowman's first missile shot and the charge attack resolve simultaneously; later missile shots are lost at contact.",
      combatantIds: ['enemy-3', 'party-1'],
    });
  });

  test('explains missile timing that overrides the side initiative winner', () => {
    const scenario = buildInitiativeScenario({
      label: 'Missile Dex Edge',
      partyInitiative: 3,
      enemyInitiative: 5,
      party: [
        {
          combatantKey: 1,
          name: 'Bowman',
          declaredAction: 'missile',
          missileInitiativeAdjustment: 3,
          weaponId: 11,
          targetCombatantKeys: [3],
        },
      ],
      enemies: [
        {
          combatantKey: 3,
          name: 'Orc',
          declaredAction: 'open-melee',
          weaponId: 1,
          targetCombatantKeys: [1],
        },
      ],
    });
    const resolution = resolveInitiativeRound(scenario);
    const viewModel = buildInitiativeRoundResolutionViewModel(
      scenario,
      resolution
    );
    const simpleOrderCard = viewModel.cards.find(
      (card) => card.id === 'simple-order'
    );

    expect(simpleOrderCard?.summary).toContain(
      'Enemy side won initiative 5 to 3'
    );
  });
});
