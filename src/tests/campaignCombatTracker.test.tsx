/** @jest-environment jsdom */
import { useState } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import CombatTracker from '../components/tracker/CombatTracker';
import { createRegisterIntentionsFixtureState } from './support/trackerFixtures';
import { parseCampaign, serializeCampaign } from '../helpers/campaignDocument';
import {
  createWorkingCombat,
  changeWorkingCombat,
} from '../helpers/campaignWorkingCombat';
import baseline from './fixtures/campaignSnapshots.json';
import type { CampaignDocument } from '../helpers/campaignDocument';
import type { TrackerState } from '../types/tracker';
import { CLERIC, FIGHTER } from '../tables/attackerClass';
import {
  addCombatant,
  createInitialTrackerState,
  insertRoundAfterActive,
  removeCombatant,
} from '../helpers/trackerState';

afterEach(() => jest.restoreAllMocks());
test('round review shows recorded results for the current combatant alongside an independent Outcome', () => {
  jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
  const state = createRegisterIntentionsFixtureState();
  const round = state.rounds[0];
  if (!round) throw new Error('Missing round');
  const lodi = round.party[0],
    gnoll = round.enemies[0];
  if (!lodi || !gnoll) throw new Error('Missing combatants');
  const outgoing = {
    side: 'party' as const,
    actorKey: lodi.key,
    actorName: 'Lodi',
    targetKeys: [gnoll.key],
    targetLabel: 'Pillar Gnoll',
    stepKey: null,
    stepLabel: 'Backstab',
    text: 'Missed the gnoll.',
  };
  const incoming = {
    side: 'enemy' as const,
    actorKey: gnoll.key,
    actorName: 'Pillar Gnoll',
    targetKeys: [lodi.key],
    targetLabel: 'Lodi',
    stepKey: null,
    stepLabel: 'Attack',
    text: 'Hit Lodi.',
  };
  round.stepResults = [
    outgoing,
    incoming,
    {
      ...incoming,
      targetKeys: [],
      targetLabel: 'Multiple targets',
      text: 'Unassigned attack.',
    },
  ];
  render(<CombatTracker rememberedState={state} />);
  fireEvent.click(screen.getByRole('button', { name: 'Review round' }));
  const dialog = within(screen.getByRole('dialog', { name: 'Review round' }));
  expect(
    dialog.getByText('Related results (2)').closest('details')
  ).toHaveAttribute('open');
  expect(dialog.getByText(outgoing.text)).toBeVisible();
  expect(dialog.getByText(incoming.text)).toBeVisible();
  expect(dialog.queryByText('Unassigned attack.')).toBeNull();
  expect(dialog.getByLabelText('Outcome')).toHaveValue('');
  fireEvent.click(dialog.getByRole('button', { name: 'Next' }));
  expect(dialog.queryByText(/Related results/)).toBeNull();
});

test('review links unassigned steps to their independent result pickers even before notes are entered', () => {
  jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
  const state = createRegisterIntentionsFixtureState();
  const round = state.rounds[0],
    actor = round?.party[0],
    target = round?.enemies[0],
    other = round?.enemies[1];
  const firstCell = round?.cells[0]?.[0],
    secondCell = round?.cells[1]?.[0];
  if (!actor || !target || !other || !firstCell || !secondCell)
    throw Error('Missing matchup');
  actor.attacksPerRoutine = 2;
  firstCell.enemyToParty = '';
  firstCell.enemyToPartyVisible = false;
  secondCell.partyToEnemyVisible = true;
  render(<CombatTracker rememberedState={state} />);
  const review = () => {
    fireEvent.click(screen.getByRole('button', { name: 'Review round' }));
    return within(screen.getByRole('dialog', { name: 'Review round' }));
  };
  const jump = (count: number, attack: number) => {
    const dialog = review();
    fireEvent.click(dialog.getByText(`Unassigned result targets (${count})`));
    fireEvent.click(
      dialog.getByRole('button', { name: new RegExp(`attack ${attack}$`) })
    );
    return screen.getByLabelText('Result target');
  };
  const first = jump(2, 1);
  expect(first).toHaveValue('');
  fireEvent.change(first, { target: { value: String(target.key) } });
  const second = jump(1, 2);
  expect(second).toHaveValue('');
  fireEvent.change(second, { target: { value: String(other.key) } });
  fireEvent.change(
    screen.getByLabelText('Detail (optional)', { exact: true }),
    {
      target: { value: 'Second hit' },
    }
  );
  const dialog = review();
  expect(dialog.queryByText(/Unassigned result targets/)).toBeNull();
  expect(dialog.getByText('Related results (1)')).toBeInTheDocument();
  expect(dialog.getByText(`${actor.name} → ${other.name}`)).toBeInTheDocument();
});

