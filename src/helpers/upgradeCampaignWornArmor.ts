import type { CampaignDocument } from './campaignDocument';
import { inventoryMembership } from './campaignInventoryMembership';
import { itemBodyArmor } from './partyEncumbrance';

// File loads alone move an explicit legacy type into the matched working item.
export function upgradeCampaignWornArmor(doc: CampaignDocument) {
  const profiles = doc.party?.profiles.filter(
    (profile) => profile.reference?.wornArmor?.type
  );
  if (!profiles?.length) return;

  for (const working of doc.workingInventories) {
    const legacyProfiles = profiles.filter(
      (p) => p.sessionId === working.sessionId
    );
    if (!legacyProfiles.length) continue;
    const { matched } = inventoryMembership(doc, working.sessionId);
    for (const profile of legacyProfiles) {
      const reference = profile.reference;
      const worn = reference?.wornArmor;
      if (!reference || !worn?.type) continue;
      const match = matched.find((m) => m.characterId === profile.characterId);
      const holder = working.document.characters.find(
        (c) => c.id === match?.holderId
      );
      const item = holder?.inventory.find((i) => i.id === worn.itemId);
      if (!item) continue;

      const custom = item.customItem;
      if (custom && !custom.isContainer && custom.bodyArmorType === undefined) {
        item.customItem = {
          ...custom,
          category: 'armor',
          bodyArmorType: worn.type,
        };
      }
      if (itemBodyArmor(item)) reference.wornArmor = { itemId: worn.itemId };
    }
  }
}
