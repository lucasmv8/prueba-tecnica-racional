import type { PrismaClient } from '@prisma/client'

import type {
  CreatePortfolioProps,
  Portfolio,
  UpdatePortfolioProps,
} from '../domain/portfolio.entity'
import type {
  IPortfolioRepository,
  PortfolioHoldingWithStock,
} from '../domain/portfolio.repository'

export class PrismaPortfolioRepository implements IPortfolioRepository {
  constructor(private readonly db: PrismaClient) {}

  async findById(id: string): Promise<Portfolio | null> {
    return this.db.portfolio.findUnique({ where: { id } })
  }

  async findByUserId(userId: string): Promise<Portfolio[]> {
    return this.db.portfolio.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'asc' },
    })
  }

  async create(props: CreatePortfolioProps): Promise<Portfolio> {
    return this.db.portfolio.create({ data: props })
  }

  async update(id: string, props: UpdatePortfolioProps): Promise<Portfolio> {
    return this.db.portfolio.update({ where: { id }, data: props })
  }

  async findHoldingsByPortfolioId(portfolioId: string): Promise<PortfolioHoldingWithStock[]> {
    const holdings = await this.db.portfolioHolding.findMany({
      where: { portfolio_id: portfolioId },
      include: { stock: { select: { ticker: true, name: true, currency: true } } },
    })

    return holdings.map((h: (typeof holdings)[number]) => ({
      ...h,
      quantity: h.quantity.toString(),
      average_cost: h.average_cost.toString(),
    }))
  }
}
