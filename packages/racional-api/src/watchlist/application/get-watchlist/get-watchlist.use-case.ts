import Decimal from 'decimal.js'

import type { IStockPriceProvider } from '../../../shared/infrastructure/external/finnhub.client'
import type { IWatchlistRepository } from '../../domain/watchlist.repository'

export interface WatchlistItemWithPrice {
  id: string
  ticker: string
  notes: string | null
  target_price: string | null
  current_price: string | null
  distance_pct: string | null
}

export class GetWatchlistUseCase {
  constructor(
    private readonly watchlistRepository: IWatchlistRepository,
    private readonly priceProvider: IStockPriceProvider,
  ) {}

  async execute(userId: string): Promise<{ items: WatchlistItemWithPrice[] }> {
    const items = await this.watchlistRepository.findByUserId(userId)

    const priceResults = await Promise.allSettled(
      items.map((item) => this.priceProvider.getCurrentPrice(item.ticker)),
    )

    const result: WatchlistItemWithPrice[] = items.map((item, i) => {
      const priceResult = priceResults[i]
      const currentPrice =
        priceResult.status === 'fulfilled' ? new Decimal(priceResult.value) : null

      let distancePct: string | null = null
      if (currentPrice && item.target_price) {
        const target = new Decimal(item.target_price)
        distancePct = target.minus(currentPrice).div(currentPrice).mul(100).toFixed(2)
      }

      return {
        id: item.id,
        ticker: item.ticker,
        notes: item.notes,
        target_price: item.target_price,
        current_price: currentPrice ? currentPrice.toFixed(6) : null,
        distance_pct: distancePct,
      }
    })

    return { items: result }
  }
}
