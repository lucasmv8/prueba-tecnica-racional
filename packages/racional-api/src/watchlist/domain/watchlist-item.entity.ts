export interface WatchlistItem {
  id: string
  user_id: string
  ticker: string
  notes: string | null
  target_price: string | null
  created_at: Date
}

export interface CreateWatchlistItemProps {
  user_id: string
  ticker: string
  notes?: string
  target_price?: string
}
