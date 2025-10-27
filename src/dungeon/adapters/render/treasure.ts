import type { DungeonMessage, DungeonRenderNode } from '../../../types/dungeon';
import type { OutcomeEventNode, TreasureEntry } from '../../domain/outcome';
import {
  treasureWithMonster,
  treasureWithoutMonster,
  TreasureWithoutMonster,
} from '../../../tables/dungeon/treasure';
import { resolvedPotionSentence } from './treasurePotion';
import { resolvedScrollSentence } from './treasureScroll';
import { ringSentence } from './treasureRing';
import { resolveRodStaffWandLabel } from './treasureRodStaffWand';
import {
  buildPreview,
  joinSegments,
  findChildEvent,
  type AppendPreviewFn,
  type TablePreviewFactory,
} from './shared';
import { describeTreasureContainerResult } from './treasureContainer';
import {
  describeTreasureProtectionGuardedBy,
  describeTreasureProtectionHiddenBy,
} from './treasureProtection';
import { treasureMiscMagicE1Sentence } from './treasureMiscMagicE1';
import { bagOfHoldingSentence } from './treasureBagOfHolding';
import { bagOfTricksSentence } from './treasureBagOfTricks';
import { bracersSentence } from './treasureBracersOfDefense';
import { purseSentence } from './treasureBucknardsEverfullPurse';
import { artifactSentence } from './treasureArtifactOrRelic';
import { miscMagicE2Sentence } from './treasureMiscMagicE2';
import { figurineSentence } from './treasureFigurineOfWondrousPower';
import { girdleSentence } from './treasureGirdleOfGiantStrength';
import { instrumentOfTheBardsSentence } from './treasureInstrumentOfTheBards';
import { ironFlaskSentence } from './treasureIronFlask';
import { hornSentence } from './treasureHornOfValhalla';
import { miscMagicE3Sentence } from './treasureMiscMagicE3';
import { miscMagicE4Sentence } from './treasureMiscMagicE4';
import { miscMagicE5Sentence } from './treasureMiscMagicE5';
import { TreasureMiscMagicE5 } from '../../../tables/dungeon/treasureMiscMagicE5';
import { TreasureMagicCategory } from '../../../tables/dungeon/treasureMagic';
import { toRobeOfUsefulItemsSummary } from './treasureRobeOfUsefulItems';
import { medallionRangeParenthetical } from './treasureMedallionRange';
import { TreasureMiscMagicE4 } from '../../../tables/dungeon/treasureMiscMagicE4';
import { manualOfGolemsSentence } from './treasureManualOfGolems';
import { necklaceOfMissilesParenthetical } from './treasureNecklaceOfMissiles';
import { pearlParenthetical } from './treasurePearlOfPower';
import { pearlOfWisdomParenthetical } from './treasurePearlOfWisdom';
import { periaptPoisonParenthetical } from './treasurePeriaptProofAgainstPoison';
import { phylacteryLongYearsParenthetical } from './treasurePhylacteryLongYears';
import { quaalFeatherTokenParenthetical } from './treasureQuaalFeatherToken';
import { toPrayerBeadsSummary } from './treasureNecklaceOfPrayerBeads';
import { sentence as crystalBallSentence } from './treasureCrystalBall';
import { sentence as deckSentence } from './treasureDeckOfManyThings';
import { sentence as eyesSentence } from './treasureEyesOfPetrification';
import { cloakSentence } from './treasureCloakOfProtection';
import { TreasureProtectionType } from '../../../tables/dungeon/treasureProtection';
import { BAG_OF_HOLDING_STATS } from '../../../tables/dungeon/treasureBagOfHolding';
import { toIounStonesSummary } from './treasureIounStones';
import { armorShieldSentence } from './treasureArmorShields';
import { swordSentence, formatSwordIntelligence } from './treasureSwords';
import { miscWeaponSentence } from './treasureMiscWeapons';

