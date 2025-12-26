import type {
  DungeonTablePreview,
  TableContext,
} from '../../../../types/dungeon';
import type { OutcomeEvent, OutcomeEventNode } from '../../../domain/outcome';
import {
  monsterOne,
  MonsterOne,
} from '../monsterOne/monsterOneTables';
import {
  monsterTwo,
  MonsterTwo,
} from '../monsterTwo/monsterTwoTable';
import {
  monsterThree,
  MonsterThree,
  dragonThree,
  DragonThree,
} from '../monsterThree/monsterThreeTables';
import {
  monsterFour,
  MonsterFour,
  dragonFourYounger,
  DragonFourYounger,
  dragonFourOlder,
  DragonFourOlder,
} from '../monsterFour/monsterFourTables';
import {
  monsterFive,
  MonsterFive,
  dragonFiveYounger,
  DragonFiveYounger,
  dragonFiveOlder,
  DragonFiveOlder,
} from '../monsterFive/monsterFiveTables';
import {
  monsterSix,
  MonsterSix,
  dragonSix,
  DragonSix,
} from '../monsterSix/monsterSixTables';
import {
  monsterSeven,
  MonsterSeven,
  dragonSeven,
  DragonSeven,
} from '../monsterSeven/monsterSevenTables';
import {
  monsterEight,
  MonsterEight,
  dragonEight,
  DragonEight,
} from '../monsterEight/monsterEightTables';
import {
  monsterNine,
  MonsterNine,
  dragonNine,
  DragonNine,
} from '../../../../tables/dungeon/monster/monsterNine';
import {
  monsterTen,
  MonsterTen,
  dragonTen,
  DragonTen,
} from '../../../../tables/dungeon/monster/monsterTen';
import {
  buildPreview,
  findChildEvent,
} from '../../../adapters/render/shared';
import {
  monsterTextDescription,
  hasPendingChildren,
  type MonsterDescription,
} from './shared';
import { buildPartyCharacterMessage } from './partyMessage';
import { summarizePartyResult } from '../../../helpers/party/formatPartyResult';

type StandardTableId =
  | 'monsterOne'
  | 'monsterTwo'
  | 'monsterThree'
  | 'monsterFour'
  | 'monsterFive'
  | 'monsterSix'
  | 'monsterSeven'
  | 'monsterEight'
  | 'monsterNine'
  | 'monsterTen';

type DragonTableId =
  | 'dragonThree'
  | 'dragonFourYounger'
  | 'dragonFourOlder'
  | 'dragonFiveYounger'
  | 'dragonFiveOlder'
  | 'dragonSix'
  | 'dragonSeven'
  | 'dragonEight'
  | 'dragonNine'
  | 'dragonTen';

const STANDARD_CONFIG: Record<
  StandardTableId,
  {
    title: string;
    table:
      | typeof monsterOne
      | typeof monsterTwo
      | typeof monsterThree
      | typeof monsterFour
      | typeof monsterFive
      | typeof monsterSix
      | typeof monsterSeven
      | typeof monsterEight
      | typeof monsterNine
      | typeof monsterTen;
    labels:
      | typeof MonsterOne
      | typeof MonsterTwo
      | typeof MonsterThree
      | typeof MonsterFour
      | typeof MonsterFive
      | typeof MonsterSix
      | typeof MonsterSeven
      | typeof MonsterEight
      | typeof MonsterNine
      | typeof MonsterTen;
  }
