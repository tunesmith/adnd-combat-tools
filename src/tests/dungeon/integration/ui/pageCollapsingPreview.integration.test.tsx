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

describe('Dungeon UI collapse (runDungeonStep mocked)', () => {
  it('collapses Door Location preview after submitting override 13', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    await act(async () => {
      ReactDOM.render(<DungeonIndexPage />, container);
    });

    // Enable Detail mode
    const detailLabel = findLabel('Detail mode');
    expect(detailLabel).not.toBeNull();
    const detailCheckbox = detailLabel!.querySelector(
      'input[type="checkbox"]'
    ) as HTMLInputElement;
    await act(async () => {
      detailCheckbox.click();
    });

    // Add a feed item using main override (enter 3) and Submit
    const rollLabel = findLabel('d20 Roll:');
    expect(rollLabel).not.toBeNull();
    const rollInput = rollLabel!.querySelector(
      'input[type="number"]'
    ) as HTMLInputElement;
    expect(rollInput).not.toBeNull();
    await act(async () => {
      // Use React's Simulate to ensure onChange runs
      (rollInput as any).value = '3';
      ReactTestUtils.Simulate.change(rollInput, {
        target: { value: '3' },
      } as any);
    });
    const mainSubmit = findButtonByText('Submit');
    expect(mainSubmit).not.toBeNull();
    await act(async () => {
      mainSubmit!.click();
    });
    // debug dump
    // eslint-disable-next-line no-console
    console.log('BODY AFTER MAIN SUBMIT:\n', document.body.innerHTML);

    // Find Door Location preview in feed and lock to its feed item container
    const feedEl = document.querySelector('.feed');
    expect(feedEl).not.toBeNull();
    const feedItemEl = feedEl!.querySelector('.feedItem') as HTMLElement | null;
    expect(feedItemEl).not.toBeNull();
    // Sanity check that this feed item contains the Door Location header
    const headerOk = (feedItemEl!.textContent ?? '').includes(
      'Door Location (d20)'
    );
    expect(headerOk).toBe(true);

    // Set override 13 and submit inside preview
    const overrideLabel = findLabel('Override next roll:', feedItemEl!);
    expect(overrideLabel).not.toBeNull();
    const overrideInput = overrideLabel!.querySelector(
      'input[type="number"]'
    ) as HTMLInputElement;
    await act(async () => {
      (overrideInput as any).value = '13';
      ReactTestUtils.Simulate.change(overrideInput, {
        target: { value: '13' },
      } as any);
    });

    const previewSubmit = findButtonByText('Submit', feedItemEl!);
    expect(previewSubmit).not.toBeNull();
    await act(async () => {
      previewSubmit!.click();
    });
    // Allow React to commit state
    // await act(async () => {
    //   await new Promise((r) => setTimeout(r, 0));
    // });

    // Re-grab the preview block after rerender
    const previewBlockAfter = await waitFor(() =>
      findDivByText('Door Location (d20)', feedItemEl!)
    );

    // Expect correct behaviour now: preview collapsed, chevron present
    const chevron = feedItemEl!.querySelector(
      'button[aria-label="Expand table"]'
    ) as HTMLButtonElement | null;
    expect(chevron).not.toBeNull();
    const overrideStillVisible = findLabel(
      'Override next roll:',
      previewBlockAfter!
    );
    expect(overrideStillVisible).toBeNull();
    // Entries should be hidden (not present)
    const entryLeft = (previewBlockAfter!.textContent ?? '').includes('1–6');
    expect(entryLeft).toBe(false);
  });
});
