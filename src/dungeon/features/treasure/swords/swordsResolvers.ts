import { getTableEntry, rollDice } from '../../../helpers/dungeonLookup';
import { createDungeonRandomId } from '../../../helpers/dungeonRandom';
import type {
  DungeonOutcomeNode,
  OutcomeEvent,
  OutcomeEventNode,
  PendingRoll,
} from '../../../domain/outcome';
import type {
  TreasureSwordDragonSlayerColor,
  TreasureSwordKind,
} from './swordsTables';
import {
  DRAGON_SLAYER_COLOR_DETAILS,
  SWORD_UNUSUAL_DETAILS,
  TreasureSword,
  type TreasureSwordDragonSlayerColorResult,
  type TreasureSwordExtraordinaryPowerResult,
  TreasureSwordExtraordinaryPower,
  TreasureSwordExtraordinaryPowerCommand,
  TreasureSwordPrimaryAbilityCommand,
  type TreasureSwordPrimaryAbilityResult,
  type TreasureSwordSpecialPurposePowerResult,
  type TreasureSwordSpecialPurposeResult,
  TreasureSwordUnusual,
  type TreasureSwordUnusualResult,
  describeSwordExtraordinaryPower,
  describeSwordPrimaryAbility,
  describeSwordSpecialPurpose,
  describeSwordSpecialPurposePower,
  dragonSlayerColorTableForAlignment,
  toTreasureSwordExtraordinaryPower,
  toTreasureSwordPrimaryAbility,
  toTreasureSwordSpecialPurpose,
  toTreasureSwordSpecialPurposePower,
  treasureSwords,
  treasureSwordExtraordinaryPower,
  treasureSwordExtraordinaryPowerRestricted,
  treasureSwordKind,
  treasureSwordPrimaryAbility,
  treasureSwordPrimaryAbilityRestricted,
  treasureSwordSpecialPurpose,
  treasureSwordSpecialPurposePower,
  treasureSwordUnusual,
} from './swordsTables';
import {
  SWORD_ALIGNMENT_DETAILS as SWORD_ALIGNMENT,
  TreasureSwordAlignment,
  type TreasureSwordAlignmentResult,
  treasureSwordAlignment,
  treasureSwordAlignmentChaotic,
  treasureSwordAlignmentLawful,
} from './swordsAlignmentTable';

