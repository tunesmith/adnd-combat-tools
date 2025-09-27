import type {
  DungeonMessage,
  DungeonRenderNode,
  DungeonTablePreview,
  TableContext,
} from '../../types/dungeon';
import { getTableEntry, rollDice } from '../helpers/dungeonLookup';
import { getMonsterTable } from './wanderingMonsterResult';
import { MonsterLevel } from '../../tables/dungeon/monster/monsterLevel';
import {
  formatMonsterCount,
  getNumberOfMonsters,
} from './wanderingMonsterResult';
import {
  MonsterOne,
  monsterOne,
} from '../../tables/dungeon/monster/monsterOne';
import {
  MonsterTwo,
  monsterTwo,
} from '../../tables/dungeon/monster/monsterTwo';
import {
  MonsterThree,
  monsterThree,
  DragonThree,
  dragonThree,
} from '../../tables/dungeon/monster/monsterThree';
import {
  MonsterFour,
  monsterFour,
  DragonFourYounger,
  dragonFourYounger,
  DragonFourOlder,
  dragonFourOlder,
} from '../../tables/dungeon/monster/monsterFour';
import {
  MonsterFive,
  monsterFive,
  DragonFiveYounger,
  dragonFiveYounger,
  DragonFiveOlder,
  dragonFiveOlder,
} from '../../tables/dungeon/monster/monsterFive';
import {
  MonsterSix,
  monsterSix,
  DragonSix,
  dragonSix,
} from '../../tables/dungeon/monster/monsterSix';
import {
  humanResult,
  monsterOneTextForCommand,
} from './monster/monsterOneResult';
import { monsterTwoTextForCommand } from './monster/monsterTwoResult';
import { monsterThreeTextForCommand } from './monster/monsterThreeResult';
import { monsterFourTextForCommand } from './monster/monsterFourResult';
import { monsterFiveTextForCommand } from './monster/monsterFiveResult';
import { monsterSixTextForCommand } from './monster/monsterSixResult';

function rangeText(range: number[]): string {
  return range.length === 1
    ? `${range[0]}`
    : `${range[0]}–${range[range.length - 1]}`;
}

function parseLevelFromId(id: string): number {
  const parts = id.split(':');
  const n = Number(parts[1]);
  return Number.isFinite(n) ? n : 1;
}

function isWandering(
  ctx?: TableContext
): ctx is Extract<TableContext, { kind: 'wandering' }> {
  return !!ctx && ctx.kind === 'wandering';
}

