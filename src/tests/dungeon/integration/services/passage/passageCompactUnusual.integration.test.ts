import { passageMessages } from '../../../../../dungeon/services/passageMessages';
import * as dungeonLookup from '../../../../../dungeon/helpers/dungeonLookup';
import type { DungeonRenderNode } from '../../../../../types/dungeon';

function collectParagraphText(messages: DungeonRenderNode[]): string {
  return messages
    .filter(
      (
        node
      ): node is Extract<typeof node, { kind: 'paragraph'; text: string }> =>
        node.kind === 'paragraph'
    )
    .map((node) => node.text.trim())
    .join(' ');
}

describe('Compact passage rendering for unusual chambers', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('auto-resolves exits when starting in compact mode', () => {
    const spy = jest.spyOn(dungeonLookup, 'rollDice');
    spy
      // chamber dimensions -> unusual
      .mockImplementationOnce(() => 18)
      // unusual shape -> triangular
      .mockImplementationOnce(() => 7)
      // unusual size -> 2,700 sq. ft.
      .mockImplementationOnce(() => 12)
      // number of exits -> OneTwo600 (area > 600 => 2 passages)
      .mockImplementationOnce(() => 1)
      // passage exit location #1 -> opposite wall
      .mockImplementationOnce(() => 6)
      // exit direction #1 -> straight ahead
      .mockImplementationOnce(() => 1)
      // exit alternative #1 -> secret door
      .mockImplementationOnce(() => 4)
      // passage exit location #2 -> right wall
      .mockImplementationOnce(() => 13)
      // exit direction #2 -> angles left (17-18)
      .mockImplementationOnce(() => 18)
      // exit alternative #2 -> one-way door
      .mockImplementationOnce(() => 6);

    const { messages } = passageMessages({
      roll: 14,
      detailMode: false,
      level: 1,
    });
    const compactText = collectParagraphText(messages);

    expect(compactText).toContain('It is triangular.');
    expect(compactText).toContain('It is about 2,700 sq. ft.');
    expect(compactText).toContain('TODO treasure.');
    expect(compactText).toContain('There are 2 additional passages');
    expect(compactText).toContain('Passage 1 of 2 is on the opposite wall.');
    expect(compactText).toContain('The passage continues straight ahead.');
    expect(compactText).toContain('Passage 2 of 2 is on the right wall.');
    expect(compactText).toContain('The passage angles 45° to the left.');
    expect(compactText).toContain('If the passage is indicated');

    spy.mockRestore();
  });
});
