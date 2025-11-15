import { RobeOfUsefulItemsExtraPatch } from '../../tables/dungeon/treasureRobeOfUsefulItems';

export type RobeOfUsefulItemsBasePatchType =
  | 'dagger'
  | 'lantern'
  | 'mirror'
  | 'pole'
  | 'rope'
  | 'sack';

export type RobeOfUsefulItemsBasePatchDefinition = {
  type: RobeOfUsefulItemsBasePatchType;
  label: string;
  count: number;
};

export const ROBE_OF_USEFUL_ITEMS_BASE_PATCHES: readonly RobeOfUsefulItemsBasePatchDefinition[] =
  [
    { type: 'dagger', label: 'Dagger', count: 2 },
    { type: 'lantern', label: 'Lantern (filled and lit)', count: 2 },
    { type: 'mirror', label: 'Mirror (large)', count: 2 },
    { type: 'pole', label: "Pole (10')", count: 2 },
    { type: 'rope', label: "Rope (50' coil)", count: 2 },
    { type: 'sack', label: 'Sack (large)', count: 2 },
  ] as const;

const EXTRA_PATCH_DEFINITIONS: Record<
  Exclude<
    RobeOfUsefulItemsExtraPatch,
    RobeOfUsefulItemsExtraPatch.RollTwiceMore
  >,
  { label: string }
> = {
  [RobeOfUsefulItemsExtraPatch.BagOfGoldPieces]: {
    label: 'Bag of 100 gold pieces',
  },
  [RobeOfUsefulItemsExtraPatch.CofferSilver]: {
    label: "Coffer (½' × ½' × 1'), silver (500 g.p. value)",
  },
  [RobeOfUsefulItemsExtraPatch.DoorIron]: {
    label: 'Door, iron (up to 10′ wide and 10′ high, barred on one side)',
  },
  [RobeOfUsefulItemsExtraPatch.Gems]: {
    label: 'Gems (10 × 100 g.p. each)',
  },
  [RobeOfUsefulItemsExtraPatch.LadderWooden]: {
    label: "Ladder, wooden (24')",
  },
  [RobeOfUsefulItemsExtraPatch.MuleWithSaddlebags]: {
    label: 'Mule (with saddle bags)',
  },
  [RobeOfUsefulItemsExtraPatch.Pit]: {
    label: 'Pit (10 cubic feet, open)',
  },
  [RobeOfUsefulItemsExtraPatch.PotionExtraHealing]: {
    label: 'Potion of extra healing',
  },
  [RobeOfUsefulItemsExtraPatch.Rowboat]: {
    label: "Rowboat (12' long)",
  },
  [RobeOfUsefulItemsExtraPatch.ScrollOfOneSpell]: {
    label: 'Scroll of 1 spell',
  },
  [RobeOfUsefulItemsExtraPatch.WarDogsPair]: {
    label: 'War dogs, pair',
  },
  [RobeOfUsefulItemsExtraPatch.Window]: {
    label: "Window (2' × 4', up to 2' deep)",
  },
};

export function robeOfUsefulItemsExtraLabel(
  patch: Exclude<
    RobeOfUsefulItemsExtraPatch,
    RobeOfUsefulItemsExtraPatch.RollTwiceMore
  >
): string {
  return EXTRA_PATCH_DEFINITIONS[patch].label;
}
