// const druidArmor = ["10", "9", "8", "7"];
// const magicUserArmor = ["10"];
// const thiefArmor = ["10", "8"];
// const assassinArmor = ["10", "9", "8", "7"];
// const bardArmor = ["10", "8", "5"];

import { ExpandedArmorTypeOption } from "../types/option";
import {
  ASSASSIN,
  BARD,
  CLERIC,
  DRUID,
  FIGHTER,
  ILLUSIONIST,
  MAGIC_USER,
  MONK,
  MONSTER,
  PALADIN,
  RANGER,
  THIEF,
} from "./attackerClass";

/**
 * Unearthed Arcana notes:
 *
 * Cavalier does not wear leather, padded, or studded leather armor. This restriction
 * also applies to paladin, so UA paladin conflicts with PHB paladin.
 *
 * UA Druid can also wear padded armor, unlike PHB Druid.
 *
 * UA Thief can also wear studded leather, padded, or elfin chain for combat purposes.
 *
 * UA Assassin can also wear studded leather, padded, or elfin chain.
 *
 * Unlike the PHB Assassin, they cannot carry a shield. Ah but wait! That's in the
 * errata. UA Assassin *can* carry a shield, just not in a round when they are
 * engaged in an assassination act.
 *
 * UA Bard can also wear studded leather, padded, ring mail, or elfin chain, as
 * well as the PHB Bard's leather and magical chain.
 */
const expandedDruidArmor = [2, 3, 4, 6];
const expandedMagicUserArmor = [2];
const expandedThiefArmor = [2, 4];
const expandedAssassinArmor = [2, 3, 4, 6];
const expandedBardArmor = [2, 4, 14];

/**
 * Expanded armor props to shrink display of labels in battle grid
 */
interface ExpandedArmorProps {
  key: number;
  armorType: number | null;
  armorDescription: string;
}
export const expandedArmorTypes: ExpandedArmorProps[] = [
  {
    key: 1,
    armorType: null,
    armorDescription: "Natural armor (Monster)",
  },
  {
    key: 2,
    armorType: 10,
    armorDescription: "AT 10 - No Armor",
  },
  {
    key: 3,
    armorType: 9,
    armorDescription: "AT 9 - Shield only",
  },
  {
    key: 4,
    armorType: 8,
    armorDescription: "AT 8 - Leather armor",
  },
  {
    key: 5,
    armorType: 8,
    armorDescription: "AT 8 - Padded armor",
  },
  {
    key: 6,
    armorType: 7,
    armorDescription: "AT 7 - Leather armor + shield",
  },
  {
    key: 7,
    armorType: 7,
    armorDescription: "AT 7 - Padded armor + shield",
  },
  {
    key: 8,
    armorType: 7,
    armorDescription: "AT 7 - Studded leather",
  },
  {
    key: 9,
    armorType: 7,
    armorDescription: "AT 7 - Ring mail",
  },
  {
    key: 10,
    armorType: 6,
    armorDescription: "AT 6 - Studded leather + shield",
  },
  {
    key: 11,
    armorType: 6,
    armorDescription: "AT 6 - Ring mail + shield",
  },
  {
    key: 12,
    armorType: 6,
    armorDescription: "AT 6 - Scale mail",
  },
  {
    key: 13,
    armorType: 5,
    armorDescription: "AT 5 - Scale mail + shield",
  },
  {
    key: 14,
    armorType: 5,
    armorDescription: "AT 5 - Chain mail",
  },
  {
    key: 15,
    armorType: 4,
    armorDescription: "AT 4 - Chain mail + shield",
  },
  {
    key: 16,
    armorType: 4,
    armorDescription: "AT 4 - Splint mail",
  },
  {
    key: 17,
    armorType: 4,
    armorDescription: "AT 4 - Banded mail",
  },
  {
    key: 18,
    armorType: 3,
    armorDescription: "AT 3 - Splint mail + shield",
  },
  {
    key: 19,
    armorType: 3,
    armorDescription: "AT 3 - Banded mail + shield",
  },
  {
    key: 20,
    armorType: 3,
    armorDescription: "AT 3 - Plate mail",
  },
  {
    key: 21,
    armorType: 2,
    armorDescription: "AT 2 - Plate mail + shield",
  },
];

