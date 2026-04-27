import { z } from 'zod';

/**
 * Bulk action input. Accepts either a single id or an array of ids.
 * At least one must be provided. Each must be a UUID. Arrays capped at 100
 * to bound request size.
 */
export const BulkActionSchema = z
  .object({
    id: z.string().uuid().optional(),
    ids: z.array(z.string().uuid()).max(100).optional(),
  })
  .refine((d) => Boolean(d.id) || Boolean(d.ids?.length), {
    message: 'id or ids required',
  });

export type BulkActionInput = z.infer<typeof BulkActionSchema>;
