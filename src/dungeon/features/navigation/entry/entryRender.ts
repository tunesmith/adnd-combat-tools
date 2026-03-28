import type {
  DungeonMessage,
  DungeonRenderNode,
  DungeonTablePreview,
  TableContext,
} from '../../../../types/dungeon';
import type { InlineText } from '../../../helpers/inlineContent';
import type { OutcomeEvent, OutcomeEventNode } from '../../../domain/outcome';
import {
  DoorBeyond,
  doorBeyond,
  PeriodicCheck,
  periodicCheck,
} from './entryTable';
import { TrickTrap } from '../../hazards/trickTrap/trickTrapTable';
import type { AppendPreviewFn } from '../../../adapters/render/shared';
import { buildPreview, findChildEvent } from '../../../adapters/render/shared';
import { renderDoorChainCompact } from '../doorChain/doorChainRender';
import { renderPassageWidthCompact } from '../passageWidth/passageWidthRender';
import { describeSidePassage } from '../sidePassage/sidePassageRender';
import { renderPassageTurnCompact } from '../passageTurn/passageTurnRender';
import {
  describeChamberDimensions,
  describeChamberDimensionsInline,
  renderChamberDimensionsCompact,
  renderRoomDimensionsCompactInline,
} from '../../environment/roomsChambers/roomsChambersRender';
import { renderStairsCompactInline } from '../exit/stairsRender';
import { joinSentenceInlineTexts } from '../../../helpers/inlineContent';
import {
  describeMonsterOutcome,
  collectCharacterPartyMessages,
} from '../../monsters/render';
import { renderTrickTrapCompact } from '../../hazards/trickTrap/trickTrapRender';
import { collectTreasureCompactMessages } from '../../treasure/treasure/treasureRender';
import { MonsterLevel } from '../../monsters/monsterLevel/monsterLevelTable';

const DEAD_END_FALLBACK_TEXT =
  'The passage reaches a dead end. Walls left, right, and ahead can each be checked for a 25% chance of a secret door. Characters would still need to roll to detect. ';
const TRICK_TRAP_FALLBACK_TEXT =
  "There is a trick or trap -- check again in 30'. ";
// Stock continuation used after resolving a trick/trap from periodic check
export const PASSAGE_CONTINUES_SUFFIX =
  " The current passage continues, check again in 30'. ";

function periodicBaseTexts(
  result: PeriodicCheck,
  options?: { avoidMonster?: boolean }
): { detail: string; compact: string } {
  const avoidMonster = options?.avoidMonster ?? false;
  switch (result) {
    case PeriodicCheck.ContinueStraight:
      return {
        detail: "Continue straight -- check again in 60'. ",
        compact: "Continue straight -- check again in 60'. ",
      };
    case PeriodicCheck.Door:
      return {
        detail: 'A closed door is indicated.',
        compact: 'A closed door is indicated. ',
      };
    case PeriodicCheck.SidePassage:
      return {
        detail: 'A side passage occurs.',
        compact:
          "A side passage branches. Passages extend -- check again in 30'. ",
      };
    case PeriodicCheck.PassageTurn:
      return {
        detail: 'The passage turns.',
        compact: 'The passage turns. ',
      };
    case PeriodicCheck.Chamber:
      return {
        detail: 'The passage opens into a chamber. ',
        compact: 'The passage opens into a chamber. ',
      };
    case PeriodicCheck.Stairs:
      return {
        detail: 'Stairs are indicated here.',
        compact: 'Stairs are indicated here. ',
      };
    case PeriodicCheck.WanderingMonster:
      return {
        detail: 'A wandering monster is indicated.',
        compact: avoidMonster
          ? 'Wandering Monster (ignored this turn). '
          : 'Wandering Monster: unknown result. ',
      };
    case PeriodicCheck.DeadEnd:
      return {
        detail: DEAD_END_FALLBACK_TEXT,
        compact: DEAD_END_FALLBACK_TEXT,
      };
    case PeriodicCheck.TrickTrap:
      return {
        detail: 'There is a trick or trap here.',
        compact: TRICK_TRAP_FALLBACK_TEXT,
      };
    default:
      return {
        detail: '',
        compact: `Appears from: ${PeriodicCheck[result]}. `,
      };
  }
}

