import { z } from 'zod'

export const updatePortfolioSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).nullable().optional(),
  currency: z.string().length(3).optional(),
})

export type UpdatePortfolioDto = z.infer<typeof updatePortfolioSchema>
