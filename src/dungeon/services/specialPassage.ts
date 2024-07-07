import { getTableEntry, rollDice } from "./passage";
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

export const specialPassageResult = (): string => {
  const specialPassageRoll = rollDice(specialPassage.sides);
  const specialPassageCommand = getTableEntry(
    specialPassageRoll,
    specialPassage
  );
  if (specialPassageCommand in SpecialPassage) {
    console.log(
      `specialPassage roll: ${specialPassageRoll} is ${SpecialPassage[specialPassageCommand]}`
    );
    switch (specialPassageCommand as SpecialPassage) {
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
  } else {
    return "oops, wrong command in specialPassage";
  }
};

export const galleryStairLocationResult = (): string => {
  const roll = rollDice(galleryStairLocation.sides);
  const command = getTableEntry(roll, galleryStairLocation);
  if (command in GalleryStairLocation) {
    console.log(
      `galleryStairLocation roll: ${roll} is ${GalleryStairLocation[command]}`
    );
    switch (command as GalleryStairLocation) {
      case GalleryStairLocation.PassageEnd: {
        const result =
          "Stairs up to the gallery will be at the end of the passage. ";
        return result + galleryStairOccurrenceResult();
      }
      case GalleryStairLocation.PassageBeginning:
        return "Stairs up to the gallery are at the beginning of the passage. ";
    }
  } else {
    return "oops, wrong command in galleryStairLocation";
  }
};

export const galleryStairOccurrenceResult = (): string => {
  const roll = rollDice(galleryStairOccurrence.sides);
  const command = getTableEntry(roll, galleryStairOccurrence);
  if (command in GalleryStairOccurrence) {
    console.log(
      `galleryStairOccurrence roll: ${roll} is ${GalleryStairOccurrence[command]}`
    );
    switch (command as GalleryStairOccurrence) {
      case GalleryStairOccurrence.Replace:
        return "If a stairway is otherwise indicated in or adjacent to the passage, it will replace the end stairs. ";
      case GalleryStairOccurrence.Supplement:
        return "If a stairway is otherwise indicated in or adjacent to the passage, it will supplement the end stairs. ";
    }
  } else {
    return "oops, wrong command in galleryStairOccurrence";
  }
};

export const streamConstructionResult = (): string => {
  const roll = rollDice(streamConstruction.sides);
  const command = getTableEntry(roll, streamConstruction);
  if (command in StreamConstruction) {
    console.log(
      `streamConstruction roll: ${roll} is ${StreamConstruction[command]}`
    );
    switch (command as StreamConstruction) {
      case StreamConstruction.Bridged:
        return "A bridge crosses the stream. ";
      case StreamConstruction.Obstacle:
        return "";
    }
  } else {
    return "oops, wrong command in streamConstruction";
  }
};

export const riverConstructionResult = (): string => {
  const roll = rollDice(riverConstruction.sides);
  const command = getTableEntry(roll, riverConstruction);
  if (command in RiverConstruction) {
    console.log(
      `riverConstruction roll: ${roll} is ${RiverConstruction[command]}`
    );
    switch (command as RiverConstruction) {
      case RiverConstruction.Bridged:
        return "A bridge crosses the river. ";
      case RiverConstruction.Boat: {
        const result = "There is a boat. ";
        return result + riverBoatBankResult();
      }
      case RiverConstruction.Obstacle:
        return "";
    }
  } else {
    return "oops, wrong command in riverConstruction";
  }
};

export const riverBoatBankResult = (): string => {
  const roll = rollDice(riverBoatBank.sides);
  const command = getTableEntry(roll, riverBoatBank);
  if (command in RiverBoatBank) {
    console.log(`riverBoatBank roll: ${roll} is ${RiverBoatBank[command]}`);
    switch (command as RiverBoatBank) {
      case RiverBoatBank.ThisSide:
        return "The boat is on this bank of the river. ";
      case RiverBoatBank.OppositeSide:
        return "The boat is on the opposite bank of the river. ";
    }
  } else {
    return "oops, wrong command in riverBoatBank";
  }
};

export const chasmDepthResult = (): string => {
  const roll = rollDice(chasmDepth.sides);
  const command = getTableEntry(roll, chasmDepth);
  if (command in ChasmDepth) {
    console.log(`chasmDepth roll: ${roll} is ${ChasmDepth[command]}`);
    switch (command as ChasmDepth) {
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
  } else {
    return "oops, wrong command in chasmDepth";
  }
};

export const chasmConstructionResult = (): string => {
  const roll = rollDice(chasmConstruction.sides);
  const command = getTableEntry(roll, chasmConstruction);
  if (command in ChasmConstruction) {
    console.log(
      `chasmConstruction roll: ${roll} is ${ChasmConstruction[command]}`
    );
    switch (command as ChasmConstruction) {
      case ChasmConstruction.Bridged:
        return "A bridge crosses the chasm. ";
      case ChasmConstruction.JumpingPlace: {
        const result = "There is a jumping place. ";
        return result + jumpingPlaceWidthResult();
      }
      case ChasmConstruction.Obstacle:
        return "";
    }
  } else {
    return "oops, wrong command in chasmConstruction";
  }
};

export const jumpingPlaceWidthResult = (): string => {
  const roll = rollDice(jumpingPlaceWidth.sides);
  const command = getTableEntry(roll, jumpingPlaceWidth);
  if (command in JumpingPlaceWidth) {
    console.log(
      `jumpingPlaceWidth roll: ${roll} is ${JumpingPlaceWidth[command]}`
    );
    switch (command as JumpingPlaceWidth) {
      case JumpingPlaceWidth.FiveFeet:
        return "It is 5' wide. ";
      case JumpingPlaceWidth.TenFeet:
        return "It is 10' wide. ";
    }
  } else {
    return "oops, wrong command in jumpingPlaceWidth";
  }
};
