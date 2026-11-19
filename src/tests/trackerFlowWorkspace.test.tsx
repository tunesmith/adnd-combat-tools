/** @jest-environment jsdom */
import { fireEvent, render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import CombatTracker from '../components/tracker/CombatTracker';
import { createRegisterIntentionsFixtureState } from './support/trackerFixtures';

test('inspecting a dependency preserves the active roll; cycling selects without resolving', () => {
  jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
  try {
    const state = createRegisterIntentionsFixtureState();
    const round = state.rounds[0];
    const archer = round?.party[0];
    if (!round || !archer) throw Error('Missing fixture');
    archer.weapon = 11;
    render(<CombatTracker rememberedState={state} />);
    const flow = within(screen.getByRole('region', { name: 'Combat Flow' }));
    const next = flow.getByRole('button', { name: 'Select next ready' });
    const divider = flow.getByRole('separator', { name: 'Graph height' });
    expect(flow.queryByRole('slider')).toBeNull();
    fireEvent.keyDown(divider, { key: 'End' });
    expect(divider).toHaveAttribute('aria-valuenow', '80');
    fireEvent.click(next);
    fireEvent.change(flow.getByLabelText('Result', { exact: true }), {
      target: { value: 'First arrow misses' },
    });
    const waiting = flow.getAllByRole('button', { name: /, Waiting$/ })[0];
    if (!waiting) throw Error('Missing waiting step');
    fireEvent.click(waiting);
    expect(flow.getByLabelText('Result', { exact: true })).toHaveValue(
      'First arrow misses'
    );
    expect(
      within(flow.getByRole('region', { name: 'Why here' })).getByText(
        /Waiting/
      )
    ).toBeInTheDocument();
    fireEvent.click(flow.getByRole('button', { name: 'Graph', exact: true }));
    expect(flow.getByLabelText('Result', { exact: true })).not.toBeVisible();
    expect(flow.queryByRole('separator', { name: 'Graph height' })).toBeNull();
    fireEvent.click(flow.getByRole('button', { name: 'Action', exact: true }));
    expect(flow.getByLabelText('Result', { exact: true })).toHaveValue(
      'First arrow misses'
    );
    expect(flow.queryByRole('button', { name: 'Fit width' })).toBeNull();
    fireEvent.click(flow.getByRole('button', { name: 'Both', exact: true }));
    expect(flow.getByLabelText('Result', { exact: true })).toHaveValue(
      'First arrow misses'
    );
    const restored = flow.getByRole('separator', { name: 'Graph height' });
    expect(restored).toHaveAttribute('aria-valuenow', '80');
    fireEvent.doubleClick(restored);
    expect(restored).toHaveAttribute('aria-valuenow', '47');
    fireEvent.click(flow.getByRole('button', { name: 'Fit width' }));
    expect(flow.getByRole('button', { name: 'Fit width' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    fireEvent.click(flow.getByRole('button', { name: 'Resolve and next' }));
    expect(flow.getByText(/1 \/ 3 resolved/)).toBeInTheDocument();
    expect(flow.getByLabelText('Result', { exact: true })).toHaveValue('');
    fireEvent.click(flow.getByRole('button', { name: /, Resolved$/ }));
    fireEvent.click(flow.getByRole('button', { name: 'View step' }));
    expect(flow.getByLabelText('Result', { exact: true })).toHaveValue(
      'First arrow misses'
    );
    expect(flow.getByRole('button', { name: 'Resolve action' })).toBeDisabled();
  } finally {
    jest.restoreAllMocks();
  }
});
