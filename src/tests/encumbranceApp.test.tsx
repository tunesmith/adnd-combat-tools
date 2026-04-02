/** @jest-environment jsdom */

import '@testing-library/jest-dom';
import { fireEvent, render, screen, within } from '@testing-library/react';
import EncumbranceApp from '../components/encumbrance/EncumbranceApp';
import { encumbranceCatalog } from '../tables/encumbranceCatalog';

const getCatalogIdByName = (name: string): string => {
  const item = encumbranceCatalog.find((candidate) => candidate.name === name);

  if (!item) {
    throw new Error(`Unable to find catalog item named "${name}".`);
  }

  return item.id;
};

const closeTopModal = () => {
  fireEvent.keyDown(window, { key: 'Escape' });
};

const renameCharacterInOpenModal = (nextName: string) => {
  const dialog = screen.getByRole('dialog', { name: 'Edit Character' });
  fireEvent.change(within(dialog).getByLabelText('Name'), {
    target: { value: nextName },
  });
  closeTopModal();
};

const addCatalogItem = ({
  name,
  day = 0,
  quantity,
  storedIn,
}: {
  name: string;
  day?: number;
  quantity?: number;
  storedIn?: string;
}) => {
  fireEvent.click(screen.getByRole('button', { name: 'Add Item' }));

  const dialog = screen.getByRole('dialog', { name: 'Add Item' });
  const itemSelect = within(dialog).getByLabelText('Item');
  fireEvent.change(itemSelect, {
    target: { value: getCatalogIdByName(name) },
  });

  if (typeof quantity === 'number') {
    fireEvent.change(within(dialog).getByLabelText('Quantity'), {
      target: { value: String(quantity) },
    });
  }

  fireEvent.change(within(dialog).getByLabelText('Day'), {
    target: { value: String(day) },
  });

  if (storedIn) {
    const storedInSelect = within(dialog).getByLabelText('Stored in');
    const storedInOption = within(storedInSelect).getByRole('option', {
      name: storedIn,
    }) as HTMLOptionElement;

    fireEvent.change(storedInSelect, {
      target: { value: storedInOption.value },
    });
  }

  fireEvent.click(within(dialog).getByRole('button', { name: 'Add Item' }));
};

