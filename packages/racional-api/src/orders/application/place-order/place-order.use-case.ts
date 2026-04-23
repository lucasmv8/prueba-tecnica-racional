import Decimal from 'decimal.js'
import type { Prisma, PrismaClient } from '@prisma/client'

import { BusinessError } from '../../../shared/domain/errors/business.error'
import { NotFoundError } from '../../../shared/domain/errors/not-found.error'
import { UnauthorizedError } from '../../../shared/domain/errors/unauthorized.error'
import { calculateAvailableBalance } from '../../../shared/domain/calculate-available-balance'
import type { IPortfolioRepository } from '../../../portfolios/domain/portfolio.repository'
import type { Order } from '../../domain/order.entity'

import type { PlaceOrderDto } from './place-order.dto'

export class PlaceOrderUseCase {
  constructor(
    private readonly portfolioRepository: IPortfolioRepository,
    private readonly db: PrismaClient,
  ) {}

  async execute(userId: string, portfolioId: string, dto: PlaceOrderDto): Promise<Order> {
    const portfolio = await this.portfolioRepository.findById(portfolioId)
    if (!portfolio) throw new NotFoundError('Portafolio')
    if (portfolio.user_id !== userId) throw new UnauthorizedError('Acceso denegado')

    const qty = new Decimal(dto.quantity)
    const price = new Decimal(dto.price_per_unit)

    if (qty.lessThanOrEqualTo(0)) throw new BusinessError('La cantidad debe ser mayor a cero')
    if (price.lessThanOrEqualTo(0)) throw new BusinessError('El precio debe ser mayor a cero')

    const totalAmount = qty.mul(price)

    if (dto.type === 'BUY') {
      const balance = await calculateAvailableBalance(this.db, userId)
      if (balance.lessThan(totalAmount)) {
        throw new BusinessError(
          `Saldo insuficiente: disponible $${balance.toFixed(2)}, requerido $${totalAmount.toFixed(2)}`,
        )
      }
    }

    const result = await this.db.$transaction(async (tx: Prisma.TransactionClient) => {
      // Upsert stock by ticker
      const stock = await tx.stock.upsert({
        where: { ticker: dto.ticker },
        update: {},
        create: { ticker: dto.ticker, name: dto.ticker, currency: portfolio.currency },
      })

      // Insert order
      const order = await tx.order.create({
        data: {
          portfolio_id: portfolioId,
          stock_id: stock.id,
          type: dto.type,
          quantity: qty.toFixed(6),
          price_per_unit: price.toFixed(6),
          total_amount: totalAmount.toFixed(6),
          date: new Date(dto.date),
        },
      })

      // Update PortfolioHolding atomically
      const existing = await tx.portfolioHolding.findUnique({
        where: { portfolio_id_stock_id: { portfolio_id: portfolioId, stock_id: stock.id } },
      })

      if (dto.type === 'BUY') {
        if (existing) {
          const prevQty = new Decimal(existing.quantity.toString())
          const prevAvg = new Decimal(existing.average_cost.toString())
          const newQty = prevQty.plus(qty)
          const newAvgCost = prevAvg.mul(prevQty).plus(price.mul(qty)).div(newQty)

          await tx.portfolioHolding.update({
            where: { portfolio_id_stock_id: { portfolio_id: portfolioId, stock_id: stock.id } },
            data: {
              quantity: newQty.toFixed(6),
              average_cost: newAvgCost.toFixed(6),
            },
          })
        } else {
          await tx.portfolioHolding.create({
            data: {
              portfolio_id: portfolioId,
              stock_id: stock.id,
              quantity: qty.toFixed(6),
              average_cost: price.toFixed(6),
            },
          })
        }
      } else {
        // SELL
        if (!existing) throw new BusinessError(`No tienes posiciones en ${dto.ticker}`)

        const heldQty = new Decimal(existing.quantity.toString())
        if (qty.greaterThan(heldQty)) {
          throw new BusinessError(
            `Posición insuficiente: intentas vender ${qty.toString()} pero solo tienes ${heldQty.toString()} disponibles`,
          )
        }

        const newQty = heldQty.minus(qty)

        if (newQty.isZero()) {
          // Clean up empty holdings instead of leaving a zero-quantity row
          await tx.portfolioHolding.delete({
            where: { portfolio_id_stock_id: { portfolio_id: portfolioId, stock_id: stock.id } },
          })
        } else {
          await tx.portfolioHolding.update({
            where: { portfolio_id_stock_id: { portfolio_id: portfolioId, stock_id: stock.id } },
            data: { quantity: newQty.toFixed(6) },
          })
        }
      }

      return { order, ticker: stock.ticker }
    })

    return {
      ...result.order,
      quantity: result.order.quantity.toString(),
      price_per_unit: result.order.price_per_unit.toString(),
      total_amount: result.order.total_amount.toString(),
      ticker: result.ticker,
    }
  }
}
