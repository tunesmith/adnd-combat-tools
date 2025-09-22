/** @jest-environment jsdom */
import { act } from 'react-dom/test-utils';
import * as ReactTestUtils from 'react-dom/test-utils';
import ReactDOM from 'react-dom';
import type { DungeonRenderNode } from '../../../../types/dungeon';
import type { OutcomeEventNode } from '../../../../dungeon/domain/outcome';

// Build a canned outcome for: Periodic Check => Door with pending doorLocation:0
const outcome: OutcomeEventNode = {
  type: 'event',
  id: 'root.periodicCheck',
  roll: 3,
  event: {
    kind: 'periodicCheck',
    result: 1, // PeriodicCheck.Door
    level: 1,
  } as any,
  children: [
    {
      type: 'pending-roll',
      id: 'root.periodicCheck.0.doorLocation:0',
      table: 'doorLocation:0',
    },
  ],
};

const detail: DungeonRenderNode[] = [
  { kind: 'bullet-list', items: ['roll: 3 — Door'] },
  { kind: 'paragraph', text: 'A closed door is indicated.' },
  {
    kind: 'table-preview',
    id: 'doorLocation:0',
    targetId: 'root.periodicCheck.0.doorLocation:0',
    title: 'Door Location',
    sides: 20,
    entries: [
      { range: '1–6', label: 'Left' },
      { range: '7–12', label: 'Right' },
      { range: '13–20', label: 'Ahead' },
    ],
  },
];

jest.mock('../../../../dungeon/services/adapters', () => {
  return {
    runDungeonStep: () => ({
      action: 'passage',
      roll: 3,
      outcome,
      messages: detail,
      renderCache: { detail },
      pendingCount: 1,
    }),
  };
});

import DungeonIndexPage from '../../../../pages/dungeon';

function findLabel(
  text: string,
  root: ParentNode = document
): HTMLLabelElement | null {
  const labels = Array.from(
    root.querySelectorAll('label')
  ) as HTMLLabelElement[];
  return labels.find((l) => l.textContent?.trim().includes(text)) ?? null;
}

function findButtonByText(
  text: string,
  root: ParentNode = document
): HTMLButtonElement | null {
  const buttons = Array.from(
    root.querySelectorAll('button')
  ) as HTMLButtonElement[];
  return buttons.find((b) => b.textContent?.trim() === text) ?? null;
}

function findDivByText(
  text: string,
  root: ParentNode = document
): HTMLDivElement | null {
  const divs = Array.from(root.querySelectorAll('div')) as HTMLDivElement[];
  return divs.find((d) => (d.textContent ?? '').includes(text)) ?? null;
}

async function waitFor<T>(
  fn: () => T | null,
  timeoutMs = 3000,
  intervalMs = 25
): Promise<T> {
  const start = Date.now();
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const val = fn();
    if (val) return val;
    if (Date.now() - start > timeoutMs) throw new Error('waitFor: timed out');
    await new Promise((r) => setTimeout(r, intervalMs));
  }
}

function requireElement<T>(value: T | null | undefined, message: string): T {
  if (value == null) {
    throw new Error(message);
  }
  return value;
}

