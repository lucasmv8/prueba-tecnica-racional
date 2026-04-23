import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { PrismaClient } from '@prisma/client'

import { GetUserMovementsUseCase } from '../get-user-movements.use-case'

function createMockDb() {
  return {
    transaction: { findMany: vi.fn() },
    order: { findMany: vi.fn() },
  }
}

const d1 = new Date('2024-01-15T12:00:00Z')
const d2 = new Date('2024-01-14T12:00:00Z')

const mockTx = {
  id: 'tx-1',
  type: 'DEPOSIT',
  amount: { toString: () => '1000' },
  date: d1,
  description: 'Salary',
  created_at: d1,
}

const mockOrder = {
  id: 'order-1',
  type: 'BUY',
  total_amount: { toString: () => '500' },
  quantity: { toString: () => '5' },
  date: d2,
  description: null,
  created_at: d2,
  stock: { ticker: 'AAPL' },
}

describe('GetUserMovementsUseCase', () => {
  let db: ReturnType<typeof createMockDb>
  let useCase: GetUserMovementsUseCase

  beforeEach(() => {
    db = createMockDb()
    useCase = new GetUserMovementsUseCase(db as unknown as PrismaClient)
    db.transaction.findMany.mockResolvedValue([mockTx])
    db.order.findMany.mockResolvedValue([mockOrder])
  })

  it('combines transactions and orders sorted by date descending', async () => {
    const result = await useCase.execute('user-1', {})

    expect(result.items).toHaveLength(2)
    expect(result.items[0].kind).toBe('DEPOSIT') // newer (d1)
    expect(result.items[1].kind).toBe('BUY') // older (d2)
  })

  it('maps transactions with null ticker and quantity', async () => {
    const result = await useCase.execute('user-1', {})
    const item = result.items[0]

    expect(item.id).toBe('tx-1')
    expect(item.ticker).toBeNull()
    expect(item.quantity).toBeNull()
    expect(item.amount).toBe('1000')
    expect(item.description).toBe('Salary')
  })

  it('maps orders with ticker and quantity', async () => {
    const result = await useCase.execute('user-1', {})
    const item = result.items[1]

    expect(item.id).toBe('order-1')
    expect(item.ticker).toBe('AAPL')
    expect(item.quantity).toBe('5')
    expect(item.amount).toBe('500')
    expect(item.description).toBeNull()
  })

  it('returns next_cursor equal to last item date when page is full', async () => {
    const orders = Array.from({ length: 3 }, (_, i) => ({
      ...mockOrder,
      id: `order-${i}`,
      date: new Date(`2024-01-${15 - i}T00:00:00Z`),
    }))
    db.transaction.findMany.mockResolvedValue([])
    db.order.findMany.mockResolvedValue(orders)

    const result = await useCase.execute('user-1', { limit: 3 })

    expect(result.next_cursor).toBe(orders[2].date.toISOString())
  })

  it('returns null next_cursor when page is not full', async () => {
    const result = await useCase.execute('user-1', { limit: 20 })

    expect(result.next_cursor).toBeNull()
  })

  it('clamps limit to 100', async () => {
    await useCase.execute('user-1', { limit: 999 })

    expect(db.transaction.findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 100 }))
    expect(db.order.findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 100 }))
  })

  it('passes cursor as a date lt filter', async () => {
    const cursor = '2024-01-10T00:00:00.000Z'
    await useCase.execute('user-1', { cursor })

    expect(db.transaction.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ date: { lt: new Date(cursor) } }),
      }),
    )
  })

  it('returns empty list with null cursor when no movements exist', async () => {
    db.transaction.findMany.mockResolvedValue([])
    db.order.findMany.mockResolvedValue([])

    const result = await useCase.execute('user-1', {})

    expect(result.items).toHaveLength(0)
    expect(result.next_cursor).toBeNull()
  })

  describe('kind filter', () => {
    it('only queries transactions when kind is DEPOSIT', async () => {
      await useCase.execute('user-1', { kind: 'DEPOSIT' })

      expect(db.transaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ type: 'DEPOSIT' }) }),
      )
      expect(db.order.findMany).not.toHaveBeenCalled()
    })

    it('only queries transactions when kind is WITHDRAWAL', async () => {
      await useCase.execute('user-1', { kind: 'WITHDRAWAL' })

      expect(db.transaction.findMany).toHaveBeenCalled()
      expect(db.order.findMany).not.toHaveBeenCalled()
    })

    it('only queries orders when kind is BUY', async () => {
      await useCase.execute('user-1', { kind: 'BUY' })

      expect(db.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ type: 'BUY' }) }),
      )
      expect(db.transaction.findMany).not.toHaveBeenCalled()
    })

    it('only queries orders when kind is SELL', async () => {
      await useCase.execute('user-1', { kind: 'SELL' })

      expect(db.order.findMany).toHaveBeenCalled()
      expect(db.transaction.findMany).not.toHaveBeenCalled()
    })

    it('queries both when kind is not set', async () => {
      await useCase.execute('user-1', {})

      expect(db.transaction.findMany).toHaveBeenCalled()
      expect(db.order.findMany).toHaveBeenCalled()
    })
  })
})
