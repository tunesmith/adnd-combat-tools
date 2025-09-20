import {
  resolveMonsterOne,
  resolveMonsterThree,
} from '../../dungeon/domain/resolvers';
import { toDetailRender } from '../../dungeon/adapters/render';
import { runDungeonStep } from '../../dungeon/services/adapters';
import type { DungeonMessage } from '../../types/dungeon';
import * as dungeonLookup from '../../dungeon/helpers/dungeonLookup';

function isParagraph(
  m: DungeonMessage
): m is Extract<DungeonMessage, { kind: 'paragraph'; text: string }> {
  return (m as any).kind === 'paragraph' && typeof (m as any).text === 'string';
}

function compactPassage(roll: number): DungeonMessage[] {
  const step = runDungeonStep('passage', {
    roll,
    detailMode: false,
    level: 1,
  });
  return step.messages as DungeonMessage[];
}

describe('Compact: Wandering Monster (adapter)', () => {
  test('Door Ahead + Level One + Skeletons exact text via controlled RNG', () => {
    const spy = jest.spyOn(dungeonLookup, 'rollDice');
    // Both adapter and legacy roll sequences:
    // periodicCheck (3 => Door), doorLocation (20 => Ahead), monster level (1 => L1), monsterOne (97 => Skeleton), count d4 (3)
    spy
      .mockImplementationOnce(() => 3) // where-from periodicCheck => Door
      .mockImplementationOnce(() => 20) // doorLocation Ahead
      .mockImplementationOnce(() => 1) // monster level table -> Level One
      .mockImplementationOnce(() => 97) // monsterOne -> Skeletons
      .mockImplementationOnce(() => 3); // d4 -> 3
    const messages = compactPassage(20);
    const para = messages.find(isParagraph);
    expect(para).toBeTruthy();
    if (!para) throw new Error('Expected paragraph');
    expect(para.text.trim()).toBe(
      'A door is Ahead. Wandering Monster: There are 3 skeletons.'
    );
    spy.mockRestore();
  });

  test('Door Left -> Ignore + Level One + Fire Beetles exact text via controlled RNG', () => {
    const spy = jest.spyOn(dungeonLookup, 'rollDice');
    // Sequence for both: periodicCheck (3 => Door), doorLocation (1 => Left), periodic recheck (1 => not Door, end),
    // monster level (1 => L1), monsterOne (10 => Fire Beetle bucket), count d4 (2)
    spy
      .mockImplementationOnce(() => 3) // where-from periodicCheck => Door
      .mockImplementationOnce(() => 1) // door left
      .mockImplementationOnce(() => 1) // ignore
      .mockImplementationOnce(() => 1) // level one
      .mockImplementationOnce(() => 10) // fire beetle bucket
      .mockImplementationOnce(() => 2); // d4 -> 2
    const messages = compactPassage(20);
    const para = messages.find(isParagraph);
    expect(para).toBeTruthy();
    if (!para) throw new Error('Expected paragraph');
    expect(para.text.trim()).toBe(
      "A door is to the Left. There are no other doors. The main passage extends -- check again in 30'. Wandering Monster: There are 2 fire beetles."
    );
    spy.mockRestore();
  });

  test('Where-from Passage Turn stages Passage Turns preview (detail)', () => {
    // Roll 11 -> PassageTurn on periodicCheck
    const step = runDungeonStep('passage', {
      roll: 11,
      detailMode: true,
      level: 1,
    });
    const hasPassageTurns = step.messages.some(
      (m: any) => m.kind === 'table-preview' && m.id === 'passageTurns'
    );
    expect(hasPassageTurns).toBe(true);
  });

  test('Monster Level 3: roll 11 (Bugbear) yields bugbears, not ogres', () => {
    // Ensure resolving monsterThree with a specific roll produces matching text
    const spy = jest.spyOn(dungeonLookup, 'rollDice');
    // Force an unrelated ogre roll inside legacy function to expose the bug
    spy.mockImplementation(() => 61); // Ogre range on monsterThree
    const node = resolveMonsterThree({ roll: 11, dungeonLevel: 3 });
    const messages = toDetailRender(node);
    const para = (messages as any[]).find((m) => m.kind === 'paragraph');
    expect(
      para &&
        typeof para.text === 'string' &&
        para.text.toLowerCase().includes('bugbear')
    ).toBe(true);
    spy.mockRestore();
  });

  test('Monster Level 3: Wererat 2–5 rolls plural count', () => {
    // Roll 51 => LycanthropeWererat_2to5; force inner count roll to 1 so total = 2
    const spy = jest.spyOn(dungeonLookup, 'rollDice');
    spy.mockImplementation(() => 1);
    const node = resolveMonsterThree({ roll: 51, dungeonLevel: 3 });
    const messages = toDetailRender(node);
    const para = (messages as any[]).find((m) => m.kind === 'paragraph');
    expect(
      para &&
        typeof para.text === 'string' &&
        para.text.includes('There are 2 wererat lycanthropes')
    ).toBe(true);
    spy.mockRestore();
  });

  test('Monster Level 1: roll 27 at level 1 yields 9–16 halflings (deterministic 9)', () => {
    const spy = jest.spyOn(dungeonLookup, 'rollDice');
    spy.mockImplementation(() => 1); // force 1d8 => 1; 1 + 8 = 9
    const node = resolveMonsterOne({ roll: 27, dungeonLevel: 1 });
    const messages = toDetailRender(node);
    const para = (messages as any[]).find((m) => m.kind === 'paragraph');
    expect(
      para &&
        typeof para.text === 'string' &&
        para.text.includes('There are 9 halflings')
    ).toBe(true);
    spy.mockRestore();
  });
});
