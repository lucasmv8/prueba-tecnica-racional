import type { CreateWatchlistItemProps, WatchlistItem } from './watchlist-item.entity'

export interface IWatchlistRepository {
  findByUserId(userId: string): Promise<WatchlistItem[]>
  create(props: CreateWatchlistItemProps): Promise<WatchlistItem>
  findByUserIdAndTicker(userId: string, ticker: string): Promise<WatchlistItem | null>
  deleteByUserIdAndTicker(userId: string, ticker: string): Promise<void>
}