export const monsterLevelMessages = (options: {
  id: string;
  roll?: number;
  detailMode?: boolean;
  context?: TableContext;
}): { usedRoll?: number; messages: DungeonRenderNode[] } => {
  const ctx = options.context;
  const dungeonLevel = isWandering(ctx)
    ? ctx.level
    : parseLevelFromId(options.id);
  const table = getMonsterTable(dungeonLevel);
  if (options.detailMode && options.roll === undefined) {
    const preview: DungeonTablePreview = {
      kind: 'table-preview',
      id: options.id,
      title: 'Monster Level',
      sides: table.sides,
      entries: table.entries.map((e) => ({
        range: rangeText(e.range),
        label: MonsterLevel[e.command] ?? String(e.command),
      })),
      context: { kind: 'wandering', level: dungeonLevel },
    };
    return { usedRoll: undefined, messages: [preview] };
  }
  const usedRoll = options.roll ?? rollDice(table.sides);
  const lvl = getTableEntry(usedRoll, table);
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Monster Level',
  };
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [`roll: ${usedRoll} — ${MonsterLevel[lvl]}`],
  };
  const messages: DungeonRenderNode[] = [heading, bullet];
  if (lvl === MonsterLevel.One) {
    // stage monsterOne preview
    messages.push({
      kind: 'table-preview',
      id: 'monsterOne',
      title: 'Monster (Level 1)',
      sides: monsterOne.sides,
      entries: monsterOne.entries.map((e) => ({
        range: rangeText(e.range),
        label: MonsterOne[e.command] ?? String(e.command),
      })),
      context: { kind: 'wandering', level: dungeonLevel },
    });
  } else {
    // Stage the corresponding monster table preview for levels 2–6
    if (lvl === MonsterLevel.Two) {
      messages.push({
        kind: 'table-preview',
        id: 'monsterTwo',
        title: 'Monster (Level 2)',
        sides: monsterTwo.sides,
        entries: monsterTwo.entries.map((e) => ({
          range: rangeText(e.range),
          label: MonsterTwo[e.command] ?? String(e.command),
        })),
        context: { kind: 'wandering', level: dungeonLevel },
      });
    } else if (lvl === MonsterLevel.Three) {
      messages.push({
        kind: 'table-preview',
        id: 'monsterThree',
        title: 'Monster (Level 3)',
        sides: monsterThree.sides,
        entries: monsterThree.entries.map((e) => ({
          range: rangeText(e.range),
          label: MonsterThree[e.command] ?? String(e.command),
        })),
        context: { kind: 'wandering', level: dungeonLevel },
      });
    } else if (lvl === MonsterLevel.Four) {
      messages.push({
        kind: 'table-preview',
        id: 'monsterFour',
        title: 'Monster (Level 4)',
        sides: monsterFour.sides,
        entries: monsterFour.entries.map((e) => ({
          range: rangeText(e.range),
          label: MonsterFour[e.command] ?? String(e.command),
        })),
        context: { kind: 'wandering', level: dungeonLevel },
      });
    } else if (lvl === MonsterLevel.Five) {
      messages.push({
        kind: 'table-preview',
        id: 'monsterFive',
        title: 'Monster (Level 5)',
        sides: monsterFive.sides,
        entries: monsterFive.entries.map((e) => ({
          range: rangeText(e.range),
          label: MonsterFive[e.command] ?? String(e.command),
        })),
        context: { kind: 'wandering', level: dungeonLevel },
      });
    } else if (lvl === MonsterLevel.Six) {
      messages.push({
        kind: 'table-preview',
        id: 'monsterSix',
        title: 'Monster (Level 6)',
        sides: monsterSix.sides,
        entries: monsterSix.entries.map((e) => ({
          range: rangeText(e.range),
          label: MonsterSix[e.command] ?? String(e.command),
        })),
        context: { kind: 'wandering', level: dungeonLevel },
      });
    } else {
      messages.push({
        kind: 'paragraph',
        text: `(TODO: Monster Level ${MonsterLevel[lvl]} preview)`,
      });
    }
  }
  return { usedRoll, messages };
};

export const monsterOneMessages = (options?: {
  roll?: number;
  detailMode?: boolean;
  context?: TableContext;
}): { usedRoll?: number; messages: DungeonRenderNode[] } => {
  const ctx = options?.context;
  const dungeonLevel = isWandering(ctx) ? ctx.level : 1;
  if (options?.detailMode && options.roll === undefined) {
    const preview: DungeonTablePreview = {
      kind: 'table-preview',
      id: 'monsterOne',
      title: 'Monster (Level 1)',
      sides: monsterOne.sides,
      entries: monsterOne.entries.map((e) => ({
        range: rangeText(e.range),
        label: MonsterOne[e.command] ?? String(e.command),
      })),
      context: { kind: 'wandering', level: dungeonLevel },
    };
    return { usedRoll: undefined, messages: [preview] };
  }
  const usedRoll = options?.roll ?? rollDice(monsterOne.sides);
  const cmd = getTableEntry(usedRoll, monsterOne);
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Monster (Level 1)',
  };
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [`roll: ${usedRoll} — ${MonsterOne[cmd]}`],
  };
  const messages: DungeonRenderNode[] = [heading, bullet];
  if (cmd === MonsterOne.Human) {
    // Stage human subtable preview
    messages.push({
      kind: 'table-preview',
      id: 'human',
      title: 'Human Subtable',
      sides: 100,
      entries: [
        { range: '1–25', label: 'Bandit' },
        { range: '26–30', label: 'Berserker' },
        { range: '31–45', label: 'Brigand' },
        { range: '46–100', label: 'Character' },
      ],
      context: { kind: 'wandering', level: dungeonLevel },
    });
  } else {
    messages.push({
      kind: 'paragraph',
      text: monsterOneTextForCommand(dungeonLevel, cmd),
    });
  }
  return { usedRoll, messages };
};

