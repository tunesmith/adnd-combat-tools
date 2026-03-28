import {
  renderChamberRoomContentsCompact,
  renderRoomDimensionsCompactInline,
  renderRoomDimensionsCompactNodes,
} from '../../../../../dungeon/features/environment/roomsChambers/roomsChambersRender';
import { renderCircularPoolCompact } from '../../../../../dungeon/features/environment/circularPools/circularPoolsRender';
import type { AppendPreviewFn } from '../../../../../dungeon/adapters/render/shared';
import type { OutcomeEventNode } from '../../../../../dungeon/domain/outcome';
import {
  ChamberRoomContents,
  RoomDimensions,
} from '../../../../../dungeon/features/environment/roomsChambers/roomsChambersTable';
import {
  CircularContents,
  Pool,
} from '../../../../../dungeon/features/environment/circularPools/circularPoolsTable';
import { MonsterTwo } from '../../../../../dungeon/features/monsters/monsterTwo/monsterTwoTable';
import { MonsterLevel } from '../../../../../dungeon/features/monsters/monsterLevel/monsterLevelTable';
import { UnusualShape } from '../../../../../dungeon/features/environment/unusualSpace/unusualSpaceTable';
import { TreasureMagicCategory } from '../../../../../dungeon/features/treasure/magicCategory/magicCategoryTable';
import { TreasureMiscWeapon } from '../../../../../dungeon/features/treasure/miscWeapons/miscWeaponsTable';
import { TreasureWithoutMonster } from '../../../../../dungeon/features/treasure/treasure/treasureTable';
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

  test('unusual room compact inline preserves circular pool emphasis', () => {
    const monsterNode: OutcomeEventNode = {
      type: 'event',
      roll: 34,
      event: {
        kind: 'monsterTwo',
        result: MonsterTwo.ToadGiant_1to4,
        dungeonLevel: 2,
        text: 'There is 1 giant toad. ',
      },
    };

    const miscWeaponNode: OutcomeEventNode = {
      type: 'event',
      roll: 9,
      event: {
        kind: 'treasureMiscWeapons',
        level: 1,
        treasureRoll: 87,
        result: {
          item: TreasureMiscWeapon.BattleAxePlus1,
        },
      },
    };

    const magicNode: OutcomeEventNode = {
      type: 'event',
      roll: 87,
      event: {
        kind: 'treasureMagicCategory',
        result: TreasureMagicCategory.MiscWeapons,
        level: 1,
        treasureRoll: 87,
      },
      children: [miscWeaponNode],
    };

    const treasureNode: OutcomeEventNode = {
      type: 'event',
      roll: 99,
      event: {
        kind: 'treasure',
        level: 1,
        withMonster: false,
        entries: [
          {
            roll: 99,
            command: TreasureWithoutMonster.Magic,
            magicCategory: TreasureMagicCategory.MiscWeapons,
          },
        ],
      },
      children: [magicNode],
    };

    const poolNode: OutcomeEventNode = {
      type: 'event',
      roll: 14,
      event: {
        kind: 'circularPool',
        result: Pool.PoolMonsterTreasure,
      },
      children: [monsterNode, treasureNode],
    };

    const circularContentsNode: OutcomeEventNode = {
      type: 'event',
      roll: 1,
      event: {
        kind: 'circularContents',
        result: CircularContents.Pool,
      },
      children: [poolNode],
    };

    const unusualShapeNode: OutcomeEventNode = {
      type: 'event',
      roll: 1,
      event: {
        kind: 'unusualShape',
        result: UnusualShape.Circular,
      },
      children: [circularContentsNode],
    };

    const roomNode: OutcomeEventNode = {
      type: 'event',
      roll: 20,
      event: {
        kind: 'roomDimensions',
        result: RoomDimensions.Unusual,
      },
      children: [unusualShapeNode],
    };

    const compact = renderRoomDimensionsCompactInline(roomNode);
    const strongSegments =
      compact.inline
        ?.filter((segment) => segment.kind === 'strong')
        .map((segment) => segment.text) ?? [];

    expect(strongSegments).toContain('1 giant toad');
    expect(strongSegments).toContain('Battle axe +1');
  });
});
