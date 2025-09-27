import type {
  DungeonTablePreview,
  TableContext,
} from '../../../../types/dungeon';
import type { OutcomeEventNode } from '../../../domain/outcome';
import {
  monsterOne,
  MonsterOne,
} from '../../../../tables/dungeon/monster/monsterOne';
import {
  monsterTwo,
  MonsterTwo,
} from '../../../../tables/dungeon/monster/monsterTwo';
import {
  monsterThree,
  MonsterThree,
  dragonThree,
  DragonThree,
} from '../../../../tables/dungeon/monster/monsterThree';
import {
  monsterFour,
  MonsterFour,
  dragonFourYounger,
  DragonFourYounger,
  dragonFourOlder,
  DragonFourOlder,
} from '../../../../tables/dungeon/monster/monsterFour';
import {
  monsterFive,
  MonsterFive,
  dragonFiveYounger,
  DragonFiveYounger,
  dragonFiveOlder,
  DragonFiveOlder,
} from '../../../../tables/dungeon/monster/monsterFive';
import {
  monsterSix,
  MonsterSix,
  dragonSix,
  DragonSix,
} from '../../../../tables/dungeon/monster/monsterSix';
import { buildPreview } from '../shared';
import {
  monsterTextDescription,
  hasPendingChildren,
  type MonsterDescription,
} from './shared';
import { buildPartyCharacterMessage, buildPartyCompactText } from './human';
import { summarizePartyResult } from '../../../helpers/party/formatPartyResult';

type StandardTableId =
  | 'monsterOne'
  | 'monsterTwo'
  | 'monsterThree'
  | 'monsterFour'
  | 'monsterFive'
  | 'monsterSix';

type DragonTableId =
  | 'dragonThree'
  | 'dragonFourYounger'
  | 'dragonFourOlder'
  | 'dragonFiveYounger'
  | 'dragonFiveOlder'
  | 'dragonSix';

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
      | typeof monsterSix;
    labels:
      | typeof MonsterOne
      | typeof MonsterTwo
      | typeof MonsterThree
      | typeof MonsterFour
      | typeof MonsterFive
      | typeof MonsterSix;
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
      | typeof dragonSix;
    labels:
      | typeof DragonThree
      | typeof DragonFourYounger
      | typeof DragonFourOlder
      | typeof DragonFiveYounger
      | typeof DragonFiveOlder
      | typeof DragonSix;
  }
> = {
  dragonThree: {
    title: 'Dragon (Level 3)',
    table: dragonThree,
    labels: DragonThree,
  },
  dragonFourYounger: {
    title: 'Dragon (Younger)',
    table: dragonFourYounger,
    labels: DragonFourYounger,
  },
  dragonFourOlder: {
    title: 'Dragon (Older)',
    table: dragonFourOlder,
    labels: DragonFourOlder,
  },
  dragonFiveYounger: {
    title: 'Dragon (Younger)',
    table: dragonFiveYounger,
    labels: DragonFiveYounger,
  },
  dragonFiveOlder: {
    title: 'Dragon (Older)',
    table: dragonFiveOlder,
    labels: DragonFiveOlder,
  },
  dragonSix: { title: 'Dragon', table: dragonSix, labels: DragonSix },
};

export function describeStandardMonster(
  node: OutcomeEventNode
): MonsterDescription | undefined {
  const config = STANDARD_CONFIG[node.event.kind as StandardTableId];
  if (!config) return undefined;
  const event = node.event;
  if ('party' in event && event.party) {
    const summary = summarizePartyResult(event.party);
    return {
      heading: config.title,
      label: config.labels[event.result] ?? String(event.result),
      detailParagraphs: [buildPartyCharacterMessage(summary, 'detail')],
      compactText: buildPartyCompactText(summary),
      compactMessages: [buildPartyCharacterMessage(summary, 'compact')],
      appendPending: hasPendingChildren(node),
    };
  }
  const textInfo = monsterTextDescription(
    'text' in event ? event.text : undefined
  );
  return {
    heading: config.title,
    label: config.labels[event.result] ?? String(event.result),
    detailParagraphs: textInfo.detailParagraphs,
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
  const textInfo = monsterTextDescription(
    'text' in event ? event.text : undefined
  );
  return {
    heading: config.title,
    label: config.labels[event.result] ?? String(event.result),
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
