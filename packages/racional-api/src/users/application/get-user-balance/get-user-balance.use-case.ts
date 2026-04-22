import type { PrismaClient } from '@prisma/client'

import { calculateAvailableBalance } from '../../../shared/domain/calculate-available-balance'

export class GetUserBalanceUseCase {
  constructor(private readonly db: PrismaClient) {}

  async execute(userId: string): Promise<{ available_balance: string }> {
    const balance = await calculateAvailableBalance(this.db, userId)
    return { available_balance: balance.toFixed(6) }
  }
}
