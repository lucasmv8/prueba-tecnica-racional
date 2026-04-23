import { describe, it, expect, vi, beforeEach } from 'vitest'
import Decimal from 'decimal.js'
import type { PrismaClient } from '@prisma/client'

import { GetUserBalanceUseCase } from '../get-user-balance.use-case'
import { calculateAvailableBalance } from '../../../../shared/domain/calculate-available-balance'

vi.mock('../../../../shared/domain/calculate-available-balance')

describe('GetUserBalanceUseCase', () => {
  const mockDb = {} as PrismaClient
  let useCase: GetUserBalanceUseCase

  beforeEach(() => {
    useCase = new GetUserBalanceUseCase(mockDb)
  })

  it('returns balance formatted to 6 decimal places', async () => {
    vi.mocked(calculateAvailableBalance).mockResolvedValue(new Decimal('1234.5'))

    const result = await useCase.execute('user-1')

    expect(result.available_balance).toBe('1234.500000')
  })

  it('returns zero balance when there are no movements', async () => {
    vi.mocked(calculateAvailableBalance).mockResolvedValue(new Decimal('0'))

    const result = await useCase.execute('user-1')

    expect(result.available_balance).toBe('0.000000')
  })

  it('calls calculateAvailableBalance with the correct userId and db', async () => {
    vi.mocked(calculateAvailableBalance).mockResolvedValue(new Decimal('0'))

    await useCase.execute('user-abc')

    expect(calculateAvailableBalance).toHaveBeenCalledWith(mockDb, 'user-abc')
  })

  it('preserves full decimal precision', async () => {
    vi.mocked(calculateAvailableBalance).mockResolvedValue(new Decimal('999.123456'))

    const result = await useCase.execute('user-1')

    expect(result.available_balance).toBe('999.123456')
  })
})
