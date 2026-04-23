import 'dotenv/config'

import { PrismaClient } from '@prisma/client'
import Decimal from 'decimal.js'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Demo user (must match a real Supabase auth.users entry)
  const USER_ID = process.env.SEED_USER_ID ?? 'demo-user-id-replace-me'

  const user = await prisma.user.upsert({
    where: { id: USER_ID },
    update: {},
    create: { id: USER_ID, full_name: 'Demo User', phone: '+56912345678', email: 'demo@racional.com' },
  })
  console.log(`✓ User: ${user.full_name}`)

  const portfolio = await prisma.portfolio.upsert({
    where: { id: 'seed-portfolio-id' },
    update: {},
    create: {
      id: 'seed-portfolio-id',
      user_id: USER_ID,
      name: 'Mi portafolio',
      description: 'Portafolio de demostración',
      currency: 'USD',
    },
  })
  console.log(`✓ Portfolio: ${portfolio.name}`)

  // Seed stocks
  const [aapl, msft, googl] = await Promise.all([
    prisma.stock.upsert({
      where: { ticker: 'AAPL' },
      update: {},
      create: { ticker: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ', currency: 'USD' },
    }),
    prisma.stock.upsert({
      where: { ticker: 'MSFT' },
      update: {},
      create: { ticker: 'MSFT', name: 'Microsoft Corp.', exchange: 'NASDAQ', currency: 'USD' },
    }),
    prisma.stock.upsert({
      where: { ticker: 'GOOGL' },
      update: {},
      create: { ticker: 'GOOGL', name: 'Alphabet Inc.', exchange: 'NASDAQ', currency: 'USD' },
    }),
  ])
  console.log('✓ Stocks: AAPL, MSFT, GOOGL')

  // Seed transactions (linked to user wallet, not portfolio)
  await prisma.transaction.createMany({
    data: [
      {
        user_id: USER_ID,
        type: 'DEPOSIT',
        amount: new Decimal('10000').toFixed(6),
        date: new Date('2024-01-10T10:00:00Z'),
        description: 'Depósito inicial',
      },
      {
        user_id: USER_ID,
        type: 'DEPOSIT',
        amount: new Decimal('5000').toFixed(6),
        date: new Date('2024-02-15T10:00:00Z'),
        description: 'Segundo depósito',
      },
      {
        user_id: USER_ID,
        type: 'WITHDRAWAL',
        amount: new Decimal('1000').toFixed(6),
        date: new Date('2024-03-01T10:00:00Z'),
        description: 'Retiro parcial',
      },
    ],
    skipDuplicates: true,
  })
  console.log('✓ Transactions seeded')

  // Seed orders and holdings
  const aaplQty = new Decimal('10')
  const aaplPrice = new Decimal('175.50')
  const msftQty = new Decimal('5')
  const msftPrice = new Decimal('380.00')
  const googlQty = new Decimal('2')
  const googlPrice = new Decimal('140.00')

  await prisma.order.createMany({
    data: [
      {
        portfolio_id: portfolio.id,
        stock_id: aapl.id,
        type: 'BUY',
        quantity: aaplQty.toFixed(6),
        price_per_unit: aaplPrice.toFixed(6),
        total_amount: aaplQty.mul(aaplPrice).toFixed(6),
        date: new Date('2024-01-15T10:00:00Z'),
      },
      {
        portfolio_id: portfolio.id,
        stock_id: msft.id,
        type: 'BUY',
        quantity: msftQty.toFixed(6),
        price_per_unit: msftPrice.toFixed(6),
        total_amount: msftQty.mul(msftPrice).toFixed(6),
        date: new Date('2024-01-20T10:00:00Z'),
      },
      {
        portfolio_id: portfolio.id,
        stock_id: googl.id,
        type: 'BUY',
        quantity: googlQty.toFixed(6),
        price_per_unit: googlPrice.toFixed(6),
        total_amount: googlQty.mul(googlPrice).toFixed(6),
        date: new Date('2024-02-01T10:00:00Z'),
      },
    ],
    skipDuplicates: true,
  })

  // Upsert holdings
  await Promise.all([
    prisma.portfolioHolding.upsert({
      where: { portfolio_id_stock_id: { portfolio_id: portfolio.id, stock_id: aapl.id } },
      update: {},
      create: {
        portfolio_id: portfolio.id,
        stock_id: aapl.id,
        quantity: aaplQty.toFixed(6),
        average_cost: aaplPrice.toFixed(6),
      },
    }),
    prisma.portfolioHolding.upsert({
      where: { portfolio_id_stock_id: { portfolio_id: portfolio.id, stock_id: msft.id } },
      update: {},
      create: {
        portfolio_id: portfolio.id,
        stock_id: msft.id,
        quantity: msftQty.toFixed(6),
        average_cost: msftPrice.toFixed(6),
      },
    }),
    prisma.portfolioHolding.upsert({
      where: { portfolio_id_stock_id: { portfolio_id: portfolio.id, stock_id: googl.id } },
      update: {},
      create: {
        portfolio_id: portfolio.id,
        stock_id: googl.id,
        quantity: googlQty.toFixed(6),
        average_cost: googlPrice.toFixed(6),
      },
    }),
  ])

  console.log('✓ Orders and holdings seeded')
  console.log('Done!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
