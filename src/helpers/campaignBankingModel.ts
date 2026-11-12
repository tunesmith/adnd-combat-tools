import { z } from 'zod';
import type { EncumbranceInventoryItem } from '../types/encumbrance';
import {
  createEmptyEncumbranceDocument,
  parseEncumbranceDocument,
} from './encumbranceDocument';
import { canonical } from './campaignSnapshots';

export const bankDenominations = [
  'cp',
  'sp',
  'ep',
  'gp',
  'pp',
  'diamond',
  'emerald',
] as const;
export type BankDenomination = typeof bankDenominations[number];
const id = z.string().min(1).max(1000);
const whole = z.number().int().min(0).max(Number.MAX_SAFE_INTEGER);
const signed = z
  .number()
  .int()
  .min(-Number.MAX_SAFE_INTEGER)
  .max(Number.MAX_SAFE_INTEGER);
const bankAmountsSchema = z
  .object({
    cp: whole.nullable(),
    sp: whole.nullable(),
    ep: whole.nullable(),
    gp: whole.nullable(),
    pp: whole.nullable(),
    diamond: whole.nullable(),
    emerald: whole.nullable(),
  })
  .strict();
export type BankAmounts = z.infer<typeof bankAmountsSchema>;
export const zeroBankAmounts = (): BankAmounts => ({
  cp: 0,
  sp: 0,
  ep: 0,
  gp: 0,
  pp: 0,
  diamond: 0,
  emerald: 0,
});
const item = z.custom<EncumbranceInventoryItem>((value) => {
  try {
    if (!value || typeof value !== 'object' || Array.isArray(value))
      return false;
    const template = { ...value, containerId: null };
    const blank = createEmptyEncumbranceDocument();
    const parsed = parseEncumbranceDocument(
      JSON.stringify({
        ...blank,
        characters: [
          {
            id: 'bank-validator',
            name: 'Validation',
            strength: { score: 10, exceptional: 'none' },
            dmNotes: '',
            inventory: [template],
          },
        ],
        storageLocations: [],
        activeCharacterId: 'bank-validator',
      })
    );
    return (
      parsed.kind === 'adnd-encumbrance-dm' &&
      canonical(parsed.characters[0]?.inventory[0]) === canonical(template)
    );
  } catch {
    return false;
  }
}, 'Invalid banking inventory entry.');
const bankChangeSchema = z
  .object({
    holderId: id,
    denomination: z.enum(bankDenominations),
    item,
    quantity: signed,
    fee: z.boolean().optional(),
  })
  .strict();
export type BankChange = z.infer<typeof bankChangeSchema>;
export const bankKinds = [
  'purchase',
  'refund',
  'fee',
  'income',
  'transfer',
  'exchange',
  'adjustment',
  'reconciliation',
] as const;
export const bankTransactionTypes = [
  { value: 'income', label: 'Income' },
  { value: 'purchase', label: 'Payment' },
  { value: 'transfer', label: 'Transfer' },
  { value: 'exchange', label: 'Exchange' },
] as const;
export function bankKindLabel(kind: typeof bankKinds[number]) {
  if (kind === 'refund') return 'Income';
  if (kind === 'fee') return 'Payment';
  if (kind === 'adjustment') return 'Adjustment';
  if (kind === 'reconciliation') return 'Adjustment';
  return (
    bankTransactionTypes.find((type) => type.value === kind)?.label ?? kind
  );
}

export const bankEntrySchema = z
  .object({
    id,
    transactionId: id,
    replaces: id.nullable(),
    sessionId: id,
    order: whole,
    description: z.string().trim().min(1).max(100000),
    kind: z.enum(bankKinds),
    status: z.enum(['draft', 'posted', 'void']),
    effect: z.enum(['inventory', 'ledger']),
    receiptMode: z.literal('existing').optional(),
    changes: z.array(bankChangeSchema).min(1).max(2000),
    at: z.string().datetime(),
  })
  .strict();
export type BankEntry = z.infer<typeof bankEntrySchema>;
export const bankOpeningSchema = z
  .object({
    id,
    holderId: id,
    sessionId: id,
    phase: z.enum(['before', 'after']),
    amounts: bankAmountsSchema,
    note: z.string().trim().min(1).max(100000),
  })
  .strict();
export type BankOpening = z.infer<typeof bankOpeningSchema>;
const bankExtensionSchema = z
  .object({
    id,
    at: z.string().datetime(),
    entryIds: z.array(id).min(1).max(2000),
    openings: z
      .array(
        z
          .object({
            previous: bankOpeningSchema,
            replacement: bankOpeningSchema,
            applied: z
              .object({
                cp: signed.nullable(),
                sp: signed.nullable(),
                ep: signed.nullable(),
                gp: signed.nullable(),
                pp: signed.nullable(),
                diamond: signed.nullable(),
                emerald: signed.nullable(),
              })
              .strict(),
          })
          .strict()
      )
      .min(1)
      .max(500),
  })
  .strict();
export type BankExtension = z.infer<typeof bankExtensionSchema>;
export const campaignBankingSchema = z
  .object({
    version: z.literal(1),
    openings: z.array(bankOpeningSchema).max(500),
    entries: z.array(bankEntrySchema).max(10000),
    extensions: z.array(bankExtensionSchema).max(500),
  })
  .strict();
export type CampaignBanking = z.infer<typeof campaignBankingSchema>;
