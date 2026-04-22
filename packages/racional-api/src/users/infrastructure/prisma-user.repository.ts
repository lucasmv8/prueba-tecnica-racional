import type { PrismaClient } from '@prisma/client'

import type { UpdateUserInfoProps, User } from '../domain/user.entity'
import type { IUserRepository } from '../domain/user.repository'

export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly db: PrismaClient) {}

  async findById(id: string): Promise<User | null> {
    return this.db.user.findUnique({ where: { id } })
  }

  async update(id: string, props: UpdateUserInfoProps): Promise<User> {
    return this.db.user.update({ where: { id }, data: props })
  }
}