function resolveBoundedRoll(roll: number | undefined, sides: number): number {
  if (roll === undefined) {
    return rollDice(sides);
  }
  const provided = Math.trunc(roll);
  if (!Number.isFinite(provided) || provided < 1) {
    return 1;
  }
  if (provided > sides) {
    return sides;
  }
  return provided;
}

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
    children.push({
      type: 'pending-roll',
      table: 'treasureSwordKind',
      id: options?.rollIndex
        ? `treasureSwordKind:${options.rollIndex}`
        : undefined,
    });
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
    children.push({
      type: 'pending-roll',
      table: 'treasureSwordUnusual',
      id: options?.rollIndex
        ? `treasureSwordUnusual:${options.rollIndex}`
        : undefined,
      context: {
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
    });
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
    const instruction = determineSwordAlignmentInstruction(sword, result);
    applySwordAlignmentInstruction(children, instruction, {
      sword,
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

export function resolveTreasureSwordPrimaryAbility(options?: {
  roll?: number;
  rollIndex?: number;
  slotKey?: string;
  tableVariant?: 'standard' | 'restricted';
}): DungeonOutcomeNode {
  const rollIndex = options?.rollIndex;
  const slotKey = options?.slotKey ?? createDungeonRandomId('auto');
  const variant = options?.tableVariant ?? 'standard';
  const table =
    variant === 'restricted'
      ? treasureSwordPrimaryAbilityRestricted
      : treasureSwordPrimaryAbility;
  const usedRoll = resolveBoundedRoll(options?.roll, table.sides);
  const command = getTableEntry(usedRoll, table);

  if (
    command === TreasureSwordPrimaryAbilityCommand.RollTwice &&
    variant === 'standard'
  ) {
    const nodeId = primaryAbilityNodeId(slotKey, rollIndex);
    const node: OutcomeEventNode = {
      type: 'event',
      roll: usedRoll,
      id: nodeId,
      event: {
        kind: 'treasureSwordPrimaryAbility',
        result: {
          kind: 'instruction',
          instruction: 'rollTwice',
          roll: usedRoll,
          note: 'Roll twice on this table (ignore 93-00).',
          tableVariant: 'standard',
        },
      } as OutcomeEvent,
      children: [
        buildSwordPrimaryAbilityPending({
          slotKey: `${slotKey}:a`,
          rollIndex,
          tableVariant: 'restricted',
        }),
        buildSwordPrimaryAbilityPending({
          slotKey: `${slotKey}:b`,
          rollIndex,
          tableVariant: 'restricted',
        }),
      ],
    };
    return node;
  }

  if (command === TreasureSwordPrimaryAbilityCommand.ExtraordinaryPower) {
    const nodeId = primaryAbilityNodeId(slotKey, rollIndex);
    const node: OutcomeEventNode = {
      type: 'event',
      roll: usedRoll,
      id: nodeId,
      event: {
        kind: 'treasureSwordPrimaryAbility',
        result: {
          kind: 'instruction',
          instruction: 'extraordinaryPower',
          roll: usedRoll,
          note: 'Roll on the Extraordinary Power table.',
          tableVariant: 'standard',
        },
      } as OutcomeEvent,
      children: [
        buildSwordExtraordinaryPowerPending({
          slotKey: `${slotKey}:extra`,
          rollIndex,
          tableVariant: 'standard',
        }),
      ],
    };
    return node;
  }

  const ability = toTreasureSwordPrimaryAbility(command);
  if (ability === undefined) {
    throw new Error(`Unsupported sword primary ability command: ${command}`);
  }
  const result: TreasureSwordPrimaryAbilityResult = {
    kind: 'ability',
    ability,
    rolls: [usedRoll],
    multiplier: 1,
    description: describeSwordPrimaryAbility(ability, 1),
    tableVariant: variant,
  };
  const node: OutcomeEventNode = {
    type: 'event',
    roll: usedRoll,
    id: primaryAbilityNodeId(slotKey, rollIndex),
    event: {
      kind: 'treasureSwordPrimaryAbility',
      result,
    } as OutcomeEvent,
  };
  return node;
}

function buildSwordPrimaryAbilityPending(options: {
  slotKey: string;
  rollIndex?: number;
  tableVariant?: 'standard' | 'restricted';
}): PendingRoll {
  const { slotKey, rollIndex, tableVariant } = options;
  const variant = tableVariant ?? 'standard';
  const tableName =
    variant === 'restricted'
      ? 'treasureSwordPrimaryAbilityRestricted'
      : 'treasureSwordPrimaryAbility';
  return {
    type: 'pending-roll',
    table: tableName,
    id: primaryAbilityNodeId(slotKey, rollIndex),
    context: {
      kind: 'treasureSwordPrimaryAbility',
      slotKey,
      rollIndex,
      tableVariant: variant,
    },
  };
}

function primaryAbilityNodeId(slotKey: string, rollIndex?: number): string {
  return rollIndex !== undefined
    ? `treasureSwordPrimaryAbility:${rollIndex}:${slotKey}`
    : `treasureSwordPrimaryAbility:${slotKey}`;
}

export function resolveTreasureSwordExtraordinaryPower(options?: {
  roll?: number;
  rollIndex?: number;
  slotKey?: string;
  tableVariant?: 'standard' | 'restricted';
  alignment?: TreasureSwordAlignment;
}): DungeonOutcomeNode {
  const rollIndex = options?.rollIndex;
  const slotKey = options?.slotKey ?? createDungeonRandomId('extra');
  const variant = options?.tableVariant ?? 'standard';
  const table =
    variant === 'restricted'
      ? treasureSwordExtraordinaryPowerRestricted
      : treasureSwordExtraordinaryPower;
  const usedRoll = resolveBoundedRoll(options?.roll, table.sides);
  const command = getTableEntry(usedRoll, table);

  if (
    command === TreasureSwordExtraordinaryPowerCommand.RollTwice &&
    variant === 'standard'
  ) {
    const node: OutcomeEventNode = {
      type: 'event',
      roll: usedRoll,
      id: extraordinaryPowerNodeId(slotKey, rollIndex),
      event: {
        kind: 'treasureSwordExtraordinaryPower',
        result: {
          kind: 'instruction',
          instruction: 'rollTwice',
          roll: usedRoll,
          note: 'Roll twice on this table ignoring scores of 95-97.',
          tableVariant: 'standard',
        },
      } as OutcomeEvent,
      children: [
        buildSwordExtraordinaryPowerPending({
          slotKey: `${slotKey}:a`,
          rollIndex,
          tableVariant: 'restricted',
          alignment: options?.alignment,
        }),
        buildSwordExtraordinaryPowerPending({
          slotKey: `${slotKey}:b`,
          rollIndex,
          tableVariant: 'restricted',
          alignment: options?.alignment,
        }),
      ],
    };
    return node;
  }

  const power = toTreasureSwordExtraordinaryPower(command);
  if (power === undefined) {
    throw new Error(
      `Unsupported sword extraordinary power command: ${command}`
    );
  }
  const result: TreasureSwordExtraordinaryPowerResult = {
    kind: 'power',
    power,
    rolls: [usedRoll],
    multiplier: 1,
    description: describeSwordExtraordinaryPower(power, 1),
    tableVariant: variant,
    alignmentRequired:
      power === TreasureSwordExtraordinaryPower.ChooseAnyAndSpecialPurpose &&
      options?.alignment === undefined
        ? true
        : undefined,
  };
  const children: DungeonOutcomeNode[] = [];
  if (power === TreasureSwordExtraordinaryPower.ChooseAnyAndSpecialPurpose) {
    const parentSlotKey = slotKey;
    const purposeSlotKey = `${slotKey}:purpose`;
    const powerSlotKey = `${slotKey}:power`;
    children.push(
      buildSwordSpecialPurposePending({
        slotKey: purposeSlotKey,
        parentSlotKey,
        rollIndex,
        alignment: options?.alignment,
      })
    );
    children.push(
      buildSwordSpecialPurposePowerPending({
        slotKey: powerSlotKey,
        rollIndex,
        parentSlotKey,
        alignment: options?.alignment,
      })
    );
  }
  return {
    type: 'event',
    roll: usedRoll,
    id: extraordinaryPowerNodeId(slotKey, rollIndex),
    event: {
      kind: 'treasureSwordExtraordinaryPower',
      result,
    } as OutcomeEvent,
    children: children.length > 0 ? children : undefined,
  };
}

function buildSwordExtraordinaryPowerPending(options: {
  slotKey: string;
  rollIndex?: number;
  tableVariant?: 'standard' | 'restricted';
  alignment?: TreasureSwordAlignment;
}): PendingRoll {
  const { slotKey, rollIndex, tableVariant, alignment } = options;
  const variant = tableVariant ?? 'standard';
  const tableName =
    variant === 'restricted'
      ? 'treasureSwordExtraordinaryPowerRestricted'
      : 'treasureSwordExtraordinaryPower';
  return {
    type: 'pending-roll',
    table: tableName,
    id: extraordinaryPowerNodeId(slotKey, rollIndex),
    context: {
      kind: 'treasureSwordExtraordinaryPower',
      slotKey,
      rollIndex,
      tableVariant: variant,
      alignment,
    },
  };
}

function extraordinaryPowerNodeId(slotKey: string, rollIndex?: number): string {
  return rollIndex !== undefined
    ? `treasureSwordExtraordinaryPower:${rollIndex}:${slotKey}`
    : `treasureSwordExtraordinaryPower:${slotKey}`;
}

export function resolveTreasureSwordSpecialPurpose(options?: {
  roll?: number;
  slotKey?: string;
  rollIndex?: number;
  parentSlotKey?: string;
  alignment?: TreasureSwordAlignment;
}): DungeonOutcomeNode {
  const slotKey = options?.slotKey ?? createDungeonRandomId('purpose');
  const parentSlotKey = options?.parentSlotKey;
  const alignment = options?.alignment;
  const usedRoll = resolveBoundedRoll(
    options?.roll,
    treasureSwordSpecialPurpose.sides
  );
  const command = getTableEntry(usedRoll, treasureSwordSpecialPurpose);
  const purpose = toTreasureSwordSpecialPurpose(command);
  const result: TreasureSwordSpecialPurposeResult = {
    kind: 'purpose',
    purpose,
    rolls: [usedRoll],
    description: describeSwordSpecialPurpose(purpose, {
      alignment,
    }),
    alignment,
    slotKey,
    parentSlotKey,
  };
  const node: OutcomeEventNode = {
    type: 'event',
    roll: usedRoll,
    id: specialPurposeNodeId(slotKey, options?.rollIndex),
    event: {
      kind: 'treasureSwordSpecialPurpose',
      result,
    } as OutcomeEvent,
  };
  if (!parentSlotKey) {
    node.children = [
      buildSwordSpecialPurposePowerPending({
        slotKey: `${slotKey}:power`,
        rollIndex: options?.rollIndex,
        parentSlotKey: slotKey,
        alignment,
      }),
    ];
  }
  return node;
}

export function resolveTreasureSwordSpecialPurposePower(options?: {
  roll?: number;
  slotKey?: string;
  rollIndex?: number;
  parentSlotKey?: string;
  alignment?: TreasureSwordAlignment;
}): DungeonOutcomeNode {
  const slotKey = options?.slotKey ?? createDungeonRandomId('purpose-power');
  const usedRoll = resolveBoundedRoll(
    options?.roll,
    treasureSwordSpecialPurposePower.sides
  );
  const command = getTableEntry(usedRoll, treasureSwordSpecialPurposePower);
  const power = toTreasureSwordSpecialPurposePower(command);
  const result: TreasureSwordSpecialPurposePowerResult = {
    kind: 'specialPurposePower',
    power,
    rolls: [usedRoll],
    description: describeSwordSpecialPurposePower(power),
    slotKey,
    parentSlotKey: options?.parentSlotKey,
  };
  return {
    type: 'event',
    roll: usedRoll,
    id: specialPurposePowerNodeId(slotKey, options?.rollIndex),
    event: {
      kind: 'treasureSwordSpecialPurposePower',
      result,
    } as OutcomeEvent,
  };
}

export function resolveTreasureSwordDragonSlayerColor(options?: {
  roll?: number;
  slotKey?: string;
  rollIndex?: number;
  alignment?: TreasureSwordAlignment;
}): DungeonOutcomeNode {
  const slotKey = options?.slotKey ?? createDungeonRandomId('dragon-slayer');
  const table = dragonSlayerColorTableForAlignment(options?.alignment);
  const usedRoll = resolveBoundedRoll(options?.roll, table.sides);
  const command: TreasureSwordDragonSlayerColor = getTableEntry(
    usedRoll,
    table
  );
  const detail = DRAGON_SLAYER_COLOR_DETAILS[command];
  const result: TreasureSwordDragonSlayerColorResult = {
    kind: 'dragonSlayerColor',
    color: command,
    rolls: [usedRoll],
    label: detail.label,
    alignment: detail.alignment,
  };
  return {
    type: 'event',
    roll: usedRoll,
    id: dragonSlayerColorNodeId(slotKey, options?.rollIndex),
    event: {
      kind: 'treasureSwordDragonSlayerColor',
      result,
    } as OutcomeEvent,
  };
}

function buildSwordSpecialPurposePending(options: {
  slotKey: string;
  rollIndex?: number;
  parentSlotKey?: string;
  alignment?: TreasureSwordAlignment;
}): PendingRoll {
  const { slotKey, rollIndex, parentSlotKey, alignment } = options;
  const alignmentReady = alignment !== undefined;
  return {
    type: 'pending-roll',
    table: 'treasureSwordSpecialPurpose',
    id: specialPurposeNodeId(slotKey, rollIndex),
    context: {
      kind: 'treasureSwordSpecialPurpose',
      slotKey,
      rollIndex,
      parentSlotKey,
      alignment,
      alignmentReady,
    },
  };
}

function buildSwordSpecialPurposePowerPending(options: {
  slotKey: string;
  rollIndex?: number;
  parentSlotKey?: string;
  alignment?: TreasureSwordAlignment;
}): PendingRoll {
  const { slotKey, rollIndex, parentSlotKey, alignment } = options;
  return {
    type: 'pending-roll',
    table: 'treasureSwordSpecialPurposePower',
    id: specialPurposePowerNodeId(slotKey, rollIndex),
    context: {
      kind: 'treasureSwordSpecialPurposePower',
      slotKey,
      rollIndex,
      parentSlotKey,
      alignment,
    },
  };
}

function specialPurposeNodeId(slotKey: string, rollIndex?: number): string {
  return rollIndex !== undefined
    ? `treasureSwordSpecialPurpose:${rollIndex}:${slotKey}`
    : `treasureSwordSpecialPurpose:${slotKey}`;
}

function specialPurposePowerNodeId(
  slotKey: string,
  rollIndex?: number
): string {
  return rollIndex !== undefined
    ? `treasureSwordSpecialPurposePower:${rollIndex}:${slotKey}`
    : `treasureSwordSpecialPurposePower:${slotKey}`;
}

function buildSwordDragonSlayerColorPending(options: {
  slotKey: string;
  rollIndex?: number;
  alignment?: TreasureSwordAlignment;
  alignmentReady?: boolean;
}): PendingRoll {
  const { slotKey, rollIndex, alignment, alignmentReady } = options;
  return {
    type: 'pending-roll',
    table: 'treasureSwordDragonSlayerColor',
    id: dragonSlayerColorNodeId(slotKey, rollIndex),
    context: {
      kind: 'treasureSwordDragonSlayerColor',
      slotKey,
      rollIndex,
      alignment,
      alignmentReady: alignmentReady ?? alignment !== undefined,
    },
  };
}

function dragonSlayerColorNodeId(slotKey: string, rollIndex?: number): string {
  return rollIndex !== undefined
    ? `treasureSwordDragonSlayerColor:${rollIndex}:${slotKey}`
    : `treasureSwordDragonSlayerColor:${slotKey}`;
}

type SwordAlignmentVariant = 'standard' | 'chaotic' | 'lawful';

export function resolveTreasureSwordAlignment(options?: {
  roll?: number;
  variant?: SwordAlignmentVariant;
}): DungeonOutcomeNode {
  const variant = options?.variant ?? 'standard';
  const table =
    variant === 'chaotic'
      ? treasureSwordAlignmentChaotic
      : variant === 'lawful'
      ? treasureSwordAlignmentLawful
      : treasureSwordAlignment;
  const usedRoll = options?.roll ?? rollDice(table.sides);
  const alignment: TreasureSwordAlignment = getTableEntry(usedRoll, table);
  const result = buildSwordAlignmentResult(alignment, variant);
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'treasureSwordAlignment',
      result,
    } as OutcomeEvent,
  };
}

type SwordAlignmentInstruction =
  | { kind: 'none' }
  | {
      kind: 'fixed';
      alignment: TreasureSwordAlignment;
      source: 'holyAvenger' | 'cursedUnusual';
    }
  | { kind: 'pending'; variant: SwordAlignmentVariant };

function determineSwordAlignmentInstruction(
  sword: TreasureSword,
  unusual: TreasureSwordUnusualResult
): SwordAlignmentInstruction {
  if (isFixedAlignmentSword(sword)) {
    return { kind: 'none' };
  }
  if (!unusual || unusual.category !== 'intelligent') {
    return { kind: 'none' };
  }
  if (
    sword === TreasureSword.SwordPlus1Cursed ||
    sword === TreasureSword.SwordMinus2Cursed ||
    sword === TreasureSword.SwordCursedBerserking
  ) {
    return {
      kind: 'fixed',
      alignment: TreasureSwordAlignment.NeutralAbsolute,
      source: 'cursedUnusual',
    };
  }
  return { kind: 'pending', variant: 'standard' };
}

function isFixedAlignmentSword(sword: TreasureSword): boolean {
  return (
    sword === TreasureSword.SwordPlus5HolyAvenger ||
    sword === TreasureSword.SwordOfSharpness ||
    sword === TreasureSword.SwordVorpalWeapon
  );
}

function applySwordAlignmentInstruction(
  collector: DungeonOutcomeNode[],
  instruction: SwordAlignmentInstruction,
  options: {
    sword: TreasureSword;
    rollIndex?: number;
    alignmentRoll?: number;
  }
): void {
  switch (instruction.kind) {
    case 'none':
      return;
    case 'fixed': {
      collector.push(
        createFixedSwordAlignmentNode(instruction.alignment, instruction.source)
      );
      break;
    }
    case 'pending': {
      if (
        instruction.variant === 'standard' &&
        options.alignmentRoll !== undefined
      ) {
        collector.push(
          resolveTreasureSwordAlignment({
            roll: options.alignmentRoll,
            variant: instruction.variant,
          })
        );
        break;
      }
      collector.push(
        buildPendingSwordAlignmentNode(
          instruction.variant,
          options.sword,
          options.rollIndex
        )
      );
      break;
    }
    default:
      break;
  }
}

function createFixedSwordAlignmentNode(
  alignment: TreasureSwordAlignment,
  source: 'holyAvenger' | 'cursedUnusual'
): DungeonOutcomeNode {
  const result = buildSwordAlignmentResult(alignment, 'fixed');
  const rollValue = source === 'holyAvenger' ? 0 : 0;
  return {
    type: 'event',
    roll: rollValue,
    event: {
      kind: 'treasureSwordAlignment',
      result,
    } as OutcomeEvent,
  };
}

function buildPendingSwordAlignmentNode(
  variant: SwordAlignmentVariant,
  sword: TreasureSword,
  rollIndex?: number
): DungeonOutcomeNode {
  const tableId =
    variant === 'chaotic'
      ? 'treasureSwordAlignmentChaotic'
      : variant === 'lawful'
      ? 'treasureSwordAlignmentLawful'
      : 'treasureSwordAlignment';
  return {
    type: 'pending-roll',
    table: tableId,
    id: rollIndex ? `${tableId}:${rollIndex}` : undefined,
    context: {
      kind: 'treasureSwordAlignment',
      variant,
      sword,
    },
  };
}

function resolveLuckBladeWishes(provided?: number): number {
  if (provided === undefined) {
    return rollDice(4) + 1;
  }
  const truncated = Math.trunc(provided);
  if (!Number.isFinite(truncated)) return 2;
  if (truncated < 2) return 2;
  if (truncated > 5) return 5;
  return truncated;
}

function buildSwordAlignmentResult(
  alignment: TreasureSwordAlignment,
  variant: SwordAlignmentVariant | 'fixed'
): TreasureSwordAlignmentResult {
  const detail = SWORD_ALIGNMENT[alignment];
  return {
    alignment,
    label: detail.label,
    source: variant,
    requiresLanguageTable: detail.requiresLanguageTable,
  };
}

function rollSwordLanguages(languageRolls: number[]): number {
  const useProvided =
    languageRolls.length > 0 ? languageRolls.shift() : undefined;
  const rollValue = useProvided ?? rollDice(100);
  if (rollValue === 100) {
    let total = 0;
    for (let i = 0; i < 2; i += 1) {
      let extraRoll: number;
      do {
        extraRoll =
          languageRolls.length > 0
            ? languageRolls.shift() ?? rollDice(100)
            : rollDice(100);
      } while (extraRoll === 100);
      total += mapSwordLanguageRoll(extraRoll);
    }
    return Math.max(6, total);
  }
  return mapSwordLanguageRoll(rollValue);
}

function mapSwordLanguageRoll(roll: number): number {
  if (roll <= 40) return 1;
  if (roll <= 70) return 2;
  if (roll <= 85) return 3;
  if (roll <= 95) return 4;
  if (roll <= 99) return 5;
  return 6;
}
