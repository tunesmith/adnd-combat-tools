import {
  CircularContents,
  circularContents,
  UnusualShape,
  unusualShape,
} from "../../tables/dungeon/unusualShape";
import { Pool, pool } from "../../tables/dungeon/pool";
import {
  MagicPool,
  magicPool,
  PoolAlignment,
  poolAlignment,
  TransmuteType,
  transmuteType,
  TransporterLocation,
  transporterLocation,
} from "../../tables/dungeon/magicPool";
import { getTableEntry, rollDice } from "../helpers/dungeonLookup";
import { DungeonMessage, DungeonTablePreview } from "../../types/dungeon";

export const unusualShapeResult = (): string => {
  const roll = rollDice(unusualShape.sides);
  const command = getTableEntry(roll, unusualShape);
  console.log(`unusualShape roll: ${roll} is ${UnusualShape[command]}`);
  switch (command) {
    case UnusualShape.Circular:
      return "It is circular. " + circularContentsResult();
    case UnusualShape.Triangular:
      return "It is triangular. ";
    case UnusualShape.Trapezoidal:
      return "It is trapezoidal. ";
    case UnusualShape.OddShaped:
      return "It is odd-shaped. (Draw what shape you desire or what will fit the map -- it is a special shape if desired.) ";
    case UnusualShape.Oval:
      return "It is oval-shaped. ";
    case UnusualShape.Hexagonal:
      return "It is hexagonal. ";
    case UnusualShape.Octagonal:
      return "It is octagonal. ";
    case UnusualShape.Cave:
      return "It is actually a cave. ";
  }
};

export const circularContentsResult = (): string => {
  const roll = rollDice(circularContents.sides);
  const command = getTableEntry(roll, circularContents);
  console.log(`circularContents roll: ${roll} is ${CircularContents[command]}`);
  switch (command) {
    case CircularContents.Pool:
      return circularShapePoolResult();
    case CircularContents.Well:
      return "There is a well. ";
    case CircularContents.Shaft:
      return "There is a shaft. ";
    case CircularContents.Normal:
      return "";
  }
};

export const circularShapePoolResult = (): string => {
  const roll = rollDice(pool.sides);
  const command = getTableEntry(roll, pool);
  console.log(`circularShapePool roll: ${roll} is ${Pool[command]}`);
  switch (command) {
    case Pool.NoPool:
      return "";
    case Pool.PoolNoMonster:
      return "There is a pool. ";
    case Pool.PoolMonster:
      return "There is a pool. There is a monster in the pool. (TODO Monster) ";
    case Pool.PoolMonsterTreasure:
      return "There is a pool. There is a monster and treasure in the pool. (TODO Monster Treasure) ";
    case Pool.MagicPool:
      return (
        "There is a pool. It is a magical pool. (In order to find out what it is, characters must enter the magic pool.) " +
        circularShapeMagicPoolResult()
      );
  }
};

export const circularShapeMagicPoolResult = (): string => {
  const roll = rollDice(magicPool.sides);
  const command = getTableEntry(roll, magicPool);
  console.log(`circularShapeMagicPool roll: ${roll} is ${MagicPool[command]}`);
  switch (command) {
    case MagicPool.TransmuteGold:
      return transmuteResult();
    case MagicPool.AlterCharacteristic:
      return "It will, on a one-time only basis, add (1--3) or subtract (4--6) 1--3 points from one characteristic of all who stand within it: (d6) 1-STR, 2-INT, 3-WIS, 4-DEX, 5-CON, 6-CHA. Roll chances, amount, and characteristic separately for each character. ";
    case MagicPool.WishOrDamage:
      return (
        "It is a talking pool, and will grant one wish to characters of its alignment, and damage others for 1--20 points. Wish can be withheld for up to 1 day. " +
        poolAlignmentResult()
      );
    case MagicPool.Transporter:
      return transporterLocationResult();
  }
};

