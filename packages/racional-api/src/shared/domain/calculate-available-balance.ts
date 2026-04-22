import type { PrismaClient } from '@prisma/client'
import Decimal from 'decimal.js'

/**
 * Calculates the user's available wallet balance:
 * available = Σ(DEPOSIT) - Σ(WITHDRAWAL) - Σ(BUY total_amount) + Σ(SELL total_amount)
 */
export async function calculateAvailableBalance(
  db: PrismaClient,
  userId: string,
): Promise<Decimal> {
  const [txAgg, orderAgg] = await Promise.all([
    db.transaction.groupBy({
      by: ['type'],
      where: { user_id: userId },
      _sum: { amount: true },
    }),
    db.order.groupBy({
      by: ['type'],
      where: { portfolio: { user_id: userId } },
      _sum: { total_amount: true },
    }),
  ])

  const depositSum = txAgg.find((r) => r.type === 'DEPOSIT')?._sum.amount ?? new Decimal(0)
  const withdrawalSum = txAgg.find((r) => r.type === 'WITHDRAWAL')?._sum.amount ?? new Decimal(0)
  const buySum = orderAgg.find((r) => r.type === 'BUY')?._sum.total_amount ?? new Decimal(0)
  const sellSum = orderAgg.find((r) => r.type === 'SELL')?._sum.total_amount ?? new Decimal(0)

  return new Decimal(depositSum.toString())
    .minus(withdrawalSum.toString())
    .minus(buySum.toString())
    .plus(sellSum.toString())
}
