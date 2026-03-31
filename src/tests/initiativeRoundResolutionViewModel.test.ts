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
              distance: 40,
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
        "Contact on segment 2 at 24' per segment; same-round charge attack applies.",
      combatantIds: ['party-1', 'enemy-3'],
    });
  });
});
