/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { useState } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import CombatTracker from '../components/tracker/CombatTracker';
import { getTrackerActionDeclarations } from '../helpers/trackerActionDeclarations';
import {
  compactTrackerState,
  transformTrackerState,
} from '../helpers/trackerCodec';
import { resolveTrackerRoundInitiative } from '../helpers/initiative/trackerRoundResolution';
import { createRegisterIntentionsFixtureState } from './support/trackerFixtures';
import type { TrackerState } from '../types/tracker';

beforeEach(() =>
  jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
);
afterEach(() => jest.restoreAllMocks());

function setup(initial: TrackerState) {
  let saved = initial;
  function Harness() {
    const [state, update] = useState(saved);
    return (
      <CombatTracker
        campaign={{
          active: true,
          state,
          onStateChange: (next) => {
            saved = transformTrackerState(compactTrackerState(next));
            update(saved);
            return true;
          },
        }}
      />
    );
  }
  render(<Harness />);
  return () => {
    const round = saved.rounds[0];
    if (!round) throw Error('Missing saved round');
    return round;
  };
}
function declare() {
  fireEvent.click(screen.getByRole('button', { name: 'Declare Intentions' }));
  return within(screen.getByRole('dialog', { name: 'Declare Intentions' }));
}

test('narrative targets can be kept or cleared independently of handwritten and incoming attacks', () => {
  const initial = createRegisterIntentionsFixtureState();
  const saved = setup(initial),
    d = declare();
  const target = d.getByRole('checkbox', { name: 'Lodi', exact: true });
  expect(target).toBeChecked();
  fireEvent.click(d.getByRole('radio', { name: 'No combat action' }));
  expect(target).toBeChecked();
  expect(target).toBeEnabled();
  fireEvent.change(d.getByLabelText('Intention'), {
    target: { value: 'Warn Lodi' },
  });
  const graph = () => resolveTrackerRoundInitiative(saved());
  const old = graph();
  expect(old.scenario.enemies[0]?.targetIds).toEqual([]);
  expect(
    old.attackGraph.nodes.filter(
      (n) => n.combatantId === old.scenario.enemies[0]?.id
    )
  ).toHaveLength(1);
  fireEvent.click(target);
  expect(target).not.toBeChecked();
  expect(saved().cells[0]?.[0]).toMatchObject({
    enemyToParty: 'x',
    partyToEnemy: 'x',
    partyToEnemyVisible: true,
  });
  const targets = () =>
    getTrackerActionDeclarations(saved())
      .filter((a) => a.side === 'enemy')
      .flatMap((a) => a.targetDeclarations.map((t) => t.targetCombatantKey));
  expect(targets()).toEqual([]);
  expect(graph().attackGraph).toEqual(old.attackGraph);
  fireEvent.click(target);
  expect(targets()).toEqual([1]);
  expect(graph().attackGraph).toEqual(old.attackGraph);
  fireEvent.change(d.getByLabelText('Intention'), { target: { value: '' } });
  expect(target).toBeChecked();
  expect(
    graph().attackGraph.nodes.filter(
      (n) => n.combatantId === old.scenario.enemies[0]?.id
    )
  ).toHaveLength(0);
  // Checking a target on an untouched actor must not infer a melee attack.
  fireEvent.change(d.getByLabelText('Go to combatant'), {
    target: { value: '1' },
  });
  fireEvent.click(d.getByRole('checkbox', { name: 'Lodi', exact: true }));
  const untouched = graph().scenario.enemies.find((a) => a.index === 1);
  expect(untouched?.declaredAction).toBe('none');
  expect(untouched?.targetIds).toEqual([]);
  expect(
    graph().attackGraph.nodes.some((n) => n.combatantId === untouched?.id)
  ).toBe(false);
});