export const monsterTwoMessages = (options?: {
  roll?: number;
  detailMode?: boolean;
  context?: TableContext;
}): { usedRoll?: number; messages: DungeonRenderNode[] } => {
  const ctx = options?.context;
  const dungeonLevel = isWandering(ctx) ? ctx.level : 1;
  if (options?.detailMode && options.roll === undefined) {
    const preview: DungeonTablePreview = {
      kind: 'table-preview',
      id: 'monsterTwo',
      title: 'Monster (Level 2)',
      sides: monsterTwo.sides,
      entries: monsterTwo.entries.map((e) => ({
        range: rangeText(e.range),
        label: MonsterTwo[e.command] ?? String(e.command),
      })),
      context: { kind: 'wandering', level: dungeonLevel },
    };
    return { usedRoll: undefined, messages: [preview] };
  }
  const usedRoll = options?.roll ?? rollDice(monsterTwo.sides);
  const cmd = getTableEntry(usedRoll, monsterTwo);
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Monster (Level 2)',
  };
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [`roll: ${usedRoll} — ${MonsterTwo[cmd]}`],
  };
  const messages: DungeonRenderNode[] = [
    heading,
    bullet,
    {
      kind: 'paragraph',
      text: monsterTwoTextForCommand(dungeonLevel, cmd).text,
    },
  ];
  return { usedRoll, messages };
};

export const monsterThreeMessages = (options?: {
  roll?: number;
  detailMode?: boolean;
  context?: TableContext;
}): { usedRoll?: number; messages: DungeonRenderNode[] } => {
  const ctx = options?.context;
  const dungeonLevel = isWandering(ctx) ? ctx.level : 1;
  if (options?.detailMode && options.roll === undefined) {
    const preview: DungeonTablePreview = {
      kind: 'table-preview',
      id: 'monsterThree',
      title: 'Monster (Level 3)',
      sides: monsterThree.sides,
      entries: monsterThree.entries.map((e) => ({
        range: rangeText(e.range),
        label: MonsterThree[e.command] ?? String(e.command),
      })),
      context: { kind: 'wandering', level: dungeonLevel },
    };
    return { usedRoll: undefined, messages: [preview] };
  }
  const usedRoll = options?.roll ?? rollDice(monsterThree.sides);
  const cmd = getTableEntry(usedRoll, monsterThree);
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Monster (Level 3)',
  };
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [`roll: ${usedRoll} — ${MonsterThree[cmd]}`],
  };
  const messages: DungeonRenderNode[] = [heading, bullet];
  if (cmd === MonsterThree.Dragon) {
    messages.push({
      kind: 'table-preview',
      id: 'dragonThree',
      title: 'Dragon (Level 3)',
      sides: dragonThree.sides,
      entries: dragonThree.entries.map((e) => ({
        range: rangeText(e.range),
        label: DragonThree[e.command] ?? String(e.command),
      })),
      context: { kind: 'wandering', level: dungeonLevel },
    });
  } else {
    messages.push({
      kind: 'paragraph',
      text: monsterThreeTextForCommand(dungeonLevel, cmd).text,
    });
  }
  return { usedRoll, messages };
};

export const monsterFourMessages = (options?: {
  roll?: number;
  detailMode?: boolean;
  context?: TableContext;
}): { usedRoll?: number; messages: DungeonRenderNode[] } => {
  const ctx = options?.context;
  const dungeonLevel = isWandering(ctx) ? ctx.level : 1;
  if (options?.detailMode && options.roll === undefined) {
    const preview: DungeonTablePreview = {
      kind: 'table-preview',
      id: 'monsterFour',
      title: 'Monster (Level 4)',
      sides: monsterFour.sides,
      entries: monsterFour.entries.map((e) => ({
        range: rangeText(e.range),
        label: MonsterFour[e.command] ?? String(e.command),
      })),
      context: { kind: 'wandering', level: dungeonLevel },
    };
    return { usedRoll: undefined, messages: [preview] };
  }
  const usedRoll = options?.roll ?? rollDice(monsterFour.sides);
  const cmd = getTableEntry(usedRoll, monsterFour);
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Monster (Level 4)',
  };
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [`roll: ${usedRoll} — ${MonsterFour[cmd]}`],
  };
  const messages: DungeonRenderNode[] = [heading, bullet];
  if (cmd === MonsterFour.DragonYounger) {
    messages.push({
      kind: 'table-preview',
      id: 'dragonFourYounger',
      title: 'Dragon (Younger)',
      sides: dragonFourYounger.sides,
      entries: dragonFourYounger.entries.map((e) => ({
        range: rangeText(e.range),
        label: DragonFourYounger[e.command] ?? String(e.command),
      })),
      context: { kind: 'wandering', level: dungeonLevel },
    });
  } else if (cmd === MonsterFour.DragonOlder) {
    messages.push({
      kind: 'table-preview',
      id: 'dragonFourOlder',
      title: 'Dragon (Older)',
      sides: dragonFourOlder.sides,
      entries: dragonFourOlder.entries.map((e) => ({
        range: rangeText(e.range),
        label: DragonFourOlder[e.command] ?? String(e.command),
      })),
      context: { kind: 'wandering', level: dungeonLevel },
    });
  } else {
    messages.push({
      kind: 'paragraph',
      text: monsterFourTextForCommand(dungeonLevel, cmd).text,
    });
  }
  return { usedRoll, messages };
};