export const transmuteResult = (): string => {
  const roll = rollDice(transmuteType.sides);
  const command = getTableEntry(roll, transmuteType);
  console.log(`transmuteType roll: ${roll} is ${TransmuteType[command]}`);
  switch (command) {
    case TransmuteType.GoldToPlatinum:
      return "It will turn gold to platinum, one time only. ";
    case TransmuteType.GoldToLead:
      return "It will turn gold to lead, one time only. ";
  }
};

export const poolAlignmentResult = (): string => {
  const roll = rollDice(poolAlignment.sides);
  const command = getTableEntry(roll, poolAlignment);
  console.log(`poolAlignment roll: ${roll} is ${PoolAlignment[command]}`);
  switch (command) {
    case PoolAlignment.LawfulGood:
      return "It is Lawful Good. ";
    case PoolAlignment.LawfulEvil:
      return "It is Lawful Evil. ";
    case PoolAlignment.ChaoticGood:
      return "It is Chaotic Good. ";
    case PoolAlignment.ChaoticEvil:
      return "It is Chaotic Evil. ";
    case PoolAlignment.Neutral:
      return "It is Neutral. ";
  }
};

export const transporterLocationResult = (): string => {
  const roll = rollDice(transporterLocation.sides);
  const command = getTableEntry(roll, transporterLocation);
  console.log(
    `transporterLocation roll: ${roll} is ${TransporterLocation[command]}`
  );
  switch (command) {
    case TransporterLocation.Surface:
      return "It transports characters back to the surface. ";
    case TransporterLocation.SameLevelElsewhere:
      return "It transports characters elsewhere on the same level. ";
    case TransporterLocation.OneLevelDown:
      return "It transports characters one level down. ";
    case TransporterLocation.Away100Miles:
      return "It transports characters 100 miles away for outdoor adventure. ";
  }
};

// Typed wrappers (detail-mode previews) for Unusual Shape and immediate subtables
export const unusualShapeMessages = (options?: {
  roll?: number;
  detailMode?: boolean;
}): {
  usedRoll?: number;
  messages: (DungeonMessage | DungeonTablePreview)[];
} => {
  if (options?.detailMode && options.roll === undefined) {
    const preview: DungeonTablePreview = {
      kind: "table-preview",
      id: "unusualShape",
      title: "Unusual Shape",
      sides: unusualShape.sides,
      entries: unusualShape.entries.map((e) => ({
        range:
          e.range.length === 1
            ? `${e.range[0]}`
            : `${e.range[0]}–${e.range[e.range.length - 1]}`,
        label: UnusualShape[e.command] ?? String(e.command),
      })),
    };
    return { usedRoll: undefined, messages: [preview] };
  }
  const usedRoll = options?.roll ?? rollDice(unusualShape.sides);
  const command = getTableEntry(usedRoll, unusualShape);
  let text: string = "";
  switch (command) {
    case UnusualShape.Circular:
      text = "It is circular. ";
      break;
    case UnusualShape.Triangular:
      text = "It is triangular. ";
      break;
    case UnusualShape.Trapezoidal:
      text = "It is trapezoidal. ";
      break;
    case UnusualShape.OddShaped:
      text =
        "It is odd-shaped. (Draw what shape you desire or what will fit the map -- it is a special shape if desired.) ";
      break;
    case UnusualShape.Oval:
      text = "It is oval-shaped. ";
      break;
    case UnusualShape.Hexagonal:
      text = "It is hexagonal. ";
      break;
    case UnusualShape.Octagonal:
      text = "It is octagonal. ";
      break;
    case UnusualShape.Cave:
      text = "It is actually a cave. ";
      break;
  }
  const messages: (DungeonMessage | DungeonTablePreview)[] = [
    { kind: "heading", level: 4, text: "Unusual Shape" },
    {
      kind: "bullet-list",
      items: [`roll: ${usedRoll} — ${UnusualShape[command]}`],
    },
    { kind: "paragraph", text },
  ];
  if (options?.detailMode && command === UnusualShape.Circular) {
    const preview = circularContentsMessages({ detailMode: true } as any);
    for (const m of preview.messages) messages.push(m);
  }
  return { usedRoll, messages };
};

