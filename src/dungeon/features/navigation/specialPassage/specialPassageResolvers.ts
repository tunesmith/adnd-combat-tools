import { getTableEntry, rollDice } from '../../../helpers/dungeonLookup';
import type { DungeonOutcomeNode, OutcomeEvent } from '../../../domain/outcome';
import {
  galleryStairLocation,
  GalleryStairLocation,
  galleryStairOccurrence,
  riverBoatBank,
  RiverConstruction,
  riverConstruction,
  SpecialPassage,
  specialPassage,
  streamConstruction,
} from './specialPassageTable';

export function resolveSpecialPassage(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(specialPassage.sides);
  const command = getTableEntry(usedRoll, specialPassage);
  const event: OutcomeEvent = {
    kind: 'specialPassage',
    result: command,
  } as OutcomeEvent;
  const children: DungeonOutcomeNode[] = [];
  if (command === SpecialPassage.FiftyFeetGalleries) {
    children.push({ type: 'pending-roll', table: 'galleryStairLocation' });
  } else if (command === SpecialPassage.TenFootStream) {
    children.push({ type: 'pending-roll', table: 'streamConstruction' });
  } else if (
    command === SpecialPassage.TwentyFootRiver ||
    command === SpecialPassage.FortyFootRiver ||
    command === SpecialPassage.SixtyFootRiver
  ) {
    children.push({ type: 'pending-roll', table: 'riverConstruction' });
  } else if (command === SpecialPassage.TwentyFootChasm) {
    children.push({ type: 'pending-roll', table: 'chasmDepth' });
    children.push({ type: 'pending-roll', table: 'chasmConstruction' });
  }
  return {
    type: 'event',
    roll: usedRoll,
    event,
    children: children.length ? children : undefined,
  };
}

export function resolveGalleryStairLocation(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(galleryStairLocation.sides);
  const command = getTableEntry(usedRoll, galleryStairLocation);
  const children: DungeonOutcomeNode[] = [];
  if (command === GalleryStairLocation.PassageEnd) {
    children.push({ type: 'pending-roll', table: 'galleryStairOccurrence' });
  }
  return {
    type: 'event',
    roll: usedRoll,
    event: { kind: 'galleryStairLocation', result: command } as OutcomeEvent,
    children: children.length ? children : undefined,
  };
}

export function resolveGalleryStairOccurrence(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(galleryStairOccurrence.sides);
  const command = getTableEntry(usedRoll, galleryStairOccurrence);
  return {
    type: 'event',
    roll: usedRoll,
    event: { kind: 'galleryStairOccurrence', result: command } as OutcomeEvent,
  };
}

export function resolveStreamConstruction(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(streamConstruction.sides);
  const command = getTableEntry(usedRoll, streamConstruction);
  return {
    type: 'event',
    roll: usedRoll,
    event: { kind: 'streamConstruction', result: command } as OutcomeEvent,
  };
}

export function resolveRiverConstruction(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(riverConstruction.sides);
  const command = getTableEntry(usedRoll, riverConstruction);
  const children: DungeonOutcomeNode[] = [];
  if (command === RiverConstruction.Boat) {
    children.push({ type: 'pending-roll', table: 'riverBoatBank' });
  }
  return {
    type: 'event',
    roll: usedRoll,
    event: { kind: 'riverConstruction', result: command } as OutcomeEvent,
    children: children.length ? children : undefined,
  };
}

export function resolveRiverBoatBank(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(riverBoatBank.sides);
  const command = getTableEntry(usedRoll, riverBoatBank);
  return {
    type: 'event',
    roll: usedRoll,
    event: { kind: 'riverBoatBank', result: command } as OutcomeEvent,
  };
}