test('controlled tracker sends complete live edits through campaign validation and never writes browser drafts or URL', () => {
  jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
  const local = jest.spyOn(Storage.prototype, 'setItem');
  const url = jest.spyOn(window.history, 'replaceState');
  let accepted = createWorkingCombat(
    parseCampaign(JSON.stringify(baseline)),
    'session-1',
    'Synthetic encounter',
    createRegisterIntentionsFixtureState(),
    { kind: 'empty' },
    'combat-working'
  );
  function Harness() {
    const [doc, setDoc] = useState<CampaignDocument>(accepted);
    const combat = doc.workingCombats[0];
    if (!combat) throw new Error('Missing fixture');
    return (
      <CombatTracker
        campaign={{
          active: true,
          state: combat.state,
          onStateChange: (state) => {
            accepted = parseCampaign(
              serializeCampaign(
                changeWorkingCombat(
                  accepted,
                  'combat-working',
                  'session-1',
                  0,
                  state
                )
              )
            );
            setDoc(accepted);
            return true;
          },
        }}
      />
    );
  }
  render(<Harness />);
  expect(
    screen.queryByRole('button', { name: 'More' })
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: /Copy Share URL/ })
  ).not.toBeInTheDocument();
  fireEvent.change(
    screen.getByPlaceholderText(
      'Anything you want to remember when you revisit this round later.'
    ),
    { target: { value: 'Saved immediately without blur' } }
  );
  expect(accepted.workingCombats[0]?.state.rounds[0]?.summary).toBe(
    'Saved immediately without blur'
  );
  expect(screen.getAllByRole('columnheader', { name: 'Outcome' })).toHaveLength(
    2
  );
  fireEvent.click(
    screen.getByRole('button', { name: 'Review round', exact: true })
  );
  const combatDialog = within(
    screen.getByRole('dialog', { name: 'Review round' })
  );
  fireEvent.change(combatDialog.getByLabelText('Outcome'), {
    target: { value: 'Takes 3 damage before acting' },
  });
  expect(
    accepted.workingCombats[0]?.state.rounds[0]?.partyStates[0]?.result
  ).toBe('Takes 3 damage before acting');
  fireEvent.click(
    combatDialog.getByRole('button', { name: 'Close', exact: true })
  );
  fireEvent.click(
    screen.getByRole('button', { name: 'Review round', exact: true })
  );
  expect(
    within(screen.getByRole('dialog', { name: 'Review round' })).getByText(
      'Outcome recorded'
    )
  ).toBeInTheDocument();
  fireEvent.click(
    within(screen.getByRole('dialog', { name: 'Review round' })).getByRole(
      'button',
      {
        name: 'Close',
        exact: true,
      }
    )
  );
  fireEvent.click(screen.getByRole('button', { name: /^Backstab/ }));
  const dialog = within(screen.getByRole('dialog', { name: 'Edit Intention' }));
  fireEvent.change(dialog.getByLabelText('Action'), {
    target: { value: 'missile' },
  });
  fireEvent.click(dialog.getByRole('button', { name: 'Save intention' }));
  expect(
    accepted.workingCombats[0]?.state.rounds[0]?.actions?.some(
      (a) => a.declaredAction === 'missile'
    )
  ).toBe(true);
  fireEvent.click(screen.getByRole('button', { name: 'Edit Lodi' }));
  const roster = within(screen.getByRole('dialog'));
  fireEvent.change(roster.getByLabelText('Name'), {
    target: { value: 'Synthetic scout' },
  });
  fireEvent.change(roster.getByLabelText('Max HP'), {
    target: { value: '18' },
  });
  expect(accepted.workingCombats[0]?.state.rounds[0]?.party[0]?.name).toBe(
    'Synthetic scout'
  );
  expect(accepted.workingCombats[0]?.state.rounds[0]?.party[0]?.maxHp).toBe(
    '18'
  );
  fireEvent.keyDown(window, { key: 'Escape' });
  fireEvent.click(screen.getByRole('button', { name: 'Advance Round' }));
  expect(accepted.workingCombats[0]?.state.rounds).toHaveLength(2);
  expect(accepted.workingCombats[0]?.id).toBe('combat-working');
  expect(local).not.toHaveBeenCalled();
  expect(url).not.toHaveBeenCalled();
  fireEvent(window, new Event('pagehide'));
  expect(local).not.toHaveBeenCalled();
});

