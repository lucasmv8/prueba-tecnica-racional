import type { IPortfolioRepository } from '../../domain/portfolio.repository'

import type { CreatePortfolioDto } from './create-portfolio.dto'

export class CreatePortfolioUseCase {
  constructor(private readonly portfolioRepository: IPortfolioRepository) {}

  async execute(userId: string, dto: CreatePortfolioDto) {
    return this.portfolioRepository.create({ ...dto, user_id: userId })
  }
}
