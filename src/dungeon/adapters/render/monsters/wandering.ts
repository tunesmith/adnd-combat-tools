import type { OutcomeEvent, OutcomeEventNode } from '../../../domain/outcome';
import type { DungeonRenderNode } from '../../../../types/dungeon';
import { MonsterLevel } from '../../../features/monsters/monsterLevel/monsterLevelTable';
import { findChildEvent } from '../shared';
import { describeMonsterOutcome } from './index';

const MONSTER_LEVEL_KIND: Partial<Record<MonsterLevel, OutcomeEvent['kind']>> =
  {
    [MonsterLevel.One]: 'monsterOne',
    [MonsterLevel.Two]: 'monsterTwo',
    [MonsterLevel.Three]: 'monsterThree',
    [MonsterLevel.Four]: 'monsterFour',
    [MonsterLevel.Five]: 'monsterFive',
    [MonsterLevel.Six]: 'monsterSix',
    [MonsterLevel.Seven]: 'monsterSeven',
    [MonsterLevel.Eight]: 'monsterEight',
    [MonsterLevel.Nine]: 'monsterNine',
    [MonsterLevel.Ten]: 'monsterTen',
  };

type MonsterCompactSummary = {
  text: string;
  nodes?: DungeonRenderNode[];
};

export function renderWanderingMonsterCompact(
  levelNode?: OutcomeEventNode
): MonsterCompactSummary {
  const encounter = readMonsterEncounter(levelNode);
  const suffix = encounter.text.trim();
  const rawText =
    suffix.length > 0 ? `Wandering Monster: ${suffix}` : 'Wandering Monster.';
  const text =
    rawText.endsWith(' ') || rawText.endsWith('.') ? rawText : `${rawText} `;
  return {
    text,
    nodes: encounter.nodes,
  };
}

function readMonsterEncounter(
  levelNode?: OutcomeEventNode
): MonsterCompactSummary {
  if (!levelNode || levelNode.event.kind !== 'monsterLevel') {
    return { text: '' };
  }
  return readMonsterEncounterFromLevelNode(levelNode);
}

function readMonsterEncounterFromLevelNode(
  node: OutcomeEventNode
): MonsterCompactSummary {
  if (node.event.kind !== 'monsterLevel') {
    return { text: '' };
  }
  const mapping = MONSTER_LEVEL_KIND[node.event.result];
  if (!mapping) {
    return { text: '' };
  }
  const monsterNode = findChildEvent(node, mapping);
  if (!monsterNode) {
    return { text: '' };
  }
  const summary = readMonsterEvent(monsterNode);
  if (!summary) {
    return { text: '' };
  }
  return summary;
}

function readMonsterEvent(
  node: OutcomeEventNode
): MonsterCompactSummary | undefined {
  const description = describeMonsterOutcome(node);
  if (description) {
    if (description.compactMessages && description.compactMessages.length > 0) {
      return {
        text: '',
        nodes: description.compactMessages,
      };
    }
    const compact = description.compactText.trim();
    if (compact.length > 0) {
      return { text: compact };
    }
  }
  switch (node.event.kind) {
    case 'monsterOne': {
      const humanNode = findChildEvent(node, 'human');
      if (humanNode) return readMonsterEvent(humanNode);
      if (node.event.text) return { text: node.event.text };
      break;
    }
    case 'monsterTwo':
    case 'monsterThree': {
      const dragon = findChildEvent(node, 'dragonThree');
      if (dragon) return readMonsterEvent(dragon);
      break;
    }
    case 'monsterFour': {
      const younger = findChildEvent(node, 'dragonFourYounger');
      if (younger) return readMonsterEvent(younger);
      const older = findChildEvent(node, 'dragonFourOlder');
      if (older) return readMonsterEvent(older);
      break;
    }
    case 'monsterFive': {
      const younger = findChildEvent(node, 'dragonFiveYounger');
      if (younger) return readMonsterEvent(younger);
      const older = findChildEvent(node, 'dragonFiveOlder');
      if (older) return readMonsterEvent(older);
      break;
    }
    case 'monsterSix': {
      const dragon = findChildEvent(node, 'dragonSix');
      if (dragon) return readMonsterEvent(dragon);
      break;
    }
    case 'monsterSeven': {
      const dragon = findChildEvent(node, 'dragonSeven');
      if (dragon) return readMonsterEvent(dragon);
      break;
    }
    case 'monsterEight': {
      const dragon = findChildEvent(node, 'dragonEight');
      if (dragon) return readMonsterEvent(dragon);
      break;
    }
    case 'monsterNine': {
      const dragon = findChildEvent(node, 'dragonNine');
      if (dragon) return readMonsterEvent(dragon);
      break;
    }
    case 'monsterTen': {
      const dragon = findChildEvent(node, 'dragonTen');
      if (dragon) return readMonsterEvent(dragon);
      break;
    }
    case 'dragonThree':
    case 'dragonFourYounger':
    case 'dragonFourOlder':
    case 'dragonFiveYounger':
    case 'dragonFiveOlder':
    case 'dragonSix':
    case 'dragonSeven':
    case 'dragonEight':
    case 'dragonNine':
    case 'dragonTen':
    case 'human':
      if (node.event.text) return { text: node.event.text };
      break;
    default:
      break;
  }
  return undefined;
}
