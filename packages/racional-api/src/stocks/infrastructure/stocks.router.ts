import { Router } from 'express'

import { authMiddleware } from '../../shared/infrastructure/http/auth.middleware'
import { FinnhubClient } from '../../shared/infrastructure/external/finnhub.client'

const router = Router()
const priceProvider = new FinnhubClient(process.env.FINNHUB_API_KEY!)

const POPULAR_TICKERS: Array<{ ticker: string; name: string }> = [
  { ticker: 'AAPL', name: 'Apple Inc.' },
  { ticker: 'MSFT', name: 'Microsoft Corp.' },
  { ticker: 'GOOGL', name: 'Alphabet Inc.' },
  { ticker: 'AMZN', name: 'Amazon.com Inc.' },
  { ticker: 'NVDA', name: 'NVIDIA Corp.' },
  { ticker: 'META', name: 'Meta Platforms Inc.' },
  { ticker: 'TSLA', name: 'Tesla Inc.' },
  { ticker: 'BRK.B', name: 'Berkshire Hathaway B' },
  { ticker: 'JPM', name: 'JPMorgan Chase & Co.' },
  { ticker: 'V', name: 'Visa Inc.' },
  { ticker: 'JNJ', name: 'Johnson & Johnson' },
  { ticker: 'WMT', name: 'Walmart Inc.' },
  { ticker: 'MA', name: 'Mastercard Inc.' },
  { ticker: 'PG', name: 'Procter & Gamble Co.' },
  { ticker: 'HD', name: 'Home Depot Inc.' },
]

/**
 * @openapi
 * /stocks/popular:
 *   get:
 *     summary: Get a curated list of popular stocks with current prices
 *     tags: [Stocks]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of popular stocks with current market price
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   ticker:
 *                     type: string
 *                   name:
 *                     type: string
 *                   current_price:
 *                     type: string
 *                     nullable: true
 */
router.get('/popular', authMiddleware, async (req, res, next) => {
  try {
    const priceResults = await Promise.allSettled(
      POPULAR_TICKERS.map((s) => priceProvider.getCurrentPrice(s.ticker)),
    )

    const stocks = POPULAR_TICKERS.map((s, i) => ({
      ticker: s.ticker,
      name: s.name,
      current_price:
        priceResults[i].status === 'fulfilled'
          ? String((priceResults[i] as PromiseFulfilledResult<number>).value)
          : null,
    }))

    res.json(stocks)
  } catch (err) {
    next(err)
  }
})

/**
 * @openapi
 * /stocks/search:
 *   get:
 *     summary: Search for stocks by symbol or name
 *     tags: [Stocks]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           example: "AAPL"
 *     responses:
 *       200:
 *         description: List of matching stocks (max 10)
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   ticker:
 *                     type: string
 *                   name:
 *                     type: string
 *                   exchange:
 *                     type: string
 */
router.get('/search', authMiddleware, async (req, res, next) => {
  try {
    const q = String(req.query.q ?? '').trim()
    if (!q) {
      res
        .status(422)
        .json({ error: { code: 'VALIDATION_ERROR', message: 'Query param q is required' } })
      return
    }
    const results = await priceProvider.searchSymbols(q)
    res.json(results)
  } catch (err) {
    next(err)
  }
})

export { router as stocksRouter }