const expectBefore = (left: HTMLElement, right: HTMLElement) => {
  expect(
    left.compareDocumentPosition(right) & Node.DOCUMENT_POSITION_FOLLOWING
  ).toBeTruthy();
};

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
  test('add item defaults differ between catalog and custom items', () => {
    render(<EncumbranceApp mode="dm" />);

    fireEvent.click(screen.getByRole('button', { name: 'Add Item' }));

    let dialog = screen.getByRole('dialog', { name: 'Add Item' });
    expect(
      within(dialog).getByLabelText('Magic known to player')
    ).toHaveDisplayValue('Known mundane');
    expect(
      within(dialog).getByLabelText('Value known to player')
    ).toHaveDisplayValue('Known');

    fireEvent.click(screen.getByRole('button', { name: 'Custom Item' }));

    dialog = screen.getByRole('dialog', { name: 'Add Item' });
    expect(
      within(dialog).getByLabelText('Magic known to player')
    ).toHaveDisplayValue('Unknown');
    expect(
      within(dialog).getByLabelText('Value known to player')
    ).toHaveDisplayValue('Unknown');
  });

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
    expect(within(dialog).getByLabelText('Monetary value')).toBeInTheDocument();
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

  test('sorting by item flattens container hierarchy and clearing sort restores it', () => {
    render(<EncumbranceApp mode="dm" />);

    addCatalogItem({
      name: 'Backpack',
      day: 0,
    });
    addCatalogItem({
      name: 'Diamond',
      day: 65,
      storedIn: 'Backpack',
    });
    addCatalogItem({
      name: 'Dagger and scabbard',
      day: 0,
      quantity: 1,
    });

    expectBefore(
      screen.getByRole('button', { name: 'Edit Backpack' }),
      screen.getByRole('button', { name: 'Edit Diamond' })
    );
    expectBefore(
      screen.getByRole('button', { name: 'Edit Diamond' }),
      screen.getByRole('button', {
        name: 'Edit Dagger and scabbard',
      })
    );

    fireEvent.click(screen.getByRole('button', { name: 'Sort by Item' }));

    expectBefore(
      screen.getByRole('button', { name: 'Edit Backpack' }),
      screen.getByRole('button', {
        name: 'Edit Dagger and scabbard',
      })
    );
    expectBefore(
      screen.getByRole('button', {
        name: 'Edit Dagger and scabbard',
      }),
      screen.getByRole('button', { name: 'Edit Diamond' })
    );

    fireEvent.click(screen.getByRole('button', { name: 'Sort by Item' }));

    expectBefore(
      screen.getByRole('button', { name: 'Edit Backpack' }),
      screen.getByRole('button', { name: 'Edit Diamond' })
    );
    expectBefore(
      screen.getByRole('button', { name: 'Edit Diamond' }),
      screen.getByRole('button', {
        name: 'Edit Dagger and scabbard',
      })
    );
  });

  test('all-characters sorting supports owner and stacked day then item ordering', () => {
    render(<EncumbranceApp mode="dm" />);

    addCatalogItem({
      name: 'Diamond',
      day: 69,
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add Character' }));
    renameCharacterInOpenModal('Azalia Larkspur');
    addCatalogItem({
      name: 'Boots, high, soft',
      day: 0,
    });
    addCatalogItem({
      name: 'Diamond',
      day: 65,
    });

    fireEvent.click(screen.getByRole('button', { name: 'All Characters' }));

    fireEvent.click(screen.getByRole('button', { name: 'Sort by Owner' }));

    expectBefore(
      screen.getByRole('button', {
        name: 'Edit Boots, high, soft for Character 2',
      }),
      screen.getByRole('button', {
        name: 'Edit Diamond for Unnamed adventurer',
      })
    );

    fireEvent.click(screen.getByRole('button', { name: 'Sort by Owner' }));
    fireEvent.click(screen.getByRole('button', { name: 'Sort by Day' }));
    fireEvent.click(screen.getByRole('button', { name: 'Sort by Item' }));

    expectBefore(
      screen.getByRole('button', {
        name: 'Edit Boots, high, soft for Character 2',
      }),
      screen.getByRole('button', {
        name: 'Edit Diamond for Unnamed adventurer',
      })
    );
    expectBefore(
      screen.getByRole('button', {
        name: 'Edit Diamond for Unnamed adventurer',
      }),
      screen.getByRole('button', {
        name: 'Edit Diamond for Character 2',
      })
    );
  });

  test('all-characters view disables actions that require a selected character', () => {
    render(<EncumbranceApp mode="dm" />);

    fireEvent.click(screen.getByRole('button', { name: 'Add Character' }));
    closeTopModal();
    fireEvent.click(screen.getByRole('button', { name: 'All Characters' }));

    expect(
      screen.getByRole('button', { name: 'Export Player Copy' })
    ).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Add Item' })).toBeDisabled();
  });

  test('transferring a container moves its contained items to the new character', () => {
    render(<EncumbranceApp mode="dm" />);

    addCatalogItem({
      name: 'Backpack',
      day: 0,
    });
    addCatalogItem({
      name: 'Diamond',
      day: 65,
      storedIn: 'Backpack',
    });

    fireEvent.click(screen.getByRole('button', { name: 'Add Character' }));
    renameCharacterInOpenModal('Azalia Larkspur');
    fireEvent.click(screen.getByRole('button', { name: 'Unnamed adventurer' }));

    fireEvent.click(screen.getByRole('button', { name: 'Edit Backpack' }));

    const dialog = screen.getByRole('dialog', { name: 'Backpack' });
    const heldBySelect = within(dialog).getByLabelText(
      'Held by'
    ) as HTMLSelectElement;
    const targetOption = within(heldBySelect).getByRole('option', {
      name: 'Character 2',
    }) as HTMLOptionElement;
    fireEvent.change(heldBySelect, {
      target: { value: targetOption.value },
    });
    closeTopModal();

    fireEvent.click(screen.getByRole('button', { name: 'Character 2' }));

    expect(
      screen.getByRole('button', { name: 'Edit Backpack' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Edit Diamond' })
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Unnamed adventurer' }));

    expect(
      screen.queryByRole('button', { name: 'Edit Backpack' })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Edit Diamond' })
    ).not.toBeInTheDocument();
  });

  test('transferring a contained item alone clears its old container reference', () => {
    render(<EncumbranceApp mode="dm" />);

    addCatalogItem({
      name: 'Backpack',
      day: 0,
    });
    addCatalogItem({
      name: 'Diamond',
      day: 65,
      storedIn: 'Backpack',
    });

    fireEvent.click(screen.getByRole('button', { name: 'Add Character' }));
    renameCharacterInOpenModal('Azalia Larkspur');
    fireEvent.click(screen.getByRole('button', { name: 'Unnamed adventurer' }));

    fireEvent.click(screen.getByRole('button', { name: 'Edit Diamond' }));

    const dialog = screen.getByRole('dialog', { name: 'Diamond' });
    const heldBySelect = within(dialog).getByLabelText(
      'Held by'
    ) as HTMLSelectElement;
    const targetOption = within(heldBySelect).getByRole('option', {
      name: 'Character 2',
    }) as HTMLOptionElement;
    fireEvent.change(heldBySelect, {
      target: { value: targetOption.value },
    });

    expect(within(dialog).getByLabelText('Stored in')).toHaveDisplayValue(
      'On person'
    );

    closeTopModal();
    fireEvent.click(screen.getByRole('button', { name: 'Character 2' }));
    fireEvent.click(screen.getByRole('button', { name: 'Edit Diamond' }));

    const transferredDialog = screen.getByRole('dialog', { name: 'Diamond' });
    expect(
      within(transferredDialog).getByLabelText('Stored in')
    ).toHaveDisplayValue('On person');
  });
});
