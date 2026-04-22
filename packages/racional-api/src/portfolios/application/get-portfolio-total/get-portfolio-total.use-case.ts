import type { PrismaClient } from '@prisma/client'
import Decimal from 'decimal.js'

import { NotFoundError } from '../../../shared/domain/errors/not-found.error'
import { UnauthorizedError } from '../../../shared/domain/errors/unauthorized.error'
import type { IStockPriceProvider } from '../../../shared/infrastructure/external/finnhub.client'
import type { IPortfolioRepository } from '../../domain/portfolio.repository'

export interface HoldingWithPrice {
  stock_id: string
  ticker: string
  name: string
  quantity: string
  average_cost: string
  current_price: string
  market_value: string
  pnl: string
  pnl_pct: string
}

export interface PortfolioTotalResult {
  portfolio_id: string
  currency: string
  total_value: string
  total_cost: string
  total_pnl: string
  total_pnl_pct: string
  holdings: HoldingWithPrice[]
  calculated_at: string
}

export class GetPortfolioTotalUseCase {
  constructor(
    private readonly portfolioRepository: IPortfolioRepository,
    private readonly priceProvider: IStockPriceProvider,
    private readonly db: PrismaClient,
  ) {}

  async execute(userId: string, portfolioId: string): Promise<PortfolioTotalResult> {
    const portfolio = await this.portfolioRepository.findById(portfolioId)
    if (!portfolio) throw new NotFoundError('Portfolio')
    if (portfolio.user_id !== userId) throw new UnauthorizedError('Access denied')

    const rawHoldings = await this.portfolioRepository.findHoldingsByPortfolioId(portfolioId)
    const activeHoldings = rawHoldings.filter((h) => new Decimal(h.quantity).greaterThan(0))

    // Fetch all prices in parallel; fall back to average_cost if Finnhub fails
    const priceResults = await Promise.allSettled(
      activeHoldings.map((h) => this.priceProvider.getCurrentPrice(h.stock.ticker)),
    )

    let holdingsValue = new Decimal(0)
    let totalCost = new Decimal(0)

    const holdings: HoldingWithPrice[] = activeHoldings.map((h, i) => {
      const qty = new Decimal(h.quantity)
      const avgCost = new Decimal(h.average_cost)
      const cost = qty.mul(avgCost)

      const priceResult = priceResults[i]
      const currentPrice =
        priceResult.status === 'fulfilled' ? new Decimal(priceResult.value) : avgCost

      const marketValue = qty.mul(currentPrice)
      const pnl = marketValue.minus(cost)
      const pnlPct = cost.isZero() ? new Decimal(0) : pnl.div(cost).mul(100)

      holdingsValue = holdingsValue.plus(marketValue)
      totalCost = totalCost.plus(cost)

      return {
        stock_id: h.stock_id,
        ticker: h.stock.ticker,
        name: h.stock.name,
        quantity: qty.toFixed(6),
        average_cost: avgCost.toFixed(6),
        current_price: currentPrice.toFixed(6),
        market_value: marketValue.toFixed(6),
        pnl: pnl.toFixed(6),
        pnl_pct: pnlPct.toFixed(4),
      }
    })

    // Portfolio total = market value of holdings only (cash lives in the user's wallet)
    const totalValue = holdingsValue
    const totalPnl = totalCost.isZero() ? new Decimal(0) : holdingsValue.minus(totalCost)
    const totalPnlPct = totalCost.isZero() ? new Decimal(0) : totalPnl.div(totalCost).mul(100)

    return {
      portfolio_id: portfolioId,
      currency: portfolio.currency,
      total_value: totalValue.toFixed(6),
      total_cost: totalCost.toFixed(6),
      total_pnl: totalPnl.toFixed(6),
      total_pnl_pct: totalPnlPct.toFixed(4),
      holdings,
      calculated_at: new Date().toISOString(),
    }
  }
}
