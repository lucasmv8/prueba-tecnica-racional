import type { PrismaClient } from '@prisma/client'
import Decimal from 'decimal.js'

import { BusinessError } from '../../../shared/domain/errors/business.error'
import { calculateAvailableBalance } from '../../../shared/domain/calculate-available-balance'
import type { ITransactionRepository } from '../../domain/transaction.repository'

import type { RegisterTransactionDto } from './register-transaction.dto'

export class RegisterTransactionUseCase {
  constructor(
    private readonly transactionRepository: ITransactionRepository,
    private readonly db: PrismaClient,
  ) {}

  async execute(userId: string, dto: RegisterTransactionDto) {
    const amount = new Decimal(dto.amount)
    if (amount.lessThanOrEqualTo(0)) {
      throw new BusinessError('Amount must be greater than zero')
    }

    if (dto.type === 'WITHDRAWAL') {
      const balance = await calculateAvailableBalance(this.db, userId)
      if (balance.lessThan(amount)) {
        throw new BusinessError(
          `Insufficient balance: available ${balance.toFixed(2)}, requested ${amount.toFixed(2)}`,
        )
      }
    }

    return this.transactionRepository.create({
      user_id: userId,
      type: dto.type,
      amount: amount.toFixed(6),
      date: new Date(dto.date),
      description: dto.description,
    })
  }
}
