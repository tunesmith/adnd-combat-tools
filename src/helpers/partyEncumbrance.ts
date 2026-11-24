import type { CampaignDocument } from './campaignDocument';
import { inventoryMembership } from './campaignInventoryMembership';
import type { PartyProfile } from './campaignPartyModel';
import { encumbranceCatalogById } from '../tables/encumbranceCatalog';
import { bodyArmor, bodyArmorTypes } from '../tables/bodyArmor';
import type {
  EncumbranceDmCharacter,
  EncumbranceInventoryItem,
} from '../types/encumbrance';
import {
  getEffectiveLoadGp,
  getInventoryItemInfo,
  getLoadBand,
  inventoryCatalog,
  getStrengthWeightAllowanceGp,
  getTotalEncumbranceGp,
  loadBands,
} from './encumbranceRules';

export function partyGear(doc: CampaignDocument, sessionId: string) {
  const { matched } = inventoryMembership(doc, sessionId);
  const inventory = doc.workingInventories.find(
    (w) => w.sessionId === sessionId
  )?.document;
  const holders = new Map(inventory?.characters.map((c) => [c.id, c]));
  return {
    holders: new Map(
      matched.map((m) => [m.characterId, holders.get(m.holderId)])
    ),
    catalog: inventoryCatalog([
      ...(inventory?.characters ?? []),
      ...(inventory?.version === 10 ? inventory.storageLocations : []),
    ]),
  };
}

export function itemBodyArmor(item: EncumbranceInventoryItem) {
  if (item.customItem)
    return item.customItem.category === 'armor' && !item.customItem.isContainer
      ? item.customItem.bodyArmorType
      : undefined;
  return bodyArmorTypes.find((type) => item.catalogId === 'armor-' + type);
}

function wearableBodyArmor(item: EncumbranceInventoryItem) {
  if (item.containerId === null && item.quantity > 0)
    return itemBodyArmor(item);
  return undefined;
}

export function armorChoices(holder?: EncumbranceDmCharacter) {
  return holder?.inventory.filter(wearableBodyArmor) ?? [];
}

export function armorItemName(item: EncumbranceInventoryItem) {
  return (
    item.name ||
    getInventoryItemInfo(item, encumbranceCatalogById)?.name ||
    item.catalogId
  );
}

function equippedArmor(profile: PartyProfile, holder?: EncumbranceDmCharacter) {
  const choice = profile.reference?.wornArmor;
  const item = choice && holder?.inventory.find((i) => i.id === choice.itemId);
  const type = item && wearableBodyArmor(item);
  return item && type ? { item, armor: bodyArmor[type] } : undefined;
}

export function wornArmorByHolder(doc: CampaignDocument, sessionId: string) {
  const { matched } = inventoryMembership(doc, sessionId);
  const profiles =
    doc.party?.profiles.filter((p) => p.sessionId === sessionId) ?? [];
  const gear = doc.workingInventories.find((w) => w.sessionId === sessionId)
    ?.document.characters;
  const result = new Map<string, string>();
  for (const match of matched) {
    const profile = profiles.find((p) => p.characterId === match.characterId);
    const holder = gear?.find((c) => c.id === match.holderId);
    const equipped = profile && equippedArmor(profile, holder);
    if (equipped) result.set(match.holderId, equipped.item.id);
  }
  return result;
}

export function characterLoad(
  profile: PartyProfile,
  holder?: EncumbranceDmCharacter,
  catalog = encumbranceCatalogById
) {
  if (!holder) return undefined;
  const equipped = equippedArmor(profile, holder);
  const load = getTotalEncumbranceGp(holder, catalog, equipped?.item.id);
  const allowance = getStrengthWeightAllowanceGp(holder.strength);
  const band = getLoadBand(getEffectiveLoadGp(load, holder.strength));
  const room = loadBands[0].limit + allowance - load;
  const choice = profile.reference?.wornArmor;
  const armorName =
    choice === null
      ? 'No worn armor'
      : equipped
      ? equipped.armor.name + (equipped.item.isMagical ? ' (magic)' : '')
      : 'Unknown';
  const armorMove =
    choice === null || equipped?.item.isMagical ? 12 : equipped?.armor.move;
  const finalMove =
    armorMove === undefined
      ? undefined
      : band.id === 'encumbered'
      ? '3–4″'
      : band.id === 'immobile'
      ? '0″'
      : Math.min(armorMove, Number.parseInt(band.movement, 10)) + '″';
  return { load, allowance, band, room, armorName, armorMove, finalMove };
}
