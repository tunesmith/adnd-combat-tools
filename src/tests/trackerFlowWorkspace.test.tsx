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
    fireEvent.change(
      flow.getByLabelText('Detail (optional)', { exact: true }),
      {
        target: { value: 'First arrow misses' },
      }
    );
    const waiting = flow.getAllByRole('button', { name: /, Waiting$/ })[0];
    if (!waiting) throw Error('Missing waiting step');
    fireEvent.click(waiting);
    expect(
      flow.getByLabelText('Detail (optional)', { exact: true })
    ).toHaveValue('First arrow misses');
    expect(
      within(flow.getByRole('region', { name: 'Why here' })).getByText(
        /Waiting/
      )
    ).toBeInTheDocument();
    fireEvent.click(flow.getByRole('button', { name: 'Graph', exact: true }));
    expect(
      flow.getByLabelText('Detail (optional)', { exact: true })
    ).not.toBeVisible();
    expect(flow.queryByRole('separator', { name: 'Graph height' })).toBeNull();
    fireEvent.click(flow.getByRole('button', { name: 'Action', exact: true }));
    expect(
      flow.getByLabelText('Detail (optional)', { exact: true })
    ).toHaveValue('First arrow misses');
    expect(flow.queryByRole('button', { name: 'Fit width' })).toBeNull();
    fireEvent.click(flow.getByRole('button', { name: 'Both', exact: true }));
    expect(
      flow.getByLabelText('Detail (optional)', { exact: true })
    ).toHaveValue('First arrow misses');
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
    expect(
      flow.getByLabelText('Detail (optional)', { exact: true })
    ).toHaveValue('');
    fireEvent.click(flow.getByRole('button', { name: /, Resolved$/ }));
    fireEvent.click(flow.getByRole('button', { name: 'View step' }));
    expect(
      flow.getByLabelText('Detail (optional)', { exact: true })
    ).toHaveValue('First arrow misses');
    expect(flow.getByRole('button', { name: 'Resolve action' })).toBeDisabled();
    const explanation = within(flow.getByRole('region', { name: 'Why here' }));
    const disclosure = explanation.getByRole('button', {
      name: /Show dependencies/,
    });
    expect(disclosure).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(disclosure);
    expect(disclosure).toHaveAttribute('aria-expanded', 'true');
    expect(explanation.getByText('Required by')).toBeVisible();
    fireEvent.click(
      explanation.getByRole('button', { name: /Hide dependencies/ })
    );
    expect(explanation.queryByText('Required by')).toBeNull();
    fireEvent.click(
      explanation.getByRole('button', { name: 'Mark unresolved' })
    );
    expect(flow.getByText(/0 \/ 3 resolved/)).toBeInTheDocument();
    expect(flow.getByLabelText('Detail (optional)')).toHaveValue(
      'First arrow misses'
    );
  } finally {
    jest.restoreAllMocks();
  }
});

test('the resolver and main grid share a mark while handwritten and deliberately blank cells take precedence', () => {
  jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
  try {
    const state = createRegisterIntentionsFixtureState();
    const round = state.rounds[0],
      actor = round?.party[0];
    if (!round || !actor) throw Error('Missing archer');
    actor.weapon = 11;
    render(<CombatTracker rememberedState={state} />);
    const flow = within(screen.getByRole('region', { name: 'Combat Flow' }));
    fireEvent.click(flow.getByRole('button', { name: 'Select next ready' }));
    const label = 'Grid entry: Lodi → Pillar Gnoll';
    const cells = () => screen.getAllByLabelText(label);
    const target = flow.getByLabelText(label);
    const targetTd = target.closest('td');
    if (!targetTd) throw Error('Missing target cell');
    const feedback = within(targetTd);
    const mark = flow.getByLabelText('Grid mark', { exact: true });
    const detail = flow.getByLabelText('Detail (optional)', { exact: true });
    expect(mark).toHaveValue('');
    expect(detail).toBeVisible();
    fireEvent.change(mark, { target: { value: '5' } });
    expect(cells()).toHaveLength(2);
    cells().forEach((c) => expect(c).toHaveValue('x'));
    expect(feedback.getByText('From attack marks: 5')).not.toBeVisible();
    fireEvent.click(feedback.getByText('Handwritten'));
    expect(feedback.getByText('From attack marks: 5')).toBeVisible();
    const use = () =>
      fireEvent.click(
        feedback.getByRole('button', { name: 'Use attack marks' })
      );
    use();
    cells().forEach((c) => expect(c).toHaveValue('5'));
    fireEvent.change(detail, { target: { value: 'Drives it back.' } });
    expect(target).toHaveValue('5');
    const main = cells().find((c) => c !== target);
    if (!main) throw Error('Missing main grid input');
    fireEvent.change(main, { target: { value: 'hit!' } });
    fireEvent.change(mark, { target: { value: '6' } });
    expect(target).toHaveValue('hit!');
    fireEvent.change(target, { target: { value: '' } });
    fireEvent.change(mark, { target: { value: '7' } });
    expect(main).toHaveValue('');
    expect(feedback.getByText('From attack marks: 7')).not.toBeVisible();
    fireEvent.click(feedback.getByText('Handwritten'));
    expect(feedback.getByText('From attack marks: 7')).toBeVisible();
    use();
    expect(main).toHaveValue('7');
    expect(feedback.queryByText(/From attack marks|Handwritten/)).toBeNull();
    expect(detail).toHaveValue('Drives it back.');
    expect(flow.getByText(/0 \/ 3 resolved/)).toBeInTheDocument();
  } finally {
    jest.restoreAllMocks();
  }
});
