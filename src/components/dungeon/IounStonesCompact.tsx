import type { IounStonesSummary } from '../../types/dungeon';
import { iounStoneCompactLine } from '../../dungeon/features/treasure/miscMagicE3/miscMagicE3SubtablesRender';

type IounStonesCompactProps = {
  summary: IounStonesSummary;
};

export function IounStonesCompact({ summary }: IounStonesCompactProps) {
  const { count, stones } = summary;
  if (count === 0 || stones.length === 0) {
    return (
      <div>
        <p>There are no ioun stones.</p>
      </div>
    );
  }

  const intro =
    count === 1
      ? 'There is 1 ioun stone:'
      : `There are ioun stones (${count}):`;

  return (
    <div>
      <p>{intro}</p>
      <ul
        style={{
          listStyle: 'none',
          margin: '0.25rem 0 0',
          padding: 0,
          marginLeft: '1.25rem',
        }}
      >
        {stones.map((stone) => (
          <li key={stone.index} style={{ marginBottom: '0.25rem' }}>
            {iounStoneCompactLine(stone)}
          </li>
        ))}
      </ul>
    </div>
  );
}
