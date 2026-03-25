import ReactDOMServer from 'react-dom/server';
import { renderNode } from '../../../pages/dungeon';
import { renderPeriodicCheckCompact } from '../../../dungeon/features/navigation/entry/entryRender';
import { PeriodicCheck } from '../../../dungeon/features/navigation/entry/entryTable';
import { MonsterLevel } from '../../../dungeon/features/monsters/monsterLevel/monsterLevelTable';
import { MonsterTwo } from '../../../dungeon/features/monsters/monsterTwo/monsterTwoTable';
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
import type {
  DungeonRenderNode,
  DungeonTablePreview,
} from '../../../types/dungeon';
import type { Dispatch, SetStateAction } from 'react';

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
      (() => undefined) as Dispatch<
        SetStateAction<Record<string, number | undefined>>
      >,
      (() => undefined) as Dispatch<SetStateAction<unknown>>,
      true
    );

    const markup = ReactDOMServer.renderToStaticMarkup(element);
    expect(markup).toContain('<ul');
    expect(markup).toContain('<li');
  });

  test('table previews render as resolved when they are not pending in the outcome tree', () => {
    const preview: DungeonTablePreview = {
      kind: 'table-preview',
      id: 'doorLocation:0',
      targetId: 'root.periodicCheck.0.doorLocation:0',
      title: 'Door Location',
      sides: 20,
      entries: [
        { range: '1-6', label: 'Left' },
        { range: '7-12', label: 'Right' },
        { range: '13-20', label: 'Ahead' },
      ],
    };

    const element = renderNode(
      preview,
      0,
      'preview-test',
      {},
      (() => undefined) as Dispatch<
        SetStateAction<Record<string, number | undefined>>
      >,
      (() => undefined) as Dispatch<SetStateAction<unknown>>,
      true,
      {},
      (() => undefined) as Dispatch<SetStateAction<Record<string, boolean>>>,
      {},
      (() => undefined) as Dispatch<SetStateAction<Record<string, boolean>>>,
      new Set<string>()
    );

    const markup = ReactDOMServer.renderToStaticMarkup(element);
    expect(markup).toContain('Resolved');
    expect(markup).not.toContain('Pending');
    expect(markup).toContain('Expand to review the full table.');
    expect(markup).not.toContain('1-6');
  });
});
