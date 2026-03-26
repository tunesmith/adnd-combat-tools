import { rollDice } from '../../../helpers/dungeonLookup';

export function resolveBoundedRoll(
  roll: number | undefined,
  sides: number
): number {
  if (roll === undefined) {
    return rollDice(sides);
  }
  const provided = Math.trunc(roll);
  if (!Number.isFinite(provided) || provided < 1) {
    return 1;
  }
  if (provided > sides) {
    return sides;
  }
  return provided;
}

export function resolveLuckBladeWishes(provided?: number): number {
  if (provided === undefined) {
    return rollDice(4) + 1;
  }
  const truncated = Math.trunc(provided);
  if (!Number.isFinite(truncated)) return 2;
  if (truncated < 2) return 2;
  if (truncated > 5) return 5;
  return truncated;
}

export function rollSwordLanguages(languageRolls: number[]): number {
  const useProvided =
    languageRolls.length > 0 ? languageRolls.shift() : undefined;
  const rollValue = useProvided ?? rollDice(100);
  if (rollValue === 100) {
    let total = 0;
    for (let i = 0; i < 2; i += 1) {
      let extraRoll: number;
      do {
        extraRoll =
          languageRolls.length > 0
            ? languageRolls.shift() ?? rollDice(100)
            : rollDice(100);
      } while (extraRoll === 100);
      total += mapSwordLanguageRoll(extraRoll);
    }
    return Math.max(6, total);
  }
  return mapSwordLanguageRoll(rollValue);
}

function mapSwordLanguageRoll(roll: number): number {
  if (roll <= 40) return 1;
  if (roll <= 70) return 2;
  if (roll <= 85) return 3;
  if (roll <= 95) return 4;
  if (roll <= 99) return 5;
  return 6;
}