export const monsterFiveMessages = (options?: {
  roll?: number;
  detailMode?: boolean;
  context?: TableContext;
}): { usedRoll?: number; messages: DungeonRenderNode[] } => {
  const ctx = options?.context;
  const dungeonLevel = isWandering(ctx) ? ctx.level : 1;
  if (options?.detailMode && options.roll === undefined) {
    const preview: DungeonTablePreview = {
      kind: 'table-preview',
      id: 'monsterFive',
      title: 'Monster (Level 5)',
      sides: monsterFive.sides,
      entries: monsterFive.entries.map((e) => ({
        range: rangeText(e.range),
        label: MonsterFive[e.command] ?? String(e.command),
      })),
      context: { kind: 'wandering', level: dungeonLevel },
    };
    return { usedRoll: undefined, messages: [preview] };
  }
  const usedRoll = options?.roll ?? rollDice(monsterFive.sides);
  const cmd = getTableEntry(usedRoll, monsterFive);
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Monster (Level 5)',
  };
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [`roll: ${usedRoll} — ${MonsterFive[cmd]}`],
  };
  const messages: DungeonRenderNode[] = [heading, bullet];
  if (cmd === MonsterFive.DragonYounger) {
    messages.push({
      kind: 'table-preview',
      id: 'dragonFiveYounger',
      title: 'Dragon (Younger)',
      sides: dragonFiveYounger.sides,
      entries: dragonFiveYounger.entries.map((e) => ({
        range: rangeText(e.range),
        label: DragonFiveYounger[e.command] ?? String(e.command),
      })),
      context: { kind: 'wandering', level: dungeonLevel },
    });
  } else if (cmd === MonsterFive.DragonOlder) {
    messages.push({
      kind: 'table-preview',
      id: 'dragonFiveOlder',
      title: 'Dragon (Older)',
      sides: dragonFiveOlder.sides,
      entries: dragonFiveOlder.entries.map((e) => ({
        range: rangeText(e.range),
        label: DragonFiveOlder[e.command] ?? String(e.command),
      })),
      context: { kind: 'wandering', level: dungeonLevel },
    });
  } else {
    messages.push({
      kind: 'paragraph',
      text: monsterFiveTextForCommand(dungeonLevel, cmd).text,
    });
  }
  return { usedRoll, messages };
};

export const monsterSixMessages = (options?: {
  roll?: number;
  detailMode?: boolean;
  context?: TableContext;
}): { usedRoll?: number; messages: DungeonRenderNode[] } => {
  const ctx = options?.context;
  const dungeonLevel = isWandering(ctx) ? ctx.level : 1;
  if (options?.detailMode && options.roll === undefined) {
    const preview: DungeonTablePreview = {
      kind: 'table-preview',
      id: 'monsterSix',
      title: 'Monster (Level 6)',
      sides: monsterSix.sides,
      entries: monsterSix.entries.map((e) => ({
        range: rangeText(e.range),
        label: MonsterSix[e.command] ?? String(e.command),
      })),
      context: { kind: 'wandering', level: dungeonLevel },
    };
    return { usedRoll: undefined, messages: [preview] };
  }
  const usedRoll = options?.roll ?? rollDice(monsterSix.sides);
  const cmd = getTableEntry(usedRoll, monsterSix);
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Monster (Level 6)',
  };
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [`roll: ${usedRoll} — ${MonsterSix[cmd]}`],
  };
  const messages: DungeonRenderNode[] = [heading, bullet];
  if (cmd === MonsterSix.Dragon) {
    messages.push({
      kind: 'table-preview',
      id: 'dragonSix',
      title: 'Dragon',
      sides: dragonSix.sides,
      entries: dragonSix.entries.map((e) => ({
        range: rangeText(e.range),
        label: DragonSix[e.command] ?? String(e.command),
      })),
      context: { kind: 'wandering', level: dungeonLevel },
    });
  } else {
    messages.push({
      kind: 'paragraph',
      text: monsterSixTextForCommand(dungeonLevel, cmd).text,
    });
  }
  return { usedRoll, messages };
};

