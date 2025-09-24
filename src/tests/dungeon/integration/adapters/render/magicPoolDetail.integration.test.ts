import {
  toCompactRender,
  toDetailRender,
} from '../../../../../dungeon/adapters/render';
import {
  resolveCircularMagicPool,
  resolveTransporterLocation,
} from '../../../../../dungeon/domain/resolvers';
import type { DungeonRenderNode } from '../../../../../types/dungeon';
import type { OutcomeEventNode } from '../../../../../dungeon/domain/outcome';

function asOutcome(
  node: ReturnType<typeof resolveCircularMagicPool>
): OutcomeEventNode {
  return node as OutcomeEventNode;
}

function buildTransporterOutcome(): OutcomeEventNode {
  const base = asOutcome(resolveCircularMagicPool({ roll: 18 }));
  const location = resolveTransporterLocation({ roll: 14 }) as OutcomeEventNode;
  return {
    ...base,
    children: [location],
  };
}

type ParagraphNode = Extract<
  DungeonRenderNode,
  { kind: 'paragraph'; text: string }
>;

function isParagraph(node: DungeonRenderNode): node is ParagraphNode {
  return node.kind === 'paragraph';
}

function paragraphTexts(nodes: DungeonRenderNode[]): string[] {
  return nodes.filter(isParagraph).map((node) => node.text.trim());
}

describe('Magic pool transporter chain', () => {
  test('toDetailRender includes transporter heading for transporter result', () => {
    const outcome = buildTransporterOutcome();
    const texts = paragraphTexts(toDetailRender(outcome));
    expect(texts).toContain('It is a transporter.');
  });

  test('toCompactRender includes transporter heading for transporter result', () => {
    const outcome = buildTransporterOutcome();
    const texts = paragraphTexts(toCompactRender(outcome));
    expect(texts).toContain('It is a transporter.');
  });
});