export function renderTreasureDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasure') return [];
  const { entries, withMonster, rollIndex, totalRolls } = outcome.event;
  const resolvedMagicDetail = describeResolvedMagic(outcome);

  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: headingLabel(withMonster, rollIndex, totalRolls),
  };
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: entries.map((entry) => {
      const description = describeTreasureEntry(entry);
      const rollLabel =
        rollIndex && totalRolls && totalRolls > 1
          ? `roll ${rollIndex} of ${totalRolls}`
          : 'roll';
      return `${rollLabel}: ${entry.roll} — ${description.label}`;
    }),
  };

  const nodes: DungeonRenderNode[] = [heading, bullet];
  for (const entry of entries) {
    const description = describeTreasureEntry(entry);
    if (entry.command === TreasureWithoutMonster.Magic && resolvedMagicDetail) {
      nodes.push({ kind: 'paragraph', text: resolvedMagicDetail });
    } else {
      nodes.push({ kind: 'paragraph', text: description.detail });
    }
  }

  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderTreasureCompactNodes(
  outcome: OutcomeEventNode
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'treasure') return [];
  const withMonster = outcome.event.withMonster ?? false;
  const { rollIndex, totalRolls } = outcome.event;
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: headingLabel(withMonster, rollIndex, totalRolls),
  };
  const text = summarizeTreasureCompact(outcome);
  const nodes: DungeonRenderNode[] = [heading];
  if (text.trim().length > 0) {
    nodes.push({ kind: 'paragraph', text });
  }
  const iounStones = findIounStonesEvent(outcome);
  if (iounStones && iounStones.event.kind === 'treasureIounStones') {
    nodes.push({
      kind: 'ioun-stones',
      summary: toIounStonesSummary(iounStones.event.result),
      display: 'compact',
    });
  }
  const prayerBeads = findPrayerBeadsEvent(outcome);
  if (
    prayerBeads &&
    prayerBeads.event.kind === 'treasureNecklaceOfPrayerBeads'
  ) {
    nodes.push({
      kind: 'prayer-beads',
      summary: toPrayerBeadsSummary(prayerBeads.event.result),
      display: 'compact',
    });
  }
  const robeItems = findRobeOfUsefulItemsEvent(outcome);
  if (robeItems && robeItems.event.kind === 'treasureRobeOfUsefulItems') {
    nodes.push({
      kind: 'robe-of-useful-items',
      summary: toRobeOfUsefulItemsSummary(robeItems.event.result),
      display: 'compact',
    });
  }
  return nodes;
}

export const buildTreasurePreview: TablePreviewFactory = (tableId, context) => {
  const treasureContext =
    context && context.kind === 'treasure' ? context : undefined;
  const withMonster = treasureContext?.withMonster ?? false;
  const table = withMonster ? treasureWithMonster : treasureWithoutMonster;
  const rollIndex = treasureContext?.rollIndex;
  const totalRolls = treasureContext?.totalRolls;
  const title = headingLabel(withMonster, rollIndex, totalRolls);

  return buildPreview(tableId, {
    title,
    sides: table.sides,
    entries: table.entries.map((entry) => ({
      range: entry.range,
      label: previewLabelForCommand(entry.command),
    })),
    context,
  });
};

export function summarizeTreasureCompact(outcome: OutcomeEventNode): string {
  if (outcome.event.kind !== 'treasure') return '';
  const { entries } = outcome.event;
  const resolvedMagic = describeResolvedMagic(outcome);
  const robeSummaryTarget = findRobeOfUsefulItemsEvent(outcome);
  const segments = entries.map((entry) => {
    if (entry.command === TreasureWithoutMonster.Magic) {
      if (
        robeSummaryTarget &&
        robeSummaryTarget.event.kind === 'treasureRobeOfUsefulItems'
      ) {
        return 'There is a Robe of Useful Items:';
      }
      if (resolvedMagic) {
        return resolvedMagic;
      }
    }
    return describeTreasureEntry(entry).compact;
  });
  const container = findChildEvent(outcome, 'treasureContainer');
  if (container && container.event.kind === 'treasureContainer') {
    const containerText = describeTreasureContainerResult(
      container.event.result
    );
    if (containerText) segments.push(containerText);
  }
  const protection = describeTreasureProtection(outcome);
  if (protection) segments.push(protection);
  return joinSegments(segments).trim();
}

