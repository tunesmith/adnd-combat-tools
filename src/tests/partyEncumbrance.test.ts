import { characterLoad } from '../helpers/partyEncumbrance';
import { emptyProfile } from '../helpers/campaignParty';
import { emptyProfileReference } from '../helpers/campaignPartyModel';
import type {
  EncumbranceDmCharacter,
  EncumbranceInventoryItem,
} from '../types/encumbrance';

const profile = {
  ...emptyProfile('act', 'fighter'),
  reference: emptyProfileReference(),
};
const armor: EncumbranceInventoryItem = {
  id: 'suit',
  catalogId: 'armor-plate',
  quantity: 1,
  containerId: null,
  day: 0,
  playerNotes: '',
  playerKnowsValue: false,
  playerMagicKnowledge: 'unknown',
};
const holder: EncumbranceDmCharacter = {
  id: 'inventory',
  name: 'Fighter',
  strength: { score: 8, exceptional: 'none' },
  dmNotes: '',
  inventory: [armor],
};
const wearing = {
  ...profile,
  reference: { ...profile.reference, wornArmor: { itemId: 'suit' } },
};

test('worn armor requires a recorded choice and a suit still on the character', () => {
  expect(characterLoad(profile)).toBeUndefined();
  expect(characterLoad(profile, { ...holder, inventory: [] })).toMatchObject({
    load: 0,
    room: 350,
    armorName: 'Unknown',
    finalMove: undefined,
  });
  expect(characterLoad(profile, holder)).toMatchObject({
    load: 450,
    armorName: 'Unknown',
    finalMove: undefined,
  });
  expect(
    characterLoad(
      { ...profile, reference: { ...profile.reference, wornArmor: null } },
      holder
    )
  ).toMatchObject({ load: 450, armorMove: 12, finalMove: '9″' });
  expect(characterLoad(wearing, holder)).toMatchObject({
    armorName: 'Plate',
    armorMove: 6,
    finalMove: '6″',
  });
  expect(
    characterLoad(wearing, {
      ...holder,
      inventory: [
        { ...armor, id: 'bag', catalogId: 'backpack' },
        { ...armor, containerId: 'bag' },
      ],
    })
  ).toMatchObject({ armorName: 'Unknown', finalMove: undefined });
  expect(characterLoad(wearing, { ...holder, inventory: [] })).toMatchObject({
    armorName: 'Unknown',
    finalMove: undefined,
  });
});

test('one worn magical suit is weightless, carried copies retain their Gear weight, and other gear still constrains movement', () => {
  const magical = { ...armor, isMagical: true };
  expect(
    characterLoad(profile, { ...holder, inventory: [magical] })
  ).toMatchObject({ load: 450 });
  expect(
    characterLoad(wearing, {
      ...holder,
      inventory: [{ ...magical, quantity: 2 }],
    })
  ).toMatchObject({ load: 450, armorMove: 12, finalMove: '9″' });
  expect(
    characterLoad(wearing, {
      ...holder,
      inventory: [
        { ...magical, id: 'bag', catalogId: 'backpack' },
        { ...magical, containerId: 'bag', encumbranceGpOverride: 85 },
      ],
    })
  ).toMatchObject({ load: 105, armorName: 'Unknown' });
  const load = (weight: number) =>
    characterLoad(wearing, {
      ...holder,
      inventory: [
        magical,
        { ...armor, id: 'weight', catalogId: 'coin-gold', quantity: weight },
      ],
    });
  expect(load(350)).toMatchObject({
    load: 350,
    room: 0,
    armorMove: 12,
    finalMove: '12″',
  });
  expect(load(1500)).toMatchObject({ finalMove: '3–4″' });
  expect(load(1501)).toMatchObject({ finalMove: '0″' });
});
