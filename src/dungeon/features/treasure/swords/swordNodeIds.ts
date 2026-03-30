export function primaryAbilityNodeId(
  slotKey: string,
  rollIndex?: number
): string {
  return rollIndex !== undefined
    ? `treasureSwordPrimaryAbility:${rollIndex}:${slotKey}`
    : `treasureSwordPrimaryAbility:${slotKey}`;
}

export function extraordinaryPowerNodeId(
  slotKey: string,
  rollIndex?: number
): string {
  return rollIndex !== undefined
    ? `treasureSwordExtraordinaryPower:${rollIndex}:${slotKey}`
    : `treasureSwordExtraordinaryPower:${slotKey}`;
}

export function specialPurposeNodeId(
  slotKey: string,
  rollIndex?: number
): string {
  return rollIndex !== undefined
    ? `treasureSwordSpecialPurpose:${rollIndex}:${slotKey}`
    : `treasureSwordSpecialPurpose:${slotKey}`;
}

export function specialPurposePowerNodeId(
  slotKey: string,
  rollIndex?: number
): string {
  return rollIndex !== undefined
    ? `treasureSwordSpecialPurposePower:${rollIndex}:${slotKey}`
    : `treasureSwordSpecialPurposePower:${slotKey}`;
}

export function dragonSlayerColorNodeId(
  slotKey: string,
  rollIndex?: number
): string {
  return rollIndex !== undefined
    ? `treasureSwordDragonSlayerColor:${rollIndex}:${slotKey}`
    : `treasureSwordDragonSlayerColor:${slotKey}`;
}

export function parseSwordNodeContextFromId(
  id: string | undefined,
  prefix: string
): { slotKey?: string; rollIndex?: number } {
  if (!id || !id.startsWith(prefix)) {
    return {};
  }
  const remainder = id.slice(prefix.length);
  if (!remainder) return {};
  const colonIndex = remainder.indexOf(':');
  if (colonIndex === -1) {
    return { slotKey: remainder };
  }
  const maybeIndex = remainder.slice(0, colonIndex);
  const potentialSlot = remainder.slice(colonIndex + 1);
  const parsedIndex = Number.parseInt(maybeIndex, 10);
  if (Number.isNaN(parsedIndex)) {
    return { slotKey: remainder };
  }
  return {
    slotKey: potentialSlot,
    rollIndex: parsedIndex,
  };
}
