import { z } from 'zod';
import { partyClasses } from './campaignPartyModel';
import { xpNumber } from './xpArithmetic';
const id = z.string().min(1).max(1000);
const note = z.string().max(100_000);
const rational = z
  .string()
  .max(1100)
  .refine((value) => {
    try {
      xpNumber(value);
      return true;
    } catch {
      return false;
    }
  }, 'Enter a nonnegative decimal or fraction.');
const integer = z.number().int().min(0).max(Number.MAX_SAFE_INTEGER);
const xpPositionSchema = z
  .object({
    sessionId: id,
    phase: z.enum(['opening', 'during', 'end']),
    order: z.number().int().min(0).max(9999),
  })
  .strict();
export type XpPosition = z.infer<typeof xpPositionSchema>;
const evidenceSchema = z
  .object({
    kind: z.enum(['manual', 'encounter', 'item']),
    sourceId: z.string(),
    instanceId: z.string(),
    sessionId: z.string(),
    keys: z.array(id).max(1000),
    label: z.string().max(2000),
    fingerprint: z.string(),
    snapshot: z
      .unknown()
      .refine((value) => value !== undefined, 'Evidence snapshot is required.'),
  })
  .strict();
export type XpEvidence = z.infer<typeof evidenceSchema>;
const monsterSchema = z
  .object({
    id,
    name: z.string().max(1000),
    count: z.number().int().min(1).max(10000),
    basis: z.enum(['hit-dice', 'level']),
    hitDice: rational.nullable(),
    hpAdjustment: z.number().int().min(-99).max(999),
    startingHp: rational.nullable(),
    special: z.number().int().min(0).max(1000),
    exceptional: z.number().int().min(0).max(1000),
    bandOverride: z.string().nullable(),
    bandReason: note,
  })
  .strict();
const treasureAmounts = {
  disposition: z.enum(['keep', 'sell', 'defer']),
  retainedXp: rational.nullable(),
  gp: rational.nullable(),
};
export const treasureRowSchema = z
  .object({
    id,
    label: z.string().max(1000),
    evidence: evidenceSchema.nullable(),
    ...treasureAmounts,
  })
  .strict();
export type XpTreasureRow = z.infer<typeof treasureRowSchema>;
const rewardInputSchema = z.union([
  z
    .object({
      category: z.literal('monster'),
      monsters: z.array(monsterSchema).min(1).max(1000),
    })
    .strict(),
  z.object({ category: z.literal('money'), gp: rational.nullable() }).strict(),
  z
    .object({
      category: z.literal('treasure'),
      rows: z
        .array(treasureRowSchema)
        .min(1)
        .max(1000)
        .superRefine((rows, ctx) => {
          const ids = new Set<string>(),
            keys = new Set<string>();
          for (const row of rows) {
            if (ids.has(row.id))
              ctx.addIssue({
                code: 'custom',
                message: 'Treasure rows need distinct identities.',
              });
            ids.add(row.id);
            if (!row.evidence) continue;
            if (row.evidence.kind !== 'item')
              ctx.addIssue({
                code: 'custom',
                message: 'Choose possession evidence for a treasure row.',
              });
            for (const key of row.evidence.keys) {
              if (keys.has(key))
                ctx.addIssue({
                  code: 'custom',
                  message: 'The same Gear lot is linked to two treasure rows.',
                });
              keys.add(key);
            }
          }
        }),
    })
    .strict(),
]);
const xpRecipientSchema = z
  .object({
    characterId: id,
    name: z.string().min(1).max(1000),
    participated: z.boolean(),
    eligible: z.boolean(),
    level: rational.nullable(),
    shares: rational,
    allocationOverride: rational.nullable(),
    allocationReason: note,
  })
  .strict();
export type XpRecipient = z.infer<typeof xpRecipientSchema>;
export const xpRewardSchema = z
  .object({
    id,
    version: z.number().int().min(1),
    title: z.string().trim().min(1).max(1000),
    origin: xpPositionSchema,
    input: rewardInputSchema,
    recipients: z.array(xpRecipientSchema).max(500),
    // Legacy metadata retained on historical snapshots; no confirmation gate.
    reviewed: z.boolean().optional(),
    // Archived metadata only; recording an event establishes that it was obtained.
    eligibility: z.enum(['pending', 'secured', 'excluded']).optional(),
    ratio: z
      .object({
        proposed: rational.nullable(),
        override: rational.nullable(),
        reason: note,
        recordedProposal: rational.nullable(),
        recordedReason: note,
      })
      .strict(),
    rawOverride: z
      .object({ amount: rational, reason: note })
      .strict()
      .nullable(),
    evidence: evidenceSchema,
    distinctReason: note,
    notes: note,
  })
  .strict();
export type XpReward = z.infer<typeof xpRewardSchema>;
const xpCapBasisSchema = z
  .object({
    characterClass: z.enum(partyClasses).nullable(),
    baseLevel: z.number().int().min(0).max(99).nullable(),
    mode: z.enum(['standard', 'override', 'uncapped']),
    limit: integer.nullable(),
    reason: note,
  })
  .strict();
export type XpCapBasis = z.infer<typeof xpCapBasisSchema>;
const xpClassOpeningSchema = z
  .object({
    classId: id,
    characterClass: z.enum(partyClasses),
    balance: integer.nullable(),
  })
  .strict();
