import cors from 'cors'
import express from 'express'
import swaggerUi from 'swagger-ui-express'

import { movementsRouter, userMovementsRouter } from './movements/infrastructure/movements.router'
import { ordersRouter } from './orders/infrastructure/orders.router'
import { portfoliosRouter } from './portfolios/infrastructure/portfolios.router'
import { errorHandlerMiddleware } from './shared/infrastructure/http/error-handler.middleware'
import { swaggerSpec } from './shared/infrastructure/http/swagger'
import { stocksRouter } from './stocks/infrastructure/stocks.router'
import { transactionsRouter } from './transactions/infrastructure/transactions.router'
import { usersRouter } from './users/infrastructure/users.router'
import { watchlistRouter } from './watchlist/infrastructure/watchlist.router'

export function createApp() {
  const app = express()

  const allowedOrigins = (process.env.CORS_ORIGIN ?? '*').split(',').map((o) => o.trim())

  app.use(
    cors({
      origin: allowedOrigins.includes('*') ? '*' : allowedOrigins,
      credentials: true,
    }),
  )
  app.use(express.json())

  // Swagger UI
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))
  app.get('/api/docs.json', (_req, res) => res.json(swaggerSpec))

  // Health check
  app.get('/health', (_req, res) => res.json({ status: 'ok' }))

  // Domain routers
  app.use('/api/users', usersRouter)
  app.use('/api/portfolios', portfoliosRouter)
  app.use('/api/portfolios/:portfolioId/orders', ordersRouter)
  app.use('/api/portfolios/:portfolioId/movements', movementsRouter)
  app.use('/api/transactions', transactionsRouter)
  app.use('/api/movements', userMovementsRouter)
  app.use('/api/stocks', stocksRouter)
  app.use('/api/watchlist', watchlistRouter)

  // Global error handler (must be last)
  app.use(errorHandlerMiddleware)

  return app
}
