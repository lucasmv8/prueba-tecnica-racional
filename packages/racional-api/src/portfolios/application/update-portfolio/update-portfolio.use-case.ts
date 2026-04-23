import { NotFoundError } from '../../../shared/domain/errors/not-found.error'
import { UnauthorizedError } from '../../../shared/domain/errors/unauthorized.error'
import type { IPortfolioRepository } from '../../domain/portfolio.repository'

import type { UpdatePortfolioDto } from './update-portfolio.dto'

export class UpdatePortfolioUseCase {
  constructor(private readonly portfolioRepository: IPortfolioRepository) {}

  async execute(userId: string, portfolioId: string, dto: UpdatePortfolioDto) {
    const portfolio = await this.portfolioRepository.findById(portfolioId)
    if (!portfolio) throw new NotFoundError('Portafolio')
    if (portfolio.user_id !== userId) throw new UnauthorizedError('Acceso denegado')

    return this.portfolioRepository.update(portfolioId, dto)
  }
}
