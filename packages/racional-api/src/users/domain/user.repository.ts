import type { UpdateUserInfoProps, User } from './user.entity'

export interface IUserRepository {
  findById(id: string): Promise<User | null>
  update(id: string, props: UpdateUserInfoProps): Promise<User>
}