export type XpClassOpening = z.infer<typeof xpClassOpeningSchema>;
const xpClassReviewSchema = z
  .object({
    classId: id,
    characterClass: z.enum(partyClasses),
    baseLevel: z.number().int().min(0).max(99),
    percent: rational.nullable(),
    cap: xpCapBasisSchema.optional(),
    opening: integer.nullable().optional(),
    reason: note,
  })
  .strict();
export type XpClassReview = z.infer<typeof xpClassReviewSchema>;
const capReviewSchema = z
  .object({ characterId: id, basis: xpCapBasisSchema })
  .strict();
const xpBonusReviewSchema = z
  .object({
    characterId: id,
    name: z.string().min(1).max(1000),
    percent: z.string().max(1100).nullable(),
    reason: note,
    finalOverride: integer.nullable(),
    finalReason: note,
    classes: z.array(xpClassReviewSchema).min(2).max(3).optional(),
  })
  .strict();
export type XpBonusReview = z.infer<typeof xpBonusReviewSchema>;
export const xpPointSchema = z
  .object({
    id,
    label: z.string().max(1000),
    position: xpPositionSchema,
    rewardIds: z.array(id).max(1000),
    bonuses: z.array(xpBonusReviewSchema).max(500),
    correctionOf: id.nullable(),
    correctionReason: note,
    rewardOverrides: z.array(xpRewardSchema).max(1000),
    confirmedEventId: id.nullable(),
    caps: z.array(capReviewSchema).max(500).optional(),
    settlements: z
      .array(
        z
          .object({
            rewardId: id,
            characterId: id,
            decision: z.enum(['award', 'later', 'forfeit']),
            reason: note,
          })
          .strict()
      )
      .max(50000)
      .optional(),
  })
  .strict();
export type XpPoint = z.infer<typeof xpPointSchema>;
const allocationSchema = z
  .object({
    rewardId: id,
    calculated: rational,
    accepted: rational,
    reason: note,
  })
  .strict();
const singleAwardRowSchema = z
  .object({
    characterId: id,
    name: z.string(),
    allocations: z.array(allocationSchema),
    base: rational,
    bonusPercent: rational,
    bonus: rational,
    unrounded: rational,
    rounded: integer,
    award: integer,
    overrideReason: note,
    before: integer,
    after: integer,
    fullAward: integer.optional(),
    discarded: integer.optional(),
    cap: xpCapBasisSchema.optional(),
  })
  .strict();
const xpClassAwardSchema = singleAwardRowSchema.extend({
  classId: id,
  characterClass: z.enum(partyClasses),
  baseLevel: z.number().int().min(0).max(99),
});
export type XpClassAward = z.infer<typeof xpClassAwardSchema>;
const awardRowSchema = singleAwardRowSchema.extend({
  classes: z.array(xpClassAwardSchema).min(2).max(3).optional(),
});
export type XpAwardRow = z.infer<typeof awardRowSchema>;
const xpEventSchema = z
  .object({
    id,
    point: xpPointSchema,
    confirmedAt: z.string().datetime(),
    replaces: id.nullable(),
    correctionRoot: id.nullable(),
    reason: note,
    calculatorVersion: z.union([z.literal(1), z.literal(2), z.literal(3)]),
    rounding: z.literal('nearest-whole-half-up-after-bonus'),
    rewards: z.array(xpRewardSchema).min(1),
    rows: z.array(awardRowSchema),
    resolutions: z.array(z.unknown()),
  })
  .strict();
export type XpEvent = z.infer<typeof xpEventSchema>;
const xpOpeningSchema = z
  .object({
    id,
    characterId: id,
    sessionId: id,
    balance: integer.nullable(),
    classes: z.array(xpClassOpeningSchema).min(2).max(3).optional(),
    reason: note,
  })
  .strict();
export type XpOpening = z.infer<typeof xpOpeningSchema>;

const xpExtensionSchema = z
  .object({
    id,
    confirmedAt: xpEventSchema.shape.confirmedAt,
    eventIds: z.array(id).min(1).max(1000),
    openings: z
      .array(
        z
          .object({
            previous: xpOpeningSchema,
            replacement: xpOpeningSchema,
            applied: integer,
          })
          .strict()
      )
      .min(1)
      .max(500),
  })
  .strict();
export type XpExtension = z.infer<typeof xpExtensionSchema>;

export const campaignXpSchema = z
  .object({
    version: z.literal(3),
    timeline: z.record(z.array(id).max(3000)),
    sessionOrder: z.array(id).max(500),
    openings: z.array(xpOpeningSchema).max(500),
    extensions: z.array(xpExtensionSchema).max(500).optional(),
    // Only needed when a correction releases a reward whose original source is frozen.
    pendingRecipientResets: z.record(z.array(id).max(500)).optional(),
    rewards: z.array(xpRewardSchema).max(2000),
    points: z.array(xpPointSchema).max(1000),
    events: z.array(xpEventSchema).max(2000),
  })
  .strict();
export type CampaignXp = z.infer<typeof campaignXpSchema>;
export const emptyCampaignXp = (): CampaignXp => ({
  version: 3,
  timeline: {},
  sessionOrder: [],
  openings: [],
  rewards: [],
  points: [],
  events: [],
});
