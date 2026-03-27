import ReactDOMServer from 'react-dom/server';
import { renderNode } from '../../../pages/dungeon';
import { renderPeriodicCheckCompact } from '../../../dungeon/features/navigation/entry/entryRender';
import { renderTreasurePotionCompact } from '../../../dungeon/features/treasure/potion/potionRender';
import { renderTreasureCompactNodes } from '../../../dungeon/features/treasure/treasure/treasureRender';
import { PeriodicCheck } from '../../../dungeon/features/navigation/entry/entryTable';
import { TreasureWithoutMonster } from '../../../dungeon/features/treasure/treasure/treasureTable';
import { TreasureMagicCategory } from '../../../dungeon/features/treasure/magicCategory/magicCategoryTable';
import { TreasurePotion } from '../../../dungeon/features/treasure/potion/potionTables';
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
  TargetedDungeonTablePreview,
} from '../../../types/dungeon';
import type { PreviewInteractionController } from '../../../components/dungeon/feedTypes';

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

    const element = renderNode(partyMessage, 0, 'party-test');

    const markup = ReactDOMServer.renderToStaticMarkup(element);
    expect(markup).toContain('<ul');
    expect(markup).toContain('<li');
  });

  test('table previews render as resolved when they are not pending in the outcome tree', () => {
    const preview: TargetedDungeonTablePreview = {
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

    const previewController: PreviewInteractionController = {
      overrides: {},
      collapsed: {},
      resolved: {},
      onOverrideChange: () => undefined,
      onResolvePreview: () => undefined,
      onToggleCollapse: () => undefined,
    };

    const element = renderNode(
      preview,
      0,
      'preview-test',
      previewController,
      true,
      new Set<string>()
    );

    const markup = ReactDOMServer.renderToStaticMarkup(element);
    expect(markup).toContain('Resolved');
    expect(markup).not.toContain('Pending');
    expect(markup).toContain('Expand to review the full table.');
    expect(markup).not.toContain('1-6');
  });

  test('roll summary bullet items keep the result label emphasized', () => {
    const bulletList: DungeonRenderNode = {
      kind: 'bullet-list',
      items: ['roll: 12 — PassageTurn'],
    };

    const element = renderNode(bulletList, 0, 'roll-summary-test');
    const markup = ReactDOMServer.renderToStaticMarkup(element);

    expect(markup).toContain('rollSummaryPrefix');
    expect(markup).toContain('rollSummaryOutcome');
    expect(markup).toContain('PassageTurn');
  });

  test('resolved magical item paragraphs emphasize the item name', () => {
    const potionNode: OutcomeEventNode = {
      type: 'event',
      roll: 12,
      event: {
        kind: 'treasurePotion',
        result: TreasurePotion.GaseousForm,
        level: 1,
        treasureRoll: 55,
      },
    };

    const nodes = renderTreasurePotionCompact(potionNode, () => undefined);
    const paragraph = nodes.find(
      (node): node is Extract<DungeonRenderNode, { kind: 'paragraph' }> =>
        node.kind === 'paragraph'
    );

    expect(paragraph?.text).toBe('There is a potion of gaseous form.');

    if (!paragraph) {
      throw new Error('potion paragraph not found');
    }

    const element = renderNode(paragraph, 0, 'potion-inline-test');
    const markup = ReactDOMServer.renderToStaticMarkup(element);

    expect(markup).toContain('messageStrong');
    expect(markup).toContain('potion of gaseous form');
  });

  test('treasure compact summaries preserve inline emphasis for resolved magic', () => {
    const potionNode: OutcomeEventNode = {
      type: 'event',
      roll: 12,
      event: {
        kind: 'treasurePotion',
        result: TreasurePotion.GaseousForm,
        level: 1,
        treasureRoll: 55,
      },
    };

    const magicNode: OutcomeEventNode = {
      type: 'event',
      roll: 55,
      event: {
        kind: 'treasureMagicCategory',
        result: TreasureMagicCategory.Potions,
        level: 1,
        treasureRoll: 55,
      },
      children: [potionNode],
    };

    const treasureNode: OutcomeEventNode = {
      type: 'event',
      roll: 55,
      event: {
        kind: 'treasure',
        level: 1,
        withMonster: false,
        entries: [{ roll: 55, command: TreasureWithoutMonster.Magic }],
      },
      children: [magicNode],
    };

    const nodes = renderTreasureCompactNodes(treasureNode);
    const paragraph = nodes.find(
      (node): node is Extract<DungeonRenderNode, { kind: 'paragraph' }> =>
        node.kind === 'paragraph'
    );

    expect(paragraph?.text).toBe('There is a potion of gaseous form.');

    if (!paragraph) {
      throw new Error('treasure summary paragraph not found');
    }

    const element = renderNode(paragraph, 0, 'treasure-inline-test');
    const markup = ReactDOMServer.renderToStaticMarkup(element);

    expect(markup).toContain('messageStrong');
    expect(markup).toContain('potion of gaseous form');
  });
});
