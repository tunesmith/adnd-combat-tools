/** @jest-environment jsdom */
import { useState } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import CombatTracker from '../components/tracker/CombatTracker';
import { getTrackerActionDeclarations } from '../helpers/trackerActionDeclarations';
import {
  compactTrackerState,
  transformTrackerState,
} from '../helpers/trackerCodec';
import { createRegisterIntentionsFixtureState } from './support/trackerFixtures';
import type { TrackerState } from '../types/tracker';

beforeEach(() =>
  jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
);
afterEach(() => jest.restoreAllMocks());

test('old grid-only declarations can be browsed from either side without rewriting the round', () => {
  const state = createRegisterIntentionsFixtureState(),
    changed = jest.fn();
  render(
    <CombatTracker campaign={{ state, active: true, onStateChange: changed }} />
  );
  fireEvent.click(screen.getByRole('button', { name: 'Declare Intentions' }));
  const dialog = within(
    screen.getByRole('dialog', { name: 'Declare Intentions' })
  );
  expect(
    dialog.getByRole('radio', { name: 'Open melee', exact: true })
  ).toBeChecked();
  expect(dialog.getByLabelText('Intention')).toHaveValue('Attack Lodi');
  expect(dialog.getByRole('checkbox', { name: 'Lodi' })).toBeDisabled();
  expect(
    dialog.queryByText(
      /Next round|Actions using this target|Grid entry|to hit/i
    )
  ).toBeNull();
  fireEvent.change(dialog.getByLabelText('Go to combatant'), {
    target: { value: '3' },
  });
  expect(dialog.getByLabelText('Intention')).toHaveValue('Backstab');
  expect(dialog.getByRole('checkbox', { name: 'Pillar Gnoll' })).toBeChecked();
  fireEvent.click(dialog.getByRole('button', { name: 'Close' }));
  expect(changed).not.toHaveBeenCalled();
});

test('editing shared targets preserves historical shorthand, explicit-only memberships and the opposite direction across save/reopen', () => {
  const initial = createRegisterIntentionsFixtureState();
  const round = initial.rounds[0],
    cell = round?.cells[0]?.[0];
  if (!round || !cell) throw Error('Missing fixture');
  const main = getTrackerActionDeclarations(round).find(
    (a) => a.side === 'enemy'
  );
  if (!main) throw Error('Missing gnoll attack');
  round.actions = [
    main,
    {
      ...main,
      id: 'device',
      declaredAction: 'magical-device',
      actionLabel: 'Wand',
      targetDeclarations: [
        {
          targetCombatantKey: 2,
          targetCombatantIndex: 1,
          cellRowIndex: 0,
          cellColumnIndex: 1,
          cellResultText: '',
        },
      ],
    },
  ];
  cell.enemyToPartyActionIds = [main.id];
  let saved = transformTrackerState(compactTrackerState(initial));
  function Harness() {
    const [state, set] = useState(saved);
    return (
      <CombatTracker
        campaign={{
          state,
          active: true,
          onStateChange: (next: TrackerState) => {
            saved = transformTrackerState(compactTrackerState(next));
            set(saved);
            return true;
          },
        }}
      />
    );
  }
  render(<Harness />);
  fireEvent.click(screen.getByRole('button', { name: 'Declare Intentions' }));
  const dialog = within(
    screen.getByRole('dialog', { name: 'Declare Intentions' })
  );
  const checkbox = (name: string) => dialog.getByRole('checkbox', { name });
  expect(checkbox('Azalia')).toBeChecked();
  fireEvent.click(dialog.getByTestId('intentions-wizard-action-tab-1'));
  fireEvent.change(dialog.getByLabelText('Device or label'), {
    target: { value: 'Wand of light' },
  });
  expect(checkbox('Azalia')).toBeChecked();
  fireEvent.click(checkbox('Party 3'));
  const assignments = dialog.getAllByRole('group', {
    name: 'Actions using this target',
  });
  const thirdAssignment = assignments[2];
  if (!thirdAssignment) throw Error('Missing third target');
  const newTarget = within(thirdAssignment);
  expect(newTarget.getByRole('checkbox', { name: /Main/ })).toBeChecked();
  fireEvent.click(newTarget.getByRole('checkbox', { name: /Main/ }));
  expect(newTarget.getByRole('checkbox', { name: /Action 2/ })).toBeDisabled();
  fireEvent.click(checkbox('Azalia'));
  const reopened = saved.rounds[0];
  if (!reopened) throw Error('Missing reopened round');
  expect(
    getTrackerActionDeclarations(reopened)
      .filter((a) => a.side === 'enemy')
      .map((a) => a.targetDeclarations.map((t) => t.targetCombatantKey))
  ).toEqual([[1], [3]]);
  expect(reopened.cells[0]?.[0]).toMatchObject({
    enemyToParty: 'x',
    partyToEnemy: 'x',
    partyToEnemyVisible: true,
  });
  expect(reopened.cells[0]?.[2]?.enemyToPartyActionIds).toEqual(['device']);
  fireEvent.click(checkbox('Party 3'));
  const finalRound = saved.rounds[0];
  if (!finalRound) throw Error('Missing round');
  expect(
    getTrackerActionDeclarations(finalRound).find((a) => a.id === 'device')
      ?.targetDeclarations
  ).toEqual([]);
});

