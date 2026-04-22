import { Router } from 'express'

import { authMiddleware } from '../../shared/infrastructure/http/auth.middleware'
import { FinnhubClient } from '../../shared/infrastructure/external/finnhub.client'
import { prisma } from '../../shared/infrastructure/prisma/prisma-client'
import { createPortfolioSchema } from '../application/create-portfolio/create-portfolio.dto'
import { CreatePortfolioUseCase } from '../application/create-portfolio/create-portfolio.use-case'
import { GetPortfolioTotalUseCase } from '../application/get-portfolio-total/get-portfolio-total.use-case'
import { updatePortfolioSchema } from '../application/update-portfolio/update-portfolio.dto'
import { UpdatePortfolioUseCase } from '../application/update-portfolio/update-portfolio.use-case'

import { PrismaPortfolioRepository } from './prisma-portfolio.repository'

const router = Router()
const repo = new PrismaPortfolioRepository(prisma)
const priceProvider = new FinnhubClient(process.env.FINNHUB_API_KEY!)

const createPortfolio = new CreatePortfolioUseCase(repo)
const updatePortfolio = new UpdatePortfolioUseCase(repo)
const getPortfolioTotal = new GetPortfolioTotalUseCase(repo, priceProvider, prisma)

/**
 * @openapi
 * /portfolios:
 *   get:
 *     summary: List all portfolios of the authenticated user
 *     tags: [Portfolios]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Array of portfolios
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Portfolio'
 */
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const portfolios = await repo.findByUserId(req.user.id)
    res.json(portfolios)
  } catch (err) {
    next(err)
  }
})

/**
 * @openapi
 * /portfolios:
 *   post:
 *     summary: Create a new portfolio
 *     tags: [Portfolios]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Mi portafolio principal"
 *               description:
 *                 type: string
 *               currency:
 *                 type: string
 *                 default: USD
 *     responses:
 *       201:
 *         description: Created portfolio
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Portfolio'
 */
router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const dto = createPortfolioSchema.parse(req.body)
    const portfolio = await createPortfolio.execute(req.user.id, dto)
    res.status(201).json(portfolio)
  } catch (err) {
    next(err)
  }
})

/**
 * @openapi
 * /portfolios/{id}:
 *   patch:
 *     summary: Update portfolio information
 *     tags: [Portfolios]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *                 nullable: true
 *               currency:
 *                 type: string
 *     responses:
 *       200:
 *         description: Updated portfolio
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Portfolio'
 *       404:
 *         description: Portfolio not found
 */
router.patch('/:id', authMiddleware, async (req, res, next) => {
  try {
    const dto = updatePortfolioSchema.parse(req.body)
    const portfolio = await updatePortfolio.execute(req.user.id, req.params.id, dto)
    res.json(portfolio)
  } catch (err) {
    next(err)
  }
})

/**
 * @openapi
 * /portfolios/{id}/total:
 *   get:
 *     summary: Get portfolio total value with live stock prices from Finnhub
 *     tags: [Portfolios]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Portfolio total with per-holding breakdown
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 portfolio_id:
 *                   type: string
 *                 currency:
 *                   type: string
 *                 total_value:
 *                   type: string
 *                   description: Decimal as string
 *                 total_cost:
 *                   type: string
 *                 total_pnl:
 *                   type: string
 *                 total_pnl_pct:
 *                   type: string
 *                 holdings:
 *                   type: array
 *                   items:
 *                     type: object
 *                 calculated_at:
 *                   type: string
 *                   format: date-time
 */
router.get('/:id/total', authMiddleware, async (req, res, next) => {
  try {
    const result = await getPortfolioTotal.execute(req.user.id, req.params.id)
    res.json(result)
  } catch (err) {
    next(err)
  }
})

export { router as portfoliosRouter }
