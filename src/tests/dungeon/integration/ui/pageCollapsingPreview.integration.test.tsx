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

let container: HTMLDivElement | null = null;

afterEach(() => {
  if (!container) return;
  const target = container;
  act(() => {
    ReactDOM.unmountComponentAtNode(target);
  });
  if (target.parentNode) {
    target.parentNode.removeChild(target);
  }
  container = null;
  document.body.innerHTML = '';
});

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

function findPreviewCardByTitle(
  title: string,
  root: ParentNode = document
): HTMLDivElement | null {
  const titleNode = Array.from(root.querySelectorAll('div'))
    .filter((el): el is HTMLDivElement => el instanceof HTMLDivElement)
    .find((div) => div.textContent?.trim() === title);
  if (!titleNode) return null;

  let current: HTMLElement | null = titleNode;
  while (current) {
    const hasPreviewButtons =
      findButtonByText('AutoRoll', current) !== null ||
      current.querySelector('button[aria-label="Expand table"]') !== null ||
      current.querySelector('button[aria-label="Collapse table"]') !== null;
    if (hasPreviewButtons) {
      return current as HTMLDivElement;
    }
    current = current.parentElement;
  }

  return null;
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
  it('shows the initial detail preview and lets it launch the first roll', async () => {
    container = document.createElement('div');
    document.body.appendChild(container);

    await act(async () => {
      ReactDOM.render(<DungeonIndexPage />, container as HTMLDivElement);
    });

    const detailLabel = requireElement(findLabel('Detail'), 'detail label');
    const detailRadio = requireElement(
      detailLabel.querySelector<HTMLInputElement>('input[type="radio"]'),
      'detail radio'
    );
    await act(async () => {
      detailRadio.click();
    });

    await waitFor(() =>
      (document.body.textContent ?? '').includes('Periodic Check') ? true : null
    );
    expect(document.body.textContent ?? '').toContain('Start');
    expect(document.body.textContent ?? '').toContain('1–2');
    expect(document.body.textContent ?? '').not.toContain(
      'Make a selection, enter 1–20 or click AutoRoll.'
    );

    const rollLabel = requireElement(findLabel('d20 Roll'), 'roll label');
    const rollInput = requireElement(
      rollLabel.querySelector<HTMLInputElement>('input[type="number"]'),
      'roll input'
    );
    await act(async () => {
      (rollInput as any).value = '12';
      ReactTestUtils.Simulate.change(rollInput, {
        target: { value: '12' },
      } as any);
    });

    await act(async () => {
      ReactTestUtils.Simulate.keyDown(rollInput, {
        key: 'Enter',
        code: 'Enter',
        keyCode: 13,
        which: 13,
      } as any);
    });

    const feedItemEl = await waitFor(() =>
      document.querySelector<HTMLElement>('.feedItem')
    );
    expect(document.body.textContent ?? '').toContain('Periodic Check');
    expect(document.body.textContent ?? '').toContain('1–2');
    expect(document.body.textContent ?? '').not.toContain(
      'Expand to review the full table.'
    );
    expect(feedItemEl?.textContent ?? '').toContain('Door Location');
  });

  it('collapses Door Location preview after submitting override 13', async () => {
    container = document.createElement('div');
    document.body.appendChild(container);

    await act(async () => {
      ReactDOM.render(<DungeonIndexPage />, container as HTMLDivElement);
    });

    // Enable Detail mode
    const detailLabel = requireElement(findLabel('Detail'), 'detail label');
    const detailCheckbox = requireElement(
      detailLabel.querySelector<HTMLInputElement>('input[type="radio"]'),
      'detail radio'
    );
    await act(async () => {
      detailCheckbox.click();
    });

    // Add a feed item using main override (enter 3) and Enter
    const rollLabel = requireElement(findLabel('d20 Roll'), 'roll label');
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
    await act(async () => {
      ReactTestUtils.Simulate.keyDown(rollInput, {
        key: 'Enter',
        code: 'Enter',
        keyCode: 13,
        which: 13,
      } as any);
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
    const headerOk = (feedItemEl.textContent ?? '').includes('Door Location');
    expect(headerOk).toBe(true);

    // Set override 13 and submit inside preview
    const overrideLabel = requireElement(
      findLabel('Override roll', feedItemEl),
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

    await act(async () => {
      ReactTestUtils.Simulate.keyDown(overrideInput, {
        key: 'Enter',
        code: 'Enter',
        keyCode: 13,
        which: 13,
      } as any);
    });
    // Allow React to commit state
    // await act(async () => {
    //   await new Promise((r) => setTimeout(r, 0));
    // });

    // Re-grab the preview block after rerender
    const previewBlockAfter = await waitFor(() =>
      findPreviewCardByTitle('Door Location', feedItemEl)
    );

    // Expect correct behaviour now: preview collapsed, chevron present
    requireElement(
      feedItemEl.querySelector<HTMLButtonElement>(
        'button[aria-label="Expand table"]'
      ),
      'preview chevron button'
    );
    const overrideStillVisible = findLabel('Override roll', previewBlockAfter);
    expect(overrideStillVisible).toBeNull();
    // Entries should be hidden (not present)
    const entryLeft = (previewBlockAfter.textContent ?? '').includes('1–6');
    expect(entryLeft).toBe(false);
  });

  it('keeps Door Continuation preview expanded after submitting override 3 (current bug reproduction)', async () => {
    container = document.createElement('div');
    document.body.appendChild(container);

    await act(async () => {
      ReactDOM.render(<DungeonIndexPage />, container as HTMLDivElement);
    });

    const detailLabel = requireElement(findLabel('Detail'), 'detail label');
    const detailCheckbox = requireElement(
      detailLabel.querySelector<HTMLInputElement>('input[type="radio"]'),
      'detail radio'
    );
    await act(async () => {
      detailCheckbox.click();
    });

    const rollLabel = requireElement(findLabel('d20 Roll'), 'roll label');
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

    await act(async () => {
      ReactTestUtils.Simulate.keyDown(rollInput, {
        key: 'Enter',
        code: 'Enter',
        keyCode: 13,
        which: 13,
      } as any);
    });

    const findPreviewContainer = (title: string) =>
      waitFor(() => {
        return findPreviewCardByTitle(title);
      });

    const doorLocationBlock = await findPreviewContainer('Door Location');
    const doorLocationOverride = requireElement(
      findLabel('Override roll', doorLocationBlock),
      'door location override label'
    );
    const doorLocationInput = requireElement(
      doorLocationOverride.querySelector<HTMLInputElement>(
        'input[type="number"]'
      ),
      'door location override input'
    );
    await act(async () => {
      (doorLocationInput as any).value = '3';
      ReactTestUtils.Simulate.change(doorLocationInput, {
        target: { value: '3' },
      } as any);
    });
    await act(async () => {
      ReactTestUtils.Simulate.keyDown(doorLocationInput, {
        key: 'Enter',
        code: 'Enter',
        keyCode: 13,
        which: 13,
      } as any);
    });

    await waitFor(() =>
      findLabel('Override roll', doorLocationBlock) ? null : true
    );

    expect(document.body.textContent ?? '').toContain('Door Continuation');

    const doorContinuationBlock = await findPreviewContainer(
      'Door Continuation'
    );
    const doorContinuationOverride = requireElement(
      findLabel('Override roll', doorContinuationBlock),
      'door continuation override label'
    );
    const doorContinuationInput = requireElement(
      doorContinuationOverride.querySelector<HTMLInputElement>(
        'input[type="number"]'
      ),
      'door continuation override input'
    );
    await act(async () => {
      (doorContinuationInput as any).value = '3';
      ReactTestUtils.Simulate.change(doorContinuationInput, {
        target: { value: '3' },
      } as any);
    });
    await act(async () => {
      ReactTestUtils.Simulate.keyDown(doorContinuationInput, {
        key: 'Enter',
        code: 'Enter',
        keyCode: 13,
        which: 13,
      } as any);
    });

    const doorContinuationBlockAfter = await findPreviewContainer(
      'Door Continuation'
    );

    // Verify the preview collapses and keeps controls hidden once resolved.
    requireElement(
      doorContinuationBlockAfter.querySelector<HTMLButtonElement>(
        'button[aria-label="Expand table"]'
      ),
      'door continuation chevron'
    );
    const overrideStillVisible = findLabel(
      'Override roll',
      doorContinuationBlockAfter
    );
    expect(overrideStillVisible).toBeNull();
    const entryDoor = (doorContinuationBlockAfter.textContent ?? '').includes(
      '3–5'
    );
    expect(entryDoor).toBe(false);
  });

  it('copies replay info with the run seed and committed inputs', async () => {
    const writeText = jest.fn<Promise<void>, [string]>().mockResolvedValue();
    Object.defineProperty(global.navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });

    container = document.createElement('div');
    document.body.appendChild(container);

    await act(async () => {
      ReactDOM.render(<DungeonIndexPage />, container as HTMLDivElement);
    });

    const detailLabel = requireElement(findLabel('Detail'), 'detail label');
    const detailRadio = requireElement(
      detailLabel.querySelector<HTMLInputElement>('input[type="radio"]'),
      'detail radio'
    );
    await act(async () => {
      detailRadio.click();
    });

    const rollLabel = requireElement(findLabel('d20 Roll'), 'roll label');
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
    await act(async () => {
      ReactTestUtils.Simulate.keyDown(rollInput, {
        key: 'Enter',
        code: 'Enter',
        keyCode: 13,
        which: 13,
      } as any);
    });

    const feedItemEl = requireElement(
      await waitFor(() => document.querySelector<HTMLElement>('.feedItem')),
      'feed item container'
    );
    const overrideLabel = requireElement(
      findLabel('Override roll', feedItemEl),
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
    await act(async () => {
      ReactTestUtils.Simulate.keyDown(overrideInput, {
        key: 'Enter',
        code: 'Enter',
        keyCode: 13,
        which: 13,
      } as any);
    });

    const copyButton = requireElement(
      findButtonByText('Copy Replay Info'),
      'copy replay info button'
    );
    await act(async () => {
      copyButton.click();
    });

    expect(writeText).toHaveBeenCalledTimes(1);
    const copied = JSON.parse(writeText.mock.calls[0]?.[0] ?? '{}');
    expect(copied.page).toBe('dungeon');
    expect(copied.version).toBe('0.2.2');
    expect(typeof copied.seed).toBe('string');
    expect(copied.seed.length).toBeGreaterThan(0);
    expect(copied.items).toEqual([
      {
        kind: 'root-step',
        feedStep: 1,
        action: 'passage',
        roll: 3,
        rollSource: 'manual',
        detailMode: true,
        level: 1,
      },
      {
        kind: 'preview-resolution',
        feedStep: 1,
        tableId: 'doorLocation:0',
        targetId: 'root.periodicCheck.0.doorLocation:0',
        title: 'Door Location',
        roll: 13,
        rollSource: 'manual',
      },
    ]);
  });
});
