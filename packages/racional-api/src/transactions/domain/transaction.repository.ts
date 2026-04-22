import type { Transaction, TransactionType } from './transaction.entity'

export interface CreateTransactionProps {
  user_id: string
  type: TransactionType
  amount: string
  date: Date
  description?: string
}

export interface ITransactionRepository {
  create(props: CreateTransactionProps): Promise<Transaction>
}
