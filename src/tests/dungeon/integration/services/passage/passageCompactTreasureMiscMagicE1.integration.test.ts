import {
  simulateCompactRunWithSequence,
  DirectiveMode,
} from '../../../../support/dungeon/dungeonRollHarness';
import type { DungeonOutcomeNode } from '../../../../../dungeon/domain/outcome';
import type { DungeonRenderNode } from '../../../../../types/dungeon';
import { TreasureMiscMagicE1 } from '../../../../../tables/dungeon/treasureMiscMagicE1';
import { TreasureBagOfHolding } from '../../../../../tables/dungeon/treasureBagOfHolding';
import { TreasureBagOfTricks } from '../../../../../tables/dungeon/treasureBagOfTricks';
import { TreasureArtifactOrRelic } from '../../../../../tables/dungeon/treasureArtifactOrRelic';
import { TreasureMiscMagicE2 } from '../../../../../tables/dungeon/treasureMiscMagicE2';
import { TreasureMiscMagicE3 } from '../../../../../tables/dungeon/treasureMiscMagicE3';
import { TreasureMiscMagicE4 } from '../../../../../tables/dungeon/treasureMiscMagicE4';
import { TreasureManualOfGolems } from '../../../../../tables/dungeon/treasureManualOfGolems';
import { TreasureMedallionRange } from '../../../../../tables/dungeon/treasureMedallionEspRange';
import { TreasurePearlOfPowerEffect } from '../../../../../tables/dungeon/treasurePearlOfPower';
import { TreasurePearlOfWisdomOutcome } from '../../../../../tables/dungeon/treasurePearlOfWisdom';
import { TreasureFigurineOfWondrousPower } from '../../../../../tables/dungeon/treasureFigurineOfWondrousPower';
import { TreasureFigurineMarbleElephant } from '../../../../../tables/dungeon/treasureFigurineMarbleElephant';
import { TreasureGirdleOfGiantStrength } from '../../../../../tables/dungeon/treasureGirdleOfGiantStrength';
import { TreasureInstrumentOfTheBards } from '../../../../../tables/dungeon/treasureInstrumentOfTheBards';
import { TreasureIronFlaskContent } from '../../../../../tables/dungeon/treasureIronFlask';
import { TreasureCrystalBall } from '../../../../../tables/dungeon/treasureCrystalBall';
import { TreasureDeckOfManyThings } from '../../../../../tables/dungeon/treasureDeckOfManyThings';
import { TreasureEyesOfPetrification } from '../../../../../tables/dungeon/treasureEyesOfPetrification';
import { TreasureBracersOfDefense } from '../../../../../tables/dungeon/treasureBracersOfDefense';
import { TreasureBucknardsEverfullPurse } from '../../../../../tables/dungeon/treasureBucknardsEverfullPurse';
import { TreasureHornOfValhallaType } from '../../../../../tables/dungeon/treasureHornOfValhallaType';
import { TreasureHornOfValhallaAttunement } from '../../../../../tables/dungeon/treasureHornOfValhallaAttunement';
import { TreasureHornOfValhallaAlignment } from '../../../../../tables/dungeon/treasureHornOfValhallaAlignment';
import { TreasureIounStoneType } from '../../../../../tables/dungeon/treasureIounStones';
import * as dungeonLookup from '../../../../../dungeon/helpers/dungeonLookup';