const filterExpandedArmorTypes = (
  expandedArmorTypes: ExpandedArmorProps[],
  restrictions: number[]
) => expandedArmorTypes.filter((props) => restrictions.includes(props.key));

const expandedArmorTypeClasses = new Map<number, () => ExpandedArmorProps[]>([
  [MONSTER, () => expandedArmorTypes],
  [CLERIC, () => expandedArmorTypes.slice(1)],
  [
    DRUID,
    () => filterExpandedArmorTypes(expandedArmorTypes, expandedDruidArmor),
  ],
  [FIGHTER, () => expandedArmorTypes.slice(1)],
  [PALADIN, () => expandedArmorTypes.slice(1)],
  [RANGER, () => expandedArmorTypes.slice(1)],
  [
    MAGIC_USER,
    () => filterExpandedArmorTypes(expandedArmorTypes, expandedMagicUserArmor),
  ],
  [
    ILLUSIONIST,
    () => filterExpandedArmorTypes(expandedArmorTypes, expandedMagicUserArmor),
  ],
  [
    THIEF,
    () => filterExpandedArmorTypes(expandedArmorTypes, expandedThiefArmor),
  ],
  [
    ASSASSIN,
    () => filterExpandedArmorTypes(expandedArmorTypes, expandedAssassinArmor),
  ],
  [
    MONK,
    () => filterExpandedArmorTypes(expandedArmorTypes, expandedMagicUserArmor),
  ],
  [BARD, () => filterExpandedArmorTypes(expandedArmorTypes, expandedBardArmor)],
]);

export const getExpandedArmorOptionsByClass = (
  attackerClass: number
): ExpandedArmorTypeOption[] => {
  const armorTypeProps = expandedArmorTypeClasses.get(attackerClass);
  if (armorTypeProps) {
    return armorTypeProps().map((prop: ExpandedArmorProps) => ({
      value: prop.key,
      label: prop.armorDescription,
    }));
  } else {
    console.error(
      `Couldn't return armor types for attacker class ${attackerClass}; returning all armor types`
    );
    return expandedArmorTypes.map((prop: ExpandedArmorProps) => ({
      value: prop.key,
      label: prop.armorDescription,
    }));
  }
};

const armorTypes = {
  " ": "Natural Armor (Monster)",
  10: "AT 10 - No Armor",
  9: "AT 9 - Shield only",
  8: "AT 8 - Leather or padded armor",
  7: "AT 7 - Leather or padded armor + shield / studded leather / ring mail",
  6: "AT 6 - Studded leather or ring mail + shield / scale mail",
  5: "AT 5 - Scale mail + shield / chain mail",
  4: "AT 4 - Chain mail + shield / splint mail / banded mail",
  3: "AT 3 - Splint or banded mail + shield / plate mail",
  2: "AT 2 - Plate mail + shield",
};

// const filterArmorTypes = (armorTypes, restrictions: string[]) =>
//   Object.entries(armorTypes).filter((option) =>
//     restrictions.includes(option[0])
//   );

// const armorTypeClasses = {
//   monster: () => Object.entries(armorTypes),
//   cleric: () => Object.entries(armorTypes).slice(0, -1),
//   druid: () => filterArmorTypes(armorTypes, druidArmor),
//   fighter: () => Object.entries(armorTypes).slice(0, -1),
//   paladin: () => Object.entries(armorTypes).slice(0, -1),
//   ranger: () => Object.entries(armorTypes).slice(0, -1),
//   magicuser: () => filterArmorTypes(armorTypes, magicUserArmor),
//   illusionist: () => filterArmorTypes(armorTypes, magicUserArmor),
//   thief: () => filterArmorTypes(armorTypes, thiefArmor),
//   assassin: () => filterArmorTypes(armorTypes, assassinArmor),
//   monk: () => filterArmorTypes(armorTypes, magicUserArmor),
//   bard: () => filterArmorTypes(armorTypes, bardArmor),
// };
//
// export const getArmorOptionsByClass = (attackerClass: string) =>
//   armorTypeClasses[attackerClass]()
//     .reverse()
//     .map(([value, label]: [number | string, string]) => ({ value, label }));

export const getArmorOptions = Object.entries(armorTypes)
  .reverse()
  .map(([value, label]) => ({ value, label }));