// Minimal dragon subtable resolvers (previews + simple bullet on resolve)
export const dragonThreeMessages = (options?: {
  roll?: number;
  detailMode?: boolean;
  context?: TableContext;
}): { usedRoll?: number; messages: DungeonRenderNode[] } => {
  if (options?.detailMode && options.roll === undefined) {
    const preview: DungeonTablePreview = {
      kind: 'table-preview',
      id: 'dragonThree',
      title: 'Dragon (Level 3)',
      sides: dragonThree.sides,
      entries: dragonThree.entries.map((e) => ({
        range: rangeText(e.range),
        label: DragonThree[e.command] ?? String(e.command),
      })),
      context: options?.context,
    };
    return { usedRoll: undefined, messages: [preview] };
  }
  const usedRoll = options?.roll ?? 1;
  const cmd = getTableEntry(usedRoll, dragonThree);
  const ctx = options?.context;
  const level = isWandering(ctx) ? ctx.level : 3;
  let text = '';
  const n = getNumberOfMonsters(3, level, 1, 1);
  switch (cmd) {
    case DragonThree.Black_VeryYoung_1:
      text =
        formatMonsterCount(
          n,
          'very young black dragon with 1 hit point per die',
          'very young black dragons with 1 hit point per die'
        ) + '(Determine the number of hit dice for a dragon as normal.) ';
      break;
    case DragonThree.Brass_VeryYoung_1:
      text =
        formatMonsterCount(
          n,
          'very young brass dragon with 1 hit point per die',
          'very young brass dragons with 1 hit point per die'
        ) + '(Determine the number of hit dice for a dragon as normal.) ';
      break;
    case DragonThree.White_VeryYoung_1:
      text =
        formatMonsterCount(
          n,
          'very young white dragon with 1 hit point per die',
          'very young white dragons with 1 hit point per die'
        ) + '(Determine the number of hit dice for a dragon as normal.) ';
      break;
  }
  return {
    usedRoll,
    messages: [
      { kind: 'heading', level: 4, text: 'Dragon (Level 3)' },
      {
        kind: 'bullet-list',
        items: [`roll: ${usedRoll} — ${DragonThree[cmd]}`],
      },
      { kind: 'paragraph', text },
    ],
  };
};

export const dragonFourYoungerMessages = (options?: {
  roll?: number;
  detailMode?: boolean;
  context?: TableContext;
}): { usedRoll?: number; messages: DungeonRenderNode[] } => {
  if (options?.detailMode && options.roll === undefined) {
    const preview: DungeonTablePreview = {
      kind: 'table-preview',
      id: 'dragonFourYounger',
      title: 'Dragon (Younger)',
      sides: dragonFourYounger.sides,
      entries: dragonFourYounger.entries.map((e) => ({
        range: rangeText(e.range),
        label: DragonFourYounger[e.command] ?? String(e.command),
      })),
      context: options?.context,
    };
    return { usedRoll: undefined, messages: [preview] };
  }
  const usedRoll = options?.roll ?? 1;
  const cmd = getTableEntry(usedRoll, dragonFourYounger);
  const ctx = options?.context;
  const level = isWandering(ctx) ? ctx.level : 4;
  const n = getNumberOfMonsters(4, level, 1, 1);
  const make = (color: string, age: string, hp: number) =>
    formatMonsterCount(
      n,
      `${age} ${color} dragon with ${hp} hit point per die`,
      `${age} ${color} dragons with ${hp} hit points per die`
    ) + '(Determine the number of hit dice for a dragon as normal.) ';
  let text = '';
  switch (cmd) {
    case DragonFourYounger.Black_Young_2:
      text = make('black', 'young', 2);
      break;
    case DragonFourYounger.Blue_VeryYoung_1:
      text = make('blue', 'very young', 1);
      break;
    case DragonFourYounger.Brass_Young_2:
      text = make('brass', 'young', 2);
      break;
    case DragonFourYounger.Bronze_VeryYoung_1:
      text = make('bronze', 'very young', 1);
      break;
    case DragonFourYounger.Copper_VeryYoung_1:
      text = make('copper', 'very young', 1);
      break;
    case DragonFourYounger.Gold_VeryYoung_1:
      text = make('gold', 'very young', 1);
      break;
    case DragonFourYounger.Green_VeryYoung_1:
      text = make('green', 'very young', 1);
      break;
    case DragonFourYounger.Red_VeryYoung_1:
      text = make('red', 'very young', 1);
      break;
    case DragonFourYounger.Silver_VeryYoung_1:
      text = make('silver', 'very young', 1);
      break;
    case DragonFourYounger.White_Young_2:
      text = make('white', 'young', 2);
      break;
  }
  return {
    usedRoll,
    messages: [
      { kind: 'heading', level: 4, text: 'Dragon (Younger)' },
      {
        kind: 'bullet-list',
        items: [`roll: ${usedRoll} — ${DragonFourYounger[cmd]}`],
      },
      { kind: 'paragraph', text },
    ],
  };
};

