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
  weaponType: "missile";
  fireRate: number;
  length?: never; // don't allow length in Missile
  speedFactor?: never; // don't allow speedFactor in Missile
}
interface MeleeWeaponInfo extends GeneralWeaponInfo {
  weaponType: "melee";
  fireRate?: never; // don't allow fireRate in Melee
  length: number;
  speedFactor: number;
}
interface NaturalWeaponInfo extends GeneralWeaponInfo {
  weaponType: "natural";
}
export type WeaponInfo =
  | MissileWeaponInfo
  | MeleeWeaponInfo
  | NaturalWeaponInfo;

export const weapons = new Map<number, WeaponInfo>([
  [
    1,
    {
      weaponType: "natural",
      name: "Natural Weapon (Monster)",
      acAdjustments: [0, 0, 0, 0, 0, 0, 0, 0, 0],
    },
  ],
  [
    2,
    {
      weaponType: "melee",
      name: "Axe, Battle",
      acAdjustments: [-3, -2, -1, -1, 0, 0, 1, 1, 2],
      length: 4,
      speedFactor: 7,
    },
  ],
  [
    3,
    {
      weaponType: "melee",
      name: "Axe, Hand (Held)",
      acAdjustments: [-3, -2, -2, -1, 0, 0, 1, 1, 1],
      length: 1.5,
      speedFactor: 4,
    },
  ],
  [
    4,
    {
      weaponType: "missile",
      name: "Axe, Hand (Hurled)",
      acAdjustments: [-4, -3, -2, -1, -1, 0, 0, 0, 1],
      fireRate: 1,
    },
  ],
  [
    5,
    {
      weaponType: "melee",
      name: "Bardiche",
      acAdjustments: [-2, -1, 0, 0, 1, 1, 2, 2, 3],
      length: 5,
      speedFactor: 9,
    },
  ],
  [
    6,
    {
      weaponType: "melee",
      name: "Bec de Corbin",
      acAdjustments: [2, 2, 2, 0, 0, 0, 0, 0, -1],
      length: 6,
      speedFactor: 9,
    },
  ],
  [
    7,
    {
      weaponType: "melee",
      name: "Bill-Guisarme",
      acAdjustments: [0, 0, 0, 0, 0, 0, 1, 0, 0],
      length: 8,
      speedFactor: 10,
    },
  ],
  [
    8,
    {
      weaponType: "melee",
      name: "Bo Stick",
      acAdjustments: [-9, -7, -5, -3, -1, 0, 1, 0, 3],
      length: 5,
      speedFactor: 3,
    },
  ],
  [
    9,
    {
      weaponType: "missile",
      name: "Bow, composite, long",
      acAdjustments: [-3, -3, -1, 0, 1, 2, 2, 2, 3],
      fireRate: 2,
    },
  ],
  [
    10,
    {
      weaponType: "missile",
      name: "Bow, composite, short",
      acAdjustments: [-3, -3, -1, 0, 1, 2, 2, 2, 3],
      fireRate: 2,
    },
  ],
  [
    11,
    {
      weaponType: "missile",
      name: "Bow, long",
      acAdjustments: [-1, 0, 0, 1, 2, 3, 3, 3, 3],
      fireRate: 2,
    },
  ],
  [
    12,
    {
      weaponType: "missile",
      name: "Bow, short",
      acAdjustments: [-5, -4, -1, 0, 0, 1, 2, 2, 2],
      fireRate: 2,
    },
  ],
  [
    13,
    {
      weaponType: "melee",
      name: "Club (Held)",
      acAdjustments: [-5, -4, -3, -2, -1, -1, 0, 0, 1],
      length: 3,
      speedFactor: 4,
    },
  ],
  [
    14,
    {
      weaponType: "missile",
      name: "Club (Hurled)",
      acAdjustments: [-7, -5, -3, -2, -1, -1, -1, 0, 0],
      fireRate: 1,
    },
  ],
  [
    15,
    {
      weaponType: "missile",
      name: "Crossbow, heavy",
      acAdjustments: [-1, 0, 1, 2, 3, 3, 4, 4, 4],
      fireRate: 0.5,
    },
  ],
  [
    16,
    {
      weaponType: "missile",
      name: "Crossbow, light",
      acAdjustments: [-2, -1, 0, 0, 1, 2, 3, 3, 3],
      fireRate: 1,
    },
  ],
  [
    17,
    {
      weaponType: "melee",
      name: "Dagger (Held)",
      acAdjustments: [-3, -3, -2, -2, 0, 0, 1, 1, 3],
      length: 1.25,
      speedFactor: 2,
    },
  ],
  [
    18,
    {
      weaponType: "missile",
      name: "Dagger (Hurled)",
      acAdjustments: [-5, -4, -3, -2, -1, -1, 0, 0, 1],
      fireRate: 2,
    },
  ],
  [
    19,
    {
      weaponType: "missile",
      name: "Dart",
      acAdjustments: [-5, -4, -3, -2, -1, 0, 1, 0, 1],
      fireRate: 3,
    },
  ],
  [
    20,
    {
      weaponType: "melee",
      name: "Fauchard",
      acAdjustments: [-2, -2, -1, -1, 0, 0, 0, -1, -1],
      length: 8,
      speedFactor: 8,
    },
  ],
  [
    21,
    {
      weaponType: "melee",
      name: "Fauchard-Fork",
      acAdjustments: [-1, -1, -1, 0, 0, 0, 1, 0, 1],
      length: 8,
      speedFactor: 8,
    },
  ],
  [
    22,
    {
      weaponType: "melee",
      name: "Fist or Open Hand",
      acAdjustments: [-7, -5, -3, -1, 0, 0, 2, 0, 4],
      length: 2,
      speedFactor: 1,
    },
  ],
  [
    23,
    {
      weaponType: "melee",
      name: "Flail, Footman’s",
      acAdjustments: [2, 2, 1, 2, 1, 1, 1, 1, -1],
      length: 4,
      speedFactor: 7,
    },
  ],
  [
    24,
    {
      weaponType: "melee",
      name: "Flail, Horseman’s",
      acAdjustments: [0, 0, 0, 0, 0, 1, 1, 1, 0],
      length: 2,
      speedFactor: 6,
    },
  ],
  [
    25,
    {
      weaponType: "melee",
      name: "Fork, Military",
      acAdjustments: [-2, -2, -1, 0, 0, 1, 1, 0, 1],
      length: 7,
      speedFactor: 7,
    },
  ],
  [
    26,
    {
      weaponType: "melee",
      name: "Glaive",
      acAdjustments: [-1, -1, 0, 0, 0, 0, 0, 0, 0],
      length: 8,
      speedFactor: 8,
    },
  ],
  [
    27,
    {
      weaponType: "melee",
      name: "Glaive-Guisarme",
      acAdjustments: [-1, -1, 0, 0, 0, 0, 0, 0, 0],
      length: 8,
      speedFactor: 9,
    },
  ],
  [
    28,
    {
      weaponType: "melee",
      name: "Guisarme",
      acAdjustments: [-2, -2, -1, -1, 0, 0, 0, -1, -1],
      length: 6,
      speedFactor: 8,
    },
  ],
  [
    29,
    {
      weaponType: "melee",
      name: "Guisarme-Voulge",
      acAdjustments: [-1, -1, 0, 1, 1, 1, 0, 0, 0],
      length: 7,
      speedFactor: 10,
    },
  ],
  [
    30,
    {
      weaponType: "melee",
      name: "Halberd",
      acAdjustments: [1, 1, 1, 2, 2, 2, 1, 1, 0],
      length: 5,
      speedFactor: 9,
    },
  ],
  [
    31,
    {
      weaponType: "melee",
      name: "Hammer, Lucern",
      acAdjustments: [1, 1, 2, 2, 2, 1, 1, 0, 0],
      length: 5,
      speedFactor: 9,
    },
  ],
  [
    32,
    {
      weaponType: "melee",
      name: "Hammer (Held)",
      acAdjustments: [0, 1, 0, 1, 0, 0, 0, 0, 0],
      length: 1.5,
      speedFactor: 4,
    },
  ],
  [
    33,
    {
      weaponType: "missile",
      name: "Hammer (Hurled)",
      acAdjustments: [-2, -1, 0, 0, 0, 0, 0, 0, 1],
      fireRate: 1,
    },
  ],
  [
    34,
    {
      weaponType: "missile",
      name: "Javelin",
      acAdjustments: [-5, -4, -3, -2, -1, 0, 1, 0, 1],
      fireRate: 1,
    },
  ],
  [
    35,
    {
      weaponType: "melee",
      name: "Jo Stick",
      acAdjustments: [-8, -6, -4, -2, -1, 0, 1, 0, 2],
      length: 3,
      speedFactor: 2,
    },
  ],
  [
    36,
    {
      weaponType: "melee",
      name: "Lance (heavy horse)",
      acAdjustments: [3, 3, 2, 2, 2, 1, 1, 0, 0],
      length: 14,
      speedFactor: 8,
    },
  ],
  [
    37,
    {
      weaponType: "melee",
      name: "Lance (light horse)",
      acAdjustments: [-2, -2, -1, 0, 0, 0, 0, 0, 0],
      length: 10,
      speedFactor: 7,
    },
  ],
  [
    38,
    {
      weaponType: "melee",
      name: "Lance (medium horse)",
      acAdjustments: [0, 1, 1, 1, 1, 0, 0, 0, 0],
      length: 12,
      speedFactor: 6,
    },
  ],
  [
    39,
    {
      weaponType: "melee",
      name: "Mace, Footman’s",
      acAdjustments: [1, 1, 0, 0, 0, 0, 0, 1, -1],
      length: 2.5,
      speedFactor: 7,
    },
  ],
  [
    40,
    {
      weaponType: "melee",
      name: "Mace, Horseman’s",
      acAdjustments: [1, 1, 0, 0, 0, 0, 0, 0, 0],
      length: 1.5,
      speedFactor: 6,
    },
  ],
  [
    41,
    {
      weaponType: "melee",
      name: "Morning Star",
      acAdjustments: [0, 1, 1, 1, 1, 1, 1, 2, 2],
      length: 4,
      speedFactor: 7,
    },
  ],
  [
    42,
    {
      weaponType: "melee",
      name: "Partisan",
      acAdjustments: [0, 0, 0, 0, 0, 0, 0, 0, 0],
      length: 7,
      speedFactor: 9,
    },
  ],
  [
    43,
    {
      weaponType: "melee",
      name: "Pick, Military, Footman’s",
      acAdjustments: [2, 2, 1, 1, 0, -1, -1, -1, -2],
      length: 4,
      speedFactor: 7,
    },
  ],
  [
    44,
    {
      weaponType: "melee",
      name: "Pick, Military, Horseman’s",
      acAdjustments: [1, 1, 1, 1, 0, 0, -1, -1, -1],
      length: 2,
      speedFactor: 5,
    },
  ],
  [
    45,
    {
      weaponType: "melee",
      name: "Pike, awl",
      acAdjustments: [-1, 0, 0, 0, 0, 0, 0, -1, -2],
      length: 18,
      speedFactor: 13,
    },
  ],
  [
    46,
    {
      weaponType: "melee",
      name: "Ranseur",
      acAdjustments: [-2, -1, -1, 0, 0, 0, 0, 0, 1],
      length: 8,
      speedFactor: 8,
    },
  ],
  [
    47,
    {
      weaponType: "melee",
      name: "Scimitar",
      acAdjustments: [-3, -2, -2, -1, 0, 0, 1, 1, 3],
      length: 3,
      speedFactor: 4,
    },
  ],
  [
    48,
    {
      weaponType: "missile",
      name: "Sling (bullet)",
      acAdjustments: [-2, -2, -1, 0, 0, 0, 2, 1, 3],
      fireRate: 1,
    },
  ],
  [
    49,
    {
      weaponType: "missile",
      name: "Sling (stone)",
      acAdjustments: [-5, -4, -2, -1, 0, 0, 2, 1, 3],
      fireRate: 1,
    },
  ],
  [
    50,
    {
      weaponType: "melee",
      name: "Spear (held)",
      acAdjustments: [-2, -1, -1, -1, 0, 0, 0, 0, 0],
      length: 9,
      speedFactor: 7,
    },
  ],
  [
    51,
    {
      weaponType: "missile",
      name: "Spear (hurled)",
      acAdjustments: [-3, -3, -2, -2, -1, 0, 0, 0, 0],
      fireRate: 1,
    },
  ],
  [
    52,
    {
      weaponType: "melee",
      name: "Spetum",
      acAdjustments: [-2, -1, 0, 0, 0, 0, 0, 1, 2],
      length: 8,
      speedFactor: 8,
    },
  ],
  [
    53,
    {
      weaponType: "melee",
      name: "Staff, quarter",
      acAdjustments: [-7, -5, -3, -1, 0, 0, 1, 1, 1],
      length: 7,
      speedFactor: 4,
    },
  ],
  [
    54,
    {
      weaponType: "melee",
      name: "Sword, bastard",
      acAdjustments: [0, 0, 1, 1, 1, 1, 1, 1, 0],
      length: 4.5,
      speedFactor: 6,
    },
  ],
  [
    55,
    {
      weaponType: "melee",
      name: "Sword, broad",
      acAdjustments: [-3, -2, -1, 0, 0, 1, 1, 1, 2],
      length: 3.5,
      speedFactor: 5,
    },
  ],
  [
    56,
    {
      weaponType: "melee",
      name: "Sword, long",
      acAdjustments: [-2, -1, 0, 0, 0, 0, 0, 1, 2],
      length: 3.5,
      speedFactor: 5,
    },
  ],
  [
    57,
    {
      weaponType: "melee",
      name: "Sword, short",
      acAdjustments: [-3, -2, -1, 0, 0, 0, 1, 0, 2],
      length: 2,
      speedFactor: 3,
    },
  ],
  [
    58,
    {
      weaponType: "melee",
      name: "Sword, two-handed",
      acAdjustments: [2, 2, 2, 2, 3, 3, 3, 1, 0],
      length: 6,
      speedFactor: 10,
    },
  ],
  [
    59,
    {
      weaponType: "melee",
      name: "Trident",
      acAdjustments: [-3, -2, -1, -1, 0, 0, 1, 0, 1],
      length: 6,
      speedFactor: 7,
    },
  ],
  [
    60,
    {
      weaponType: "melee",
      name: "Voulge",
      acAdjustments: [-1, -1, 0, 1, 1, 1, 0, 0, 0],
      length: 8,
      speedFactor: 10,
    },
  ],
]);
// const weapons = new Map([
//   ["Natural Weapon (Monster)", [0, 0, 0, 0, 0, 0, 0, 0, 0]],
//   ["Axe, Battle", [-3, -2, -1, -1, 0, 0, 1, 1, 2]],
//   ["Axe, Hand (Held)", [-3, -2, -2, -1, 0, 0, 1, 1, 1]],
//   ["Axe, Hand (Hurled)", [-4, -3, -2, -1, -1, 0, 0, 0, 1]],
//   ["Bardiche", [-2, -1, 0, 0, 1, 1, 2, 2, 3]],
//   ["Bec de Corbin", [2, 2, 2, 0, 0, 0, 0, 0, -1]],
//   ["Bill-Guisarme", [0, 0, 0, 0, 0, 0, 1, 0, 0]],
//   ["Bo Stick", [-9, -7, -5, -3, -1, 0, 1, 0, 3]],
//   ["Bow, composite, long", [-3, -3, -1, 0, 1, 2, 2, 2, 3]],
//   ["Bow, composite, short", [-3, -3, -1, 0, 1, 2, 2, 2, 3]],
//   ["Bow, long", [-1, 0, 0, 1, 2, 3, 3, 3, 3]],
//   ["Bow, short", [-5, -4, -1, 0, 0, 1, 2, 2, 2]],
//   ["Club (Held)", [-5, -4, -3, -2, -1, -1, 0, 0, 1]],
//   ["Club (Hurled)", [-7, -5, -3, -2, -1, -1, -1, 0, 0]],
//   ["Crossbow, heavy", [-1, 0, 1, 2, 3, 3, 4, 4, 4]],
//   ["Crossbow, light", [-2, -1, 0, 0, 1, 2, 3, 3, 3]],
//   ["Dagger (Held)", [-3, -3, -2, -2, 0, 0, 1, 1, 3]],
//   ["Dagger (Hurled)", [-5, -4, -3, -2, -1, -1, 0, 0, 1]],
//   ["Dart", [-5, -4, -3, -2, -1, 0, 1, 0, 1]],
//   ["Fauchard", [-2, -2, -1, -1, 0, 0, 0, -1, -1]],
//   ["Fauchard-Fork", [-1, -1, -1, 0, 0, 0, 1, 0, 1]],
//   ["Fist or Open Hand", [-7, -5, -3, -1, 0, 0, 2, 0, 4]],
//   ["Flail, Footman’s", [2, 2, 1, 2, 1, 1, 1, 1, -1]],
//   ["Flail, Horseman’s", [0, 0, 0, 0, 0, 1, 1, 1, 0]],
//   ["Fork, Military", [-2, -2, -1, 0, 0, 1, 1, 0, 1]],
//   ["Glaive", [-1, -1, 0, 0, 0, 0, 0, 0, 0]],
//   ["Glaive-Guisarme", [-1, -1, 0, 0, 0, 0, 0, 0, 0]],
//   ["Guisarme", [-2, -2, -1, -1, 0, 0, 0, -1, -1]],
//   ["Guisarme-Voulge", [-1, -1, 0, 1, 1, 1, 0, 0, 0]],
//   ["Halberd", [1, 1, 1, 2, 2, 2, 1, 1, 0]],
//   ["Hammer, Lucern", [1, 1, 2, 2, 2, 1, 1, 0, 0]],
//   ["Hammer (Held)", [0, 1, 0, 1, 0, 0, 0, 0, 0]],
//   ["Hammer (Hurled)", [-2, -1, 0, 0, 0, 0, 0, 0, 1]],
//   ["Javelin", [-5, -4, -3, -2, -1, 0, 1, 0, 1]],
//   ["Jo Stick", [-8, -6, -4, -2, -1, 0, 1, 0, 2]],
//   ["Lance (heavy horse)", [3, 3, 2, 2, 2, 1, 1, 0, 0]],
//   ["Lance (light horse)", [-2, -2, -1, 0, 0, 0, 0, 0, 0]],
//   ["Lance (medium horse)", [0, 1, 1, 1, 1, 0, 0, 0, 0]],
//   ["Mace, Footman’s", [1, 1, 0, 0, 0, 0, 0, 1, -1]],
//   ["Mace, Horseman’s", [1, 1, 0, 0, 0, 0, 0, 0, 0]],
//   ["Morning Star", [0, 1, 1, 1, 1, 1, 1, 2, 2]],
//   ["Partisan", [0, 0, 0, 0, 0, 0, 0, 0, 0]],
//   ["Pick, Military, Footman’s", [2, 2, 1, 1, 0, -1, -1, -1, -2]],
//   ["Pick, Military, Horseman’s", [1, 1, 1, 1, 0, 0, -1, -1, -1]],
//   ["Pike, awl", [-1, 0, 0, 0, 0, 0, 0, -1, -2]],
//   ["Ranseur", [-2, -1, -1, 0, 0, 0, 0, 0, 1]],
//   ["Scimitar", [-3, -2, -2, -1, 0, 0, 1, 1, 3]],
//   ["Sling (bullet)", [-2, -2, -1, 0, 0, 0, 2, 1, 3]],
//   ["Sling (stone)", [-5, -4, -2, -1, 0, 0, 2, 1, 3]],
//   ["Spear (held)", [-2, -1, -1, -1, 0, 0, 0, 0, 0]],
//   ["Spear (hurled)", [-3, -3, -2, -2, -1, 0, 0, 0, 0]],
//   ["Spetum", [-2, -1, 0, 0, 0, 0, 0, 1, 2]],
//   ["Staff, quarter", [-7, -5, -3, -1, 0, 0, 1, 1, 1]],
//   ["Sword, bastard", [0, 0, 1, 1, 1, 1, 1, 1, 0]],
//   ["Sword, broad", [-3, -2, -1, 0, 0, 1, 1, 1, 2]],
//   ["Sword, long", [-2, -1, 0, 0, 0, 0, 0, 1, 2]],
//   ["Sword, short", [-3, -2, -1, 0, 0, 0, 1, 0, 2]],
//   ["Sword, two-handed", [2, 2, 2, 2, 3, 3, 3, 1, 0]],
//   ["Trident", [-3, -2, -1, -1, 0, 0, 1, 0, 1]],
//   ["Voulge", [-1, -1, 0, 1, 1, 1, 0, 0, 0]],
// ]);

