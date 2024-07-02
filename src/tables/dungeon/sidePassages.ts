import { Table } from "./dungeonTypes";

export enum SidePassages {
  Left90,
  Right90,
  Left45,
  Right45,
  Left135,
  Right135,
  LeftCurve45,
  RightCurve45,
  PassageT,
  PassageY,
  FourWay,
  PassageX,
}
export const sidePassages: Table = {
  sides: 20,
  entries: [
    { range: [1, 2], command: SidePassages.Left90 },
    { range: [3, 4], command: SidePassages.Right90 },
    { range: [5], command: SidePassages.Left45 },
    { range: [6], command: SidePassages.Right45 },
    { range: [7], command: SidePassages.Left135 },
    { range: [8], command: SidePassages.Right135 },
    { range: [9], command: SidePassages.LeftCurve45 },
    { range: [10], command: SidePassages.RightCurve45 },
    { range: [11, 13], command: SidePassages.PassageT },
    { range: [14, 15], command: SidePassages.PassageY },
    { range: [16, 19], command: SidePassages.FourWay },
    { range: [20], command: SidePassages.PassageX },
  ],
};
