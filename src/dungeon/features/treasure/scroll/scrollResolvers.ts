import { getTableEntry, rollDice } from '../../../helpers/dungeonLookup';
import type { DungeonOutcomeNode, OutcomeEvent } from '../../../domain/outcome';
import { createPendingRoll } from '../../../domain/pendingRoll';
import {
  scrollFollowups,
  treasureScrolls,
  TreasureScroll,
  treasureScrollProtectionElementals,
  treasureScrollProtectionLycanthropes,
} from './scrollTables';
import { buildTreasureEvent } from '../shared';

type ScrollCaster = 'magic-user' | 'illusionist' | 'cleric' | 'druid';

type ScrollSpellDetail = {
  spells: number;
  magicUserRange: [number, number];
  clericRange: [number, number];
};

type TreasureScrollEvent = Extract<OutcomeEvent, { kind: 'treasureScroll' }>;

const SCROLL_SPELL_DETAILS: Partial<Record<TreasureScroll, ScrollSpellDetail>> =
  {
    [TreasureScroll.SpellOneLevel1to4]: {
      spells: 1,
      magicUserRange: [1, 4],
      clericRange: [1, 4],
    },
    [TreasureScroll.SpellOneLevel1to6]: {
      spells: 1,
      magicUserRange: [1, 6],
      clericRange: [1, 6],
    },
    [TreasureScroll.SpellOneLevel2to9]: {
      spells: 1,
      magicUserRange: [2, 9],
      clericRange: [2, 7],
    },
    [TreasureScroll.SpellTwoLevel1to4]: {
      spells: 2,
      magicUserRange: [1, 4],
      clericRange: [1, 4],
    },
    [TreasureScroll.SpellTwoLevel1to8]: {
      spells: 2,
      magicUserRange: [1, 8],
      clericRange: [1, 6],
    },
    [TreasureScroll.SpellThreeLevel1to4]: {
      spells: 3,
      magicUserRange: [1, 4],
      clericRange: [1, 4],
    },
    [TreasureScroll.SpellThreeLevel2to9]: {
      spells: 3,
      magicUserRange: [2, 9],
      clericRange: [2, 7],
    },
    [TreasureScroll.SpellFourLevel1to6]: {
      spells: 4,
      magicUserRange: [1, 6],
      clericRange: [1, 6],
    },
    [TreasureScroll.SpellFourLevel1to8]: {
      spells: 4,
      magicUserRange: [1, 8],
      clericRange: [1, 6],
    },
    [TreasureScroll.SpellFiveLevel1to6]: {
      spells: 5,
      magicUserRange: [1, 6],
      clericRange: [1, 6],
    },
    [TreasureScroll.SpellFiveLevel1to8]: {
      spells: 5,
      magicUserRange: [1, 8],
      clericRange: [1, 6],
    },
    [TreasureScroll.SpellSixLevel1to6]: {
      spells: 6,
      magicUserRange: [1, 6],
      clericRange: [1, 6],
    },
    [TreasureScroll.SpellSixLevel3to8]: {
      spells: 6,
      magicUserRange: [3, 8],
      clericRange: [3, 6],
    },
    [TreasureScroll.SpellSevenLevel1to8]: {
      spells: 7,
      magicUserRange: [1, 8],
      clericRange: [1, 6],
    },
    [TreasureScroll.SpellSevenLevel2to9]: {
      spells: 7,
      magicUserRange: [2, 9],
      clericRange: [2, 7],
    },
    [TreasureScroll.SpellSevenLevel4to9]: {
      spells: 7,
      magicUserRange: [4, 9],
      clericRange: [4, 7],
    },
  };

function isSpellScroll(result: TreasureScroll): boolean {
  return Object.prototype.hasOwnProperty.call(SCROLL_SPELL_DETAILS, result);
}

function isProtectionScroll(result: TreasureScroll): boolean {
  switch (result) {
    case TreasureScroll.ProtectionDemons:
    case TreasureScroll.ProtectionDevils:
    case TreasureScroll.ProtectionElementals:
    case TreasureScroll.ProtectionLycanthropes:
    case TreasureScroll.ProtectionMagic:
    case TreasureScroll.ProtectionPetrification:
    case TreasureScroll.ProtectionPossession:
    case TreasureScroll.ProtectionUndead:
      return true;
    default:
      return false;
  }
}

function rollCasterType(): ScrollCaster {
  const clericRoll = rollDice(100);
  if (clericRoll >= 71) {
    const druidRoll = rollDice(100);
    return druidRoll <= 25 ? 'druid' : 'cleric';
  }
  const illusionistRoll = rollDice(100);
  return illusionistRoll <= 10 ? 'illusionist' : 'magic-user';
}

function rollSpellLevels(count: number, range: [number, number]): number[] {
  const [min, max] = range;
  const levels: number[] = [];
  for (let i = 0; i < count; i += 1) {
    const level = rollDice(max - min + 1) + min - 1;
    levels.push(level);
  }
  return levels;
}

export function resolveTreasureScroll(options?: {
  roll?: number;
  level?: number;
  treasureRoll?: number;
  rollIndex?: number;
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(treasureScrolls.sides);
  const command = getTableEntry(usedRoll, treasureScrolls);
  const event: TreasureScrollEvent = {
    ...buildTreasureEvent('treasureScroll', command, usedRoll, options),
    scroll: { type: 'curse' },
  };
  const children: DungeonOutcomeNode[] = [];

  if (isSpellScroll(command)) {
    const detail = SCROLL_SPELL_DETAILS[command];
    const caster = rollCasterType();
    const range = detail
      ? caster === 'magic-user' || caster === 'illusionist'
        ? detail.magicUserRange
        : detail.clericRange
      : undefined;
    const spellCount = detail?.spells ?? 0;
    const levels = range ? rollSpellLevels(spellCount, range) : [];
    event.scroll = {
      type: 'spells',
      caster,
      spellLevels: levels,
    };
  } else if (isProtectionScroll(command)) {
    event.scroll = {
      type: 'protection',
      protection: command,
    };
    const followup = scrollFollowups.find(
      (candidate) => candidate.result === command
    );
    if (followup) {
      children.push(
        createPendingRoll({
          kind: followup.table,
          args: {
            kind: 'treasureMagic',
            level: event.level,
            treasureRoll: usedRoll,
            rollIndex: event.rollIndex,
          },
        })
      );
    }
  } else {
    event.scroll = { type: 'curse' };
  }

  return {
    type: 'event',
    roll: usedRoll,
    event,
    children: children.length ? children : undefined,
  };
}

export function resolveTreasureScrollProtectionElementals(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  const usedRoll =
    options?.roll ?? rollDice(treasureScrollProtectionElementals.sides);
  const command = getTableEntry(usedRoll, treasureScrollProtectionElementals);
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'treasureScrollProtectionElementals',
      result: command,
    } as OutcomeEvent,
  };
}

export function resolveTreasureScrollProtectionLycanthropes(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  const usedRoll =
    options?.roll ?? rollDice(treasureScrollProtectionLycanthropes.sides);
  const command = getTableEntry(usedRoll, treasureScrollProtectionLycanthropes);
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'treasureScrollProtectionLycanthropes',
      result: command,
    } as OutcomeEvent,
  };
}
