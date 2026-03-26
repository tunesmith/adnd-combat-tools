import type { TableContext } from '../../../types/dungeon';
import type { OutcomeEventNode } from '../../domain/outcome';
import { readTableContextOfKind } from '../../helpers/tableContext';

export function readHazardDungeonLevel(
  context: TableContext | undefined,
  ancestors: OutcomeEventNode[]
): number {
  const wanderingContext = readTableContextOfKind(context, 'wandering');
  if (wanderingContext) return wanderingContext.level;
  for (let index = ancestors.length - 1; index >= 0; index -= 1) {
    const ancestor = ancestors[index];
    if (!ancestor) continue;
    if (ancestor.event.kind === 'periodicCheck') {
      return ancestor.event.level;
    }
    if (
      ancestor.event.kind === 'doorBeyond' &&
      typeof ancestor.event.level === 'number'
    ) {
      return ancestor.event.level;
    }
  }
  return 1;
}