function describeResolvedMagic(outcome: OutcomeEventNode): string | undefined {
  const magic = findChildEvent(outcome, 'treasureMagicCategory');
  if (!magic || magic.event.kind !== 'treasureMagicCategory') return undefined;
  const potion = findChildEvent(magic, 'treasurePotion');
  if (potion && potion.event.kind === 'treasurePotion') {
    return resolvedPotionSentence(potion);
  }
  const scroll = findChildEvent(magic, 'treasureScroll');
  if (scroll && scroll.event.kind === 'treasureScroll') {
    return resolvedScrollSentence(scroll);
  }
  const ring = findChildEvent(magic, 'treasureRing');
  if (ring && ring.event.kind === 'treasureRing') {
    return ringSentence(ring.event.result, ring);
  }
  const rod = findChildEvent(magic, 'treasureRodStaffWand');
  if (rod && rod.event.kind === 'treasureRodStaffWand') {
    const label = resolveRodStaffWandLabel(rod);
    return label.length > 0 ? `There is a ${label}.` : undefined;
  }
  const armorShieldsEvent = findArmorShieldsEvent(magic);
  if (
    armorShieldsEvent &&
    armorShieldsEvent.event.kind === 'treasureArmorShields' &&
    magic.event.result === TreasureMagicCategory.ArmorShields
  ) {
    return armorShieldSentence(armorShieldsEvent.event.result);
  }
  const swordsEvent = findSwordsEvent(magic);
  if (
    swordsEvent &&
    swordsEvent.event.kind === 'treasureSwords' &&
    magic.event.result === TreasureMagicCategory.Swords
  ) {
    const kindEvent = findChildEvent(swordsEvent, 'treasureSwordKind');
    const kind =
      kindEvent && kindEvent.event.kind === 'treasureSwordKind'
        ? kindEvent.event.result
        : undefined;
    const unusualEvent = findChildEvent(swordsEvent, 'treasureSwordUnusual');
    const intelligenceLabel =
      unusualEvent && unusualEvent.event.kind === 'treasureSwordUnusual'
        ? formatSwordIntelligence(unusualEvent.event.result)
        : undefined;
    const alignmentEvent = findSwordAlignmentEvent(swordsEvent);
    const alignmentResult =
      alignmentEvent && alignmentEvent.event.kind === 'treasureSwordAlignment'
        ? alignmentEvent.event.result
        : undefined;
    return swordSentence(
      swordsEvent.event.result,
      kind,
      alignmentResult,
      intelligenceLabel
    );
  }
  const miscWeaponsEvent = findMiscWeaponsEvent(magic);
  if (
    miscWeaponsEvent &&
    miscWeaponsEvent.event.kind === 'treasureMiscWeapons' &&
    magic.event.result === TreasureMagicCategory.MiscWeapons
  ) {
    return miscWeaponSentence(miscWeaponsEvent.event.result);
  }
  const miscMagicE1 = findChildEvent(magic, 'treasureMiscMagicE1');
  if (miscMagicE1 && miscMagicE1.event.kind === 'treasureMiscMagicE1') {
    const bag = findChildEvent(miscMagicE1, 'treasureBagOfHolding');
    if (bag && bag.event.kind === 'treasureBagOfHolding') {
      const stats = BAG_OF_HOLDING_STATS[bag.event.result];
      return bagOfHoldingSentence(stats);
    }
    const bagOfTricks = findChildEvent(miscMagicE1, 'treasureBagOfTricks');
    if (bagOfTricks && bagOfTricks.event.kind === 'treasureBagOfTricks') {
      return bagOfTricksSentence(bagOfTricks.event.result);
    }
    const bracers = findChildEvent(miscMagicE1, 'treasureBracersOfDefense');
    if (bracers && bracers.event.kind === 'treasureBracersOfDefense') {
      return bracersSentence(bracers.event.result);
    }
    const purse = findChildEvent(miscMagicE1, 'treasureBucknardsEverfullPurse');
    if (purse && purse.event.kind === 'treasureBucknardsEverfullPurse') {
      return purseSentence(purse.event.result);
    }
    const artifact = findChildEvent(miscMagicE1, 'treasureArtifactOrRelic');
    if (artifact && artifact.event.kind === 'treasureArtifactOrRelic') {
      return artifactSentence(artifact.event.result);
    }
    return treasureMiscMagicE1Sentence(miscMagicE1.event.result);
  }
  const miscMagicE2 = findChildEvent(magic, 'treasureMiscMagicE2');
  if (miscMagicE2 && miscMagicE2.event.kind === 'treasureMiscMagicE2') {
    const carpet = findChildEvent(miscMagicE2, 'treasureCarpetOfFlying');
    if (carpet && carpet.event.kind === 'treasureCarpetOfFlying') {
      return `There is a carpet of flying (${carpet.event.result}).`;
    }
    const cloak = findChildEvent(miscMagicE2, 'treasureCloakOfProtection');
    if (cloak && cloak.event.kind === 'treasureCloakOfProtection') {
      return cloakSentence(cloak.event.result);
    }
    const crystal = findChildEvent(miscMagicE2, 'treasureCrystalBall');
    if (crystal && crystal.event.kind === 'treasureCrystalBall') {
      return crystalBallSentence(crystal.event.result);
    }
    const deck = findChildEvent(miscMagicE2, 'treasureDeckOfManyThings');
    if (deck && deck.event.kind === 'treasureDeckOfManyThings') {
      return deckSentence(deck.event.result);
    }
    const eyes = findChildEvent(miscMagicE2, 'treasureEyesOfPetrification');
    if (eyes && eyes.event.kind === 'treasureEyesOfPetrification') {
      return eyesSentence(eyes.event.result);
    }
    return miscMagicE2Sentence(miscMagicE2.event.result);
  }
  const miscMagicE3 = findChildEvent(magic, 'treasureMiscMagicE3');
  if (miscMagicE3 && miscMagicE3.event.kind === 'treasureMiscMagicE3') {
    const figurine = findChildEvent(
      miscMagicE3,
      'treasureFigurineOfWondrousPower'
    );
    if (figurine && figurine.event.kind === 'treasureFigurineOfWondrousPower') {
      const marble = findChildEvent(figurine, 'treasureFigurineMarbleElephant');
      return figurineSentence(figurine.event.result, marble);
    }
    const girdle = findChildEvent(miscMagicE3, 'treasureGirdleOfGiantStrength');
    if (girdle && girdle.event.kind === 'treasureGirdleOfGiantStrength') {
      return girdleSentence(girdle.event.result);
    }
    const instrument = findChildEvent(
      miscMagicE3,
      'treasureInstrumentOfTheBards'
    );
    if (
      instrument &&
      instrument.event.kind === 'treasureInstrumentOfTheBards'
    ) {
      return instrumentOfTheBardsSentence(instrument.event.result);
    }
    const ironFlask = findChildEvent(miscMagicE3, 'treasureIronFlask');
    if (ironFlask && ironFlask.event.kind === 'treasureIronFlask') {
      return ironFlaskSentence(ironFlask.event.result);
    }
    const iounStones = findIounStonesEvent(outcome);
    if (iounStones) return '';
    const hornType = findChildEvent(miscMagicE3, 'treasureHornOfValhallaType');
    if (hornType && hornType.event.kind === 'treasureHornOfValhallaType') {
      const attunement = findChildEvent(
        hornType,
        'treasureHornOfValhallaAttunement'
      );
      const alignment =
        attunement &&
        attunement.event.kind === 'treasureHornOfValhallaAttunement'
          ? findChildEvent(attunement, 'treasureHornOfValhallaAlignment')
          : undefined;
      return hornSentence({
        type: hornType.event.result,
        attunement:
          attunement &&
          attunement.event.kind === 'treasureHornOfValhallaAttunement'
            ? attunement.event.result
            : undefined,
        alignment:
          alignment &&
          alignment.event.kind === 'treasureHornOfValhallaAlignment'
            ? alignment.event.result
            : undefined,
      });
    }
    return miscMagicE3Sentence(miscMagicE3.event.result);
  }
  const miscMagicE4 = findChildEvent(magic, 'treasureMiscMagicE4');
  if (miscMagicE4 && miscMagicE4.event.kind === 'treasureMiscMagicE4') {
    const manual = findChildEvent(miscMagicE4, 'treasureManualOfGolems');
    if (manual && manual.event.kind === 'treasureManualOfGolems') {
      return manualOfGolemsSentence(manual.event.result);
    }
    const medallion = findChildEvent(miscMagicE4, 'treasureMedallionRange');
    if (
      medallion &&
      medallion.event.kind === 'treasureMedallionRange' &&
      (miscMagicE4.event.result === TreasureMiscMagicE4.MedallionOfESP ||
        miscMagicE4.event.result ===
          TreasureMiscMagicE4.MedallionOfThoughtProjection)
    ) {
      const base = miscMagicE4Sentence(miscMagicE4.event.result);
      const suffix = medallionRangeParenthetical(medallion.event.result);
      return `${base.slice(0, -1)} (${suffix}).`;
    }
    const necklace = findChildEvent(
      miscMagicE4,
      'treasureNecklaceOfMissiles'
    );
    if (
      necklace &&
      necklace.event.kind === 'treasureNecklaceOfMissiles' &&
      miscMagicE4.event.result === TreasureMiscMagicE4.NecklaceOfMissiles
    ) {
      const base = miscMagicE4Sentence(miscMagicE4.event.result);
      const suffix = necklaceOfMissilesParenthetical(necklace.event.result);
      return `${base.slice(0, -1)} (${suffix}).`;
    }
    const pearlEffect = findChildEvent(
      miscMagicE4,
      'treasurePearlOfPowerEffect'
    );
    if (
      pearlEffect &&
      pearlEffect.event.kind === 'treasurePearlOfPowerEffect' &&
      miscMagicE4.event.result === TreasureMiscMagicE4.PearlOfPower
    ) {
      const recallChild = findChildEvent(
        pearlEffect,
        'treasurePearlOfPowerRecall'
      );
      const recallResult =
        recallChild && recallChild.event.kind === 'treasurePearlOfPowerRecall'
          ? recallChild.event.result
          : undefined;
      const base = miscMagicE4Sentence(miscMagicE4.event.result);
      const suffix = pearlParenthetical(
        pearlEffect.event.result,
        recallResult
      );
      return `${base.slice(0, -1)} (${suffix}).`;
    }
    const pearlWisdom = findChildEvent(miscMagicE4, 'treasurePearlOfWisdom');
    if (
      pearlWisdom &&
      pearlWisdom.event.kind === 'treasurePearlOfWisdom' &&
      miscMagicE4.event.result === TreasureMiscMagicE4.PearlOfWisdom
    ) {
      const base = miscMagicE4Sentence(miscMagicE4.event.result);
      const suffix = pearlOfWisdomParenthetical(pearlWisdom.event.result);
      return `${base.slice(0, -1)} (${suffix}).`;
    }
    const periaptPoison = findChildEvent(
      miscMagicE4,
      'treasurePeriaptProofAgainstPoison'
    );
    if (
      periaptPoison &&
      periaptPoison.event.kind === 'treasurePeriaptProofAgainstPoison' &&
      miscMagicE4.event.result ===
        TreasureMiscMagicE4.PeriaptOfProofAgainstPoison
    ) {
      const base = miscMagicE4Sentence(miscMagicE4.event.result);
      const suffix = periaptPoisonParenthetical(
        periaptPoison.event.result
      );
      return `${base.slice(0, -1)} (${suffix}).`;
    }
    const phylacteryLongYears = findChildEvent(
      miscMagicE4,
      'treasurePhylacteryLongYears'
    );
    if (
      phylacteryLongYears &&
      phylacteryLongYears.event.kind === 'treasurePhylacteryLongYears' &&
      miscMagicE4.event.result === TreasureMiscMagicE4.PhylacteryOfLongYears
    ) {
      const base = miscMagicE4Sentence(miscMagicE4.event.result);
      const suffix = phylacteryLongYearsParenthetical(
        phylacteryLongYears.event.result
      );
      return `${base.slice(0, -1)} (${suffix}).`;
    }
    const quaalToken = findChildEvent(
      miscMagicE4,
      'treasureQuaalFeatherToken'
    );
    if (
      quaalToken &&
      quaalToken.event.kind === 'treasureQuaalFeatherToken' &&
      miscMagicE4.event.result === TreasureMiscMagicE4.QuaalsFeatherToken
    ) {
      const base = miscMagicE4Sentence(miscMagicE4.event.result);
      const suffix = quaalFeatherTokenParenthetical(quaalToken.event.result);
      return `${base.slice(0, -1)} (${suffix}).`;
    }
    const prayerBeads = findChildEvent(
      miscMagicE4,
      'treasureNecklaceOfPrayerBeads'
    );
    if (
      prayerBeads &&
      prayerBeads.event.kind === 'treasureNecklaceOfPrayerBeads' &&
      miscMagicE4.event.result === TreasureMiscMagicE4.NecklaceOfPrayerBeads
    ) {
      return miscMagicE4Sentence(miscMagicE4.event.result);
    }
    return miscMagicE4Sentence(miscMagicE4.event.result);
  }
  const miscMagicE5 = findChildEvent(magic, 'treasureMiscMagicE5');
  if (miscMagicE5 && miscMagicE5.event.kind === 'treasureMiscMagicE5') {
    if (miscMagicE5.event.result === TreasureMiscMagicE5.RobeOfUsefulItems) {
      const robeItems = findRobeOfUsefulItemsEvent(outcome);
      if (robeItems) return '';
    }
    const robeChild = findChildEvent(
      miscMagicE5,
      'treasureRobeOfTheArchmagi'
    );
    const robeAlignment =
      robeChild && robeChild.event.kind === 'treasureRobeOfTheArchmagi'
        ? robeChild.event.result
        : undefined;
    const scarabCurse = findChildEvent(
      miscMagicE5,
      'treasureScarabOfProtectionCurse'
    );
    const scarabCurseResult =
      scarabCurse && scarabCurse.event.kind === 'treasureScarabOfProtectionCurse'
        ? scarabCurse.event.result
        : undefined;
    const scarabResolution = scarabCurse
      ? findChildEvent(
          scarabCurse,
          'treasureScarabOfProtectionCurseResolution'
        )
      : undefined;
    const scarabResolutionResult =
      scarabResolution &&
      scarabResolution.event.kind ===
        'treasureScarabOfProtectionCurseResolution'
        ? scarabResolution.event.result
        : undefined;
    return miscMagicE5Sentence(
      miscMagicE5.event.result,
      robeAlignment,
      scarabCurseResult,
      scarabResolutionResult
    );
  }
  return undefined;
}

