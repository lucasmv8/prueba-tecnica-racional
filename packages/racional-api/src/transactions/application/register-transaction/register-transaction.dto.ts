import { z } from 'zod'

export const registerTransactionSchema = z.object({
  type: z.enum(['DEPOSIT', 'WITHDRAWAL']),
  amount: z
    .string()
    .regex(/^\d+(\.\d{1,6})?$/, 'Amount must be a positive decimal with up to 6 decimal places'),
  date: z.string().datetime(),
  description: z.string().max(500).optional(),
})

export type RegisterTransactionDto = z.infer<typeof registerTransactionSchema>
