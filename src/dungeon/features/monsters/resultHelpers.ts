import type { PartyResult } from '../../models/character/characterSheet';
import { formatMonsterCount, getNumberOfMonsters } from './monsterCounts';

export type MonsterTextResult = {
  text: string;
  party?: PartyResult;
};

type MonsterCountTextEntry = {
  kind: 'count';
  rolls: number;
  sides: number;
  plus?: number;
  singular: string;
  plural: string;
};

type MonsterComputedCountTextEntry = {
  kind: 'computed-count';
  rolls: number;
  sides: number;
  plus?: number;
  render: (count: number) => string;
};

type MonsterFixedTextEntry = {
  kind: 'text';
  text: string;
};

export type MonsterTextEntry =
  | MonsterCountTextEntry
  | MonsterComputedCountTextEntry
  | MonsterFixedTextEntry;

export function countTextEntry(
  rolls: number,
  sides: number,
  singular: string,
  plural: string,
  plus: number = 0
): MonsterTextEntry {
  return {
    kind: 'count',
    rolls,
    sides,
    plus,
    singular,
    plural,
  };
}

export function computedCountTextEntry(
  rolls: number,
  sides: number,
  render: (count: number) => string,
  plus: number = 0
): MonsterTextEntry {
  return {
    kind: 'computed-count',
    rolls,
    sides,
    plus,
    render,
  };
}

export function fixedTextEntry(text: string): MonsterTextEntry {
  return {
    kind: 'text',
    text,
  };
}

export function partyTextResult(party: PartyResult): MonsterTextResult {
  return {
    text: '',
    party,
  };
}

export function createAttendantDecorator(
  monsterLevel: number,
  dungeonLevel: number
): {
  effectiveDungeonLevel: number;
  decorate: (text: string) => string;
} {
  const effectiveDungeonLevel = Math.min(dungeonLevel, monsterLevel);
  const attendantCount = Math.max(0, dungeonLevel - monsterLevel);
  const attendantSuffix =
    attendantCount > 0
      ? ` (${attendantCount} attendant${
          attendantCount === 1 ? '' : 's'
        } may be indicated.)`
      : '';

  return {
    effectiveDungeonLevel,
    decorate: (text: string) =>
      attendantSuffix.length > 0 ? `${text.trim()}${attendantSuffix} ` : text,
  };
}

export function resolveMonsterTextFromEntries<TCommand extends number>(
  monsterLevel: number,
  dungeonLevel: number,
  command: TCommand,
  entries: Partial<Record<TCommand, MonsterTextEntry>>,
  options?: {
    decorate?: (text: string, command: TCommand) => string;
  }
): string {
  const entry = entries[command];
  if (!entry) {
    throw new Error(`No monster text entry for command ${String(command)}`);
  }
  const text = renderMonsterTextEntry(monsterLevel, dungeonLevel, entry);
  return options?.decorate ? options.decorate(text, command) : text;
}

function renderMonsterTextEntry(
  monsterLevel: number,
  dungeonLevel: number,
  entry: MonsterTextEntry
): string {
  if (entry.kind === 'text') {
    return entry.text;
  }

  const count = getNumberOfMonsters(
    monsterLevel,
    dungeonLevel,
    entry.rolls,
    entry.sides,
    entry.plus
  );

  if (entry.kind === 'computed-count') {
    return entry.render(count);
  }

  return formatMonsterCount(count, entry.singular, entry.plural);
}
