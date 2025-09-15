import { WeaponOption } from '../types/option';
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
} from './attackerClass';

/**
 * Unearthed Arcana notes:
 *
 * Cavalier does not use pole arms, missile weapons, or other "low social class" arms,
 * including the 2H Sword. This restriction also applies to paladins, which means the
 * UA paladin conflicts with the PHB paladin. Actually, it appears that is only
 * *discouraged*, and allowed without penalty. So for menu purposes, it is "any", the
 * same as fighters.
 *
 * And luckily, all classes can use the same weapons as before. The only changes are new weapons:
 *
 * Cleric: lasso, sap, and staff-sling
 * Druid: aklys, garrot, lasso, sap, staff sling, khopesh sword, whip
 * Magic-User: caltrop, knife, sling
 * Thief: short bow, caltrop, hand crossbow, garrot, knife, sap, falchion sword
 * Acrobat: as thief, plus lasso and staff
 * Monk: aklys, atlatl, caltrop, hand crossbow, garrot, knife, lasso, sap, falchion sword,
 *      hook fauchard (pole arm), man catcher (pole arm)
 * Bard: garrot, knife, lasso, sap, falchion sword
 */
const clericWeapons = [13, 14, 22, 23, 24, 31, 32, 33, 39, 40, 53];
// const clericWeapons = [
//   "Club (Held)",
//   "Club (Hurled)",
//   "Fist or Open Hand",
//   "Flail, Footman’s",
//   "Flail, Horseman’s",
//   "Hammer, Lucern",
//   "Hammer (Held)",
//   "Hammer (Hurled)",
//   "Mace, Footman’s",
//   "Mace, Horseman’s",
//   "Staff, quarter",
// ];
const druidWeapons = [
  13, 14, 17, 18, 19, 22, 31, 32, 33, 47, 48, 49, 50, 51, 53,
];
// const druidWeapons = [
//   "Club (Held)",
//   "Club (Hurled)",
//   "Dagger (Held)",
//   "Dagger (Hurled)",
//   "Dart",
//   "Fist or Open Hand",
//   "Hammer, Lucern",
//   "Hammer (Held)",
//   "Hammer (Hurled)",
//   "Scimitar",
//   "Sling (bullet)",
//   "Sling (stone)",
//   "Spear (held)",
//   "Spear (hurled)",
//   "Staff, quarter",
// ];
const magicUserWeapons = [17, 18, 19, 22, 53];
// const magicuserWeapons = [
//   "Dagger (Held)",
//   "Dagger (Hurled)",
//   "Dart",
//   "Fist or Open Hand",
//   "Staff, quarter",
// ];
const thiefWeapons = [13, 14, 17, 18, 19, 22, 48, 49, 55, 56, 57];
// const thiefWeapons = [
//   "Club (Held)",
//   "Club (Hurled)",
//   "Dagger (Held)",
//   "Dagger (Hurled)",
//   "Dart",
//   "Fist or Open Hand",
//   "Sling (bullet)",
//   "Sling (stone)",
//   "Sword, broad",
//   "Sword, long",
//   "Sword, short",
// ];
const monkWeapons = [
  3, 4, 5, 6, 7, 8, 13, 14, 15, 16, 17, 18, 20, 21, 22, 25, 26, 27, 28, 29, 30,
  31, 34, 35, 36, 37, 38, 42, 45, 46, 50, 51, 52, 53, 59, 60,
];
// const monkWeapons = [
//   "Axe, Hand (Held)",
//   "Axe, Hand (Hurled)",
//   "Bardiche",
//   "Bec de Corbin",
//   "Bill-Guisarme",
//   "Bo Stick",
//   "Club (Held)",
//   "Club (Hurled)",
//   "Crossbow, heavy",
//   "Crossbow, light",
//   "Dagger (Held)",
//   "Dagger (Hurled)",
//   "Fauchard",
//   "Fauchard-Fork",
//   "Fist or Open Hand",
//   "Fork, Military",
//   "Glaive",
//   "Glaive-Guisarme",
//   "Guisarme",
//   "Guisarme-Voulge",
//   "Halberd",
//   "Hammer, Lucern",
//   "Javelin",
//   "Jo Stick",
//   "Lance (heavy horse)",
//   "Lance (light horse)",
//   "Lance (medium horse)",
//   "Partisan",
//   "Pike, awl",
//   "Ranseur",
//   "Spear (held)",
//   "Spear (hurled)",
//   "Spetum",
//   "Staff, quarter",
//   "Trident",
//   "Voulge",
// ];
const bardWeapons = [
  13, 14, 17, 18, 19, 22, 34, 47, 48, 49, 50, 51, 53, 54, 55, 56, 57,
];
// const bardWeapons = [
//   "Club (Held)",
//   "Club (Hurled)",
//   "Dagger (Held)",
//   "Dagger (Hurled)",
//   "Dart",
//   "Fist or Open Hand",
//   "Javelin",
//   "Scimitar",
//   "Sling (bullet)",
//   "Sling (stone)",
//   "Spear (held)",
//   "Spear (hurled)",
//   "Staff, quarter",
//   "Sword, bastard",
//   "Sword, broad",
//   "Sword, long",
//   "Sword, short",
// ];

