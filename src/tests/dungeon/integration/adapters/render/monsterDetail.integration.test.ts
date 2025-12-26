import {
  toCompactRender,
  toDetailRender,
  renderDetailTree,
} from '../../../../../dungeon/adapters/render';
import type { DungeonRenderNode } from '../../../../../types/dungeon';
import type { OutcomeEventNode } from '../../../../../dungeon/domain/outcome';
import {
  MonsterOne,
  Human,
} from '../../../../../dungeon/features/monsters/monsterOne/monsterOneTables';
import { MonsterTwo } from '../../../../../dungeon/features/monsters/monsterTwo/monsterTwoTable';
import { MonsterLevel } from '../../../../../dungeon/features/monsters/monsterLevel/monsterLevelTable';
import { MonsterSeven } from '../../../../../dungeon/features/monsters/monsterSeven/monsterSevenTables';
import { MonsterEight } from '../../../../../dungeon/features/monsters/monsterEight/monsterEightTables';
import {
  MonsterNine,
  DragonNine,
} from '../../../../../dungeon/features/monsters/monsterNine/monsterNineTables';
import { MonsterTen } from '../../../../../dungeon/features/monsters/monsterTen/monsterTenTables';
import { applyResolvedOutcome } from '../../../../../dungeon/helpers/outcomeTree';
import { resolveSequenceWithRolls } from '../../../../support/dungeon/detail-utils';
import type {
  PartyResult,
  CharacterSheet,
} from '../../../../../dungeon/models/character/characterSheet';
import { CharacterClass } from '../../../../../dungeon/models/characterClass';
import { CharacterRace } from '../../../../../tables/dungeon/monster/character/characterRace';
import { Gender } from '../../../../../dungeon/models/character/gender';
import type { Attributes } from '../../../../../dungeon/models/attributes';
import { formatPartyResult } from '../../../../../dungeon/helpers/party/formatPartyResult';
import { Alignment } from '../../../../../dungeon/models/allowedAlignmentsByClass';

const sampleAttributes = {
  STR: 15,
  INT: 12,
  WIS: 11,
  DEX: 13,
  CON: 14,
  CHA: 10,
} as Attributes;

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

function isParagraph(
  node: DungeonRenderNode
): node is Extract<DungeonRenderNode, { kind: 'paragraph'; text: string }> {
  return node.kind === 'paragraph';
}

function isPreview(
  node: DungeonRenderNode
): node is Extract<DungeonRenderNode, { kind: 'table-preview'; id: string }> {
  return node.kind === 'table-preview';
}

function isCharacterParty(
  node: DungeonRenderNode
): node is Extract<DungeonRenderNode, { kind: 'character-party' }> {
  return node.kind === 'character-party';
}

