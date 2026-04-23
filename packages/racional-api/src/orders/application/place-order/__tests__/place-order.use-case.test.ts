import { describe, it, expect, vi, beforeEach } from 'vitest'
import Decimal from 'decimal.js'
import type { PrismaClient } from '@prisma/client'

import { PlaceOrderUseCase } from '../place-order.use-case'
import { BusinessError } from '../../../../shared/domain/errors/business.error'
import { NotFoundError } from '../../../../shared/domain/errors/not-found.error'
import { UnauthorizedError } from '../../../../shared/domain/errors/unauthorized.error'
import { calculateAvailableBalance } from '../../../../shared/domain/calculate-available-balance'
import type { IPortfolioRepository } from '../../../../portfolios/domain/portfolio.repository'

vi.mock('../../../../shared/domain/calculate-available-balance')

const USER_ID = 'user-1'
const PORTFOLIO_ID = 'p-1'
const STOCK_ID = 's-1'

const mockPortfolio = {
  id: PORTFOLIO_ID,
  user_id: USER_ID,
  name: 'Test Portfolio',
  description: null,
  currency: 'USD',
  created_at: new Date(),
  updated_at: new Date(),
}

const mockStock = { id: STOCK_ID, ticker: 'AAPL', name: 'AAPL', currency: 'USD', exchange: null }

