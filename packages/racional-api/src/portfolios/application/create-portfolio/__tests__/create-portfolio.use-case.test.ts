import { describe, it, expect, vi, beforeEach } from 'vitest'

import { CreatePortfolioUseCase } from '../create-portfolio.use-case'
import type { IPortfolioRepository } from '../../../domain/portfolio.repository'

const mockPortfolio = {
  id: 'p-1',
  user_id: 'user-1',
  name: 'My Portfolio',
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

describe('CreatePortfolioUseCase', () => {
  let repo: IPortfolioRepository
  let useCase: CreatePortfolioUseCase

  beforeEach(() => {
    repo = createMockPortfolioRepo()
    useCase = new CreatePortfolioUseCase(repo)
    vi.mocked(repo.create).mockResolvedValue(mockPortfolio)
  })

  it('creates a portfolio and returns it', async () => {
    const result = await useCase.execute('user-1', { name: 'My Portfolio', currency: 'USD' })

    expect(result).toEqual(mockPortfolio)
  })

  it('injects userId into the create props', async () => {
    await useCase.execute('user-42', { name: 'Test', currency: 'USD' })

    expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ user_id: 'user-42' }))
  })

  it('passes name and currency to the repository', async () => {
    await useCase.execute('user-1', { name: 'Growth', currency: 'EUR' })

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Growth', currency: 'EUR' }),
    )
  })

  it('passes optional description to the repository', async () => {
    await useCase.execute('user-1', { name: 'Test', currency: 'USD', description: 'My desc' })

    expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ description: 'My desc' }))
  })
})
