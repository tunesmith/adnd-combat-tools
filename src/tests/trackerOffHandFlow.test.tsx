/** @jest-environment jsdom */
import { fireEvent, render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import CombatTracker from '../components/tracker/CombatTracker';
import { createRegisterIntentionsFixtureState } from './support/trackerFixtures';
import { FIGHTER } from '../tables/attackerClass';

afterEach(() => jest.restoreAllMocks());

test.each(['party', 'enemy'] as const)(
  '%s hand-specific steps show their own base to-hit, details and Result',
  (side) => {
    jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    const state = createRegisterIntentionsFixtureState();
    const round = state.rounds[0];
    const actor = side === 'party' ? round?.party[0] : round?.enemies[0];
    const foe = side === 'party' ? round?.enemies[0] : round?.party[0];
    if (!round || !actor || !foe) throw Error('Missing combatants');
    Object.assign(actor, {
      class: FIGHTER,
      level: 1,
      name: 'Fighter',
      weapon: 56,
      offHandWeapon: 17,
      attacksPerRoutine: 2,
    });
    Object.assign(foe, {
      name: 'Guard',
      weapon: 56,
      armorType: 20,
      armorClass: 3,
    });
    render(<CombatTracker rememberedState={state} />);
    const flow = within(screen.getByRole('region', { name: 'Combat Flow' }));
    const main = screen.getByRole('button', {
      name: /^Fighter, target Guard, .*Main hand/,
    });
    const off = screen.getByRole('button', {
      name: /^Fighter, target Guard, .*Off-hand/,
    });
    fireEvent.click(main);
    const mainRoll = flow.getByRole('button', {
      name: `Show ${side} main-hand attack details`,
    });
    expect(mainRoll).toHaveTextContent('18');
    expect(
      flow.queryByRole('button', { name: /off-hand attack details/ })
    ).toBeNull();
    fireEvent.change(flow.getByLabelText('Result', { exact: true }), {
      target: { value: 'Sword missed' },
    });
    fireEvent.click(off);
    expect(flow.getByLabelText('Result', { exact: true })).toHaveValue('');
    expect(
      flow.queryByRole('button', { name: /main-hand attack details/ })
    ).toBeNull();
    const offRoll = flow.getByRole('button', {
      name: `Show ${side} off-hand attack details`,
    });
    expect(offRoll).toHaveTextContent('20');
    fireEvent.click(offRoll);
    const detail = within(
      screen.getByRole('dialog', { name: 'Attack Detail' })
    );
    expect(detail.getByText('Dagger (Held)')).toBeInTheDocument();
    expect(detail.getByText(/Base to hit: 20\+ on d20/)).toBeInTheDocument();
    fireEvent.click(detail.getByRole('button', { name: 'Close' }));
    fireEvent.change(flow.getByLabelText('Result', { exact: true }), {
      target: { value: 'Dagger hit' },
    });
    fireEvent.click(main);
    expect(flow.getByLabelText('Result', { exact: true })).toHaveValue(
      'Sword missed'
    );
  }
);