export function renderPeriodicCheckDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  const nodes: DungeonRenderNode[] = [];
  const { event, roll } = outcome;
  if (event.kind !== 'periodicCheck') return nodes;
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 3,
    text: 'Passage',
  };
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [`roll: ${roll} — ${PeriodicCheck[event.result]}`],
  };
  nodes.push(heading, bullet);
  const baseTexts = periodicBaseTexts(event.result);
  if (baseTexts.detail.length > 0) {
    nodes.push({ kind: 'paragraph', text: baseTexts.detail });
  }
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderPeriodicCheckCompact(
  outcome: OutcomeEventNode
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'periodicCheck') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 3,
    text: 'Passage',
  };
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [`roll: ${outcome.roll} — ${PeriodicCheck[outcome.event.result]}`],
  };
  const summary = summarizePeriodicResult(outcome.event.result, outcome, {
    avoidMonster: outcome.event.avoidMonster,
    mode: 'compact',
  });
  const nodes: DungeonRenderNode[] = [
    heading,
    bullet,
    { kind: 'paragraph', text: summary.text, inline: summary.inline },
  ];
  if (summary.nodes) {
    nodes.push(...summary.nodes);
  }
  return nodes;
}

export function renderWanderingWhereFromDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'wanderingWhereFrom') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Where From',
  };
  const label =
    PeriodicCheck[outcome.event.result] ?? String(outcome.event.result);
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [`roll: ${outcome.roll} — ${label}`],
  };
  const detailSummary = summarizePeriodicResult(outcome.event.result, outcome, {
    mode: 'detail',
  });
  const nodes: DungeonRenderNode[] = [heading, bullet];
  if (detailSummary.text.trim().length > 0) {
    nodes.push({
      kind: 'paragraph',
      text: detailSummary.text,
      inline: detailSummary.inline,
    });
  }
  if (detailSummary.nodes) {
    nodes.push(...detailSummary.nodes);
  }
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderWanderingWhereFromCompactNodes(
  outcome: OutcomeEventNode
): DungeonRenderNode[] {
  if (outcome.event.kind !== 'wanderingWhereFrom') return [];
  const heading: DungeonMessage = {
    kind: 'heading',
    level: 4,
    text: 'Where From',
  };
  const label =
    PeriodicCheck[outcome.event.result] ?? String(outcome.event.result);
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [`roll: ${outcome.roll} — ${label}`],
  };
  const summary = summarizePeriodicResult(outcome.event.result, outcome, {
    mode: 'compact',
  });
  const nodes: DungeonRenderNode[] = [heading, bullet];
  if (summary.text.trim().length > 0) {
    nodes.push({
      kind: 'paragraph',
      text: summary.text,
      inline: summary.inline,
    });
  }
  if (summary.nodes) {
    nodes.push(...summary.nodes);
  }
  return nodes;
}

export function buildWanderingWhereFromPreview(
  tableId: string,
  context?: TableContext
): DungeonTablePreview {
  return buildPreview(tableId, {
    title: 'Where From',
    sides: periodicCheck.sides,
    entries: periodicCheck.entries
      .filter((entry) => entry.command !== PeriodicCheck.WanderingMonster)
      .map((entry) => ({
        range: entry.range,
        label: PeriodicCheck[entry.command] ?? String(entry.command),
      })),
    context,
  });
}

export function buildPeriodicCheckPreview(
  tableId: string,
  context?: TableContext
): DungeonTablePreview {
  return buildPreview(tableId, {
    title: 'Periodic Check',
    sides: periodicCheck.sides,
    entries: periodicCheck.entries.map((entry) => ({
      range: entry.range,
      label: PeriodicCheck[entry.command] ?? String(entry.command),
    })),
    context,
  });
}

export function buildDoorBeyondPreview(tableId: string): DungeonTablePreview {
  return buildPreview(tableId, {
    title: 'Door Beyond',
    sides: doorBeyond.sides,
    entries: doorBeyond.entries.map((entry) => ({
      range: entry.range,
      label: DoorBeyond[entry.command] ?? String(entry.command),
    })),
  });
}

