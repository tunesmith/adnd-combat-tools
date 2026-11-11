import type { PartyProfile } from './campaignPartyModel';
import type {
  XpAwardRow,
  XpBonusReview,
  XpClassAward,
  XpClassReview,
} from './campaignXpModel';
import { cappedXp, profileXpCap, validateXpCap } from './campaignXpCap';
import { profileClassLabel } from './campaignParty';
import {
  xpAdd,
  xpDivide,
  xpExact,
  xpMultiply,
  xpNumber,
  xpRound,
  xpZero,
} from './xpArithmetic';

export function profileClassReviews(
  profile: PartyProfile | undefined,
  previous?: XpBonusReview['classes']
): XpBonusReview['classes'] {
  return profile?.classes?.map((c) => ({
    classId: c.id,
    characterClass: c.characterClass,
    baseLevel: c.baseLevel,
    percent: c.xpPercent?.toString() ?? null,
    reason: '',
    ...previous?.find((v) => v.classId === c.id),
  }));
}
export function classReviewCap(c: XpClassReview) {
  const cap =
    c.cap ??
    profileXpCap({ characterClass: c.characterClass, baseLevel: c.baseLevel });
  if (!cap)
    throw Error(
      `${profileClassLabel(c.characterClass)}: review an explicit XP cap.`
    );
  validateXpCap(cap);
  if (
    cap.mode === 'standard' &&
    (cap.characterClass !== c.characterClass || cap.baseLevel !== c.baseLevel)
  )
    throw Error('Use the trained class cap or a reasoned cap exception.');
  return { ...cap, characterClass: c.characterClass, baseLevel: c.baseLevel };
}
function sumClassAwards(row: XpAwardRow, classes: XpClassAward[]): XpAwardRow {
  const sum = (
    f: 'before' | 'after' | 'award' | 'rounded' | 'fullAward' | 'discarded'
  ) => classes.reduce((s, c) => s + (c[f] ?? 0), 0);
  const exactSum = (f: 'bonus' | 'unrounded') =>
    xpExact(classes.reduce((s, c) => xpAdd(s, xpNumber(c[f])), xpZero()));
  const integerFields = [
    'before',
    'after',
    'award',
    'rounded',
    'fullAward',
    'discarded',
  ] as const;
  if (!integerFields.every((f) => Number.isSafeInteger(sum(f))))
    throw Error('XP total exceeds the supported integer range.');
  return {
    ...row,
    classes,
    bonusPercent: '0',
    bonus: exactSum('bonus'),
    unrounded: exactSum('unrounded'),
    rounded: sum('rounded'),
    fullAward: sum('fullAward'),
    discarded: sum('discarded'),
    award: sum('award'),
    before: sum('before'),
    after: sum('after'),
  };
}
export function calculateClassAwards(
  row: XpAwardRow,
  review: XpBonusReview,
  balances: Record<string, number | null> = {}
): XpAwardRow {
  const reviews = review.classes;
  if (!reviews) return row;
  if (review.finalOverride !== null)
    throw Error(
      'Adjust multiclass awards per class; a character-wide override cannot be split silently.'
    );
  if (new Set(reviews.map((c) => c.classId)).size !== reviews.length)
    throw Error('Duplicate XP class identity.');
  if (
    Object.keys(balances).length &&
    (Object.keys(balances).length !== reviews.length ||
      reviews.some((c) => !(c.classId in balances)))
  )
    throw Error(
      'Existing XP class identities must be retained. Review class accounting explicitly.'
    );
  const known = reviews.every((c) => balances[c.classId] != null);
  const before = reviews.map((c) => (known ? balances[c.classId] : c.opening));
  if (
    before.some((n) => n == null) ||
    before.reduce<number>((s, n) => s + (n ?? 0), 0) !== row.before
  )
    throw Error(
      `${row.name}: review per-class opening balances matching the existing total (${row.before}).`
    );
  const classes = reviews.map((c, i): XpClassAward => {
    if (c.percent === null)
      throw Error(
        `${row.name} · ${profileClassLabel(
          c.characterClass
        )}: confirm an XP bonus, including 0.`
      );
    const part = (v: string) =>
      xpExact(xpDivide(xpNumber(v), xpNumber(reviews.length)));
    const base = xpNumber(part(row.base));
    const bonus = xpMultiply(
      base,
      xpDivide(xpNumber(c.percent), xpNumber(100))
    );
    const unrounded = xpAdd(base, bonus),
      fullAward = xpRound(unrounded),
      cap = classReviewCap(c),
      previous = before[i] ?? 0;
    return {
      ...row,
      classId: c.classId,
      characterClass: c.characterClass,
      baseLevel: c.baseLevel,
      name: profileClassLabel(c.characterClass),
      allocations: row.allocations.map((a) => ({
        ...a,
        calculated: part(a.calculated),
        accepted: part(a.accepted),
      })),
      base: xpExact(base),
      bonusPercent: xpExact(xpNumber(c.percent)),
      bonus: xpExact(bonus),
      unrounded: xpExact(unrounded),
      rounded: fullAward,
      fullAward,
      cap,
      overrideReason: '',
      before: previous,
      ...cappedXp(fullAward, previous, cap),
    };
  });
  return sumClassAwards(row, classes);
}
export function rebaseClassAwards(
  row: XpAwardRow,
  balances: Record<string, number | null>
) {
  if (!row.classes) return row;
  const classes = row.classes.map((c) => {
    const before = balances[c.classId];
    if (before == null || !c.cap || c.fullAward === undefined)
      throw Error(
        'A later class balance cannot be rebased without its recorded opening and cap.'
      );
    return { ...c, before, ...cappedXp(c.fullAward, before, c.cap) };
  });
  return sumClassAwards(row, classes);
}
export function validateClassOpening(opening: {
  balance: number | null;
  classes?: { classId: string; balance: number | null }[];
}) {
  if (!opening.classes) return;
  const values = opening.classes;
  if (
    new Set(values.map((c) => c.classId)).size !== values.length ||
    (values.some((c) => c.balance === null)
      ? opening.balance !== null
      : values.reduce((s, c) => s + (c.balance ?? 0), 0) !== opening.balance)
  )
    throw Error(
      'Per-class openings must match the character opening total; blank means unknown.'
    );
}
export const classOpeningTotal = (classes: { balance: number | null }[]) =>
  classes.some((c) => c.balance === null)
    ? null
    : classes.reduce((s, c) => s + (c.balance ?? 0), 0);
