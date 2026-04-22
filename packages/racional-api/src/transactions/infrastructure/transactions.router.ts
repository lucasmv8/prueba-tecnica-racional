import { Router } from 'express'

import { authMiddleware } from '../../shared/infrastructure/http/auth.middleware'
import { prisma } from '../../shared/infrastructure/prisma/prisma-client'
import { registerTransactionSchema } from '../application/register-transaction/register-transaction.dto'
import { RegisterTransactionUseCase } from '../application/register-transaction/register-transaction.use-case'

import { PrismaTransactionRepository } from './prisma-transaction.repository'

const router = Router()
const txRepo = new PrismaTransactionRepository(prisma)
const registerTransaction = new RegisterTransactionUseCase(txRepo, prisma)

/**
 * @openapi
 * /transactions:
 *   post:
 *     summary: Register a deposit or withdrawal to the user's wallet
 *     description: Deposits and withdrawals affect the user's global available balance, not a specific portfolio.
 *     tags: [Transactions]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [type, amount, date]
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [DEPOSIT, WITHDRAWAL]
 *               amount:
 *                 type: string
 *                 description: Decimal as string (e.g. "1000.50")
 *                 example: "1000.500000"
 *               date:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-01-15T10:00:00Z"
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Transaction registered
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Transaction'
 *       400:
 *         description: Insufficient balance or amount <= 0
 */
router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const dto = registerTransactionSchema.parse(req.body)
    const transaction = await registerTransaction.execute(req.user.id, dto)
    res.status(201).json(transaction)
  } catch (err) {
    next(err)
  }
})

export { router as transactionsRouter }
