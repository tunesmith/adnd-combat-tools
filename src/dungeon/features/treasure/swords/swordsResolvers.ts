import { getTableEntry, rollDice } from '../../../helpers/dungeonLookup';
import type {
  DungeonOutcomeNode,
  OutcomeEvent,
  OutcomeEventNode,
} from '../../../domain/outcome';
import { createPendingRoll } from '../../../domain/pendingRoll';
import { TreasureSwordAlignment } from './swordsAlignmentTable';
import {
  appendSwordAlignmentForUnusual,
  buildPendingSwordAlignmentNode,
  createFixedSwordAlignmentNode,
  resolveTreasureSwordAlignment,
} from './swordAlignment';
import {
  buildSwordDragonSlayerColorPending,
  resolveTreasureSwordDragonSlayerColor,
} from './swordDragonSlayer';
import {
  buildSwordExtraordinaryPowerPending,
  resolveTreasureSwordExtraordinaryPower,
} from './swordExtraordinaryPower';
import {
  buildSwordPrimaryAbilityPending,
  resolveTreasureSwordPrimaryAbility,
} from './swordPrimaryAbility';
import {
  resolveLuckBladeWishes,
  rollSwordLanguages,
} from './swordResolverShared';
import type { TreasureSwordKind } from './swordsTables';
import {
  SWORD_UNUSUAL_DETAILS,
  TreasureSword,
  TreasureSwordUnusual,
  type TreasureSwordUnusualResult,
  treasureSwords,
  treasureSwordKind,
  treasureSwordUnusual,
} from './swordsTables';

export { resolveTreasureSwordAlignment } from './swordAlignment';
export { resolveTreasureSwordDragonSlayerColor } from './swordDragonSlayer';
export { resolveTreasureSwordExtraordinaryPower } from './swordExtraordinaryPower';
export { resolveTreasureSwordPrimaryAbility } from './swordPrimaryAbility';
export {
  resolveTreasureSwordSpecialPurpose,
  resolveTreasureSwordSpecialPurposePower,
} from './swordSpecialPurpose';

export function resolveTreasureSwords(options?: {
  roll?: number;
  level?: number;
  treasureRoll?: number;
  rollIndex?: number;
  kindRoll?: number;
  unusualRoll?: number;
  alignmentRoll?: number;
  languageRolls?: number[];
  primaryAbilityRolls?: number[];
  extraordinaryPowerRolls?: number[];
  luckBladeWishes?: number;
  dragonSlayerColorRoll?: number;
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(treasureSwords.sides);
  const command: TreasureSword = getTableEntry(usedRoll, treasureSwords);
  const luckBladeWishes =
    command === TreasureSword.SwordPlus1LuckBlade
      ? resolveLuckBladeWishes(options?.luckBladeWishes)
      : undefined;
  const event: OutcomeEvent = {
    kind: 'treasureSwords',
    result: command,
    level: options?.level ?? 1,
    treasureRoll: options?.treasureRoll ?? usedRoll,
    rollIndex: options?.rollIndex,
    luckBladeWishes,
  };
  const children: DungeonOutcomeNode[] = [];
  if (options?.kindRoll !== undefined) {
    children.push(resolveTreasureSwordKind({ roll: options.kindRoll }));
  } else {
    children.push(
      createPendingRoll({
        kind: 'treasureSwordKind',
        id: options?.rollIndex
          ? `treasureSwordKind:${options.rollIndex}`
          : undefined,
      })
    );
  }
  if (options?.unusualRoll !== undefined) {
    children.push(
      resolveTreasureSwordUnusual({
        roll: options.unusualRoll,
        sword: command,
        rollIndex: options?.rollIndex,
        alignmentRoll: options?.alignmentRoll,
        languageRolls: options?.languageRolls,
        primaryAbilityRolls: options?.primaryAbilityRolls,
        extraordinaryPowerRolls: options?.extraordinaryPowerRolls,
        dragonSlayerColorRoll: options?.dragonSlayerColorRoll,
      })
    );
  } else {
    children.push(
      createPendingRoll({
        kind: 'treasureSwordUnusual',
        id: options?.rollIndex
          ? `treasureSwordUnusual:${options.rollIndex}`
          : undefined,
        args: {
          kind: 'treasureSword',
          sword: command,
          rollIndex: options?.rollIndex,
          languageRolls: options?.languageRolls
            ? [...options.languageRolls]
            : undefined,
          primaryAbilityRolls: options?.primaryAbilityRolls
            ? [...options.primaryAbilityRolls]
            : undefined,
          extraordinaryPowerRolls: options?.extraordinaryPowerRolls
            ? [...options.extraordinaryPowerRolls]
            : undefined,
          luckBladeWishes,
          dragonSlayerColorRoll: options?.dragonSlayerColorRoll,
        },
      })
    );
  }
  switch (command) {
    case TreasureSword.SwordPlus5HolyAvenger: {
      children.push(
        createFixedSwordAlignmentNode(
          TreasureSwordAlignment.LawfulGood,
          'holyAvenger'
        )
      );
      break;
    }
    case TreasureSword.SwordOfSharpness: {
      if (options?.alignmentRoll !== undefined) {
        children.push(
          resolveTreasureSwordAlignment({
            roll: options.alignmentRoll,
            variant: 'chaotic',
          })
        );
      } else {
        children.push(
          buildPendingSwordAlignmentNode('chaotic', command, options?.rollIndex)
        );
      }
      break;
    }
    case TreasureSword.SwordVorpalWeapon: {
      if (options?.alignmentRoll !== undefined) {
        children.push(
          resolveTreasureSwordAlignment({
            roll: options.alignmentRoll,
            variant: 'lawful',
          })
        );
      } else {
        children.push(
          buildPendingSwordAlignmentNode('lawful', command, options?.rollIndex)
        );
      }
      break;
    }
    default:
      break;
  }
  return {
    type: 'event',
    roll: usedRoll,
    event,
    children,
  };
}

export function resolveTreasureSwordKind(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(treasureSwordKind.sides);
  const command: TreasureSwordKind = getTableEntry(usedRoll, treasureSwordKind);
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'treasureSwordKind',
      result: command,
    } as OutcomeEvent,
  };
}