export function buildPassageStartMessages(level?: number): DungeonRenderNode[] {
  return [
    { kind: 'heading', level: 3, text: 'Passage' },
    buildPeriodicCheckPreview(
      'periodicCheck',
      level ? { kind: 'wandering', level } : undefined
    ),
  ];
}

export function buildDoorStartMessages(): DungeonRenderNode[] {
  return [
    { kind: 'heading', level: 3, text: 'Door' },
    buildDoorBeyondPreview('doorBeyond'),
  ];
}

type PeriodicSummary = {
  text: string;
  inline?: InlineText['inline'];
  nodes?: DungeonRenderNode[];
};

const MONSTER_LEVEL_KIND: Partial<Record<MonsterLevel, OutcomeEvent['kind']>> =
  {
    [MonsterLevel.One]: 'monsterOne',
    [MonsterLevel.Two]: 'monsterTwo',
    [MonsterLevel.Three]: 'monsterThree',
    [MonsterLevel.Four]: 'monsterFour',
    [MonsterLevel.Five]: 'monsterFive',
    [MonsterLevel.Six]: 'monsterSix',
    [MonsterLevel.Seven]: 'monsterSeven',
    [MonsterLevel.Eight]: 'monsterEight',
    [MonsterLevel.Nine]: 'monsterNine',
    [MonsterLevel.Ten]: 'monsterTen',
  };

type MonsterEncounterSummary = {
  text: string;
  inline?: InlineText['inline'];
  nodes?: DungeonRenderNode[];
};

function formatWanderingMonsterText(encounterText: string): string {
  const suffix = encounterText.trim();
  const rawText =
    suffix.length > 0 ? `Wandering Monster: ${suffix}` : 'Wandering Monster.';
  return rawText.endsWith(' ') || rawText.endsWith('.')
    ? rawText
    : `${rawText} `;
}

function formatWanderingMonsterSummary(
  encounter: MonsterEncounterSummary
): InlineText {
  const text = formatWanderingMonsterText(encounter.text);
  if (!encounter.inline) {
    return { text };
  }
  return {
    text,
    inline: [
      { kind: 'text', text: 'Wandering Monster: ' },
      ...encounter.inline,
    ],
  };
}

function summarizeMonsterEncounterFromMonsterLevelNode(
  levelNode?: OutcomeEventNode
): MonsterEncounterSummary {
  if (!levelNode || levelNode.event.kind !== 'monsterLevel') {
    return { text: '' };
  }
  return summarizeMonsterEncounterFromLevelNode(levelNode);
}

function summarizeMonsterEncounterFromLevelNode(
  node: OutcomeEventNode
): MonsterEncounterSummary {
  if (node.event.kind !== 'monsterLevel') {
    return { text: '' };
  }
  const mapping = MONSTER_LEVEL_KIND[node.event.result];
  if (!mapping) {
    return { text: '' };
  }
  const monsterNode = findChildEvent(node, mapping);
  if (!monsterNode) {
    return { text: '' };
  }
  const summary = summarizeMonsterEncounterFromMonsterNode(monsterNode);
  if (!summary) {
    return { text: '' };
  }
  return summary;
}

