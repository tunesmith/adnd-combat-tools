import type { OutcomeEvent, OutcomeEventNode } from '../../../domain/outcome';
import { MonsterLevel } from '../../../../tables/dungeon/monster/monsterLevel';
import { findChildEvent } from '../shared';

const MONSTER_LEVEL_KIND: Partial<Record<MonsterLevel, OutcomeEvent['kind']>> =
  {
    [MonsterLevel.One]: 'monsterOne',
    [MonsterLevel.Two]: 'monsterTwo',
    [MonsterLevel.Three]: 'monsterThree',
    [MonsterLevel.Four]: 'monsterFour',
    [MonsterLevel.Five]: 'monsterFive',
    [MonsterLevel.Six]: 'monsterSix',
  };

export function renderWanderingMonsterCompact(
  level: number,
  levelNode?: OutcomeEventNode
): string {
  return `Wandering Monster: ${readMonsterEncounter(level, levelNode)}`;
}

function readMonsterEncounter(
  level: number,
  levelNode?: OutcomeEventNode
): string {
  if (!levelNode || levelNode.event.kind !== 'monsterLevel') {
    const fallback = levelToMonsterLevel(level) ?? MonsterLevel.One;
    return fallbackMonsterLevelText(fallback);
  }
  return readMonsterEncounterFromLevelNode(levelNode);
}

function readMonsterEncounterFromLevelNode(node: OutcomeEventNode): string {
  if (node.event.kind !== 'monsterLevel') {
    return fallbackMonsterLevelText(MonsterLevel.One);
  }
  const mapping = MONSTER_LEVEL_KIND[node.event.result];
  if (!mapping) {
    return fallbackMonsterLevelText(node.event.result);
  }
  const monsterNode = findChildEvent(node, mapping);
  if (!monsterNode) {
    return fallbackMonsterLevelText(node.event.result);
  }
  const text = readMonsterEventText(monsterNode);
  return text ?? fallbackMonsterLevelText(node.event.result);
}

function readMonsterEventText(node: OutcomeEventNode): string | undefined {
  switch (node.event.kind) {
    case 'monsterOne': {
      if (node.event.text) return node.event.text;
      const humanNode = findChildEvent(node, 'human');
      return humanNode ? readMonsterEventText(humanNode) : undefined;
    }
    case 'monsterTwo':
    case 'monsterThree':
    case 'monsterFour':
    case 'monsterFive':
    case 'monsterSix': {
      if (node.event.text) return node.event.text;
      if (node.event.kind === 'monsterThree') {
        const dragon = findChildEvent(node, 'dragonThree');
        return dragon ? readMonsterEventText(dragon) : undefined;
      }
      if (node.event.kind === 'monsterFour') {
        const younger = findChildEvent(node, 'dragonFourYounger');
        if (younger) return readMonsterEventText(younger);
        const older = findChildEvent(node, 'dragonFourOlder');
        return older ? readMonsterEventText(older) : undefined;
      }
      if (node.event.kind === 'monsterFive') {
        const younger = findChildEvent(node, 'dragonFiveYounger');
        if (younger) return readMonsterEventText(younger);
        const older = findChildEvent(node, 'dragonFiveOlder');
        return older ? readMonsterEventText(older) : undefined;
      }
      if (node.event.kind === 'monsterSix') {
        const dragon = findChildEvent(node, 'dragonSix');
        return dragon ? readMonsterEventText(dragon) : undefined;
      }
      return undefined;
    }
    case 'dragonThree':
    case 'dragonFourYounger':
    case 'dragonFourOlder':
    case 'dragonFiveYounger':
    case 'dragonFiveOlder':
    case 'dragonSix':
    case 'human':
      return node.event.text;
    default:
      return undefined;
  }
}

function fallbackMonsterLevelText(level: MonsterLevel): string {
  switch (level) {
    case MonsterLevel.Seven:
      return '(TODO: Roll Monster for Level Seven)';
    case MonsterLevel.Eight:
      return '(TODO: Roll Monster for Level Eight)';
    case MonsterLevel.Nine:
      return '(TODO: Roll Monster for Level Nine)';
    case MonsterLevel.Ten:
      return '(TODO: Roll Monster for Level Ten)';
    default:
      return '(Unknown Monster Result)';
  }
}

function levelToMonsterLevel(level: number): MonsterLevel | undefined {
  if (!Number.isInteger(level)) return undefined;
  if (level <= 1) return MonsterLevel.One;
  if (level >= 10) return MonsterLevel.Ten;
  return (level - 1) as MonsterLevel;
}