interface GeneralWeaponInfo {
  name: string;
  acAdjustments: number[];
}
interface MissileWeaponInfo extends GeneralWeaponInfo {
  weaponType: 'missile';
  fireRate: number;
  length?: never; // don't allow length in Missile
  speedFactor?: never; // don't allow speedFactor in Missile
}
interface MeleeWeaponInfo extends GeneralWeaponInfo {
  weaponType: 'melee';
  fireRate?: never; // don't allow fireRate in Melee
  length: number;
  speedFactor: number;
}
interface NaturalWeaponInfo extends GeneralWeaponInfo {
  weaponType: 'natural';
}
export type WeaponInfo =
  | MissileWeaponInfo
  | MeleeWeaponInfo
  | NaturalWeaponInfo;

export const weapons = new Map<number, WeaponInfo>([
  [
    1,
    {
      weaponType: 'natural',
      name: 'Natural Weapon (Monster)',
      acAdjustments: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    },
  ],
  [
    2,
    {
      weaponType: 'melee',
      name: 'Axe, Battle',
      acAdjustments: [-5, -4, -3, -2, -1, -1, 0, 0, 1, 1, 2],
      length: 4,
      speedFactor: 7,
    },
  ],
  [
    3,
    {
      weaponType: 'melee',
      name: 'Axe, Hand (Held)',
      acAdjustments: [-5, -4, -3, -2, -2, -1, 0, 0, 1, 1, 1],
      length: 1.5,
      speedFactor: 4,
    },
  ],
  [
    4,
    {
      weaponType: 'missile',
      name: 'Axe, Hand (Hurled)',
      acAdjustments: [-6, -5, -4, -3, -2, -1, -1, 0, 0, 0, 1],
      fireRate: 1,
    },
  ],
  [
    5,
    {
      weaponType: 'melee',
      name: 'Bardiche',
      acAdjustments: [-3, -2, -2, -1, 0, 0, 1, 1, 2, 2, 3],
      length: 5,
      speedFactor: 9,
    },
  ],
  [
    6,
    {
      weaponType: 'melee',
      name: 'Bec de Corbin',
      acAdjustments: [2, 2, 2, 2, 2, 0, 0, 0, 0, 0, -1],
      length: 6,
      speedFactor: 9,
    },
  ],
  [
    7,
    {
      weaponType: 'melee',
      name: 'Bill-Guisarme',
      acAdjustments: [0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0],
      length: 8,
      speedFactor: 10,
    },
  ],
  [
    8,
    {
      weaponType: 'melee',
      name: 'Bo Stick',
      acAdjustments: [-13, -11, -9, -7, -5, -3, -1, 0, 1, 0, 3],
      length: 5,
      speedFactor: 3,
    },
  ],
  [
    9,
    {
      weaponType: 'missile',
      name: 'Bow, composite, long',
      acAdjustments: [-4, -3, -2, -1, -0, 0, 1, 2, 2, 3, 3],
      fireRate: 2,
    },
  ],
  [
    10,
    {
      weaponType: 'missile',
      name: 'Bow, composite, short',
      acAdjustments: [-4, -4, -3, -3, -1, 0, 1, 2, 2, 2, 3],
      fireRate: 2,
    },
  ],
  [
    11,
    {
      weaponType: 'missile',
      name: 'Bow, long',
      acAdjustments: [-2, -1, -1, 0, 0, 1, 2, 3, 3, 3, 3],
      fireRate: 2,
    },
  ],
  [
    12,
    {
      weaponType: 'missile',
      name: 'Bow, short',
      acAdjustments: [-7, -6, -5, -4, -1, 0, 0, 1, 2, 2, 2],
      fireRate: 2,
    },
  ],
  [
    13,
    {
      weaponType: 'melee',
      name: 'Club (Held)',
      acAdjustments: [-7, -6, -5, -4, -3, -2, -1, -1, 0, 0, 1],
      length: 3,
      speedFactor: 4,
    },
  ],
  [
    14,
    {
      weaponType: 'missile',
      name: 'Club (Hurled)',
      acAdjustments: [-9, -8, -7, -5, -3, -2, -1, -1, -1, 0, 0],
      fireRate: 1,
    },
  ],
  [
    15,
    {
      weaponType: 'missile',
      name: 'Crossbow, heavy',
      acAdjustments: [-2, -1, -1, 0, 1, 2, 3, 3, 4, 4, 4],
      fireRate: 0.5,
    },
  ],
  [
    16,
    {
      weaponType: 'missile',
      name: 'Crossbow, light',
      acAdjustments: [-3, -2, -2, -1, 0, 0, 1, 2, 3, 3, 3],
      fireRate: 1,
    },
  ],
  [
    17,
    {
      weaponType: 'melee',
      name: 'Dagger (Held)',
      acAdjustments: [-4, -4, -3, -3, -2, -2, 0, 0, 1, 1, 3],
      length: 1.25,
      speedFactor: 2,
    },
  ],
  [
    18,
    {
      weaponType: 'missile',
      name: 'Dagger (Hurled)',
      acAdjustments: [-7, -6, -5, -4, -3, -2, -1, -1, 0, 0, 1],
      fireRate: 2,
    },
  ],
  [
    19,
    {
      weaponType: 'missile',
      name: 'Dart',
      acAdjustments: [-7, -6, -5, -4, -3, -2, -1, 0, 1, 0, 1],
      fireRate: 3,
    },
  ],
  [
    20,
    {
      weaponType: 'melee',
      name: 'Fauchard',
      acAdjustments: [-3, -3, -2, -2, -1, -1, 0, 0, 0, -1, -1],
      length: 8,
      speedFactor: 8,
    },
  ],
  [
    21,
    {
      weaponType: 'melee',
      name: 'Fauchard-Fork',
      acAdjustments: [-2, -2, -1, -1, -1, 0, 0, 0, 1, 0, 1],
      length: 8,
      speedFactor: 8,
    },
  ],
  [
    22,
    {
      weaponType: 'melee',
      name: 'Fist or Open Hand',
      acAdjustments: [-9, -8, -7, -5, -3, -1, 0, 0, 2, 0, 4],
      length: 2,
      speedFactor: 1,
    },
  ],
  [
    23,
    {
      weaponType: 'melee',
      name: 'Flail, Footman’s',
      acAdjustments: [3, 3, 2, 2, 1, 2, 1, 1, 1, 1, -1],
      length: 4,
      speedFactor: 7,
    },
  ],
  [
    24,
    {
      weaponType: 'melee',
      name: 'Flail, Horseman’s',
      acAdjustments: [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0],
      length: 2,
      speedFactor: 6,
    },
  ],
  [
    25,
    {
      weaponType: 'melee',
      name: 'Fork, Military',
      acAdjustments: [-3, -3, -2, -2, -1, 0, 0, 1, 1, 0, 1],
      length: 7,
      speedFactor: 7,
    },
  ],
  [
    26,
    {
      weaponType: 'melee',
      name: 'Glaive',
      acAdjustments: [-2, -2, -1, -1, 0, 0, 0, 0, 0, 0, 0],
      length: 8,
      speedFactor: 8,
    },
  ],
  [
    27,
    {
      weaponType: 'melee',
      name: 'Glaive-Guisarme',
      acAdjustments: [-2, -2, -1, -1, 0, 0, 0, 0, 0, 0, 0],
      length: 8,
      speedFactor: 9,
    },
  ],
  [
    28,
    {
      weaponType: 'melee',
      name: 'Guisarme',
      acAdjustments: [-3, -3, -2, -2, -1, -1, 0, 0, 0, -1, -1],
      length: 6,
      speedFactor: 8,
    },
  ],
  [
    29,
    {
      weaponType: 'melee',
      name: 'Guisarme-Voulge',
      acAdjustments: [-2, -2, -1, -1, 0, 1, 1, 1, 0, 0, 0],
      length: 7,
      speedFactor: 10,
    },
  ],
  [
    30,
    {
      weaponType: 'melee',
      name: 'Halberd',
      acAdjustments: [0, 1, 1, 1, 1, 2, 2, 2, 1, 1, 0],
      length: 5,
      speedFactor: 9,
    },
  ],
  [
    31,
    {
      weaponType: 'melee',
      name: 'Hammer, Lucern',
      acAdjustments: [0, 1, 1, 1, 2, 2, 2, 1, 1, 0, 0],
      length: 5,
      speedFactor: 9,
    },
  ],
  [
    32,
    {
      weaponType: 'melee',
      name: 'Hammer (Held)',
      acAdjustments: [0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0],
      length: 1.5,
      speedFactor: 4,
    },
  ],
  [
    33,
    {
      weaponType: 'missile',
      name: 'Hammer (Hurled)',
      acAdjustments: [-4, -3, -2, -1, 0, 0, 0, 0, 0, 0, 1],
      fireRate: 1,
    },
  ],
  [
    34,
    {
      weaponType: 'missile',
      name: 'Javelin',
      acAdjustments: [-7, -6, -5, -4, -3, -2, -1, 0, 1, 0, 1],
      fireRate: 1,
    },
  ],
  [
    35,
    {
      weaponType: 'melee',
      name: 'Jo Stick',
      acAdjustments: [-10, -9, -8, -6, -4, -2, -1, 0, 1, 0, 2],
      length: 3,
      speedFactor: 2,
    },
  ],
  [
    36,
    {
      weaponType: 'melee',
      name: 'Lance (heavy horse)',
      acAdjustments: [4, 4, 3, 3, 2, 2, 2, 1, 1, 0, 0],
      length: 14,
      speedFactor: 8,
    },
  ],
  [
    37,
    {
      weaponType: 'melee',
      name: 'Lance (light horse)',
      acAdjustments: [-3, -3, -2, -2, -1, 0, 0, 0, 0, 0, 0],
      length: 10,
      speedFactor: 7,
    },
  ],
  [
    38,
    {
      weaponType: 'melee',
      name: 'Lance (medium horse)',
      acAdjustments: [-1, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0],
      length: 12,
      speedFactor: 6,
    },
  ],
  [
    39,
    {
      weaponType: 'melee',
      name: 'Mace, Footman’s',
      acAdjustments: [2, 2, 1, 1, 0, 0, 0, 0, 0, 1, -1],
      length: 2.5,
      speedFactor: 7,
    },
  ],
  [
    40,
    {
      weaponType: 'melee',
      name: 'Mace, Horseman’s',
      acAdjustments: [2, 2, 1, 1, 0, 0, 0, 0, 0, 0, 0],
      length: 1.5,
      speedFactor: 6,
    },
  ],
  [
    41,
    {
      weaponType: 'melee',
      name: 'Morning Star',
      acAdjustments: [0, 0, 0, 1, 1, 1, 1, 1, 1, 2, 2],
      length: 4,
      speedFactor: 7,
    },
  ],
  [
    42,
    {
      weaponType: 'melee',
      name: 'Partisan',
      acAdjustments: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      length: 7,
      speedFactor: 9,
    },
  ],
  [
    43,
    {
      weaponType: 'melee',
      name: 'Pick, Military, Footman’s',
      acAdjustments: [3, 3, 2, 2, 1, 1, 0, -1, -1, -1, -2],
      length: 4,
      speedFactor: 7,
    },
  ],
  [
    44,
    {
      weaponType: 'melee',
      name: 'Pick, Military, Horseman’s',
      acAdjustments: [2, 2, 1, 1, 1, 1, 0, 0, -1, -1, -1],
      length: 2,
      speedFactor: 5,
    },
  ],
  [
    45,
    {
      weaponType: 'melee',
      name: 'Pike, awl',
      acAdjustments: [-1, -1, -1, 0, 0, 0, 0, 0, 0, -1, -2],
      length: 18,
      speedFactor: 13,
    },
  ],
  [
    46,
    {
      weaponType: 'melee',
      name: 'Ranseur',
      acAdjustments: [-3, -3, -2, -1, -1, 0, 0, 0, 0, 0, 1],
      length: 8,
      speedFactor: 8,
    },
  ],
  [
    47,
    {
      weaponType: 'melee',
      name: 'Scimitar',
      acAdjustments: [-4, -3, -3, -2, -2, -1, 0, 0, 1, 1, 3],
      length: 3,
      speedFactor: 4,
    },
  ],
  [
    48,
    {
      weaponType: 'missile',
      name: 'Sling (bullet)',
      acAdjustments: [-3, -3, -2, -2, -1, 0, 0, 0, 2, 1, 3],
      fireRate: 1,
    },
  ],
  [
    49,
    {
      weaponType: 'missile',
      name: 'Sling (stone)',
      acAdjustments: [-7, -6, -5, -4, -2, -1, 0, 0, 2, 1, 3],
      fireRate: 1,
    },
  ],
  [
    50,
    {
      weaponType: 'melee',
      name: 'Spear (held)',
      acAdjustments: [-2, -2, -2, -1, -1, -1, 0, 0, 0, 0, 0],
      length: 9,
      speedFactor: 7,
    },
  ],
  [
    51,
    {
      weaponType: 'missile',
      name: 'Spear (hurled)',
      acAdjustments: [-4, -4, -3, -3, -2, -2, -1, 0, 0, 0, 0],
      fireRate: 1,
    },
  ],
  [
    52,
    {
      weaponType: 'melee',
      name: 'Spetum',
      acAdjustments: [-2, -2, -2, -1, 0, 0, 0, 0, 0, 1, 2],
      length: 8,
      speedFactor: 8,
    },
  ],
  [
    53,
    {
      weaponType: 'melee',
      name: 'Staff, quarter',
      acAdjustments: [-9, -8, -7, -5, -3, -1, 0, 0, 1, 1, 1],
      length: 7,
      speedFactor: 4,
    },
  ],
  [
    54,
    {
      weaponType: 'melee',
      name: 'Sword, bastard',
      acAdjustments: [0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0],
      length: 4.5,
      speedFactor: 6,
    },
  ],
  [
    55,
    {
      weaponType: 'melee',
      name: 'Sword, broad',
      acAdjustments: [-5, -4, -3, -2, -1, 0, 0, 1, 1, 1, 2],
      length: 3.5,
      speedFactor: 5,
    },
  ],
  [
    56,
    {
      weaponType: 'melee',
      name: 'Sword, long',
      acAdjustments: [-4, -3, -2, -1, 0, 0, 0, 0, 0, 1, 2],
      length: 3.5,
      speedFactor: 5,
    },
  ],
  [
    57,
    {
      weaponType: 'melee',
      name: 'Sword, short',
      acAdjustments: [-5, -4, -3, -2, -1, 0, 0, 0, 1, 0, 2],
      length: 2,
      speedFactor: 3,
    },
  ],
  [
    58,
    {
      weaponType: 'melee',
      name: 'Sword, two-handed',
      acAdjustments: [2, 2, 2, 2, 2, 2, 3, 3, 3, 1, 0],
      length: 6,
      speedFactor: 10,
    },
  ],
  [
    59,
    {
      weaponType: 'melee',
      name: 'Trident',
      acAdjustments: [-4, -3, -3, -2, -1, -1, 0, 0, 1, 0, 1],
      length: 6,
      speedFactor: 7,
    },
  ],
  [
    60,
    {
      weaponType: 'melee',
      name: 'Voulge',
      acAdjustments: [-2, -2, -1, -1, 0, 1, 1, 1, 0, 0, 0],
      length: 8,
      speedFactor: 10,
    },
  ],
]);