function summarizeMonsterEncounterFromMonsterNode(
  node: OutcomeEventNode
): MonsterEncounterSummary | undefined {
  const description = describeMonsterOutcome(node);
  if (description) {
    if (description.compactMessages && description.compactMessages.length > 0) {
      return {
        text: '',
        nodes: description.compactMessages,
      };
    }
    const compact = description.compactText.trim();
    if (compact.length > 0) {
      return { text: compact, inline: description.compactInline };
    }
  }
  switch (node.event.kind) {
    case 'monsterOne': {
      const humanNode = findChildEvent(node, 'human');
      if (humanNode) return summarizeMonsterEncounterFromMonsterNode(humanNode);
      if (node.event.text) return { text: node.event.text };
      break;
    }
    case 'monsterTwo':
    case 'monsterThree': {
      const dragon = findChildEvent(node, 'dragonThree');
      if (dragon) return summarizeMonsterEncounterFromMonsterNode(dragon);
      break;
    }
    case 'monsterFour': {
      const younger = findChildEvent(node, 'dragonFourYounger');
      if (younger) return summarizeMonsterEncounterFromMonsterNode(younger);
      const older = findChildEvent(node, 'dragonFourOlder');
      if (older) return summarizeMonsterEncounterFromMonsterNode(older);
      break;
    }
    case 'monsterFive': {
      const younger = findChildEvent(node, 'dragonFiveYounger');
      if (younger) return summarizeMonsterEncounterFromMonsterNode(younger);
      const older = findChildEvent(node, 'dragonFiveOlder');
      if (older) return summarizeMonsterEncounterFromMonsterNode(older);
      break;
    }
    case 'monsterSix': {
      const dragon = findChildEvent(node, 'dragonSix');
      if (dragon) return summarizeMonsterEncounterFromMonsterNode(dragon);
      break;
    }
    case 'monsterSeven': {
      const dragon = findChildEvent(node, 'dragonSeven');
      if (dragon) return summarizeMonsterEncounterFromMonsterNode(dragon);
      break;
    }
    case 'monsterEight': {
      const dragon = findChildEvent(node, 'dragonEight');
      if (dragon) return summarizeMonsterEncounterFromMonsterNode(dragon);
      break;
    }
    case 'monsterNine': {
      const dragon = findChildEvent(node, 'dragonNine');
      if (dragon) return summarizeMonsterEncounterFromMonsterNode(dragon);
      break;
    }
    case 'monsterTen': {
      const dragon = findChildEvent(node, 'dragonTen');
      if (dragon) return summarizeMonsterEncounterFromMonsterNode(dragon);
      break;
    }
    case 'dragonThree':
    case 'dragonFourYounger':
    case 'dragonFourOlder':
    case 'dragonFiveYounger':
    case 'dragonFiveOlder':
    case 'dragonSix':
    case 'dragonSeven':
    case 'dragonEight':
    case 'dragonNine':
    case 'dragonTen':
    case 'human':
      if (node.event.text) return { text: node.event.text };
      break;
    default:
      break;
  }
  return undefined;
}