> = {
  monsterOne: {
    title: 'Monster (Level 1)',
    table: monsterOne,
    labels: MonsterOne,
  },
  monsterTwo: {
    title: 'Monster (Level 2)',
    table: monsterTwo,
    labels: MonsterTwo,
  },
  monsterThree: {
    title: 'Monster (Level 3)',
    table: monsterThree,
    labels: MonsterThree,
  },
  monsterFour: {
    title: 'Monster (Level 4)',
    table: monsterFour,
    labels: MonsterFour,
  },
  monsterFive: {
    title: 'Monster (Level 5)',
    table: monsterFive,
    labels: MonsterFive,
  },
  monsterSix: {
    title: 'Monster (Level 6)',
    table: monsterSix,
    labels: MonsterSix,
  },
  monsterSeven: {
    title: 'Monster (Level 7)',
    table: monsterSeven,
    labels: MonsterSeven,
  },
  monsterEight: {
    title: 'Monster (Level 8)',
    table: monsterEight,
    labels: MonsterEight,
  },
  monsterNine: {
    title: 'Monster (Level 9)',
    table: monsterNine,
    labels: MonsterNine,
  },
  monsterTen: {
    title: 'Monster (Level 10)',
    table: monsterTen,
    labels: MonsterTen,
  },
};

const DRAGON_CONFIG: Record<
  DragonTableId,
  {
    title: string;
    table:
      | typeof dragonThree
      | typeof dragonFourYounger
      | typeof dragonFourOlder
      | typeof dragonFiveYounger
      | typeof dragonFiveOlder
      | typeof dragonSix
      | typeof dragonSeven
      | typeof dragonEight
      | typeof dragonNine
      | typeof dragonTen;
    labels:
      | typeof DragonThree
      | typeof DragonFourYounger
      | typeof DragonFourOlder
      | typeof DragonFiveYounger
      | typeof DragonFiveOlder
      | typeof DragonSix
      | typeof DragonSeven
      | typeof DragonEight
      | typeof DragonNine
      | typeof DragonTen;
  }
> = {
  dragonThree: {
    title: 'Dragon (Level 3)',
    table: dragonThree,
    labels: DragonThree,
  },
  dragonFourYounger: {
    title: 'Dragon (Level 4 Younger)',
    table: dragonFourYounger,
    labels: DragonFourYounger,
  },
  dragonFourOlder: {
    title: 'Dragon (Level 4 Older)',
    table: dragonFourOlder,
    labels: DragonFourOlder,
  },
  dragonFiveYounger: {
    title: 'Dragon (Level 5 Younger)',
    table: dragonFiveYounger,
    labels: DragonFiveYounger,
  },
  dragonFiveOlder: {
    title: 'Dragon (Level 5 Older)',
    table: dragonFiveOlder,
    labels: DragonFiveOlder,
  },
  dragonSix: { title: 'Dragon (Level 6)', table: dragonSix, labels: DragonSix },
  dragonSeven: {
    title: 'Dragon (Level 7)',
    table: dragonSeven,
    labels: DragonSeven,
  },
  dragonEight: {
    title: 'Dragon (Level 8)',
    table: dragonEight,
    labels: DragonEight,
  },
  dragonNine: {
    title: 'Dragon (Level 9)',
    table: dragonNine,
    labels: DragonNine,
  },
  dragonTen: {
    title: 'Dragon (Level 10)',
    table: dragonTen,
    labels: DragonTen,
  },
};

export function describeStandardMonster(
  node: OutcomeEventNode
): MonsterDescription | undefined {
  const config = STANDARD_CONFIG[node.event.kind as StandardTableId];
  if (!config) return undefined;
  const event = node.event;
  if (!('result' in event)) return undefined;
  if ('party' in event && event.party) {
    const summary = summarizePartyResult(event.party);
    return {
      heading: config.title,
      label:
        config.labels[event.result as keyof typeof config.labels] ??
        String(event.result),
      detailParagraphs: [buildPartyCharacterMessage(summary, 'detail')],
      compactText: '',
      compactMessages: [buildPartyCharacterMessage(summary, 'compact')],
      appendPending: hasPendingChildren(node),
    };
  }
  const textInfo = monsterTextDescription(
    'text' in event ? event.text : undefined
  );
  const suppressDetailParagraphs = hasResolvedDragonChild(node);
  return {
    heading: config.title,
    label:
      config.labels[event.result as keyof typeof config.labels] ??
      String(event.result),
    detailParagraphs: suppressDetailParagraphs ? [] : textInfo.detailParagraphs,
    compactText: textInfo.compactText,
    appendPending: hasPendingChildren(node),
  };
}

