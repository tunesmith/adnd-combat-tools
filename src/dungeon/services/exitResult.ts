import { getTableEntry, rollDice } from "../helpers/dungeonLookup";
import { NumberOfExits, numberOfExits } from "../../tables/dungeon/numberOfExits";
import type { DungeonMessage, DungeonTablePreview } from "../../types/dungeon";

export const exitResult = (
  length: number,
  width: number,
  isRoom: boolean = false
): string => {
  const roll = rollDice(numberOfExits.sides);
  const command = getTableEntry(roll, numberOfExits);
  console.log(`numberOfExits roll: ${roll} is ${NumberOfExits[command]}`);
  switch (command) {
    case NumberOfExits.OneTwo600:
      if (length * width <= 600) {
        return "There is one additional exit. (TODO location, direction/width if passage) ";
      } else {
        return "There are two additional exits. (TODO location, direction/width if passage) ";
      }
    case NumberOfExits.TwoThree600:
      if (length * width <= 600) {
        return "There are two additional exits. (TODO location, direction/width if passage) ";
      } else {
        return "There are three additional exits. (TODO location, direction/width if passage) ";
      }
    case NumberOfExits.ThreeFour600:
      if (length * width <= 600) {
        return "There are three additional exits. (TODO location, direction/width if passage) ";
      } else {
        return "There are four additional exits. (TODO location, direction/width if passage) ";
      }
    case NumberOfExits.ZeroOne1200:
      if (length * width <= 1200) {
        return "There are no exits here, other than the entrance. (TODO secret doors) ";
      } else {
        return "There is one additional exit. (TODO location, direction/width if passage) ";
      }
    case NumberOfExits.ZeroOne1600:
      if (length * width <= 1600) {
        return "There are no exits here, other than the entrance. (TODO secret doors) ";
      } else {
        return "There is one additional exit. (TODO location, direction/width if passage) ";
      }
    case NumberOfExits.OneToFour:
      return "There are 1d4 exits here, other than the entrance. (TODO d4, location, direction/width if passage) ";
    case NumberOfExits.DoorChamberOrPassageRoom:
      if (isRoom) {
        return "There is a passage exiting from the room. (TODO location/direction/width) ";
      } else {
        return "There is a door. (TODO location) ";
      }
  }
};

export const exitMessages = (
  options: {
    length: number;
    width: number;
    isRoom?: boolean;
    roll?: number;
    detailMode?: boolean;
  }
): { usedRoll?: number; messages: (DungeonMessage | DungeonTablePreview)[] } => {
  const isRoom = options.isRoom ?? false;
  if (options.detailMode && options.roll === undefined) {
    const preview: DungeonTablePreview = {
      kind: "table-preview",
      id: "numberOfExits",
      title: "Exits",
      sides: numberOfExits.sides,
      entries: numberOfExits.entries.map((e) => ({
        range: e.range.length === 1 ? `${e.range[0]}` : `${e.range[0]}–${e.range[e.range.length - 1]}`,
        label: NumberOfExits[e.command] ?? String(e.command),
      })),
      context: { kind: "exits", length: options.length, width: options.width, isRoom },
    };
    return { usedRoll: undefined, messages: [preview] };
  }
  const usedRoll = options.roll ?? rollDice(numberOfExits.sides);
  const command = getTableEntry(usedRoll, numberOfExits);
  let text: string;
  switch (command) {
    case NumberOfExits.OneTwo600:
      text = options.length * options.width <= 600 ?
        "There is one additional exit. (TODO location, direction/width if passage) " :
        "There are two additional exits. (TODO location, direction/width if passage) ";
      break;
    case NumberOfExits.TwoThree600:
      text = options.length * options.width <= 600 ?
        "There are two additional exits. (TODO location, direction/width if passage) " :
        "There are three additional exits. (TODO location, direction/width if passage) ";
      break;
    case NumberOfExits.ThreeFour600:
      text = options.length * options.width <= 600 ?
        "There are three additional exits. (TODO location, direction/width if passage) " :
        "There are four additional exits. (TODO location, direction/width if passage) ";
      break;
    case NumberOfExits.ZeroOne1200:
      text = options.length * options.width <= 1200 ?
        "There are no exits here, other than the entrance. (TODO secret doors) " :
        "There is one additional exit. (TODO location, direction/width if passage) ";
      break;
    case NumberOfExits.ZeroOne1600:
      text = options.length * options.width <= 1600 ?
        "There are no exits here, other than the entrance. (TODO secret doors) " :
        "There is one additional exit. (TODO location, direction/width if passage) ";
      break;
    case NumberOfExits.OneToFour:
      text = "There are 1d4 exits here, other than the entrance. (TODO d4, location, direction/width if passage) ";
      break;
    case NumberOfExits.DoorChamberOrPassageRoom:
      text = isRoom ?
        "There is a passage exiting from the room. (TODO location/direction/width) " :
        "There is a door. (TODO location) ";
      break;
  }
  const messages: DungeonMessage[] = [
    { kind: "heading", level: 4, text: "Exits" },
    { kind: "bullet-list", items: [`roll: ${usedRoll} — ${NumberOfExits[command] ?? String(command)}`] },
    { kind: "paragraph", text },
  ];
  return { usedRoll, messages };
};
