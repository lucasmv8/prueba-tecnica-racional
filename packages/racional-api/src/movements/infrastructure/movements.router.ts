import { Router } from 'express'

import { PrismaPortfolioRepository } from '../../portfolios/infrastructure/prisma-portfolio.repository'
import { authMiddleware } from '../../shared/infrastructure/http/auth.middleware'
import { prisma } from '../../shared/infrastructure/prisma/prisma-client'
import { GetRecentMovementsUseCase } from '../application/get-recent-movements/get-recent-movements.use-case'
import { GetUserMovementsUseCase } from '../application/get-user-movements/get-user-movements.use-case'

const portfolioRepo = new PrismaPortfolioRepository(prisma)
const getRecentMovements = new GetRecentMovementsUseCase(portfolioRepo, prisma)
const getUserMovements = new GetUserMovementsUseCase(prisma)

// Sub-router for portfolio-scoped movements: /portfolios/:portfolioId/movements
const portfolioMovementsRouter = Router({ mergeParams: true })

/**
 * @openapi
 * /portfolios/{portfolioId}/movements:
 *   get:
 *     summary: Get movements (orders) for a specific portfolio
 *     tags: [Movements]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: portfolioId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *       - in: query
 *         name: cursor
 *         description: ISO 8601 date from the last item of the previous page
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: Paginated list of movements sorted by date descending
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Movement'
 *                 next_cursor:
 *                   type: string
 *                   nullable: true
 */
portfolioMovementsRouter.get('/', authMiddleware, async (req, res, next) => {
  try {
    const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : undefined
    const cursor = req.query.cursor ? String(req.query.cursor) : undefined
    const result = await getRecentMovements.execute(req.user.id, req.params.portfolioId, {
      limit,
      cursor,
    })
    res.json(result)
  } catch (err) {
    next(err)
  }
})

// Top-level router for user-scoped movements: /movements
const userMovementsRouter = Router()

/**
 * @openapi
 * /movements:
 *   get:
 *     summary: Get all movements for the current user (deposits, withdrawals, orders across all portfolios)
 *     tags: [Movements]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *       - in: query
 *         name: cursor
 *         description: ISO 8601 date from the last item of the previous page
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: Paginated list of all user movements sorted by date descending
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Movement'
 *                 next_cursor:
 *                   type: string
 *                   nullable: true
 */
const VALID_KINDS = new Set(['DEPOSIT', 'WITHDRAWAL', 'BUY', 'SELL'])

userMovementsRouter.get('/', authMiddleware, async (req, res, next) => {
  try {
    const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : undefined
    const cursor = req.query.cursor ? String(req.query.cursor) : undefined
    const rawKind = req.query.kind ? String(req.query.kind).toUpperCase() : undefined
    const kind =
      rawKind && VALID_KINDS.has(rawKind)
        ? (rawKind as 'DEPOSIT' | 'WITHDRAWAL' | 'BUY' | 'SELL')
        : undefined
    const result = await getUserMovements.execute(req.user.id, { limit, cursor, kind })
    res.json(result)
  } catch (err) {
    next(err)
  }
})

export { portfolioMovementsRouter as movementsRouter, userMovementsRouter }
