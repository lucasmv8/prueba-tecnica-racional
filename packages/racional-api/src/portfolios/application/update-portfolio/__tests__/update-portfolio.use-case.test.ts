import { describe, it, expect, vi, beforeEach } from 'vitest'

import { UpdatePortfolioUseCase } from '../update-portfolio.use-case'
import { NotFoundError } from '../../../../shared/domain/errors/not-found.error'
import { UnauthorizedError } from '../../../../shared/domain/errors/unauthorized.error'
import type { IPortfolioRepository } from '../../../domain/portfolio.repository'

const USER_ID = 'user-1'
const PORTFOLIO_ID = 'p-1'

const mockPortfolio = {
  id: PORTFOLIO_ID,
  user_id: USER_ID,
  name: 'Old Name',
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

describe('UpdatePortfolioUseCase', () => {
  let repo: IPortfolioRepository
  let useCase: UpdatePortfolioUseCase

  beforeEach(() => {
    repo = createMockPortfolioRepo()
    useCase = new UpdatePortfolioUseCase(repo)
  })

  it('updates and returns the portfolio', async () => {
    vi.mocked(repo.findById).mockResolvedValue(mockPortfolio)
    const updated = { ...mockPortfolio, name: 'New Name' }
    vi.mocked(repo.update).mockResolvedValue(updated)

    const result = await useCase.execute(USER_ID, PORTFOLIO_ID, { name: 'New Name' })

    expect(repo.update).toHaveBeenCalledWith(PORTFOLIO_ID, { name: 'New Name' })
    expect(result.name).toBe('New Name')
  })

  it('throws NotFoundError when portfolio does not exist', async () => {
    vi.mocked(repo.findById).mockResolvedValue(null)

    await expect(useCase.execute(USER_ID, PORTFOLIO_ID, {})).rejects.toThrow(NotFoundError)
    expect(repo.update).not.toHaveBeenCalled()
  })

  it('throws UnauthorizedError when user does not own the portfolio', async () => {
    vi.mocked(repo.findById).mockResolvedValue({ ...mockPortfolio, user_id: 'other-user' })

    await expect(useCase.execute(USER_ID, PORTFOLIO_ID, {})).rejects.toThrow(UnauthorizedError)
    expect(repo.update).not.toHaveBeenCalled()
  })
})
