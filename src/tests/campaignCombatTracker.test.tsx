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
import baseline from './fixtures/campaignB1V2.json';
import type { CampaignDocument } from '../helpers/campaignDocument';
import type { TrackerState } from '../types/tracker';
import { CLERIC, FIGHTER } from '../tables/attackerClass';

afterEach(() => jest.restoreAllMocks());
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

  fireEvent.change(select, { target: { value: 'scout' } });
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
