import { runDungeonStep } from '../../../dungeon/services/adapters';
import * as dungeonLookup from '../../../dungeon/helpers/dungeonLookup';
import type {
  DungeonAction,
  DungeonRenderNode,
  DungeonRollTrace,
  DungeonTablePreview,
  RollTraceItem,
} from '../../../types/dungeon';
import type { DungeonOutcomeNode } from '../../../dungeon/domain/outcome';
import {
  isTableContext,
  normalizeOutcomeTree,
} from '../../../dungeon/helpers/outcomeTree';
import {
  buildRenderCache,
  selectMessagesForMode,
  type RenderCache,
} from '../../../dungeon/helpers/renderCache';
import { applyOutcomeRoll } from '../../../dungeon/helpers/registry';
import type { TableContext } from '../../../types/dungeon';
import type { PartyCharacterSummary } from '../../../dungeon/helpers/party/formatPartyResult';

type RollInput = string | number | number[];

type PendingDescriptor = {
  id: string;
  table: string;
  context?: unknown;
};

type SnapshotEntry = Readonly<DungeonRenderNode>;

type DetailPhase = {
  outcome?: DungeonOutcomeNode;
  pending: PendingDescriptor[];
  detail: RenderSnapshot;
};

type DetailFinalPhase = DetailPhase & {
  compact: RenderSnapshot;
};

export type DetailRunResult = {
  action: DungeonAction;
  rollsUsed: number[];
  initial: DetailPhase;
  final: DetailFinalPhase;
  unusedRolls: number[];
};

export type CompactRunResult = {
  action: DungeonAction;
  rollUsed: number;
  rollsUsed: number[];
  outcome?: DungeonOutcomeNode;
  pending: PendingDescriptor[];
  compact: RenderSnapshot;
  detail: RenderSnapshot;
  unusedRolls: number[];
};

export interface RenderSnapshot {
  nodes: ReadonlyArray<SnapshotEntry>;
  headings(): string[];
  paragraphs(): string[];
  bulletLists(): string[][];
  previewIds(): string[];
  previewTitles(): string[];
  previews(): DungeonTablePreview[];
  findPreview(id: string): DungeonTablePreview | undefined;
  rollTrace(): DungeonRollTrace | undefined;
}

export function parseRollSequence(input: RollInput): number[] {
  if (Array.isArray(input)) {
    return input.map(assertDieRoll);
  }
  if (typeof input === 'number') {
    return [assertDieRoll(input)];
  }
  const trimmed = input.trim();
  if (trimmed.length === 0) return [];
  return trimmed.split(',').map((part) => assertDieRoll(Number(part.trim())));
}

export function simulateDetailRun(options: {
  action: DungeonAction;
  rolls: RollInput;
  dungeonLevel?: number;
  resolveAll?: boolean;
}): DetailRunResult {
  const rolls = parseRollSequence(options.rolls);
  const firstRoll = rolls[0];
  if (firstRoll === undefined) {
    throw new Error('simulateDetailRun requires at least one roll value.');
  }
  const remaining = rolls.slice(1);
  const step = runDungeonStep(options.action, {
    roll: firstRoll,
    detailMode: true,
    level: options.dungeonLevel,
  });
  const initialOutcome = step.outcome
    ? normalizeOutcomeTree(step.outcome)
    : undefined;
  let workingOutcome = initialOutcome;
  const usedRolls: number[] = [];
  if (step.roll !== undefined) {
    usedRolls.push(step.roll);
  } else {
    usedRolls.push(firstRoll);
  }
  const queue = [...remaining];

  while (workingOutcome && queue.length > 0) {
    const pendingList = collectPending(workingOutcome);
    if (pendingList.length === 0) break;
    const pending = pendingList[0];
    if (!pending) break;
    const nextRoll = queue.shift();
    if (nextRoll === undefined) break;
    usedRolls.push(nextRoll);
    const targetId = pending.id ?? pending.table;
    const applied = applyOutcomeRoll({
      outcome: workingOutcome,
      tableId: pending.table,
      targetId,
      roll: nextRoll,
      context: resolveContext(pending.context),
    });
    if (!applied) {
      throw new Error(`No outcome available for table ${pending.table}.`);
    }
    workingOutcome = applied.outcome;
  }

  const finalPending = collectPending(workingOutcome);
  if (options.resolveAll && finalPending.length > 0) {
    throw new Error(
      `Unresolved pending nodes remain: ${finalPending
        .map((p) => p.id)
        .join(', ')}`
    );
  }

  const initialCache: RenderCache = step.renderCache ?? {
    detail: step.messages,
  };
  const finalCache = buildRenderCache(workingOutcome);
  const initialDetailNodes = selectMessagesForMode(
    options.action,
    true,
    initialCache,
    step.messages
  );
  const finalDetailNodes = selectMessagesForMode(
    options.action,
    true,
    finalCache,
    step.messages
  );
  const finalCompactNodes = selectMessagesForMode(
    options.action,
    false,
    finalCache,
    step.messages
  );

  return {
    action: options.action,
    rollsUsed: usedRolls,
    initial: {
      outcome: initialOutcome,
      pending: collectPending(initialOutcome),
      detail: createSnapshot(initialDetailNodes),
    },
    final: {
      outcome: workingOutcome,
      pending: finalPending,
      detail: createSnapshot(finalDetailNodes),
      compact: createSnapshot(finalCompactNodes),
    },
    unusedRolls: [...queue],
  };
}

