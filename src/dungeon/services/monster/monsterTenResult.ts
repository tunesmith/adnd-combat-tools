import {
  formatMonsterCount,
  getNumberOfMonsters,
} from '../wanderingMonsterResult';
import { getTableEntry, rollDice } from '../../helpers/dungeonLookup';
import { characterResult } from './characterResult';
import {
  monsterTen,
  MonsterTen,
  DragonTen,
} from '../../../tables/dungeon/monster/monsterTen';
import { formatPartyResult } from '../../helpers/party/formatPartyResult';
import type { PartyResult } from '../../models/character/characterSheet';
import { dragonSubtableReminder } from './dragonSubtableReminder';

type MonsterTextResult = {
  text: string;
  party?: PartyResult;
};

export const monsterTenTextForCommand = (
  dungeonLevel: number,
  command: MonsterTen
): MonsterTextResult => {
  const level = Math.min(dungeonLevel, 10);
  const attendantCount = Math.max(0, dungeonLevel - 10);
  const attendantSuffix =
    attendantCount > 0
      ? ` (${attendantCount} attendant${
          attendantCount === 1 ? '' : 's'
        } may be indicated.)`
      : '';
  const withAttendants = (value: string): string =>
    attendantSuffix.length > 0 ? `${value.trim()}${attendantSuffix} ` : value;
  let text = '';
  let party: PartyResult | undefined;
  switch (command) {
    case MonsterTen.Beholder:
      text = withAttendants(
        formatMonsterCount(
          getNumberOfMonsters(10, level, 1, 1),
          'beholder',
          'beholders'
        )
      );
      break;
    case MonsterTen.Character: {
      const characters = characterResult(10, dungeonLevel);
      text = formatPartyResult(characters);
      party = characters;
      break;
    }
    case MonsterTen.DemonPrince:
      text = withAttendants(
        'A demon prince is encountered. Select one or find randomly.'
      );
      break;
    case MonsterTen.DevilArch:
      text = withAttendants(
        'An arch-devil is encountered. Select one or find randomly.'
      );
      break;
    case MonsterTen.Dragon:
      text = withAttendants(dragonSubtableReminder('A dragon is indicated'));
      break;
    case MonsterTen.GolemIron:
      text = withAttendants(
        formatMonsterCount(
          getNumberOfMonsters(10, level, 1, 1),
          'iron golem',
          'iron golems'
        )
      );
      break;
    case MonsterTen.Lich:
      text = withAttendants(
        formatMonsterCount(
          getNumberOfMonsters(10, level, 1, 1),
          'lich',
          'liches'
        )
      );
      break;
    case MonsterTen.TitanElder:
      text = withAttendants(
        formatMonsterCount(
          getNumberOfMonsters(10, level, 1, 1),
          'elder titan',
          'elder titans'
        )
      );
      break;
    case MonsterTen.Vampire: {
      const base = formatMonsterCount(
        getNumberOfMonsters(10, level, 1, 1),
        'vampire',
        'vampires'
      );
      const magicUserLevel = 8 + rollDice(4);
      const ordinal = `${magicUserLevel}th`;
      text = withAttendants(
        `${base}(Former magic-user, with full powers, ${ordinal}-level.)`
      );
      break;
    }
    case MonsterTen.NoEncounter:
      text = 'No encounter occurs. ';
      break;
  }
  return { text, party };
};

export const monsterTenResult = (dungeonLevel: number): string => {
  const roll = rollDice(monsterTen.sides);
  const command = getTableEntry(roll, monsterTen);
  return monsterTenTextForCommand(dungeonLevel, command).text;
};

export const dragonTenTextForCommand = (
  dungeonLevel: number,
  command: DragonTen
): string => {
  const attendantCount = Math.max(0, dungeonLevel - 10);
  const attendantSuffix =
    attendantCount > 0
      ? ` (${attendantCount} attendant${
          attendantCount === 1 ? '' : 's'
        } may be indicated.)`
      : '';
  const withAttendants = (value: string): string =>
    attendantSuffix.length > 0 ? `${value.trim()}${attendantSuffix} ` : value;
  switch (command) {
    case DragonTen.Blue_Ancient_8_VeryOld_7:
      return withAttendants(
        'There are two blue dragons: one ancient (8 hp/die) and one very old (7 hp/die).'
      );
    case DragonTen.Bronze_Ancient_8_VeryOld_7:
      return withAttendants(
        'There are two bronze dragons: one ancient (8 hp/die) and one very old (7 hp/die).'
      );
    case DragonTen.Copper_Ancient_8_VeryOld_7:
      return withAttendants(
        'There are two copper dragons: one ancient (8 hp/die) and one very old (7 hp/die).'
      );
    case DragonTen.Chromatic_Tiamat:
      return withAttendants(
        'Tiamat, the Chromatic Dragon, arrives in all her fury.'
      );
    case DragonTen.Gold_Ancient_8_Old_6:
      return withAttendants(
        'There are two gold dragons: one ancient (8 hp/die) and one old (6 hp/die).'
      );
    case DragonTen.Green_Ancient_8_VeryOld_7:
      return withAttendants(
        'There are two green dragons: one ancient (8 hp/die) and one very old (7 hp/die).'
      );
    case DragonTen.Platinum_Bahamut:
      return withAttendants(
        'Bahamut, the Platinum Dragon, intervenes personally.'
      );
    case DragonTen.Red_Ancient_8_Old_6:
      return withAttendants(
        'There are two red dragons: one ancient (8 hp/die) and one old (6 hp/die).'
      );
    case DragonTen.Silver_Ancient_8_Old_6:
      return withAttendants(
        'There are two silver dragons: one ancient (8 hp/die) and one old (6 hp/die).'
      );
    default:
      return withAttendants('A pair of mighty dragons appears.');
  }
};
