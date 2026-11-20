import { z } from 'zod';
import { treasureRowSchema } from './campaignXpModel';
import { manualXpEvidence } from './campaignXpSources';
import { xpCompare, xpNumber } from './xpArithmetic';

const oldPrices = {
  marketGp: treasureRowSchema.shape.gp.optional(),
  proceeds: treasureRowSchema.shape.gp.optional(),
};
const oldItem = treasureRowSchema.omit({ gp: true }).extend(oldPrices);
const oldSingle = oldItem
  .omit({ id: true, label: true, evidence: true })
  .extend({ category: z.literal('treasure') });
const oldRows = z
  .object({
    category: z.literal('treasure'),
    rows: z.array(oldItem).min(1).max(1000),
  })
  .strict();

function object(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

// Called only on freshly decoded file data. Do not visit opaque evidence,
// inventory or accounting snapshots. Fully validate and replay the result
// before handing the document to a session or permitting any save.
export function upgradeCampaignTreasure(doc: unknown) {
  if (
    !object(doc) ||
    doc['kind'] !== 'adnd-campaign' ||
    doc['schemaVersion'] !== 21
  )
    return;
  const xp = doc['xp'];
  if (!object(xp) || xp['version'] !== 2) return;
  const conflicts: string[] = [];
  function convert<
    T extends Pick<z.infer<typeof oldItem>, keyof typeof oldPrices>
  >(item: T, where: string) {
    const { marketGp, proceeds, ...rest } = item;
    if (
      marketGp != null &&
      proceeds != null &&
      xpCompare(xpNumber(marketGp), xpNumber(proceeds)) !== 0
    )
      conflicts.push(
        `${where}: market value ${marketGp} gp, sale value ${proceeds} gp`
      );
    return { ...rest, gp: proceeds ?? marketGp ?? null };
  }
  function rewards(list: unknown, path: string) {
    if (!Array.isArray(list)) return;
    list.forEach((r: unknown, i) => {
      if (
        !object(r) ||
        !object(r['input']) ||
        r['input']['category'] !== 'treasure'
      )
        return;
      const input = r['input'],
        where = `${path}[${i}] (${r['title']})`;
      if ('rows' in input) {
        const { rows } = oldRows.parse(input);
        r['input'] = {
          category: 'treasure',
          rows: rows.map((row) =>
            convert(row, `${where}, item ${row.label || row.id}`)
          ),
        };
      } else {
        const { category, ...amounts } = oldSingle.parse(input);
        const evidence = r['evidence'];
        const item =
          object(evidence) && evidence['kind'] === 'item' ? evidence : null;
        const snapshot = item?.['snapshot'];
        const label =
          object(snapshot) &&
          typeof snapshot['name'] === 'string' &&
          snapshot['name'].length <= 1000
            ? snapshot['name']
            : r['title'];
        r['input'] = {
          category,
          rows: [
            { id: 'first', label, evidence: item, ...convert(amounts, where) },
          ],
        };
        if (item && typeof item['sessionId'] === 'string')
          r['evidence'] = manualXpEvidence(item['sessionId']);
      }
    });
  }
  rewards(xp['rewards'], 'xp.rewards');
  if (Array.isArray(xp['points']))
    xp['points'].forEach((p: unknown, i) => {
      if (object(p))
        rewards(p['rewardOverrides'], `xp.points[${i}].rewardOverrides`);
    });
  if (Array.isArray(xp['events']))
    xp['events'].forEach((e: unknown, i) => {
      if (!object(e)) return;
      rewards(e['rewards'], `xp.events[${i}].rewards`);
      if (object(e['point']))
        rewards(
          e['point']['rewardOverrides'],
          `xp.events[${i}].point.rewardOverrides`
        );
    });
  if (conflicts.length)
    throw Error(
      'Treasure XP upgrade needs a GP value decision. Review the conflicting amounts in a copy of the campaign:\n' +
        conflicts.join('\n')
    );
  xp['version'] = 3;
}