export const circularContentsMessages = (options?: {
  roll?: number;
  detailMode?: boolean;
}): {
  usedRoll?: number;
  messages: (DungeonMessage | DungeonTablePreview)[];
} => {
  if (options?.detailMode && options.roll === undefined) {
    const preview: DungeonTablePreview = {
      kind: "table-preview",
      id: "circularContents",
      title: "Circular Contents",
      sides: circularContents.sides,
      entries: circularContents.entries.map((e) => ({
        range:
          e.range.length === 1
            ? `${e.range[0]}`
            : `${e.range[0]}–${e.range[e.range.length - 1]}`,
        label: CircularContents[e.command] ?? String(e.command),
      })),
    };
    return { usedRoll: undefined, messages: [preview] };
  }
  const usedRoll = options?.roll ?? rollDice(circularContents.sides);
  const command = getTableEntry(usedRoll, circularContents);
  let text = "";
  switch (command) {
    case CircularContents.Pool:
      // Defer pool presence until the Pool table resolves
      text = options?.detailMode ? "" : circularShapePoolResult();
      break;
    case CircularContents.Well:
      text = "There is a well. ";
      break;
    case CircularContents.Shaft:
      text = "There is a shaft. ";
      break;
    case CircularContents.Normal:
      text = "";
      break;
  }
  const messages: (DungeonMessage | DungeonTablePreview)[] = [
    { kind: "heading", level: 4, text: "Circular Contents" },
    {
      kind: "bullet-list",
      items: [`roll: ${usedRoll} — ${CircularContents[command]}`],
    },
    { kind: "paragraph", text },
  ];
  if (options?.detailMode && command === CircularContents.Pool) {
    const preview = circularShapePoolMessages({ detailMode: true } as any);
    for (const m of preview.messages) messages.push(m);
  }
  return { usedRoll, messages };
};

export const circularShapePoolMessages = (options?: {
  roll?: number;
  detailMode?: boolean;
}): {
  usedRoll?: number;
  messages: (DungeonMessage | DungeonTablePreview)[];
} => {
  if (options?.detailMode && options.roll === undefined) {
    return {
      usedRoll: undefined,
      messages: [
        {
          kind: "table-preview",
          id: "circularShapePool",
          title: "Pool",
          sides: pool.sides,
          entries: pool.entries.map((e) => ({
            range:
              e.range.length === 1
                ? `${e.range[0]}`
                : `${e.range[0]}–${e.range[e.range.length - 1]}`,
            label: Pool[e.command] ?? String(e.command),
          })),
        },
      ],
    };
  }
  const usedRoll = options?.roll ?? rollDice(pool.sides);
  const command = getTableEntry(usedRoll, pool);
  let text = "";
  switch (command) {
    case Pool.NoPool:
      text = "";
      break;
    case Pool.PoolNoMonster:
      text = "There is a pool. ";
      break;
    case Pool.PoolMonster:
      text = "There is a pool. There is a monster in the pool. (TODO Monster) ";
      break;
    case Pool.PoolMonsterTreasure:
      text =
        "There is a pool. There is a monster and treasure in the pool. (TODO Monster Treasure) ";
      break;
    case Pool.MagicPool:
      text =
        "There is a pool. It is a magical pool. (In order to find out what it is, characters must enter the magic pool.) ";
      break;
  }
  const messages: (DungeonMessage | DungeonTablePreview)[] = [
    { kind: "heading", level: 4, text: "Pool" },
    { kind: "bullet-list", items: [`roll: ${usedRoll} — ${Pool[command]}`] },
    { kind: "paragraph", text },
  ];
  if (options?.detailMode && command === Pool.MagicPool) {
    const preview = circularShapeMagicPoolMessages({ detailMode: true } as any);
    for (const m of preview.messages) messages.push(m);
  }
  return { usedRoll, messages };
};

