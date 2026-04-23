import { describe, it, expect, vi, beforeEach } from 'vitest'

import { GetWatchlistUseCase } from '../get-watchlist.use-case'
import type { IWatchlistRepository } from '../../../domain/watchlist.repository'
import type { IStockPriceProvider } from '../../../../shared/infrastructure/external/finnhub.client'

const USER_ID = 'user-1'

function makeItem(ticker: string, target_price: string | null = null) {
  return {
    id: `wi-${ticker}`,
    user_id: USER_ID,
    ticker,
    notes: null,
    target_price,
    created_at: new Date(),
  }
}

function createMockRepo(): IWatchlistRepository {
  return {
    findByUserId: vi.fn(),
    create: vi.fn(),
    findByUserIdAndTicker: vi.fn(),
    deleteByUserIdAndTicker: vi.fn(),
  }
}

function createMockPriceProvider(): IStockPriceProvider {
  return {
    getCurrentPrice: vi.fn(),
    searchSymbols: vi.fn(),
  }
}

describe('GetWatchlistUseCase', () => {
  let repo: IWatchlistRepository
  let priceProvider: IStockPriceProvider
  let useCase: GetWatchlistUseCase

  beforeEach(() => {
    repo = createMockRepo()
    priceProvider = createMockPriceProvider()
    useCase = new GetWatchlistUseCase(repo, priceProvider)
  })

  it('returns empty items array when watchlist is empty', async () => {
    vi.mocked(repo.findByUserId).mockResolvedValue([])

    const result = await useCase.execute(USER_ID)

    expect(result).toEqual({ items: [] })
    expect(priceProvider.getCurrentPrice).not.toHaveBeenCalled()
  })

  it('returns current_price and null distance_pct when no target_price set', async () => {
    vi.mocked(repo.findByUserId).mockResolvedValue([makeItem('AAPL', null)])
    vi.mocked(priceProvider.getCurrentPrice).mockResolvedValue(150)

    const result = await useCase.execute(USER_ID)

    expect(result.items).toHaveLength(1)
    expect(result.items[0].current_price).toBe('150.000000')
    expect(result.items[0].distance_pct).toBeNull()
  })

  it('calculates distance_pct correctly when target_price is set', async () => {
    vi.mocked(repo.findByUserId).mockResolvedValue([makeItem('AAPL', '200.00')])
    vi.mocked(priceProvider.getCurrentPrice).mockResolvedValue(160)

    const result = await useCase.execute(USER_ID)

    // distance_pct = (200 - 160) / 160 * 100 = 25.00
    expect(result.items[0].distance_pct).toBe('25.00')
  })

  it('returns negative distance_pct when current price is above target', async () => {
    vi.mocked(repo.findByUserId).mockResolvedValue([makeItem('AAPL', '100.00')])
    vi.mocked(priceProvider.getCurrentPrice).mockResolvedValue(125)

    const result = await useCase.execute(USER_ID)

    // distance_pct = (100 - 125) / 125 * 100 = -20.00
    expect(result.items[0].distance_pct).toBe('-20.00')
  })

  it('returns null current_price and null distance_pct when price provider fails', async () => {
    vi.mocked(repo.findByUserId).mockResolvedValue([makeItem('AAPL', '200.00')])
    vi.mocked(priceProvider.getCurrentPrice).mockRejectedValue(new Error('API down'))

    const result = await useCase.execute(USER_ID)

    expect(result.items[0].current_price).toBeNull()
    expect(result.items[0].distance_pct).toBeNull()
  })

  it('fetches prices in parallel and handles mixed success/failure', async () => {
    vi.mocked(repo.findByUserId).mockResolvedValue([
      makeItem('AAPL', '200.00'),
      makeItem('GOOG', '150.00'),
    ])
    vi.mocked(priceProvider.getCurrentPrice)
      .mockResolvedValueOnce(180) // AAPL succeeds
      .mockRejectedValueOnce(new Error('API down')) // GOOG fails

    const result = await useCase.execute(USER_ID)

    expect(result.items).toHaveLength(2)
    expect(result.items[0].current_price).toBe('180.000000')
    expect(result.items[0].distance_pct).toBe('11.11') // (200-180)/180*100
    expect(result.items[1].current_price).toBeNull()
    expect(result.items[1].distance_pct).toBeNull()
  })

  it('preserves item metadata fields in the response', async () => {
    const item = { ...makeItem('TSLA', '300.00'), notes: 'long-term hold' }
    vi.mocked(repo.findByUserId).mockResolvedValue([item])
    vi.mocked(priceProvider.getCurrentPrice).mockResolvedValue(250)

    const result = await useCase.execute(USER_ID)

    expect(result.items[0].id).toBe('wi-TSLA')
    expect(result.items[0].ticker).toBe('TSLA')
    expect(result.items[0].notes).toBe('long-term hold')
    expect(result.items[0].target_price).toBe('300.00')
  })
})