export const getWeaponAdjustment = (
  weapon: number,
  armorType: number
): number => {
  const weaponProps = weapons.get(weapon);
  if (weaponProps) {
    const weaponAdjustment = weaponProps.acAdjustments[armorType - 2];
    if (weaponAdjustment) {
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

const weaponClasses = new Map<string, Map<number, WeaponInfo>>([
  ["monster", weapons],
  ["cleric", filterWeaponClasses(weapons, clericWeapons)],
  ["druid", filterWeaponClasses(weapons, druidWeapons)],
  ["fighter", new Map(Array.from(weapons).slice(1))],
  ["paladin", new Map(Array.from(weapons).slice(1))],
  ["ranger", new Map(Array.from(weapons).slice(1))],
  ["magicuser", filterWeaponClasses(weapons, magicUserWeapons)],
  ["illusionist", filterWeaponClasses(weapons, magicUserWeapons)],
  ["thief", filterWeaponClasses(weapons, thiefWeapons)],
  ["assassin", new Map(Array.from(weapons).slice(1))],
  ["monk", filterWeaponClasses(weapons, monkWeapons)],
  ["bard", filterWeaponClasses(weapons, bardWeapons)],
]);

const constructOptions = (
  weaponOptions: Map<number, WeaponInfo>
): { value: number; label: string }[] =>
  Array.from(weaponOptions).map(
    ([weaponId, weaponInfo]: [number, WeaponInfo]) => ({
      value: weaponId,
      label: weaponInfo.name,
    })
  );

export const getWeaponOptions = (
  attackerClass: string
): { value: number; label: string }[] => {
  const classWeapons = weaponClasses.get(attackerClass);
  if (classWeapons) {
    return constructOptions(classWeapons);
  } else {
    console.error(`Unable to get weapons for class ${attackerClass}`);
    return constructOptions(weapons);
  }
};
