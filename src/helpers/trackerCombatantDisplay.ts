import { expandedArmorTypes } from "../tables/armorType";
import { BARD, MONSTER, attackerClassOptions } from "../tables/attackerClass";
import { monsterLevels } from "../tables/combatLevel";
import { weapons } from "../tables/weapon";
import type { TrackerCombatant } from "../types/tracker";

export type TrackerCombatantSide = "party" | "enemy";

interface TrackerCombatantHeaderDisplay {
  name: string;
  detailLines: string[];
}

const NAME_FONT = "700 18px Sura";
const DETAIL_FONT = "700 14px Sura";
const PARTY_MIN_WIDTH = 72;
const ENEMY_MIN_WIDTH = 116;

let measurementCanvas: HTMLCanvasElement | null = null;

const getDefaultCombatantName = (side: TrackerCombatantSide): string =>
  side === "party" ? "Party Member" : "Enemy";

const stripArmorPrefix = (armorDescription: string): string =>
  armorDescription.replace(/^AT \d+ - /, "");

const measureTextWidth = (text: string, font: string): number => {
  if (typeof document === "undefined") {
    return text.length * (font === NAME_FONT ? 10 : 8.5);
  }

  if (!measurementCanvas) {
    measurementCanvas = document.createElement("canvas");
  }

  const context = measurementCanvas.getContext("2d");
  if (!context) {
    return text.length * (font === NAME_FONT ? 10 : 8.5);
  }

  context.font = font;
  return context.measureText(text).width;
};

export const getTrackerCombatantHeaderDisplay = (
  combatant: TrackerCombatant,
  side: TrackerCombatantSide
): TrackerCombatantHeaderDisplay => {
  const name = combatant.name?.trim() || getDefaultCombatantName(side);
  const classLabel =
    attackerClassOptions.find((option) => option.value === combatant.class)
      ?.label || "(No class selected)";
  const monsterLevelLabel = monsterLevels.get(combatant.level)?.label;
  const levelLabel =
    combatant.class === MONSTER ? monsterLevelLabel : `${combatant.level}`;
  const levelPrefix =
    combatant.class === MONSTER ? "HD " : combatant.class === BARD ? "F" : "L";
  const armorLabel = expandedArmorTypes.find(
    (armorProps) => armorProps.key === combatant.armorType
  )?.armorDescription;
  const weaponLabel =
    weapons.get(combatant.weapon)?.name || "(No weapon selected)";

  return {
    name,
    detailLines: [
      levelLabel ? `${classLabel}: ${levelPrefix}${levelLabel}` : classLabel,
      ...(combatant.armorType > 1 && armorLabel
        ? [stripArmorPrefix(armorLabel)]
        : []),
      `AC ${combatant.armorClass}`,
      weaponLabel,
    ],
  };
};

export const getTrackerCombatantHeaderWidth = (
  combatant: TrackerCombatant,
  side: TrackerCombatantSide
): number => {
  const display = getTrackerCombatantHeaderDisplay(combatant, side);
  const widestLine = Math.max(
    measureTextWidth(display.name, NAME_FONT),
    ...display.detailLines.map((line) => measureTextWidth(line, DETAIL_FONT))
  );

  return Math.ceil(
    Math.max(side === "party" ? PARTY_MIN_WIDTH : ENEMY_MIN_WIDTH, widestLine + 2)
  );
};

export const getTrackerCombatantWidestLineWidth = (
  combatant: TrackerCombatant,
  side: TrackerCombatantSide
): number => {
  const display = getTrackerCombatantHeaderDisplay(combatant, side);

  return Math.ceil(
    Math.max(
      measureTextWidth(display.name, NAME_FONT),
      ...display.detailLines.map((line) => measureTextWidth(line, DETAIL_FONT))
    )
  );
};

export const getTrackerCombatantHeaderHeight = (
  combatant: TrackerCombatant,
  side: TrackerCombatantSide
): number => {
  const display = getTrackerCombatantHeaderDisplay(combatant, side);
  const detailLineCount = display.detailLines.length;

  return Math.max(72, 20 + 20 + detailLineCount * 15 + detailLineCount * 2 + 6);
};
