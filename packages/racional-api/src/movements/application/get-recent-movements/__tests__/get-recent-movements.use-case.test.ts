import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { PrismaClient } from '@prisma/client'

import { GetRecentMovementsUseCase } from '../get-recent-movements.use-case'
import { NotFoundError } from '../../../../shared/domain/errors/not-found.error'
import { UnauthorizedError } from '../../../../shared/domain/errors/unauthorized.error'
import type { IPortfolioRepository } from '../../../../portfolios/domain/portfolio.repository'

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
  return { order: { findMany: vi.fn() } }
}

const mockOrderDate = new Date('2024-01-15T10:00:00Z')
const mockOrder = {
  id: 'order-1',
  type: 'BUY',
  total_amount: { toString: () => '1500' },
  quantity: { toString: () => '10' },
  date: mockOrderDate,
  description: null,
  created_at: mockOrderDate,
  stock: { ticker: 'AAPL' },
}

describe('GetRecentMovementsUseCase', () => {
  let repo: IPortfolioRepository
  let db: ReturnType<typeof createMockDb>
  let useCase: GetRecentMovementsUseCase

  beforeEach(() => {
    repo = createMockPortfolioRepo()
    db = createMockDb()
    useCase = new GetRecentMovementsUseCase(repo, db as unknown as PrismaClient)
    vi.mocked(repo.findById).mockResolvedValue(mockPortfolio)
    db.order.findMany.mockResolvedValue([mockOrder])
  })

  it('returns portfolio-scoped orders mapped as movements', async () => {
    const result = await useCase.execute(USER_ID, PORTFOLIO_ID, {})

    expect(result.items).toHaveLength(1)
    expect(result.items[0].kind).toBe('BUY')
    expect(result.items[0].ticker).toBe('AAPL')
    expect(result.items[0].quantity).toBe('10')
    expect(result.items[0].amount).toBe('1500')
    expect(result.items[0].description).toBeNull()
  })

  it('returns null next_cursor when fewer items than limit', async () => {
    const result = await useCase.execute(USER_ID, PORTFOLIO_ID, { limit: 20 })

    expect(result.next_cursor).toBeNull()
  })

  it('returns next_cursor equal to the last item date when page is full', async () => {
    const orders = Array.from({ length: 5 }, (_, i) => ({
      ...mockOrder,
      id: `order-${i}`,
      date: new Date(`2024-01-${15 - i}T00:00:00Z`),
    }))
    db.order.findMany.mockResolvedValue(orders)

    const result = await useCase.execute(USER_ID, PORTFOLIO_ID, { limit: 5 })

    expect(result.next_cursor).toBe(orders[4].date.toISOString())
  })

  it('passes cursor as a date lt filter to the query', async () => {
    const cursor = '2024-01-10T00:00:00.000Z'
    await useCase.execute(USER_ID, PORTFOLIO_ID, { cursor })

    expect(db.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ date: { lt: new Date(cursor) } }),
      }),
    )
  })

  it('queries only orders for the given portfolioId', async () => {
    await useCase.execute(USER_ID, PORTFOLIO_ID, {})

    expect(db.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ portfolio_id: PORTFOLIO_ID }),
      }),
    )
  })

  it('throws NotFoundError when portfolio does not exist', async () => {
    vi.mocked(repo.findById).mockResolvedValue(null)

    await expect(useCase.execute(USER_ID, PORTFOLIO_ID, {})).rejects.toThrow(NotFoundError)
  })

  it('throws UnauthorizedError when user does not own the portfolio', async () => {
    vi.mocked(repo.findById).mockResolvedValue({ ...mockPortfolio, user_id: 'other-user' })

    await expect(useCase.execute(USER_ID, PORTFOLIO_ID, {})).rejects.toThrow(UnauthorizedError)
  })
})
