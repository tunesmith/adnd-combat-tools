import type { OutcomeEventNode } from '../../domain/outcome';

export function formatOrdinal(level: number): string {
  const remainder = level % 10;
  const teen = Math.floor(level / 10) % 10 === 1;
  const suffix = teen
    ? 'th'
    : remainder === 1
    ? 'st'
    : remainder === 2
    ? 'nd'
    : remainder === 3
    ? 'rd'
    : 'th';
  return `${level}${suffix}`;
}

export type TreasureMagicContext = {
  level?: number;
  treasureRoll?: number;
  rollIndex?: number;
};

export function readTreasureMagicRegistryContext(
  context?: unknown
): TreasureMagicContext {
  return readTreasureMagicContextFromContext(context) ?? {};
}

export function readTreasureMagicContext(
  context: unknown,
  ancestors: OutcomeEventNode[]
): TreasureMagicContext {
  const direct = readTreasureMagicContextFromContext(context);
  if (direct) return direct;

  let level: number | undefined;
  let treasureRoll: number | undefined;
  let rollIndex: number | undefined;

  for (let index = ancestors.length - 1; index >= 0; index -= 1) {
    const ancestor = ancestors[index];
    if (!ancestor || ancestor.event.kind === undefined) continue;
    const event = ancestor.event as {
      kind: string;
      level?: unknown;
      treasureRoll?: unknown;
      rollIndex?: unknown;
    };

    switch (event.kind) {
      case 'treasure':
      case 'treasureMagicCategory':
      case 'treasurePotion':
      case 'treasureScroll':
      case 'treasureRing':
      case 'treasureArmorShields':
      case 'treasureSwords':
      case 'treasureMiscWeapons': {
        if (level === undefined && typeof event.level === 'number') {
          level = event.level;
        }
        if (
          treasureRoll === undefined &&
          typeof event.treasureRoll === 'number'
        ) {
          treasureRoll = event.treasureRoll;
        }
        if (rollIndex === undefined && typeof event.rollIndex === 'number') {
          rollIndex = event.rollIndex;
        }
        break;
      }
      default:
        break;
    }
  }

  return { level, treasureRoll, rollIndex };
}

function readTreasureMagicContextFromContext(
  context: unknown
): TreasureMagicContext | undefined {
  if (!context || typeof context !== 'object') return undefined;
  const kind = (context as { kind?: unknown }).kind;
  if (kind !== 'treasureMagic') return undefined;
  const raw = context as {
    level?: unknown;
    treasureRoll?: unknown;
    rollIndex?: unknown;
  };
  const level = typeof raw.level === 'number' ? raw.level : undefined;
  const treasureRoll =
    typeof raw.treasureRoll === 'number' ? raw.treasureRoll : undefined;
  const rollIndex =
    typeof raw.rollIndex === 'number' ? raw.rollIndex : undefined;
  return { level, treasureRoll, rollIndex };
}