export function collectTreasureCompactSummaries(
  node: OutcomeEventNode
): string[] {
  const summaries: string[] = [];
  const visited = new Set<OutcomeEventNode>();
  const visit = (current: OutcomeEventNode): void => {
    if (visited.has(current)) return;
    visited.add(current);
    if (current.event.kind === 'treasure') {
      const summary = summarizeTreasureCompact(current);
      if (summary.length > 0) summaries.push(summary);
    }
    current.children?.forEach((child) => {
      if (child.type === 'event') visit(child);
    });
  };
  visit(node);
  return summaries;
}

export function collectTreasureCompactMessages(
  node: OutcomeEventNode
): DungeonMessage[] {
  const messages: DungeonMessage[] = [];
  const visited = new Set<OutcomeEventNode>();
  const visit = (current: OutcomeEventNode): void => {
    if (visited.has(current)) return;
    visited.add(current);
    if (current.event.kind === 'treasure') {
      const iounStones = findIounStonesEvent(current);
      if (iounStones && iounStones.event.kind === 'treasureIounStones') {
        messages.push({
          kind: 'ioun-stones',
          summary: toIounStonesSummary(iounStones.event.result),
          display: 'compact',
        });
      }
      const prayerBeads = findPrayerBeadsEvent(current);
      if (
        prayerBeads &&
        prayerBeads.event.kind === 'treasureNecklaceOfPrayerBeads'
      ) {
        messages.push({
          kind: 'prayer-beads',
          summary: toPrayerBeadsSummary(prayerBeads.event.result),
          display: 'compact',
        });
      }
      const robeItems = findRobeOfUsefulItemsEvent(current);
      if (robeItems && robeItems.event.kind === 'treasureRobeOfUsefulItems') {
        messages.push({
          kind: 'robe-of-useful-items',
          summary: toRobeOfUsefulItemsSummary(robeItems.event.result),
          display: 'compact',
        });
      }
    }
    current.children?.forEach((child) => {
      if (child.type === 'event') visit(child);
    });
  };
  visit(node);
  return messages;
}

