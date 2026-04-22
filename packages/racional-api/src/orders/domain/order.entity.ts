export type OrderType = 'BUY' | 'SELL'

export interface Order {
  id: string
  portfolio_id: string
  stock_id: string
  type: OrderType
  quantity: string
  price_per_unit: string
  total_amount: string
  date: Date
  created_at: Date
  ticker?: string
}
