import type {
  DungeonMessage,
  DungeonRenderNode,
} from '../../../../types/dungeon';
import type { InlineText } from '../../../helpers/inlineContent';
import type {
  OutcomeEventNode,
  TreasureEntry,
  TreasureJewelryPiece,
  TreasureGemLot,
  TreasureGemValueAdjustment,
  TreasureGemKind,
} from '../../../domain/outcome';
import {
  treasureWithMonster,
  treasureWithoutMonster,
  TreasureWithoutMonster,
} from './treasureTable';
import { resolvedPotionSentence } from '../potion/potionRender';
import { resolvedScrollSentence } from '../scroll/scrollRender';
import { ringSentence } from '../ring/ringRender';
import { resolveRodStaffWandLabel } from '../rodStaffWand/rodStaffWandRender';
import {
  emphasizeInlineText,
  extractLeadingItemPhrase,
  joinSentenceInlineTexts,
} from '../../../helpers/inlineContent';
import {
  buildPreview,
  findChildEvent,
  type AppendPreviewFn,
  type TablePreviewFactory,
} from '../../../adapters/render/shared';
import { describeTreasureContainerResult } from '../container/containerRender';
import {
  describeTreasureProtectionGuardedBy,
  describeTreasureProtectionHiddenBy,
} from '../protection/protectionRender';
import { treasureMiscMagicE1Sentence } from '../miscMagicE1/miscMagicE1Render';
import {
  artifactSentence,
  bagOfHoldingSentence,
  bagOfTricksSentence,
  bracersSentence,
  purseSentence,
} from '../miscMagicE1/miscMagicE1SubtablesRender';
import { miscMagicE2Sentence } from '../miscMagicE2/miscMagicE2Render';
import { miscMagicE3Sentence } from '../miscMagicE3/miscMagicE3Render';
import {
  figurineSentence,
  girdleSentence,
  hornSentence,
  instrumentOfTheBardsSentence,
  ironFlaskSentence,
  toIounStonesSummary,
} from '../miscMagicE3/miscMagicE3SubtablesRender';
import { miscMagicE4Sentence } from '../miscMagicE4/miscMagicE4Render';
import { miscMagicE5Sentence } from '../miscMagicE5/miscMagicE5Render';
import { TreasureMiscMagicE5 } from '../miscMagicE5/miscMagicE5Table';
import { TreasureMagicCategory } from '../magicCategory/magicCategoryTable';
import { toRobeOfUsefulItemsSummary } from '../miscMagicE5/miscMagicE5SubtablesRender';
import { TreasureMiscMagicE4 } from '../miscMagicE4/miscMagicE4Table';
import {
  manualOfGolemsSentence,
  medallionRangeParenthetical,
  necklaceOfMissilesParenthetical,
  pearlParenthetical,
  pearlOfWisdomParenthetical,
  periaptPoisonParenthetical,
  phylacteryLongYearsParenthetical,
  quaalFeatherTokenParenthetical,
  toPrayerBeadsSummary,
} from '../miscMagicE4/miscMagicE4SubtablesRender';
import {
  cloakSentence,
  crystalBallSentence,
  deckSentence,
  eyesSentence,
} from '../miscMagicE2/miscMagicE2SubtablesRender';
import { TreasureProtectionType } from '../protection/protectionTables';
import { BAG_OF_HOLDING_STATS } from '../miscMagicE1/miscMagicE1Subtables';
import { armorShieldSentence } from '../armorShields/armorShieldsRender';
import {
  swordSentence,
  formatSwordIntelligence,
  summarizePrimaryAbilities,
} from '../swords/swordsRender';
import { computeSwordEgo } from '../swords/swordEgo';
import { miscWeaponSentence } from '../miscWeapons/miscWeaponsRender';
import { resolvedPotionItemName } from '../potion/potionRender';
import { resolvedRingItemName } from '../ring/ringRender';

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
      nodes.push({ kind: 'paragraph', ...resolvedMagicDetail });
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
  const summary = summarizeTreasureCompact(outcome);
  const nodes: DungeonRenderNode[] = [heading];
  if (summary.text.trim().length > 0) {
    nodes.push({ kind: 'paragraph', ...summary });
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

function summarizeTreasureCompact(outcome: OutcomeEventNode): InlineText {
  if (outcome.event.kind !== 'treasure') return { text: '' };
  const { entries } = outcome.event;
  const resolvedMagic = describeResolvedMagic(outcome);
  const robeSummaryTarget = findRobeOfUsefulItemsEvent(outcome);
  const segments: Array<string | InlineText> = entries.map((entry) => {
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
  return joinSentenceInlineTexts(segments);
}

function describeResolvedMagic(
  outcome: OutcomeEventNode
): InlineText | undefined {
  const magic = findChildEvent(outcome, 'treasureMagicCategory');
  if (!magic || magic.event.kind !== 'treasureMagicCategory') return undefined;
  const potion = findChildEvent(magic, 'treasurePotion');
  if (potion && potion.event.kind === 'treasurePotion') {
    return emphasizeInlineText(
      resolvedPotionSentence(potion),
      resolvedPotionItemName(potion)
    );
  }
  const scroll = findChildEvent(magic, 'treasureScroll');
  if (scroll && scroll.event.kind === 'treasureScroll') {
    const text = resolvedScrollSentence(scroll);
    return emphasizeInlineText(text, extractLeadingItemPhrase(text));
  }
  const ring = findChildEvent(magic, 'treasureRing');
  if (ring && ring.event.kind === 'treasureRing') {
    return emphasizeInlineText(
      ringSentence(ring.event.result, ring),
      resolvedRingItemName(ring.event.result, ring)
    );
  }
  const rod = findChildEvent(magic, 'treasureRodStaffWand');
  if (rod && rod.event.kind === 'treasureRodStaffWand') {
    const label = resolveRodStaffWandLabel(rod);
    return label.length > 0
      ? emphasizeInlineText(`There is a ${label}.`, label)
      : undefined;
  }
  const armorShieldsEvent = findArmorShieldsEvent(magic);
  if (
    armorShieldsEvent &&
    armorShieldsEvent.event.kind === 'treasureArmorShields' &&
    magic.event.result === TreasureMagicCategory.ArmorShields
  ) {
    const text = armorShieldSentence(armorShieldsEvent.event.result);
    return emphasizeInlineText(text, extractLeadingItemPhrase(text));
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
    const abilitySummaries =
      unusualEvent && unusualEvent.event.kind === 'treasureSwordUnusual'
        ? summarizePrimaryAbilities(unusualEvent)
        : summarizePrimaryAbilities(swordsEvent);
    const alignmentEvent = findSwordAlignmentEvent(swordsEvent);
    const alignmentResult =
      alignmentEvent && alignmentEvent.event.kind === 'treasureSwordAlignment'
        ? alignmentEvent.event.result
        : undefined;
    const dragonColorEvent = findDragonSlayerColorEvent(swordsEvent);
    const dragonSlayerColorLabel =
      dragonColorEvent &&
      dragonColorEvent.event.kind === 'treasureSwordDragonSlayerColor'
        ? dragonColorEvent.event.result.label
        : undefined;
    const luckBladeWishes = swordsEvent.event.luckBladeWishes;
    const ego = computeSwordEgo(swordsEvent);
    const sentence = swordSentence(
      swordsEvent.event.result,
      kind,
      alignmentResult,
      ego,
      intelligenceLabel,
      abilitySummaries,
      luckBladeWishes,
      dragonSlayerColorLabel
    );
    return emphasizeInlineText(sentence, extractLeadingItemPhrase(sentence));
  }
  const miscWeaponsEvent = findMiscWeaponsEvent(magic);
  if (
    miscWeaponsEvent &&
    miscWeaponsEvent.event.kind === 'treasureMiscWeapons' &&
    magic.event.result === TreasureMagicCategory.MiscWeapons
  ) {
    const text = miscWeaponSentence(miscWeaponsEvent.event.result);
    return emphasizeInlineText(text, extractLeadingItemPhrase(text));
  }
  const miscMagicE1 = findChildEvent(magic, 'treasureMiscMagicE1');
  if (miscMagicE1 && miscMagicE1.event.kind === 'treasureMiscMagicE1') {
    const bag = findChildEvent(miscMagicE1, 'treasureBagOfHolding');
    if (bag && bag.event.kind === 'treasureBagOfHolding') {
      const stats = BAG_OF_HOLDING_STATS[bag.event.result];
      return emphasizeInlineText(bagOfHoldingSentence(stats), 'bag of holding');
    }
    const bagOfTricks = findChildEvent(miscMagicE1, 'treasureBagOfTricks');
    if (bagOfTricks && bagOfTricks.event.kind === 'treasureBagOfTricks') {
      return emphasizeInlineText(
        bagOfTricksSentence(bagOfTricks.event.result),
        'bag of tricks'
      );
    }
    const bracers = findChildEvent(miscMagicE1, 'treasureBracersOfDefense');
    if (bracers && bracers.event.kind === 'treasureBracersOfDefense') {
      const text = bracersSentence(bracers.event.result);
      return emphasizeInlineText(text, extractLeadingItemPhrase(text));
    }
    const purse = findChildEvent(miscMagicE1, 'treasureBucknardsEverfullPurse');
    if (purse && purse.event.kind === 'treasureBucknardsEverfullPurse') {
      const text = purseSentence(purse.event.result);
      return emphasizeInlineText(text, extractLeadingItemPhrase(text));
    }
    const artifact = findChildEvent(miscMagicE1, 'treasureArtifactOrRelic');
    if (artifact && artifact.event.kind === 'treasureArtifactOrRelic') {
      const text = artifactSentence(artifact.event.result);
      return emphasizeInlineText(text, extractLeadingItemPhrase(text));
    }
    const text = treasureMiscMagicE1Sentence(
      miscMagicE1.event.result,
      miscMagicE1.event.beaker
    );
    return emphasizeInlineText(text, extractLeadingItemPhrase(text));
  }
  const miscMagicE2 = findChildEvent(magic, 'treasureMiscMagicE2');
  if (miscMagicE2 && miscMagicE2.event.kind === 'treasureMiscMagicE2') {
    const carpet = findChildEvent(miscMagicE2, 'treasureCarpetOfFlying');
    if (carpet && carpet.event.kind === 'treasureCarpetOfFlying') {
      return emphasizeInlineText(
        `There is a carpet of flying (${carpet.event.result}).`,
        'carpet of flying'
      );
    }
    const cloak = findChildEvent(miscMagicE2, 'treasureCloakOfProtection');
    if (cloak && cloak.event.kind === 'treasureCloakOfProtection') {
      const text = cloakSentence(cloak.event.result);
      return emphasizeInlineText(text, text.slice('There is a '.length, -1));
    }
    const crystal = findChildEvent(miscMagicE2, 'treasureCrystalBall');
    if (crystal && crystal.event.kind === 'treasureCrystalBall') {
      const text = crystalBallSentence(crystal.event.result);
      return emphasizeInlineText(text, text.slice('There is a '.length, -1));
    }
    const deck = findChildEvent(miscMagicE2, 'treasureDeckOfManyThings');
    if (deck && deck.event.kind === 'treasureDeckOfManyThings') {
      const text = deckSentence(deck.event.result);
      return emphasizeInlineText(text, text.slice('There is a '.length, -1));
    }
    const eyes = findChildEvent(miscMagicE2, 'treasureEyesOfPetrification');
    if (eyes && eyes.event.kind === 'treasureEyesOfPetrification') {
      const text = eyesSentence(eyes.event.result);
      return emphasizeInlineText(text, text.slice('There is '.length, -1));
    }
    const text = miscMagicE2Sentence(miscMagicE2.event.result);
    return emphasizeInlineText(text, extractLeadingItemPhrase(text));
  }
  const miscMagicE3 = findChildEvent(magic, 'treasureMiscMagicE3');
  if (miscMagicE3 && miscMagicE3.event.kind === 'treasureMiscMagicE3') {
    const figurine = findChildEvent(
      miscMagicE3,
      'treasureFigurineOfWondrousPower'
    );
    if (figurine && figurine.event.kind === 'treasureFigurineOfWondrousPower') {
      const marble = findChildEvent(figurine, 'treasureFigurineMarbleElephant');
      return emphasizeInlineText(
        figurineSentence(figurine.event.result, marble),
        'Figurine of Wondrous Power'
      );
    }
    const girdle = findChildEvent(miscMagicE3, 'treasureGirdleOfGiantStrength');
    if (girdle && girdle.event.kind === 'treasureGirdleOfGiantStrength') {
      const text = girdleSentence(girdle.event.result);
      return emphasizeInlineText(text, text.slice('There is a '.length, -1));
    }
    const instrument = findChildEvent(
      miscMagicE3,
      'treasureInstrumentOfTheBards'
    );
    if (
      instrument &&
      instrument.event.kind === 'treasureInstrumentOfTheBards'
    ) {
      const text = instrumentOfTheBardsSentence(instrument.event.result);
      return emphasizeInlineText(text, extractLeadingItemPhrase(text));
    }
    const ironFlask = findChildEvent(miscMagicE3, 'treasureIronFlask');
    if (ironFlask && ironFlask.event.kind === 'treasureIronFlask') {
      return emphasizeInlineText(
        ironFlaskSentence(ironFlask.event.result),
        'Iron Flask'
      );
    }
    const iounStones = findIounStonesEvent(outcome);
    if (iounStones) return { text: '' };
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
      const text = hornSentence({
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
      return emphasizeInlineText(text, extractLeadingItemPhrase(text));
    }
    const text = miscMagicE3Sentence(
      miscMagicE3.event.result,
      miscMagicE3.event.ointmentJars
    );
    return emphasizeInlineText(text, extractLeadingItemPhrase(text));
  }
  const miscMagicE4 = findChildEvent(magic, 'treasureMiscMagicE4');
  if (miscMagicE4 && miscMagicE4.event.kind === 'treasureMiscMagicE4') {
    const manual = findChildEvent(miscMagicE4, 'treasureManualOfGolems');
    if (manual && manual.event.kind === 'treasureManualOfGolems') {
      const text = manualOfGolemsSentence(manual.event.result);
      return emphasizeInlineText(text, text.slice('There is a '.length, -1));
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
      return emphasizeInlineText(
        `${base.slice(0, -1)} (${suffix}).`,
        extractLeadingItemPhrase(base)
      );
    }
    const necklace = findChildEvent(miscMagicE4, 'treasureNecklaceOfMissiles');
    if (
      necklace &&
      necklace.event.kind === 'treasureNecklaceOfMissiles' &&
      miscMagicE4.event.result === TreasureMiscMagicE4.NecklaceOfMissiles
    ) {
      const base = miscMagicE4Sentence(miscMagicE4.event.result);
      const suffix = necklaceOfMissilesParenthetical(necklace.event.result);
      return emphasizeInlineText(
        `${base.slice(0, -1)} (${suffix}).`,
        extractLeadingItemPhrase(base)
      );
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
      const suffix = pearlParenthetical(pearlEffect.event.result, recallResult);
      return emphasizeInlineText(
        `${base.slice(0, -1)} (${suffix}).`,
        extractLeadingItemPhrase(base)
      );
    }
    const pearlWisdom = findChildEvent(miscMagicE4, 'treasurePearlOfWisdom');
    if (
      pearlWisdom &&
      pearlWisdom.event.kind === 'treasurePearlOfWisdom' &&
      miscMagicE4.event.result === TreasureMiscMagicE4.PearlOfWisdom
    ) {
      const base = miscMagicE4Sentence(miscMagicE4.event.result);
      const suffix = pearlOfWisdomParenthetical(pearlWisdom.event.result);
      return emphasizeInlineText(
        `${base.slice(0, -1)} (${suffix}).`,
        extractLeadingItemPhrase(base)
      );
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
      const suffix = periaptPoisonParenthetical(periaptPoison.event.result);
      return emphasizeInlineText(
        `${base.slice(0, -1)} (${suffix}).`,
        extractLeadingItemPhrase(base)
      );
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
      return emphasizeInlineText(
        `${base.slice(0, -1)} (${suffix}).`,
        extractLeadingItemPhrase(base)
      );
    }
    const quaalToken = findChildEvent(miscMagicE4, 'treasureQuaalFeatherToken');
    if (
      quaalToken &&
      quaalToken.event.kind === 'treasureQuaalFeatherToken' &&
      miscMagicE4.event.result === TreasureMiscMagicE4.QuaalsFeatherToken
    ) {
      const base = miscMagicE4Sentence(miscMagicE4.event.result);
      const suffix = quaalFeatherTokenParenthetical(quaalToken.event.result);
      return emphasizeInlineText(
        `${base.slice(0, -1)} (${suffix}).`,
        extractLeadingItemPhrase(base)
      );
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
      return emphasizeInlineText(
        miscMagicE4Sentence(miscMagicE4.event.result),
        extractLeadingItemPhrase(miscMagicE4Sentence(miscMagicE4.event.result))
      );
    }
    const text = miscMagicE4Sentence(miscMagicE4.event.result);
    return emphasizeInlineText(text, extractLeadingItemPhrase(text));
  }
  const miscMagicE5 = findChildEvent(magic, 'treasureMiscMagicE5');
  if (miscMagicE5 && miscMagicE5.event.kind === 'treasureMiscMagicE5') {
    if (miscMagicE5.event.result === TreasureMiscMagicE5.RobeOfUsefulItems) {
      const robeItems = findRobeOfUsefulItemsEvent(outcome);
      if (robeItems) return { text: '' };
    }
    const robeChild = findChildEvent(miscMagicE5, 'treasureRobeOfTheArchmagi');
    const robeAlignment =
      robeChild && robeChild.event.kind === 'treasureRobeOfTheArchmagi'
        ? robeChild.event.result
        : undefined;
    const scarabCurse = findChildEvent(
      miscMagicE5,
      'treasureScarabOfProtectionCurse'
    );
    const scarabCurseResult =
      scarabCurse &&
      scarabCurse.event.kind === 'treasureScarabOfProtectionCurse'
        ? scarabCurse.event.result
        : undefined;
    const scarabResolution = scarabCurse
      ? findChildEvent(scarabCurse, 'treasureScarabOfProtectionCurseResolution')
      : undefined;
    const scarabResolutionResult =
      scarabResolution &&
      scarabResolution.event.kind ===
        'treasureScarabOfProtectionCurseResolution'
        ? scarabResolution.event.result
        : undefined;
    const text = miscMagicE5Sentence(
      miscMagicE5.event.result,
      robeAlignment,
      scarabCurseResult,
      scarabResolutionResult
    );
    return emphasizeInlineText(text, extractLeadingItemPhrase(text));
  }
  return undefined;
}

export function collectTreasureCompactInlineTexts(
  node: OutcomeEventNode
): InlineText[] {
  const summaries: InlineText[] = [];
  const visited = new Set<OutcomeEventNode>();
  const visit = (current: OutcomeEventNode): void => {
    if (visited.has(current)) return;
    visited.add(current);
    if (current.event.kind === 'treasure') {
      const summary = summarizeTreasureCompact(current);
      if (summary.text.length > 0) summaries.push(summary);
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

function findSwordsEvent(node: OutcomeEventNode): OutcomeEventNode | undefined {
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

function findDragonSlayerColorEvent(
  node: OutcomeEventNode
): OutcomeEventNode | undefined {
  if (node.event.kind === 'treasureSwordDragonSlayerColor') {
    return node;
  }
  const children = node.children || [];
  for (const child of children) {
    if (child.type !== 'event') continue;
    const match = findDragonSlayerColorEvent(child);
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
      return quantifiedDescription(entry);
    case TreasureWithoutMonster.GemsPerLevel:
      return gemDescription(entry);
    case TreasureWithoutMonster.JewelryPerLevel:
      return jewelryDescription(entry);
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

function gemDescription(entry: TreasureEntry): TreasureDescription {
  const lots = entry.gems;
  if (!lots || lots.length === 0) {
    return quantifiedDescription(entry);
  }
  const heading = entry.display?.trim() ?? 'Gems';
  const detail = lots.map((lot) => gemLotSentence(lot)).join(' ');
  return {
    label: heading,
    detail,
    compact: detail,
  };
}

function gemLotSentence(lot: TreasureGemLot): string {
  const typeLabel = formatGemLotType(lot);
  const countText = `${lot.count.toLocaleString()} ${typeLabel}`;
  const extraDetails = gemLotDetail(lot);
  const valueText = formatGemValue(lot.value);
  const adjustmentText = describeGemAdjustment(lot.adjustment);
  const verb = lot.count === 1 ? 'is' : 'are';
  const eachSuffix = lot.count === 1 ? '' : ' each';
  const parts = [
    `There ${verb} ${countText}${extraDetails} worth ${valueText}${eachSuffix}`,
  ];
  if (adjustmentText) {
    parts.push(`(${adjustmentText})`);
  }
  return `${parts.join(' ')}.`;
}

function gemLotDetail(lot: TreasureGemLot): string {
  const details: string[] = [];
  if (lot.size) {
    details.push(lot.size);
  }
  if (lot.kind) {
    details.push(describeGemKind(lot.kind));
  }
  if (details.length === 0) {
    return '';
  }
  return ` (${details.join('; ')})`;
}

function describeGemKind(kind: TreasureGemKind): string {
  const name = kind.name.toLowerCase();
  const property = kind.property;
  const base = `${property} ${name}`;
  if (!kind.description) {
    return base;
  }
  return `${base} — ${kind.description}`;
}

function formatGemLotType(lot: TreasureGemLot): string {
  const base = lot.category.description.toLowerCase();
  if (lot.count === 1) {
    return base
      .replace(/\bstones\b/gi, 'stone')
      .replace(/\bgems\b/gi, 'gem')
      .replace(/\bjewels\b/gi, 'jewel');
  }
  return base;
}

function describeGemAdjustment(
  adjustment: TreasureGemValueAdjustment
): string | undefined {
  switch (adjustment.type) {
    case 'stepIncrease':
      return adjustment.steps === 1
        ? '1 step larger than typical'
        : `${adjustment.steps} steps larger than typical`;
    case 'stepDecrease':
      return adjustment.steps === 1
        ? '1 step smaller than typical'
        : `${adjustment.steps} steps smaller than typical`;
    case 'double':
      return 'double base value';
    case 'increasePercent':
      return `+${adjustment.percent}%`;
    case 'decreasePercent':
      return `-${adjustment.percent}%`;
    default:
      return undefined;
  }
}

function formatGemValue(value: number): string {
  if (value < 1) {
    const spValue = value * 10;
    if (Math.abs(spValue - Math.round(spValue)) < 0.0001) {
      return `${Math.round(spValue).toLocaleString()} sp`;
    }
  }
  return `${formatNumber(value)} gp`;
}

function formatNumber(value: number): string {
  if (Number.isInteger(value)) {
    return value.toLocaleString();
  }
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function jewelryDescription(entry: TreasureEntry): TreasureDescription {
  const pieces = entry.jewelry;
  if (!pieces || pieces.length === 0) {
    return quantifiedDescription(entry);
  }
  const heading = entry.display?.trim() ?? 'Jewelry';
  const detail = pieces.map((piece) => jewelrySentence(piece)).join(' ');
  return {
    label: heading,
    detail,
    compact: detail,
  };
}

function jewelrySentence(piece: TreasureJewelryPiece): string {
  const article = isVowelSound(piece.type) ? 'an' : 'a';
  let phrase = `${article} ${piece.type}`;
  if (piece.exceptionalQuality) {
    phrase += ' of exceptional workmanship';
  }
  phrase += ` made of ${piece.material}`;
  if (piece.exceptionalStone) {
    phrase += ' set with an exceptional stone';
  }
  const valueText = `${piece.value.toLocaleString()} gp`;
  return `There is ${phrase} (${valueText}).`;
}

function isVowelSound(word: string): boolean {
  return /^[aeiou]/i.test(word);
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
