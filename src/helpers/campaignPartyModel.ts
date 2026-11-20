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
const attribute = z.number().int().min(0).max(25).nullable();
const bonus = z.number().int().min(-1000).max(1000).nullable();
export const armorTypes = [
  'leather',
  'padded',
  'studded',
  'ring',
  'scale',
  'chain',
  'elfin-chain',
  'splint',
  'banded',
  'plate',
] as const;
export type BodyArmor = typeof armorTypes[number];
export const profileReferenceSchema = z
  .object({
    // Absent = unrecorded, null = explicitly wearing no body armor.
    wornArmor: z
      .object({ itemId: id, type: z.enum(armorTypes).optional() })
      .strict()
      .nullable()
      .optional(),
    race: z.string().max(200),
    gender: z.string().max(200),
    age: z.number().int().min(0).max(1_000_000).nullable(),
    alignment: z.string().max(200),
    maxHp: z.number().int().min(0).max(1_000_000).nullable(),
    attributes: z
      .object({
        strength: z
          .object({
            score: attribute,
            exceptional: z.number().int().min(1).max(100).nullable(),
          })
          .strict()
          .refine(
            (strength) =>
              strength.exceptional === null || strength.score === 18,
            'Exceptional strength requires STR 18.'
          ),
        intelligence: attribute,
        wisdom: attribute,
        dexterity: attribute,
        constitution: attribute,
        charisma: attribute,
      })
      .strict(),
    bonuses: z
      .object({
        meleeHit: bonus,
        meleeDamage: bonus,
        missileHit: bonus,
        reactionPercent: bonus,
        xpPercent: bonus,
      })
      .strict(),
  })
  .strict();
export type ProfileReference = z.infer<typeof profileReferenceSchema>;
export const emptyProfileReference = (): ProfileReference => ({
  race: '',
  gender: '',
  age: null,
  alignment: '',
  maxHp: null,
  attributes: {
    strength: { score: null, exceptional: null },
    intelligence: null,
    wisdom: null,
    dexterity: null,
    constitution: null,
    charisma: null,
  },
  bonuses: {
    meleeHit: null,
    meleeDamage: null,
    missileHit: null,
    reactionPercent: null,
    xpPercent: null,
  },
});

export const rosterCharacterSchema = z
  .object({
    id,
    name: z.string().trim().min(1).max(1000),
    player: z.string().max(1000),
    notes: note,
    earnsXp: z.boolean().optional(),
    lastEligibleSessionId: id.optional(),
  })
  .strict();
const profileClassSchema = z
  .object({
    id,
    characterClass: z.enum(partyClasses),
    baseLevel: level,
    xpPercent: bonus,
  })
  .strict();
export type ProfileClass = z.infer<typeof profileClassSchema>;
const reminderFields = z
  .object({
    id,
    source: z.string().max(1000),
  })
  .strict();
const saveReminderSchema = z.union([
  reminderFields.extend({
    bonus: z.string().trim().min(1, 'Enter a saving-throw bonus.').max(100),
    appliesWhen: z
      .string()
      .trim()
      .min(1, 'Enter when the bonus applies.')
      .max(1000),
  }),
  reminderFields.extend({
    instruction: z
      .string()
      .trim()
      .min(1, 'Enter a before-the-roll instruction.')
      .max(1000),
  }),
]);
export type SaveReminder = z.infer<typeof saveReminderSchema>;
export const partyProfileSchema = z
  .object({
    characterId: id,
    sessionId: id,
    characterClass: z.enum(partyClasses),
    baseLevel: level,
    classes: z.array(profileClassSchema).min(2).max(3).optional(),
    combatClassId: id.optional(),
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
        classId: id.optional(),
      })
      .strict()
      .nullable(),
    participating: z.boolean(),
    // Keep the V6 file key. These targets only apply when no save is calculated.
    overrides: z.tuple([override, override, override, override, override]),
    saveNotes: z.tuple([note, note, note]),
    saveReminders: z
      .array(saveReminderSchema)
      .refine(
        (rows) => new Set(rows.map((row) => row.id)).size === rows.length,
        'Repeated saving-throw reminder ID.'
      )
      .optional(),
    reference: profileReferenceSchema.optional(),
  })
  .strict();
export const campaignPartySchema = z
  .object({
    roster: z.array(rosterCharacterSchema).max(500),
    profiles: z.array(partyProfileSchema),
  })
  .strict();
export type CampaignParty = z.infer<typeof campaignPartySchema>;
export type RosterCharacter = z.infer<typeof rosterCharacterSchema>;
export type PartyProfile = z.infer<typeof partyProfileSchema>;