export const circularShapeMagicPoolMessages = (options?: {
  roll?: number;
  detailMode?: boolean;
}): {
  usedRoll?: number;
  messages: (DungeonMessage | DungeonTablePreview)[];
} => {
  if (options?.detailMode && options.roll === undefined) {
    return {
      usedRoll: undefined,
      messages: [
        {
          kind: "table-preview",
          id: "circularShapeMagicPool",
          title: "Magic Pool Effect",
          sides: magicPool.sides,
          entries: magicPool.entries.map((e) => ({
            range:
              e.range.length === 1
                ? `${e.range[0]}`
                : `${e.range[0]}–${e.range[e.range.length - 1]}`,
            label: MagicPool[e.command] ?? String(e.command),
          })),
        },
      ],
    };
  }
  const usedRoll = options?.roll ?? rollDice(magicPool.sides);
  const command = getTableEntry(usedRoll, magicPool);
  let text = "";
  const messages: (DungeonMessage | DungeonTablePreview)[] = [
    { kind: "heading", level: 4, text: "Magic Pool Effect" },
    {
      kind: "bullet-list",
      items: [`roll: ${usedRoll} — ${MagicPool[command]}`],
    },
  ];
  switch (command) {
    case MagicPool.TransmuteGold:
      text = "It transmutes gold. ";
      messages.push({ kind: "paragraph", text });
      if (options?.detailMode) {
        const prev = transmuteTypeMessages({ detailMode: true } as any);
        for (const m of prev.messages) messages.push(m);
      } else {
        messages[messages.length - 1] = {
          kind: "paragraph",
          text: text + transmuteResult(),
        } as DungeonMessage;
      }
      break;
    case MagicPool.AlterCharacteristic:
      text =
        "It will, on a one-time only basis, add (1--3) or subtract (4--6) 1--3 points from one characteristic of all who stand within it: (d6) 1-STR, 2-INT, 3-WIS, 4-DEX, 5-CON, 6-CHA. Roll chances, amount, and characteristic separately for each character. ";
      messages.push({ kind: "paragraph", text });
      break;
    case MagicPool.WishOrDamage:
      text =
        "It is a talking pool, and will grant one wish to characters of its alignment, and damage others for 1--20 points. Wish can be withheld for up to 1 day. ";
      messages.push({ kind: "paragraph", text });
      if (options?.detailMode) {
        const prev = poolAlignmentMessages({ detailMode: true } as any);
        for (const m of prev.messages) messages.push(m);
      } else {
        messages[messages.length - 1] = {
          kind: "paragraph",
          text: text + poolAlignmentResult(),
        } as DungeonMessage;
      }
      break;
    case MagicPool.Transporter:
      text = "It is a transporter. ";
      messages.push({ kind: "paragraph", text });
      if (options?.detailMode) {
        const prev = transporterLocationMessages({ detailMode: true } as any);
        for (const m of prev.messages) messages.push(m);
      } else {
        messages[messages.length - 1] = {
          kind: "paragraph",
          text: text + transporterLocationResult(),
        } as DungeonMessage;
      }
      break;
  }
  return { usedRoll, messages };
};

