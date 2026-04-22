import type { PrismaClient } from '@prisma/client'

import type { Movement } from '../../domain/movement.entity'

const DEFAULT_LIMIT = 20
const MAX_LIMIT = 100

export class GetUserMovementsUseCase {
  constructor(private readonly db: PrismaClient) {}

  async execute(
    userId: string,
    options: { limit?: number; cursor?: string },
  ): Promise<{ items: Movement[]; next_cursor: string | null }> {
    const limit = Math.min(options.limit ?? DEFAULT_LIMIT, MAX_LIMIT)
    const cursorDate = options.cursor ? new Date(options.cursor) : undefined
    const dateFilter = cursorDate ? { lt: cursorDate } : undefined

    const [rawTransactions, rawOrders] = await Promise.all([
      this.db.transaction.findMany({
        where: { user_id: userId, date: dateFilter },
        orderBy: { date: 'desc' },
        take: limit,
      }),
      this.db.order.findMany({
        where: { portfolio: { user_id: userId }, date: dateFilter },
        include: { stock: { select: { ticker: true } } },
        orderBy: { date: 'desc' },
        take: limit,
      }),
    ])

    const movements: Movement[] = [
      ...rawTransactions.map((t: (typeof rawTransactions)[number]) => ({
        id: t.id,
        kind: t.type as 'DEPOSIT' | 'WITHDRAWAL',
        amount: t.amount.toString(),
        date: t.date,
        description: t.description,
        ticker: null,
        quantity: null,
        created_at: t.created_at,
      })),
      ...rawOrders.map((o: (typeof rawOrders)[number]) => ({
        id: o.id,
        kind: o.type as 'BUY' | 'SELL',
        amount: o.total_amount.toString(),
        date: o.date,
        description: null,
        ticker: o.stock.ticker,
        quantity: o.quantity.toString(),
        created_at: o.created_at,
      })),
    ]

    movements.sort((a, b) => b.date.getTime() - a.date.getTime())
    const paged = movements.slice(0, limit)

    const nextCursor = paged.length === limit ? paged[paged.length - 1].date.toISOString() : null

    return { items: paged, next_cursor: nextCursor }
  }
}
