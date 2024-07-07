import { getTableEntry, rollDice } from "./passage";
import { UnusualSize, unusualSize } from "../../tables/dungeon/unusualSize";

export const unusualSizeResult = (): string => {
  return `It is about ${getSize()} sq. ft. `;
};

export const getSize = (extraSquareFootage: number = 0): number => {
  const roll = rollDice(unusualSize.sides);
  const command = getTableEntry(roll, unusualSize) as UnusualSize;
  console.log(`unusualSize roll: ${roll} is ${UnusualSize[command]}`);
  switch (command) {
    case UnusualSize.SqFt500:
      return 500 + extraSquareFootage;
    case UnusualSize.SqFt900:
      return 900 + extraSquareFootage;
    case UnusualSize.SqFt1300:
      return 1300 + extraSquareFootage;
    case UnusualSize.SqFt2000:
      return 2000 + extraSquareFootage;
    case UnusualSize.SqFt2700:
      return 2700 + extraSquareFootage;
    case UnusualSize.SqFt3400:
      return 3400 + extraSquareFootage;
    case UnusualSize.RollAgain:
      return getSize(extraSquareFootage ? extraSquareFootage * 2 : 2000);
  }
};
