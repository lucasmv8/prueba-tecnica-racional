import type { PrismaClient } from '@prisma/client'

import type { CreateWatchlistItemProps, WatchlistItem } from '../domain/watchlist-item.entity'
import type { IWatchlistRepository } from '../domain/watchlist.repository'

export class PrismaWatchlistRepository implements IWatchlistRepository {
  constructor(private readonly db: PrismaClient) {}

  async findByUserId(userId: string): Promise<WatchlistItem[]> {
    const rows = await this.db.watchlistItem.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'asc' },
    })
    return rows.map(this.toEntity)
  }

  async findByUserIdAndTicker(userId: string, ticker: string): Promise<WatchlistItem | null> {
    const row = await this.db.watchlistItem.findUnique({
      where: { user_id_ticker: { user_id: userId, ticker } },
    })
    return row ? this.toEntity(row) : null
  }

  async create(props: CreateWatchlistItemProps): Promise<WatchlistItem> {
    const row = await this.db.watchlistItem.create({
      data: {
        user_id: props.user_id,
        ticker: props.ticker,
        notes: props.notes,
        target_price: props.target_price ?? null,
      },
    })
    return this.toEntity(row)
  }

  async deleteByUserIdAndTicker(userId: string, ticker: string): Promise<void> {
    await this.db.watchlistItem.delete({
      where: { user_id_ticker: { user_id: userId, ticker } },
    })
  }

  private toEntity(row: {
    id: string
    user_id: string
    ticker: string
    notes: string | null
    target_price: { toString(): string } | null
    created_at: Date
  }): WatchlistItem {
    return {
      id: row.id,
      user_id: row.user_id,
      ticker: row.ticker,
      notes: row.notes,
      target_price: row.target_price ? row.target_price.toString() : null,
      created_at: row.created_at,
    }
  }
}