describe('Monster describe helpers', () => {
  test('monsterOne detail and compact reuse text', () => {
    const outcome: OutcomeEventNode = {
      type: 'event',
      roll: 7,
      event: {
        kind: 'monsterOne',
        result: MonsterOne.Orc_7to12,
        dungeonLevel: 1,
        text: 'There are 6 orcs.',
      },
    };
    const detailParagraphs = toDetailRender(outcome).filter(isParagraph);
    expect(detailParagraphs.map((p) => p.text)).toEqual(['There are 6 orcs.']);

    const compactParagraphs = toCompactRender(outcome).filter(isParagraph);
    expect(compactParagraphs.map((p) => p.text.trim())).toEqual([
      'There are 6 orcs.',
    ]);
  });

  test('monsterOne pending child renders preview in both modes', () => {
    const outcome: OutcomeEventNode = {
      type: 'event',
      roll: 34,
      event: {
        kind: 'monsterOne',
        result: MonsterOne.Human,
        dungeonLevel: 1,
        text: undefined,
      },
      children: [
        {
          type: 'pending-roll',
          table: 'human',
          id: 'human:0',
          context: { kind: 'wandering', level: 1 },
        },
      ],
    };

    const detailPreviews = toDetailRender(outcome).filter(isPreview);
    expect(detailPreviews.map((p) => p.id)).toContain('human');

    const compactPreviews = toCompactRender(outcome).filter(isPreview);
    expect(compactPreviews.map((p) => p.id)).toContain('human');
  });

  test('monsterLevel produces no detail when above level ten', () => {
    const aboveTen = (MonsterLevel.Ten + 2) as MonsterLevel;
    const outcome: OutcomeEventNode = {
      type: 'event',
      roll: 20,
      event: {
        kind: 'monsterLevel',
        result: aboveTen,
        dungeonLevel: 11,
      },
    };

    const detailParagraphs = toDetailRender(outcome).filter(isParagraph);
    expect(detailParagraphs.map((p) => p.text)).toEqual([]);

    const compactParagraphs = toCompactRender(outcome).filter(isParagraph);
    expect(compactParagraphs.map((p) => p.text.trim())).toEqual([]);
  });

  test('monsterSeven detail renders text like lower levels', () => {
    const outcome: OutcomeEventNode = {
      type: 'event',
      roll: 42,
      event: {
        kind: 'monsterSeven',
        result: MonsterSeven.BlackPudding,
        dungeonLevel: 7,
        text: 'There is 1 black pudding. ',
      },
    };

    const detailParagraphs = toDetailRender(outcome).filter(isParagraph);
    expect(detailParagraphs.map((p) => p.text.trim())).toContain(
      'There is 1 black pudding.'
    );

    const compactParagraphs = toCompactRender(outcome).filter(isParagraph);
    expect(compactParagraphs.map((p) => p.text.trim())).toContain(
      'There is 1 black pudding.'
    );
  });

  test('monsterEight detail renders text like lower levels', () => {
    const outcome: OutcomeEventNode = {
      type: 'event',
      roll: 73,
      event: {
        kind: 'monsterEight',
        result: MonsterEight.GiantCloud_1to2,
        dungeonLevel: 8,
        text: 'There are 2 cloud giants. ',
      },
    };

    const detailParagraphs = toDetailRender(outcome).filter(isParagraph);
    expect(detailParagraphs.map((p) => p.text.trim())).toContain(
      'There are 2 cloud giants.'
    );

    const compactParagraphs = toCompactRender(outcome).filter(isParagraph);
    expect(compactParagraphs.map((p) => p.text.trim())).toContain(
      'There are 2 cloud giants.'
    );
  });

  test('monsterNine detail renders text like lower levels', () => {
    const outcome: OutcomeEventNode = {
      type: 'event',
      roll: 12,
      event: {
        kind: 'monsterNine',
        result: MonsterNine.GolemStone,
        dungeonLevel: 9,
        text: 'There is 1 stone golem. ',
      },
    };

    const detailParagraphs = toDetailRender(outcome).filter(isParagraph);
    expect(detailParagraphs.map((p) => p.text.trim())).toContain(
      'There is 1 stone golem.'
    );

    const compactParagraphs = toCompactRender(outcome).filter(isParagraph);
    expect(compactParagraphs.map((p) => p.text.trim())).toContain(
      'There is 1 stone golem.'
    );
  });

  test('monsterTen detail renders text like lower levels', () => {
    const outcome: OutcomeEventNode = {
      type: 'event',
      roll: 55,
      event: {
        kind: 'monsterTen',
        result: MonsterTen.Lich,
        dungeonLevel: 10,
        text: 'There is 1 lich. ',
      },
    };

    const detailParagraphs = toDetailRender(outcome).filter(isParagraph);
    expect(detailParagraphs.map((p) => p.text.trim())).toContain(
      'There is 1 lich.'
    );

    const compactParagraphs = toCompactRender(outcome).filter(isParagraph);
    expect(compactParagraphs.map((p) => p.text.trim())).toContain(
      'There is 1 lich.'
    );
  });

  test('dragon subtable results display resolved child text', () => {
    const parent: OutcomeEventNode = {
      type: 'event',
      roll: 81,
      event: {
        kind: 'monsterNine',
        result: MonsterNine.Dragon,
        dungeonLevel: 9,
        text: 'A dragon is indicated. Roll on the dragon subtable for details. ',
      },
      children: [
        {
          type: 'pending-roll',
          id: 'dragonNine',
          table: 'dragonNine',
          context: { kind: 'wandering', level: 9 },
        },
      ],
    };
    const dragonOutcome: OutcomeEventNode = {
      type: 'event',
      roll: 23,
      event: {
        kind: 'dragonNine',
        result: DragonNine.Brass_Ancient_8_Old_6,
        dungeonLevel: 9,
        text: 'There are two brass dragons: one ancient (8 hp/die) and one old (6 hp/die). ',
      },
    };
    const outcome = applyResolvedOutcome(
      parent,
      'dragonNine',
      dragonOutcome
    ) as OutcomeEventNode;

    const parentDetailParagraphs = toDetailRender(outcome).filter(isParagraph);
    expect(parentDetailParagraphs.map((p) => p.text.trim())).toEqual([]);

    const detailParagraphs = renderDetailTree(outcome).filter(isParagraph);
    const detailTexts = detailParagraphs.map((p) => p.text.trim());
    const dragonText =
      'There are two brass dragons: one ancient (8 hp/die) and one old (6 hp/die).';
    expect(detailTexts).toContain(dragonText);
    expect(detailTexts.filter((t) => t === dragonText)).toHaveLength(1);

    const compactParagraphs = toCompactRender(outcome).filter(isParagraph);
    expect(compactParagraphs.map((p) => p.text.trim())).toContain(
      'There are two brass dragons: one ancient (8 hp/die) and one old (6 hp/die).'
    );
  });

  test('dragon reminders appear before roll and de-dupe after resolution', () => {
    const withReminder = resolveSequenceWithRolls([20, 1, 17, 23], 5);
    const reminderText =
      'A younger dragon is indicated. Roll on the younger dragon subtable for details.';
    const reminderParagraphs = renderDetailTree(withReminder).filter(
      isParagraph
    );
    expect(reminderParagraphs.map((p) => p.text.trim())).toContain(
      reminderText
    );

    const withDragon = resolveSequenceWithRolls([20, 1, 17, 23, 1], 5);
    const dragonText =
      'There is 1 young adult black dragon with 4 hit points per die. (Determine the number of hit dice for a dragon as normal.)';
    const dragonParagraphs = renderDetailTree(withDragon).filter(isParagraph);
    const dragonTexts = dragonParagraphs.map((p) => p.text.trim());
    expect(dragonTexts).toContain(dragonText);
    expect(dragonTexts.filter((text) => text === dragonText)).toHaveLength(1);
  });

  test('human parties render structured detail and compact output', () => {
    const party = createSampleParty();

    const outcome: OutcomeEventNode = {
      type: 'event',
      roll: 46,
      event: {
        kind: 'human',
        result: Human.Character,
        dungeonLevel: 1,
        text: formatPartyResult(party),
        party,
      },
    };

    const detailNodes = toDetailRender(outcome);
    const detailParty = detailNodes.find(isCharacterParty);
    expect(detailParty).toBeDefined();
    expect(detailParty?.summary.main.length).toBeGreaterThan(0);
    expect(detailParty?.summary.includesHenchmen).toBe(true);
    expect(detailParty?.display).toBe('detail');

    const compactNodes = toCompactRender(outcome);
    const compactParty = compactNodes.find(isCharacterParty);
    expect(compactParty).toBeDefined();
    expect(compactParty?.summary.main.length).toBeGreaterThan(0);
    expect(compactParty?.summary.includesHenchmen).toBe(true);
    expect(compactParty?.display).toBe('compact');
  });

  test('monsterTwo character parties render structured output', () => {
    const party = createSampleParty();

    const outcome: OutcomeEventNode = {
      type: 'event',
      roll: 23,
      event: {
        kind: 'monsterTwo',
        result: MonsterTwo.Character,
        dungeonLevel: 2,
        text: formatPartyResult(party),
        party,
      },
    };

    const detailNodes = toDetailRender(outcome);
    const detailParty = detailNodes.find(isCharacterParty);
    expect(detailParty).toBeDefined();
    expect(detailParty?.summary.main.length).toBeGreaterThan(0);
    expect(detailParty?.display).toBe('detail');

    const compactNodes = toCompactRender(outcome);
    const compactParty = compactNodes.find(isCharacterParty);
    expect(compactParty).toBeDefined();
    expect(compactParty?.summary.main.length).toBeGreaterThan(0);
    expect(compactParty?.display).toBe('compact');
  });
});