function findIounStonesEvent(
  node: OutcomeEventNode
): OutcomeEventNode | undefined {
  if (node.event.kind === 'treasureIounStones') {
    return node;
  }
  const children = node.children || [];
  for (const child of children) {
    if (child.type !== 'event') continue;
    const match = findIounStonesEvent(child);
    if (match) return match;
  }
  return undefined;
}

function findPrayerBeadsEvent(
  node: OutcomeEventNode
): OutcomeEventNode | undefined {
  if (node.event.kind === 'treasureNecklaceOfPrayerBeads') {
    return node;
  }
  const children = node.children || [];
  for (const child of children) {
    if (child.type !== 'event') continue;
    const match = findPrayerBeadsEvent(child);
    if (match) return match;
  }
  return undefined;
}

function findRobeOfUsefulItemsEvent(
  node: OutcomeEventNode
): OutcomeEventNode | undefined {
  if (node.event.kind === 'treasureRobeOfUsefulItems') {
    return node;
  }
  const children = node.children || [];
  for (const child of children) {
    if (child.type !== 'event') continue;
    const match = findRobeOfUsefulItemsEvent(child);
    if (match) return match;
  }
  return undefined;
}

function findArmorShieldsEvent(
  node: OutcomeEventNode
): OutcomeEventNode | undefined {
  if (node.event.kind === 'treasureArmorShields') {
    return node;
  }
  const children = node.children || [];
  for (const child of children) {
    if (child.type !== 'event') continue;
    const match = findArmorShieldsEvent(child);
    if (match) return match;
  }
  return undefined;
}

