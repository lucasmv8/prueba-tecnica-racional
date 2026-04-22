import 'dotenv/config'

import { createApp } from './app'
import { prisma } from './shared/infrastructure/prisma/prisma-client'

const PORT = parseInt(process.env.PORT ?? '3000', 10)

async function bootstrap() {
  await prisma.$connect()
  console.log('✓ Database connected')

  const app = createApp()

  app.listen(PORT, () => {
    console.log(`✓ API running on http://localhost:${PORT}`)
    console.log(`✓ Swagger UI at http://localhost:${PORT}/api/docs`)
  })
}

bootstrap().catch((err) => {
  console.error('Failed to start:', err)
  process.exit(1)
})
