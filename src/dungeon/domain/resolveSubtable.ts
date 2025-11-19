import { getTableEntry, rollDice } from '../helpers/dungeonLookup';
import type { Command, Table } from '../../tables/dungeon/dungeonTypes';
import type { DungeonOutcomeNode, OutcomeEvent } from './outcome';

type ResolveSubtableArgs<TCommand extends Command, TEvent extends OutcomeEvent> = {
  table: Table<TCommand>;
  roll?: number;
  buildEvent: (command: TCommand, roll: number) => TEvent;
  buildChildren?: (
    command: TCommand,
    roll: number,
    event: TEvent
  ) => DungeonOutcomeNode[] | undefined;
};

export function resolveSubtable<
  TCommand extends Command,
  TEvent extends OutcomeEvent
>(args: ResolveSubtableArgs<TCommand, TEvent>): DungeonOutcomeNode {
  const usedRoll = args.roll ?? rollDice(args.table.sides);
  const command = getTableEntry(usedRoll, args.table);
  const event = args.buildEvent(command, usedRoll);
  const children = args.buildChildren?.(command, usedRoll, event);
  return {
    type: 'event',
    roll: usedRoll,
    event,
    children: children && children.length ? children : undefined,
  };
}