export function resolveTreasureSwordUnusual(options?: {
  roll?: number;
  sword?: TreasureSword;
  rollIndex?: number;
  alignmentRoll?: number;
  languageRolls?: number[];
  primaryAbilityRolls?: number[];
  extraordinaryPowerRolls?: number[];
  dragonSlayerColorRoll?: number;
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(treasureSwordUnusual.sides);
  const command: TreasureSwordUnusual = getTableEntry(
    usedRoll,
    treasureSwordUnusual
  );
  const details = SWORD_UNUSUAL_DETAILS[command];
  const result: TreasureSwordUnusualResult = {
    ...details,
    variant: command,
  };
  const children: DungeonOutcomeNode[] = [];
  const sword = options?.sword;
  if (sword !== undefined) {
    appendSwordAlignmentForUnusual(children, {
      sword,
      unusual: result,
      rollIndex: options?.rollIndex,
      alignmentRoll: options?.alignmentRoll,
    });
  }
  if (result.intelligence !== undefined && result.intelligence >= 14) {
    const languageRolls = options?.languageRolls
      ? [...options.languageRolls]
      : [];
    const languagesKnown = rollSwordLanguages(languageRolls);
    result.languagesKnown = languagesKnown;
  }
  if (result.primaryAbilityCount > 0) {
    const abilityNodes: DungeonOutcomeNode[] = [];
    const queuedRolls = options?.primaryAbilityRolls
      ? [...options.primaryAbilityRolls]
      : [];
    for (let index = 0; index < result.primaryAbilityCount; index += 1) {
      const slotKey = `auto-${index}`;
      const forcedRoll = queuedRolls.shift();
      if (forcedRoll !== undefined) {
        abilityNodes.push(
          resolveTreasureSwordPrimaryAbility({
            rollIndex: options?.rollIndex,
            slotKey,
            roll: forcedRoll,
            tableVariant: 'standard',
          })
        );
      } else {
        abilityNodes.push(
          buildSwordPrimaryAbilityPending({
            slotKey,
            rollIndex: options?.rollIndex,
            tableVariant: 'standard',
          })
        );
      }
    }
    if (abilityNodes.length > 0) {
      children.push(...abilityNodes);
    }
  }
  if (result.extraordinaryPower) {
    const slotKey = 'extra-0';
    const queuedExtra =
      options?.extraordinaryPowerRolls &&
      options.extraordinaryPowerRolls.length > 0
        ? [...options.extraordinaryPowerRolls]
        : undefined;
    const forcedExtra = queuedExtra ? queuedExtra.shift() : undefined;
    if (forcedExtra !== undefined) {
      children.push(
        resolveTreasureSwordExtraordinaryPower({
          roll: forcedExtra,
          slotKey,
          rollIndex: options?.rollIndex,
          tableVariant: 'standard',
        })
      );
    } else {
      children.push(
        buildSwordExtraordinaryPowerPending({
          slotKey,
          rollIndex: options?.rollIndex,
          tableVariant: 'standard',
        })
      );
    }
  }
  if (sword === TreasureSword.SwordPlus2DragonSlayer) {
    let alignmentForColor: TreasureSwordAlignment | undefined;
    let colorAlignmentReady = false;
    const alignmentChild = children.find(
      (child): child is OutcomeEventNode =>
        child.type === 'event' && child.event.kind === 'treasureSwordAlignment'
    );
    if (
      alignmentChild &&
      alignmentChild.event.kind === 'treasureSwordAlignment'
    ) {
      const alignmentResult = alignmentChild.event.result;
      alignmentForColor = alignmentResult.alignment;
      colorAlignmentReady = true;
    }
    const slotKey = `dragon-${options?.rollIndex ?? 'auto'}`;
    if (command === TreasureSwordUnusual.Normal) {
      if (options?.dragonSlayerColorRoll !== undefined) {
        children.push(
          resolveTreasureSwordDragonSlayerColor({
            roll: options.dragonSlayerColorRoll,
            slotKey,
            rollIndex: options?.rollIndex,
            alignment: alignmentForColor,
          })
        );
      } else {
        children.push(
          buildSwordDragonSlayerColorPending({
            slotKey,
            rollIndex: options?.rollIndex,
            alignment: alignmentForColor,
            alignmentReady: true,
          })
        );
      }
    } else if (result.requiresAlignment) {
      if (
        options?.dragonSlayerColorRoll !== undefined &&
        alignmentForColor !== undefined
      ) {
        children.push(
          resolveTreasureSwordDragonSlayerColor({
            roll: options.dragonSlayerColorRoll,
            slotKey,
            rollIndex: options?.rollIndex,
            alignment: alignmentForColor,
          })
        );
      } else {
        children.push(
          buildSwordDragonSlayerColorPending({
            slotKey,
            rollIndex: options?.rollIndex,
            alignment: alignmentForColor,
            alignmentReady: colorAlignmentReady,
          })
        );
      }
    }
  }
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'treasureSwordUnusual',
      result,
    } as OutcomeEvent,
    children: children.length ? children : undefined,
  };
}