test('copying a profile opens a local draft and later rounds inherit the reviewed combat values', () => {
  jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
  const initial = createRegisterIntentionsFixtureState();
  let combat = initial;
  function Harness({ level }: { level: number }) {
    const [state, setState] = useState<TrackerState>(initial);
    return (
      <CombatTracker
        campaign={{
          active: true,
          state,
          partyProfiles: [
            {
              id: 'scout',
              name: 'Scout',
              player: '',
              combatValues: { class: CLERIC, level },
            },
            {
              id: 'veteran',
              name: 'Veteran',
              player: '',
              combatValues: { class: CLERIC, level },
            },
          ],
          onStateChange: (next) => {
            combat = next;
            setState(next);
          },
        }}
      />
    );
  }
  const { rerender } = render(<Harness level={7} />);
  const select = screen.getByRole('combobox', {
    name: 'Add from party/profile',
  });
  fireEvent.change(select, { target: { value: 'scout' } });
  let dialog = within(
    screen.getByRole('dialog', { name: 'Add Party Member from Profile' })
  );
  expect(dialog.getByText('Cleric')).toBeInTheDocument();
  expect(combat).toBe(initial);
  fireEvent.click(dialog.getByRole('button', { name: 'Cancel' }));
  expect(combat).toBe(initial);
  fireEvent.change(select, { target: { value: 'scout' } });
  dialog = within(
    screen.getByRole('dialog', { name: 'Add Party Member from Profile' })
  );
  expect(dialog.getByLabelText('Max HP')).toHaveValue('');
  fireEvent.change(dialog.getByLabelText('Max HP'), {
    target: { value: '11' },
  });
  fireEvent.click(dialog.getByRole('button', { name: 'Add party member' }));
  const copied = combat.rounds[0]?.party.at(-1);
  expect(copied).toMatchObject({
    name: 'Scout',
    class: CLERIC,
    level: 7,
    maxHp: '11',
  });
  expect(
    initial.rounds[0]?.party.some((actor) => actor.key === copied?.key)
  ).toBe(false);

  expect(
    screen.queryByRole('option', { name: /Scout/ })
  ).not.toBeInTheDocument();
  fireEvent.change(select, { target: { value: 'veteran' } });
  dialog = within(
    screen.getByRole('dialog', { name: 'Add Party Member from Profile' })
  );
  for (const [label, option] of [
    ['Class', 'Fighter'],
    ['Level', 'Level 4'],
  ] as const) {
    const control = dialog
      .getByRole('combobox', { name: label })
      .closest('[class*="-control"]');
    if (!control) throw new Error(`Missing ${label} control`);
    fireEvent.mouseDown(control);
    fireEvent.click(screen.getByText(option, { exact: true }));
  }
  fireEvent.change(dialog.getByLabelText('Name'), {
    target: { value: 'Scout' },
  });
  fireEvent.click(
    dialog.getByRole('button', { name: 'Add separate combatant' })
  );
  expect(combat.rounds[0]?.party.at(-1)?.key).not.toBe(copied?.key);
  expect(combat.rounds[0]?.party.at(-1)).toMatchObject({
    class: FIGHTER,
    level: 4,
  });

  const captured = combat;
  rerender(<Harness level={9} />);
  expect(combat).toBe(captured);
  fireEvent.click(screen.getByRole('button', { name: 'Advance Round' }));
  expect(combat.rounds[0]).toEqual(captured.rounds[0]);
  expect(combat.rounds[1]?.party.at(-2)?.level).toBe(7);
  expect(combat.rounds[1]?.party.at(-1)?.level).toBe(4);
});

