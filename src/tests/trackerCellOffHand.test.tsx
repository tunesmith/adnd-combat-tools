/** @jest-environment jsdom */
import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import TrackerCell from '../components/tracker/TrackerCell';
import { FIGHTER } from '../tables/attackerClass';
import type { TrackerCombatant } from '../types/tracker';

test('shows off-hand attack details only when the selected weapon supports melee', () => {
  const combatant: TrackerCombatant = {
    key: 1,
    name: 'Lodi',
    class: FIGHTER,
    level: 7,
    armorType: 2,
    armorClass: -1,
    weapon: 48,
    offHandWeapon: 17,
  };
  const props = {
    rowCombatant: combatant,
    columnCombatant: { ...combatant, key: 2 },
    enemyToPartyValue: '',
    partyToEnemyValue: '',
    enemyToPartyVisible: true,
    partyToEnemyVisible: true,
    onEnemyToPartyVisibilityChange: jest.fn(),
    onPartyToEnemyVisibilityChange: jest.fn(),
    onEnemyToPartyChange: jest.fn(),
    onPartyToEnemyChange: jest.fn(),
    onAttackDetailOpen: jest.fn(),
  };
  const { rerender } = render(<TrackerCell {...props} />, {
    wrapper: ({ children }: { children?: ReactNode }) => (
      <table>
        <tbody>
          <tr>{children}</tr>
        </tbody>
      </table>
    ),
  });
  expect(
    screen.queryAllByRole('button', { name: /off-hand attack details/ })
  ).toHaveLength(0);
  rerender(
    <TrackerCell
      {...props}
      rowCombatant={{ ...combatant, weapon: 57 }}
      columnCombatant={{ ...combatant, key: 2, weapon: 57 }}
    />
  );
  expect(
    screen.getAllByRole('button', { name: /off-hand attack details/ })
  ).toHaveLength(2);
});
