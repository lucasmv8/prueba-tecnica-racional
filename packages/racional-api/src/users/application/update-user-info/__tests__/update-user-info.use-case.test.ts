import { describe, it, expect, vi, beforeEach } from 'vitest'

import { UpdateUserInfoUseCase } from '../update-user-info.use-case'
import { NotFoundError } from '../../../../shared/domain/errors/not-found.error'
import type { IUserRepository } from '../../../domain/user.repository'

const mockUser = {
  id: 'user-1',
  full_name: 'John Doe',
  phone: null,
  created_at: new Date(),
  updated_at: new Date(),
}

function createMockUserRepo(): IUserRepository {
  return {
    findById: vi.fn(),
    update: vi.fn(),
  }
}

describe('UpdateUserInfoUseCase', () => {
  let repo: IUserRepository
  let useCase: UpdateUserInfoUseCase

  beforeEach(() => {
    repo = createMockUserRepo()
    useCase = new UpdateUserInfoUseCase(repo)
  })

  it('updates and returns the user', async () => {
    vi.mocked(repo.findById).mockResolvedValue(mockUser)
    const updated = { ...mockUser, full_name: 'Jane Doe' }
    vi.mocked(repo.update).mockResolvedValue(updated)

    const result = await useCase.execute('user-1', { full_name: 'Jane Doe' })

    expect(repo.findById).toHaveBeenCalledWith('user-1')
    expect(repo.update).toHaveBeenCalledWith('user-1', { full_name: 'Jane Doe' })
    expect(result.full_name).toBe('Jane Doe')
  })

  it('passes the full dto to the repository', async () => {
    vi.mocked(repo.findById).mockResolvedValue(mockUser)
    vi.mocked(repo.update).mockResolvedValue({ ...mockUser, phone: '+1234567890' })

    await useCase.execute('user-1', { phone: '+1234567890' })

    expect(repo.update).toHaveBeenCalledWith('user-1', { phone: '+1234567890' })
  })

  it('throws NotFoundError when user does not exist', async () => {
    vi.mocked(repo.findById).mockResolvedValue(null)

    await expect(useCase.execute('nonexistent', {})).rejects.toThrow(NotFoundError)
    expect(repo.update).not.toHaveBeenCalled()
  })
})
