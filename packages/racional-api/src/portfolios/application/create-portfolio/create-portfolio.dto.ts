import { z } from 'zod'

export const createPortfolioSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  currency: z.string().length(3).default('USD'),
})

export type CreatePortfolioDto = z.infer<typeof createPortfolioSchema>
