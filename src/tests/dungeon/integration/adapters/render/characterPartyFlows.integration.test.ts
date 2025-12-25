import { renderChamberRoomContentsCompact } from '../../../../../dungeon/adapters/render/chamberRoomContents';
import { renderRoomDimensionsCompactNodes } from '../../../../../dungeon/adapters/render/roomDimensions';
import { renderCircularPoolCompact } from '../../../../../dungeon/adapters/render/circularPools';
import type { AppendPreviewFn } from '../../../../../dungeon/adapters/render/shared';
import type { OutcomeEventNode } from '../../../../../dungeon/domain/outcome';
import { ChamberRoomContents } from '../../../../../tables/dungeon/chamberRoomContents';
import { RoomDimensions } from '../../../../../tables/dungeon/chambersRooms';
import { Pool } from '../../../../../tables/dungeon/pool';
import { MonsterTwo } from '../../../../../tables/dungeon/monster/monsterTwo';
import { MonsterLevel } from '../../../../../dungeon/features/monsters/monsterLevel/monsterLevelTable';
import type {
  PartyResult,
  CharacterSheet,
} from '../../../../../dungeon/models/character/characterSheet';
import { CharacterClass } from '../../../../../dungeon/models/characterClass';
import { CharacterRace } from '../../../../../tables/dungeon/monster/character/characterRace';
import { Gender } from '../../../../../dungeon/models/character/gender';
import type { Attributes } from '../../../../../dungeon/models/attributes';
import { Alignment } from '../../../../../dungeon/models/allowedAlignmentsByClass';

const noopAppend: AppendPreviewFn = () => undefined;

const sampleAttributes: Attributes = {
  STR: 15,
  INT: 12,
  WIS: 11,
  DEX: 13,
  CON: 14,
  CHA: 10,
};

function createSampleParty(): PartyResult {
  const follower: CharacterSheet = {
    professions: [{ level: 2, characterClass: CharacterClass.Cleric }],
    characterRace: CharacterRace.Dwarf,
    attributes: sampleAttributes,
    gender: Gender.Female,
    hitPoints: 9,
    isBard: false,
    bardLevels: {
      [CharacterClass.Fighter]: 0,
      [CharacterClass.Thief]: 0,
      [CharacterClass.Bard]: 0,
    },
    followers: [],
    alignment: Alignment.NeutralGood,
  };

  const leader: CharacterSheet = {
    professions: [{ level: 3, characterClass: CharacterClass.Fighter }],
    characterRace: CharacterRace.Human,
    attributes: sampleAttributes,
    gender: Gender.Male,
    hitPoints: 18,
    isBard: false,
    bardLevels: {
      [CharacterClass.Fighter]: 0,
      [CharacterClass.Thief]: 0,
      [CharacterClass.Bard]: 0,
    },
    followers: [follower],
    alignment: Alignment.LawfulGood,
  };

  return {
    mainCharacters: [leader],
    otherCharacters: [],
    henchmen: true,
  };
}

function createPartyMonsterNode(): OutcomeEventNode {
  const party = createSampleParty();
  const monsterEvent: OutcomeEventNode = {
    type: 'event',
    roll: 46,
    event: {
      kind: 'monsterTwo',
      result: MonsterTwo.Character,
      dungeonLevel: 2,
      party,
    },
  };

  return {
    type: 'event',
    roll: 15,
    event: {
      kind: 'monsterLevel',
      result: MonsterLevel.Two,
      dungeonLevel: 2,
    },
    children: [monsterEvent],
  };
}

describe('character party rendering in non-wandering flows', () => {
  test('chamber contents compact output includes character party message', () => {
    const contentsNode: OutcomeEventNode = {
      type: 'event',
      roll: 13,
      event: {
        kind: 'chamberRoomContents',
        result: ChamberRoomContents.MonsterOnly,
      },
      children: [createPartyMonsterNode()],
    };

    const compactNodes = renderChamberRoomContentsCompact(
      contentsNode,
      noopAppend
    );
    expect(compactNodes.some((node) => node.kind === 'character-party')).toBe(
      true
    );
  });

  test('room dimensions compact nodes include character party message', () => {
    const contentsNode: OutcomeEventNode = {
      type: 'event',
      roll: 13,
      event: {
        kind: 'chamberRoomContents',
        result: ChamberRoomContents.MonsterOnly,
      },
      children: [createPartyMonsterNode()],
    };

    const roomNode: OutcomeEventNode = {
      type: 'event',
      roll: 12,
      event: {
        kind: 'roomDimensions',
        result: RoomDimensions.Rectangular20x30,
      },
      children: [contentsNode],
    };

    const compactNodes = renderRoomDimensionsCompactNodes(roomNode);
    expect(compactNodes.some((node) => node.kind === 'character-party')).toBe(
      true
    );
  });

  test('circular pool compact output includes character party message', () => {
    const poolNode: OutcomeEventNode = {
      type: 'event',
      roll: 12,
      event: {
        kind: 'circularPool',
        result: Pool.PoolMonster,
      },
      children: [createPartyMonsterNode()],
    };

    const compactNodes = renderCircularPoolCompact(poolNode, noopAppend);
    expect(compactNodes.some((node) => node.kind === 'character-party')).toBe(
      true
    );
  });
});