export const uaWeapons = new Map<number, WeaponInfo>([
  [
    61,
    {
      weaponType: 'melee',
      name: 'Aklys (held)',
      acAdjustments: [-7, -6, -5, -4, -3, -2, -1, -1, 0, 0, 1],
      length: 2,
      speedFactor: 4, // UA says 4 (+1) with no explanation. For melee it's just a club though, which is 4.
    },
  ],
  [
    62,
    {
      weaponType: 'missile',
      name: 'Aklys (hurled)',
      acAdjustments: [-8, -7, -6, -5, -4, -3, -2, -1, 0, 0, 0],
      fireRate: 1,
    },
  ],
  [
    63,
    {
      weaponType: 'missile',
      name: 'Atlatl (javelin)', // UA also has Atlatl in melee section with a 3' length, no SF
      acAdjustments: [-6, -5, -4, -3, -2, -1, 0, 0, 1, 1, 2],
      fireRate: 1,
    },
  ],
  [
    64,
    {
      weaponType: 'missile',
      name: 'Blowgun Needle', // UA also has Blowgun in melee section with a 4'-7' length, no SF
      acAdjustments: [-14, -12, -10, -8, -6, -4, -2, -1, -1, 1, 2],
      fireRate: 2,
    },
  ],
  [
    65,
    {
      weaponType: 'natural',
      name: 'Caltrop', // Caltrops are so weird. 1+1 HD monster attack, no proficiency
      acAdjustments: [-8, -7 - 6, -5, -4, -3, -2, -1, 0, 1, 2],
    },
  ],
  [
    66,
    {
      weaponType: 'missile',
      name: 'Crossbow, hand',
      acAdjustments: [-6, -4, -2, -1, 0, 0, 0, 1, 2, 2, 3],
      fireRate: 1,
    },
  ],
  [
    67,
    {
      weaponType: 'melee',
      name: 'Garrot',
      length: 3,
      acAdjustments: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      speedFactor: 2,
    },
  ],
  [
    68,
    {
      weaponType: 'melee',
      name: 'Harpoon (Held)',
      acAdjustments: [-3, -2, -2, -1, -1, -1, 0, 0, 0, 0, 0],
      length: 7,
      speedFactor: 6,
    },
  ],
  [
    69,
    {
      weaponType: 'missile',
      name: 'Harpoon (Hurled)',
      acAdjustments: [-6, -5, -4, -3, -2, -1, 0, 0, 0, 0, 1],
      fireRate: 1,
    },
  ],
  [
    70,
    {
      weaponType: 'melee',
      name: 'Hook Fauchard',
      acAdjustments: [-3, -3, -2, -2, -1, -1, 0, 0, 0, 0, -1],
      length: 8,
      speedFactor: 9,
    },
  ],
  [
    71,
    {
      weaponType: 'melee',
      name: 'Knife (held)',
      acAdjustments: [-6, -5, -5, -4, -3, -2, -1, 0, 1, 1, 3],
      length: 1,
      speedFactor: 2,
    },
  ],
  [
    72,
    {
      weaponType: 'missile',
      name: 'Knife (hurled)',
      acAdjustments: [-8, -7, -6, -5, -4, -3, -2, -1, 0, 0, 1],
      fireRate: 2,
    },
  ],
  [
    73,
    {
      weaponType: 'melee',
      name: 'Lasso (held)',
      acAdjustments: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      length: 15,
      speedFactor: 10,
    },
  ],
  [
    74,
    {
      weaponType: 'missile',
      name: 'Lasso (hurled)',
      acAdjustments: [9, 8, 7, 6, 5, 4, 3, 2, 1, 0, -1],
      fireRate: 0.5,
    },
  ],
  [
    75,
    {
      weaponType: 'melee',
      name: 'Man Catcher',
      acAdjustments: [0, 0, 0, 0, 0, 0, 0, 0, -1, -2, -3],
      length: 8,
      speedFactor: 7,
    },
  ],
  [
    76,
    {
      weaponType: 'melee',
      name: 'Sap',
      acAdjustments: [-14, -13, -12, -10, -8, -6, -5, -4, -3, -2, 0],
      length: 0.5,
      speedFactor: 2,
    },
  ],
  [
    77,
    {
      weaponType: 'melee',
      name: 'Spiked Buckler',
      acAdjustments: [-7, -6, -5, -4, -3, -2, -1, 0, 0, 0, 2],
      length: 1,
      speedFactor: 4,
    },
  ],
  [
    78,
    {
      weaponType: 'missile',
      name: 'Staff Sling (bullet)', // Also listed as melee with length 5, SF 11, but it's missile-only
      acAdjustments: [-5, -4, -3, -2, -1, 0, 0, 0, 0, 0, 0],
      fireRate: 0.5,
    },
  ],
  [
    79,
    {
      weaponType: 'missile',
      name: 'Staff Sling (stone)', // Also listed as melee with length 5, SF 11, but it's missile-only
      acAdjustments: [-6, -5, -4, -3, -2, -1, 0, 0, 0, 0, 0],
      fireRate: 0.5,
    },
  ],
  [
    80,
    {
      weaponType: 'melee',
      name: 'Sword, falchion',
      acAdjustments: [-3, -2, -2, -1, 0, 1, 1, 1, 1, 0, 0],
      length: 3.5,
      speedFactor: 5,
    },
  ],
  [
    81,
    {
      weaponType: 'melee',
      name: 'Sword, khopesh',
      acAdjustments: [-7, -6, -5, -4, -2, -1, 0, 0, 1, 1, 2],
      length: 3.5,
      speedFactor: 9,
    },
  ],
  [
    82,
    {
      weaponType: 'melee',
      name: 'Whip',
      acAdjustments: [-14, -12, -10, -8, -6, -4, -2, -1, 1, 0, 3],
      length: 14, // 8-20
      speedFactor: 6, // 5-8
    },
  ],
]);

