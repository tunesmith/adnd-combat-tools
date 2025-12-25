import ReactDOMServer from 'react-dom/server';
import { renderNode } from '../../../pages/dungeon/index';
import { renderPeriodicCheckCompact } from '../../../dungeon/adapters/render/periodicOutcome';
import { PeriodicCheck } from '../../../tables/dungeon/periodicCheck';
import { MonsterLevel } from '../../../dungeon/features/monsters/monsterLevel/monsterLevelTable';
import { MonsterTwo } from '../../../tables/dungeon/monster/monsterTwo';
import { CharacterClass } from '../../../dungeon/models/characterClass';
import { CharacterRace } from '../../../tables/dungeon/monster/character/characterRace';
import { Alignment } from '../../../dungeon/models/allowedAlignmentsByClass';
import { Gender } from '../../../dungeon/models/character/gender';
import { Attribute } from '../../../dungeon/models/attributes';
import type { Attributes } from '../../../dungeon/models/attributes';
import type {
  PartyResult,
  CharacterSheet,
} from '../../../dungeon/models/character/characterSheet';
import type { OutcomeEventNode } from '../../../dungeon/domain/outcome';
import type { DungeonRenderNode } from '../../../types/dungeon';

const baseAttributes: Attributes = {
  [Attribute.Strength]: 12,
  [Attribute.Intelligence]: 11,
  [Attribute.Wisdom]: 10,
  [Attribute.Dexterity]: 13,
  [Attribute.Constitution]: 12,
  [Attribute.Charisma]: 9,
};

const emptyBardLevels = {
  [CharacterClass.Fighter]: 0,
  [CharacterClass.Thief]: 0,
  [CharacterClass.Bard]: 0,
};

function createFollower(
  nameSuffix: string,
  alignment: Alignment
): CharacterSheet {
  return {
    professions: [{ characterClass: CharacterClass.ManAtArms, level: 0 }],
    characterRace: CharacterRace.Human,
    attributes: { ...baseAttributes },
    gender: nameSuffix === 'A' ? Gender.Male : Gender.Female,
    hitPoints: 4,
    isBard: false,
    bardLevels: { ...emptyBardLevels },
    followers: [],
    alignment,
    isManAtArms: true,
  };
}

function createPartyResult(): PartyResult {
  const followerA = createFollower('A', Alignment.LawfulNeutral);
  const followerB = createFollower('B', Alignment.LawfulNeutral);

  const mainCharacter: CharacterSheet = {
    professions: [{ characterClass: CharacterClass.Fighter, level: 2 }],
    characterRace: CharacterRace.Human,
    attributes: { ...baseAttributes },
    gender: Gender.Male,
    hitPoints: 14,
    isBard: false,
    bardLevels: { ...emptyBardLevels },
    followers: [followerA, followerB],
    alignment: Alignment.LawfulNeutral,
  };

  return {
    mainCharacters: [mainCharacter],
    otherCharacters: [],
    henchmen: false,
  };
}

describe('character party compact rendering', () => {
  test('compact passage summary keeps party formatting separate from text', () => {
    const party = createPartyResult();

    const monsterTwoNode: OutcomeEventNode = {
      type: 'event',
      roll: 46,
      event: {
        kind: 'monsterTwo',
        result: MonsterTwo.Character,
        dungeonLevel: 2,
        party,
      },
    };

    const monsterLevelNode: OutcomeEventNode = {
      type: 'event',
      roll: 17,
      event: {
        kind: 'monsterLevel',
        result: MonsterLevel.Two,
        dungeonLevel: 2,
      },
      children: [monsterTwoNode],
    };

    const periodicNode: OutcomeEventNode = {
      type: 'event',
      roll: 20,
      event: {
        kind: 'periodicCheck',
        result: PeriodicCheck.WanderingMonster,
        level: 2,
        avoidMonster: false,
      },
      children: [monsterLevelNode],
    };

    const nodes = renderPeriodicCheckCompact(periodicNode);
    const paragraph = nodes.find((n) => n.kind === 'paragraph');
    expect(paragraph).toBeDefined();
    expect(
      paragraph && paragraph.kind === 'paragraph' ? paragraph.text : ''
    ).not.toContain('followers:');

    const partyMessage = nodes.find(
      (n): n is Extract<DungeonRenderNode, { kind: 'character-party' }> =>
        n.kind === 'character-party' && n.display === 'compact'
    );
    expect(partyMessage).toBeDefined();
    if (!partyMessage) return;

    const element = renderNode(
      partyMessage,
      0,
      'party-test',
      {},
      (() => undefined) as React.Dispatch<
        React.SetStateAction<Record<string, number | undefined>>
      >,
      (() => undefined) as React.Dispatch<React.SetStateAction<unknown>>,
      true
    );

    const markup = ReactDOMServer.renderToStaticMarkup(element);
    expect(markup).toContain('<ul');
    expect(markup).toContain('<li');
  });
});
