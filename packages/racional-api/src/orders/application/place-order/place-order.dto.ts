import { z } from 'zod'

const positiveDecimalString = z
  .string()
  .regex(/^\d+(\.\d{1,6})?$/, 'Must be a positive decimal with up to 6 decimal places')

export const placeOrderSchema = z.object({
  type: z.enum(['BUY', 'SELL']),
  ticker: z.string().min(1).max(10).toUpperCase(),
  quantity: positiveDecimalString,
  price_per_unit: positiveDecimalString,
  date: z.string().datetime(),
})

export type PlaceOrderDto = z.infer<typeof placeOrderSchema>
