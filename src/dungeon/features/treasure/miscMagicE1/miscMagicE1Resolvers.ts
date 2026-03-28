import { getTableEntry, rollDice } from '../../../helpers/dungeonLookup';
import type {
  DungeonOutcomeNode,
  OutcomeEvent,
  TreasureBeakerOfPlentifulPotionsDetails,
  TreasureBeakerPotionDetails,
} from '../../../domain/outcome';
import {
  miscMagicE1Followups,
  treasureMiscMagicE1,
  TreasureMiscMagicE1,
} from './miscMagicE1Table';
import { buildTreasureEvent } from '../shared';
import {
  treasurePotion,
  treasurePotionAnimalControl,
  treasurePotionDragonControl,
  treasurePotionGiantControl,
  treasurePotionGiantStrength,
  treasurePotionHumanControl,
  treasurePotionUndeadControl,
  TreasurePotion,
} from '../potion/potionTables';
import type {
  TreasureArtifactOrRelic,
  TreasureBagOfHolding,
  TreasureBagOfTricks,
  TreasureBracersOfDefense,
  TreasureBucknardsEverfullPurse,
} from './miscMagicE1Subtables';
import {
  treasureArtifactOrRelic,
  treasureBagOfHolding,
  treasureBagOfTricks,
  treasureBracersOfDefense,
  treasureBucknardsEverfullPurse,
} from './miscMagicE1Subtables';

export function resolveTreasureMiscMagicE1(options?: {
  roll?: number;
  level?: number;
  treasureRoll?: number;
  rollIndex?: number;
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(treasureMiscMagicE1.sides);
  const command: TreasureMiscMagicE1 = getTableEntry(
    usedRoll,
    treasureMiscMagicE1
  );
  const event = buildTreasureEvent(
    'treasureMiscMagicE1',
    command,
    usedRoll,
    options
  );
  const children: DungeonOutcomeNode[] = [];
  const followup = miscMagicE1Followups.find(
    (candidate) => candidate.result === command
  );
  if (followup) {
    children.push({
      type: 'pending-roll',
      table: followup.table,
      id: options?.rollIndex
        ? `${followup.table}:${options.rollIndex}`
        : undefined,
    });
  }
  return {
    type: 'event',
    roll: usedRoll,
    event:
      command === TreasureMiscMagicE1.BeakerOfPlentifulPotions
        ? ({
            ...event,
            beaker: rollBeakerOfPlentifulPotions(),
          } as OutcomeEvent)
        : event,
    children: children.length ? children : undefined,
  };
}

function rollBeakerOfPlentifulPotions(): TreasureBeakerOfPlentifulPotionsDetails {
  const potionCount = rollDice(4) + 1;
  return {
    potions: Array.from({ length: potionCount }, () => rollBeakerPotion()),
    cadence:
      potionCount === 2
        ? 'threeTimesPerWeek'
        : potionCount === 3
        ? 'twicePerWeek'
        : 'oncePerWeek',
  };
}

function rollBeakerPotion(): TreasureBeakerPotionDetails {
  const potion = getTableEntry(rollDice(treasurePotion.sides), treasurePotion);
  if (potion === TreasurePotion.AnimalControl) {
    return {
      potion,
      animalControl: getTableEntry(
        rollDice(treasurePotionAnimalControl.sides),
        treasurePotionAnimalControl
      ),
    };
  }
  if (potion === TreasurePotion.DragonControl) {
    return {
      potion,
      dragonControl: getTableEntry(
        rollDice(treasurePotionDragonControl.sides),
        treasurePotionDragonControl
      ),
    };
  }
  if (potion === TreasurePotion.GiantControl) {
    return {
      potion,
      giantControl: getTableEntry(
        rollDice(treasurePotionGiantControl.sides),
        treasurePotionGiantControl
      ),
    };
  }
  if (potion === TreasurePotion.GiantStrength) {
    return {
      potion,
      giantStrength: getTableEntry(
        rollDice(treasurePotionGiantStrength.sides),
        treasurePotionGiantStrength
      ),
    };
  }
  if (potion === TreasurePotion.HumanControl) {
    return {
      potion,
      humanControl: getTableEntry(
        rollDice(treasurePotionHumanControl.sides),
        treasurePotionHumanControl
      ),
    };
  }
  if (potion === TreasurePotion.UndeadControl) {
    return {
      potion,
      undeadControl: getTableEntry(
        rollDice(treasurePotionUndeadControl.sides),
        treasurePotionUndeadControl
      ),
    };
  }
  return { potion };
}

export function resolveTreasureBagOfHolding(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(treasureBagOfHolding.sides);
  const command: TreasureBagOfHolding = getTableEntry(
    usedRoll,
    treasureBagOfHolding
  );
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'treasureBagOfHolding',
      result: command,
    } as OutcomeEvent,
  };
}

export function resolveTreasureBagOfTricks(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(treasureBagOfTricks.sides);
  const command: TreasureBagOfTricks = getTableEntry(
    usedRoll,
    treasureBagOfTricks
  );
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'treasureBagOfTricks',
      result: command,
    } as OutcomeEvent,
  };
}

export function resolveTreasureBracersOfDefense(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(treasureBracersOfDefense.sides);
  const command: TreasureBracersOfDefense = getTableEntry(
    usedRoll,
    treasureBracersOfDefense
  );
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'treasureBracersOfDefense',
      result: command,
    } as OutcomeEvent,
  };
}

export function resolveTreasureBucknardsEverfullPurse(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  const usedRoll =
    options?.roll ?? rollDice(treasureBucknardsEverfullPurse.sides);
  const command: TreasureBucknardsEverfullPurse = getTableEntry(
    usedRoll,
    treasureBucknardsEverfullPurse
  );
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'treasureBucknardsEverfullPurse',
      result: command,
    } as OutcomeEvent,
  };
}

export function resolveTreasureArtifactOrRelic(options?: {
  roll?: number;
}): DungeonOutcomeNode {
  const usedRoll = options?.roll ?? rollDice(treasureArtifactOrRelic.sides);
  const command: TreasureArtifactOrRelic = getTableEntry(
    usedRoll,
    treasureArtifactOrRelic
  );
  return {
    type: 'event',
    roll: usedRoll,
    event: {
      kind: 'treasureArtifactOrRelic',
      result: command,
    } as OutcomeEvent,
  };
}