export const transmuteTypeMessages = (options?: {
  roll?: number;
  detailMode?: boolean;
}): {
  usedRoll?: number;
  messages: (DungeonMessage | DungeonTablePreview)[];
} => {
  if (options?.detailMode && options.roll === undefined) {
    return {
      usedRoll: undefined,
      messages: [
        {
          kind: "table-preview",
          id: "transmuteType",
          title: "Transmutation Type",
          sides: transmuteType.sides,
          entries: transmuteType.entries.map((e) => ({
            range:
              e.range.length === 1
                ? `${e.range[0]}`
                : `${e.range[0]}–${e.range[e.range.length - 1]}`,
            label: TransmuteType[e.command] ?? String(e.command),
          })),
        },
      ],
    };
  }
  const usedRoll = options?.roll ?? rollDice(transmuteType.sides);
  const command = getTableEntry(usedRoll, transmuteType);
  const text =
    command === TransmuteType.GoldToPlatinum
      ? "It will turn gold to platinum, one time only. "
      : "It will turn gold to lead, one time only. ";
  return {
    usedRoll,
    messages: [
      { kind: "heading", level: 4, text: "Transmutation Type" },
      {
        kind: "bullet-list",
        items: [`roll: ${usedRoll} — ${TransmuteType[command]}`],
      },
      { kind: "paragraph", text },
    ],
  };
};

export const poolAlignmentMessages = (options?: {
  roll?: number;
  detailMode?: boolean;
}): {
  usedRoll?: number;
  messages: (DungeonMessage | DungeonTablePreview)[];
} => {
  if (options?.detailMode && options.roll === undefined) {
    return {
      usedRoll: undefined,
      messages: [
        {
          kind: "table-preview",
          id: "poolAlignment",
          title: "Pool Alignment",
          sides: poolAlignment.sides,
          entries: poolAlignment.entries.map((e) => ({
            range:
              e.range.length === 1
                ? `${e.range[0]}`
                : `${e.range[0]}–${e.range[e.range.length - 1]}`,
            label: PoolAlignment[e.command] ?? String(e.command),
          })),
        },
      ],
    };
  }
  const usedRoll = options?.roll ?? rollDice(poolAlignment.sides);
  const command = getTableEntry(usedRoll, poolAlignment);
  const text =
    command === PoolAlignment.LawfulGood
      ? "It is Lawful Good. "
      : command === PoolAlignment.LawfulEvil
      ? "It is Lawful Evil. "
      : command === PoolAlignment.ChaoticGood
      ? "It is Chaotic Good. "
      : command === PoolAlignment.ChaoticEvil
      ? "It is Chaotic Evil. "
      : "It is Neutral. ";
  return {
    usedRoll,
    messages: [
      { kind: "heading", level: 4, text: "Pool Alignment" },
      {
        kind: "bullet-list",
        items: [`roll: ${usedRoll} — ${PoolAlignment[command]}`],
      },
      { kind: "paragraph", text },
    ],
  };
};

export const transporterLocationMessages = (options?: {
  roll?: number;
  detailMode?: boolean;
}): {
  usedRoll?: number;
  messages: (DungeonMessage | DungeonTablePreview)[];
} => {
  if (options?.detailMode && options.roll === undefined) {
    return {
      usedRoll: undefined,
      messages: [
        {
          kind: "table-preview",
          id: "transporterLocation",
          title: "Transporter Location",
          sides: transporterLocation.sides,
          entries: transporterLocation.entries.map((e) => ({
            range:
              e.range.length === 1
                ? `${e.range[0]}`
                : `${e.range[0]}–${e.range[e.range.length - 1]}`,
            label: TransporterLocation[e.command] ?? String(e.command),
          })),
        },
      ],
    };
  }
  const usedRoll = options?.roll ?? rollDice(transporterLocation.sides);
  const command = getTableEntry(usedRoll, transporterLocation);
  const text =
    command === TransporterLocation.Surface
      ? "It transports characters back to the surface. "
      : command === TransporterLocation.SameLevelElsewhere
      ? "It transports characters elsewhere on the same level. "
      : command === TransporterLocation.OneLevelDown
      ? "It transports characters one level down. "
      : "It transports characters 100 miles away for outdoor adventure. ";
  return {
    usedRoll,
    messages: [
      { kind: "heading", level: 4, text: "Transporter Location" },
      {
        kind: "bullet-list",
        items: [`roll: ${usedRoll} — ${TransporterLocation[command]}`],
      },
      { kind: "paragraph", text },
    ],
  };
};