test('mode-specific inputs stay available in the compact wizard', () => {
  const state = createRegisterIntentionsFixtureState(),
    actor = state.rounds[0]?.enemies[0];
  if (!actor) throw Error('Missing actor');
  actor.weapon = 50;
  actor.weaponShortlist = [50, 12];
  render(<CombatTracker rememberedState={state} />);
  fireEvent.click(screen.getByRole('button', { name: 'Declare Intentions' }));
  const d = within(screen.getByRole('dialog', { name: 'Declare Intentions' }));
  const mode = (m: string) =>
    fireEvent.click(d.getByRole('radio', { name: m, exact: true }));
  expect(d.getAllByRole('radio')).toHaveLength(9);
  mode('Move/Close');
  expect(d.getByText('Incomplete declaration')).toBeVisible();
  expect(d.getByRole('button', { name: 'Next' })).toBeDisabled();
  fireEvent.change(d.getByLabelText('Distance', { exact: true }), {
    target: { value: '4' },
  });
  expect(d.getByRole('button', { name: 'Next' })).toBeEnabled();
  mode('Charge');
  expect(d.getByLabelText('Charge distance')).toHaveValue(4);
  mode('Cast spell');
  fireEvent.change(d.getByLabelText('Spell or label'), {
    target: { value: 'Silence' },
  });
  fireEvent.change(d.getByLabelText('Casting time'), {
    target: { value: '0' },
  });
  expect(d.getByLabelText('Casting time')).toHaveValue('0');
  mode('Magical device');
  expect(d.getByLabelText('Device or label')).toBeVisible();
  expect(d.getByLabelText('Activation time')).toHaveValue('');
  fireEvent.change(d.getByLabelText('Activation time'), {
    target: { value: '10' },
  });
  mode('Turn undead');
  expect(d.queryByLabelText('Attack routines this round')).toBeNull();
  mode('Missile');
  expect(d.getByRole('status')).toHaveTextContent('mismatch');
  mode('Set vs charge');
  fireEvent.click(d.getByRole('button', { name: 'Bow, short' }));
  expect(d.getByRole('radio', { name: 'No combat action' })).toBeChecked();
  expect(d.queryByRole('radio', { name: 'Set vs charge' })).toBeNull();
  expect(d.queryByRole('checkbox')).toBeNull();
  fireEvent.click(d.getByRole('button', { name: 'Add action' }));
  mode('Open melee');
  expect(d.getByRole('status')).toHaveTextContent('mismatch');
  fireEvent.click(d.getByRole('button', { name: 'Remove action' }));
  expect(d.queryByRole('button', { name: 'Remove action' })).toBeNull();
  fireEvent.change(d.getByLabelText('Go to combatant'), {
    target: { value: '5' },
  });
  fireEvent.click(d.getByRole('button', { name: 'Done' }));
  expect(screen.queryByRole('dialog')).toBeNull();
});

test('the footer follows an unlabeled live target before initiative, and distinguishes a recorded decision to do nothing', () => {
  const state = createRegisterIntentionsFixtureState();
  const round = state.rounds[0];
  if (!round?.enemyStates[0]) throw Error('Missing enemy');
  round.enemyStates[0].action = '';
  round.partyInitiative = '';
  round.enemyInitiative = '';
  render(<CombatTracker rememberedState={state} />);
  fireEvent.click(screen.getByRole('button', { name: 'Declare Intentions' }));
  const dialog = within(
    screen.getByRole('dialog', { name: 'Declare Intentions' })
  );
  expect(dialog.getByLabelText('Intention')).toHaveValue('');
  expect(dialog.getByText('Declared')).toBeVisible();
  fireEvent.click(dialog.getByRole('radio', { name: 'No combat action' }));
  expect(
    dialog.getByText('No combat action', { selector: 'span' })
  ).toBeVisible();
});

test('a named shriek is declared while its action type stays No combat action', () => {
  const state = createRegisterIntentionsFixtureState();
  const round = state.rounds[0];
  if (!round) throw Error('Missing round');
  const enemy = getTrackerActionDeclarations(round).find(
    (a) => a.side === 'enemy'
  );
  if (!enemy) throw Error('Missing enemy');
  round.actions = [
    {
      ...enemy,
      declaredAction: 'none',
      source: 'intention',
      actionLabel: 'shriek',
      intention: 'shriek',
      usesGridTargets: false,
      targetDeclarations: [],
    },
  ];
  render(<CombatTracker rememberedState={state} />);
  expect(
    screen.getByRole('button', { name: /Pillar Gnoll, target .*, shriek/i })
  ).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Declare Intentions' }));
  const dialog = within(
    screen.getByRole('dialog', { name: 'Declare Intentions' })
  );
  expect(dialog.getByRole('radio', { name: 'No combat action' })).toBeChecked();
  expect(dialog.getByLabelText('Intention')).toHaveValue('shriek');
  expect(dialog.getByText('Declared')).toBeVisible();
  fireEvent.change(dialog.getByLabelText('Go to combatant'), {
    target: { value: '1' },
  });
  expect(dialog.getByText('Undeclared')).toBeVisible();
});