describe('passage compact treasure misc magic E1 handling', () => {
  it('resolves the bag of beans result in compact mode', () => {
    const result = simulateCompactRunWithSequence({
      action: 'passage',
      rolls: [
        14,
        { tableId: 'chamberDimensions', roll: 1 },
        { tableId: 'chamberRoomContents', roll: 20 },
        { tableId: 'treasure', roll: 98 },
        { tableId: 'treasureMagicCategory', roll: 46 },
        { tableId: 'treasureMiscMagicE1', roll: 18 },
      ],
      dungeonLevel: 1,
      allowUnusedRolls: true,
      mode: DirectiveMode.ManualThenAuto,
    });

    const miscEvent = findEvent(result.outcome, 'treasureMiscMagicE1');
    expect(miscEvent).toBeDefined();
    if (miscEvent && miscEvent.event.kind === 'treasureMiscMagicE1') {
      expect(miscEvent.event.result).toBe(TreasureMiscMagicE1.BagOfBeans);
    } else {
      throw new Error('treasureMiscMagicE1 event not found');
    }

    const compactParagraphs = result.compact
      .paragraphs()
      .map((text) => text.toLowerCase())
      .join(' ');
    expect(compactParagraphs).toContain('there is a bag of beans.');
  });

  it('resolves bag of holding capacity in compact mode', () => {
    const result = simulateCompactRunWithSequence({
      action: 'passage',
      rolls: [
        14,
        { tableId: 'chamberDimensions', roll: 1 },
        { tableId: 'chamberRoomContents', roll: 20 },
        { tableId: 'treasure', roll: 98 },
        { tableId: 'treasureMagicCategory', roll: 46 },
        { tableId: 'treasureMiscMagicE1', roll: 24 },
        { tableId: 'treasureBagOfHolding', roll: 95 },
      ],
      dungeonLevel: 1,
      allowUnusedRolls: true,
      mode: DirectiveMode.ManualThenAuto,
    });

    const bagEvent = findEvent(result.outcome, 'treasureBagOfHolding');
    expect(bagEvent).toBeDefined();
    if (bagEvent && bagEvent.event.kind === 'treasureBagOfHolding') {
      expect(bagEvent.event.result).toBe(TreasureBagOfHolding.TypeIV);
    } else {
      throw new Error('treasureBagOfHolding event not found');
    }

    const compactParagraphs = result.compact
      .paragraphs()
      .map((text) => text.toLowerCase())
      .join(' ');
    expect(compactParagraphs).toContain(
      'there is a bag of holding (250 cu. ft., 1,500 lb capacity; bag weight 60 lb).'
    );
  });

  it('resolves bag of tricks type in compact mode', () => {
    const result = simulateCompactRunWithSequence({
      action: 'passage',
      rolls: [
        14,
        { tableId: 'chamberDimensions', roll: 1 },
        { tableId: 'chamberRoomContents', roll: 20 },
        { tableId: 'treasure', roll: 98 },
        { tableId: 'treasureMagicCategory', roll: 46 },
        { tableId: 'treasureMiscMagicE1', roll: 28 },
        { tableId: 'treasureBagOfTricks', roll: 9 },
      ],
      dungeonLevel: 1,
      allowUnusedRolls: true,
      mode: DirectiveMode.ManualThenAuto,
    });

    const miscEvent = findEvent(result.outcome, 'treasureMiscMagicE1');
    expect(miscEvent).toBeDefined();
    if (miscEvent && miscEvent.event.kind === 'treasureMiscMagicE1') {
      expect(miscEvent.event.result).toBe(TreasureMiscMagicE1.BagOfTricks);
    } else {
      throw new Error('treasureMiscMagicE1 event not found');
    }

    const bagOfTricksEvent = findEvent(result.outcome, 'treasureBagOfTricks');
    expect(bagOfTricksEvent).toBeDefined();
    if (
      bagOfTricksEvent &&
      bagOfTricksEvent.event.kind === 'treasureBagOfTricks'
    ) {
      expect(bagOfTricksEvent.event.result).toBe(TreasureBagOfTricks.Jackal);
    } else {
      throw new Error('treasureBagOfTricks event not found');
    }

    const compactParagraphs = result.compact
      .paragraphs()
      .map((text) => text.toLowerCase())
      .join(' ');
    expect(compactParagraphs).toContain('there is a bag of tricks, "jackal".');
  });

  it('resolves bracers of defense armor class in compact mode', () => {
    const result = simulateCompactRunWithSequence({
      action: 'passage',
      rolls: [
        14,
        { tableId: 'chamberDimensions', roll: 1 },
        { tableId: 'chamberRoomContents', roll: 20 },
        { tableId: 'treasure', roll: 98 },
        { tableId: 'treasureMagicCategory', roll: 46 },
        { tableId: 'treasureMiscMagicE1', roll: 60 },
        { tableId: 'treasureBracersOfDefense', roll: 60 },
      ],
      dungeonLevel: 1,
      allowUnusedRolls: true,
      mode: DirectiveMode.ManualThenAuto,
    });

    const miscEvent = findEvent(result.outcome, 'treasureMiscMagicE1');
    expect(miscEvent).toBeDefined();
    if (!miscEvent || miscEvent.event.kind !== 'treasureMiscMagicE1') {
      throw new Error('treasureMiscMagicE1 event not found');
    }
    expect(miscEvent.event.result).toBe(TreasureMiscMagicE1.BracersOfDefense);

    const bracersEvent = findEvent(result.outcome, 'treasureBracersOfDefense');
    expect(bracersEvent).toBeDefined();
    if (
      !bracersEvent ||
      bracersEvent.event.kind !== 'treasureBracersOfDefense'
    ) {
      throw new Error('treasureBracersOfDefense event not found');
    }
    expect(bracersEvent.event.result).toBe(TreasureBracersOfDefense.AC4);

    const compactParagraphs = result.compact
      .paragraphs()
      .map((text) => text.toLowerCase())
      .join(' ');
    expect(compactParagraphs).toContain(
      'there is a pair of bracers of defense ac4.'
    );
  });

  it("resolves Bucknard's everfull purse contents in compact mode", () => {
    const result = simulateCompactRunWithSequence({
      action: 'passage',
      rolls: [
        14,
        { tableId: 'chamberDimensions', roll: 1 },
        { tableId: 'chamberRoomContents', roll: 20 },
        { tableId: 'treasure', roll: 98 },
        { tableId: 'treasureMagicCategory', roll: 46 },
        { tableId: 'treasureMiscMagicE1', roll: 99 },
        { tableId: 'treasureBucknardsEverfullPurse', roll: 55 },
      ],
      dungeonLevel: 1,
      allowUnusedRolls: true,
      mode: DirectiveMode.ManualThenAuto,
    });

    const miscEvent = findEvent(result.outcome, 'treasureMiscMagicE1');
    expect(miscEvent).toBeDefined();
    if (!miscEvent || miscEvent.event.kind !== 'treasureMiscMagicE1') {
      throw new Error('treasureMiscMagicE1 event not found');
    }
    expect(miscEvent.event.result).toBe(
      TreasureMiscMagicE1.BucknardsEverfullPurse
    );

    const purseEvent = findEvent(
      result.outcome,
      'treasureBucknardsEverfullPurse'
    );
    expect(purseEvent).toBeDefined();
    if (
      !purseEvent ||
      purseEvent.event.kind !== 'treasureBucknardsEverfullPurse'
    ) {
      throw new Error('treasureBucknardsEverfullPurse event not found');
    }
    expect(purseEvent.event.result).toBe(
      TreasureBucknardsEverfullPurse.Platinum
    );

    const compactParagraphs = result.compact
      .paragraphs()
      .map((text) => text.toLowerCase())
      .join(' ');
    expect(compactParagraphs).toContain(
      "bucknard's everfull purse of platinum is here."
    );
  });

  it('resolves artifact or relic details in compact mode', () => {
    const result = simulateCompactRunWithSequence({
      action: 'passage',
      rolls: [
        14,
        { tableId: 'chamberDimensions', roll: 1 },
        { tableId: 'chamberRoomContents', roll: 20 },
        { tableId: 'treasure', roll: 98 },
        { tableId: 'treasureMagicCategory', roll: 46 },
        { tableId: 'treasureMiscMagicE1', roll: 17 },
        { tableId: 'treasureArtifactOrRelic', roll: 25 },
      ],
      dungeonLevel: 1,
      allowUnusedRolls: true,
      mode: DirectiveMode.ManualThenAuto,
    });

    const miscEvent = findEvent(result.outcome, 'treasureMiscMagicE1');
    expect(miscEvent).toBeDefined();
    if (!miscEvent || miscEvent.event.kind !== 'treasureMiscMagicE1') {
      throw new Error('treasureMiscMagicE1 event not found');
    }
    expect(miscEvent.event.result).toBe(TreasureMiscMagicE1.ArtifactOrRelic);

    const artifactEvent = findEvent(result.outcome, 'treasureArtifactOrRelic');
    expect(artifactEvent).toBeDefined();
    if (
      !artifactEvent ||
      artifactEvent.event.kind !== 'treasureArtifactOrRelic'
    ) {
      throw new Error('treasureArtifactOrRelic event not found');
    }
    expect(artifactEvent.event.result).toBe(
      TreasureArtifactOrRelic.HandOfVecna
    );

    const compactParagraphs = result.compact
      .paragraphs()
      .map((text) => text.toLowerCase())
      .join(' ');
    expect(compactParagraphs).toContain('there is a hand of vecna.');
  });

  it('resolves miscellaneous magic E.2 items in compact mode', () => {
    const result = simulateCompactRunWithSequence({
      action: 'passage',
      rolls: [
        14,
        { tableId: 'chamberDimensions', roll: 1 },
        { tableId: 'chamberRoomContents', roll: 20 },
        { tableId: 'treasure', roll: 98 },
        { tableId: 'treasureMagicCategory', roll: 50 },
        { tableId: 'treasureMiscMagicE2', roll: 8 },
        { tableId: 'treasureCarpetOfFlying', roll: 55 },
      ],
      dungeonLevel: 1,
      allowUnusedRolls: true,
      mode: DirectiveMode.ManualThenAuto,
    });

    const miscEvent = findEvent(result.outcome, 'treasureMiscMagicE2');
    expect(miscEvent).toBeDefined();
    if (!miscEvent || miscEvent.event.kind !== 'treasureMiscMagicE2') {
      throw new Error('treasureMiscMagicE2 event not found');
    }
    expect(miscEvent.event.result).toBe(TreasureMiscMagicE2.CarpetOfFlying);

    const compactParagraphs = result.compact
      .paragraphs()
      .map((text) => text.toLowerCase())
      .join(' ');
    expect(compactParagraphs).toContain(
      "there is a carpet of flying (4' × 6')."
    );
  });

  it('resolves miscellaneous magic E.3 items in compact mode', () => {
    const result = simulateCompactRunWithSequence({
      action: 'passage',
      rolls: [
        14,
        { tableId: 'chamberDimensions', roll: 1 },
        { tableId: 'chamberRoomContents', roll: 20 },
        { tableId: 'treasure', roll: 98 },
        { tableId: 'treasureMagicCategory', roll: 52 },
        { tableId: 'treasureMiscMagicE3', roll: 40 },
      ],
      dungeonLevel: 1,
      allowUnusedRolls: true,
      mode: DirectiveMode.ManualThenAuto,
    });

    const miscEvent = findEvent(result.outcome, 'treasureMiscMagicE3');
    expect(miscEvent).toBeDefined();
    if (!miscEvent || miscEvent.event.kind !== 'treasureMiscMagicE3') {
      throw new Error('treasureMiscMagicE3 event not found');
    }
    expect(miscEvent.event.result).toBe(
      TreasureMiscMagicE3.HelmOfTeleportation
    );

    const compactParagraphs = result.compact
      .paragraphs()
      .map((text) => text.toLowerCase())
      .join(' ');
    expect(compactParagraphs).toContain('there is a helm of teleportation.');
  });

  it('resolves miscellaneous magic E.4 items in compact mode', () => {
    const result = simulateCompactRunWithSequence({
      action: 'passage',
      rolls: [
        14,
        { tableId: 'chamberDimensions', roll: 1 },
        { tableId: 'chamberRoomContents', roll: 20 },
        { tableId: 'treasure', roll: 98 },
        { tableId: 'treasureMagicCategory', roll: 55 },
        { tableId: 'treasureMiscMagicE4', roll: 20 },
      ],
      dungeonLevel: 1,
      allowUnusedRolls: true,
      mode: DirectiveMode.ManualThenAuto,
    });

    const miscEvent = findEvent(result.outcome, 'treasureMiscMagicE4');
    expect(miscEvent).toBeDefined();
    if (!miscEvent || miscEvent.event.kind !== 'treasureMiscMagicE4') {
      throw new Error('treasureMiscMagicE4 event not found');
    }
    expect(miscEvent.event.result).toBe(
      TreasureMiscMagicE4.MirrorOfOpposition
    );

    const compactParagraphs = result.compact
      .paragraphs()
      .map((text) => text.toLowerCase())
      .join(' ');
    expect(compactParagraphs).toContain('there is a mirror of opposition.');
  });

  it('resolves manual of golems variants in compact mode', () => {
    const result = simulateCompactRunWithSequence({
      action: 'passage',
      rolls: [
        14,
        { tableId: 'chamberDimensions', roll: 1 },
        { tableId: 'chamberRoomContents', roll: 20 },
        { tableId: 'treasure', roll: 98 },
        { tableId: 'treasureMagicCategory', roll: 55 },
        { tableId: 'treasureMiscMagicE4', roll: 7 },
        { tableId: 'treasureManualOfGolems', roll: 18 },
      ],
      dungeonLevel: 1,
      allowUnusedRolls: true,
      mode: DirectiveMode.ManualThenAuto,
    });

    const miscEvent = findEvent(result.outcome, 'treasureMiscMagicE4');
    expect(miscEvent).toBeDefined();
    if (!miscEvent || miscEvent.event.kind !== 'treasureMiscMagicE4') {
      throw new Error('treasureMiscMagicE4 event not found');
    }
    expect(miscEvent.event.result).toBe(TreasureMiscMagicE4.ManualOfGolems);

    const manualEvent = findEvent(result.outcome, 'treasureManualOfGolems');
    expect(manualEvent).toBeDefined();
    if (!manualEvent || manualEvent.event.kind !== 'treasureManualOfGolems') {
      throw new Error('treasureManualOfGolems event not found');
    }
    expect(manualEvent.event.result).toBe(TreasureManualOfGolems.Iron);

    const compactParagraphs = result.compact
      .paragraphs()
      .map((text) => text.toLowerCase())
      .join(' ');
    expect(compactParagraphs).toContain(
      'there is a manual of iron golems.'
    );
  });

  it('resolves medallion of ESP variants in compact mode', () => {
    const result = simulateCompactRunWithSequence({
      action: 'passage',
      rolls: [
        14,
        { tableId: 'chamberDimensions', roll: 1 },
        { tableId: 'chamberRoomContents', roll: 20 },
        { tableId: 'treasure', roll: 98 },
        { tableId: 'treasureMagicCategory', roll: 55 },
        { tableId: 'treasureMiscMagicE4', roll: 15 },
        { tableId: 'treasureMedallionRange', roll: 17 },
      ],
      dungeonLevel: 1,
      allowUnusedRolls: true,
      mode: DirectiveMode.ManualThenAuto,
    });

    const miscEvent = findEvent(result.outcome, 'treasureMiscMagicE4');
    expect(miscEvent).toBeDefined();
    if (!miscEvent || miscEvent.event.kind !== 'treasureMiscMagicE4') {
      throw new Error('treasureMiscMagicE4 event not found');
    }
    expect(miscEvent.event.result).toBe(TreasureMiscMagicE4.MedallionOfESP);

    const medallionEvent = findEvent(result.outcome, 'treasureMedallionRange');
    expect(medallionEvent).toBeDefined();
    if (!medallionEvent || medallionEvent.event.kind !== 'treasureMedallionRange') {
      throw new Error('treasureMedallionRange event not found');
    }
    expect(medallionEvent.event.result).toBe(
      TreasureMedallionRange.ThirtyFeetWithEmpathy
    );

    const compactParagraphs = result.compact
      .paragraphs()
      .map((text) => text.toLowerCase())
      .join(' ');
    expect(compactParagraphs).toContain(
      "there is a medallion of esp (30', empathy)."
    );
  });

  it('resolves medallion of thought projection variants in compact mode', () => {
    const result = simulateCompactRunWithSequence({
      action: 'passage',
      rolls: [
        14,
        { tableId: 'chamberDimensions', roll: 1 },
        { tableId: 'chamberRoomContents', roll: 20 },
        { tableId: 'treasure', roll: 98 },
        { tableId: 'treasureMagicCategory', roll: 55 },
        { tableId: 'treasureMiscMagicE4', roll: 17 },
        { tableId: 'treasureMedallionRange', roll: 20 },
      ],
      dungeonLevel: 1,
      allowUnusedRolls: true,
      mode: DirectiveMode.ManualThenAuto,
    });

    const miscEvent = findEvent(result.outcome, 'treasureMiscMagicE4');
    expect(miscEvent).toBeDefined();
    if (!miscEvent || miscEvent.event.kind !== 'treasureMiscMagicE4') {
      throw new Error('treasureMiscMagicE4 event not found');
    }
    expect(miscEvent.event.result).toBe(
      TreasureMiscMagicE4.MedallionOfThoughtProjection
    );

    const medallionEvent = findEvent(result.outcome, 'treasureMedallionRange');
    expect(medallionEvent).toBeDefined();
    if (!medallionEvent || medallionEvent.event.kind !== 'treasureMedallionRange') {
      throw new Error('treasureMedallionRange event not found');
    }
    expect(medallionEvent.event.result).toBe(
      TreasureMedallionRange.NinetyFeet
    );

    const compactParagraphs = result.compact
      .paragraphs()
      .map((text) => text.toLowerCase())
      .join(' ');
    expect(compactParagraphs).toContain(
      "there is a medallion of thought projection (90')."
    );
  });

  it('resolves necklace of missiles variants in compact mode', () => {
    const result = simulateCompactRunWithSequence({
      action: 'passage',
      rolls: [
        14,
        { tableId: 'chamberDimensions', roll: 1 },
        { tableId: 'chamberRoomContents', roll: 20 },
        { tableId: 'treasure', roll: 98 },
        { tableId: 'treasureMagicCategory', roll: 55 },
        { tableId: 'treasureMiscMagicE4', roll: 25 },
        { tableId: 'treasureNecklaceOfMissiles', roll: 14 },
      ],
      dungeonLevel: 1,
      allowUnusedRolls: true,
      mode: DirectiveMode.ManualThenAuto,
    });

    const miscEvent = findEvent(result.outcome, 'treasureMiscMagicE4');
    expect(miscEvent).toBeDefined();
    if (!miscEvent || miscEvent.event.kind !== 'treasureMiscMagicE4') {
      throw new Error('treasureMiscMagicE4 event not found');
    }
    expect(miscEvent.event.result).toBe(
      TreasureMiscMagicE4.NecklaceOfMissiles
    );

    const necklaceEvent = findEvent(
      result.outcome,
      'treasureNecklaceOfMissiles'
    );
    expect(necklaceEvent).toBeDefined();
    if (
      !necklaceEvent ||
      necklaceEvent.event.kind !== 'treasureNecklaceOfMissiles'
    ) {
      throw new Error('treasureNecklaceOfMissiles event not found');
    }
    expect(necklaceEvent.event.result.missiles).toEqual([
      { dice: 8, count: 1 },
      { dice: 6, count: 2 },
      { dice: 4, count: 2 },
      { dice: 2, count: 4 },
    ]);

    const compactParagraphs = result.compact
      .paragraphs()
      .map((text) => text.toLowerCase())
      .join(' ');
    expect(compactParagraphs).toContain(
      'there is a necklace of missiles (1x8, 2x6, 2x4, 4x2).'
    );
  });

  it('handles pearl of power forgetting in compact mode', () => {
    const result = simulateCompactRunWithSequence({
      action: 'passage',
      rolls: [
        14,
        { tableId: 'chamberDimensions', roll: 1 },
        { tableId: 'chamberRoomContents', roll: 20 },
        { tableId: 'treasure', roll: 98 },
        { tableId: 'treasureMagicCategory', roll: 55 },
        { tableId: 'treasureMiscMagicE4', roll: 45 },
        { tableId: 'treasurePearlOfPowerEffect', roll: 1 },
      ],
      dungeonLevel: 1,
      allowUnusedRolls: true,
      mode: DirectiveMode.ManualThenAuto,
    });

    const effectEvent = findEvent(result.outcome, 'treasurePearlOfPowerEffect');
    expect(effectEvent).toBeDefined();
    if (!effectEvent || effectEvent.event.kind !== 'treasurePearlOfPowerEffect') {
      throw new Error('treasurePearlOfPowerEffect event not found');
    }
    expect(effectEvent.event.result).toBe(TreasurePearlOfPowerEffect.Forgetting);

    const compactParagraphs = result.compact
      .paragraphs()
      .map((text) => text.toLowerCase())
      .join(' ');
    expect(compactParagraphs).toContain('pearl of power (forgetting)');
  });

  it('resolves pearl of power recall in compact mode', () => {
    const result = simulateCompactRunWithSequence({
      action: 'passage',
      rolls: [
        14,
        { tableId: 'chamberDimensions', roll: 1 },
        { tableId: 'chamberRoomContents', roll: 20 },
        { tableId: 'treasure', roll: 98 },
        { tableId: 'treasureMagicCategory', roll: 55 },
        { tableId: 'treasureMiscMagicE4', roll: 46 },
        { tableId: 'treasurePearlOfPowerEffect', roll: 5 },
        { tableId: 'treasurePearlOfPowerRecall', roll: 70 },
      ],
      dungeonLevel: 1,
      allowUnusedRolls: true,
      mode: DirectiveMode.ManualThenAuto,
    });

    const recallEvent = findEvent(result.outcome, 'treasurePearlOfPowerRecall');
    expect(recallEvent).toBeDefined();
    if (!recallEvent || recallEvent.event.kind !== 'treasurePearlOfPowerRecall') {
      throw new Error('treasurePearlOfPowerRecall event not found');
    }
    expect(recallEvent.event.result).toEqual({ type: 'single', level: 4 });

    const compactParagraphs = result.compact
      .paragraphs()
      .map((text) => text.toLowerCase())
      .join(' ');
    expect(compactParagraphs).toContain(
      'pearl of power (recalls 4th level)'
    );
  });

  it('handles pearl of wisdom loss in compact mode', () => {
    const result = simulateCompactRunWithSequence({
      action: 'passage',
      rolls: [
        14,
        { tableId: 'chamberDimensions', roll: 1 },
        { tableId: 'chamberRoomContents', roll: 20 },
        { tableId: 'treasure', roll: 98 },
        { tableId: 'treasureMagicCategory', roll: 55 },
        { tableId: 'treasureMiscMagicE4', roll: 47 },
        { tableId: 'treasurePearlOfWisdom', roll: 1 },
      ],
      dungeonLevel: 1,
      allowUnusedRolls: true,
      mode: DirectiveMode.ManualThenAuto,
    });

    const wisdomEvent = findEvent(result.outcome, 'treasurePearlOfWisdom');
    expect(wisdomEvent).toBeDefined();
    if (!wisdomEvent || wisdomEvent.event.kind !== 'treasurePearlOfWisdom') {
      throw new Error('treasurePearlOfWisdom event not found');
    }
    expect(wisdomEvent.event.result).toBe(TreasurePearlOfWisdomOutcome.LoseOne);

    const compactParagraphs = result.compact
      .paragraphs()
      .map((text) => text.toLowerCase())
      .join(' ');
    expect(compactParagraphs).toContain('pearl of wisdom (-1)');
  });

  it('handles pearl of wisdom gain in compact mode', () => {
    const result = simulateCompactRunWithSequence({
      action: 'passage',
      rolls: [
        14,
        { tableId: 'chamberDimensions', roll: 1 },
        { tableId: 'chamberRoomContents', roll: 20 },
        { tableId: 'treasure', roll: 98 },
        { tableId: 'treasureMagicCategory', roll: 55 },
        { tableId: 'treasureMiscMagicE4', roll: 48 },
        { tableId: 'treasurePearlOfWisdom', roll: 10 },
      ],
      dungeonLevel: 1,
      allowUnusedRolls: true,
      mode: DirectiveMode.ManualThenAuto,
    });

    const wisdomEvent = findEvent(result.outcome, 'treasurePearlOfWisdom');
    expect(wisdomEvent).toBeDefined();
    if (!wisdomEvent || wisdomEvent.event.kind !== 'treasurePearlOfWisdom') {
      throw new Error('treasurePearlOfWisdom event not found');
    }
    expect(wisdomEvent.event.result).toBe(TreasurePearlOfWisdomOutcome.GainOne);

    const compactParagraphs = result.compact
      .paragraphs()
      .map((text) => text.toLowerCase())
      .join(' ');
    expect(compactParagraphs).toContain('pearl of wisdom (+1)');
  });

  it('resolves figurine of wondrous power variants in compact mode', () => {
    const result = simulateCompactRunWithSequence({
      action: 'passage',
      rolls: [
        14,
        { tableId: 'chamberDimensions', roll: 1 },
        { tableId: 'chamberRoomContents', roll: 20 },
        { tableId: 'treasure', roll: 98 },
        { tableId: 'treasureMagicCategory', roll: 52 },
        { tableId: 'treasureMiscMagicE3', roll: 8 },
        { tableId: 'treasureFigurineOfWondrousPower', roll: 45 },
        { tableId: 'treasureFigurineMarbleElephant', roll: 70 },
      ],
      dungeonLevel: 1,
      allowUnusedRolls: true,
      mode: DirectiveMode.ManualThenAuto,
    });

    const figurineEvent = findEvent(
      result.outcome,
      'treasureFigurineOfWondrousPower'
    );
    expect(figurineEvent).toBeDefined();
    if (
      !figurineEvent ||
      figurineEvent.event.kind !== 'treasureFigurineOfWondrousPower'
    ) {
      throw new Error('figurine event not found');
    }
    expect(figurineEvent.event.result).toBe(
      TreasureFigurineOfWondrousPower.MarbleElephant
    );

    const marbleEvent = findEvent(
      result.outcome,
      'treasureFigurineMarbleElephant'
    );
    expect(marbleEvent).toBeDefined();
    if (
      !marbleEvent ||
      marbleEvent.event.kind !== 'treasureFigurineMarbleElephant'
    ) {
      throw new Error('marble elephant event not found');
    }
    expect(marbleEvent.event.result).toBe(
      TreasureFigurineMarbleElephant.African
    );

    const compactParagraphs = result.compact
      .paragraphs()
      .map((text) => text.toLowerCase())
      .join(' ');
    expect(compactParagraphs).toContain(
      'there is a figurine of wondrous power. the figurine is a marble elephant (african loxodont).'
    );
  });

  it('resolves girdle of giant strength variants in compact mode', () => {
    const result = simulateCompactRunWithSequence({
      action: 'passage',
      rolls: [
        14,
        { tableId: 'chamberDimensions', roll: 1 },
        { tableId: 'chamberRoomContents', roll: 20 },
        { tableId: 'treasure', roll: 98 },
        { tableId: 'treasureMagicCategory', roll: 52 },
        { tableId: 'treasureMiscMagicE3', roll: 29 },
        { tableId: 'treasureGirdleOfGiantStrength', roll: 72 },
      ],
      dungeonLevel: 1,
      allowUnusedRolls: true,
      mode: DirectiveMode.ManualThenAuto,
    });

    const girdleEvent = findEvent(
      result.outcome,
      'treasureGirdleOfGiantStrength'
    );
    expect(girdleEvent).toBeDefined();
    if (
      !girdleEvent ||
      girdleEvent.event.kind !== 'treasureGirdleOfGiantStrength'
    ) {
      throw new Error('girdle event not found');
    }
    expect(girdleEvent.event.result).toBe(TreasureGirdleOfGiantStrength.Fire);

    const compactParagraphs = result.compact
      .paragraphs()
      .map((text) => text.toLowerCase())
      .join(' ');
    expect(compactParagraphs).toContain(
      'there is a girdle of fire giant strength (c, f, t).'
    );
  });

  it('resolves instrument of the bards variants in compact mode', () => {
    const result = simulateCompactRunWithSequence({
      action: 'passage',
      rolls: [
        14,
        { tableId: 'chamberDimensions', roll: 1 },
        { tableId: 'chamberRoomContents', roll: 20 },
        { tableId: 'treasure', roll: 98 },
        { tableId: 'treasureMagicCategory', roll: 52 },
        { tableId: 'treasureMiscMagicE3', roll: 75 },
        { tableId: 'treasureInstrumentOfTheBards', roll: 18 },
      ],
      dungeonLevel: 1,
      allowUnusedRolls: true,
      mode: DirectiveMode.ManualThenAuto,
    });

    const instrumentEvent = findEvent(
      result.outcome,
      'treasureInstrumentOfTheBards'
    );
    expect(instrumentEvent).toBeDefined();
    if (
      !instrumentEvent ||
      instrumentEvent.event.kind !== 'treasureInstrumentOfTheBards'
    ) {
      throw new Error('instrument of the bards event not found');
    }
    expect(instrumentEvent.event.result).toBe(
      TreasureInstrumentOfTheBards.AnstruthHarp
    );

    const compactParagraphs = result.compact
      .paragraphs()
      .map((text) => text.toLowerCase())
      .join(' ');
    expect(compactParagraphs).toContain(
      'there is an instrument of the bards: anstruth harp.'
    );
  });

  it('resolves iron flask contents in compact mode', () => {
    const result = simulateCompactRunWithSequence({
      action: 'passage',
      rolls: [
        14,
        { tableId: 'chamberDimensions', roll: 1 },
        { tableId: 'chamberRoomContents', roll: 20 },
        { tableId: 'treasure', roll: 98 },
        { tableId: 'treasureMagicCategory', roll: 52 },
        { tableId: 'treasureMiscMagicE3', roll: 79 },
        { tableId: 'treasureIronFlask', roll: 52 },
      ],
      dungeonLevel: 1,
      allowUnusedRolls: true,
      mode: DirectiveMode.ManualThenAuto,
    });

    const ironFlaskEvent = findEvent(result.outcome, 'treasureIronFlask');
    expect(ironFlaskEvent).toBeDefined();
    if (!ironFlaskEvent || ironFlaskEvent.event.kind !== 'treasureIronFlask') {
      throw new Error('iron flask event not found');
    }
    expect(ironFlaskEvent.event.result).toBe(
      TreasureIronFlaskContent.AirElemental
    );

    const compactParagraphs = result.compact
      .paragraphs()
      .map((text) => text.toLowerCase())
      .join(' ');
    expect(compactParagraphs).toContain(
      'there is an iron flask. it contains an air elemental.'
    );
  });

  it('resolves non-aligned horn of valhalla in compact mode', () => {
    const result = simulateCompactRunWithSequence({
      action: 'passage',
      rolls: [
        14,
        { tableId: 'chamberDimensions', roll: 1 },
        { tableId: 'chamberRoomContents', roll: 20 },
        { tableId: 'treasure', roll: 98 },
        { tableId: 'treasureMagicCategory', roll: 52 },
        { tableId: 'treasureMiscMagicE3', roll: 56 },
        { tableId: 'treasureHornOfValhallaType', roll: 19 },
        { tableId: 'treasureHornOfValhallaAttunement', roll: 18 },
      ],
      dungeonLevel: 1,
      allowUnusedRolls: true,
      mode: DirectiveMode.ManualThenAuto,
    });

    const miscEvent = findEvent(result.outcome, 'treasureMiscMagicE3');
    expect(miscEvent).toBeDefined();
    if (!miscEvent || miscEvent.event.kind !== 'treasureMiscMagicE3') {
      throw new Error('treasureMiscMagicE3 event not found');
    }
    expect(miscEvent.event.result).toBe(TreasureMiscMagicE3.HornOfValhalla);

    const hornTypeEvent = findEvent(
      result.outcome,
      'treasureHornOfValhallaType'
    );
    expect(hornTypeEvent).toBeDefined();
    if (
      !hornTypeEvent ||
      hornTypeEvent.event.kind !== 'treasureHornOfValhallaType'
    ) {
      throw new Error('horn type event not found');
    }
    expect(hornTypeEvent.event.result).toBe(TreasureHornOfValhallaType.Iron);

    const attunementEvent = findEvent(
      result.outcome,
      'treasureHornOfValhallaAttunement'
    );
    expect(attunementEvent).toBeDefined();
    if (
      !attunementEvent ||
      attunementEvent.event.kind !== 'treasureHornOfValhallaAttunement'
    ) {
      throw new Error('horn attunement event not found');
    }
    expect(attunementEvent.event.result).toBe(
      TreasureHornOfValhallaAttunement.NonAligned
    );

    const alignmentEvent = findEvent(
      result.outcome,
      'treasureHornOfValhallaAlignment'
    );
    expect(alignmentEvent).toBeUndefined();

    const compactParagraphs = result.compact
      .paragraphs()
      .map((text) => text.toLowerCase())
      .join(' ');
    expect(compactParagraphs).toContain(
      'there is an iron horn of valhalla (non-aligned).'
    );
  });

  it('resolves aligned horn of valhalla in compact mode', () => {
    const result = simulateCompactRunWithSequence({
      action: 'passage',
      rolls: [
        14,
        { tableId: 'chamberDimensions', roll: 1 },
        { tableId: 'chamberRoomContents', roll: 20 },
        { tableId: 'treasure', roll: 98 },
        { tableId: 'treasureMagicCategory', roll: 52 },
        { tableId: 'treasureMiscMagicE3', roll: 54 },
        { tableId: 'treasureHornOfValhallaType', roll: 4 },
        { tableId: 'treasureHornOfValhallaAttunement', roll: 96 },
        { tableId: 'treasureHornOfValhallaAlignment', roll: 2 },
      ],
      dungeonLevel: 1,
      allowUnusedRolls: true,
      mode: DirectiveMode.ManualThenAuto,
    });

    const hornTypeEvent = findEvent(
      result.outcome,
      'treasureHornOfValhallaType'
    );
    expect(hornTypeEvent).toBeDefined();
    if (
      !hornTypeEvent ||
      hornTypeEvent.event.kind !== 'treasureHornOfValhallaType'
    ) {
      throw new Error('horn type event not found');
    }
    expect(hornTypeEvent.event.result).toBe(TreasureHornOfValhallaType.Silver);

    const attunementEvent = findEvent(
      result.outcome,
      'treasureHornOfValhallaAttunement'
    );
    expect(attunementEvent).toBeDefined();
    if (
      !attunementEvent ||
      attunementEvent.event.kind !== 'treasureHornOfValhallaAttunement'
    ) {
      throw new Error('horn attunement event not found');
    }
    expect(attunementEvent.event.result).toBe(
      TreasureHornOfValhallaAttunement.Aligned
    );

    const alignmentEvent = findEvent(
      result.outcome,
      'treasureHornOfValhallaAlignment'
    );
    expect(alignmentEvent).toBeDefined();
    if (
      !alignmentEvent ||
      alignmentEvent.event.kind !== 'treasureHornOfValhallaAlignment'
    ) {
      throw new Error('horn alignment event not found');
    }
    expect(alignmentEvent.event.result).toBe(
      TreasureHornOfValhallaAlignment.LawfulNeutral
    );

    const compactParagraphs = result.compact
      .paragraphs()
      .map((text) => text.toLowerCase())
      .join(' ');
    expect(compactParagraphs).toContain(
      'there is a silver horn of valhalla (lawful neutral).'
    );
  });

  it('resolves cloak of protection bonus in compact mode', () => {
    const result = simulateCompactRunWithSequence({
      action: 'passage',
      rolls: [
        14,
        { tableId: 'chamberDimensions', roll: 1 },
        { tableId: 'chamberRoomContents', roll: 20 },
        { tableId: 'treasure', roll: 98 },
        { tableId: 'treasureMagicCategory', roll: 50 },
        { tableId: 'treasureMiscMagicE2', roll: 33 },
        { tableId: 'treasureCloakOfProtection', roll: 90 },
      ],
      dungeonLevel: 1,
      allowUnusedRolls: true,
      mode: DirectiveMode.ManualThenAuto,
    });

    const cloakEvent = findEvent(result.outcome, 'treasureCloakOfProtection');
    expect(cloakEvent).toBeDefined();
    if (!cloakEvent || cloakEvent.event.kind !== 'treasureCloakOfProtection') {
      throw new Error('cloak event not found');
    }
    expect(cloakEvent.event.result).toBe('+4');

    const compactParagraphs = result.compact
      .paragraphs()
      .map((text) => text.toLowerCase())
      .join(' ');
    expect(compactParagraphs).toContain('there is a cloak of protection +4.');
  });

  it('resolves crystal ball variants in compact mode', () => {
    const result = simulateCompactRunWithSequence({
      action: 'passage',
      rolls: [
        14,
        { tableId: 'chamberDimensions', roll: 1 },
        { tableId: 'chamberRoomContents', roll: 20 },
        { tableId: 'treasure', roll: 98 },
        { tableId: 'treasureMagicCategory', roll: 50 },
        { tableId: 'treasureMiscMagicE2', roll: 60 },
        { tableId: 'treasureCrystalBall', roll: 77 },
      ],
      dungeonLevel: 1,
      allowUnusedRolls: true,
      mode: DirectiveMode.ManualThenAuto,
    });

    const crystalEvent = findEvent(result.outcome, 'treasureCrystalBall');
    expect(crystalEvent).toBeDefined();
    if (!crystalEvent || crystalEvent.event.kind !== 'treasureCrystalBall') {
      throw new Error('crystal event not found');
    }
    expect(crystalEvent.event.result).toBe(TreasureCrystalBall.Esp);

    const compactParagraphs = result.compact
      .paragraphs()
      .map((text) => text.toLowerCase())
      .join(' ');
    expect(compactParagraphs).toContain('there is a crystal ball with esp.');
  });

  it('resolves ioun stones with duplicates in compact mode', () => {
    const { result, unused } = withMockedDice([4, 2, 2, 15, 8], () =>
      simulateCompactRunWithSequence({
        action: 'passage',
        rolls: [
          14,
          { tableId: 'chamberDimensions', roll: 1 },
          { tableId: 'chamberRoomContents', roll: 20 },
          { tableId: 'treasure', roll: 98 },
          { tableId: 'treasureMagicCategory', roll: 52 },
          { tableId: 'treasureMiscMagicE3', roll: 72 },
        ],
        dungeonLevel: 1,
        allowUnusedRolls: true,
        mode: DirectiveMode.ManualThenAuto,
      })
    );

    expect(unused).toHaveLength(0);

    const miscEvent = findEvent(result.outcome, 'treasureMiscMagicE3');
    expect(miscEvent).toBeDefined();
    if (!miscEvent || miscEvent.event.kind !== 'treasureMiscMagicE3') {
      throw new Error('treasureMiscMagicE3 event not found');
    }
    expect(miscEvent.event.result).toBe(TreasureMiscMagicE3.IounStones);

    const stonesEvent = findEvent(result.outcome, 'treasureIounStones');
    expect(stonesEvent).toBeDefined();
    if (!stonesEvent || stonesEvent.event.kind !== 'treasureIounStones') {
      throw new Error('treasureIounStones event not found');
    }

    const { stones, countRoll } = stonesEvent.event.result;
    expect(countRoll).toBe(4);
    expect(stones).toHaveLength(4);
    expect(stones[0]?.type).toBe(TreasureIounStoneType.ScarletAndBlue);
    expect(stones[0]?.status).toBe('active');
    expect(stones[1]?.status).toBe('duplicate');
    expect(stones[1]?.duplicateOf).toBe(1);
    expect(stones[2]?.status).toBe('dead');
    expect(stones[3]?.status).toBe('active');

    expect(
      result.compact.nodes.some(
        (node): node is Extract<DungeonRenderNode, { kind: 'ioun-stones' }> =>
          node.kind === 'ioun-stones'
      )
    ).toBe(true);
  });

  it('resolves deck of many things composition in compact mode', () => {
    const result = simulateCompactRunWithSequence({
      action: 'passage',
      rolls: [
        14,
        { tableId: 'chamberDimensions', roll: 1 },
        { tableId: 'chamberRoomContents', roll: 20 },
        { tableId: 'treasure', roll: 98 },
        { tableId: 'treasureMagicCategory', roll: 50 },
        { tableId: 'treasureMiscMagicE2', roll: 74 },
        { tableId: 'treasureDeckOfManyThings', roll: 90 },
      ],
      dungeonLevel: 1,
      allowUnusedRolls: true,
      mode: DirectiveMode.ManualThenAuto,
    });

    const deckEvent = findEvent(result.outcome, 'treasureDeckOfManyThings');
    expect(deckEvent).toBeDefined();
    if (!deckEvent || deckEvent.event.kind !== 'treasureDeckOfManyThings') {
      throw new Error('deck event not found');
    }
    expect(deckEvent.event.result).toBe(
      TreasureDeckOfManyThings.TwentyTwoPlaques
    );

    const compactParagraphs = result.compact
      .paragraphs()
      .map((text) => text.toLowerCase())
      .join(' ');
    expect(compactParagraphs).toContain(
      'there is a deck of many things containing 22 plaques.'
    );
  });

  it('resolves eyes of petrification variant in compact mode', () => {
    const result = simulateCompactRunWithSequence({
      action: 'passage',
      rolls: [
        14,
        { tableId: 'chamberDimensions', roll: 1 },
        { tableId: 'chamberRoomContents', roll: 20 },
        { tableId: 'treasure', roll: 98 },
        { tableId: 'treasureMagicCategory', roll: 50 },
        { tableId: 'treasureMiscMagicE2', roll: 100 },
        { tableId: 'treasureEyesOfPetrification', roll: 12 },
      ],
      dungeonLevel: 1,
      allowUnusedRolls: true,
      mode: DirectiveMode.ManualThenAuto,
    });

    const eyesEvent = findEvent(result.outcome, 'treasureEyesOfPetrification');
    expect(eyesEvent).toBeDefined();
    if (!eyesEvent || eyesEvent.event.kind !== 'treasureEyesOfPetrification') {
      throw new Error('eyes event not found');
    }
    expect(eyesEvent.event.result).toBe(TreasureEyesOfPetrification.Basilisk);

    const compactParagraphs = result.compact
      .paragraphs()
      .map((text) => text.toLowerCase())
      .join(' ');
    expect(compactParagraphs).toContain(
      'there are eyes of petrification (basilisk).'
    );
  });
});