test('imported names filter profile choices by selected round, and missing participants return after removal', () => {
  jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
  const full = addCombatant(
    addCombatant(createInitialTrackerState(), 'party', 7),
    'party',
    8
  );
  const names = [' Mira ', 'TAL', 'Oren', 'Nella', 'Voss'];
  const round = full.rounds[0];
  if (!round) throw new Error('Missing round');
  round.party = round.party.map((actor, index) => ({
    ...actor,
    name: names[index],
  }));
  const original = JSON.stringify(full);
  const profiles = ['mira', 'Tal', ' OREN ', 'Nella', 'Voss'].map(
    (name, index) => ({
      id: String(index),
      name,
      player: '',
    })
  );
  let accepted = full;
  const renderTracker = (state: TrackerState, choices = profiles) => (
    <CombatTracker
      campaign={{
        active: true,
        state,
        partyProfiles: choices,
        onStateChange: (next) => {
          accepted = next;
        },
      }}
    />
  );
  const { rerender } = render(renderTracker(full));
  expect(
    screen.queryByRole('combobox', { name: 'Add from party/profile' })
  ).not.toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: 'Add Party Member', exact: true })
  ).toBeEnabled();

  const partial = removeCombatant(full, 'party', 4);
  rerender(renderTracker(partial));
  const picker = screen.getByRole('combobox', {
    name: 'Add from party/profile',
  });
  expect(
    within(picker)
      .getAllByRole('option')
      .map((option) => option.textContent)
  ).toEqual(['Add from party/profile…', '1. Voss']);
  fireEvent.change(picker, { target: { value: '4' } });
  fireEvent.click(
    within(
      screen.getByRole('dialog', { name: 'Add Party Member from Profile' })
    ).getByRole('button', { name: 'Add party member' })
  );
  rerender(renderTracker(accepted));
  expect(
    screen.queryByRole('combobox', { name: 'Add from party/profile' })
  ).not.toBeInTheDocument();

  const later = removeCombatant(insertRoundAfterActive(accepted), 'party', 4);
  rerender(renderTracker(later));
  expect(screen.getByRole('option', { name: '1. Voss' })).toBeInTheDocument();
  rerender(renderTracker({ ...later, activeRound: 0 }));
  expect(
    screen.queryByRole('combobox', { name: 'Add from party/profile' })
  ).not.toBeInTheDocument();
  rerender(
    renderTracker(full, [
      ...profiles,
      { id: 'distinct', name: 'Mira Vale', player: '' },
    ])
  );
  expect(
    screen.getByRole('option', { name: '1. Mira Vale' })
  ).toBeInTheDocument();
  expect(JSON.stringify(full)).toBe(original);
});

test('a participant added while a profile draft is open requires deliberate duplicate confirmation', () => {
  jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
  const state = createInitialTrackerState();
  const onChange = jest.fn<void, [TrackerState]>();
  const renderTracker = (current: TrackerState) => (
    <CombatTracker
      campaign={{
        active: true,
        state: current,
        partyProfiles: [{ id: 'scout', name: 'Scout', player: '' }],
        onStateChange: onChange,
      }}
    />
  );
  const { rerender } = render(renderTracker(state));
  fireEvent.change(
    screen.getByRole('combobox', { name: 'Add from party/profile' }),
    { target: { value: 'scout' } }
  );
  const changed = addCombatant(state, 'party', 7);
  const actor = changed.rounds[0]?.party.at(-1);
  if (!actor) throw new Error('Missing actor');
  actor.name = ' SCOUT ';
  rerender(renderTracker(changed));
  const dialog = within(
    screen.getByRole('dialog', { name: 'Add Party Member from Profile' })
  );
  expect(
    dialog.queryByRole('button', { name: 'Add party member', exact: true })
  ).not.toBeInTheDocument();
  expect(
    dialog.getByText('This round already has a party member with this name.')
  ).toBeInTheDocument();
  expect(onChange).not.toHaveBeenCalled();
  fireEvent.click(
    dialog.getByRole('button', { name: 'Add separate combatant' })
  );
  expect(onChange).toHaveBeenCalledTimes(1);
  const accepted = onChange.mock.calls[0]?.[0];
  expect(accepted?.rounds[0]?.party).toHaveLength(5);
  expect(accepted?.rounds[0]?.party.at(-1)?.key).not.toBe(7);
});