export const dragonFourOlderMessages = (options?: {
  roll?: number;
  detailMode?: boolean;
  context?: TableContext;
}): { usedRoll?: number; messages: DungeonRenderNode[] } => {
  if (options?.detailMode && options.roll === undefined) {
    const preview: DungeonTablePreview = {
      kind: 'table-preview',
      id: 'dragonFourOlder',
      title: 'Dragon (Older)',
      sides: dragonFourOlder.sides,
      entries: dragonFourOlder.entries.map((e) => ({
        range: rangeText(e.range),
        label: DragonFourOlder[e.command] ?? String(e.command),
      })),
      context: options?.context,
    };
    return { usedRoll: undefined, messages: [preview] };
  }
  const usedRoll = options?.roll ?? 1;
  const cmd = getTableEntry(usedRoll, dragonFourOlder);
  const ctx = options?.context;
  const level = isWandering(ctx) ? ctx.level : 4;
  const n = getNumberOfMonsters(4, level, 1, 1);
  const make = (color: string, age: string, hp: number) =>
    formatMonsterCount(
      n,
      `${age} ${color} dragon with ${hp} hit point per die`,
      `${age} ${color} dragons with ${hp} hit points per die`
    ) + '(Determine the number of hit dice for a dragon as normal.) ';
  let text = '';
  switch (cmd) {
    case DragonFourOlder.Black_SubAdult_3:
      text = make('black', 'sub-adult', 3);
      break;
    case DragonFourOlder.Blue_Young_2:
      text = make('blue', 'young', 2);
      break;
    case DragonFourOlder.Brass_SubAdult_3:
      text = make('brass', 'sub-adult', 3);
      break;
    case DragonFourOlder.Bronze_Young_2:
      text = make('bronze', 'young', 2);
      break;
    case DragonFourOlder.Copper_Young_2:
      text = make('copper', 'young', 2);
      break;
    case DragonFourOlder.Gold_Young_2:
      text = make('gold', 'young', 2);
      break;
    case DragonFourOlder.Green_Young_2:
      text = make('green', 'young', 2);
      break;
    case DragonFourOlder.Red_Young_2:
      text = make('red', 'young', 2);
      break;
    case DragonFourOlder.Silver_Young_2:
      text = make('silver', 'young', 2);
      break;
    case DragonFourOlder.White_SubAdult_3:
      text = make('white', 'sub-adult', 3);
      break;
  }
  return {
    usedRoll,
    messages: [
      { kind: 'heading', level: 4, text: 'Dragon (Older)' },
      {
        kind: 'bullet-list',
        items: [`roll: ${usedRoll} — ${DragonFourOlder[cmd]}`],
      },
      { kind: 'paragraph', text },
    ],
  };
};