describe('Dungeon UI collapse (runDungeonStep mocked)', () => {
  it('collapses Door Location preview after submitting override 13', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    await act(async () => {
      ReactDOM.render(<DungeonIndexPage />, container);
    });

    // Enable Detail mode
    const detailLabel = requireElement(
      findLabel('Detail mode'),
      'detail mode label'
    );
    const detailCheckbox = requireElement(
      detailLabel.querySelector<HTMLInputElement>('input[type="checkbox"]'),
      'detail mode checkbox'
    );
    await act(async () => {
      detailCheckbox.click();
    });

    // Add a feed item using main override (enter 3) and Submit
    const rollLabel = requireElement(
      findLabel('d20 Roll:'),
      'roll label'
    );
    const rollInput = requireElement(
      rollLabel.querySelector<HTMLInputElement>('input[type="number"]'),
      'roll input'
    );
    await act(async () => {
      // Use React's Simulate to ensure onChange runs
      (rollInput as any).value = '3';
      ReactTestUtils.Simulate.change(rollInput, {
        target: { value: '3' },
      } as any);
    });
    const mainSubmit = requireElement(
      findButtonByText('Submit'),
      'main submit button'
    );
    await act(async () => {
      mainSubmit.click();
    });
    // Find Door Location preview in feed and lock to its feed item container
    const feedEl = requireElement(
      document.querySelector('.feed'),
      'feed element'
    );
    const feedItemEl = requireElement(
      feedEl.querySelector<HTMLElement>('.feedItem'),
      'feed item container'
    );
    // Sanity check that this feed item contains the Door Location header
    const headerOk = (feedItemEl.textContent ?? '').includes('Door Location (d20)');
    expect(headerOk).toBe(true);

    // Set override 13 and submit inside preview
    const overrideLabel = requireElement(
      findLabel('Override next roll:', feedItemEl),
      'door location override label'
    );
    const overrideInput = requireElement(
      overrideLabel.querySelector<HTMLInputElement>('input[type="number"]'),
      'door location override input'
    );
    await act(async () => {
      (overrideInput as any).value = '13';
      ReactTestUtils.Simulate.change(overrideInput, {
        target: { value: '13' },
      } as any);
    });

    const previewSubmit = requireElement(
      findButtonByText('Submit', feedItemEl),
      'door location preview submit'
    );
    await act(async () => {
      previewSubmit.click();
    });
    // Allow React to commit state
    // await act(async () => {
    //   await new Promise((r) => setTimeout(r, 0));
    // });

    // Re-grab the preview block after rerender
    const previewBlockAfter = await waitFor(() =>
      findDivByText('Door Location (d20)', feedItemEl)
    );

    // Expect correct behaviour now: preview collapsed, chevron present
    requireElement(
      feedItemEl.querySelector<HTMLButtonElement>(
        'button[aria-label="Expand table"]'
      ),
      'preview chevron button'
    );
    const overrideStillVisible = findLabel(
      'Override next roll:',
      previewBlockAfter
    );
    expect(overrideStillVisible).toBeNull();
    // Entries should be hidden (not present)
    const entryLeft = (previewBlockAfter.textContent ?? '').includes('1–6');
    expect(entryLeft).toBe(false);

    await act(async () => {
      ReactDOM.unmountComponentAtNode(container);
    });
    container.remove();
  });

  it('keeps Door Continuation preview expanded after submitting override 3 (current bug reproduction)', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    await act(async () => {
      ReactDOM.render(<DungeonIndexPage />, container);
    });

    const detailLabel = requireElement(
      findLabel('Detail mode'),
      'detail mode label'
    );
    const detailCheckbox = requireElement(
      detailLabel.querySelector<HTMLInputElement>('input[type="checkbox"]'),
      'detail mode checkbox'
    );
    await act(async () => {
      detailCheckbox.click();
    });

    const rollLabel = requireElement(
      findLabel('d20 Roll:'),
      'roll label'
    );
    const rollInput = requireElement(
      rollLabel.querySelector<HTMLInputElement>('input[type="number"]'),
      'roll input'
    );
    await act(async () => {
      (rollInput as any).value = '3';
      ReactTestUtils.Simulate.change(rollInput, {
        target: { value: '3' },
      } as any);
    });

    const mainSubmit = requireElement(
      findButtonByText('Submit'),
      'main submit button'
    );
    await act(async () => {
      mainSubmit.click();
    });

    const feedEl = requireElement(
      document.querySelector('.feed'),
      'feed element'
    );

    const findPreviewContainer = (title: string) =>
      waitFor(() => {
        const heading = Array.from(document.querySelectorAll('div'))
          .filter((el): el is HTMLDivElement => el instanceof HTMLDivElement)
          .find((div) => {
            if (div.style.fontWeight !== '700') return false;
            return div.textContent?.trim() === title;
          });
        if (!heading) return null;
        const container = heading.closest(
          'div[style*="padding"]'
        ) as HTMLDivElement | null;
        return container;
      });

    const doorLocationBlock = await findPreviewContainer('Door Location (d20)');
    const doorLocationOverride = requireElement(
      findLabel('Override next roll:', doorLocationBlock),
      'door location override label'
    );
    const doorLocationInput = requireElement(
      doorLocationOverride.querySelector<HTMLInputElement>('input[type="number"]'),
      'door location override input'
    );
    await act(async () => {
      (doorLocationInput as any).value = '3';
      ReactTestUtils.Simulate.change(doorLocationInput, {
        target: { value: '3' },
      } as any);
    });
    const doorLocationSubmit = requireElement(
      findButtonByText('Submit', doorLocationBlock),
      'door location submit button'
    );
    await act(async () => {
      doorLocationSubmit.click();
    });

    await waitFor(() =>
      findLabel('Override next roll:', doorLocationBlock) ? null : true
    );

    expect(document.body.textContent ?? '').toContain(
      'Door Continuation (d20)'
    );

    const doorContinuationBlock = await findPreviewContainer(
      'Door Continuation (d20)'
    );
    const doorContinuationOverride = requireElement(
      findLabel('Override next roll:', doorContinuationBlock),
      'door continuation override label'
    );
    const doorContinuationInput = requireElement(
      doorContinuationOverride.querySelector<HTMLInputElement>('input[type="number"]'),
      'door continuation override input'
    );
    await act(async () => {
      (doorContinuationInput as any).value = '3';
      ReactTestUtils.Simulate.change(doorContinuationInput, {
        target: { value: '3' },
      } as any);
    });
    const doorContinuationSubmit = requireElement(
      findButtonByText('Submit', doorContinuationBlock),
      'door continuation submit button'
    );
    await act(async () => {
      doorContinuationSubmit.click();
    });

    const doorContinuationBlockAfter = await findPreviewContainer(
      'Door Continuation (d20)'
    );

    // Verify the preview collapses and keeps controls hidden once resolved.
    requireElement(
      doorContinuationBlockAfter.querySelector<HTMLButtonElement>(
        'button[aria-label="Expand table"]'
      ),
      'door continuation chevron'
    );
    const overrideStillVisible = findLabel(
      'Override next roll:',
      doorContinuationBlockAfter
    );
    expect(overrideStillVisible).toBeNull();
    const entryDoor = (doorContinuationBlockAfter.textContent ?? '').includes(
      '3–5'
    );
    expect(entryDoor).toBe(false);

    await act(async () => {
      ReactDOM.unmountComponentAtNode(container);
    });
    container.remove();
  });
});
