import { z } from 'zod';
export const encounterStatusSchema = z.enum([
  'unspecified',
  'prepared',
  'in-progress',
  'finished',
]);
export type EncounterStatus = z.infer<typeof encounterStatusSchema>;
export const continuedFromSchema = z
  .object({
    sessionId: z.string().min(1),
    instanceId: z.string().min(1),
    checkpointId: z.string().min(1),
  })
  .strict();
export type ContinuedFrom = z.infer<typeof continuedFromSchema>;
export const sessionContinuationSchema = z
  .object({
    sourceSessionId: z.string().min(1),
    sourceFingerprint: z.string().min(1),
    requestFingerprint: z.string().min(1),
    combatInstanceIds: z.array(z.string().min(1)),
    inventoryId: z.string().min(1).nullable(),
    copyNotes: z.boolean(),
    partyCharacterIds: z.array(z.string().min(1)).optional(),
  })
  .strict();
export type SessionContinuation = z.infer<typeof sessionContinuationSchema>;
