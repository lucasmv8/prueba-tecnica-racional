import { z } from 'zod'

export const addWatchlistItemSchema = z.object({
  ticker: z.string().min(1).max(10).toUpperCase(),
  notes: z.string().max(500).optional(),
  target_price: z
    .string()
    .regex(/^\d+(\.\d{1,6})?$/, 'Must be a positive decimal')
    .optional(),
})

export type AddWatchlistItemDto = z.infer<typeof addWatchlistItemSchema>
