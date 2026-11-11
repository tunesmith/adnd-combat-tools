/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { useState } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import ProfileDialog from '../components/desktop/ProfileDialog';
import CampaignXp from '../components/desktop/CampaignXp';
import SessionXpReference from '../components/desktop/SessionXpReference';
import {
  multiclassCampaign,
  multiMoneyAward,
  multiCharacter,
} from './fixtures/multiclassCampaign';
import { profileLabel, profilesInSession } from '../helpers/campaignParty';
import {
  parseCampaign,
  serializeCampaign,
  validateHistoryTransition,
} from '../helpers/campaignDocument';
const required = <T,>(v: T | undefined): T => {
  if (v === undefined) throw Error('Fixture');
  return v;
};
beforeEach(() => {
  let id = 0;
  Object.defineProperty(window, 'crypto', {
    configurable: true,
    value: { randomUUID: () => `multi-ui-${++id}` },
  });
});
test('profile modal edits independent classes and a single HP value; Cancel and Escape discard edits', () => {
  let current = multiclassCampaign();
  let closed = 0;
  const p = required(
    current.party?.profiles.find(
      (p) => p.characterId === multiCharacter && p.sessionId === 'session-1'
    )
  );
  const character = required(
    current.party?.roster.find((c) => c.id === multiCharacter)
  );
  const props = {
    document: current,
    profile: p,
    character,
    onChange: (change: (doc: typeof current) => typeof current) => {
      const next = parseCampaign(serializeCampaign(change(current)));
      validateHistoryTransition(current, next, '');
      current = next;
      return true;
    },
    onClose: () => {
      closed++;
    },
  };
  const view = render(<ProfileDialog {...props} />);
  expect(screen.getByLabelText('Max HP')).toHaveValue(6);
  expect(screen.getByLabelText('Combat basis')).toHaveValue('multi-fighter');
  fireEvent.change(screen.getByLabelText('Thief trained level'), {
    target: { value: '2' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Cancel', exact: true }));
  expect(closed).toBe(1);
  expect(profileLabel(p)).toBe('Fighter 1 / Thief 1');
  view.unmount();
  const again = render(<ProfileDialog {...props} />);
  fireEvent.change(screen.getByLabelText('Thief trained level'), {
    target: { value: '2' },
  });
  fireEvent.change(screen.getByLabelText('Thief XP bonus'), {
    target: { value: '0' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Save profile' }));
  const saved = required(
    current.party?.profiles.find(
      (v) => v.characterId === multiCharacter && v.sessionId === 'session-1'
    )
  );
  expect(profileLabel(saved)).toBe('Fighter 1 / Thief 2');
  expect(saved.reference?.maxHp).toBe(6);
  expect(saved.classes?.map((c) => c.xpPercent)).toEqual([10, 0]);
  expect(
    current.party?.profiles.find(
      (v) => v.characterId === multiCharacter && v.sessionId === 'session-2'
    )?.classes?.[1]?.baseLevel
  ).toBe(1);
  again.unmount();
  render(<ProfileDialog {...props} profile={saved} document={current} />);
  fireEvent.change(screen.getByLabelText('Max HP'), {
    target: { value: '99' },
  });
  fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
  expect(closed).toBe(3);
  expect(saved.reference?.maxHp).toBe(6);
});
test('live award shows separate class results immediately, edits bonus/cap, cancels scenarios and confirms matching preview', () => {
  let current = multiMoneyAward(multiclassCampaign(1990, 1100), 'first', '100');
  function Harness() {
    const [doc, setDoc] = useState(current);
    return (
      <CampaignXp
        document={doc}
        sessionId="session-1"
        onConfirmExtension={async () => undefined}
        onChange={(change) => {
          const next = parseCampaign(serializeCampaign(change(doc)));
          validateHistoryTransition(doc, next, '');
          current = next;
          setDoc(next);
          return true;
        }}
      />
    );
  }
  render(<Harness />);
  fireEvent.click(
    screen.getByRole('button', { name: /Synthetic first settlement Draft/ })
  );
  const cell = (label: string) =>
    within(screen.getByRole('table', { name: 'XP award' }))
      .getByRole('row', { name: new RegExp(`^${label}`) })
      .querySelector('td');
  expect(cell('Full award')).toHaveTextContent('Fighter55Thief55');
  expect(cell('XP added')).toHaveTextContent('Fighter11Thief55');
  expect(cell('Discarded')).toHaveTextContent('Fighter44Thief0');
  expect(cell('XP to cap')).toHaveTextContent('Fighter0Thief96');
  fireEvent.click(
    screen.getByRole('button', { name: 'Review Kramrak Smugward Thief bonus' })
  );
  const editor = within(
    screen.getByRole('dialog', { name: 'Class XP review' })
  );
  fireEvent.change(editor.getByLabelText('Thief award bonus %'), {
    target: { value: '0' },
  });
  fireEvent.click(editor.getByRole('button', { name: 'Apply' }));
  expect(cell('XP added')).toHaveTextContent('Fighter11Thief50');
  fireEvent.keyDown(screen.getByRole('dialog', { name: 'XP award' }), {
    key: 'Escape',
  });
  expect(current.xp?.events).toHaveLength(0);
  fireEvent.click(
    screen.getByRole('button', { name: /Synthetic first settlement Draft/ })
  );
  expect(cell('XP added')).toHaveTextContent('Fighter11Thief55');
  fireEvent.click(screen.getByRole('button', { name: 'Confirm award' }));
  expect(current.xp?.events[0]?.rows[0]?.classes?.map((c) => c.award)).toEqual([
    11, 55,
  ]);
  expect(parseCampaign(serializeCampaign(current)).xp?.events).toEqual(
    current.xp?.events
  );
});
test('opening dialog keeps class unknowns, offers explicit zeros, and Session XP uses compact class subrows', () => {
  let current = multiclassCampaign(null, null);
  function Harness() {
    const [doc, setDoc] = useState(current);
    return (
      <CampaignXp
        document={doc}
        sessionId="session-1"
        onConfirmExtension={async () => undefined}
        onChange={(change) => {
          current = parseCampaign(serializeCampaign(change(doc)));
          setDoc(current);
          return true;
        }}
      />
    );
  }
  const view = render(<Harness />);
  fireEvent.click(screen.getByRole('button', { name: 'Opening balances' }));
  expect(
    screen.getByLabelText('Kramrak Smugward Fighter opening XP')
  ).toHaveValue(null);
  fireEvent.click(
    screen.getByRole('button', { name: 'Set listed unlocked balances to 0' })
  );
  expect(
    screen.getByLabelText('Kramrak Smugward Fighter opening XP')
  ).toHaveValue(0);
  expect(
    screen.getByLabelText('Kramrak Smugward Thief opening XP')
  ).toHaveValue(0);
  fireEvent.click(
    screen.getByRole('button', { name: 'Save opening balances' })
  );
  expect(current.xp?.openings[0]?.classes?.map((c) => c.balance)).toEqual([
    0, 0,
  ]);
  view.unmount();
  render(
    <SessionXpReference
      document={current}
      sessionId="session-1"
      profiles={profilesInSession(current, 'session-1')}
    />
  );
  const table = within(
    screen.getByRole('table', { name: 'Session XP reference' })
  );
  expect(
    table.getAllByRole('cell', { name: 'Fighter', exact: true })[0]
  ).toBeInTheDocument();
  expect(
    table.getByRole('cell', { name: 'Thief', exact: true })
  ).toBeInTheDocument();
  expect(
    table.getByRole('columnheader', { name: 'Opening XP' })
  ).toBeInTheDocument();
});
