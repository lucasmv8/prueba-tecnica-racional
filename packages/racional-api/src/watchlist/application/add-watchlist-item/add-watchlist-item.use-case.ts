import { BusinessError } from '../../../shared/domain/errors/business.error'
import type { IWatchlistRepository } from '../../domain/watchlist.repository'

import type { AddWatchlistItemDto } from './add-watchlist-item.dto'

export class AddWatchlistItemUseCase {
  constructor(private readonly watchlistRepository: IWatchlistRepository) {}

  async execute(userId: string, dto: AddWatchlistItemDto) {
    const existing = await this.watchlistRepository.findByUserIdAndTicker(userId, dto.ticker)
    if (existing) throw new BusinessError(`${dto.ticker} ya está en tu watchlist`)

    return this.watchlistRepository.create({
      user_id: userId,
      ticker: dto.ticker,
      notes: dto.notes,
      target_price: dto.target_price,
    })
  }
}
