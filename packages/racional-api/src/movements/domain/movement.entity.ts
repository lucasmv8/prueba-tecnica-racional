export type MovementKind = 'DEPOSIT' | 'WITHDRAWAL' | 'BUY' | 'SELL'

export interface Movement {
  id: string
  kind: MovementKind
  amount: string
  date: Date
  description: string | null
  ticker: string | null
  quantity: string | null
  created_at: Date
}
