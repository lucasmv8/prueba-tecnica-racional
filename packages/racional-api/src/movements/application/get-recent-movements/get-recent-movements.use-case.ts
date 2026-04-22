import type { PrismaClient } from '@prisma/client'

import { NotFoundError } from '../../../shared/domain/errors/not-found.error'
import { UnauthorizedError } from '../../../shared/domain/errors/unauthorized.error'
import type { IPortfolioRepository } from '../../../portfolios/domain/portfolio.repository'
import type { Movement } from '../../domain/movement.entity'

const DEFAULT_LIMIT = 20
const MAX_LIMIT = 100

export class GetRecentMovementsUseCase {
  constructor(
    private readonly portfolioRepository: IPortfolioRepository,
    private readonly db: PrismaClient,
  ) {}

  async execute(
    userId: string,
    portfolioId: string,
    options: { limit?: number; cursor?: string },
  ): Promise<{ items: Movement[]; next_cursor: string | null }> {
    const portfolio = await this.portfolioRepository.findById(portfolioId)
    if (!portfolio) throw new NotFoundError('Portfolio')
    if (portfolio.user_id !== userId) throw new UnauthorizedError('Access denied')

    const limit = Math.min(options.limit ?? DEFAULT_LIMIT, MAX_LIMIT)
    const cursorDate = options.cursor ? new Date(options.cursor) : undefined
    const dateFilter = cursorDate ? { lt: cursorDate } : undefined

    // Portfolio-scoped feed shows only orders (BUY/SELL) for this portfolio.
    // For the full user feed including DEPOSIT/WITHDRAWAL, use GET /movements.
    const rawOrders = await this.db.order.findMany({
      where: { portfolio_id: portfolioId, date: dateFilter },
      include: { stock: { select: { ticker: true } } },
      orderBy: { date: 'desc' },
      take: limit,
    })

    const movements: Movement[] = rawOrders.map((o: (typeof rawOrders)[number]) => ({
      id: o.id,
      kind: o.type as 'BUY' | 'SELL',
      amount: o.total_amount.toString(),
      date: o.date,
      description: null,
      ticker: o.stock.ticker,
      quantity: o.quantity.toString(),
      created_at: o.created_at,
    }))

    movements.sort((a, b) => b.date.getTime() - a.date.getTime())
    const paged = movements.slice(0, limit)

    const nextCursor = paged.length === limit ? paged[paged.length - 1].date.toISOString() : null

    return { items: paged, next_cursor: nextCursor }
  }
}
