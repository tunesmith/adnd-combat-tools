import type { Table } from './dungeonTypes';

export enum TrickTrap {
  SecretDoor,
  Pit,
  SpikedPit,
  ElevatorRoomOne,
  ElevatorRoomTwo,
  ElevatorRoomMulti,
  SlidingWall,
  OilAndFlame,
  CrushingPit,
  ArrowTrap,
  SpearTrap,
  GasCorridor,
  FallingDoorOrStone,
  IllusionaryWall,
  ChuteDown,
}

export const trickTrap: Table<TrickTrap> = {
  sides: 20,
  entries: [
    { range: [1, 5], command: TrickTrap.SecretDoor },
    { range: [6, 7], command: TrickTrap.Pit },
    { range: [8], command: TrickTrap.SpikedPit },
    { range: [9], command: TrickTrap.ElevatorRoomOne },
    { range: [10], command: TrickTrap.ElevatorRoomTwo },
    { range: [11], command: TrickTrap.ElevatorRoomMulti },
    { range: [12], command: TrickTrap.SlidingWall },
    { range: [13], command: TrickTrap.OilAndFlame },
    { range: [14], command: TrickTrap.CrushingPit },
    { range: [15], command: TrickTrap.ArrowTrap },
    { range: [16], command: TrickTrap.SpearTrap },
    { range: [17], command: TrickTrap.GasCorridor },
    { range: [18], command: TrickTrap.FallingDoorOrStone },
    { range: [19], command: TrickTrap.IllusionaryWall },
    { range: [20], command: TrickTrap.ChuteDown },
  ],
};