export function simulateCompactRun(options: {
  action: DungeonAction;
  roll: RollInput;
  dungeonLevel?: number;
}): CompactRunResult {
  const parsedRolls = parseRollSequence(options.roll);
  const rollValue = parsedRolls[0];
  if (rollValue === undefined) {
    throw new Error('simulateCompactRun requires a roll value.');
  }
  const step = runDungeonStep(options.action, {
    roll: rollValue,
    detailMode: false,
    level: options.dungeonLevel,
  });
  const outcome = step.outcome ? normalizeOutcomeTree(step.outcome) : undefined;
  const cache = step.renderCache ?? buildRenderCache(outcome);
  const compactNodes = selectMessagesForMode(
    options.action,
    false,
    cache,
    step.messages
  );
  const detailNodes = selectMessagesForMode(
    options.action,
    true,
    cache,
    step.messages
  );

  const rollsUsed: number[] = [];
  if (step.roll !== undefined) {
    rollsUsed.push(step.roll);
  } else {
    rollsUsed.push(rollValue);
  }
  const rollUsed = rollsUsed[0];
  if (rollUsed === undefined) {
    throw new Error('No roll captured for compact run.');
  }

  return {
    action: options.action,
    rollUsed,
    rollsUsed,
    outcome,
    pending: collectPending(outcome),
    compact: createSnapshot(compactNodes),
    detail: createSnapshot(detailNodes),
    unusedRolls: [],
  };
}

export function simulateCompactRunWithSequence(options: {
  action: DungeonAction;
  rolls: RollInput;
  dungeonLevel?: number;
  allowUnusedRolls?: boolean;
}): CompactRunResult {
  const rolls = parseRollSequence(options.rolls);
  const initialRoll = rolls[0];
  if (initialRoll === undefined) {
    throw new Error(
      'simulateCompactRunWithSequence requires at least one roll.'
    );
  }
  const queued = rolls.slice(1);
  const { result, unused } = executeWithMockedDice(queued, () =>
    simulateCompactRun({
      action: options.action,
      roll: initialRoll,
      dungeonLevel: options.dungeonLevel,
    })
  );
  if (!options.allowUnusedRolls && unused.length > 0) {
    throw new Error(
      `Unused mock rolls remain after compact run: ${unused.join(', ')}`
    );
  }
  return { ...result, unusedRolls: unused };
}

function assertDieRoll(input: number): number {
  if (!Number.isInteger(input) || input <= 0) {
    throw new Error(`Invalid roll value: ${input}`);
  }
  return input;
}

