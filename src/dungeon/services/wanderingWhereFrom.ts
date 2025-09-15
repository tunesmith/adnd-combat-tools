import type {
  DungeonMessage,
  DungeonRenderNode,
  DungeonTablePreview,
  TableContext,
} from '../../types/dungeon';
import {
  periodicCheck,
  PeriodicCheck,
} from '../../tables/dungeon/periodicCheck';
import { getTableEntry, rollDice } from '../helpers/dungeonLookup';
import { doorLocation, DoorLocation } from '../../tables/dungeon/doorLocation';
import { sidePassages, SidePassages } from '../../tables/dungeon/sidePassages';
import { passageTurns, PassageTurns } from '../../tables/dungeon/passageTurns';
import {
  chamberDimensions,
  ChamberDimensions,
} from '../../tables/dungeon/chambersRooms';
import { stairs, Stairs } from '../../tables/dungeon/stairs';

function rangeText(range: number[]): string {
  return range.length === 1
    ? `${range[0]}`
    : `${range[0]}–${range[range.length - 1]}`;
}

export const wanderingWhereFromMessages = (options?: {
  roll?: number;
  detailMode?: boolean;
  context?: TableContext;
}): { usedRoll?: number; messages: DungeonRenderNode[] } => {
  if (options?.detailMode && options.roll === undefined) {
    const preview: DungeonTablePreview = {
      kind: 'table-preview',
      id: 'wanderingWhereFrom',
      title: 'Where From',
      sides: periodicCheck.sides,
      entries: periodicCheck.entries
        .filter((e) => e.command !== PeriodicCheck.WanderingMonster)
        .map((e) => ({
          range: rangeText(e.range),
          label: PeriodicCheck[e.command] ?? String(e.command),
        })),
      context: options?.context,
    };
    return { usedRoll: undefined, messages: [preview] };
  }
  // ensure WM is re-rolled if provided
  let usedRoll = options?.roll ?? rollDice(periodicCheck.sides);
  let cmd = getTableEntry(usedRoll, periodicCheck);
  if (cmd === PeriodicCheck.WanderingMonster) {
    usedRoll = 1; // default to ContinueStraight if WM was provided inadvertently
    cmd = PeriodicCheck.ContinueStraight;
  }
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Where From',
  };
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [`roll: ${usedRoll} — ${PeriodicCheck[cmd]}`],
  };
  const messages: DungeonRenderNode[] = [heading, bullet];
  if (cmd === PeriodicCheck.Door) {
    messages.push({ kind: 'paragraph', text: 'A closed door is indicated.' });
    messages.push({
      kind: 'table-preview',
      id: 'doorLocation:0',
      title: 'Door Location',
      sides: doorLocation.sides,
      entries: doorLocation.entries.map((e) => ({
        range: rangeText(e.range),
        label: DoorLocation[e.command] ?? String(e.command),
      })),
      context: { kind: 'doorChain', existing: [] } as TableContext,
    });
  } else if (cmd === PeriodicCheck.SidePassage) {
    messages.push({ kind: 'paragraph', text: 'A side passage occurs.' });
    messages.push({
      kind: 'table-preview',
      id: 'sidePassages',
      title: 'Side Passages',
      sides: sidePassages.sides,
      entries: sidePassages.entries.map((e) => ({
        range: rangeText(e.range),
        label: SidePassages[e.command] ?? String(e.command),
      })),
    });
  } else if (cmd === PeriodicCheck.PassageTurn) {
    messages.push({ kind: 'paragraph', text: 'The passage turns.' });
    messages.push({
      kind: 'table-preview',
      id: 'passageTurns',
      title: 'Passage Turns',
      sides: passageTurns.sides,
      entries: passageTurns.entries.map((e) => ({
        range: rangeText(e.range),
        label: PassageTurns[e.command] ?? String(e.command),
      })),
    });
  } else if (cmd === PeriodicCheck.Chamber) {
    messages.push({
      kind: 'paragraph',
      text: 'The passage opens into a chamber. ',
    });
    messages.push({
      kind: 'table-preview',
      id: 'chamberDimensions',
      title: 'Chamber Dimensions',
      sides: chamberDimensions.sides,
      entries: chamberDimensions.entries.map((e) => ({
        range: rangeText(e.range),
        label: ChamberDimensions[e.command] ?? String(e.command),
      })),
    });
  } else if (cmd === PeriodicCheck.Stairs) {
    messages.push({ kind: 'paragraph', text: 'Stairs are indicated here.' });
    messages.push({
      kind: 'table-preview',
      id: 'stairs',
      title: 'Stairs',
      sides: stairs.sides,
      entries: stairs.entries.map((e) => ({
        range: rangeText(e.range),
        label: Stairs[e.command] ?? String(e.command),
      })),
    });
  } else {
    // ContinueStraight / DeadEnd / TrickTrap
    messages.push({
      kind: 'paragraph',
      text: `Appears from: ${PeriodicCheck[cmd]}. `,
    });
  }
  return { usedRoll, messages };
};
