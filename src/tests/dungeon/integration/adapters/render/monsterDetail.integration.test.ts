import {
  toCompactRender,
  toDetailRender,
} from '../../../../../dungeon/adapters/render';
import type { DungeonRenderNode } from '../../../../../types/dungeon';
import type { OutcomeEventNode } from '../../../../../dungeon/domain/outcome';
import {
  MonsterOne,
  Human,
} from '../../../../../tables/dungeon/monster/monsterOne';
import { MonsterTwo } from '../../../../../tables/dungeon/monster/monsterTwo';
import { MonsterLevel } from '../../../../../tables/dungeon/monster/monsterLevel';
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

  test('monsterLevel produces placeholder when above level six', () => {
    const outcome: OutcomeEventNode = {
      type: 'event',
      roll: 20,
      event: {
        kind: 'monsterLevel',
        result: MonsterLevel.Seven,
        dungeonLevel: 8,
      },
    };

    const detailParagraphs = toDetailRender(outcome).filter(isParagraph);
    expect(detailParagraphs.map((p) => p.text)).toEqual([
      '(TODO: Monster Level Seven preview)',
    ]);

    const compactParagraphs = toCompactRender(outcome).filter(isParagraph);
    expect(compactParagraphs.map((p) => p.text.trim())).toEqual([
      '(TODO: Monster Level Seven preview)',
    ]);
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
