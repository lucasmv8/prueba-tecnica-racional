import { NotFoundError } from '../../../shared/domain/errors/not-found.error'
import type { IWatchlistRepository } from '../../domain/watchlist.repository'

export class RemoveWatchlistItemUseCase {
  constructor(private readonly watchlistRepository: IWatchlistRepository) {}

  async execute(userId: string, ticker: string): Promise<void> {
    const item = await this.watchlistRepository.findByUserIdAndTicker(userId, ticker)
    if (!item) throw new NotFoundError('Elemento de la watchlist')

    await this.watchlistRepository.deleteByUserIdAndTicker(userId, ticker)
  }
}
