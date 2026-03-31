/** @jest-environment jsdom */

import '@testing-library/jest-dom';
import { fireEvent, render, screen, within } from '@testing-library/react';
import EncumbranceApp from '../components/encumbrance/EncumbranceApp';

const addCustomItem = ({
  name,
  valueGp,
  category = 'adventuring-gear',
  weightGp = 1,
}: {
  name: string;
  valueGp: number;
  category?: string;
  weightGp?: number;
}) => {
  fireEvent.click(screen.getByRole('button', { name: 'Add Item' }));
  fireEvent.click(screen.getByRole('button', { name: 'Custom Item' }));
  fireEvent.change(screen.getByLabelText('Name'), {
    target: { value: name },
  });
  fireEvent.change(screen.getByLabelText('Category'), {
    target: { value: category },
  });
  fireEvent.change(screen.getByLabelText('Weight per item'), {
    target: { value: String(weightGp) },
  });
  fireEvent.change(screen.getByLabelText('Value per item'), {
    target: { value: String(valueGp) },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Add Custom Item' }));
};

describe('encumbrance app regressions', () => {
  test('custom container flow keeps the established add fields and edit metadata', () => {
    render(<EncumbranceApp mode="dm" />);

    fireEvent.click(screen.getByRole('button', { name: 'Add Item' }));
    fireEvent.click(screen.getByRole('button', { name: 'Custom Item' }));
    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'Backpack of Holding' },
    });
    fireEvent.change(screen.getByLabelText('Category'), {
      target: { value: 'containers' },
    });
    fireEvent.change(screen.getByLabelText('Weight per item'), {
      target: { value: '150' },
    });
    fireEvent.change(screen.getByLabelText('Value per item'), {
      target: { value: '25000' },
    });
    fireEvent.change(screen.getByLabelText('Capacity'), {
      target: { value: '5000' },
    });
    fireEvent.change(screen.getByLabelText('Carried weight'), {
      target: { value: 'own' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add Custom Item' }));

    fireEvent.click(
      screen.getByRole('button', { name: 'Edit Backpack of Holding' })
    );

    const dialog = screen.getByRole('dialog', {
      name: 'Backpack of Holding',
    });

    expect(
      within(dialog).getByLabelText('Weight per item')
    ).toBeInTheDocument();
    expect(within(dialog).getByLabelText('Stored in')).toBeInTheDocument();
    expect(
      within(dialog).getByLabelText('Value known to player')
    ).toBeInTheDocument();
    expect(within(dialog).getByLabelText('Carried weight')).toBeInTheDocument();
    expect(within(dialog).getByText('Value per item')).toBeInTheDocument();
    expect(within(dialog).getAllByText('25,000 gp')).not.toHaveLength(0);
    expect(within(dialog).getByText('Container usage')).toBeInTheDocument();
    expect(within(dialog).getByText('0 gp / 5000 gp')).toBeInTheDocument();
  });

  test('removing one custom item does not disturb another custom item', () => {
    render(<EncumbranceApp mode="dm" />);

    addCustomItem({
      name: 'Luckstone',
      valueGp: 25000,
    });
    addCustomItem({
      name: 'Whip',
      valueGp: 15,
      category: 'arms',
      weightGp: 20,
    });

    fireEvent.click(screen.getByRole('button', { name: 'Edit Luckstone' }));

    const editDialog = screen.getByRole('dialog', { name: 'Luckstone' });
    fireEvent.click(
      within(editDialog).getByRole('button', { name: 'Remove Item' })
    );

    const removeDialog = screen.getByRole('dialog', { name: 'Remove Item' });
    fireEvent.click(
      within(removeDialog).getByRole('button', { name: 'Remove Item' })
    );

    expect(
      screen.queryByRole('button', { name: 'Edit Luckstone' })
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Edit Whip' }));

    const remainingDialog = screen.getByRole('dialog', { name: 'Whip' });
    expect(
      within(remainingDialog).getByText('Value per item')
    ).toBeInTheDocument();
    expect(within(remainingDialog).getAllByText('15 gp')).not.toHaveLength(0);
    expect(within(remainingDialog).getByText('Row value')).toBeInTheDocument();
  });
});