function findSwordsEvent(
  node: OutcomeEventNode
): OutcomeEventNode | undefined {
  if (node.event.kind === 'treasureSwords') {
    return node;
  }
  const children = node.children || [];
  for (const child of children) {
    if (child.type !== 'event') continue;
    const match = findSwordsEvent(child);
    if (match) return match;
  }
  return undefined;
}

function findSwordAlignmentEvent(
  node: OutcomeEventNode
): OutcomeEventNode | undefined {
  if (node.event.kind === 'treasureSwordAlignment') {
    return node;
  }
  const children = node.children || [];
  for (const child of children) {
    if (child.type !== 'event') continue;
    const match = findSwordAlignmentEvent(child);
    if (match) return match;
  }
  return undefined;
}

function findMiscWeaponsEvent(
  node: OutcomeEventNode
): OutcomeEventNode | undefined {
  if (node.event.kind === 'treasureMiscWeapons') {
    return node;
  }
  const children = node.children || [];
  for (const child of children) {
    if (child.type !== 'event') continue;
    const match = findMiscWeaponsEvent(child);
    if (match) return match;
  }
  return undefined;
}

type TreasureDescription = {
  label: string;
  detail: string;
  compact: string;
};

function describeTreasureEntry(entry: TreasureEntry): TreasureDescription {
  switch (entry.command) {
    case TreasureWithoutMonster.CopperPerLevel:
    case TreasureWithoutMonster.SilverPerLevel:
    case TreasureWithoutMonster.ElectrumPerLevel:
    case TreasureWithoutMonster.GoldPerLevel:
    case TreasureWithoutMonster.PlatinumPerLevel:
    case TreasureWithoutMonster.GemsPerLevel:
    case TreasureWithoutMonster.JewelryPerLevel:
      return quantifiedDescription(entry);
    case TreasureWithoutMonster.Magic:
      return rewardDescription('There is magical treasure.');
    default:
      return rewardDescription('Treasure.');
  }
}

