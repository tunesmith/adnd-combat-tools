/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import EncumbranceApp from '../components/encumbrance/EncumbranceApp';
import { createEmptyEncumbranceDocument } from '../helpers/encumbranceDocument';

test.each([
  ['standalone', 8, 436, 350],
  ['campaign', 8, 436, 350],
  ['standalone', 15, 900, 550],
  ['campaign', 15, 900, 550],
] as const)(
  '%s STR %s / %s gp displays Heavy gear without changing stored data',
  async (mode, score, load, capacity) => {
    const doc = createEmptyEncumbranceDocument('adnd-encumbrance-dm');
    if (doc.kind !== 'adnd-encumbrance-dm' || !doc.characters[0])
      throw Error('Missing fixture');
    const pc = doc.characters[0];
    pc.name = 'Threshold fixture';
    pc.strength = { score, exceptional: 'none' };
    pc.inventory = [
      {
        id: 'coins',
        catalogId: 'coin-gold',
        quantity: load,
        containerId: null,
        day: 0,
        playerNotes: '',
        dmNotes: '',
        playerKnowsValue: true,
        playerMagicKnowledge: 'known-mundane',
      },
    ];
    const before = JSON.stringify(doc),
      onDocumentChange = jest.fn();
    render(
      <EncumbranceApp
        mode="dm"
        campaign={
          mode === 'campaign'
            ? { document: doc, onDocumentChange, onExport: jest.fn() }
            : undefined
        }
      />
    );
    if (mode === 'standalone') {
      const file = new File([before], 'threshold.json', {
        type: 'application/json',
      });
      Object.defineProperty(file, 'text', { value: async () => before });
      fireEvent.change(screen.getByLabelText('Load File'), {
        target: { files: [file] },
      });
    }
    await waitFor(() =>
      expect(screen.getByText('Band').parentElement).toHaveTextContent(
        'Heavy gear'
      )
    );
    expect(
      screen.getByText('Total', { selector: 'span' }).parentElement
    ).toHaveTextContent(`${load} gp`);
    expect(screen.getByText('12" Capacity').parentElement).toHaveTextContent(
      `${capacity} gp`
    );
    expect(screen.getByText('Move').parentElement).toHaveTextContent('9"');
    expect(
      screen.getByText('Warnings', { selector: 'span' }).parentElement
    ).toHaveTextContent('0');
    expect(JSON.stringify(doc)).toBe(before);
    expect(onDocumentChange).not.toHaveBeenCalled();
  }
);
