import { getTableEntry, rollDice } from '../../../helpers/dungeonLookup';
import type { DungeonOutcomeNode, OutcomeEvent } from '../../../domain/outcome';
import {
  numberOfExits,
  NumberOfExits,
  oneToFour,
  OneToFour,
} from './numberOfExitsTable';

export function resolveNumberOfExits(options: {
  roll?: number;
  length: number;
  width: number;
  isRoom: boolean;
}): DungeonOutcomeNode {
  const usedRoll = options.roll ?? rollDice(numberOfExits.sides);
  const command = getTableEntry(usedRoll, numberOfExits);
  const area = options.length * options.width;
  let count = 0;
  switch (command) {
    case NumberOfExits.OneTwo600:
      count = area <= 600 ? 1 : 2;
      break;
    case NumberOfExits.TwoThree600:
      count = area <= 600 ? 2 : 3;
      break;
    case NumberOfExits.ThreeFour600:
      count = area <= 600 ? 3 : 4;
      break;
    case NumberOfExits.ZeroOne1200:
      count = area <= 1200 ? 0 : 1;
      break;
    case NumberOfExits.ZeroOne1600:
      count = area <= 1600 ? 0 : 1;
      break;
    case NumberOfExits.OneToFour: {
      const countRoll = rollDice(oneToFour.sides);
      const bucket = getTableEntry(countRoll, oneToFour);
      count =
        bucket === OneToFour.One
          ? 1
          : bucket === OneToFour.Two
          ? 2
          : bucket === OneToFour.Three
          ? 3
          : 4;
      break;
    }
    case NumberOfExits.DoorChamberOrPassageRoom:
      count = 1;
      break;
  }
  const origin: 'room' | 'chamber' = options.isRoom ? 'room' : 'chamber';
  const baseExitType: 'door' | 'passage' = options.isRoom ? 'door' : 'passage';
  const exitType =
    command === NumberOfExits.DoorChamberOrPassageRoom
      ? baseExitType === 'door'
        ? 'passage'
        : 'door'
      : baseExitType;

  const children: DungeonOutcomeNode[] = [];
  if (count > 0) {
    for (let index = 1; index <= count; index += 1) {
      const baseId = `numberOfExits.${index - 1}.${exitType}ExitLocation`;
      children.push({
        type: 'pending-roll',
        table: exitType === 'door' ? 'doorExitLocation' : 'passageExitLocation',
        id: baseId,
        context: {
          kind: 'exit',
          exitType,
          index,
          total: count,
          origin,
          id: baseId,
        },
      });
    }
  }

  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'numberOfExits',
      result: command,
      context: {
        length: options.length,
        width: options.width,
        isRoom: options.isRoom,
      },
      count,
    } as OutcomeEvent,
    children: children.length > 0 ? children : undefined,
  };
}
