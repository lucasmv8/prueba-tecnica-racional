import { Router } from 'express'

import { FinnhubClient } from '../../shared/infrastructure/external/finnhub.client'
import { authMiddleware } from '../../shared/infrastructure/http/auth.middleware'
import { prisma } from '../../shared/infrastructure/prisma/prisma-client'
import { AddWatchlistItemUseCase } from '../application/add-watchlist-item/add-watchlist-item.use-case'
import { addWatchlistItemSchema } from '../application/add-watchlist-item/add-watchlist-item.dto'
import { GetWatchlistUseCase } from '../application/get-watchlist/get-watchlist.use-case'
import { RemoveWatchlistItemUseCase } from '../application/remove-watchlist-item/remove-watchlist-item.use-case'

import { PrismaWatchlistRepository } from './prisma-watchlist.repository'

const repo = new PrismaWatchlistRepository(prisma)
const priceProvider = new FinnhubClient(process.env.FINNHUB_API_KEY!)

const getWatchlist = new GetWatchlistUseCase(repo, priceProvider)
const addWatchlistItem = new AddWatchlistItemUseCase(repo)
const removeWatchlistItem = new RemoveWatchlistItemUseCase(repo)

const router = Router()

router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const result = await getWatchlist.execute(req.user.id)
    res.json(result)
  } catch (err) {
    next(err)
  }
})

router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const dto = addWatchlistItemSchema.parse(req.body)
    const result = await addWatchlistItem.execute(req.user.id, dto)
    res.status(201).json(result)
  } catch (err) {
    next(err)
  }
})

router.delete('/:ticker', authMiddleware, async (req, res, next) => {
  try {
    await removeWatchlistItem.execute(req.user.id, req.params.ticker.toUpperCase())
    res.status(204).send()
  } catch (err) {
    next(err)
  }
})

export { router as watchlistRouter }
