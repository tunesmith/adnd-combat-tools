import { z } from 'zod';

export const partyClasses = [
  'manual',
  'cleric',
  'druid',
  'fighter',
  'ranger',
  'paladin',
  'magic-user',
  'illusionist',
  'thief',
  'assassin',
  'monk',
  'bard',
] as const;
const id = z.string().min(1);
const note = z.string().max(100_000);
const level = z.number().int().min(0).max(99);
const override = z.number().int().min(0).max(99).nullable();

export const rosterCharacterSchema = z
  .object({
    id,
    name: z.string().trim().min(1).max(1000),
    player: z.string().max(1000),
    notes: note,
  })
  .strict();
export const partyProfileSchema = z
  .object({
    characterId: id,
    sessionId: id,
    characterClass: z.enum(partyClasses),
    baseLevel: level,
    saveBasis: z.enum([
      'printed',
      'manual',
      'cleric',
      'fighter',
      'magic-user',
      'thief',
    ]),
    combatBasis: z.enum(['class', 'manual']),
    retainedFighter: level.nullable(),
    retainedThief: level.nullable(),
    adjustment: z
      .object({
        name: z.string().trim().min(1).max(1000),
        enabled: z.boolean(),
      })
      .strict()
      .nullable(),
    participating: z.boolean(),
    // Keep the V6 file key. These targets only apply when no save is calculated.
    overrides: z.tuple([override, override, override, override, override]),
    saveNotes: z.tuple([note, note, note]),
  })
  .strict();
const inventoryLinkSchema = z
  .object({
    sessionId: id,
    inventoryId: id,
    inventoryCharacterId: id,
    characterId: id,
  })
  .strict();
const combatLinkSchema = z
  .object({
    sessionId: id,
    combatId: id,
    generation: z.number().int().nonnegative(),
    side: z.enum(['party', 'enemy']),
    key: z.number().int().safe(),
    characterId: id,
  })
  .strict();
export const campaignPartySchema = z
  .object({
    roster: z.array(rosterCharacterSchema).max(500),
    profiles: z.array(partyProfileSchema),
    inventoryLinks: z.array(inventoryLinkSchema),
    combatLinks: z.array(combatLinkSchema),
  })
  .strict();
export type CampaignParty = z.infer<typeof campaignPartySchema>;
export type RosterCharacter = z.infer<typeof rosterCharacterSchema>;
export type PartyProfile = z.infer<typeof partyProfileSchema>;
export type InventoryLink = z.infer<typeof inventoryLinkSchema>;
export type CombatLink = z.infer<typeof combatLinkSchema>;