export function describeDragonMonster(
  node: OutcomeEventNode
): MonsterDescription | undefined {
  const config = DRAGON_CONFIG[node.event.kind as DragonTableId];
  if (!config) return undefined;
  const event = node.event;
  if (!('result' in event)) return undefined;
  const resolvedChildText = readResolvedChildText(node);
  const eventText =
    resolvedChildText ?? ('text' in event ? event.text : undefined);
  const textInfo = monsterTextDescription(eventText);
  return {
    heading: config.title,
    label:
      config.labels[event.result as keyof typeof config.labels] ??
      String(event.result),
    detailParagraphs: textInfo.detailParagraphs,
    compactText: textInfo.compactText,
    appendPending: hasPendingChildren(node),
  };
}

export function buildStandardMonsterPreview(
  tableId: StandardTableId,
  context?: TableContext
): DungeonTablePreview {
  const config = STANDARD_CONFIG[tableId];
  return buildPreview(tableId, {
    title: config.title,
    sides: config.table.sides,
    entries: config.table.entries.map((entry) => ({
      range: entry.range,
      label: config.labels[entry.command] ?? String(entry.command),
    })),
    context,
  });
}

export function buildDragonPreview(
  tableId: DragonTableId,
  context?: TableContext
): DungeonTablePreview {
  const config = DRAGON_CONFIG[tableId];
  return buildPreview(tableId, {
    title: config.title,
    sides: config.table.sides,
    entries: config.table.entries.map((entry) => ({
      range: entry.range,
      label: config.labels[entry.command] ?? String(entry.command),
    })),
    context,
  });
}

export function isStandardTableId(value: string): value is StandardTableId {
  return value in STANDARD_CONFIG;
}

export function isDragonTableId(value: string): value is DragonTableId {
  return value in DRAGON_CONFIG;
}

function readResolvedChildText(node: OutcomeEventNode): string | undefined {
  const childKind = findDragonChildKind(node);
  if (!childKind) return undefined;
  const child = findChildEvent(node, childKind);
  if (!child) return undefined;
  const childEvent = child.event;
  if ('text' in childEvent && typeof childEvent.text === 'string') {
    const text = childEvent.text.trim();
    if (text.length > 0) return childEvent.text;
  }
  return undefined;
}

function findDragonChildKind(
  node: OutcomeEventNode
): OutcomeEvent['kind'] | undefined {
  switch (node.event.kind) {
    case 'monsterThree':
      return node.event.result === MonsterThree.Dragon
        ? 'dragonThree'
        : undefined;
    case 'monsterFour':
      if (node.event.result === MonsterFour.DragonYounger)
        return 'dragonFourYounger';
      if (node.event.result === MonsterFour.DragonOlder)
        return 'dragonFourOlder';
      return undefined;
    case 'monsterFive':
      if (node.event.result === MonsterFive.DragonYounger)
        return 'dragonFiveYounger';
      if (node.event.result === MonsterFive.DragonOlder)
        return 'dragonFiveOlder';
      return undefined;
    case 'monsterSix':
      return node.event.result === MonsterSix.Dragon ? 'dragonSix' : undefined;
    case 'monsterSeven':
      return node.event.result === MonsterSeven.Dragon
        ? 'dragonSeven'
        : undefined;
    case 'monsterEight':
      return node.event.result === MonsterEight.Dragon
        ? 'dragonEight'
        : undefined;
    case 'monsterNine':
      return node.event.result === MonsterNine.Dragon
        ? 'dragonNine'
        : undefined;
    case 'monsterTen':
      return node.event.result === MonsterTen.Dragon ? 'dragonTen' : undefined;
    default:
      return undefined;
  }
}

function hasResolvedDragonChild(node: OutcomeEventNode): boolean {
  const childKind = findDragonChildKind(node);
  if (!childKind) return false;
  return !!findChildEvent(node, childKind);
}
