/** Exact nonnegative rational XP, serialized as reduced strings. No intermediate rounding. */
interface XpFraction {
  n: bigint;
  d: bigint;
}
const zero = BigInt(0),
  one = BigInt(1);
function gcd(a: bigint, b: bigint): bigint {
  while (b !== zero) {
    const next = a % b;
    a = b;
    b = next;
  }
  return a;
}
function fraction(n: bigint, d: bigint): XpFraction {
  if (n < zero || d <= zero)
    throw new Error(
      'XP values must be nonnegative, with a positive denominator.'
    );
  const divisor = gcd(n, d);
  return { n: n / divisor, d: d / divisor };
}
export function xpNumber(value: string | number): XpFraction {
  if (typeof value === 'number') {
    if (!Number.isFinite(value) || value < 0)
      throw new Error('XP values must be finite and nonnegative.');
    // Preserve the recorded number's decimal representation, including exponent notation.
    // Inventory prices can have more precision than a manually entered XP amount.
    const [mantissa, exponent = '0'] = String(value).toLowerCase().split('e');
    const [whole = '0', part = ''] = (mantissa || '0').split('.');
    const digits = BigInt(whole + part),
      places = part.length - Number(exponent);
    const scale = BigInt(`1${'0'.repeat(Math.abs(places))}`);
    return places >= 0
      ? fraction(digits, scale)
      : fraction(digits * scale, one);
  }
  const text = String(value).trim();
  if (
    !/^\d{1,16}(?:\.\d{1,8})?$/.test(text) &&
    !/^\d{1,512}\/\d{1,512}$/.test(text)
  )
    throw new Error(
      'Enter a nonnegative decimal or fraction (for example 0.5 or 1/2).'
    );
  if (text.includes('/')) {
    const [n, d] = text.split('/');
    return fraction(BigInt(n || '0'), BigInt(d || '0'));
  }
  const [whole, part = ''] = text.split('.');
  return fraction(
    BigInt(`${whole}${part}`),
    BigInt(`1${'0'.repeat(part.length)}`)
  );
}
export const xpZero = () => fraction(zero, one);
export const xpAdd = (a: XpFraction, b: XpFraction) =>
  fraction(a.n * b.d + b.n * a.d, a.d * b.d);
export const xpMultiply = (a: XpFraction, b: XpFraction) =>
  fraction(a.n * b.n, a.d * b.d);
export const xpDivide = (a: XpFraction, b: XpFraction) =>
  fraction(a.n * b.d, a.d * b.n);
export const xpCompare = (a: XpFraction, b: XpFraction) =>
  a.n * b.d < b.n * a.d ? -1 : a.n * b.d > b.n * a.d ? 1 : 0;
export const xpExact = (value: XpFraction) =>
  value.d === one ? String(value.n) : `${value.n}/${value.d}`;
export function xpRound(value: XpFraction): number {
  const result = Number(
    (value.n * BigInt(2) + value.d) / (value.d * BigInt(2))
  );
  if (!Number.isSafeInteger(result))
    throw new Error('XP award exceeds the supported integer range.');
  return result;
}
export function xpDisplay(value: string | XpFraction): string {
  const x = typeof value === 'string' ? xpNumber(value) : value;
  const scale = BigInt(1000000);
  const whole = x.n / x.d;
  const tail = String(((x.n % x.d) * scale) / x.d)
    .padStart(6, '0')
    .replace(/0+$/, '');
  return `${whole}${tail ? `.${tail}` : ''}${
    (x.n * scale) % x.d !== zero ? '…' : ''
  }`;
}

export function xpDifferenceDisplay(
  accepted: string,
  calculated: string
): string {
  const a = xpNumber(accepted),
    b = xpNumber(calculated),
    difference = a.n * b.d - b.n * a.d;
  return `${difference < zero ? '-' : '+'}${xpDisplay(
    fraction(difference < zero ? -difference : difference, a.d * b.d)
  )}`;
}

export function xpAdjustment(accepted: XpFraction, calculated: XpFraction) {
  const difference = accepted.n * calculated.d - calculated.n * accepted.d;
  return {
    direction:
      difference < zero
        ? ('decrease' as const)
        : difference > zero
        ? ('increase' as const)
        : ('none' as const),
    amount: xpExact(
      fraction(
        difference < zero ? -difference : difference,
        accepted.d * calculated.d
      )
    ),
  };
}