test('a new device starts empty; a shared target, per-action correction and a reopened device retain their effective owners', () => {
  const initial = createRegisterIntentionsFixtureState(),
    saved = setup(initial),
    d = declare();
  fireEvent.change(d.getByLabelText('Go to combatant'), {
    target: { value: '3' },
  });
  fireEvent.click(d.getByRole('button', { name: 'Add action' }));
  fireEvent.click(d.getByRole('radio', { name: 'Magical device' }));
  fireEvent.change(d.getByLabelText('Device or label'), {
    target: { value: 'Heat Metal' },
  });
  const ids = () =>
    getTrackerActionDeclarations(saved())
      .filter((a) => a.side === 'party' && a.combatantIndex === 0)
      .map((a) => a.targetDeclarations.map((t) => t.targetCombatantKey));
  expect(ids()).toEqual([[4], []]);
  const owners = () => {
    const group = within(
      screen.getByRole('dialog', { name: 'Declare Intentions' })
    ).getAllByRole('group', { name: 'Actions using this target' })[0];
    if (!group) throw Error('Missing target owners');
    return within(group);
  };
  expect(owners().getByRole('checkbox', { name: /Main/ })).toBeChecked();
  expect(
    owners().getByRole('checkbox', { name: /Action 2/ })
  ).not.toBeChecked();
  fireEvent.click(d.getByRole('checkbox', { name: 'Enemy 2', exact: true }));
  fireEvent.click(d.getByRole('checkbox', { name: 'Enemy 3', exact: true }));
  fireEvent.click(owners().getByRole('checkbox', { name: /Action 2/ }));
  expect(ids()).toEqual([[4], [4, 5, 6]]);
  fireEvent.click(owners().getByRole('checkbox', { name: /Action 2/ }));
  expect(ids()).toEqual([[4], [5, 6]]);
  fireEvent.click(d.getByRole('button', { name: 'Close', exact: true }));
  const reopened = declare();
  fireEvent.click(reopened.getByTestId('intentions-wizard-action-tab-1'));
  expect(reopened.getByLabelText('Device or label')).toHaveValue('Heat Metal');
  expect(ids()).toEqual([[4], [5, 6]]);
  const actors = resolveTrackerRoundInitiative(saved()).scenario.party.filter(
    (a) => a.ownerCombatantKey === 1
  );
  expect(actors.map((a) => a.targetIds)).toEqual([
    ['enemy-4'],
    ['enemy-5', 'enemy-6'],
  ]);
  // Switching the main to narrative and clearing its shared target leaves the device attached.
  fireEvent.click(owners().getByRole('checkbox', { name: /Action 2/ }));
  fireEvent.click(reopened.getByTestId('intentions-wizard-action-tab-0'));
  fireEvent.click(reopened.getByRole('radio', { name: 'No combat action' }));
  fireEvent.click(
    reopened.getByRole('checkbox', { name: 'Pillar Gnoll', exact: true })
  );
  expect(ids()).toEqual([[], [4, 5, 6]]);
});

test('Selected Action shows the owner HP and initializes Related results only when selecting a step', () => {
  const initial = createRegisterIntentionsFixtureState(),
    r = initial.rounds[0];
  if (!r?.party[0] || !r.partyStates[0]) throw Error('Fixture');
  r.party[0].weapon = 11;
  r.party[0].maxHp = '7';
  r.partyStates[0].hp = '4-7=dead!';
  setup(initial);
  const flow = within(screen.getByRole('region', { name: 'Combat Flow' }));
  fireEvent.click(flow.getByRole('button', { name: 'Select next ready' }));
  expect(flow.getByText('HP 4-7=dead! · max 7')).toBeVisible();
  const disclosure = () =>
    flow.getByText(/^Related results/).closest('details');
  expect(disclosure()).not.toHaveAttribute('open');
  fireEvent.change(flow.getByLabelText('Grid mark'), {
    target: { value: 'x' },
  });
  expect(disclosure()).not.toHaveAttribute('open');
  fireEvent.click(flow.getByRole('button', { name: 'Resolve and next' }));
  expect(disclosure()).toHaveAttribute('open');
  fireEvent.click(flow.getByText(/^Related results/));
  fireEvent.change(flow.getByLabelText('Detail (optional)'), {
    target: { value: 'A second shot' },
  });
  expect(disclosure()).not.toHaveAttribute('open');
});

test('adding a third declaration freezes the existing wildcard owners without changing an older device', () => {
  const state = createRegisterIntentionsFixtureState(),
    r = state.rounds[0];
  if (!r) throw Error('Round');
  const main = getTrackerActionDeclarations(r).find((a) => a.side === 'party');
  if (!main) throw Error('Main');
  r.actions = [
    { ...main, targetDeclarations: [] },
    {
      ...main,
      id: 'previous-device',
      declaredAction: 'magical-device',
      actionLabel: 'Wand',
      targetDeclarations: [],
    },
  ];
  const saved = setup(state),
    d = declare();
  fireEvent.change(d.getByLabelText('Go to combatant'), {
    target: { value: '3' },
  });
  const ids = () =>
    getTrackerActionDeclarations(saved())
      .filter((a) => a.side === 'party' && a.combatantIndex === 0)
      .map((a) => a.targetDeclarations.map((t) => t.targetCombatantKey));
  expect(ids()).toEqual([[4], [4]]);
  fireEvent.click(d.getByRole('button', { name: 'Add action' }));
  fireEvent.click(d.getByRole('radio', { name: 'Magical device' }));
  expect(ids()).toEqual([[4], [4], []]);
});