function executeWithMockedDice<T>(
  rolls: number[],
  fn: () => T
): { result: T; unused: number[] } {
  const queue = [...rolls];
  const spy = jest
    .spyOn(dungeonLookup, 'rollDice')
    .mockImplementation((sides: number, count = 1) => {
      let total = 0;
      for (let i = 0; i < count; i += 1) {
        if (queue.length === 0) {
          throw new Error('Ran out of predetermined rolls for rollDice.');
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

function collectPending(outcome?: DungeonOutcomeNode): PendingDescriptor[] {
  if (!outcome) return [];
  const results: PendingDescriptor[] = [];
  const visit = (node: DungeonOutcomeNode) => {
    if (node.type === 'pending-roll') {
      results.push({
        id: node.id ?? node.table,
        table: node.table,
        context: node.context,
      });
      return;
    }
    if (node.children && node.children.length > 0) {
      node.children.forEach(visit);
    }
  };
  visit(outcome);
  return results.sort((a, b) => a.id.localeCompare(b.id));
}

function resolveContext(context: unknown): TableContext | undefined {
  if (isTableContext(context)) return context;
  return undefined;
}

function createSnapshot(nodes: DungeonRenderNode[]): RenderSnapshot {
  const cloned = nodes.map(cloneRenderNode).map(freezeRenderNode);
  const headings = cloned
    .filter(
      (n): n is Extract<DungeonRenderNode, { kind: 'heading' }> =>
        n.kind === 'heading'
    )
    .map((n) => n.text);
  const paragraphs = cloned
    .filter(
      (n): n is Extract<DungeonRenderNode, { kind: 'paragraph' }> =>
        n.kind === 'paragraph'
    )
    .map((n) => n.text);
  const bulletLists = cloned
    .filter(
      (n): n is Extract<DungeonRenderNode, { kind: 'bullet-list' }> =>
        n.kind === 'bullet-list'
    )
    .map((n) => [...n.items]);
  const previews = cloned.filter(
    (n): n is DungeonTablePreview => n.kind === 'table-preview'
  );
  const previewMap = new Map(previews.map((p) => [p.id, p]));
  const trace = cloned.find(
    (n): n is DungeonRollTrace => n.kind === 'roll-trace'
  );

  return {
    nodes: cloned,
    headings: () => [...headings],
    paragraphs: () => [...paragraphs],
    bulletLists: () => bulletLists.map((items) => [...items]),
    previewIds: () => previews.map((p) => p.id),
    previewTitles: () => previews.map((p) => p.title),
    previews: () => previews.map(clonePreview),
    findPreview: (id: string) => {
      const preview = previewMap.get(id);
      return preview ? clonePreview(preview) : undefined;
    },
    rollTrace: () => (trace ? cloneRollTrace(trace) : undefined),
  };
}

function cloneRenderNode(node: DungeonRenderNode): DungeonRenderNode {
  switch (node.kind) {
    case 'heading':
      return { kind: 'heading', level: node.level, text: node.text };
    case 'paragraph':
      return { kind: 'paragraph', text: node.text };
    case 'bullet-list':
      return { kind: 'bullet-list', items: [...node.items] };
    case 'roll-trace':
      return cloneRollTrace(node);
    case 'character-party':
      return {
        kind: 'character-party',
        display: node.display,
        summary: {
          includesHenchmen: node.summary.includesHenchmen,
          main: node.summary.main.map(({ member, followers }) => ({
            member: clonePartyCharacterSummary(member),
            followers: followers.map(clonePartyCharacterSummary),
          })),
        },
      };
    case 'table-preview':
      return {
        kind: 'table-preview',
        id: node.id,
        targetId: node.targetId,
        title: node.title,
        sides: node.sides,
        entries: node.entries.map((entry) => ({ ...entry })),
        context: node.context ? cloneContext(node.context) : undefined,
      };
    default: {
      const exhaustive: never = node;
      return exhaustive;
    }
  }
}

function freezeRenderNode<T extends DungeonRenderNode>(node: T): T {
  if (node.kind === 'bullet-list') {
    Object.freeze(node.items);
  }
  if (node.kind === 'table-preview') {
    node.entries.forEach(Object.freeze);
    if (node.context) {
      freezeContext(node.context);
    }
    Object.freeze(node.entries);
  }
  if (node.kind === 'roll-trace') {
    node.items.forEach(freezeTraceItem);
    Object.freeze(node.items);
  }
  if (node.kind === 'character-party') {
    node.summary.main.forEach((entry) => {
      entry.followers.forEach(freezePartyCharacterSummary);
      Object.freeze(entry.followers);
      freezePartyCharacterSummary(entry.member);
    });
    Object.freeze(node.summary.main);
  }
  return Object.freeze(node);
}

function clonePartyCharacterSummary(
  character: PartyCharacterSummary
): PartyCharacterSummary {
  return {
    alignment: character.alignment,
    gender: character.gender,
    characterRace: character.characterRace,
    hitPoints: character.hitPoints,
    attributes: { ...character.attributes },
    professions: character.professions.map((profession) => ({
      characterClass: profession.characterClass,
      level: profession.level,
    })),
    isBard: character.isBard,
    bardLevels: { ...character.bardLevels },
    isManAtArms: character.isManAtArms,
    magicItems: character.magicItems.map((item) => ({ ...item })),
  };
}

function freezePartyCharacterSummary(character: PartyCharacterSummary): void {
  character.professions.forEach(Object.freeze);
  Object.freeze(character.professions);
  Object.freeze(character.bardLevels);
  Object.freeze(character.attributes);
  character.magicItems.forEach(Object.freeze);
  Object.freeze(character.magicItems);
  Object.freeze(character);
}

function clonePreview(preview: DungeonTablePreview): DungeonTablePreview {
  return {
    kind: 'table-preview',
    id: preview.id,
    targetId: preview.targetId,
    title: preview.title,
    sides: preview.sides,
    entries: preview.entries.map((entry) => ({ ...entry })),
    context: preview.context ? cloneContext(preview.context) : undefined,
  };
}

function cloneContext(context: TableContext): TableContext {
  switch (context.kind) {
    case 'doorChain':
      return { kind: 'doorChain', existing: [...context.existing] };
    case 'wandering':
      return { kind: 'wandering', level: context.level };
    case 'exits':
      return {
        kind: 'exits',
        length: context.length,
        width: context.width,
        isRoom: context.isRoom,
      };
    case 'unusualSize':
      return { kind: 'unusualSize', extra: context.extra };
    default:
      return context;
  }
}

function cloneRollTrace(trace: DungeonRollTrace): DungeonRollTrace {
  const cloneItem = (item: RollTraceItem): RollTraceItem => ({
    table: item.table,
    roll: item.roll,
    result: item.result,
    children: item.children ? item.children.map(cloneItem) : undefined,
  });
  return {
    kind: 'roll-trace',
    items: trace.items.map(cloneItem),
  };
}

function freezeContext(context: TableContext): void {
  switch (context.kind) {
    case 'doorChain':
      Object.freeze(context.existing);
      break;
    default:
      break;
  }
  Object.freeze(context);
}

function freezeTraceItem(item: RollTraceItem): void {
  if (item.children) {
    item.children.forEach(freezeTraceItem);
    Object.freeze(item.children);
  }
  Object.freeze(item);
}
