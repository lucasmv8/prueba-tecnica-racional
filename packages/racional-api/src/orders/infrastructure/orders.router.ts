import { Router } from 'express'

import { PrismaPortfolioRepository } from '../../portfolios/infrastructure/prisma-portfolio.repository'
import { authMiddleware } from '../../shared/infrastructure/http/auth.middleware'
import { prisma } from '../../shared/infrastructure/prisma/prisma-client'
import { placeOrderSchema } from '../application/place-order/place-order.dto'
import { PlaceOrderUseCase } from '../application/place-order/place-order.use-case'

const router = Router({ mergeParams: true })
const portfolioRepo = new PrismaPortfolioRepository(prisma)
const placeOrder = new PlaceOrderUseCase(portfolioRepo, prisma)

/**
 * @openapi
 * /portfolios/{portfolioId}/orders:
 *   post:
 *     summary: Place a buy or sell order for a stock
 *     tags: [Orders]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: portfolioId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [type, ticker, quantity, price_per_unit, date]
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [BUY, SELL]
 *               ticker:
 *                 type: string
 *                 example: "AAPL"
 *               quantity:
 *                 type: string
 *                 description: Decimal as string
 *                 example: "10.000000"
 *               price_per_unit:
 *                 type: string
 *                 description: Decimal as string
 *                 example: "175.500000"
 *               date:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Order placed successfully. Holdings updated atomically.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       400:
 *         description: Business error (e.g. insufficient holdings for SELL)
 *       404:
 *         description: Portfolio not found
 */
router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const dto = placeOrderSchema.parse(req.body)
    const order = await placeOrder.execute(req.user.id, req.params.portfolioId, dto)
    res.status(201).json(order)
  } catch (err) {
    next(err)
  }
})

export { router as ordersRouter }
