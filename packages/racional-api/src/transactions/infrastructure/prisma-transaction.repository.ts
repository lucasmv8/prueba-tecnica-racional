import type { PrismaClient } from '@prisma/client'

import type { Transaction } from '../domain/transaction.entity'
import type {
  CreateTransactionProps,
  ITransactionRepository,
} from '../domain/transaction.repository'

export class PrismaTransactionRepository implements ITransactionRepository {
  constructor(private readonly db: PrismaClient) {}

  async create(props: CreateTransactionProps): Promise<Transaction> {
    const tx = await this.db.transaction.create({
      data: {
        user_id: props.user_id,
        type: props.type,
        amount: props.amount,
        date: props.date,
        description: props.description,
      },
    })
    return { ...tx, amount: tx.amount.toString() }
  }
}