export const dragonFiveYoungerMessages = (options?: {
  roll?: number;
  detailMode?: boolean;
  context?: TableContext;
}): { usedRoll?: number; messages: DungeonRenderNode[] } => {
  if (options?.detailMode && options.roll === undefined) {
    const preview: DungeonTablePreview = {
      kind: 'table-preview',
      id: 'dragonFiveYounger',
      title: 'Dragon (Younger)',
      sides: dragonFiveYounger.sides,
      entries: dragonFiveYounger.entries.map((e) => ({
        range: rangeText(e.range),
        label: DragonFiveYounger[e.command] ?? String(e.command),
      })),
      context: options?.context,
    };
    return { usedRoll: undefined, messages: [preview] };
  }
  const usedRoll = options?.roll ?? 1;
  const cmd = getTableEntry(usedRoll, dragonFiveYounger);
  const ctx = options?.context;
  const level = isWandering(ctx) ? ctx.level : 5;
  const n = getNumberOfMonsters(5, level, 1, 1);
  const make = (color: string, age: string, hp: number) =>
    formatMonsterCount(
      n,
      `${age} ${color} dragon with ${hp} hit points per die`,
      `${age} ${color} dragons with ${hp} hit points per die`
    ) + '(Determine the number of hit dice for a dragon as normal.) ';
  let text = '';
  switch (cmd) {
    case DragonFiveYounger.Black_YoungAdult_4:
      text = make('black', 'young adult', 4);
      break;
    case DragonFiveYounger.Blue_SubAdult_3:
      text = make('blue', 'sub-adult', 3);
      break;
    case DragonFiveYounger.Brass_YoungAdult_4:
      text = make('brass', 'young adult', 4);
      break;
    case DragonFiveYounger.Bronze_SubAdult_3:
      text = make('bronze', 'sub-adult', 3);
      break;
    case DragonFiveYounger.Copper_SubAdult_3:
      text = make('copper', 'sub-adult', 3);
      break;
    case DragonFiveYounger.Gold_SubAdult_3:
      text = make('gold', 'sub-adult', 3);
      break;
    case DragonFiveYounger.Green_SubAdult_3:
      text = make('green', 'sub-adult', 3);
      break;
    case DragonFiveYounger.Red_SubAdult_3:
      text = make('red', 'sub-adult', 3);
      break;
    case DragonFiveYounger.Silver_SubAdult_3:
      text = make('silver', 'sub-adult', 3);
      break;
    case DragonFiveYounger.White_YoungAdult_4:
      text = make('white', 'young adult', 4);
      break;
  }
  return {
    usedRoll,
    messages: [
      { kind: 'heading', level: 4, text: 'Dragon (Younger)' },
      {
        kind: 'bullet-list',
        items: [`roll: ${usedRoll} — ${DragonFiveYounger[cmd]}`],
      },
      { kind: 'paragraph', text },
    ],
  };
};

export const dragonFiveOlderMessages = (options?: {
  roll?: number;
  detailMode?: boolean;
  context?: TableContext;
}): { usedRoll?: number; messages: DungeonRenderNode[] } => {
  if (options?.detailMode && options.roll === undefined) {
    const preview: DungeonTablePreview = {
      kind: 'table-preview',
      id: 'dragonFiveOlder',
      title: 'Dragon (Older)',
      sides: dragonFiveOlder.sides,
      entries: dragonFiveOlder.entries.map((e) => ({
        range: rangeText(e.range),
        label: DragonFiveOlder[e.command] ?? String(e.command),
      })),
      context: options?.context,
    };
    return { usedRoll: undefined, messages: [preview] };
  }
  const usedRoll = options?.roll ?? 1;
  const cmd = getTableEntry(usedRoll, dragonFiveOlder);
  const ctx = options?.context;
  const level = isWandering(ctx) ? ctx.level : 5;
  const n = getNumberOfMonsters(5, level, 1, 1);
  const make = (color: string, age: string, hp: number) =>
    formatMonsterCount(
      n,
      `${age} ${color} dragon with ${hp} hit points per die`,
      `${age} ${color} dragons with ${hp} hit points per die`
    ) + '(Determine the number of hit dice for a dragon as normal.) ';
  let text = '';
  switch (cmd) {
    case DragonFiveOlder.Black_Adult_5:
      text = make('black', 'adult', 5);
      break;
    case DragonFiveOlder.Blue_YoungAdult_4:
      text = make('blue', 'young adult', 4);
      break;
    case DragonFiveOlder.Brass_Adult_5:
      text = make('brass', 'adult', 5);
      break;
    case DragonFiveOlder.Bronze_YoungAdult_4:
      text = make('bronze', 'young adult', 4);
      break;
    case DragonFiveOlder.Copper_YoungAdult_4:
      text = make('copper', 'young adult', 4);
      break;
    case DragonFiveOlder.Gold_YoungAdult_4:
      text = make('gold', 'young adult', 4);
      break;
    case DragonFiveOlder.Green_YoungAdult_4:
      text = make('green', 'young adult', 4);
      break;
    case DragonFiveOlder.Red_YoungAdult_4:
      text = make('red', 'young adult', 4);
      break;
    case DragonFiveOlder.Silver_YoungAdult_4:
      text = make('silver', 'young adult', 4);
      break;
    case DragonFiveOlder.White_Adult_5:
      text = make('white', 'adult', 5);
      break;
  }
  return {
    usedRoll,
    messages: [
      { kind: 'heading', level: 4, text: 'Dragon (Older)' },
      {
        kind: 'bullet-list',
        items: [`roll: ${usedRoll} — ${DragonFiveOlder[cmd]}`],
      },
      { kind: 'paragraph', text },
    ],
  };
};

