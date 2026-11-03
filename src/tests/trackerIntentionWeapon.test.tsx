/** @jest-environment jsdom */
import { fireEvent, render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { getWeaponInfo } from '../tables/weapon';
import CombatTracker from '../components/tracker/CombatTracker';
import { createRegisterIntentionsFixtureState } from './support/trackerFixtures';

describe('intention weapon selection', () => {
  beforeEach(() => {
    jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    window.localStorage.clear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('saves weapon corrections with the intention and discards cancelled changes', () => {
    render(
      <CombatTracker
        rememberedState={createRegisterIntentionsFixtureState()}
        loadedFromEncodedState
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /^Backstab/ }));
    let dialog = within(screen.getByRole('dialog', { name: 'Edit Intention' }));
    expect(
      dialog.getByRole('button', { name: getWeaponInfo(17)?.name })
    ).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(
      dialog.getByRole('button', { name: getWeaponInfo(18)?.name })
    );
    fireEvent.click(dialog.getByRole('button', { name: 'Cancel' }));

    fireEvent.click(screen.getByRole('button', { name: /^Backstab/ }));
    dialog = within(screen.getByRole('dialog', { name: 'Edit Intention' }));
    expect(
      dialog.getByRole('button', { name: getWeaponInfo(17)?.name })
    ).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(
      dialog.getByRole('button', { name: getWeaponInfo(18)?.name })
    );
    fireEvent.change(dialog.getByLabelText('Action'), {
      target: { value: 'open-melee' },
    });
    expect(dialog.getByRole('status')).toHaveTextContent(
      'Weapon/action mismatch'
    );
    fireEvent.click(dialog.getByRole('button', { name: 'Save intention' }));

    fireEvent.click(screen.getByRole('button', { name: /^Backstab/ }));
    dialog = within(screen.getByRole('dialog', { name: 'Edit Intention' }));
    expect(
      dialog.getByRole('button', { name: getWeaponInfo(18)?.name })
    ).toHaveAttribute('aria-pressed', 'true');
    fireEvent.change(dialog.getByLabelText('Action'), {
      target: { value: 'missile' },
    });
    expect(dialog.getByRole('status')).toBeEmptyDOMElement();
    fireEvent.click(
      dialog.getByRole('button', { name: getWeaponInfo(17)?.name })
    );
    expect(dialog.getByRole('status')).toHaveTextContent(
      'not a missile weapon'
    );
  });

  test('offers a labeled weapon shortlist while registering intentions', () => {
    render(
      <CombatTracker
        rememberedState={createRegisterIntentionsFixtureState()}
        loadedFromEncodedState
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Declare Intentions' }));
    const dialog = within(screen.getByRole('dialog'));
    const weapons = within(
      dialog.getByRole('group', { name: 'Weapon for this round' })
    );
    expect(weapons.queryByRole('combobox')).not.toBeInTheDocument();
    expect(
      weapons.getByRole('button', { name: getWeaponInfo(1)?.name })
    ).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(
      dialog.getByRole('radio', { name: 'Missile', exact: true })
    );
    expect(dialog.getByRole('status')).toHaveTextContent(
      'not a missile weapon'
    );
    fireEvent.click(
      dialog.getByRole('radio', { name: 'Open melee', exact: true })
    );
    expect(dialog.getByRole('status')).toBeEmptyDOMElement();
  });
});
