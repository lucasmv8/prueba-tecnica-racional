import { z } from 'zod'

export const updateUserInfoSchema = z.object({
  full_name: z.string().min(1).max(200).optional(),
  phone: z.string().max(30).nullable().optional(),
})

export type UpdateUserInfoDto = z.infer<typeof updateUserInfoSchema>
