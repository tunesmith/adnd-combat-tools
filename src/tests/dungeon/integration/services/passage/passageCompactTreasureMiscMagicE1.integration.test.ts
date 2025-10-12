import {
  simulateCompactRunWithSequence,
  DirectiveMode,
} from '../../../../support/dungeon/dungeonRollHarness';
import type { DungeonOutcomeNode } from '../../../../../dungeon/domain/outcome';
import { TreasureMiscMagicE1 } from '../../../../../tables/dungeon/treasureMiscMagicE1';
import { TreasureBagOfHolding } from '../../../../../tables/dungeon/treasureBagOfHolding';
import { TreasureBagOfTricks } from '../../../../../tables/dungeon/treasureBagOfTricks';
import { TreasureArtifactOrRelic } from '../../../../../tables/dungeon/treasureArtifactOrRelic';
import { TreasureMiscMagicE2 } from '../../../../../tables/dungeon/treasureMiscMagicE2';
import { TreasureMiscMagicE3 } from '../../../../../tables/dungeon/treasureMiscMagicE3';
import { TreasureFigurineOfWondrousPower } from '../../../../../tables/dungeon/treasureFigurineOfWondrousPower';
import { TreasureFigurineMarbleElephant } from '../../../../../tables/dungeon/treasureFigurineMarbleElephant';
import { TreasureGirdleOfGiantStrength } from '../../../../../tables/dungeon/treasureGirdleOfGiantStrength';
import { TreasureCrystalBall } from '../../../../../tables/dungeon/treasureCrystalBall';
import { TreasureDeckOfManyThings } from '../../../../../tables/dungeon/treasureDeckOfManyThings';
import { TreasureEyesOfPetrification } from '../../../../../tables/dungeon/treasureEyesOfPetrification';
import { TreasureBracersOfDefense } from '../../../../../tables/dungeon/treasureBracersOfDefense';
import { TreasureBucknardsEverfullPurse } from '../../../../../tables/dungeon/treasureBucknardsEverfullPurse';

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
