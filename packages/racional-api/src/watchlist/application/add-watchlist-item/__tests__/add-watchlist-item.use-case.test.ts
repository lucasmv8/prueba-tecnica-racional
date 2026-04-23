import { describe, it, expect, vi, beforeEach } from 'vitest'

import { AddWatchlistItemUseCase } from '../add-watchlist-item.use-case'
import { BusinessError } from '../../../../shared/domain/errors/business.error'
import type { IWatchlistRepository } from '../../../domain/watchlist.repository'

const USER_ID = 'user-1'

const mockItem = {
  id: 'wi-1',
  user_id: USER_ID,
  ticker: 'AAPL',
  notes: null,
  target_price: null,
  created_at: new Date(),
}

function createMockRepo(): IWatchlistRepository {
  return {
    findByUserId: vi.fn(),
    create: vi.fn(),
    findByUserIdAndTicker: vi.fn(),
    deleteByUserIdAndTicker: vi.fn(),
  }
}

describe('AddWatchlistItemUseCase', () => {
  let repo: IWatchlistRepository
  let useCase: AddWatchlistItemUseCase

  beforeEach(() => {
    repo = createMockRepo()
    useCase = new AddWatchlistItemUseCase(repo)
  })

  it('creates the watchlist item when ticker is not already tracked', async () => {
    vi.mocked(repo.findByUserIdAndTicker).mockResolvedValue(null)
    vi.mocked(repo.create).mockResolvedValue(mockItem)

    const result = await useCase.execute(USER_ID, { ticker: 'AAPL' })

    expect(repo.findByUserIdAndTicker).toHaveBeenCalledWith(USER_ID, 'AAPL')
    expect(repo.create).toHaveBeenCalledWith({
      user_id: USER_ID,
      ticker: 'AAPL',
      notes: undefined,
      target_price: undefined,
    })
    expect(result).toEqual(mockItem)
  })

  it('passes optional fields to the repository', async () => {
    vi.mocked(repo.findByUserIdAndTicker).mockResolvedValue(null)
    vi.mocked(repo.create).mockResolvedValue({
      ...mockItem,
      notes: 'interesting',
      target_price: '200.00',
    })

    await useCase.execute(USER_ID, { ticker: 'AAPL', notes: 'interesting', target_price: '200.00' })

    expect(repo.create).toHaveBeenCalledWith({
      user_id: USER_ID,
      ticker: 'AAPL',
      notes: 'interesting',
      target_price: '200.00',
    })
  })

  it('throws BusinessError when ticker is already in the watchlist', async () => {
    vi.mocked(repo.findByUserIdAndTicker).mockResolvedValue(mockItem)

    await expect(useCase.execute(USER_ID, { ticker: 'AAPL' })).rejects.toThrow(BusinessError)
    expect(repo.create).not.toHaveBeenCalled()
  })
})
