export type TransactionType = 'DEPOSIT' | 'WITHDRAWAL'

export interface Transaction {
  id: string
  user_id: string
  type: TransactionType
  amount: string
  date: Date
  description: string | null
  created_at: Date
}
