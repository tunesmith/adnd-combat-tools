import ReactDOMServer from 'react-dom/server';
import { IounStonesDetail } from '../../../components/dungeon/IounStonesDetail';
import { IounStonesCompact } from '../../../components/dungeon/IounStonesCompact';
import type { IounStonesSummary } from '../../../types/dungeon';
import { iounStonesCompactSentence } from '../../../dungeon/features/treasure/miscMagicE3/miscMagicE3SubtablesRender';

describe('IounStones components', () => {
  const summary: IounStonesSummary = {
    count: 3,
    countRoll: 3,
    stones: [
      {
        index: 1,
        color: 'pale blue',
        shape: 'rhomboid',
        effect: 'adds 1 point to strength (18 maximum)',
        status: 'active',
      },
      {
        index: 2,
        color: 'scarlet & blue',
        shape: 'sphere',
        effect: 'adds 1 point to intelligence (18 maximum)',
        status: 'duplicate',
        duplicateOf: 1,
      },
      {
        index: 3,
        color: 'dull gray',
        shape: 'any',
        effect: 'burned out, "dead" stone',
        status: 'dead',
      },
    ],
  };

  it('renders detail markup with stone list', () => {
    const markup = ReactDOMServer.renderToStaticMarkup(
      <IounStonesDetail summary={summary} />
    );
    expect(markup).toContain('There are 3 ioun stones');
    expect(markup).toContain('Stone 2');
    expect(markup).toContain('scarlet &amp; blue sphere');
  });

  it('renders compact markup summary', () => {
    const markup = ReactDOMServer.renderToStaticMarkup(
      <IounStonesCompact summary={summary} />
    );
    expect(markup).toContain('There are ioun stones (3):');
    expect(markup).toContain(
      'Stone 1: pale blue rhomboid — adds 1 point to strength (18 maximum)'
    );
    expect(markup).toContain(
      'Stone 2: scarlet &amp; blue sphere — duplicate of stone 1, burned out'
    );
    expect(markup).toContain(
      'Stone 3: dull gray — burned out (&quot;dead&quot; stone)'
    );
  });

  it('renders empty compact markup when no stones are present', () => {
    const markup = ReactDOMServer.renderToStaticMarkup(
      <IounStonesCompact
        summary={{
          count: 0,
          countRoll: 0,
          stones: [],
        }}
      />
    );
    expect(markup).toContain('There are no ioun stones.');
  });

  it('generates a compact sentence summary', () => {
    const sentence = iounStonesCompactSentence(summary);
    expect(sentence).toBe(
      'There are ioun stones (3): Stone 1: pale blue rhomboid — adds 1 point to strength (18 maximum); Stone 2: scarlet & blue sphere — duplicate of stone 1, burned out; Stone 3: dull gray — burned out ("dead" stone).'
    );
  });
});
