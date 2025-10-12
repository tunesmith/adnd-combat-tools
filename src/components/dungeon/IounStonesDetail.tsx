import type { IounStonesSummary } from '../../types/dungeon';

export type IounStonesDetailProps = {
  summary: IounStonesSummary;
};

export function IounStonesDetail({ summary }: IounStonesDetailProps) {
  const { count, countRoll, stones } = summary;
  const intro = `There ${count === 1 ? 'is' : 'are'} ${count} ioun stone${
    count === 1 ? '' : 's'
  } (roll: ${countRoll}).`;

  return (
    <div>
      <p>{intro}</p>
      <ul style={{ marginLeft: '1.25rem' }}>
        {stones.map((stone) => (
          <li key={stone.index} style={{ marginBottom: '0.25rem' }}>
            <strong>Stone {stone.index}:</strong> {renderStoneLine(stone)}
          </li>
        ))}
      </ul>
    </div>
  );
}

function renderStoneLine(summary: IounStonesSummary['stones'][number]): string {
  const base = `${summary.color} ${summary.shape}`.trim();
  if (summary.status === 'duplicate') {
    const duplicateText =
      summary.duplicateOf !== undefined
        ? `burned out duplicate of stone ${summary.duplicateOf}`
        : 'burned out duplicate';
    return `${base} — ${ensurePeriod(duplicateText)}`;
  }
  return `${base} — ${ensurePeriod(summary.effect)}`;
}

function ensurePeriod(text: string): string {
  const trimmed = text.trim();
  return /[.!?]\s*$/.test(trimmed) ? trimmed : `${trimmed}.`;
}
