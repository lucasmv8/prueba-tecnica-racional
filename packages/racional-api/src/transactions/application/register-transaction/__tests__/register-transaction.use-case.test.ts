import { describe, it, expect, vi, beforeEach } from 'vitest'
import Decimal from 'decimal.js'
import type { PrismaClient } from '@prisma/client'

import { RegisterTransactionUseCase } from '../register-transaction.use-case'
import { BusinessError } from '../../../../shared/domain/errors/business.error'
import { calculateAvailableBalance } from '../../../../shared/domain/calculate-available-balance'
import type { ITransactionRepository } from '../../../domain/transaction.repository'

vi.mock('../../../../shared/domain/calculate-available-balance')

const mockTransaction = {
  id: 'tx-1',
  user_id: 'user-1',
  type: 'DEPOSIT' as const,
  amount: '1000.000000',
  date: new Date(),
  description: null,
  created_at: new Date(),
}

function createMockTransactionRepo(): ITransactionRepository {
  return { create: vi.fn() }
}

describe('RegisterTransactionUseCase', () => {
  let repo: ITransactionRepository
  let useCase: RegisterTransactionUseCase

  beforeEach(() => {
    repo = createMockTransactionRepo()
    useCase = new RegisterTransactionUseCase(repo, {} as PrismaClient)
    vi.mocked(repo.create).mockResolvedValue(mockTransaction)
    vi.mocked(calculateAvailableBalance).mockResolvedValue(new Decimal('5000'))
  })

  it('registers a DEPOSIT and returns the transaction', async () => {
    const result = await useCase.execute('user-1', {
      type: 'DEPOSIT',
      amount: '1000',
      date: new Date().toISOString(),
    })

    expect(result.type).toBe('DEPOSIT')
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'DEPOSIT', amount: '1000.000000', user_id: 'user-1' }),
    )
  })

  it('formats amount to 6 decimal places', async () => {
    await useCase.execute('user-1', {
      type: 'DEPOSIT',
      amount: '500.5',
      date: new Date().toISOString(),
    })

    expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ amount: '500.500000' }))
  })

  it('registers a WITHDRAWAL when balance is sufficient', async () => {
    vi.mocked(calculateAvailableBalance).mockResolvedValue(new Decimal('2000'))

    await useCase.execute('user-1', {
      type: 'WITHDRAWAL',
      amount: '500',
      date: new Date().toISOString(),
    })

    expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ type: 'WITHDRAWAL' }))
  })

  it('passes description to the repository', async () => {
    await useCase.execute('user-1', {
      type: 'DEPOSIT',
      amount: '100',
      date: new Date().toISOString(),
      description: 'Salary',
    })

    expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ description: 'Salary' }))
  })

  it('throws BusinessError when amount is zero', async () => {
    await expect(
      useCase.execute('user-1', { type: 'DEPOSIT', amount: '0', date: new Date().toISOString() }),
    ).rejects.toThrow(BusinessError)

    expect(repo.create).not.toHaveBeenCalled()
  })

  it('throws BusinessError when WITHDRAWAL exceeds available balance', async () => {
    vi.mocked(calculateAvailableBalance).mockResolvedValue(new Decimal('100'))

    await expect(
      useCase.execute('user-1', {
        type: 'WITHDRAWAL',
        amount: '500',
        date: new Date().toISOString(),
      }),
    ).rejects.toThrow(BusinessError)
  })

  it('includes available and requested amounts in the error message', async () => {
    vi.mocked(calculateAvailableBalance).mockResolvedValue(new Decimal('100'))

    await expect(
      useCase.execute('user-1', {
        type: 'WITHDRAWAL',
        amount: '500',
        date: new Date().toISOString(),
      }),
    ).rejects.toThrow(/disponible \$100\.00, solicitado \$500\.00/)
  })

  it('does not check balance for DEPOSIT', async () => {
    await useCase.execute('user-1', {
      type: 'DEPOSIT',
      amount: '9999',
      date: new Date().toISOString(),
    })

    expect(calculateAvailableBalance).not.toHaveBeenCalled()
  })
})