export const dragonSixMessages = (options?: {
  roll?: number;
  detailMode?: boolean;
  context?: TableContext;
}): { usedRoll?: number; messages: DungeonRenderNode[] } => {
  if (options?.detailMode && options.roll === undefined) {
    const preview: DungeonTablePreview = {
      kind: 'table-preview',
      id: 'dragonSix',
      title: 'Dragon',
      sides: dragonSix.sides,
      entries: dragonSix.entries.map((e) => ({
        range: rangeText(e.range),
        label: DragonSix[e.command] ?? String(e.command),
      })),
      context: options?.context,
    };
    return { usedRoll: undefined, messages: [preview] };
  }
  const usedRoll = options?.roll ?? 1;
  const cmd = getTableEntry(usedRoll, dragonSix);
  const ctx = options?.context;
  const level = isWandering(ctx) ? ctx.level : 6;
  const n = getNumberOfMonsters(6, level, 1, 1);
  const make = (color: string, age: string, hp: number) =>
    formatMonsterCount(
      n,
      `${age} ${color} dragon with ${hp} hit points per die`,
      `${age} ${color} dragons with ${hp} hit points per die`
    ) + '(Determine the number of hit dice for a dragon as normal.) ';
  let text = '';
  switch (cmd) {
    case DragonSix.Black_Old_6:
      text = make('black', 'old', 6);
      break;
    case DragonSix.Blue_Adult_5:
      text = make('blue', 'adult', 5);
      break;
    case DragonSix.Brass_Old_6:
      text = make('brass', 'old', 6);
      break;
    case DragonSix.Bronze_Adult_5:
      text = make('bronze', 'adult', 5);
      break;
    case DragonSix.Copper_Adult_5:
      text = make('copper', 'adult', 5);
      break;
    case DragonSix.Gold_Adult_5:
      text = make('gold', 'adult', 5);
      break;
    case DragonSix.Green_Adult_5:
      text = make('green', 'adult', 5);
      break;
    case DragonSix.Red_Adult_5:
      text = make('red', 'adult', 5);
      break;
    case DragonSix.Silver_Adult_5:
      text = make('silver', 'adult', 5);
      break;
    case DragonSix.White_Old_6:
      text = make('white', 'old', 6);
      break;
  }
  return {
    usedRoll,
    messages: [
      { kind: 'heading', level: 4, text: 'Dragon' },
      { kind: 'bullet-list', items: [`roll: ${usedRoll} — ${DragonSix[cmd]}`] },
      { kind: 'paragraph', text },
    ],
  };
};

export const humanMessages = (options?: {
  roll?: number;
  detailMode?: boolean;
  context?: TableContext;
}): { usedRoll?: number; messages: DungeonRenderNode[] } => {
  const ctx = options?.context;
  const dungeonLevel = isWandering(ctx) ? ctx.level : 1;
  if (options?.detailMode && options.roll === undefined) {
    const preview: DungeonTablePreview = {
      kind: 'table-preview',
      id: 'human',
      title: 'Human Subtable',
      sides: 100,
      entries: [
        { range: '1–25', label: 'Bandit' },
        { range: '26–30', label: 'Berserker' },
        { range: '31–45', label: 'Brigand' },
        { range: '46–100', label: 'Character' },
      ],
      context: { kind: 'wandering', level: dungeonLevel },
    };
    return { usedRoll: undefined, messages: [preview] };
  }
  const usedRoll = options?.roll ?? 50; // default into Character bucket
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Human Subtable',
  };
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [`roll: ${usedRoll}`],
  };
  const messages: DungeonRenderNode[] = [
    heading,
    bullet,
    { kind: 'paragraph', text: humanResult(dungeonLevel) },
  ];
  return { usedRoll, messages };
};
