import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { PrismaClient } from '@prisma/client'

import { GetPortfolioTotalUseCase } from '../get-portfolio-total.use-case'
import { NotFoundError } from '../../../../shared/domain/errors/not-found.error'
import { UnauthorizedError } from '../../../../shared/domain/errors/unauthorized.error'
import type { IPortfolioRepository } from '../../../domain/portfolio.repository'
import type { IStockPriceProvider } from '../../../../shared/infrastructure/external/finnhub.client'

const USER_ID = 'user-1'
const PORTFOLIO_ID = 'p-1'

const mockPortfolio = {
  id: PORTFOLIO_ID,
  user_id: USER_ID,
  name: 'Test Portfolio',
  description: null,
  currency: 'USD',
  created_at: new Date(),
  updated_at: new Date(),
}

const mockHolding = {
  id: 'h-1',
  portfolio_id: PORTFOLIO_ID,
  stock_id: 's-1',
  quantity: '10.000000',
  average_cost: '100.000000',
  stock: { ticker: 'AAPL', name: 'Apple Inc.', currency: 'USD' },
}

function createMockPortfolioRepo(): IPortfolioRepository {
  return {
    findById: vi.fn(),
    findByUserId: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    findHoldingsByPortfolioId: vi.fn(),
  }
}

function createMockPriceProvider(): IStockPriceProvider {
  return {
    getCurrentPrice: vi.fn(),
    searchSymbols: vi.fn(),
  }
}

describe('GetPortfolioTotalUseCase', () => {
  let repo: IPortfolioRepository
  let priceProvider: IStockPriceProvider
  let useCase: GetPortfolioTotalUseCase

  beforeEach(() => {
    repo = createMockPortfolioRepo()
    priceProvider = createMockPriceProvider()
    useCase = new GetPortfolioTotalUseCase(repo, priceProvider, {} as PrismaClient)
    vi.mocked(repo.findById).mockResolvedValue(mockPortfolio)
  })

  it('calculates totals correctly with live price', async () => {
    vi.mocked(repo.findHoldingsByPortfolioId).mockResolvedValue([mockHolding])
    vi.mocked(priceProvider.getCurrentPrice).mockResolvedValue(150)

    const result = await useCase.execute(USER_ID, PORTFOLIO_ID)

    // qty=10, avg_cost=100, current_price=150
    // market_value=1500, cost=1000, pnl=500, pnl_pct=50%
    expect(result.total_value).toBe('1500.000000')
    expect(result.total_cost).toBe('1000.000000')
    expect(result.total_pnl).toBe('500.000000')
    expect(result.total_pnl_pct).toBe('50.0000')
    expect(result.holdings).toHaveLength(1)
    expect(result.holdings[0].current_price).toBe('150.000000')
    expect(result.holdings[0].pnl).toBe('500.000000')
    expect(result.holdings[0].pnl_pct).toBe('50.0000')
  })

  it('falls back to average_cost when price provider fails', async () => {
    vi.mocked(repo.findHoldingsByPortfolioId).mockResolvedValue([mockHolding])
    vi.mocked(priceProvider.getCurrentPrice).mockRejectedValue(new Error('API unavailable'))

    const result = await useCase.execute(USER_ID, PORTFOLIO_ID)

    // current_price falls back to average_cost=100, so pnl=0
    expect(result.holdings[0].current_price).toBe('100.000000')
    expect(result.total_pnl).toBe('0.000000')
    expect(result.total_pnl_pct).toBe('0.0000')
  })

  it('returns zero totals for an empty portfolio', async () => {
    vi.mocked(repo.findHoldingsByPortfolioId).mockResolvedValue([])

    const result = await useCase.execute(USER_ID, PORTFOLIO_ID)

    expect(result.total_value).toBe('0.000000')
    expect(result.total_cost).toBe('0.000000')
    expect(result.total_pnl).toBe('0.000000')
    expect(result.total_pnl_pct).toBe('0.0000')
    expect(result.holdings).toHaveLength(0)
  })

  it('aggregates multiple holdings correctly', async () => {
    const holdings = [
      {
        ...mockHolding,
        stock_id: 's-1',
        quantity: '10.000000',
        average_cost: '100.000000',
        stock: { ticker: 'AAPL', name: 'Apple', currency: 'USD' },
      },
      {
        ...mockHolding,
        id: 'h-2',
        stock_id: 's-2',
        quantity: '5.000000',
        average_cost: '200.000000',
        stock: { ticker: 'GOOG', name: 'Google', currency: 'USD' },
      },
    ]
    vi.mocked(repo.findHoldingsByPortfolioId).mockResolvedValue(holdings)
    vi.mocked(priceProvider.getCurrentPrice)
      .mockResolvedValueOnce(110) // AAPL: market_value=1100, cost=1000, pnl=100
      .mockResolvedValueOnce(190) // GOOG: market_value=950,  cost=1000, pnl=-50

    const result = await useCase.execute(USER_ID, PORTFOLIO_ID)

    expect(result.total_value).toBe('2050.000000') // 1100 + 950
    expect(result.total_cost).toBe('2000.000000') // 1000 + 1000
    expect(result.total_pnl).toBe('50.000000') // 2050 - 2000
    expect(result.holdings).toHaveLength(2)
  })

  it('returns pnl_pct of 0 when average_cost is zero (avoids division by zero)', async () => {
    const freeHolding = { ...mockHolding, average_cost: '0.000000' }
    vi.mocked(repo.findHoldingsByPortfolioId).mockResolvedValue([freeHolding])
    vi.mocked(priceProvider.getCurrentPrice).mockResolvedValue(50)

    const result = await useCase.execute(USER_ID, PORTFOLIO_ID)

    expect(result.holdings[0].pnl_pct).toBe('0.0000')
  })

  it('skips holdings with zero quantity', async () => {
    const zeroHolding = { ...mockHolding, quantity: '0.000000' }
    vi.mocked(repo.findHoldingsByPortfolioId).mockResolvedValue([zeroHolding])

    const result = await useCase.execute(USER_ID, PORTFOLIO_ID)

    expect(result.holdings).toHaveLength(0)
    expect(priceProvider.getCurrentPrice).not.toHaveBeenCalled()
  })

  it('throws NotFoundError when portfolio does not exist', async () => {
    vi.mocked(repo.findById).mockResolvedValue(null)

    await expect(useCase.execute(USER_ID, PORTFOLIO_ID)).rejects.toThrow(NotFoundError)
  })

  it('throws UnauthorizedError when user does not own the portfolio', async () => {
    vi.mocked(repo.findById).mockResolvedValue({ ...mockPortfolio, user_id: 'other-user' })

    await expect(useCase.execute(USER_ID, PORTFOLIO_ID)).rejects.toThrow(UnauthorizedError)
  })
})