function withMockedDice<T>(
  rolls: number[],
  fn: () => T
): {
  result: T;
  unused: number[];
} {
  const queue = [...rolls];
  const originalRollDice = dungeonLookup.rollDice;
  const spy = jest
    .spyOn(dungeonLookup, 'rollDice')
    .mockImplementation((sides: number, count = 1) => {
      let total = 0;
      for (let i = 0; i < count; i += 1) {
        if (queue.length === 0) {
          total += originalRollDice.call(dungeonLookup, sides, count - i);
          break;
        }
        const value = queue.shift();
        if (value === undefined) {
          throw new Error('Ran out of predetermined rolls for rollDice.');
        }
        if (value < 1 || value > sides) {
          throw new Error(
            `Predetermined roll ${value} is invalid for d${sides}.`
          );
        }
        total += value;
      }
      return total;
    });
  try {
    const result = fn();
    return { result, unused: [...queue] };
  } finally {
    spy.mockRestore();
  }
}

type EventNode = Extract<DungeonOutcomeNode, { type: 'event' }>;
function findEvent(
  node: DungeonOutcomeNode | undefined,
  kind: EventNode['event']['kind']
): EventNode | undefined {
  if (!node) return undefined;
  if (node.type === 'event') {
    if (node.event.kind === kind) return node;
    if (!node.children) return undefined;
    for (const child of node.children) {
      if (child.type === 'event') {
        const found = findEvent(child, kind);
        if (found) return found;
      }
    }
  }
  return undefined;
}