export const getWeaponAdjustment = (
  weapon: number,
  armorType: number
): number => {
  const weaponProps = weapons.get(weapon);
  if (weaponProps) {
    const weaponAdjustment = weaponProps.acAdjustments[armorType];
    if (weaponAdjustment || weaponAdjustment === 0) {
      return weaponAdjustment;
    } else {
      console.error(
        `Couldn't find weapon adjustment for weapon ${weapon} and armorType ${armorType}; returning 0`
      );
      return 0;
    }
  } else {
    console.error(
      `Couldn't find weapon ${weapon} for armorType ${armorType}; returning 0`
    );
    return 0;
  }
};

const filterWeaponClasses = (
  weapons: Map<number, WeaponInfo>,
  restrictions: number[]
): Map<number, WeaponInfo> =>
  new Map(
    Array.from(weapons).filter((option) => restrictions.includes(option[0]))
  );

const weaponClasses = new Map<number, Map<number, WeaponInfo>>([
  [MONSTER, weapons],
  [CLERIC, filterWeaponClasses(weapons, clericWeapons)],
  [DRUID, filterWeaponClasses(weapons, druidWeapons)],
  [FIGHTER, new Map(Array.from(weapons).slice(1))],
  [PALADIN, new Map(Array.from(weapons).slice(1))],
  [RANGER, new Map(Array.from(weapons).slice(1))],
  [MAGIC_USER, filterWeaponClasses(weapons, magicUserWeapons)],
  [ILLUSIONIST, filterWeaponClasses(weapons, magicUserWeapons)],
  [THIEF, filterWeaponClasses(weapons, thiefWeapons)],
  [ASSASSIN, new Map(Array.from(weapons).slice(1))],
  [MONK, filterWeaponClasses(weapons, monkWeapons)],
  [BARD, filterWeaponClasses(weapons, bardWeapons)],
]);

const constructOptions = (
  weaponOptions: Map<number, WeaponInfo>
): WeaponOption[] =>
  Array.from(weaponOptions).map(
    ([weaponId, weaponInfo]: [number, WeaponInfo]) => ({
      value: weaponId,
      label: weaponInfo.name,
    })
  );

export const getWeaponOptions = (attackerClass: number): WeaponOption[] => {
  const classWeapons = weaponClasses.get(attackerClass);
  if (classWeapons) {
    return constructOptions(classWeapons);
  } else {
    console.error(`Unable to get weapons for class ${attackerClass}`);
    return constructOptions(weapons);
  }
};
