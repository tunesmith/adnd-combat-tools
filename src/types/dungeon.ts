export type DungeonAction = "passage" | "door";

export type DungeonParagraph = {
  kind: "paragraph";
  text: string;
};

export type DungeonHeading = {
  kind: "heading";
  level?: 2 | 3 | 4;
  text: string;
};

export type DungeonBulletList = {
  kind: "bullet-list";
  items: string[];
};

export type DungeonMessage = DungeonParagraph | DungeonHeading | DungeonBulletList;

export type RollTraceItem = {
  table: string;
  roll: number;
  result: string;
  children?: RollTraceItem[];
};

export type DungeonRollTrace = {
  kind: "roll-trace";
  items: RollTraceItem[];
};

export type DungeonRenderable = DungeonMessage | DungeonRollTrace;

export type DungeonStep = {
  action: DungeonAction;
  roll?: number;
  messages: DungeonRenderable[];
};
