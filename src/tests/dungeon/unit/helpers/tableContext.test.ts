import {
  cloneTableContext,
  freezeTableContext,
  readTableContext,
} from '../../../../dungeon/helpers/tableContext';
import type { TableContext } from '../../../../types/dungeon';

describe('tableContext helpers', () => {
  test('reads extended treasure sword context values', () => {
    const context = readTableContext({
      kind: 'treasureSword',
      sword: 12,
      rollIndex: 3,
      alignmentRoll: 42,
      languageRolls: [11, 27],
      primaryAbilityRolls: [66],
      extraordinaryPowerRolls: [88],
      dragonSlayerColorRoll: 17,
      luckBladeWishes: 2,
    });

    expect(context).toEqual({
      kind: 'treasureSword',
      sword: 12,
      rollIndex: 3,
      alignmentRoll: 42,
      languageRolls: [11, 27],
      primaryAbilityRolls: [66],
      extraordinaryPowerRolls: [88],
      dragonSlayerColorRoll: 17,
      luckBladeWishes: 2,
    });
  });

  test('clones and freezes mutable table context collections', () => {
    const context: TableContext = {
      kind: 'treasureSword',
      sword: 9,
      languageRolls: [20],
      primaryAbilityRolls: [93, 12],
      extraordinaryPowerRolls: [45],
    };

    const cloned = cloneTableContext(context);
    expect(cloned).not.toBe(context);
    if (cloned.kind !== 'treasureSword') {
      throw new Error('Expected treasure sword context');
    }

    expect(cloned.languageRolls).toEqual([20]);
    expect(cloned.languageRolls).not.toBe(context.languageRolls);
    expect(cloned.primaryAbilityRolls).not.toBe(context.primaryAbilityRolls);
    expect(cloned.extraordinaryPowerRolls).not.toBe(
      context.extraordinaryPowerRolls
    );

    freezeTableContext(cloned);
    expect(Object.isFrozen(cloned)).toBe(true);
    expect(Object.isFrozen(cloned.languageRolls ?? [])).toBe(true);
    expect(Object.isFrozen(cloned.primaryAbilityRolls ?? [])).toBe(true);
    expect(Object.isFrozen(cloned.extraordinaryPowerRolls ?? [])).toBe(true);
  });
});