function summarizePeriodicResult(
  result: PeriodicCheck,
  node: OutcomeEventNode,
  options?: { avoidMonster?: boolean; mode?: 'detail' | 'compact' }
): PeriodicSummary {
  const base = periodicBaseTexts(result, options);
  const mode: 'detail' | 'compact' = options?.mode ?? 'compact';
  switch (result) {
    case PeriodicCheck.Door:
      return {
        text: renderDoorChainCompact(findChildEvent(node, 'doorLocation')),
      };
    case PeriodicCheck.SidePassage: {
      const side = findChildEvent(node, 'sidePassages');
      if (side && side.event.kind === 'sidePassages') {
        const summary = describeSidePassage(side);
        if (summary.compactText.length > 0) {
          return { text: summary.compactText };
        }
      }
      return { text: base.compact };
    }
    case PeriodicCheck.PassageTurn: {
      const turn = findChildEvent(node, 'passageTurns');
      return {
        text: turn ? renderPassageTurnCompact(turn) : base.compact,
      };
    }
    case PeriodicCheck.Chamber: {
      const chamber = findChildEvent(node, 'chamberDimensions');
      const detail = chamber
        ? describeChamberDimensionsInline(chamber)
        : { text: '' };
      const partyMessages = chamber
        ? collectCharacterPartyMessages(chamber, 'compact')
        : [];
      const treasureMessages = chamber
        ? collectTreasureCompactMessages(chamber)
        : [];
      const extraNodes = [
        ...(detail.nodes ?? []),
        ...partyMessages,
        ...treasureMessages,
      ];
      const combined = joinSentenceInlineTexts([base.compact, detail]);
      return {
        ...combined,
        nodes: extraNodes.length > 0 ? extraNodes : undefined,
      };
    }
    case PeriodicCheck.Stairs: {
      const stairs = findChildEvent(node, 'stairs');
      if (!stairs) return { text: base.compact };
      const summary = renderStairsCompactInline(stairs, {
        renderChamberSummary: describeChamberDimensions,
        renderChamberSummaryInline: describeChamberDimensionsInline,
      });
      // If stairs descend into a chamber, include any party/treasure compact messages
      // associated with that chamber so monster/treasure details are not lost.
      const chamber = findChildEvent(stairs, 'chamberDimensions');
      const partyMessages = chamber
        ? collectCharacterPartyMessages(chamber, 'compact')
        : [];
      const treasureMessages = chamber
        ? collectTreasureCompactMessages(chamber)
        : [];
      const extraNodes = [
        ...(summary.nodes ?? []),
        ...partyMessages,
        ...treasureMessages,
      ];
      return {
        ...summary,
        nodes: extraNodes.length > 0 ? extraNodes : undefined,
      };
    }
    case PeriodicCheck.TrickTrap: {
      const trap = findChildEvent(node, 'trickTrap');
      if (!trap) {
        return { text: TRICK_TRAP_FALLBACK_TEXT };
      }
      const trickText = renderTrickTrapCompact(trap);
      if (mode === 'detail') {
        const trapResult =
          trap.event.kind === 'trickTrap' ? trap.event.result : undefined;
        if (trapResult === TrickTrap.IllusionaryWall) {
          return { text: TRICK_TRAP_FALLBACK_TEXT };
        }
        // In detail mode, append continuation when this came from wandering-where-from.
        const detailSuffix =
          node.event.kind === 'wanderingWhereFrom'
            ? PASSAGE_CONTINUES_SUFFIX
            : '';
        return { text: `${trickText.trimEnd()}${detailSuffix}` };
      }
      const chamberNodes: DungeonRenderNode[] = [];
      trap.children?.forEach((child) => {
        if (child.type !== 'event') return;
        if (child.event.kind === 'illusionaryWallNature') {
          const chamber = findChildEvent(child, 'chamberDimensions');
          if (chamber && chamber.type === 'event') {
            chamberNodes.push(...renderChamberDimensionsCompact(chamber));
          }
        }
      });
      let combinedNodes: DungeonRenderNode[] = [];
      if (chamberNodes.length > 0) {
        combinedNodes = chamberNodes;
      } else {
        const partyMessages = collectCharacterPartyMessages(trap, 'compact');
        combinedNodes = partyMessages;
      }
      // When originating from a periodic check (root passage roll), the passage continues 30'.
      const suffix =
        node.event.kind === 'periodicCheck' ||
        node.event.kind === 'wanderingWhereFrom'
          ? PASSAGE_CONTINUES_SUFFIX
          : '';
      const combinedText = suffix
        ? `${trickText.trimEnd()}${suffix}`
        : trickText;
      return {
        text: combinedText,
        nodes: combinedNodes.length > 0 ? combinedNodes : undefined,
      };
    }
    case PeriodicCheck.WanderingMonster: {
      if (node.event.kind !== 'periodicCheck') {
        return { text: base.compact };
      }
      const whereFrom = findChildEvent(node, 'wanderingWhereFrom');
      const prefixSummary =
        whereFrom && whereFrom.event.kind === 'wanderingWhereFrom'
          ? summarizePeriodicResult(whereFrom.event.result, whereFrom, {
              mode: 'compact',
            })
          : { text: '' };
      const monsterLevelNode = findChildEvent(node, 'monsterLevel');
      const encounter = summarizeMonsterEncounterFromMonsterLevelNode(
        monsterLevelNode && monsterLevelNode.event.kind === 'monsterLevel'
          ? monsterLevelNode
          : undefined
      );
      const combinedNodes = [
        ...(prefixSummary.nodes ?? []),
        ...(encounter.nodes ?? []),
      ];
      const combined = joinSentenceInlineTexts([
        prefixSummary,
        formatWanderingMonsterSummary(encounter),
      ]);
      return {
        ...combined,
        nodes: combinedNodes.length > 0 ? combinedNodes : undefined,
      };
    }
    case PeriodicCheck.ContinueStraight:
    case PeriodicCheck.DeadEnd:
      return { text: base.compact };
    default:
      return { text: base.compact };
  }
}

export function renderDoorBeyondDetail(
  outcome: OutcomeEventNode,
  appendPendingPreviews: AppendPreviewFn
): DungeonRenderNode[] {
  const nodes = buildDoorBeyondNodes(outcome);
  if (nodes.length === 0) return nodes;
  appendPendingPreviews(outcome, nodes);
  return nodes;
}

