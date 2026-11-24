export const bodyArmorTypes = [
  'leather',
  'padded',
  'studded',
  'ring',
  'scale',
  'chain',
  'elfin-chain',
  'splint',
  'banded',
  'plate',
] as const;

export type BodyArmor = typeof bodyArmorTypes[number];

// DMG p. 27, Types of Armor & Encumbrance.
export const bodyArmor: Record<BodyArmor, { name: string; move: number }> = {
  leather: { name: 'Leather', move: 12 },
  padded: { name: 'Padded', move: 9 },
  studded: { name: 'Studded leather', move: 9 },
  ring: { name: 'Ring', move: 9 },
  scale: { name: 'Scale', move: 6 },
  chain: { name: 'Chain', move: 9 },
  'elfin-chain': { name: 'Elfin chain', move: 12 },
  splint: { name: 'Splint', move: 6 },
  banded: { name: 'Banded', move: 9 },
  plate: { name: 'Plate', move: 6 },
};