const mockOrderRow = {
  id: 'order-1',
  portfolio_id: PORTFOLIO_ID,
  stock_id: STOCK_ID,
  type: 'BUY',
  quantity: { toString: () => '10.000000' },
  price_per_unit: { toString: () => '150.000000' },
  total_amount: { toString: () => '1500.000000' },
  date: new Date(),
  created_at: new Date(),
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

function createMockDb() {
  const db = {
    $transaction: vi.fn(),
    transaction: { groupBy: vi.fn() },
    order: { groupBy: vi.fn(), create: vi.fn() },
    stock: { upsert: vi.fn() },
    portfolioHolding: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  }
  db.$transaction.mockImplementation((fn: (tx: typeof db) => Promise<unknown>) => fn(db))
  return db
}

describe('PlaceOrderUseCase', () => {
  let repo: IPortfolioRepository
  let db: ReturnType<typeof createMockDb>
  let useCase: PlaceOrderUseCase

  const buyDto = {
    type: 'BUY' as const,
    ticker: 'AAPL',
    quantity: '10',
    price_per_unit: '150',
    date: new Date().toISOString(),
  }

  const sellDto = {
    type: 'SELL' as const,
    ticker: 'AAPL',
    quantity: '5',
    price_per_unit: '150',
    date: new Date().toISOString(),
  }

  beforeEach(() => {
    repo = createMockPortfolioRepo()
    db = createMockDb()
    useCase = new PlaceOrderUseCase(repo, db as unknown as PrismaClient)

    vi.mocked(repo.findById).mockResolvedValue(mockPortfolio)
    vi.mocked(calculateAvailableBalance).mockResolvedValue(new Decimal('10000'))
    db.stock.upsert.mockResolvedValue(mockStock)
    db.order.create.mockResolvedValue(mockOrderRow)
    db.portfolioHolding.findUnique.mockResolvedValue(null)
    db.portfolioHolding.create.mockResolvedValue({})
    db.portfolioHolding.update.mockResolvedValue({})
    db.portfolioHolding.delete.mockResolvedValue({})
  })

  describe('BUY', () => {
    it('creates a new holding when none exists', async () => {
      db.portfolioHolding.findUnique.mockResolvedValue(null)

      const result = await useCase.execute(USER_ID, PORTFOLIO_ID, buyDto)

      expect(db.portfolioHolding.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            portfolio_id: PORTFOLIO_ID,
            stock_id: STOCK_ID,
            quantity: '10.000000',
            average_cost: '150.000000',
          }),
        }),
      )
      expect(result.ticker).toBe('AAPL')
    })

    it('updates holding with weighted average cost when one already exists', async () => {
      // existing: 10 shares @ $100
      db.portfolioHolding.findUnique.mockResolvedValue({
        quantity: { toString: () => '10' },
        average_cost: { toString: () => '100' },
      })

      // buy 10 more @ $150
      await useCase.execute(USER_ID, PORTFOLIO_ID, buyDto)

      // new_qty = 20, new_avg = (100*10 + 150*10) / 20 = 125
      expect(db.portfolioHolding.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            quantity: '20.000000',
            average_cost: '125.000000',
          }),
        }),
      )
    })

    it('throws BusinessError when balance is insufficient for BUY', async () => {
      vi.mocked(calculateAvailableBalance).mockResolvedValue(new Decimal('100'))
      // cost = 10 * 150 = 1500 > 100

      await expect(useCase.execute(USER_ID, PORTFOLIO_ID, buyDto)).rejects.toThrow(BusinessError)
      await expect(useCase.execute(USER_ID, PORTFOLIO_ID, buyDto)).rejects.toThrow(
        /Saldo insuficiente/,
      )
    })
  })

  describe('SELL', () => {
    const existingHolding = {
      quantity: { toString: () => '10' },
      average_cost: { toString: () => '100' },
    }

    beforeEach(() => {
      db.portfolioHolding.findUnique.mockResolvedValue(existingHolding)
      db.order.create.mockResolvedValue({ ...mockOrderRow, type: 'SELL' })
    })

    it('reduces holding quantity on a partial sell', async () => {
      await useCase.execute(USER_ID, PORTFOLIO_ID, sellDto) // sell 5 of 10

      expect(db.portfolioHolding.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ quantity: '5.000000' }),
        }),
      )
      expect(db.portfolioHolding.delete).not.toHaveBeenCalled()
    })

    it('deletes holding when selling the entire position', async () => {
      await useCase.execute(USER_ID, PORTFOLIO_ID, { ...sellDto, quantity: '10' })

      expect(db.portfolioHolding.delete).toHaveBeenCalled()
      expect(db.portfolioHolding.update).not.toHaveBeenCalled()
    })

    it('throws BusinessError when no holding exists for the ticker', async () => {
      db.portfolioHolding.findUnique.mockResolvedValue(null)

      await expect(useCase.execute(USER_ID, PORTFOLIO_ID, sellDto)).rejects.toThrow(BusinessError)
      await expect(useCase.execute(USER_ID, PORTFOLIO_ID, sellDto)).rejects.toThrow(
        /No tienes posiciones en AAPL/,
      )
    })

    it('throws BusinessError when selling more than held', async () => {
      await expect(
        useCase.execute(USER_ID, PORTFOLIO_ID, { ...sellDto, quantity: '20' }),
      ).rejects.toThrow(BusinessError)
      await expect(
        useCase.execute(USER_ID, PORTFOLIO_ID, { ...sellDto, quantity: '20' }),
      ).rejects.toThrow(/Posición insuficiente/)
    })
  })

  it('throws NotFoundError when portfolio does not exist', async () => {
    vi.mocked(repo.findById).mockResolvedValue(null)

    await expect(useCase.execute(USER_ID, PORTFOLIO_ID, buyDto)).rejects.toThrow(NotFoundError)
  })

  it('throws UnauthorizedError when user does not own the portfolio', async () => {
    vi.mocked(repo.findById).mockResolvedValue({ ...mockPortfolio, user_id: 'other-user' })

    await expect(useCase.execute(USER_ID, PORTFOLIO_ID, buyDto)).rejects.toThrow(UnauthorizedError)
  })

  it('throws BusinessError when quantity is zero', async () => {
    await expect(
      useCase.execute(USER_ID, PORTFOLIO_ID, { ...buyDto, quantity: '0' }),
    ).rejects.toThrow(BusinessError)
  })

  it('throws BusinessError when price is zero', async () => {
    await expect(
      useCase.execute(USER_ID, PORTFOLIO_ID, { ...buyDto, price_per_unit: '0' }),
    ).rejects.toThrow(BusinessError)
  })
})
