import type { CreatePortfolioProps, Portfolio, UpdatePortfolioProps } from './portfolio.entity'

export interface PortfolioHoldingWithStock {
  id: string
  portfolio_id: string
  stock_id: string
  quantity: string
  average_cost: string
  stock: { ticker: string; name: string; currency: string }
}

export interface IPortfolioRepository {
  findById(id: string): Promise<Portfolio | null>
  findByUserId(userId: string): Promise<Portfolio[]>
  create(props: CreatePortfolioProps): Promise<Portfolio>
  update(id: string, props: UpdatePortfolioProps): Promise<Portfolio>
  findHoldingsByPortfolioId(portfolioId: string): Promise<PortfolioHoldingWithStock[]>
}
