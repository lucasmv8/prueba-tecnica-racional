import { describe, it, expect, vi, beforeEach } from 'vitest'

import { RemoveWatchlistItemUseCase } from '../remove-watchlist-item.use-case'
import { NotFoundError } from '../../../../shared/domain/errors/not-found.error'
import type { IWatchlistRepository } from '../../../domain/watchlist.repository'

const USER_ID = 'user-1'
const TICKER = 'AAPL'

const mockItem = {
  id: 'wi-1',
  user_id: USER_ID,
  ticker: TICKER,
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

describe('RemoveWatchlistItemUseCase', () => {
  let repo: IWatchlistRepository
  let useCase: RemoveWatchlistItemUseCase

  beforeEach(() => {
    repo = createMockRepo()
    useCase = new RemoveWatchlistItemUseCase(repo)
  })

  it('deletes the item when it exists', async () => {
    vi.mocked(repo.findByUserIdAndTicker).mockResolvedValue(mockItem)
    vi.mocked(repo.deleteByUserIdAndTicker).mockResolvedValue()

    await useCase.execute(USER_ID, TICKER)

    expect(repo.findByUserIdAndTicker).toHaveBeenCalledWith(USER_ID, TICKER)
    expect(repo.deleteByUserIdAndTicker).toHaveBeenCalledWith(USER_ID, TICKER)
  })

  it('throws NotFoundError when ticker is not in the watchlist', async () => {
    vi.mocked(repo.findByUserIdAndTicker).mockResolvedValue(null)

    await expect(useCase.execute(USER_ID, TICKER)).rejects.toThrow(NotFoundError)
    expect(repo.deleteByUserIdAndTicker).not.toHaveBeenCalled()
  })
})
