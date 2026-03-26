import { rollDice } from '../../../helpers/dungeonLookup';
import { characterResult } from '../../../services/monster/characterResult';
import { MonsterTen, DragonTen } from './monsterTenTables';
import { dragonSubtableReminder } from '../dragonSubtableReminder';
import {
  countTextEntry,
  createAttendantDecorator,
  fixedTextEntry,
  partyTextResult,
  resolveMonsterTextFromEntries,
  type MonsterTextEntry,
  type MonsterTextResult,
} from '../resultHelpers';

const monsterTenEntries: Partial<Record<MonsterTen, MonsterTextEntry>> = {
  [MonsterTen.Beholder]: countTextEntry(1, 1, 'beholder', 'beholders'),
  [MonsterTen.DemonPrince]: fixedTextEntry(
    'A demon prince is encountered. Select one or find randomly.'
  ),
  [MonsterTen.DevilArch]: fixedTextEntry(
    'An arch-devil is encountered. Select one or find randomly.'
  ),
  [MonsterTen.GolemIron]: countTextEntry(1, 1, 'iron golem', 'iron golems'),
  [MonsterTen.Lich]: countTextEntry(1, 1, 'lich', 'liches'),
  [MonsterTen.TitanElder]: countTextEntry(1, 1, 'elder titan', 'elder titans'),
  [MonsterTen.Vampire]: countTextEntry(1, 1, 'vampire', 'vampires'),
  [MonsterTen.NoEncounter]: fixedTextEntry('No encounter occurs. '),
};

const dragonTenEntries: Record<DragonTen, MonsterTextEntry> = {
  [DragonTen.Blue_Ancient_8_VeryOld_7]: fixedTextEntry(
    'There are two blue dragons: one ancient (8 hp/die) and one very old (7 hp/die).'
  ),
  [DragonTen.Bronze_Ancient_8_VeryOld_7]: fixedTextEntry(
    'There are two bronze dragons: one ancient (8 hp/die) and one very old (7 hp/die).'
  ),
  [DragonTen.Copper_Ancient_8_VeryOld_7]: fixedTextEntry(
    'There are two copper dragons: one ancient (8 hp/die) and one very old (7 hp/die).'
  ),
  [DragonTen.Chromatic_Tiamat]: fixedTextEntry(
    'Tiamat, the Chromatic Dragon, arrives in all her fury.'
  ),
  [DragonTen.Gold_Ancient_8_Old_6]: fixedTextEntry(
    'There are two gold dragons: one ancient (8 hp/die) and one old (6 hp/die).'
  ),
  [DragonTen.Green_Ancient_8_VeryOld_7]: fixedTextEntry(
    'There are two green dragons: one ancient (8 hp/die) and one very old (7 hp/die).'
  ),
  [DragonTen.Platinum_Bahamut]: fixedTextEntry(
    'Bahamut, the Platinum Dragon, intervenes personally.'
  ),
  [DragonTen.Red_Ancient_8_Old_6]: fixedTextEntry(
    'There are two red dragons: one ancient (8 hp/die) and one old (6 hp/die).'
  ),
  [DragonTen.Silver_Ancient_8_Old_6]: fixedTextEntry(
    'There are two silver dragons: one ancient (8 hp/die) and one old (6 hp/die).'
  ),
};

export const monsterTenTextForCommand = (
  dungeonLevel: number,
  command: MonsterTen
): MonsterTextResult => {
  const { effectiveDungeonLevel, decorate } = createAttendantDecorator(
    10,
    dungeonLevel
  );
  switch (command) {
    case MonsterTen.Character:
      return partyTextResult(characterResult(10, dungeonLevel));
    case MonsterTen.Dragon:
      return {
        text: decorate(dragonSubtableReminder('A dragon is indicated')),
      };
    case MonsterTen.Vampire: {
      const base = resolveMonsterTextFromEntries(
        10,
        effectiveDungeonLevel,
        command,
        monsterTenEntries
      );
      const magicUserLevel = 8 + rollDice(4);
      const ordinal = `${magicUserLevel}th`;
      return {
        text: decorate(
          `${base}(Former magic-user, with full powers, ${ordinal}-level.)`
        ),
      };
    }
    default:
      return {
        text: resolveMonsterTextFromEntries(
          10,
          effectiveDungeonLevel,
          command,
          monsterTenEntries,
          { decorate }
        ),
      };
  }
};

export const dragonTenTextForCommand = (
  dungeonLevel: number,
  command: DragonTen
): string => {
  const { effectiveDungeonLevel, decorate } = createAttendantDecorator(
    10,
    dungeonLevel
  );
  return resolveMonsterTextFromEntries(
    10,
    effectiveDungeonLevel,
    command,
    dragonTenEntries,
    { decorate }
  );
};
