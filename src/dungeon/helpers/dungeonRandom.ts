type DungeonRandomSession = {
  readonly seed: string;
  nextInt: (sides: number) => number;
  nextId: (prefix: string) => string;
};

let activeDungeonRandomSession: DungeonRandomSession | undefined;

function normalizeSeed(seed: string): number {
  const trimmed = seed.trim().toLowerCase();
  if (/^[0-9a-f]+$/.test(trimmed)) {
    const parsed = Number.parseInt(trimmed.slice(-8), 16);
    if (Number.isFinite(parsed)) {
      return parsed >>> 0;
    }
  }

  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = Math.imul(hash ^ seed.charCodeAt(index), 16777619) >>> 0;
  }
  return hash >>> 0;
}

function nextFallbackInt(sides: number): number {
  const normalizedSides =
    Number.isFinite(sides) && sides > 1 ? Math.trunc(sides) : 1;
  return Math.floor(Math.random() * normalizedSides) + 1;
}

function createDungeonSeed(): string {
  const cryptoApi = globalThis.crypto;
  if (cryptoApi && typeof cryptoApi.getRandomValues === 'function') {
    const seedValue = new Uint32Array(1);
    cryptoApi.getRandomValues(seedValue);
    return (seedValue[0] ?? 0).toString(16).padStart(8, '0');
  }

  const fallbackSeed =
    ((Date.now() >>> 0) ^ Math.floor(Math.random() * 0xffffffff)) >>> 0;
  return fallbackSeed.toString(16).padStart(8, '0');
}

export function createDungeonRandomSession(
  seed: string = createDungeonSeed()
): DungeonRandomSession {
  let state = normalizeSeed(seed);
  let idCounter = 0;

  const nextUint32 = (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = Math.imul(state ^ (state >>> 15), state | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return (value ^ (value >>> 14)) >>> 0;
  };

  return {
    seed,
    nextInt: (sides: number) => {
      const normalizedSides =
        Number.isFinite(sides) && sides > 1 ? Math.trunc(sides) : 1;
      return (nextUint32() % normalizedSides) + 1;
    },
    nextId: (prefix: string) => {
      idCounter += 1;
      const normalizedPrefix = prefix.trim() || 'id';
      return `${normalizedPrefix}-${idCounter.toString(
        36
      )}-${nextUint32().toString(36)}`;
    },
  };
}

export function setActiveDungeonRandomSession(
  session: DungeonRandomSession | undefined
): void {
  activeDungeonRandomSession = session;
}

export function withDungeonRandomSession<T>(
  session: DungeonRandomSession | undefined,
  fn: () => T
): T {
  const previousSession = activeDungeonRandomSession;
  activeDungeonRandomSession = session;
  try {
    return fn();
  } finally {
    activeDungeonRandomSession = previousSession;
  }
}

export function nextDungeonRandomInt(sides: number): number {
  return activeDungeonRandomSession
    ? activeDungeonRandomSession.nextInt(sides)
    : nextFallbackInt(sides);
}

export function createDungeonRandomId(prefix: string): string {
  const normalizedPrefix = prefix.trim() || 'id';
  if (activeDungeonRandomSession) {
    return activeDungeonRandomSession.nextId(normalizedPrefix);
  }
  return `${normalizedPrefix}-${Math.random().toString(36).slice(2, 8)}`;
}
