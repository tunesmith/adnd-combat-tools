import {
  ChasmConstruction,
  chasmConstruction,
  ChasmDepth,
  chasmDepth,
  GalleryStairLocation,
  galleryStairLocation,
  GalleryStairOccurrence,
  galleryStairOccurrence,
  JumpingPlaceWidth,
  jumpingPlaceWidth,
  RiverBoatBank,
  riverBoatBank,
  RiverConstruction,
  riverConstruction,
  SpecialPassage,
  specialPassage,
  StreamConstruction,
  streamConstruction,
} from "../../tables/dungeon/specialPassage";
import { getTableEntry, rollDice } from "../helpers/dungeonLookup";

export const specialPassageResult = (): string => {
  const specialPassageRoll = rollDice(specialPassage.sides);
  const specialPassageCommand = getTableEntry(
    specialPassageRoll,
    specialPassage
  );
  console.log(
    `specialPassage roll: ${specialPassageRoll} is ${SpecialPassage[specialPassageCommand]}`
  );
  switch (specialPassageCommand) {
    case SpecialPassage.FortyFeetColumns:
      return "The passage is 40' wide, with columns down the center. ";
    case SpecialPassage.FortyFeetDoubleColumns:
      return "The passage is 40' wide, with a double row of columns. ";
    case SpecialPassage.FiftyFeetDoubleColumns:
      return "The passage is 50' wide, with a double row of columns. ";
    case SpecialPassage.FiftyFeetGalleries: {
      const result =
        "The passage is 50' wide. Columns 10' right and left support 10' wide upper galleries 20' above. ";
      return result + galleryStairLocationResult();
    }
    case SpecialPassage.TenFootStream: {
      const result = "A stream, 10' wide, bisects the passage. ";
      return result + streamConstructionResult();
    }
    case SpecialPassage.TwentyFootRiver: {
      const result = "A river, 20' wide, bisects the passage. ";
      return result + riverConstructionResult();
    }
    case SpecialPassage.FortyFootRiver: {
      const result = "A river, 40' wide, bisects the passage. ";
      return result + riverConstructionResult();
    }
    case SpecialPassage.SixtyFootRiver: {
      const result = "A river, 60' wide, bisects the passage. ";
      return result + riverConstructionResult();
    }
    case SpecialPassage.TwentyFootChasm: {
      const result = "A chasm, 20' wide, bisects the passage. ";
      return result + chasmDepthResult() + chasmConstructionResult();
    }
  }
};

export const galleryStairLocationResult = (): string => {
  const roll = rollDice(galleryStairLocation.sides);
  const command = getTableEntry(roll, galleryStairLocation);
  console.log(
    `galleryStairLocation roll: ${roll} is ${GalleryStairLocation[command]}`
  );
  switch (command) {
    case GalleryStairLocation.PassageEnd: {
      const result =
        "Stairs up to the gallery will be at the end of the passage. ";
      return result + galleryStairOccurrenceResult();
    }
    case GalleryStairLocation.PassageBeginning:
      return "Stairs up to the gallery are at the beginning of the passage. ";
  }
};

export const galleryStairOccurrenceResult = (): string => {
  const roll = rollDice(galleryStairOccurrence.sides);
  const command = getTableEntry(roll, galleryStairOccurrence);
  console.log(
    `galleryStairOccurrence roll: ${roll} is ${GalleryStairOccurrence[command]}`
  );
  switch (command) {
    case GalleryStairOccurrence.Replace:
      return "If a stairway is otherwise indicated in or adjacent to the passage, it will replace the end stairs. ";
    case GalleryStairOccurrence.Supplement:
      return "If a stairway is otherwise indicated in or adjacent to the passage, it will supplement the end stairs. ";
  }
};

export const streamConstructionResult = (): string => {
  const roll = rollDice(streamConstruction.sides);
  const command = getTableEntry(roll, streamConstruction);
  console.log(
    `streamConstruction roll: ${roll} is ${StreamConstruction[command]}`
  );
  switch (command) {
    case StreamConstruction.Bridged:
      return "A bridge crosses the stream. ";
    case StreamConstruction.Obstacle:
      return "";
  }
};

export const riverConstructionResult = (): string => {
  const roll = rollDice(riverConstruction.sides);
  const command = getTableEntry(roll, riverConstruction);
  console.log(
    `riverConstruction roll: ${roll} is ${RiverConstruction[command]}`
  );
  switch (command) {
    case RiverConstruction.Bridged:
      return "A bridge crosses the river. ";
    case RiverConstruction.Boat: {
      const result = "There is a boat. ";
      return result + riverBoatBankResult();
    }
    case RiverConstruction.Obstacle:
      return "";
  }
};

export const riverBoatBankResult = (): string => {
  const roll = rollDice(riverBoatBank.sides);
  const command = getTableEntry(roll, riverBoatBank);
  console.log(`riverBoatBank roll: ${roll} is ${RiverBoatBank[command]}`);
  switch (command) {
    case RiverBoatBank.ThisSide:
      return "The boat is on this bank of the river. ";
    case RiverBoatBank.OppositeSide:
      return "The boat is on the opposite bank of the river. ";
  }
};

export const chasmDepthResult = (): string => {
  const roll = rollDice(chasmDepth.sides);
  const command = getTableEntry(roll, chasmDepth);
  switch (command) {
    case ChasmDepth.Feet150:
      return "The chasm is 150' deep. ";
    case ChasmDepth.Feet160:
      return "The chasm is 160' deep. ";
    case ChasmDepth.Feet170:
      return "The chasm is 170' deep. ";
    case ChasmDepth.Feet180:
      return "The chasm is 180' deep. ";
    case ChasmDepth.Feet190:
      return "The chasm is 190' deep. ";
    case ChasmDepth.Feet200:
      return "The chasm is 200' deep. ";
  }
};

export const chasmConstructionResult = (): string => {
  const roll = rollDice(chasmConstruction.sides);
  const command = getTableEntry(roll, chasmConstruction);
  console.log(
    `chasmConstruction roll: ${roll} is ${ChasmConstruction[command]}`
  );
  switch (command) {
    case ChasmConstruction.Bridged:
      return "A bridge crosses the chasm. ";
    case ChasmConstruction.JumpingPlace: {
      const result = "There is a jumping place. ";
      return result + jumpingPlaceWidthResult();
    }
    case ChasmConstruction.Obstacle:
      return "It has no bridge, and is too wide to jump across. ";
  }
};

export const jumpingPlaceWidthResult = (): string => {
  const roll = rollDice(jumpingPlaceWidth.sides);
  const command = getTableEntry(roll, jumpingPlaceWidth);
  console.log(
    `jumpingPlaceWidth roll: ${roll} is ${JumpingPlaceWidth[command]}`
  );
  switch (command) {
    case JumpingPlaceWidth.FiveFeet:
      return "It is 5' wide. ";
    case JumpingPlaceWidth.TenFeet:
      return "It is 10' wide. ";
  }
};
