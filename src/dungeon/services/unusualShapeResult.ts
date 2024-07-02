import { getTableEntry, rollDice } from "./periodicCheck";
import {
  CircularContents,
  circularContents,
  UnusualShape,
  unusualShape,
} from "../../tables/dungeon/unusualShape";
import { Pool, pool } from "../../tables/dungeon/pool";
import {
  MagicPool,
  magicPool,
  PoolAlignment,
  poolAlignment,
  TransmuteType,
  transmuteType,
  TransporterLocation,
  transporterLocation,
} from "../../tables/dungeon/magicPool";

export const unusualShapeResult = (): string => {
  const roll = rollDice(unusualShape.sides);
  const command = getTableEntry(roll, unusualShape);
  if (command in UnusualShape) {
    console.log(`unusualShape roll: ${roll} is ${UnusualShape[command]}`);
    switch (command as UnusualShape) {
      case UnusualShape.Circular:
        return "It is circular. " + circularContentsResult();
      case UnusualShape.Triangular:
        return "It is triangular. ";
      case UnusualShape.Trapezoidal:
        return "It is trapezoidal. ";
      case UnusualShape.OddShaped:
        return "It is odd-shaped. (Draw what shape you desire or what will fit the map -- it is a special shape if desired.) ";
      case UnusualShape.Oval:
        return "It is oval-shaped. ";
      case UnusualShape.Hexagonal:
        return "It is hexagonal. ";
      case UnusualShape.Octagonal:
        return "It is octagonal. ";
      case UnusualShape.Cave:
        return "It is actually a cave. ";
    }
  } else {
    return "oops, wrong command in unusualShape";
  }
};

export const circularContentsResult = (): string => {
  const roll = rollDice(circularContents.sides);
  const command = getTableEntry(roll, circularContents);
  if (command in CircularContents) {
    console.log(
      `circularContents roll: ${roll} is ${CircularContents[command]}`
    );
    switch (command as CircularContents) {
      case CircularContents.Pool:
        return "There is a pool. " + circularShapePoolResult();
      case CircularContents.Well:
        return "There is a well. ";
      case CircularContents.Shaft:
        return "There is a shaft. ";
      case CircularContents.Normal:
        return "";
    }
  } else {
    return "oops, wrong command in circularContents";
  }
};

export const circularShapePoolResult = (): string => {
  const roll = rollDice(pool.sides);
  const command = getTableEntry(roll, pool);
  if (command in Pool) {
    console.log(`circularShapePool roll: ${roll} is ${Pool[command]}`);
    switch (command as Pool) {
      case Pool.NoPool:
        return "";
      case Pool.PoolNoMonster:
        return "";
      case Pool.PoolMonster:
        return "There is a monster in the pool. (TODO Monster) ";
      case Pool.PoolMonsterTreasure:
        return "There is a monster and treasure in the pool. (TODO Monster Treasure) ";
      case Pool.MagicPool:
        return (
          "It is a magical pool. (In order to find out what it is, characters must enter the magic pool.) " +
          circularShapeMagicPoolResult()
        );
    }
  } else {
    return "oops, wrong command in circularShapePool";
  }
};

export const circularShapeMagicPoolResult = (): string => {
  const roll = rollDice(magicPool.sides);
  const command = getTableEntry(roll, magicPool);
  if (command in MagicPool) {
    console.log(
      `circularShapeMagicPool roll: ${roll} is ${MagicPool[command]}`
    );
    switch (command as MagicPool) {
      case MagicPool.TransmuteGold:
        return transmuteResult();
      case MagicPool.AlterCharacteristic:
        return "It will, on a one-time only basis, add (1--3) or subtract (4--6) from one characteristic of all who stand within it: (d6) 1-STR, 2-INT, 3-WIS, 4-DEX, 5-CON, 6-CHA. Roll chances, amount, and characteristic separately for each character. ";
      case MagicPool.WishOrDamage:
        return (
          "It is a talking pool, and will grant one wish to characters of its alignment, and damage others for 1--20 points. Wish can be withheld for up to 1 day. " +
          poolAlignmentResult()
        );
      case MagicPool.Transporter:
        return transporterLocationResult();
    }
  } else {
    return "oops, wrong command in circularShapeMagicPool";
  }
};

export const transmuteResult = (): string => {
  const roll = rollDice(transmuteType.sides);
  const command = getTableEntry(roll, transmuteType);
  if (command in TransmuteType) {
    console.log(`transmuteType roll: ${roll} is ${TransmuteType[command]}`);
    switch (command as TransmuteType) {
      case TransmuteType.GoldToPlatinum:
        return "It will turn gold to platinum, one time only. ";
      case TransmuteType.GoldToLead:
        return "It will turn gold to lead, one time only. ";
    }
  } else {
    return "oops, wrong command in transmuteType";
  }
};

export const poolAlignmentResult = (): string => {
  const roll = rollDice(poolAlignment.sides);
  const command = getTableEntry(roll, poolAlignment);
  if (command in PoolAlignment) {
    console.log(`poolAlignment roll: ${roll} is ${PoolAlignment[command]}`);
    switch (command as PoolAlignment) {
      case PoolAlignment.LawfulGood:
        return "It is Lawful Good. ";
      case PoolAlignment.LawfulEvil:
        return "It is Lawful Evil. ";
      case PoolAlignment.ChaoticGood:
        return "It is Chaotic Good. ";
      case PoolAlignment.ChaoticEvil:
        return "It is Chaotic Evil. ";
      case PoolAlignment.Neutral:
        return "It is Neutral. ";
    }
  } else {
    return "oops, wrong command in poolAlignment";
  }
};

export const transporterLocationResult = (): string => {
  const roll = rollDice(transporterLocation.sides);
  const command = getTableEntry(roll, transporterLocation);
  if (command in TransporterLocation) {
    console.log(
      `transporterLocation roll: ${roll} is ${TransporterLocation[command]}`
    );
    switch (command as TransporterLocation) {
      case TransporterLocation.Surface:
        return "It transports characters back to the surface. ";
      case TransporterLocation.SameLevelElsewhere:
        return "It transports characters elsewhere on the same level. ";
      case TransporterLocation.OneLevelDown:
        return "It transports characters one level down. ";
      case TransporterLocation.Away100Miles:
        return "It transports characters 100 miles away for outdoor adventure. ";
    }
  } else {
    return "oops, wrong command in transporterLocation";
  }
};