function quantifiedDescription(entry: TreasureEntry): TreasureDescription {
  const trimmed = entry.display?.trim() ?? 'Treasure';
  const quantity = entry.quantity;
  const verb = quantity === 1 ? 'is' : 'are';
  const detail = quantity
    ? `There ${verb} ${trimmed} here.`
    : `There is ${trimmed}.`;
  return {
    label: trimmed,
    detail: detail.endsWith('.') ? detail : `${detail}.`,
    compact: detail.endsWith('.') ? detail : `${detail}.`,
  };
}

function rewardDescription(base: string): TreasureDescription {
  const normalized = base.endsWith('.') ? base : `${base}.`;
  return {
    label: normalized.replace(/\.$/, ''),
    detail: normalized,
    compact: normalized,
  };
}

function describeTreasureProtection(
  outcome: OutcomeEventNode
): string | undefined {
  const protectionType = findChildEvent(outcome, 'treasureProtectionType');
  if (
    !protectionType ||
    protectionType.event.kind !== 'treasureProtectionType'
  ) {
    return undefined;
  }
  const guard = findChildEvent(protectionType, 'treasureProtectionGuardedBy');
  if (guard && guard.event.kind === 'treasureProtectionGuardedBy') {
    const detail = describeTreasureProtectionGuardedBy(guard.event.result);
    if (detail) return `If desired, the treasure is guarded by ${detail}.`;
  }
  const hidden = findChildEvent(protectionType, 'treasureProtectionHiddenBy');
  if (hidden && hidden.event.kind === 'treasureProtectionHiddenBy') {
    const detail = describeTreasureProtectionHiddenBy(hidden.event.result);
    if (detail) return `If desired, the treasure is hidden ${detail}.`;
  }
  switch (protectionType.event.result) {
    case TreasureProtectionType.Guarded:
      return 'If desired, the treasure is guarded.';
    case TreasureProtectionType.Hidden:
      return 'If desired, the treasure is hidden.';
    default:
      return 'If desired, the treasure is protected.';
  }
}

function previewLabelForCommand(command: TreasureWithoutMonster): string {
  switch (command) {
    case TreasureWithoutMonster.CopperPerLevel:
      return '1,000 copper pieces per level';
    case TreasureWithoutMonster.SilverPerLevel:
      return '1,000 silver pieces per level';
    case TreasureWithoutMonster.ElectrumPerLevel:
      return '750 electrum pieces per level';
    case TreasureWithoutMonster.GoldPerLevel:
      return '250 gold pieces per level';
    case TreasureWithoutMonster.PlatinumPerLevel:
      return '100 platinum pieces per level';
    case TreasureWithoutMonster.GemsPerLevel:
      return '1-4 gems per level';
    case TreasureWithoutMonster.JewelryPerLevel:
      return '1 jewelry item per level';
    case TreasureWithoutMonster.Magic:
      return 'Magic (roll on Magic Items table)';
    default:
      return 'Treasure';
  }
}

function headingLabel(
  withMonster: boolean,
  rollIndex?: number,
  totalRolls?: number
): string {
  const base = withMonster ? 'Treasure (with monster)' : 'Treasure';
  if (totalRolls && totalRolls > 1 && rollIndex) {
    return `${base} — roll ${rollIndex} of ${totalRolls}`;
  }
  return base;
}
