import { NotFoundError } from '../../../shared/domain/errors/not-found.error'
import type { IUserRepository } from '../../domain/user.repository'

import type { UpdateUserInfoDto } from './update-user-info.dto'

export class UpdateUserInfoUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(userId: string, dto: UpdateUserInfoDto) {
    const user = await this.userRepository.findById(userId)
    if (!user) throw new NotFoundError('User')

    return this.userRepository.update(userId, dto)
  }
}