export function renderDoorBeyondCompact(
  outcome: OutcomeEventNode
): DungeonRenderNode[] {
  return buildDoorBeyondNodes(outcome);
}

function buildDoorBeyondNodes(outcome: OutcomeEventNode): DungeonRenderNode[] {
  if (outcome.event.kind !== 'doorBeyond') return [];
  const heading: DungeonMessage = { kind: 'heading', level: 3, text: 'Door' };
  const bullet: DungeonMessage = {
    kind: 'bullet-list',
    items: [`roll: ${outcome.roll} — ${DoorBeyond[outcome.event.result]}`],
  };
  const description = formatDoorBeyond(outcome.event.result, {
    doorAhead: outcome.event.doorAhead ?? false,
  });
  const paragraphs: DungeonRenderNode[] = [];
  if (description.trim().length > 0) {
    paragraphs.push({ kind: 'paragraph', text: description });
  }
  if (
    outcome.event.result === DoorBeyond.ParallelPassageOrCloset &&
    !outcome.event.doorAhead
  ) {
    const width = findChildEvent(outcome, 'passageWidth');
    const widthText = width ? renderPassageWidthCompact(width) : '';
    if (widthText.length > 0) {
      paragraphs.push({ kind: 'paragraph', text: widthText });
    }
  }
  if (
    outcome.event.result === DoorBeyond.PassageStraightAhead ||
    outcome.event.result === DoorBeyond.Passage45AheadBehind ||
    outcome.event.result === DoorBeyond.Passage45BehindAhead
  ) {
    const width = findChildEvent(outcome, 'passageWidth');
    const widthText = width ? renderPassageWidthCompact(width) : '';
    if (widthText.length > 0) {
      paragraphs.push({ kind: 'paragraph', text: widthText });
    }
  }
  if (outcome.event.result === DoorBeyond.Room) {
    const room = findChildEvent(outcome, 'roomDimensions');
    const detail = room
      ? renderRoomDimensionsCompactInline(room)
      : { text: '' };
    if (detail.text.length > 0) {
      paragraphs.push({ kind: 'paragraph', ...detail });
    }
    if (detail.nodes && detail.nodes.length > 0) {
      paragraphs.push(...detail.nodes);
    }
    if (room) {
      const extra = [
        ...collectCharacterPartyMessages(room, 'compact'),
        ...collectTreasureCompactMessages(room),
      ];
      if (extra.length > 0) {
        paragraphs.push(...extra);
      }
    }
  }
  if (outcome.event.result === DoorBeyond.Chamber) {
    const chamber = findChildEvent(outcome, 'chamberDimensions');
    const detail = chamber
      ? describeChamberDimensionsInline(chamber)
      : { text: '' };
    if (detail.text.length > 0) {
      paragraphs.push({ kind: 'paragraph', ...detail });
    }
    if (detail.nodes && detail.nodes.length > 0) {
      paragraphs.push(...detail.nodes);
    }
    if (chamber) {
      const extra = [
        ...collectCharacterPartyMessages(chamber, 'compact'),
        ...collectTreasureCompactMessages(chamber),
      ];
      if (extra.length > 0) {
        paragraphs.push(...extra);
      }
    }
  }
  return [heading, bullet, ...paragraphs];
}

function formatDoorBeyond(
  result: DoorBeyond,
  options?: { doorAhead?: boolean }
): string {
  switch (result) {
    case DoorBeyond.ParallelPassageOrCloset:
      return options?.doorAhead
        ? "Beyond the door is a 10' x 10' room (check contents, treasure). "
        : "Beyond the door is a parallel passage, extending 30' in both directions. ";
    case DoorBeyond.PassageStraightAhead:
      return 'Beyond the door is a passage straight ahead. ';
    case DoorBeyond.Passage45AheadBehind:
      return 'Beyond the door is a passage 45 degrees ahead/behind (ahead in preference to behind). ';
    case DoorBeyond.Passage45BehindAhead:
      return 'Beyond the door is a passage 45 degrees behind/ahead (behind in preference to ahead). ';
    case DoorBeyond.Room:
      return 'Beyond the door is a room. ';
    case DoorBeyond.Chamber:
      return 'Beyond the door is a chamber. ';
    default:
      return '';
  }
}
